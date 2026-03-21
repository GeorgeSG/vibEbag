import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export function TablePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 0; i < totalPages; i++) {
    if (i < 2 || i >= totalPages - 2 || Math.abs(i - page) <= 1) pages.push(i);
  }
  const items = [];
  let prev = -1;
  for (const i of pages) {
    if (i - prev > 1) items.push("ellipsis-" + i);
    items.push(i);
    prev = i;
  }

  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <span>
          {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} от {total}
        </span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-7 w-auto text-xs">
            <span>{pageSize} на страница</span>
          </SelectTrigger>
          <SelectContent>
            {[15, 25, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)} className="text-xs">
                {n} на страница
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="rounded px-2 py-1 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          ←
        </button>
        {items.map((item) =>
          typeof item === "string" ? (
            <span key={item} className="px-1">
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              className={`rounded px-2 py-1 transition-colors ${item === page ? "bg-primary text-primary-foreground" : "hover:bg-muted hover:text-foreground"}`}
            >
              {item + 1}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages - 1}
          className="rounded px-2 py-1 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
        >
          →
        </button>
      </div>
    </div>
  );
}
