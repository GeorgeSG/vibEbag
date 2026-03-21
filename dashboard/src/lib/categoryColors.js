export const CATEGORY_COLORS = {
  "Млечни и яйца":           "#60a5fa", // blue
  "Плодове и зеленчуци":     "#16a34a", // green
  "Месо и риба":             "#f87171", // red
  "Колбаси и деликатеси":    "#fb923c", // orange
  "Замразени храни":         "#0891b2", // cyan
  "Основни храни и консерви":"#fbbf24", // amber
  "Напитки":                 "#a78bfa", // violet
  "Пекарна":                 "#d97706", // warm amber
  "Сладко и солено":         "#f472b6", // pink
  "Био":                     "#34d399", // emerald
  "Козметика и лична грижа": "#e879f9", // fuchsia
  "За дома и офиса":         "#94a3b8", // slate
  "Аптека":                  "#ef4444", // red
  "За бебето и детето":      "#c084fc", // purple
  "Сезонен асортимент":      "#138484", // ebag teal
  "Друго":                   "#6b7280", // gray
};

export function categoryColor(category) {
  return CATEGORY_COLORS[category] ?? "#6b7280";
}
