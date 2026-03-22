import db from "./db.js";
import { toEur, formatTimeSlot } from "./utils.js";

// --- Data loading ---

function loadRawData() {
  const orders = db.prepare("SELECT * FROM orders ORDER BY shipping_date DESC").all();
  const items = db
    .prepare(
      `SELECT oi.*, p.name_bg, p.name_en, p.brand, p.unit_type, p.unit_weight,
              c.name as category
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN categories c ON p.category_id = c.id`,
    )
    .all();
  return { orders, items };
}

// --- Aggregators ---

function computeKpis(orders) {
  const totalSpend = orders.reduce(
    (sum, o) => sum + toEur(o.final_amount_eur, o.final_amount),
    0,
  );
  const totalOrders = orders.length;
  const avgBasket = totalOrders > 0 ? totalSpend / totalOrders : 0;
  const totalSaved = orders.reduce(
    (sum, o) => sum + toEur(o.overall_saved_eur, o.overall_saved),
    0,
  );
  const totalTips = orders.reduce(
    (sum, o) => sum + toEur(o.overall_tip_eur, o.overall_tip),
    0,
  );
  const tippedPct =
    totalOrders > 0
      ? +(
          (orders.filter((o) => toEur(o.overall_tip_eur, o.overall_tip) > 0)
            .length /
            totalOrders) *
          100
        ).toFixed(0)
      : 0;

  return { totalSpend, totalOrders, avgBasket, totalSaved, totalTips, tippedPct };
}

function computeMonthlySpend(orders) {
  const monthMap = {};
  const monthCountMap = {};
  orders.forEach((o) => {
    if (!o.shipping_date) return;
    const month = o.shipping_date.slice(0, 7);
    monthMap[month] =
      (monthMap[month] || 0) + toEur(o.final_amount_eur, o.final_amount);
    monthCountMap[month] = (monthCountMap[month] || 0) + 1;
  });

  const monthlySpend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, spend]) => ({ month, spend: +spend.toFixed(2) }));

  const avgBasketTrend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, spend]) => ({
      month,
      avg: +(spend / monthCountMap[month]).toFixed(2),
    }));

  return { monthlySpend, avgBasketTrend };
}

function computeOrdersByDay(orders) {
  const DAY_NAMES = ["Пон", "Вт", "Ср", "Чет", "Пет", "Съб", "Нед"];
  const dayMap = {};
  orders.forEach((o) => {
    if (!o.shipping_date) return;
    const dow = new Date(o.shipping_date).getDay();
    dayMap[dow] = (dayMap[dow] || 0) + 1;
  });
  return [1, 2, 3, 4, 5, 6, 0].map((d, i) => ({
    day: DAY_NAMES[i],
    count: dayMap[d] || 0,
  }));
}

function computeOrdersByTimeSlot(orders) {
  const slotMap = {};
  orders.forEach((o) => {
    const label = formatTimeSlot(o.time_slot_start, o.time_slot_end);
    if (!label) return;
    slotMap[label] = (slotMap[label] || 0) + 1;
  });
  return Object.entries(slotMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slot, count]) => ({ slot, count }));
}

function computeCategorySpend(items) {
  const catMap = {};
  items.forEach((item) => {
    catMap[item.category] =
      (catMap[item.category] || 0) + toEur(item.price_eur, item.price);
  });
  return Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .map(([category, spend]) => ({ category, spend: +spend.toFixed(2) }));
}

function buildProductMap(items) {
  const productMap = {};
  items.forEach((item) => {
    const name = item.name_bg || item.name_en;
    if (!name) return;
    if (!productMap[name]) {
      productMap[name] = {
        id: item.product_id,
        name,
        spend: 0,
        count: 0,
        unitPriceSum: 0,
        category: item.category,
      };
    }
    productMap[name].spend += toEur(item.price_eur, item.price);
    productMap[name].unitPriceSum += toEur(
      item.current_price_eur,
      item.current_price,
    );
    productMap[name].count += 1;
  });
  return productMap;
}

function computeTopProducts(productMap) {
  return Object.values(productMap)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 15)
    .map((p) => ({ ...p, spend: +p.spend.toFixed(2) }));
}

