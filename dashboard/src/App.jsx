import { Component, useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { Moon, Sun, Heart, Bot, RefreshCw, CheckCircle2, AlertCircle, X, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { processOrders } from "./data/processOrders";
import { useTheme } from "./hooks/useTheme";
import Overview from "./pages/Overview";
import Products from "./pages/Products";
import Orders from "./pages/Orders";

// --- ErrorBoundary ---

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <AlertCircle size={40} className="text-destructive" />
          <h2 className="text-lg font-semibold">Нещо се обърка</h2>
          <p className="max-w-md text-sm text-muted-foreground">{this.state.error.message}</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="mt-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Презареди
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- SyncPanel ---

function SyncPanel({ state, logs, onClose }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [logs]);

  if (state === "idle") return null;

  const lines = logs.split("\n").map((l) => l.split("\r").at(-1)).filter(Boolean);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 rounded-lg border bg-background shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2 text-sm font-medium">
          {state === "running" && <RefreshCw size={13} className="animate-spin text-muted-foreground" />}
          {state === "done" && <CheckCircle2 size={13} className="text-emerald-500" />}
          {state === "error" && <AlertCircle size={13} className="text-destructive" />}
          <span>
            {state === "running" ? "Синхронизира..." : state === "done" ? "Готово" : "Грешка"}
          </span>
        </div>
        {state !== "running" && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={13} />
          </button>
        )}
      </div>
      <div className="h-48 overflow-y-auto p-3 font-mono text-xs text-muted-foreground bg-muted/20">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre leading-relaxed">{line}</div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// --- LoginForm ---

function LoginForm({ onSubmit, state, logs }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [logs]);

  const lines = logs.split("\n").map((l) => l.split("\r").at(-1)).filter(Boolean);
  const running = state === "running";

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(email, password);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">
            Вход в vib<span style={{ color: "var(--brand)" }}>Ebag</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
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
              {running
                ? <><RefreshCw size={14} className="animate-spin" /> Влизане...</>
                : <><LogIn size={14} /> Влез</>}
            </Button>
          </form>

          {state !== "idle" && (
            <div className="rounded-md border overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/50 text-xs font-medium">
                {state === "running" && <RefreshCw size={11} className="animate-spin text-muted-foreground" />}
                {state === "done" && <CheckCircle2 size={11} className="text-emerald-500" />}
                {state === "error" && <AlertCircle size={11} className="text-destructive" />}
                <span className="text-muted-foreground">
                  {state === "running" ? "Влизане..." : state === "done" ? "Готово" : "Грешка"}
                </span>
              </div>
              <div className="h-32 overflow-y-auto p-2 font-mono text-xs text-muted-foreground bg-muted/20">
                {lines.map((line, i) => (
                  <div key={i} className="whitespace-pre leading-relaxed">{line}</div>
                ))}
                <div ref={bottomRef} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- App ---

export default function App() {
  const [status, setStatus] = useState(null);   // null | { hasCredentials, hasCookies, email }
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const { theme, toggle } = useTheme();
  const [syncState, setSyncState] = useState("idle");
  const [syncLogs, setSyncLogs] = useState("");
  const [loginState, setLoginState] = useState("idle");
  const [loginLogs, setLoginLogs] = useState("");

  const loadData = useCallback(() => {
    setLoadError(null);
    fetch("/data/order-details.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Грешка при зареждане на данните (${r.status})`);
        return r.json();
      })
      .then((raw) => setData(processOrders(raw)))
      .catch((err) => setLoadError(err.message));
  }, []);

  function fetchStatus(thenLoadData = false) {
    fetch("/api/status")
      .then((r) => {
        if (!r.ok) throw new Error(`Грешка при проверка на статуса (${r.status})`);
        return r.json();
      })
      .then((s) => {
        setStatus(s);
        if (thenLoadData && s.hasCredentials) loadData();
      })
      .catch((err) => setLoadError(err.message));
  }

  useEffect(() => { fetchStatus(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startLogin(email, password) {
    setLoginState("running");
    setLoginLogs("");

    fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then((r) => {
      if (!r.ok) throw new Error("Failed to save credentials");

      const es = new EventSource("/api/login");
      const timeout = setTimeout(() => {
        setLoginLogs((prev) => prev + "\nВремето за изчакване изтече.");
        setLoginState("error");
        es.close();
      }, 5 * 60 * 1000);
      es.onmessage = (e) => {
        const { type, text } = JSON.parse(e.data);
        if (type === "log") {
          setLoginLogs((prev) => prev + text);
        } else if (type === "done") {
          clearTimeout(timeout);
          setLoginState("done");
          es.close();
          fetchStatus(true);
        } else if (type === "error") {
          clearTimeout(timeout);
          setLoginLogs((prev) => prev + "\n" + text);
          setLoginState("error");
          es.close();
        }
      };
      es.onerror = () => { clearTimeout(timeout); setLoginState("error"); es.close(); };
    }).catch(() => setLoginState("error"));
  }

  function startSync() {
    setSyncState("running");
    setSyncLogs("");
    const es = new EventSource("/api/scrape");
    const timeout = setTimeout(() => {
      setSyncLogs((prev) => prev + "\nВремето за изчакване изтече.");
      setSyncState("error");
      es.close();
    }, 5 * 60 * 1000);
    es.onmessage = (e) => {
      const { type, text } = JSON.parse(e.data);
      if (type === "log") {
        setSyncLogs((prev) => prev + text);
      } else if (type === "done") {
        clearTimeout(timeout);
        setSyncState("done");
        es.close();
        loadData();
      } else if (type === "error") {
        clearTimeout(timeout);
        setSyncLogs((prev) => prev + "\n" + text);
        setSyncState("error");
        es.close();
      }
    };
    es.onerror = () => { clearTimeout(timeout); setSyncState("error"); es.close(); };
  }

  // Still loading status
  if (!status) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Зарежда...</p>
      </div>
    );
  }

  // No credentials yet — show login form
  if (!status.hasCredentials) {
    return (
      <TooltipProvider>
        <LoginForm onSubmit={startLogin} state={loginState} logs={loginLogs} />
      </TooltipProvider>
    );
  }

  const navClass = ({ isActive }) =>
    `text-sm transition-colors px-1 pb-0.5 border-b-2 ${
      isActive
        ? "border-[var(--brand)] text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`;

  return (
    <BrowserRouter>
      <TooltipProvider><div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
            <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <img src="/logo.svg" alt="vibEbag logo" className="h-10 w-10 rounded-lg" />
              <span>vib<span style={{ color: "var(--brand)" }}>Ebag</span></span>
            </NavLink>
            <nav className="flex items-center gap-5 ml-2">
              <NavLink to="/" end className={navClass}>Преглед</NavLink>
              <NavLink to="/products" className={navClass}>
                Продукти
                {data && <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">{data.productList.length}</Badge>}
              </NavLink>
              <NavLink to="/orders" className={navClass}>
                Поръчки
                {data && <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">{data.totalOrders}</Badge>}
              </NavLink>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={startSync}
                disabled={syncState === "running"}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Синхронизирай данните"
              >
                <RefreshCw size={16} className={syncState === "running" ? "animate-spin" : ""} />
              </button>
              <button
                onClick={toggle}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Превключи тема"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </header>

        {loadError ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
            <AlertCircle size={32} className="text-destructive" />
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <button
              onClick={() => loadData()}
              className="mt-1 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Опитай отново
            </button>
          </div>
        ) : data ? (
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Overview data={data} />} />
              <Route path="/products" element={<Products productList={data.productList} />} />
              <Route path="/orders" element={<Orders orderList={data.orderList} />} />
            </Routes>
          </ErrorBoundary>
        ) : (
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-muted-foreground">Зарежда...</p>
          </div>
        )}

        <footer className="border-t py-6 text-center text-xs text-muted-foreground/60">
          <span className="inline-flex items-center gap-1.5">
            Made with <Heart size={11} className="text-red-400 fill-red-400" /> and <Bot size={11} className="text-blue-400" /> by{" "}
            <a href="https://gar.dev" target="_blank" rel="noopener noreferrer" className="hover:text-muted-foreground transition-colors">gar.dev</a>
          </span>
        </footer>

        <SyncPanel
          state={syncState}
          logs={syncLogs}
          onClose={() => setSyncState("idle")}
        />
      </div>
      </TooltipProvider>
    </BrowserRouter>
  );
}
