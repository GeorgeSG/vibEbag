import { chromium } from "playwright";
import { createInterface } from "readline";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { COOKIE_FILE, CREDENTIALS_FILE } from "./config.js";

const LOGIN_URL = "https://www.ebag.bg/login?next=/";

function loadCredentials() {
  if (!existsSync(CREDENTIALS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CREDENTIALS_FILE, "utf-8"));
  } catch (err) {
    console.warn("Could not parse credentials:", err.message);
    return {};
  }
}

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
}

async function promptPassword(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  process.stdout.write(question);
  process.stdin.setRawMode(true);
  let password = "";
  return new Promise((resolve) => {
    process.stdin.on("data", (char) => {
      char = char.toString();
      if (char === "\r" || char === "\n") {
        process.stdin.setRawMode(false);
        process.stdout.write("\n");
        rl.close();
        resolve(password);
      } else if (char === "\u0003") {
        process.exit();
      } else if (char === "\u007f") {
        password = password.slice(0, -1);
      } else {
        password += char;
      }
    });
  });
}

async function main() {
  console.log("eBag Вход\n");

  const creds = loadCredentials();
  let email = creds.email;
  let password = creds.password;

  if (email && password) {
    console.log(`Намерени данни за вход от data/credentials.json (${email})`);
  } else {
    email = email ?? (await prompt("Имейл: "));
    password = password ?? (await promptPassword("Парола: "));
    writeFileSync(CREDENTIALS_FILE, JSON.stringify({ email, password }, null, 2));
    console.log(`Данните за вход са запазени.`);
  }

  console.log("\nВлизане...");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(LOGIN_URL);

  // Dismiss cookie consent banner if present
  try {
    await page.click("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll", { timeout: 5000 });
  } catch {
    // Banner didn't appear, continue
  }

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"].btn-primary');

  try {
    await page.waitForURL((url) => !url.href.includes("/login"), { timeout: 15000 });
  } catch {
    console.error("Входът не успя — проверете данните си.");
    await browser.close();
    process.exit(1);
  }

  const cookies = await context.cookies();
  writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
  console.log("Бисквитките са запазени. Входът е успешен.");

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
