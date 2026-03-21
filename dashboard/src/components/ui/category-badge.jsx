import { Badge } from "@/components/ui/badge";
import { categoryColor } from "@/lib/categoryColors";

export function CategoryBadge({ category, className }) {
  const color = categoryColor(category);
  return (
    <Badge
      variant="outline"
      className={`text-xs ${className ?? ""}`}
      style={{ backgroundColor: color + "22", color, borderColor: color + "55" }}
    >
      {category}
    </Badge>
  );
}
