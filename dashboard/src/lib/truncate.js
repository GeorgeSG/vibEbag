export function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + "…" : str;
}
