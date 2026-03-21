import { useState } from "react";
import {
  CreditCard,
  ShoppingCart,
  TrendingUp,
  BadgePercent,
  PieChart as PieChartIcon,
  Trophy,
  Calendar,
  ShoppingBag,
  Package,
} from "lucide-react";
import { categoryColor } from "@/lib/categoryColors";
import { fmt, fmtDate } from "@/lib/fmt";
import { truncate } from "@/lib/truncate";
import { productImg } from "@/lib/productImg";
import { EBagLink } from "@/components/ui/ebag-link";
import { CategoryBadge } from "@/components/ui/category-badge";
import { StatTile } from "@/components/ui/stat-tile";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Overview({ data }) {
  const [topMode, setTopMode] = useState("spend");
  const [brandsMode, setBrandsMode] = useState("spend");
  const {
    totalSpend,
    totalOrders,
    avgBasket,
    totalSaved,
    monthlySpend,
    ordersByDay,
    categorySpend,
    topProducts,
    topByFrequency,
    topOrders,
    inflationProducts,
    promoDependency,
    topBrands,
  } = data;
  const topList = topMode === "spend" ? topProducts : topByFrequency;

  const spendConfig = { spend: { label: "Разход", color: "var(--brand)" } };

  const catConfig = Object.fromEntries(
    categorySpend
      .slice(0, 12)
      .map((c) => [c.category, { label: c.category, color: categoryColor(c.category) }]),
  );

  const topConfig = {
    [topMode === "spend" ? "spend" : "count"]: {
      label: topMode === "spend" ? "Разход" : "Брой",
      color: "var(--brand)",
    },
  };

  const dayConfig = { count: { label: "Поръчки", color: "var(--brand)" } };
  const promoConfig = Object.fromEntries(
    promoDependency.map((c) => [
      c.category,
      { label: c.category, color: categoryColor(c.category) },
    ]),
  );
  const brandsConfig = Object.fromEntries(
    topBrands.map((b) => [b.brand, { label: b.brand, color: categoryColor(b.category) }]),
  );

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Общо похарчено"
          value={`${fmt(totalSpend)} €`}
          color="var(--brand)"
          icon={CreditCard}
        />
        <StatTile label="Поръчки" value={totalOrders} color="#6366f1" icon={ShoppingCart} />
        <StatTile
          label="Средна стойност на поръчка"
          value={`${fmt(avgBasket)} €`}
          color="#f59e0b"
          icon={TrendingUp}
        />
        <StatTile
          label="Общо спестено"
          value={`${fmt(totalSaved)} €`}
          sub="от промоции и отстъпки"
          color="#10b981"
          icon={BadgePercent}
        />
      </div>

      {/* Monthly spend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <TrendingUp size={14} />
            Месечни разходи
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={spendConfig} className="h-60 w-full">
            <AreaChart data={monthlySpend}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} unit=" €" width={72} />
              <ChartTooltip content={<ChartTooltipContent formatter={(v) => [`${fmt(v)} €`]} />} />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="var(--brand)"
                strokeWidth={2}
                fill="url(#spendGrad)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Category donut + Top products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              <PieChartIcon size={14} />
              Разходи по категория
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={catConfig} className="h-64 w-full">
              <PieChart>
                <Pie
                  data={categorySpend.slice(0, 12)}
                  dataKey="spend"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={55}
                  paddingAngle={2}
                >
                  {categorySpend.slice(0, 12).map((c) => (
                    <Cell key={c.category} fill={categoryColor(c.category)} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const { category, spend } = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-xl">
                        <p className="font-semibold text-card-foreground">{category}</p>
                        <p className="tabular-nums text-muted-foreground">{fmt(spend)} €</p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ChartContainer>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {categorySpend.slice(0, 12).map((c) => (
                <div
                  key={c.category}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: categoryColor(c.category) }}
                  />
                  <span className="truncate">{c.category}</span>
                  <span className="ml-auto tabular-nums text-foreground">{fmt(c.spend)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              <Trophy size={14} />
              Топ продукти
            </CardTitle>
            <div className="flex rounded-lg border p-0.5 text-xs">
              {[
                ["spend", "Разход"],
                ["frequency", "Честота"],
              ].map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setTopMode(m)}
                  className={`rounded-md px-3 py-1 transition-colors ${
                    topMode === m
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={topConfig}
              style={{ height: topList.length * 24 + 40 }}
              className="w-full"
            >
              <BarChart data={topList} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  unit={topMode === "spend" ? " €" : ""}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={160}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => (v.length > 22 ? v.slice(0, 22) + "…" : v)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => [topMode === "spend" ? `${fmt(v)} €` : `${v} пъти`]}
                    />
                  }
                />
                <Bar
                  dataKey={topMode === "spend" ? "spend" : "count"}
                  radius={[0, 4, 4, 0]}
                  barSize={14}
                >
                  {topList.map((p) => (
                    <Cell key={p.name} fill={categoryColor(p.category)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Day of week + Top 5 orders */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              <Calendar size={14} />
              Поръчки по ден
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={dayConfig} className="h-52 w-full">
              <BarChart data={ordersByDay} margin={{ left: 0, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(v) => [`${v} поръчки`]} />}
                />
                <Bar dataKey="count" fill="var(--brand)" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              <ShoppingBag size={14} />
              Топ 5 поръчки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {topOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">{fmtDate(o.date)}</span>
                  <span className="tabular-nums font-medium">{fmt(o.total)} €</span>
                  <EBagLink type="order" id={o.id} className="ml-auto shrink-0" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Price inflation — full width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <TrendingUp size={14} className="text-red-500" />
            <span className="text-red-500">Поскъпнали продукти</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inflationProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Няма поскъпнали продукти</p>
          ) : (
            <ul className="grid grid-cols-2 divide-y divide-border gap-x-8">
              {inflationProducts.map((p) => (
                <li key={p.name} className="py-2.5">
                  <div className="flex items-start gap-3">
                    {productImg(p.id) && (
                      <img
                        src={productImg(p.id)}
                        alt=""
                        className="size-10 rounded object-contain bg-white shrink-0 mt-0.5"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium leading-snug">{truncate(p.name, 35)}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-semibold text-red-500">+{p.pctIncrease}%</span>
                          <EBagLink type="product" id={p.id} />
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <CategoryBadge category={p.category} />
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {fmt(p.prevMax)} € → {fmt(p.latest)} €
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Row 3: Promo dependency + Brands breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              <BadgePercent size={14} />
              Промо зависимост по категория
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={promoConfig}
              style={{ height: promoDependency.length * 24 + 40 }}
              className="w-full"
            >
              <BarChart data={promoDependency} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  unit="%"
                  domain={[0, 100]}
                />
                <YAxis
                  dataKey="category"
                  type="category"
                  width={180}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10 }}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const { category, promoRatio } = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-xl">
                        <p className="font-semibold text-card-foreground">{category}</p>
                        <p className="tabular-nums text-muted-foreground">{promoRatio}%</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="promoRatio" radius={[0, 4, 4, 0]} barSize={14}>
                  {promoDependency.map((c) => (
                    <Cell key={c.category} fill={categoryColor(c.category)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              <Package size={14} />
              Топ марки
            </CardTitle>
            <div className="flex rounded-lg border p-0.5 text-xs">
              {[
                ["spend", "Разход"],
                ["count", "Честота"],
              ].map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setBrandsMode(m)}
                  className={`rounded-md px-3 py-1 transition-colors ${
                    brandsMode === m
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={brandsConfig}
              style={{ height: topBrands.length * 24 + 40 }}
              className="w-full"
            >
              <BarChart data={topBrands} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  unit={brandsMode === "spend" ? " €" : ""}
                />
                <YAxis
                  dataKey="brand"
                  type="category"
                  width={160}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => (v.length > 22 ? v.slice(0, 22) + "…" : v)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => [brandsMode === "spend" ? `${fmt(v)} €` : `${v} пъти`]}
                    />
                  }
                />
                <Bar
                  dataKey={brandsMode === "spend" ? "spend" : "count"}
                  radius={[0, 4, 4, 0]}
                  barSize={14}
                >
                  {topBrands.map((b) => (
                    <Cell key={b.brand} fill={categoryColor(b.category)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
