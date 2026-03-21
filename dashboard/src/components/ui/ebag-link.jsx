import { ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const URLS = {
  product: (id) => `https://www.ebag.bg/?product=${id}`,
  order: (id) => `https://www.ebag.bg/orders/${id}`,
};

/**
 * variant="icon"   — tooltip-wrapped icon only (for tables/lists)
 * variant="button"  — bordered button with "Виж в eBag" text (for sheet headers)
 */
export function EBagLink({ type, id, variant = "icon", className = "" }) {
  const href = URLS[type](id);

  if (variant === "button") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shrink-0 ${className}`}
      >
        <ExternalLink size={12} />
        Виж в eBag
      </a>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center text-muted-foreground hover:text-foreground transition-colors ${className}`}
        >
          <ExternalLink size={13} />
        </a>
      </TooltipTrigger>
      <TooltipContent>Виж в eBag</TooltipContent>
    </Tooltip>
  );
}
