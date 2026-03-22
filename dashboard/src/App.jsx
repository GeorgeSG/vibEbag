import { Component, useCallback, useEffect, useState } from "react";
import { BrowserRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  Moon,
  Sun,
  Heart,
  Bot,
  RefreshCw,
  AlertCircle,
  LogIn,
  Crosshair,
  Download,
  Cookie,
  Tag,
} from "lucide-react";
import { LogViewer } from "@/components/ui/log-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useTheme } from "./hooks/useTheme";
import Overview from "./pages/Overview";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import PriceGame from "./pages/PriceGame";
import Categorizer from "./pages/Categorizer";

// --- AnimatedRoutes ---

function AnimatedRoutes({ data, onReload }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-fade-in">
      <Routes location={location}>
        <Route path="/" element={<Overview data={data} />} />
        <Route
          path="/products"
          element={<Products productList={data.productList} onReload={onReload} />}
        />
        <Route path="/orders" element={<Orders orderList={data.orderList} />} />
        <Route path="/realitest" element={<PriceGame productList={data.productList} />} />
        <Route path="/categorizer" element={<Categorizer />} />
      </Routes>
    </div>
  );
}

// --- ErrorBoundary ---

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <AlertCircle size={40} className="text-destructive" />
          <h2 className="text-lg font-semibold">Нещо се обърка</h2>
          <p className="max-w-md text-sm text-muted-foreground">{this.state.error.message}</p>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
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

function SyncPanel({ state, logs, onClose, onRelogin }) {
  if (state === "idle") return null;
  return (
    <LogViewer
      state={state}
      logs={logs}
      onClose={onClose}
      variant="floating"
      onRelogin={state === "session-expired" ? onRelogin : undefined}
    />
  );
}

// --- LoginForm ---

