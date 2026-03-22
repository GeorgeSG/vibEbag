// Processes raw order-details.json into dashboard-ready data structures.
// All monetary values are in EUR.
// If a EUR field is missing/null, the BGN value is converted using the fixed rate.

const BGN_TO_EUR = 1.95583;

function toEur(eurVal, bgnVal) {
  const eur = parseFloat(eurVal);
  if (!isNaN(eur) && eur > 0) return eur;
  return parseFloat(bgnVal) / BGN_TO_EUR;
}

export function processOrders(details) {
  // Build product ID → category lookup from non-changed-quantity groups
  const productCategoryMap = {};
  details.forEach((d) => {
    const sources = [
      ...(d.grouped_items ?? []),
      ...(d.additional_orders ?? []).flatMap((ao) => ao.grouped_items ?? []),
    ];
    sources.forEach((g) => {
      const cat = g.group_name;
      if (!cat || cat === "Променени количества") return;
      (g.group_items ?? []).forEach((item) => {
        const id = item.product_saved?.id;
        if (id) productCategoryMap[id] = cat;
      });
    });
  });

  // Flatten all line items from all orders (main + additional)
  const allItems = details.flatMap((d) => {
    const sources = [
      ...(d.grouped_items ?? []),
      ...(d.additional_orders ?? []).flatMap((ao) => ao.grouped_items ?? []),
    ];
    return sources.flatMap((g) =>
      (g.group_items ?? []).map((item) => {
        let category = g.group_name ?? "Друго";
        if (category === "Променени количества") {
          category = productCategoryMap[item.product_saved?.id] ?? "Друго";
        }
        return {
          ...item,
          category,
          order_date: d.order?.shipping_date,
          order_id: d.encrypted_id,
        };
      }),
    );
  });

  // --- KPI stats ---
  const totalSpend = details.reduce(
    (sum, d) => sum + toEur(d.order?.final_amount_eur, d.order?.final_amount),
    0,
  );
  const totalOrders = details.length;
  const avgBasket = totalSpend / totalOrders;
  const totalSaved = details.reduce(
    (sum, d) => sum + toEur(d.overall_saved_eur, d.overall_saved),
    0,
  );
  const totalTips = details.reduce(
    (sum, d) => sum + toEur(d.overall_tip_eur, d.overall_tip),
    0,
  );
  const tippedPct = totalOrders > 0
    ? +((details.filter((d) => toEur(d.overall_tip_eur, d.overall_tip) > 0).length / totalOrders) * 100).toFixed(0)
    : 0;

  // --- Monthly spend ---
  const monthMap = {};
  const monthCountMap = {};
  details.forEach((d) => {
    const date = d.order?.shipping_date;
    if (!date) return;
    const month = date.slice(0, 7);
    monthMap[month] =
      (monthMap[month] || 0) + toEur(d.order.final_amount_eur, d.order.final_amount);
    monthCountMap[month] = (monthCountMap[month] || 0) + 1;
  });
  const monthlySpend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, spend]) => ({ month, spend: +spend.toFixed(2) }));
  const avgBasketTrend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, spend]) => ({ month, avg: +(spend / monthCountMap[month]).toFixed(2) }));

  // --- Orders by day of week ---
  const DAY_NAMES = ["Пон", "Вт", "Ср", "Чет", "Пет", "Съб", "Нед"];
  const dayMap = {};
  details.forEach((d) => {
    const date = d.order?.shipping_date;
    if (!date) return;
    const dow = new Date(date).getDay(); // 0=Sun
    dayMap[dow] = (dayMap[dow] || 0) + 1;
  });
  const ordersByDay = [1, 2, 3, 4, 5, 6, 0].map((d, i) => ({
    day: DAY_NAMES[i],
    count: dayMap[d] || 0,
  }));

  // --- Orders by time slot ---
  const slotMap = {};
  details.forEach((d) => {
    const s = d.order?.time_slot_start;
    const e = d.order?.time_slot_end;
    if (s == null || e == null) return;
    const label = `${String(s).slice(0, -2).padStart(2, "0")}:${String(s).slice(-2)}–${String(e).slice(0, -2).padStart(2, "0")}:${String(e).slice(-2)}`;
    slotMap[label] = (slotMap[label] || 0) + 1;
  });
  const ordersByTimeSlot = Object.entries(slotMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slot, count]) => ({ slot, count }));

  // --- Spend by category ---
  const catMap = {};
  allItems.forEach((item) => {

    catMap[item.category] = (catMap[item.category] || 0) + toEur(item.price_eur, item.price);
  });
  const categorySpend = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .map(([category, spend]) => ({ category, spend: +spend.toFixed(2) }));

  // --- Top products by total spend ---
  const productMap = {};
  allItems.forEach((item) => {

    const name = item.product_saved?.name_bg || item.product_saved?.name_en;
    if (!name) return;
    if (!productMap[name]) {
      productMap[name] = { id: item.product_saved?.id, name, spend: 0, count: 0, unitPriceSum: 0, category: item.category };
    }
    const ps = item.product_saved;
    productMap[name].spend += toEur(item.price_eur, item.price);
    productMap[name].unitPriceSum += toEur(ps?.current_price_eur, ps?.current_price);
    productMap[name].count += 1;
  });
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 15)
    .map((p) => ({ ...p, spend: +p.spend.toFixed(2) }));

  // --- Most frequently ordered products ---
  const topByFrequency = Object.values(productMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .map((p) => ({ ...p, spend: +p.spend.toFixed(2) }));

  // --- Per-product price history ---
  const productHistoryMap = {};
  allItems.forEach((item) => {

    const ps = item.product_saved;
    if (!ps) return;
    const id = ps.id;
    const name = ps.name_bg || ps.name_en;
    if (!name || !item.order_date) return;

    if (!productHistoryMap[id]) {
      productHistoryMap[id] = {
        id,
        name,
        name_en: ps.name_en,
        brand: ps.brand,
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
      date: item.order_date,
      orderId: item.order_id,
      unitPrice: +toEur(ps.current_price_eur, ps.current_price).toFixed(2),
      wasPromo: ps.price_promo !== null && parseFloat(ps.price_promo) > 0,
    });
  });

  const productList = Object.values(productHistoryMap)
    .map((p) => {
      const sorted = p.priceHistory
        .sort((a, b) => a.date.localeCompare(b.date))
        .filter((entry, i, arr) => i === arr.length - 1 || entry.date !== arr[i + 1].date);
      return {
        ...p,
        totalSpend: +p.totalSpend.toFixed(2),
        avgPrice: sorted.length
          ? +(sorted.reduce((s, e) => s + e.unitPrice, 0) / sorted.length).toFixed(2)
          : 0,
        firstPurchase: sorted[0]?.date ?? null,
        lastPurchase: sorted.at(-1)?.date ?? null,
        priceHistory: sorted,
      };
    })
    .sort((a, b) => b.count - a.count);

  // --- Order list ---
  const orderList = details
    .filter((d) => d.order?.shipping_date)
    .map((d) => {
      const sources = [
        ...(d.grouped_items ?? []),
        ...(d.additional_orders ?? []).flatMap((ao) => ao.grouped_items ?? []),
      ];
      const items = sources.flatMap((g) =>
        (g.group_items ?? []).map((item) => {
            const qty = parseFloat(item.quantity) || 1;
            const total = +toEur(item.price_eur, item.price).toFixed(2);
            return {
              name: item.product_saved?.name_bg || item.product_saved?.name_en || "—",
              productId: item.product_saved?.id ?? null,
              category: (g.group_name && g.group_name !== "Променени количества")
                ? g.group_name
                : (productCategoryMap[item.product_saved?.id] ?? "Друго"),
              qty,
              unitPrice: +(total / qty).toFixed(2),
              total,
              wasPromo:
                item.product_saved?.price_promo !== null &&
                parseFloat(item.product_saved?.price_promo) > 0,
            };
          }),
      );
      const s = d.order.time_slot_start;
      const e = d.order.time_slot_end;
      const timeSlot = s != null && e != null
        ? `${String(s).slice(0, -2).padStart(2, "0")}:${String(s).slice(-2)}–${String(e).slice(0, -2).padStart(2, "0")}:${String(e).slice(-2)}`
        : null;
      return {
        id: d.encrypted_id,
        date: d.order.shipping_date,
        total: +toEur(d.order.final_amount_eur, d.order.final_amount).toFixed(2),
        saved: +toEur(d.overall_saved_eur, d.overall_saved).toFixed(2),
        tip: +toEur(d.overall_tip_eur, d.overall_tip).toFixed(2),
        timeSlot,
        itemCount: items.length,
        items,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  // --- Top 5 orders by total ---
  const topOrders = [...orderList].sort((a, b) => b.total - a.total).slice(0, 5);

  // --- Promo dependency per category ---
  const promoCatMap = {};
  allItems.forEach((item) => {

    const cat = item.category;
    if (!promoCatMap[cat]) promoCatMap[cat] = { totalSpend: 0, promoSpend: 0 };
    const spend = toEur(item.price_eur, item.price);
    promoCatMap[cat].totalSpend += spend;
    if (
      item.product_saved?.price_promo !== null &&
      parseFloat(item.product_saved?.price_promo) > 0
    ) {
      promoCatMap[cat].promoSpend += spend;
    }
  });
  const promoDependency = Object.entries(promoCatMap)
    .filter(([, v]) => v.totalSpend > 0)
    .map(([category, v]) => ({
      category,
      promoRatio: +((v.promoSpend / v.totalSpend) * 100).toFixed(1),
      promoSpend: +v.promoSpend.toFixed(2),
      totalSpend: +v.totalSpend.toFixed(2),
    }))
    .sort((a, b) => b.promoRatio - a.promoRatio);

  // --- Top brands by spend ---
  const brandMap = {};
  allItems.forEach((item) => {

    const brand = item.product_saved?.brand;
    if (!brand) return;
    const trimmed = brand.trim();
    if (!trimmed) return;
    if (!brandMap[trimmed])
      brandMap[trimmed] = { brand: trimmed, spend: 0, count: 0, category: item.category };
    brandMap[trimmed].spend += toEur(item.price_eur, item.price);
    brandMap[trimmed].count += 1;
  });
  const topBrands = Object.values(brandMap)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 15)
    .map((b) => ({ ...b, spend: +b.spend.toFixed(2) }));

  // --- Loyalty score per product ---
  // loyalty = months purchased / total active months
  const allMonths = [...new Set(details.map((d) => d.order?.shipping_date?.slice(0, 7)).filter(Boolean))];
  const totalMonths = allMonths.length;
  const loyaltyProducts = productList
    .filter((p) => p.count >= 3)
    .map((p) => {
      const purchaseMonths = new Set(p.priceHistory.map((e) => e.date.slice(0, 7)));
      const loyalty = totalMonths > 0 ? +(purchaseMonths.size / totalMonths * 100).toFixed(0) : 0;
      return { id: p.id, name: p.name, brand: p.brand, category: p.category, count: p.count, loyalty };
    })
    .sort((a, b) => b.loyalty - a.loyalty)
    .slice(0, 15);

  return {
    totalSpend,
    totalOrders,
    avgBasket,
    totalSaved,
    totalTips,
    tippedPct,
    monthlySpend,
    avgBasketTrend,
    ordersByDay,
    ordersByTimeSlot,
    categorySpend,
    topProducts,
    topByFrequency,
    productList,
    orderList,
    topOrders,
    promoDependency,
    topBrands,
    loyaltyProducts,
  };
}
