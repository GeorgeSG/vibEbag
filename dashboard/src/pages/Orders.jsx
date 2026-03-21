import { useState } from "react";
import { ShoppingCart, CreditCard, BadgePercent } from "lucide-react";

import { CategoryBadge } from "@/components/ui/category-badge";
import { EBagLink } from "@/components/ui/ebag-link";
import { StatTile } from "@/components/ui/stat-tile";
import { SortHead } from "@/components/ui/sort-icon";
import { SectionHeader } from "@/components/ui/section-header";
import { TablePagination } from "@/components/ui/table-pagination";
import { useTableState, sortData } from "@/hooks/useTableState";
import { fmt, fmtDate } from "@/lib/fmt";
import { productImg } from "@/lib/productImg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function OrderDetail({ order }) {
  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="pb-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold leading-snug">{fmtDate(order.date)}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground font-mono">{order.id}</p>
          </div>
          <EBagLink type="order" id={order.id} variant="button" className="mt-0.5" />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-1">
          <StatTile
            variant="sheet"
            label="Продукти"
            value={order.itemCount}
            color="#6366f1"
            icon={ShoppingCart}
          />
          <StatTile
            variant="sheet"
            label="Общо похарчено"
            value={`${fmt(order.total)} €`}
            color="var(--brand)"
            icon={CreditCard}
          />
          <StatTile
            variant="sheet"
            label="Спестено"
            value={`${fmt(order.saved)} €`}
            color="#10b981"
            icon={BadgePercent}
          />
        </div>
      </div>

      {/* Items table */}
      <div>
        <SectionHeader icon={ShoppingCart}>{order.itemCount} продукта</SectionHeader>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="pl-4">Продукт</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead className="text-right">Бр.</TableHead>
                <TableHead className="text-right">Ед. цена</TableHead>
                <TableHead className="text-right pr-4">Общо</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, i) => (
                <TableRow key={i} className="hover:bg-muted/30">
                  <TableCell className="pl-4 font-medium">
                    <div className="flex items-center gap-3">
                      {productImg(item.productId) && (
                        <img
                          src={productImg(item.productId)}
                          alt=""
                          className="size-8 rounded object-contain bg-white shrink-0"
                        />
                      )}
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CategoryBadge category={item.category} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {item.qty}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {fmt(item.unitPrice)} €
                  </TableCell>
                  <TableCell className="text-right tabular-nums pr-4">
                    <span className={item.wasPromo ? "text-emerald-500" : ""}>
                      {fmt(item.total)} €
                    </span>
                    {item.wasPromo && (
                      <span className="ml-1.5 inline-block size-2 rounded-full bg-emerald-500 align-middle" />
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    {item.productId && <EBagLink type="product" id={item.productId} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default function Orders({ orderList }) {
  const [selected, setSelected] = useState(null);
  const { sortKey, sortDir, page, pageSize, setPage, handleSort, handlePageSize } =
    useTableState("date");

  const sorted = sortData(orderList, sortKey, sortDir);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="!w-[60vw] !max-w-none overflow-y-auto p-8 pt-14">
          {selected && <OrderDetail order={selected} />}
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Поръчки
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead col="date" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>
                  Дата
                </SortHead>
                <TableHead>ID</TableHead>
                <SortHead
                  col="itemCount"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="text-right"
                >
                  Продукти
                </SortHead>
                <SortHead
                  col="total"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="text-right"
                >
                  Сума
                </SortHead>
                <SortHead
                  col="saved"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="text-right"
                >
                  Спестено
                </SortHead>
                <TableHead className="text-right">Линк</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => setSelected(o)}
                >
                  <TableCell className="font-medium">{fmtDate(o.date)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{o.id}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.itemCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(o.total)} €</TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-600">
                    {fmt(o.saved)} €
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <EBagLink type="order" id={o.id} />
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Няма намерени поръчки
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
