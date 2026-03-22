import { useEffect, useRef } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, X, LogIn } from "lucide-react";

function parseLines(logs) {
  return logs
    .split("\n")
    .map((l) => l.split("\r").at(-1))
    .filter(Boolean);
}

function StatusIcon({ state, size = 13 }) {
  if (state === "running")
    return <RefreshCw size={size} className="animate-spin text-muted-foreground" />;
  if (state === "done") return <CheckCircle2 size={size} className="text-emerald-500" />;
  if (state === "error" || state === "session-expired")
    return <AlertCircle size={size} className="text-destructive" />;
  return null;
}

/**
 * variant="floating" — fixed bottom-right panel (SyncPanel)
 * variant="inline"   — inline bordered box (LoginForm)
 */
export function LogViewer({ state, logs, onClose, variant = "floating", labels, onRelogin }) {
  const bottomRef = useRef(null);
  const lines = parseLines(logs);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [logs]);

  const statusText =
    state === "running"
      ? (labels?.running ?? "Синхронизира...")
      : state === "done"
        ? (labels?.done ?? "Готово")
        : state === "session-expired"
          ? "Сесията е изтекла"
          : (labels?.error ?? "Грешка");

  if (variant === "inline") {
    return (
      <div className="rounded-md border overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/50 text-xs font-medium">
          <StatusIcon state={state} size={11} />
          <span className="text-muted-foreground">{statusText}</span>
        </div>
        <div className="h-32 overflow-y-auto p-2 font-mono text-xs text-muted-foreground bg-muted/20">
          {lines.map((line, i) => (
            <div key={i} className="whitespace-pre leading-relaxed">
              {line}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[30rem] rounded-lg border bg-background shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2 text-sm font-medium">
          <StatusIcon state={state} />
          <span>{statusText}</span>
        </div>
        {state !== "running" && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>
      <div className="h-64 overflow-y-auto p-3 font-mono text-xs text-muted-foreground bg-muted/20">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre leading-relaxed">
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {onRelogin && (
        <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/50">
          <span className="text-xs text-muted-foreground">Сесията е изтекла</span>
          <button
            onClick={onRelogin}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <LogIn size={12} />
            Влез отново
          </button>
        </div>
      )}
    </div>
  );
}
