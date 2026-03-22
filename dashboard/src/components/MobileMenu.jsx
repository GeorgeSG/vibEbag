import { NavLink } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { NAV_ITEMS, getBadge } from "@/config/navItems";

const mobileNavClass = ({ isActive }) =>
  `flex items-center gap-2.5 rounded-lg px-4 py-3 text-base transition-colors ${
    isActive
      ? "bg-muted text-foreground font-medium"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;

export function MobileMenu({ menu, data }) {
  if (!menu.menuVisible) return null;

  return (
    <div
      className="fixed inset-0 top-[73px] z-40 md:hidden"
      style={{
        backgroundColor: menu.menuClosing
          ? "transparent"
          : "color-mix(in oklch, var(--color-background) 95%, transparent)",
        backdropFilter: menu.menuClosing ? "blur(0px)" : "blur(8px)",
        transition: "background-color 400ms, backdrop-filter 400ms",
      }}
    >
      <nav className="flex flex-col gap-1 px-4 py-4">
        {NAV_ITEMS.map((item, i) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={mobileNavClass}
            onClick={menu.close}
            style={{
              opacity: menu.menuClosing ? 0 : 1,
              transform: menu.menuClosing ? "translateX(-20px)" : "translateX(0)",
              transition: menu.menuClosing
                ? `opacity 250ms ${i * 40}ms, transform 250ms ${i * 40}ms`
                : `opacity 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 60 + 50}ms, transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 60 + 50}ms`,
              animation: !menu.menuClosing
                ? `menuItemIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 60 + 50}ms both`
                : "none",
            }}
          >
            <item.icon size={16} className="shrink-0" />
            {item.label}
            {getBadge(data, item.badgeKey) != null && (
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                {getBadge(data, item.badgeKey)}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
