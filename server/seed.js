// Generates synthetic but realistic-looking eBag order data for development.
// All product names, brands, and prices are faker-generated — no real data.
// Output: ../data/order-details.dev.json
// Usage: npm run seed

import { faker } from "@faker-js/faker";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { DATA_DIR, BGN_TO_EUR } from "./config.js";

const OUT_FILE = resolve(DATA_DIR, "order-details.dev.json");

faker.seed(1234);
const eur = (bgn) => +(bgn / BGN_TO_EUR).toFixed(2);
const fmt = (v) => (+v).toFixed(2);
const pick = (...arr) => faker.helpers.arrayElement(arr.flat());
const wt = (pairs) =>
  faker.helpers.weightedArrayElement(pairs.map(([value, weight]) => ({ value, weight })));

// ---------------------------------------------------------------------------
// Brand factory — generates plausible-looking grocery brand names
// ---------------------------------------------------------------------------

// Real brands found in Bulgarian supermarkets, grouped by category
const BG_BRANDS_BY_CATEGORY = {
  "Млечни и яйца": ["Лактима", "Верея", "Данон", "Милки", "Президент", "Хармоника"],
  "Плодове и зеленчуци": ["Хармоника", "Хармоника Био", "Зоя"],
  Напитки: [
    "Загорка",
    "Каменица",
    "Астика",
    "Шуменско",
    "Бургаско",
    "Плевенско",
    "Девин",
    "Банкя",
    "Горна Баня",
    "Боровец",
    "Cappy",
    "Нескафе",
    "Jacobs",
    "Suhindol",
    "Brestnik",
  ],
  "Основни храни и консерви": [
    "Хармоника",
    "Флориол",
    "Злато",
    "Barilla",
    "Олимп",
    "Хармоника Био",
  ],
  "Сладко и солено": ["Маринела", "Бон Бон", "Милка", "Kinder", "Bella", "Lay's", "Pringles"],
  Пекарна: ["Родна Нива", "Делта", "Хармоника"],
  "Месо и риба": ["Родопа", "Малинчо", "Ростар", "Еко Месо"],
  "Колбаси и деликатеси": ["Родопа", "Малинчо", "Ростар", "Триада", "Еко Месо"],
  "За дома и офиса": ["Медикс", "Bingo", "Test", "Ariel", "Persil", "Fairy"],
  "Козметика и лична грижа": ["Бочко", "Арома", "Prestige", "Nivea", "Dove"],
  "Замразени храни": ["Iglo", "Приморско", "Родопа"],
  Био: ["Хармоника Био", "Зоя", "Хармоника"],
};

const brand = (category) =>
  faker.helpers.arrayElement(BG_BRANDS_BY_CATEGORY[category] ?? ["Хармоника"]);
const maybeNoBrand = (category) =>
  faker.datatype.boolean({ probability: 0.15 }) ? null : brand(category);

// ---------------------------------------------------------------------------
// Category product-name generators
// Each returns { name_bg (used as display), name_en, unit_type, basePrice }
// ---------------------------------------------------------------------------

const g = {
  weight: () => pick("200г", "250г", "300г", "400г", "500г", "1кг", "2кг"),
  volume: () => pick("250мл", "330мл", "500мл", "750мл", "1л", "1.5л", "2л"),
  pct: () => faker.number.float({ min: 0.5, max: 5, fractionDigits: 1 }) + "%",
  count: () => faker.number.int({ min: 2, max: 12 }) + "бр",
};