function LoginForm({ onLoginWithCredentials, onLoginWithCookie, state, logs }) {
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

// --- App ---

export default function App() {
  const [status, setStatus] = useState(null); // null | { hasCredentials, hasCookies, email }
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [noData, setNoData] = useState(false);
  const { theme, toggle } = useTheme();
  const [syncState, setSyncState] = useState("idle");
  const [syncLogs, setSyncLogs] = useState("");
  const [loginState, setLoginState] = useState("idle");
  const [loginLogs, setLoginLogs] = useState("");

  const loadData = useCallback(() => {
    setLoadError(null);
    setNoData(false);
    fetch("/api/data")
      .then((r) => {
        if (r.status === 404) {
          setNoData(true);
          return null;
        }
        if (!r.ok) throw new Error(`Грешка при зареждане на данните (${r.status})`);
        return r.json();
      })
      .then((result) => {
        if (result) setData(result);
      })
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
        const loggedIn = s.hasCredentials || s.hasCookies;
        if (thenLoadData && loggedIn && s.hasData) loadData();
        else if (thenLoadData && loggedIn && !s.hasData) setNoData(true);
      })
      .catch((err) => setLoadError(err.message));
  }

  useEffect(() => {
    fetchStatus(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startLogin(email, password) {
    setLoginState("running");
    setLoginLogs("");

    fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to save credentials");

        const es = new EventSource("/api/login");
        const timeout = setTimeout(
          () => {
            setLoginLogs((prev) => prev + "\nВремето за изчакване изтече.");
            setLoginState("error");
            es.close();
          },
          5 * 60 * 1000,
        );
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
        es.onerror = () => {
          clearTimeout(timeout);
          setLoginState("error");
          es.close();
        };
      })
      .catch(() => setLoginState("error"));
  }

  function startCookieLogin(sessionid) {
    setLoginState("running");
    setLoginLogs("Запазване на сесийна бисквитка...\n");

    fetch("/api/cookies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionid }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.text().catch(() => "");
          const detail = `${r.status} ${r.statusText}: ${body}`;
          console.error("Cookie save failed:", detail);
          throw new Error(detail);
        }
        setLoginLogs((prev) => prev + "Готово.\n");
        setLoginState("done");
        fetchStatus(true);
      })
      .catch((err) => {
        console.error("Cookie save error:", err);
        setLoginLogs((prev) => prev + "Грешка при запазване на бисквитката.\n");
        setLoginState("error");
      });
  }

  function startSync() {
    setSyncState("running");
    setSyncLogs("");
    const es = new EventSource("/api/scrape");
    const timeout = setTimeout(
      () => {
        setSyncLogs((prev) => prev + "\nВремето за изчакване изтече.");
        setSyncState("error");
        es.close();
      },
      5 * 60 * 1000,
    );
    es.onmessage = (e) => {
      const { type, text } = JSON.parse(e.data);
      if (type === "log") {
        setSyncLogs((prev) => prev + text);
      } else if (type === "done") {
        clearTimeout(timeout);
        setSyncState("done");
        es.close();
        loadData();
      } else if (type === "session-expired") {
        clearTimeout(timeout);
        setSyncLogs((prev) => prev + "\n" + text);
        setSyncState("session-expired");
        es.close();
      } else if (type === "error") {
        clearTimeout(timeout);
        setSyncLogs((prev) => prev + "\n" + text);
        setSyncState("error");
        es.close();
      }
    };
    es.onerror = () => {
      clearTimeout(timeout);
      setSyncState("error");
      es.close();
    };
  }

  // Still loading status
  if (!status) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Зарежда...</p>
      </div>
    );
  }

  // No credentials or cookies yet — show login form
  if (!status.hasCredentials && !status.hasCookies) {
    return (
      <TooltipProvider>
        <LoginForm
          onLoginWithCredentials={startLogin}
          onLoginWithCookie={startCookieLogin}
          state={loginState}
          logs={loginLogs}
        />
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
      <TooltipProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
              <NavLink
                to="/"
                className="flex items-center gap-2 text-lg font-semibold tracking-tight"
              >
                <img src="/logo.svg" alt="vibEbag logo" className="h-10 w-10 rounded-lg" />
                <span>
                  vib<span style={{ color: "var(--brand)" }}>Ebag</span>
                </span>
              </NavLink>
              <nav className="flex items-center gap-5 ml-2">
                <NavLink to="/" end className={navClass}>
                  Преглед
                </NavLink>
                <NavLink to="/products" className={navClass}>
                  Продукти
                  {data && (
                    <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                      {data.productList.length}
                    </Badge>
                  )}
                </NavLink>
                <NavLink to="/orders" className={navClass}>
                  Поръчки
                  {data && (
                    <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                      {data.totalOrders}
                    </Badge>
                  )}
                </NavLink>
                <NavLink to="/realitest" className={navClass}>
                  <Crosshair size={14} className="mr-1 inline" />
                  Реалитест
                </NavLink>
                <NavLink to="/categorizer" className={navClass}>
                  <Tag size={14} className="mr-1 inline" />
                  Категоризатор
                </NavLink>
              </nav>
              <div className="ml-auto flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={startSync}
                      disabled={syncState === "running"}
                      className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                      aria-label="Синхронизирай данните"
                    >
                      <RefreshCw
                        size={16}
                        className={syncState === "running" ? "animate-spin" : ""}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Синхронизирай</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggle}
                      className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Превключи тема"
                    >
                      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{theme === "dark" ? "Светла тема" : "Тъмна тема"}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </header>

          <main className="flex-1">
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
            ) : noData ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
                <Download size={40} className="text-muted-foreground" />
                <h2 className="text-lg font-semibold">Няма заредени данни</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Натисни бутона по-долу, за да изтеглиш поръчките си от eBag.
                </p>
                <Button onClick={startSync} disabled={syncState === "running"}>
                  {syncState === "running" ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Синхронизиране...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} /> Синхронизирай
                    </>
                  )}
                </Button>
              </div>
            ) : data ? (
              <ErrorBoundary>
                <AnimatedRoutes data={data} onReload={loadData} />
              </ErrorBoundary>
            ) : (
              <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">Зарежда...</p>
              </div>
            )}
          </main>

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

          <SyncPanel
            state={syncState}
            logs={syncLogs}
            onClose={() => setSyncState("idle")}
            onRelogin={() => {
              setSyncState("idle");
              setStatus({ ...status, hasCredentials: false, hasCookies: false });
            }}
          />
        </div>
      </TooltipProvider>
    </BrowserRouter>
  );
}
