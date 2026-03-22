import express from "express";
import { spawn } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { getDashboardData, hasData } from "./queries.js";
import { importFromJson } from "./import.js";
import {
  DATA_DIR, DIST_DIR, DATA_FILE, COOKIE_FILE, CREDENTIALS_FILE, PORT,
} from "./config.js";

let activeJob = null;

function sseJob(res, req, script, { onDone } = {}) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const send = (type, text) =>
    res.write(`data: ${JSON.stringify({ type, text })}\n\n`);

  const child = spawn("node", [script], {
    cwd: import.meta.dirname,
    env: { ...process.env, FORCE_COLOR: "0" },
  });

  child.stdout.on("data", (chunk) => send("log", chunk.toString()));
  child.stderr.on("data", (chunk) => send("log", chunk.toString()));

  child.on("close", (code) => {
    if (code === 0 && onDone) {
      onDone(send);
    } else if (code !== 0) {
      send("error", `Процесът завърши с код ${code}`);
      res.end();
    }
  });

  req.on("close", () => child.kill());

  return child;
}

function guardedSseJob(name, res, req, script, opts = {}) {
  if (activeJob) {
    return res.status(409).json({ error: `Вече работи: ${activeJob}` });
  }
  activeJob = name;
  const child = sseJob(res, req, script, opts);
  const cleanup = () => { activeJob = null; };
  child.on("close", cleanup);
  req.on("close", cleanup);
  return child;
}

// --- Express app ---

const app = express();
app.use(express.json());

app.get("/api/data", (req, res) => {
  if (!hasData()) return res.sendStatus(404);
  res.json(getDashboardData());
});

app.get("/api/status", (req, res) => {
  const hasCredentials = existsSync(CREDENTIALS_FILE);
  const hasCookies = existsSync(COOKIE_FILE);
  let email = null;
  if (hasCredentials) {
    try {
      email = JSON.parse(readFileSync(CREDENTIALS_FILE, "utf-8")).email;
    } catch (err) {
      console.warn("Failed to parse credentials:", err.message);
    }
  }
  res.json({ hasCredentials, hasCookies, email, hasData: hasData() });
});

app.post("/api/credentials", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Липсващи полета" });
  }
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    CREDENTIALS_FILE,
    JSON.stringify({ email, password }, null, 2),
  );
  res.json({ ok: true });
});

app.post("/api/cookies", (req, res) => {
  const { sessionid } = req.body;
  if (!sessionid) {
    return res.status(400).json({ error: "Липсва sessionid" });
  }
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const cookies = [
    {
      name: "sessionid",
      value: sessionid.trim(),
      domain: "www.ebag.bg",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ];
  writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
  res.json({ ok: true });
});

app.get("/api/login", (req, res) => {
  guardedSseJob("login", res, req, "auth.js");
});

app.get("/api/scrape", (req, res) => {
  guardedSseJob("scrape", res, req, "fetch-orders.js", {
    onDone(send) {
      send("log", "\nИмпортиране в базата данни...\n");
      try {
        const result = importFromJson(DATA_FILE);
        send(
          "done",
          `Готово: ${result.orderCount} поръчки, ${result.productCount} продукта, ${result.itemCount} артикула.`,
        );
      } catch (err) {
        send("error", `Грешка при импортиране: ${err.message}`);
      }
      activeJob = null;
      res.end();
    },
  });
});

// --- Static files (production only) ---

if (process.env.NODE_ENV === "production") {
  app.use(express.static(DIST_DIR));

  app.get("/{*splat}", (req, res) => {
    res.sendFile("index.html", { root: DIST_DIR });
  });
}

const server = app.listen(PORT, () => {
  const mode = process.env.NODE_ENV === "production" ? "production" : "dev";
  console.log(`vibEbag server (${mode}) listening on port ${PORT}`);

  // Auto-import if DB is empty but JSON backup exists
  if (!hasData() && existsSync(DATA_FILE)) {
    console.log("Празна база данни — импортиране от order-details.json...");
    const result = importFromJson(DATA_FILE);
    console.log(
      `Импортирани: ${result.orderCount} поръчки, ${result.productCount} продукта, ${result.itemCount} артикула.`,
    );
  }
});
