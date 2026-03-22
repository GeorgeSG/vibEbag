import { useCallback, useEffect, useState } from "react";

export function useMobileMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const menuClosing = menuVisible && !menuOpen;

  useEffect(() => {
    if (menuOpen) {
      setMenuVisible(true); // eslint-disable-line react-hooks/set-state-in-effect
    } else if (menuVisible) {
      const t = setTimeout(() => setMenuVisible(false), 400);
      return () => clearTimeout(t);
    }
  }, [menuOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(() => setMenuOpen((prev) => !prev), []);
  const close = useCallback(() => setMenuOpen(false), []);

  return { menuOpen, menuVisible, menuClosing, toggle, close };
}
