import { useState, useRef } from "react";

const TIMEOUT_MS = 5 * 60 * 1000;

export function useSSE() {
  const [state, setState] = useState("idle");
  const [logs, setLogs] = useState("");
  const cleanup = useRef(null);

  function run(url, { onDone, onSessionExpired } = {}) {
    cleanup.current?.();
    setState("running");
    setLogs("");

    const es = new EventSource(url);
    const timeout = setTimeout(() => {
      setLogs((prev) => prev + "\nВремето за изчакване изтече.");
      setState("error");
      es.close();
    }, TIMEOUT_MS);

    cleanup.current = () => {
      clearTimeout(timeout);
      es.close();
    };

    es.onmessage = (e) => {
      const { type, text } = JSON.parse(e.data);
      if (type === "log") {
        setLogs((prev) => prev + text);
      } else if (type === "done") {
        clearTimeout(timeout);
        setState("done");
        es.close();
        onDone?.();
      } else if (type === "session-expired") {
        clearTimeout(timeout);
        setLogs((prev) => prev + "\n" + text);
        setState("session-expired");
        es.close();
        onSessionExpired?.();
      } else if (type === "error") {
        clearTimeout(timeout);
        setLogs((prev) => prev + "\n" + text);
        setState("error");
        es.close();
      }
    };

    es.onerror = () => {
      clearTimeout(timeout);
      setState("error");
      es.close();
    };
  }

  function reset() {
    cleanup.current?.();
    setState("idle");
    setLogs("");
  }

  return { state, logs, run, reset, setState, setLogs };
}
