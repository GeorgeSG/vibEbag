import { NavLink } from "react-router-dom";
import { Moon, Sun, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NAV_ITEMS, getBadge } from "@/config/navItems";

const navClass = ({ isActive }) =>
  `inline-flex items-center gap-1.5 text-sm transition-colors rounded-lg px-3 py-2 ${
    isActive
      ? "bg-muted text-foreground font-medium"
      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
  }`;

function HamburgerButton({ open, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="md:hidden rounded-md p-2.5 text-muted-foreground hover:bg-muted"
      aria-label="Меню"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        style={{
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <line
          x1="4"
          y1="12"
          x2="20"
          y2="12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            transformOrigin: "12px 12px",
            transform: open ? "translateY(0) rotate(45deg)" : "translateY(-6px) rotate(0deg)",
            transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
        <line
          x1="4"
          y1="12"
          x2="20"
          y2="12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            opacity: open ? 0 : 1,
            transform: open ? "scaleX(0)" : "scaleX(1)",
            transition: open
              ? "opacity 200ms, transform 200ms"
              : "opacity 200ms 200ms, transform 200ms 200ms",
          }}
        />
        <line
          x1="4"
          y1="12"
          x2="20"
          y2="12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            transformOrigin: "12px 12px",
            transform: open ? "translateY(0) rotate(-45deg)" : "translateY(6px) rotate(0deg)",
            transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </svg>
    </button>
  );
}

export function AppHeader({ menu, data, syncState, onSync, theme, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 md:gap-6 md:px-6">
        <HamburgerButton open={menu.menuOpen} onToggle={menu.toggle} />
        <NavLink
          to="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          onClick={menu.close}
        >
          <img src="/logo.svg" alt="vibEbag logo" className="h-10 w-10 rounded-lg" />
          <span>
            vib<span style={{ color: "var(--brand)" }}>Ebag</span>
          </span>
        </NavLink>
        <nav className="hidden md:flex items-center gap-1 ml-2">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              <item.icon size={14} className="shrink-0" />
              {item.label}
              {getBadge(data, item.badgeKey) != null && (
                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                  {getBadge(data, item.badgeKey)}
                </Badge>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger
              onClick={onSync}
              disabled={syncState === "running"}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Синхронизирай данните"
            >
              <RefreshCw size={16} className={syncState === "running" ? "animate-spin" : ""} />
            </TooltipTrigger>
            <TooltipContent>Синхронизирай</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              onClick={onToggleTheme}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Превключи тема"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </TooltipTrigger>
            <TooltipContent>{theme === "dark" ? "Светла тема" : "Тъмна тема"}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
