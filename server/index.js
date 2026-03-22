import express from "express";
import { spawn } from "child_process";
import {
  createReadStream,
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../data");
const DIST_DIR = resolve(__dirname, "../dashboard/dist");

const DATA_FILE = process.env.USE_SEED
  ? resolve(DATA_DIR, "order-details.dev.json")
  : resolve(DATA_DIR, "order-details.json");
const COOKIE_FILE = resolve(DATA_DIR, "cookies.json");
const CREDENTIALS_FILE = resolve(DATA_DIR, "credentials.json");

const PORT = process.env.PORT || 3001;

let activeJob = null;

function sseJob(res, req, script) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const send = (type, text) =>
    res.write(`data: ${JSON.stringify({ type, text })}\n\n`);

  const child = spawn("node", [script], {
    cwd: __dirname,
    env: { ...process.env, FORCE_COLOR: "0" },
  });

  child.stdout.on("data", (chunk) => send("log", chunk.toString()));
  child.stderr.on("data", (chunk) => send("log", chunk.toString()));

  child.on("close", (code) => {
    send(
      code === 0 ? "done" : "error",
      code === 0 ? "Готово." : `Процесът завърши с код ${code}`,
    );
    res.end();
  });

  req.on("close", () => child.kill());

  return child;
}

const app = express();
app.use(express.json());

// --- API routes ---

app.get("/data/order-details.json", (req, res) => {
  if (!existsSync(DATA_FILE)) return res.sendStatus(404);
  res.setHeader("Content-Type", "application/json");
  createReadStream(DATA_FILE).pipe(res);
});

app.get("/api/status", (req, res) => {
  const hasCredentials = existsSync(CREDENTIALS_FILE);
  const hasCookies = existsSync(COOKIE_FILE);
  let email = null;
  if (hasCredentials) {
    try {
      email = JSON.parse(readFileSync(CREDENTIALS_FILE, "utf-8")).email;
    } catch {}
  }
  res.json({ hasCredentials, hasCookies, email });
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

app.get("/api/login", (req, res) => {
  if (activeJob) {
    return res
      .status(409)
      .json({ error: `Вече работи: ${activeJob}` });
  }
  activeJob = "login";
  const child = sseJob(res, req, "auth.js");
  child.on("close", () => (activeJob = null));
  req.on("close", () => (activeJob = null));
});

app.get("/api/scrape", (req, res) => {
  if (activeJob) {
    return res
      .status(409)
      .json({ error: `Вече работи: ${activeJob}` });
  }
  activeJob = "scrape";
  const child = sseJob(res, req, "fetch-orders.js");
  child.on("close", () => (activeJob = null));
  req.on("close", () => (activeJob = null));
});

// --- Static files (production only) ---

if (process.env.NODE_ENV === "production") {
  app.use(express.static(DIST_DIR));

  // SPA fallback
  app.get("/{*splat}", (req, res) => {
    res.sendFile(resolve(DIST_DIR, "index.html"));
  });
}

app.listen(PORT, () => {
  const mode = process.env.NODE_ENV === "production" ? "production" : "dev";
  const data = process.env.USE_SEED
    ? "seed (order-details.dev.json)"
    : "prod (order-details.json)";
  console.log(`vibEbag server (${mode}) listening on port ${PORT}`);
  console.log(`  Data: ${data}`);
});
