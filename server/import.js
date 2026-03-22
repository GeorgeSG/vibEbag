import db from "./db.js";
import { readFileSync, existsSync } from "fs";
import { DATA_FILE } from "./config.js";
import { num } from "./utils.js";

const upsertOrder = db.prepare(`
  INSERT INTO orders (encrypted_id, shipping_date, time_slot_start, time_slot_end,
    final_amount, final_amount_eur, overall_saved, overall_saved_eur,
    overall_tip, overall_tip_eur, order_status)
  VALUES (@encrypted_id, @shipping_date, @time_slot_start, @time_slot_end,
    @final_amount, @final_amount_eur, @overall_saved, @overall_saved_eur,
    @overall_tip, @overall_tip_eur, @order_status)
  ON CONFLICT(encrypted_id) DO UPDATE SET
    shipping_date = excluded.shipping_date,
    time_slot_start = excluded.time_slot_start,
    time_slot_end = excluded.time_slot_end,
    final_amount = excluded.final_amount,
    final_amount_eur = excluded.final_amount_eur,
    overall_saved = excluded.overall_saved,
    overall_saved_eur = excluded.overall_saved_eur,
    overall_tip = excluded.overall_tip,
    overall_tip_eur = excluded.overall_tip_eur,
    order_status = excluded.order_status
`);

const upsertCategory = db.prepare(`
  INSERT INTO categories (name) VALUES (?)
  ON CONFLICT(name) DO NOTHING
`);

const getCategoryId = db.prepare(`SELECT id FROM categories WHERE name = ?`);

const upsertProduct = db.prepare(`
  INSERT INTO products (id, name_bg, name_en, brand, category_id, unit_type, unit_weight)
  VALUES (@id, @name_bg, @name_en, @brand, @category_id, @unit_type, @unit_weight)
  ON CONFLICT(id) DO UPDATE SET
    name_bg = excluded.name_bg,
    name_en = excluded.name_en,
    brand = excluded.brand,
    category_id = excluded.category_id,
    unit_type = excluded.unit_type,
    unit_weight = excluded.unit_weight
`);

const deleteOrderItems = db.prepare(`DELETE FROM order_items WHERE order_encrypted_id = ?`);

const insertItem = db.prepare(`
  INSERT INTO order_items (order_encrypted_id, product_id, quantity,
    price, price_eur, current_price, current_price_eur,
    price_promo, price_promo_eur, has_changed_quantity)
  VALUES (@order_encrypted_id, @product_id, @quantity,
    @price, @price_eur, @current_price, @current_price_eur,
    @price_promo, @price_promo_eur, @has_changed_quantity)
`);

// Cache category name → id lookups
const categoryCache = {};

function ensureCategory(name) {
  if (categoryCache[name]) return categoryCache[name];
  upsertCategory.run(name);
  const row = getCategoryId.get(name);
  categoryCache[name] = row.id;
  return row.id;
}

const getProductCategory = db.prepare(
  `SELECT c.name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?`,
);

function resolveCategory(productId, groups) {
  // 1. Check other groups in the same order
  for (const g of groups) {
    if (!g.group_name || g.group_name === "Променени количества") continue;
    for (const item of g.group_items ?? []) {
      if (item.product_saved?.id === productId) return g.group_name;
    }
  }
  // 2. Check existing category in the DB from a previous order
  const row = getProductCategory.get(productId);
  if (row && row.name !== "Друго") return row.name;
  return null;
}

function getAllGroups(detail) {
  return [
    ...(detail.grouped_items ?? []),
    ...(detail.additional_orders ?? []).flatMap((ao) => ao.grouped_items ?? []),
  ];
}

function upsertItemRow(detail, item, categoryId, isChanged) {
  const ps = item.product_saved;

  upsertProduct.run({
    id: ps.id,
    name_bg: ps.name_bg ?? null,
    name_en: ps.name_en ?? null,
    brand: ps.brand ?? null,
    category_id: categoryId,
    unit_type: ps.unit_type ?? null,
    unit_weight: num(ps.unit_weight),
  });

  insertItem.run({
    order_encrypted_id: detail.encrypted_id,
    product_id: ps.id,
    quantity: parseFloat(item.quantity) || 1,
    price: num(item.price),
    price_eur: num(item.price_eur),
    current_price: num(ps.current_price),
    current_price_eur: num(ps.current_price_eur),
    price_promo: num(ps.price_promo),
    price_promo_eur: num(ps.price_promo_eur),
    has_changed_quantity: isChanged ? 1 : 0,
  });
}

export function importFromJson(filePath = DATA_FILE) {
  if (!existsSync(filePath)) {
    throw new Error(`Data file not found: ${filePath}`);
  }

  const details = JSON.parse(readFileSync(filePath, "utf-8"));

  const importAll = db.transaction(() => {
    // Pass 1: upsert orders and all non-changed items (establishes product categories)
    const deferredItems = [];

    for (const detail of details) {
      const order = detail.order;
      if (!order?.shipping_date) continue;

      const allGroups = getAllGroups(detail);

      upsertOrder.run({
        encrypted_id: detail.encrypted_id,
        shipping_date: order.shipping_date,
        time_slot_start: order.time_slot_start ?? null,
        time_slot_end: order.time_slot_end ?? null,
        final_amount: num(order.final_amount),
        final_amount_eur: num(order.final_amount_eur),
        overall_saved: num(detail.overall_saved),
        overall_saved_eur: num(detail.overall_saved_eur),
        overall_tip: num(detail.overall_tip),
        overall_tip_eur: num(detail.overall_tip_eur),
        order_status: order.order_status ?? null,
      });

      deleteOrderItems.run(detail.encrypted_id);

      for (const g of allGroups) {
        const isChanged = g.group_name === "Променени количества";
        const needsResolve = isChanged || !g.group_name;

        for (const item of g.group_items ?? []) {
          if (!item.product_saved) continue;

          if (needsResolve) {
            deferredItems.push({ detail, item, allGroups, isChanged });
          } else {
            const categoryId = ensureCategory(g.group_name);
            upsertItemRow(detail, item, categoryId, false);
          }
        }
      }
    }

    // Pass 2: import deferred items (null group + changed quantity — can now look up categories from DB)
    for (const { detail, item, allGroups, isChanged } of deferredItems) {
      const categoryName = resolveCategory(item.product_saved.id, allGroups) ?? "Друго";
      const categoryId = ensureCategory(categoryName);
      upsertItemRow(detail, item, categoryId, isChanged);
    }
  });

  importAll();

  const orderCount = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
  const itemCount = db.prepare("SELECT COUNT(*) as c FROM order_items").get().c;
  const productCount = db.prepare("SELECT COUNT(*) as c FROM products").get().c;

  return { orderCount, itemCount, productCount };
}

// Allow running standalone: node import.js
if (process.argv[1]?.endsWith("import.js")) {
  console.log("Импортиране на данни от order-details.json...");
  const result = importFromJson();
  console.log(
    `Готово: ${result.orderCount} поръчки, ${result.productCount} продукта, ${result.itemCount} артикула.`,
  );
}
