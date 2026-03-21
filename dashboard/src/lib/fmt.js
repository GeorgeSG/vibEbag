export function fmt(n) {
  return n.toLocaleString("bg-BG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MONTHS = ["яну", "фев", "мар", "апр", "май", "юни", "юли", "авг", "сеп", "окт", "ное", "дек"];

export function fmtDate(iso) {
  const [year, month, day] = iso.split("-");
  return `${parseInt(day)} ${MONTHS[parseInt(month) - 1]} ${year}`;
}
