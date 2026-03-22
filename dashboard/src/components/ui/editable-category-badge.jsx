import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { categoryColor } from "@/lib/categoryColors";

export function EditableCategoryBadge({ category, productId, categories, onCategorized }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const color = categoryColor(category);

  function handlePick(newCategory) {
    if (newCategory === category) {
      setOpen(false);
      return;
    }
    if (category !== "Друго") {
      setOpen(false);
      setConfirm(newCategory);
    } else {
      save(newCategory);
    }
  }

  function save(newCategory) {
    fetch("/api/categorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, category: newCategory }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        setOpen(false);
        setConfirm(null);
        if (onCategorized) onCategorized(productId, newCategory);
      })
      .catch((err) => console.error("Categorize failed:", err));
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <Badge
            variant="outline"
            className="text-xs hover:opacity-80 transition-opacity"
            style={{ backgroundColor: color + "22", color, borderColor: color + "55" }}
          >
            {category}
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="start" onClick={(e) => e.stopPropagation()}>
          <div className="px-2 py-1.5 mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Смени категорията
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {categories.map((cat) => {
              const c = categoryColor(cat);
              const active = cat === category;
              return (
                <button
                  key={cat}
                  onClick={() => handlePick(cat)}
                  className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted cursor-pointer ${active ? "font-medium text-foreground" : ""}`}
                >
                  <span className="size-2 shrink-0 rounded-full" style={{ background: c }} />
                  {cat}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Смяна на категория</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурен ли си, че искаш да промениш категорията от &quot;{category}&quot; на &quot;
              {confirm}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction onClick={() => save(confirm)}>Промени</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
