import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryColor } from "@/lib/categoryColors";

export function CategoryFilter({ categories, selected, onChange }) {
  function toggle(cat) {
    onChange(selected.includes(cat) ? selected.filter((c) => c !== cat) : [...selected, cat]);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex h-8 min-w-40 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <span className="flex items-center gap-1 overflow-hidden">
            {selected.length === 0 ? (
              "Категории"
            ) : (
              <>
                {selected.slice(0, 2).map((c) => (
                  <Badge
                    key={c}
                    variant="outline"
                    className="text-xs py-0 shrink-0"
                    style={{
                      backgroundColor: categoryColor(c) + "22",
                      color: categoryColor(c),
                      borderColor: categoryColor(c) + "55",
                    }}
                  >
                    {c}
                  </Badge>
                ))}
                {selected.length > 2 && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    +{selected.length - 2}
                  </span>
                )}
              </>
            )}
          </span>
          <ChevronDown size={14} className="shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="end">
        <div className="flex items-center justify-between px-2 py-1.5 mb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Категории
          </span>
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X size={12} /> Изчисти
            </button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {categories.map((cat) => {
            const active = selected.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggle(cat)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                  active && "text-foreground font-medium",
                )}
              >
                <div
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border",
                    active ? "border-transparent text-white" : "border-input",
                  )}
                  style={active ? { backgroundColor: categoryColor(cat) } : {}}
                >
                  {active && <Check size={11} />}
                </div>
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: categoryColor(cat) }}
                />
                {cat}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
