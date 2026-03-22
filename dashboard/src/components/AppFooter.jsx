import { Heart, Bot } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="border-t py-6 text-center text-xs text-muted-foreground/60">
      <span className="inline-flex items-center gap-1.5">
        Made with <Heart size={11} className="text-red-400 fill-red-400" /> and{" "}
        <Bot size={11} className="text-blue-400" /> by{" "}
        <a
          href="https://gar.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground transition-colors"
        >
          gar.dev
        </a>
        <span className="text-muted-foreground/40">·</span>
        <a
          href="https://github.com/GeorgeSG/vibEbag"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          v{__APP_VERSION__}
        </a>
      </span>
    </footer>
  );
}
