import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AlertCircle, Download, RefreshCw } from "lucide-react";
import { LogViewer } from "@/components/ui/log-viewer";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useTheme } from "./hooks/useTheme";
import { useSSE } from "./hooks/useSSE";
import { useMobileMenu } from "./hooks/useMobileMenu";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoginForm } from "./components/LoginForm";
import { AppHeader } from "./components/AppHeader";
import { MobileMenu } from "./components/MobileMenu";
import { AppFooter } from "./components/AppFooter";

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

// --- App ---

export default function App() {
  const [status, setStatus] = useState(null);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [noData, setNoData] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();
  const sync = useSSE();
  const login = useSSE();
  const menu = useMobileMenu();

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
    login.setState("running");
    login.setLogs("");

    fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to save credentials");
        login.run("/api/login", { onDone: () => fetchStatus(true) });
      })
      .catch(() => login.setState("error"));
  }

  function startCookieLogin(sessionid) {
    login.setState("running");
    login.setLogs("Запазване на сесийна бисквитка...\n");

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
        login.setLogs((prev) => prev + "Готово.\n");
        login.setState("done");
        fetchStatus(true);
      })
      .catch((err) => {
        console.error("Cookie save error:", err);
        login.setLogs((prev) => prev + "Грешка при запазване на бисквитката.\n");
        login.setState("error");
      });
  }

  function startSync() {
    sync.run("/api/scrape", { onDone: loadData });
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
          state={login.state}
          logs={login.logs}
        />
      </TooltipProvider>
    );
  }

  return (
    <BrowserRouter>
      <TooltipProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <AppHeader
            menu={menu}
            data={data}
            syncState={sync.state}
            onSync={startSync}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

          <MobileMenu menu={menu} data={data} />

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
                <Button onClick={startSync} disabled={sync.state === "running"}>
                  {sync.state === "running" ? (
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

          <AppFooter />

          <SyncPanel
            state={sync.state}
            logs={sync.logs}
            onClose={() => sync.reset()}
            onRelogin={() => {
              sync.reset();
              setStatus({ ...status, hasCredentials: false, hasCookies: false });
            }}
          />
        </div>
      </TooltipProvider>
    </BrowserRouter>
  );
}
