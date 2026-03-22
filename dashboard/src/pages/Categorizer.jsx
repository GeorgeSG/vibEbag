import { useState, useRef, useCallback } from "react";
import { Check, ExternalLink, SkipForward, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categoryColor } from "@/lib/categoryColors";

function useUncategorized() {
  const [data, setData] = useState({ products: [], categories: [], loading: true });

  const load = useCallback(() => {
    setData((d) => ({ ...d, loading: true }));
    fetch("/api/uncategorized")
      .then((r) => r.json())
      .then(({ products, categories }) => setData({ products, categories, loading: false }))
      .catch(() => setData((d) => ({ ...d, loading: false })));
  }, []);

  const initialized = useRef(null);
  if (initialized.current == null) {
    initialized.current = true;
    load();
  }

  return { ...data, reload: load };
}

export default function Categorizer() {
  const { products, categories, loading, reload } = useUncategorized();
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(0);
  const [skipped, setSkipped] = useState([]);

  const total = products.length;
  const current = products[index];
  const remaining = total - done - skipped.length;

  function categorize(category) {
    if (!current) return;
    fetch("/api/categorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: current.id, category }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        setDone((d) => d + 1);
        advance();
      })
      .catch((err) => console.error("Categorize failed:", err));
  }

  function skip() {
    if (!current) return;
    setSkipped((s) => [...s, current.id]);
    advance();
  }

  function advance() {
    let next = index + 1;
    while (next < products.length && skipped.includes(products[next]?.id)) {
      next++;
    }
    setIndex(next);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Зарежда...</p>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12 text-center">
        <Check size={48} className="mx-auto mb-4 text-emerald-500" />
        <h2 className="text-lg font-semibold">Всички продукти са категоризирани</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Няма продукти в категория &quot;Друго&quot;.
        </p>
      </div>
    );
  }

  const finished = index >= products.length || remaining <= 0;

  if (finished) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12 text-center">
        <Check size={48} className="mx-auto mb-4 text-emerald-500" />
        <h2 className="text-lg font-semibold">Готово!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Категоризирани: {done} от {total} продукта.
          {skipped.length > 0 && ` Пропуснати: ${skipped.length}.`}
        </p>
        <Button onClick={reload} className="mt-4">
          Презареди
        </Button>
      </div>
    );
  }

  const pct = total > 0 ? ((done / total) * 100).toFixed(0) : 0;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            <Tag size={14} className="mr-1 inline -mt-0.5" />
            {done} от {total} категоризирани
          </span>
          <span className="font-medium">{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: "var(--brand)" }}
          />
        </div>
      </div>

      {/* Product card */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 p-5">
          <img
            src={`https://www.ebag.bg/products/${current.id}/images/0/200/webp`}
            alt={current.name}
            className="h-20 w-20 shrink-0 rounded-md border object-contain bg-white"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold leading-tight">{current.name}</h2>
            {current.brand && (
              <p className="mt-0.5 text-sm text-muted-foreground">{current.brand}</p>
            )}
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span>Купуван {current.count}×</span>
              <a
                href={`https://www.ebag.bg/?product=${current.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ExternalLink size={12} /> Виж в eBag
              </a>
            </div>
          </div>
          <Badge
            className="shrink-0"
            style={{
              backgroundColor: categoryColor("Друго") + "22",
              borderColor: categoryColor("Друго") + "55",
              color: categoryColor("Друго"),
            }}
          >
            Друго
          </Badge>
        </CardContent>
      </Card>

      {/* Category buttons */}
      <div className="mb-4">
        <p className="mb-3 text-sm font-medium text-muted-foreground">Избери категория:</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => categorize(cat)}
              className="cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: categoryColor(cat) + "22",
                borderColor: categoryColor(cat) + "55",
                color: categoryColor(cat),
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skip */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={skip} className="text-muted-foreground">
          <SkipForward size={14} className="mr-1" /> Пропусни
        </Button>
      </div>
    </div>
  );
}
