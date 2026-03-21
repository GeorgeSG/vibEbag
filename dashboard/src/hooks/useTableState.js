import { useState } from "react";

export function useTableState(initialSortKey, initialSortDir = "desc", initialPageSize = 15) {
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortDir, setSortDir] = useState(initialSortDir);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }

  function handlePageSize(v) {
    setPageSize(v);
    setPage(0);
  }

  return { sortKey, sortDir, page, pageSize, setPage, handleSort, handlePageSize };
}

export function sortData(data, sortKey, sortDir) {
  return [...data].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
    return sortDir === "asc" ? cmp : -cmp;
  });
}
