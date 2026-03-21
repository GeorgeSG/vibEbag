import { Card, CardContent } from "@/components/ui/card";

/**
 * variant="page"  — Card wrapper, large text, optional sub-label. Used on Overview.
 * variant="sheet" — Plain div wrapper, smaller text, tabular nums. Used in detail sheets.
 */
export function StatTile({ label, value, sub, color, icon: Icon, variant = "page" }) {
  if (variant === "sheet") {
    return (
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="h-1 w-full" style={{ background: color }} />
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            {Icon && <Icon size={14} style={{ color }} className="opacity-70" />}
          </div>
          <p
            className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums"
            style={{ color }}
          >
            {value}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full" style={{ background: color }} />
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          {Icon && <Icon size={15} style={{ color }} className="opacity-70" />}
        </div>
        <p className="mt-2 text-3xl font-semibold tracking-tight" style={{ color }}>
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
