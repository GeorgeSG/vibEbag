import { useState, useMemo } from "react";
import { ShoppingCart, TrendingUp, CreditCard, BarChart2, ExternalLink } from "lucide-react";
import { CategoryFilter } from "@/components/ui/category-filter";
import { CategoryBadge } from "@/components/ui/category-badge";
import { StatTile } from "@/components/ui/stat-tile";
import { SortIcon, SortHead } from "@/components/ui/sort-icon";
import { SectionHeader } from "@/components/ui/section-header";
import { TablePagination } from "@/components/ui/table-pagination";
import { fmt, fmtDate } from "@/lib/fmt";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceDot } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const priceChartConfig = {
  unitPrice: { label: "Цена", color: "var(--chart-1)" },
};

function PriceHistory({ product }) {
  const [dateDir, setDateDir] = useState("desc");
  const data = product.priceHistory;
  const prices = data.map((d) => d.unitPrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const minEntry = data.find((d) => d.unitPrice === min);
  const maxEntry = data.findLast((d) => d.unitPrice === max);
  const sortedData = dateDir === "desc" ? [...data].reverse() : [...data];

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="pb-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold leading-snug">{product.name}</h2>
            {product.brand && (
              <p className="mt-0.5 text-sm font-medium text-muted-foreground">{product.brand}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            <CategoryBadge category={product.category} />
            <a
              href={`https://www.ebag.bg/?product=${product.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ExternalLink size={12} />
              Виж в eBag
            </a>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-1">
          <StatTile variant="sheet" label="Покупки" value={product.count} color="#6366f1" icon={ShoppingCart} />
          <StatTile variant="sheet" label="Общо похарчено" value={`${fmt(product.totalSpend)} €`} color="var(--brand)" icon={CreditCard} />
          <StatTile variant="sheet" label="Средна цена" value={`${fmt(product.avgPrice)} €`} color="#f59e0b" icon={BarChart2} />
        </div>
      </div>

      {/* Price chart */}
      <div>
        <SectionHeader icon={TrendingUp}>История на цената</SectionHeader>
        {data.length < 2 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border bg-muted/20 text-sm text-muted-foreground">
            Само една покупка — няма история на цената.
          </div>
        ) : (
          <>
            <ChartContainer config={priceChartConfig} className="h-52 w-full">
              <LineChart data={data} margin={{ left: 0, right: 16, top: 16 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} unit=" €" width={72} domain={["auto", "auto"]} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v, _, item) => [
                        <span className="tabular-nums">{fmt(v)} €{item.payload.wasPromo ? " 🟢 промоция" : ""}</span>,
                      ]}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="unitPrice"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return <circle key={payload.date} cx={cx} cy={cy} r={payload.wasPromo ? 4 : 3} fill={payload.wasPromo ? "#10b981" : "var(--chart-1)"} stroke="#fff" strokeWidth={1.5} />;
                  }}
                />
                {minEntry && (
                  <ReferenceDot x={minEntry.date} y={minEntry.unitPrice} r={6} fill="#10b981" stroke="#fff" strokeWidth={1.5} label={{ value: `мин ${fmt(min)}`, position: "top", fontSize: 10, fill: "#10b981" }} />
                )}
                {maxEntry && maxEntry.date !== minEntry?.date && (
                  <ReferenceDot x={maxEntry.date} y={maxEntry.unitPrice} r={6} fill="#ef4444" stroke="#fff" strokeWidth={1.5} label={{ value: `макс ${fmt(max)}`, position: "top", fontSize: 10, fill: "#ef4444" }} />
                )}
              </LineChart>
            </ChartContainer>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span><span className="inline-block size-2 rounded-full bg-[var(--chart-1)] mr-1" />редовна цена</span>
              <span><span className="inline-block size-2 rounded-full bg-emerald-500 mr-1" />промоция</span>
            </div>
          </>
        )}
      </div>

      {/* Purchases table */}
      <div>
        <SectionHeader icon={ShoppingCart}>{product.count} покупки</SectionHeader>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead
                  className="pl-4 cursor-pointer select-none hover:text-foreground whitespace-nowrap"
                  onClick={() => setDateDir((d) => d === "desc" ? "asc" : "desc")}
                >
                  Дата
                  <SortIcon col="date" sortKey="date" dir={dateDir} />
                </TableHead>
                <TableHead className="text-right">Цена</TableHead>
                <TableHead className="text-right pr-4">Поръчка</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((entry) => {
                const isMin = entry.unitPrice === min;
                const isMax = entry.unitPrice === max;
                return (
                  <TableRow key={entry.orderId} className="hover:bg-muted/30">
                    <TableCell className="pl-4 text-muted-foreground">{fmtDate(entry.date)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      <span className={isMin ? "text-emerald-500" : isMax ? "text-red-500" : ""}>
                        {fmt(entry.unitPrice)} €
                      </span>
                      {entry.wasPromo && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1.5 inline-block size-2 rounded-full bg-emerald-500 cursor-default align-middle" />
                          </TooltipTrigger>
                          <TooltipContent>Промоционална цена</TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a href={`https://www.ebag.bg/orders/${entry.orderId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
                            <ExternalLink size={13} />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>Виж в eBag</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default function Products({ productList }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [sortKey, setSortKey] = useState("count");
  const [sortDir, setSortDir] = useState("desc");
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);

  const categories = useMemo(
    () => [...new Set(productList.map((p) => p.category))].sort(),
    [productList]
  );

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }

  function handleSearch(v) { setSearch(v); setPage(0); }
  function handleCategoryFilter(v) { setCategoryFilter(v); setPage(0); }
  function handlePageSize(v) { setPageSize(v); setPage(0); }

  const filtered = useMemo(() =>
    productList.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter.length === 0 || categoryFilter.includes(p.category);
      return matchesSearch && matchesCategory;
    }),
    [productList, search, categoryFilter]
  );

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = typeof av === "number" ? av - bv : av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 px-6 py-8">
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="!w-[60vw] !max-w-none overflow-y-auto p-8 pt-14">
          {selected && <PriceHistory product={selected} />}
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Продукти
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Търси продукт или марка..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-64"
            />
            <CategoryFilter
              categories={categories}
              selected={categoryFilter}
              onChange={handleCategoryFilter}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Продукт</TableHead>
                <TableHead>Категория</TableHead>
                <SortHead col="count" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="text-right">Покупки</SortHead>
                <SortHead col="totalSpend" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="text-right">Общо</SortHead>
                <TableHead className="text-right">Ср. цена</TableHead>
                <TableHead className="text-right">Последна цена</TableHead>
                <SortHead col="firstPurchase" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="text-right">Първа покупка</SortHead>
                <SortHead col="lastPurchase" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="text-right">Последна покупка</SortHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((p) => {
                const lastPrice = p.priceHistory.at(-1)?.unitPrice;
                return (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => setSelected(p)}
                  >
                    <TableCell>
                      <p className="font-medium" title={p.name.length > 50 ? p.name : undefined}>
                        {p.name.length > 50 ? p.name.slice(0, 50) + "…" : p.name}
                      </p>
                      {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={p.category} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{p.count}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(p.totalSpend)} €</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(p.avgPrice)} €</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {lastPrice != null ? `${fmt(lastPrice)} €` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {p.firstPurchase ? fmtDate(p.firstPurchase) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {p.lastPurchase ? fmtDate(p.lastPurchase) : "—"}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a href={`https://www.ebag.bg/?product=${p.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
                            <ExternalLink size={13} />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>Виж в eBag</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    Няма намерени продукти
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={sorted.length}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={handlePageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
