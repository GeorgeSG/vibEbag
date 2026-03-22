import { LayoutDashboard, ShoppingCart, ClipboardList, Crosshair, Tag } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", end: true, icon: LayoutDashboard, label: "Табло" },
  { to: "/products", icon: ShoppingCart, label: "Продукти", badgeKey: "productList.length" },
  { to: "/orders", icon: ClipboardList, label: "Поръчки", badgeKey: "totalOrders" },
  { to: "/realitest", icon: Crosshair, label: "Реалитест" },
  { to: "/categorizer", icon: Tag, label: "Категоризатор" },
];

export function getBadge(data, badgeKey) {
  if (!data || !badgeKey) return null;
  return badgeKey.split(".").reduce((obj, key) => obj?.[key], data);
}