const CATEGORIES = {
  "Млечни и яйца": {
    weight: 5,
    priceRange: [1.5, 8.5],
    factory(cat) {
      const type = pick(
        "Прясно Мляко",
        "Кисело Мляко",
        "Сирене Бяло",
        "Кашкавал",
        "Масло",
        "Skyr",
        "Крем Сирене",
        "Яйца",
        "Извара",
      );
      const suffix =
        type === "Яйца"
          ? g.count()
          : type === "Прясно Мляко" || type === "Кисело Мляко"
            ? g.pct() + " " + g.volume()
            : g.weight();
      return { bg: `${type} ${brand(cat)} ${suffix}`, en: `${type} ${suffix}`, unit_type: 2 };
    },
  },

  "Плодове и зеленчуци": {
    weight: 5,
    priceRange: [1.2, 6.0],
    factory() {
      const produce = [
        ["Банани", 1],
        ["Ябълки", 1],
        ["Портокали", 1],
        ["Домати", 2],
        ["Краставици", 2],
        ["Моркови", 2],
        ["Картофи", 2],
        ["Лук", 2],
        ["Салата", 2],
        ["Броколи", 2],
        ["Спанак", 2],
        ["Лимони", 2],
        ["Тиквички", 2],
        ["Чесън", 2],
        ["Чушки", 2],
      ];
      const [name, unitType] = faker.helpers.arrayElement(produce);
      const suffix = unitType === 1 ? "1кг" : g.weight();
      const variant = pick("", "Черешови", "Мини", "Бейби", "Пресни", "");
      return {
        bg: `${name} ${variant} ${suffix}`.replace(/\s+/g, " ").trim(),
        en: `${name} ${suffix}`,
        unit_type: unitType,
      };
    },
  },

  Напитки: {
    weight: 3,
    priceRange: [0.9, 20.0],
    factory(cat) {
      const type = pick(
        "Газирана Вода",
        "Негазирана Вода",
        "Сок",
        "Бира",
        "Вино",
        "Кафе на Зърна",
        "Кафе Смляно",
        "Чай",
      );
      const vol = type.includes("Кафе") ? g.weight() : g.volume();
      return { bg: `${type} ${brand(cat)} ${vol}`, en: `${type} ${vol}`, unit_type: 2 };
    },
  },

  "Основни храни и консерви": {
    weight: 4,
    priceRange: [1.2, 18.0],
    factory(cat) {
      const type = pick(
        "Паста",
        "Ориз",
        "Брашно",
        "Захар",
        "Олио",
        "Зехтин",
        "Доматена Паста",
        "Консерва Риба Тон",
        "Мед",
        "Оцет",
        "Соев Сос",
        "Бульон",
        "Конфитюр",
        "Фъстъчено Масло",
      );
      return {
        bg: `${type} ${brand(cat)} ${g.weight()}`,
        en: `${type} ${g.weight()}`,
        unit_type: 2,
      };
    },
  },

  "Сладко и солено": {
    weight: 3,
    priceRange: [1.5, 12.0],
    factory(cat) {
      const type = pick(
        "Шоколад",
        "Бисквити",
        "Чипс",
        "Ядки",
        "Мюсли",
        "Овесени Ядки",
        "Вафли",
        "Крекери",
        "Халва",
        "Локум",
      );
      return {
        bg: `${type} ${brand(cat)} ${g.weight()}`,
        en: `${type} ${g.weight()}`,
        unit_type: 2,
      };
    },
  },

  Пекарна: {
    weight: 3,
    priceRange: [1.5, 6.0],
    factory(cat) {
      const type = pick(
        "Хляб",
        "Хляб Пълнозърнест",
        "Питки",
        "Кроасани",
        "Кори за Баница",
        "Хамбургери",
        "Козунак",
      );
      const suffix = type.includes("Хляб") ? g.weight() : g.count();
      return { bg: `${type} ${brand(cat)} ${suffix}`, en: `${type} ${suffix}`, unit_type: 2 };
    },
  },

  "Месо и риба": {
    weight: 3,
    priceRange: [5.0, 18.0],
    factory(cat) {
      const [type, unitType] = faker.helpers.arrayElement([
        ["Пилешки Гърди", 1],
        ["Пилешки Бутчета", 1],
        ["Кайма Смесена", 2],
        ["Кайма Телешка", 2],
        ["Кебапчета", 2],
        ["Кюфтета", 2],
        ["Сьомга Парче", 2],
        ["Риба Скумрия", 2],
        ["Свинско Контра Филе", 2],
      ]);
      const suffix = unitType === 1 ? "1кг" : g.weight();
      return {
        bg: `${type} ${brand(cat)} ${suffix}`,
        en: `${type} ${suffix}`,
        unit_type: unitType,
      };
    },
  },

  "Колбаси и деликатеси": {
    weight: 2,
    priceRange: [3.5, 9.0],
    factory(cat) {
      const type = pick("Шунка Варена", "Шунка Печена", "Луканка", "Салам", "Наденица", "Пастърма");
      return {
        bg: `${type} ${brand(cat)} Слайс ${g.weight()}`,
        en: `${type} Slice ${g.weight()}`,
        unit_type: 2,
      };
    },
  },

  "За дома и офиса": {
    weight: 2,
    priceRange: [2.5, 22.0],
    factory(cat) {
      const type = pick(
        "Препарат Съдове",
        "Гел за Пране",
        "Омекотител",
        "Тоалетна Хартия",
        "Кухненска Хартия",
        "Торби за Смет",
        "Препарат Стъкла",
        "Препарат Тоалетна",
        "Антибактериален Спрей",
      );
      const suffix = type.includes("Хартия") || type.includes("Торби") ? g.count() : g.volume();
      return { bg: `${type} ${brand(cat)} ${suffix}`, en: `${type} ${suffix}`, unit_type: 2 };
    },
  },

  "Козметика и лична грижа": {
    weight: 2,
    priceRange: [3.0, 15.0],
    factory(cat) {
      const type = pick(
        "Шампоан",
        "Балсам за Коса",
        "Дезодорант",
        "Течен Сапун",
        "Паста за Зъби",
        "Душ Гел",
        "Крем за Лице",
        "Мицеларна Вода",
      );
      return {
        bg: `${type} ${brand(cat)} ${g.volume()}`,
        en: `${type} ${g.volume()}`,
        unit_type: 2,
      };
    },
  },

  "Замразени храни": {
    weight: 2,
    priceRange: [2.5, 11.0],
    factory(cat) {
      const type = pick(
        "Грах Замразен",
        "Царевица Замразена",
        "Микс Зеленчуци Замразен",
        "Картофи Замразени",
        "Пица",
        "Кюфтета Замразени",
        "Риба Панирана Замразена",
        "Спанак Замразен",
      );
      return {
        bg: `${type} ${brand(cat)} ${g.weight()}`,
        en: `${type} ${g.weight()}`,
        unit_type: 2,
      };
    },
  },

  Био: {
    weight: 1,
    priceRange: [3.0, 16.0],
    factory(cat) {
      const type = pick(
        "Био Ленено Семе",
        "Био Чиа Семена",
        "Био Кокосово Масло",
        "Био Овесени Ядки",
        "Био Кафява Захар",
        "Био Бадемово Мляко",
        "Био Конопено Семе",
        "Био Киноа",
      );
      return {
        bg: `${type} ${brand(cat)} ${g.weight()}`,
        en: `${type} ${g.weight()}`,
        unit_type: 2,
      };
    },
  },
};

