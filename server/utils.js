import { BGN_TO_EUR } from "./config.js";

/** Safe float parse — returns null for NaN instead of propagating it. */
export function num(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

/** Convert to EUR, preferring the EUR value if present, falling back to BGN conversion. */
export function toEur(eurVal, bgnVal) {
  const eur = parseFloat(eurVal);
  if (!isNaN(eur) && eur > 0) return eur;
  const bgn = parseFloat(bgnVal);
  if (!isNaN(bgn)) return bgn / BGN_TO_EUR;
  return 0;
}

/** Format time slot integers (e.g. 900, 1100) into "09:00–11:00" display string. */
export function formatTimeSlot(s, e) {
  if (s == null || e == null) return null;
  return `${String(s).slice(0, -2).padStart(2, "0")}:${String(s).slice(-2)}–${String(e).slice(0, -2).padStart(2, "0")}:${String(e).slice(-2)}`;
}
