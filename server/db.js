import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { DATA_DIR, DB_PATH } from "./config.js";

mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Performance settings
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS orders (
    encrypted_id TEXT PRIMARY KEY,
    shipping_date TEXT NOT NULL,
    time_slot_start INTEGER,
    time_slot_end INTEGER,
    final_amount REAL,
    final_amount_eur REAL,
    overall_saved REAL,
    overall_saved_eur REAL,
    overall_tip REAL,
    overall_tip_eur REAL,
    order_status INTEGER
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name_bg TEXT,
    name_en TEXT,
    brand TEXT,
    category_id INTEGER REFERENCES categories(id),
    unit_type INTEGER,
    unit_weight REAL
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_encrypted_id TEXT NOT NULL REFERENCES orders(encrypted_id),
    product_id INTEGER REFERENCES products(id),
    quantity REAL NOT NULL,
    price REAL,
    price_eur REAL,
    current_price REAL,
    current_price_eur REAL,
    price_promo REAL,
    price_promo_eur REAL,
    has_changed_quantity INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_encrypted_id);
  CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
  CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(shipping_date);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
`);

// Graceful shutdown — ensures WAL checkpoint
process.on("exit", () => { db.close(); });

export default db;