// ---------------------------------------------------------------------------
// Product pool: generate a stable set of products used across all orders
// (same product can appear in multiple orders — enabling price history)
// ---------------------------------------------------------------------------

const PRODUCTS = [];
let nextId = 1000;

for (const [category, config] of Object.entries(CATEGORIES)) {
  const count = Math.round(config.weight * 5);
  for (let i = 0; i < count; i++) {
    const { bg, en, unit_type } = config.factory(category);
    const basePrice = faker.number.float({
      min: config.priceRange[0],
      max: config.priceRange[1],
      fractionDigits: 2,
    });
    PRODUCTS.push({
      id: nextId++,
      name_bg: bg,
      name_en: en,
      brand: maybeNoBrand(category),
      base: basePrice,
      unit_type,
      category,
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function weightedSample(arr, getWeight, n) {
  const pool = [...arr];
  const result = [];
  while (result.length < Math.min(n, pool.length)) {
    const weights = pool.map(getWeight);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = faker.number.float({ min: 0, max: total });
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        result.push(...pool.splice(i, 1));
        break;
      }
    }
  }
  return result;
}

// Mild price inflation over time + per-product noise
function inflatedPrice(base, dateStr, productId) {
  const d = new Date(dateStr);
  const monthsElapsed = (d.getFullYear() - 2024) * 12 + d.getMonth();
  const inflation = 1 + monthsElapsed * 0.004 + (((productId * 7) % 20) - 10) * 0.001;
  const raw = +(base * inflation).toFixed(2);
  const endings = [0.49, 0.69, 0.79, 0.89, 0.99];
  const whole = Math.floor(raw);
  const end = endings[Math.abs(productId + Math.floor(monthsElapsed / 3)) % endings.length];
  return Math.max(whole + end, 0.49);
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function buildItem(product, shippingDate) {
  const price = inflatedPrice(product.base, shippingDate, product.id);
  const isPromo = faker.datatype.boolean({ probability: 0.22 });
  const promoPrice = isPromo
    ? +(price * faker.number.float({ min: 0.75, max: 0.92 })).toFixed(2)
    : null;
  const actualPrice = promoPrice ?? price;

  const qty =
    product.unit_type === 1
      ? +faker.number.float({ min: 0.4, max: 1.9, fractionDigits: 3 })
      : wt([
          ["1", 7],
          ["2", 2],
          ["3", 1],
        ]) * 1;

  const totalBgn = +(actualPrice * qty).toFixed(2);

  return {
    item: {
      has_changed_quantity: false,
      product_saved: {
        id: product.id,
        name_bg: product.name_bg,
        name_en: product.name_en,
        brand: product.brand,
        price: fmt(price),
        price_eur: fmt(eur(price)),
        price_promo: promoPrice ? fmt(promoPrice) : null,
        price_promo_eur: promoPrice ? fmt(eur(promoPrice)) : null,
        current_price: fmt(actualPrice),
        current_price_eur: fmt(eur(actualPrice)),
        unit_weight: "1.0000",
        unit_type: product.unit_type,
      },
      quantity: qty.toFixed(3),
      price: fmt(totalBgn),
      price_eur: fmt(eur(totalBgn)),
      regular_price: fmt(+(price * qty).toFixed(2)),
      regular_price_eur: fmt(eur(+(price * qty).toFixed(2))),
    },
    totalBgn,
    savedBgn: promoPrice ? +((price - promoPrice) * qty).toFixed(2) : 0,
  };
}

function buildOrder(shippingDate) {
  const n = faker.number.int({ min: 8, max: 18 });
  const catWeight = (p) => CATEGORIES[p.category]?.weight ?? 1;
  const products = weightedSample(PRODUCTS, catWeight, n);

  const byCategory = {};
  let totalBgn = 0;
  let totalSaved = 0;

  for (const product of products) {
    const { item, totalBgn: t, savedBgn: s } = buildItem(product, shippingDate);
    (byCategory[product.category] ??= []).push(item);
    totalBgn += t;
    totalSaved += s;
  }

  totalBgn = +totalBgn.toFixed(2);
  totalSaved = +totalSaved.toFixed(2);

  return {
    encrypted_id: faker.string.hexadecimal({ length: 16, casing: "upper", prefix: "" }),
    order: {
      shipping_date: shippingDate,
      final_amount: fmt(totalBgn),
      final_amount_eur: fmt(eur(totalBgn)),
      order_status: 4,
      last_payment_method: 10,
      items_count: products.length,
    },
    grouped_items: Object.entries(byCategory).map(([group_name, group_items]) => ({
      group_name,
      group_items,
    })),
    additional_orders: [],
    overall_saved: fmt(totalSaved),
    overall_saved_eur: fmt(eur(totalSaved)),
    overall_final_amount: fmt(totalBgn),
    overall_final_amount_eur: fmt(eur(totalBgn)),
  };
}

// ---------------------------------------------------------------------------
// Generate ~biweekly orders: Jan 2024 → Mar 2026
// ---------------------------------------------------------------------------

const orders = [];
let current = new Date("2024-01-10");
const end = new Date("2026-03-15");

while (current <= end) {
  if (faker.datatype.boolean({ probability: 0.88 })) {
    orders.push(buildOrder(current.toISOString().slice(0, 10)));
  }
  current.setDate(current.getDate() + faker.number.int({ min: 7, max: 16 }));
}

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(orders, null, 2));

const totals = orders.map((o) => parseFloat(o.order.final_amount_eur));
const avg = (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(2);
console.log(`Генерирани ${orders.length} поръчки  |  ${PRODUCTS.length} уникални продукта`);
console.log(
  `Средна кошница: €${avg}  Мин: €${Math.min(...totals).toFixed(2)}  Макс: €${Math.max(...totals).toFixed(2)}`,
);
console.log(`Запазено в ${OUT_FILE}`);
