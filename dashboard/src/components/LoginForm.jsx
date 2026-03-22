import { useState } from "react";
import { RefreshCw, LogIn, Cookie } from "lucide-react";
import { LogViewer } from "@/components/ui/log-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm({ onLoginWithCredentials, onLoginWithCookie, state, logs }) {
  const [mode, setMode] = useState("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionid, setSessionid] = useState("");
  const running = state === "running";

  function handleCredentialsSubmit(e) {
    e.preventDefault();
    onLoginWithCredentials(email, password);
  }

  function handleCookieSubmit(e) {
    e.preventDefault();
    onLoginWithCookie(sessionid);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <img src="/logo.svg" alt="vibEbag" className="mb-6 h-24 w-24" />
      <Card className={`w-full ${mode === "cookie" ? "max-w-lg" : "max-w-sm"} transition-all`}>
        <CardHeader>
          <CardTitle className="text-base">
            Вход в vib<span style={{ color: "var(--brand)" }}>Ebag</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-1 rounded-md bg-muted p-1">
            <button
              type="button"
              className={`flex-1 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${mode === "credentials" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setMode("credentials")}
              disabled={running}
            >
              <LogIn size={12} className="inline mr-1 -mt-0.5" />
              Имейл и парола
            </button>
            <button
              type="button"
              className={`flex-1 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${mode === "cookie" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setMode("cookie")}
              disabled={running}
            >
              <Cookie size={12} className="inline mr-1 -mt-0.5" />
              Session cookie
            </button>
          </div>

          {mode === "credentials" ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Работи само с eBag акаунт. Ако влизаш с Google, Apple или Facebook, използвай
                Session cookie.
              </p>
              <Input
                type="email"
                placeholder="Имейл"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={running}
                required
              />
              <Input
                type="password"
                placeholder="Парола"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={running}
                required
              />
              <Button type="submit" className="w-full" disabled={running || !email || !password}>
                {running ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Влизане...
                  </>
                ) : (
                  <>
                    <LogIn size={14} /> Влез
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCookieSubmit} className="space-y-3">
              <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                <li>
                  Влез в{" "}
                  <a
                    href="https://www.ebag.bg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    ebag.bg
                  </a>
                </li>
                <li>
                  Отвори DevTools (F12) → таб <strong>Application</strong>
                </li>
                <li>
                  Cookies → <strong>https://www.ebag.bg</strong>
                </li>
                <li>
                  Копирай стойността на{" "}
                  <code className="rounded bg-muted px-1 font-mono">sessionid</code>
                </li>
              </ol>
              <img
                src="/session-cookie-guide.png"
                alt="Как да намериш sessionid в DevTools"
                className="rounded-md border"
              />
              <Input
                type="text"
                placeholder="sessionid"
                value={sessionid}
                onChange={(e) => setSessionid(e.target.value)}
                disabled={running}
                className="font-mono text-xs"
                required
              />
              <Button type="submit" className="w-full" disabled={running || !sessionid}>
                {running ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Запазване...
                  </>
                ) : (
                  <>
                    <Cookie size={14} /> Запази и продължи
                  </>
                )}
              </Button>
            </form>
          )}

          {state !== "idle" && (
            <LogViewer
              state={state}
              logs={logs}
              variant="inline"
              labels={{ running: "Влизане...", done: "Готово", error: "Грешка" }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
