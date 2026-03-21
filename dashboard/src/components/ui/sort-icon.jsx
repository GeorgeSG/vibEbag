import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";

export function SortIcon({ col, sortKey, dir }) {
  if (col !== sortKey) return <ArrowUpDown size={13} className="ml-1 inline opacity-30" />;
  return dir === "asc"
    ? <ArrowUp size={13} className="ml-1 inline text-foreground" />
    : <ArrowDown size={13} className="ml-1 inline text-foreground" />;
}

export function SortHead({ col, sortKey, sortDir, onSort, children, className = "" }) {
  return (
    <TableHead
      className={`cursor-pointer select-none whitespace-nowrap hover:text-foreground ${className}`}
      onClick={() => onSort(col)}
    >
      {children}
      <SortIcon col={col} sortKey={sortKey} dir={sortDir} />
    </TableHead>
  );
}
