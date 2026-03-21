import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COOKIE_FILE = resolve(__dirname, "../data/cookies.json");
const DETAILS_FILE = resolve(__dirname, "../data/order-details.json");

const ORDERS_API = "https://www.ebag.bg/orders/list/json";
const BASE_URL = "https://www.ebag.bg/orders";
const CONCURRENCY = 2;
const DELAY_MS = [500, 1000]; // random delay range between requests

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randomDelay = () => sleep(DELAY_MS[0] + Math.random() * (DELAY_MS[1] - DELAY_MS[0]));

function loadCookieHeader() {
  try {
    const cookies = JSON.parse(readFileSync(COOKIE_FILE, "utf-8"));
    if (!cookies.length) {
      console.error("Cookie file is empty. Run `npm run login` first.");
      process.exit(1);
    }
    return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  } catch {
    console.error("No cookies found. Run `npm run login` first.");
    process.exit(1);
  }
}

async function checkSession(cookieHeader) {
  const url = new URL(ORDERS_API);
  url.searchParams.set("page", "1");
  url.searchParams.set("exclude_additional_order", "true");

  const res = await fetch(url.toString(), {
    headers: { Cookie: cookieHeader, Accept: "application/json" },
    redirect: "manual",
  });

  if (res.status >= 300 && res.status < 400) {
    console.error("Session expired. Run `npm run login` first.");
    process.exit(1);
  }
  if (!res.ok) {
    console.error(`Session check failed: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const data = await res.json();
  if (!Array.isArray(data.results)) {
    console.error("Session expired or unexpected response. Run `npm run login` first.");
    process.exit(1);
  }

  // Return the first page so fetchAllOrders can reuse it instead of re-fetching
  return data;
}

async function fetchAllOrders(cookieHeader, firstPage) {
  console.log("Fetching orders...");
  let page = 1;
  const allOrders = [];

  let data = firstPage;
  while (true) {
    if (!data) {
      const url = new URL(ORDERS_API);
      url.searchParams.set("page", page);
      url.searchParams.set("exclude_additional_order", "true");

      const res = await fetch(url.toString(), {
        headers: { Cookie: cookieHeader, Accept: "application/json" },
      });
      if (!res.ok) {
        console.error(`API request failed: ${res.status} ${res.statusText}`);
        process.exit(1);
      }
      data = await res.json();
    }

    const items = data.results ?? [];
    allOrders.push(...items);
    console.log(`  Page ${page}: ${items.length} orders (total: ${allOrders.length})`);

    if (!data.next) break;
    page++;
    data = null;
    await randomDelay();
  }

  return allOrders;
}

async function fetchDetail(encryptedId, cookieHeader) {
  const url = `${BASE_URL}/${encryptedId}/details/json`;
  const res = await fetch(url, {
    headers: { Cookie: cookieHeader, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status} for order ${encryptedId}`);
  return res.json();
}

async function runWithConcurrency(tasks, limit) {
  const results = [];
  let i = 0;
  async function run() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }
  await Promise.all(Array.from({ length: limit }, run));
  return results;
}

async function main() {
  const cookieHeader = loadCookieHeader();
  const firstPage = await checkSession(cookieHeader);

  const orders = await fetchAllOrders(cookieHeader, firstPage);

  // Load existing details and skip already-fetched orders
  const existing = existsSync(DETAILS_FILE)
    ? JSON.parse(readFileSync(DETAILS_FILE, "utf-8"))
    : [];
  const existingIds = new Set(existing.map((d) => d.encrypted_id));
  const toFetch = orders.filter((o) => !existingIds.has(o.encrypted_id));

  if (toFetch.length === 0) {
    console.log("\nAll order details are up to date.");
    return;
  }
  console.log(`\nFetching details for ${toFetch.length} new orders (${existingIds.size} already cached, concurrency: ${CONCURRENCY})...`);

  let done = 0;
  const tasks = toFetch.map((order) => async () => {
    const detail = await fetchDetail(order.encrypted_id, cookieHeader);
    await randomDelay();
    done++;
    process.stdout.write(`\r  ${done}/${toFetch.length}`);
    return { encrypted_id: order.encrypted_id, ...detail };
  });

  const newDetails = await runWithConcurrency(tasks, CONCURRENCY);
  console.log("\nDone.");

  const allDetails = [...existing, ...newDetails];
  writeFileSync(DETAILS_FILE, JSON.stringify(allDetails, null, 2));
  console.log(`Saved ${allDetails.length} orders to ${DETAILS_FILE}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
