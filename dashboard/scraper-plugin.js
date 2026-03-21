import { spawn } from "child_process";
import { createReadStream, existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRAPER_DIR = resolve(__dirname, "../scraper");
const DATA_DIR = resolve(__dirname, "../data");
const DATA_FILE = process.env.VITE_USE_SEED
  ? resolve(__dirname, "../data/order-details.dev.json")
  : resolve(__dirname, "../data/order-details.json");
const COOKIE_FILE = resolve(__dirname, "../data/cookies.json");
const CREDENTIALS_FILE = resolve(__dirname, "../data/credentials.json");

function sseJob(res, req, script) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (type, text) => res.write(`data: ${JSON.stringify({ type, text })}\n\n`);

  const child = spawn("node", [script], {
    cwd: SCRAPER_DIR,
    env: { ...process.env, FORCE_COLOR: "0" },
  });

  child.stdout.on("data", (chunk) => send("log", chunk.toString()));
  child.stderr.on("data", (chunk) => send("log", chunk.toString()));

  child.on("close", (code) => {
    send(code === 0 ? "done" : "error",
      code === 0 ? "Готово." : `Процесът завърши с код ${code}`);
    res.end();
  });

  req.on("close", () => child.kill());

  return child;
}

export default function scraperPlugin() {
  let activeJob = null; // null | "login" | "scrape"

  return {
    name: "vite-plugin-scraper",
    configureServer(server) {
      const label = process.env.VITE_USE_SEED ? "seed (order-details.dev.json)" : "prod (order-details.json)";
      server.httpServer?.once("listening", () => {
        console.log(`  \x1b[36m➜\x1b[0m  Data: \x1b[1m${label}\x1b[0m`);
      });

      // Serve order-details.json from ../data/ if present, else fall through to public/
      server.middlewares.use("/data/order-details.json", (req, res, next) => {
        if (!existsSync(DATA_FILE)) return next();
        res.setHeader("Content-Type", "application/json");
        createReadStream(DATA_FILE).pipe(res);
      });

      // GET /api/status — credentials + cookie presence
      server.middlewares.use("/api/status", (req, res) => {
        const hasCredentials = existsSync(CREDENTIALS_FILE);
        const hasCookies = existsSync(COOKIE_FILE);
        let email = null;
        if (hasCredentials) {
          try { email = JSON.parse(readFileSync(CREDENTIALS_FILE, "utf-8")).email; } catch {}
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ hasCredentials, hasCookies, email }));
      });

      // POST /api/credentials — save email + password
      server.middlewares.use("/api/credentials", (req, res) => {
        if (req.method !== "POST") { res.writeHead(405); res.end(); return; }
        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", () => {
          try {
            const { email, password } = JSON.parse(body);
            if (!email || !password) { res.writeHead(400); res.end(JSON.stringify({ error: "Липсващи полета" })); return; }
            if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
            writeFileSync(CREDENTIALS_FILE, JSON.stringify({ email, password }, null, 2));
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Невалидна заявка" }));
          }
        });
      });

      // GET /api/login — SSE: run auth.js
      server.middlewares.use("/api/login", (req, res) => {
        if (activeJob) {
          res.writeHead(409, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Вече работи: ${activeJob}` }));
          return;
        }
        activeJob = "login";
        const child = sseJob(res, req, "auth.js");
        child.on("close", () => { activeJob = null; });
        req.on("close", () => { activeJob = null; });
      });

      // GET /api/scrape — SSE: run fetch-orders.js
      server.middlewares.use("/api/scrape", (req, res) => {
        if (activeJob) {
          res.writeHead(409, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Вече работи: ${activeJob}` }));
          return;
        }
        activeJob = "scrape";
        const child = sseJob(res, req, "fetch-orders.js");
        child.on("close", () => { activeJob = null; });
        req.on("close", () => { activeJob = null; });
      });
    },
  };
}