function computeTopByFrequency(productMap) {
  return Object.values(productMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .map((p) => ({ ...p, spend: +p.spend.toFixed(2) }));
}

function computeProductList(orders, items) {
  const orderDateMap = {};
  orders.forEach((o) => {
    orderDateMap[o.encrypted_id] = o.shipping_date;
  });

  const productHistoryMap = {};
  items.forEach((item) => {
    const id = item.product_id;
    const name = item.name_bg || item.name_en;
    const orderDate = orderDateMap[item.order_encrypted_id];
    if (!name || !orderDate) return;

    if (!productHistoryMap[id]) {
      productHistoryMap[id] = {
        id,
        name,
        name_en: item.name_en,
        brand: item.brand,
        category: item.category,
        count: 0,
        totalSpend: 0,
        priceHistory: [],
      };
    }

    const entry = productHistoryMap[id];
    entry.count += 1;
    entry.totalSpend += toEur(item.price_eur, item.price);
    entry.priceHistory.push({
      date: orderDate,
      orderId: item.order_encrypted_id,
      unitPrice: +toEur(item.current_price_eur, item.current_price).toFixed(2),
      wasPromo: item.price_promo !== null && item.price_promo > 0,
    });
  });

  return Object.values(productHistoryMap)
    .map((p) => {
      const sorted = p.priceHistory
        .sort((a, b) => a.date.localeCompare(b.date))
        .filter(
          (entry, i, arr) =>
            i === arr.length - 1 || entry.date !== arr[i + 1].date,
        );
      return {
        ...p,
        totalSpend: +p.totalSpend.toFixed(2),
        avgPrice: sorted.length
          ? +(
              sorted.reduce((s, e) => s + e.unitPrice, 0) / sorted.length
            ).toFixed(2)
          : 0,
        firstPurchase: sorted[0]?.date ?? null,
        lastPurchase: sorted.at(-1)?.date ?? null,
        priceHistory: sorted,
      };
    })
    .sort((a, b) => b.count - a.count);
}

function computeOrderList(orders, items) {
  const orderItemsByOrder = {};
  items.forEach((item) => {
    if (!orderItemsByOrder[item.order_encrypted_id]) {
      orderItemsByOrder[item.order_encrypted_id] = [];
    }
    const qty = item.quantity || 1;
    const total = +toEur(item.price_eur, item.price).toFixed(2);
    orderItemsByOrder[item.order_encrypted_id].push({
      name: item.name_bg || item.name_en || "—",
      productId: item.product_id,
      category: item.category,
      qty,
      unitPrice: +(total / qty).toFixed(2),
      total,
      wasPromo: item.price_promo !== null && item.price_promo > 0,
    });
  });

  const orderList = orders
    .filter((o) => o.shipping_date)
    .map((o) => {
      const orderItems = orderItemsByOrder[o.encrypted_id] || [];
      return {
        id: o.encrypted_id,
        date: o.shipping_date,
        total: +toEur(o.final_amount_eur, o.final_amount).toFixed(2),
        saved: +toEur(o.overall_saved_eur, o.overall_saved).toFixed(2),
        tip: +toEur(o.overall_tip_eur, o.overall_tip).toFixed(2),
        timeSlot: formatTimeSlot(o.time_slot_start, o.time_slot_end),
        itemCount: orderItems.length,
        items: orderItems,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const topOrders = [...orderList]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return { orderList, topOrders };
}

function computePromoDependency(items) {
  const promoCatMap = {};
  items.forEach((item) => {
    const cat = item.category;
    if (!promoCatMap[cat])
      promoCatMap[cat] = { totalSpend: 0, promoSpend: 0 };
    const spend = toEur(item.price_eur, item.price);
    promoCatMap[cat].totalSpend += spend;
    if (item.price_promo !== null && item.price_promo > 0) {
      promoCatMap[cat].promoSpend += spend;
    }
  });
  return Object.entries(promoCatMap)
    .filter(([, v]) => v.totalSpend > 0)
    .map(([category, v]) => ({
      category,
      promoRatio: +((v.promoSpend / v.totalSpend) * 100).toFixed(1),
      promoSpend: +v.promoSpend.toFixed(2),
      totalSpend: +v.totalSpend.toFixed(2),
    }))
    .sort((a, b) => b.promoRatio - a.promoRatio);
}

function computeTopBrands(items) {
  const brandMap = {};
  items.forEach((item) => {
    const brand = item.brand?.trim();
    if (!brand) return;
    if (!brandMap[brand])
      brandMap[brand] = {
        brand,
        spend: 0,
        count: 0,
        category: item.category,
      };
    brandMap[brand].spend += toEur(item.price_eur, item.price);
    brandMap[brand].count += 1;
  });
  return Object.values(brandMap)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 15)
    .map((b) => ({ ...b, spend: +b.spend.toFixed(2) }));
}

function computeLoyaltyScores(orders, productList) {
  const allMonths = [
    ...new Set(orders.map((o) => o.shipping_date?.slice(0, 7)).filter(Boolean)),
  ];
  const totalMonths = allMonths.length;
  return productList
    .filter((p) => p.count >= 3)
    .map((p) => {
      const purchaseMonths = new Set(
        p.priceHistory.map((e) => e.date.slice(0, 7)),
      );
      const loyalty =
        totalMonths > 0
          ? +((purchaseMonths.size / totalMonths) * 100).toFixed(0)
          : 0;
      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        count: p.count,
        loyalty,
      };
    })
    .sort((a, b) => b.loyalty - a.loyalty)
    .slice(0, 15);
}

// --- Public API ---

export function getDashboardData() {
  const { orders, items } = loadRawData();

  const productMap = buildProductMap(items);
  const productList = computeProductList(orders, items);
  const { orderList, topOrders } = computeOrderList(orders, items);

  return {
    ...computeKpis(orders),
    ...computeMonthlySpend(orders),
    ordersByDay: computeOrdersByDay(orders),
    ordersByTimeSlot: computeOrdersByTimeSlot(orders),
    categorySpend: computeCategorySpend(items),
    topProducts: computeTopProducts(productMap),
    topByFrequency: computeTopByFrequency(productMap),
    productList,
    orderList,
    topOrders,
    promoDependency: computePromoDependency(items),
    topBrands: computeTopBrands(items),
    loyaltyProducts: computeLoyaltyScores(orders, productList),
  };
}

export function hasData() {
  return db.prepare("SELECT COUNT(*) as c FROM orders").get().c > 0;
}
