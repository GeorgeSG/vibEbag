# vibEbag — Agent Guide

## Project overview
A personal grocery analytics dashboard built from eBag order export data. The stack is React 18 + Vite + Tailwind CSS v4 + shadcn/ui (base-ui variant) + Recharts. All source lives in `dashboard/src/`.

## Architecture

### Data flow
- Raw data: `dashboard/public/data/order-details.json` (fetched at runtime)
- Processing: `dashboard/src/data/processOrders.js` — single function that transforms raw orders into all dashboard-ready structures
- Pages receive pre-computed data as props from `App.jsx`

### Pages
- `Overview.jsx` — KPI tiles + charts, max-w-6xl
- `Products.jsx` — sortable/filterable product table with sheet detail, max-w-screen-2xl
- `Orders.jsx` — sortable orders table with sheet detail, max-w-6xl

### Shared components (`dashboard/src/components/ui/`)
| File | Purpose |
|---|---|
| `stat-tile.jsx` | KPI tile — `variant="page"` (Card, text-3xl) or `variant="sheet"` (plain div, text-2xl) |
| `category-badge.jsx` | Colored `<Badge>` using `categoryColor()` |
| `sort-icon.jsx` | `SortIcon` + `SortHead` — pass `col`, `sortKey`, `sortDir`, `onSort` as props |
| `section-header.jsx` | Icon + uppercase label pattern used inside sheets |
| `table-pagination.jsx` | Full pagination bar with smart ellipsis and per-page selector |

### Shared utilities (`dashboard/src/lib/`)
- `fmt.js` — `fmt(n)` for money (bg-BG locale, 2 decimals) and `fmtDate(iso)` for Bulgarian date formatting
- `categoryColors.js` — `categoryColor(category)` maps category names to hex colors

## Key conventions

### Monetary values
Always in EUR. Use `toEur(eurVal, bgnVal)` in processOrders for conversion. Display with `fmt(n) + " €"`.

### Category colors
Always use `categoryColor(category)` from `@/lib/categoryColors`. Apply as background with `+ "22"` opacity and border with `+ "55"`. Use `<CategoryBadge category={...} />` wherever possible instead of inlining.

### External eBag links
- Product page: `https://www.ebag.bg/?product=${productId}` where `productId` is `product_saved.id`
- Order page: `https://www.ebag.bg/orders/${orderId}` where `orderId` is `encrypted_id`
- Always render as `<ExternalLink size={13} />` icon wrapped in a `<Tooltip>` with content "Виж в eBag"
- In table rows, wrap in `onClick={(e) => e.stopPropagation()}` to prevent row click triggering sheet open

### Sorting/pagination pattern
Both Products and Orders use the same pattern:
- `sortKey`, `sortDir` state + `handleSort(key)` function that also calls `setPage(0)`
- `page`, `pageSize` state with `handlePageSize(v)` that also calls `setPage(0)`
- Reset page in event handlers directly — do NOT use `useEffect` to reset page (ESLint rule)
- Use `<SortHead col="..." sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>` — never define SortHead inside the component

### Sheets (detail panels)
- Width: `!w-[60vw] !max-w-none overflow-y-auto p-8 pt-14`
- Hero header: title + subtitle + action button(s) on the right, then 3 `<StatTile variant="sheet">` in a 3-col grid
- Section headers inside sheet use `<SectionHeader icon={Icon}>label</SectionHeader>`

### Charts
- All charts use `<ChartContainer config={...}>` wrapper from shadcn
- Horizontal bar charts (top products, brands, promo): `layout="vertical"`, `YAxis` dataKey is the label, `XAxis` is numeric
- Color bars by category: use `<Cell>` per bar with `fill={categoryColor(item.category)}`
- Dynamic height for horizontal bars: `style={{ height: data.length * 24 + 40 }}`

### Adding new data
Add all transformations to `processOrders.js` and include in the return object. Never compute derived stats inside components. When adding new fields to existing objects (e.g. `productId` to order items), also verify the field is present in all code paths (main orders and additional_orders).

## shadcn/ui notes
- This project uses the **base-ui** variant of shadcn, not Radix
- `SelectValue` renders the `value` prop, not the item children text — use `<span>{value} label</span>` inside `SelectTrigger` instead
- `TooltipProvider` is already in `App.jsx` — just import and use `Tooltip`/`TooltipTrigger`/`TooltipContent` directly
- Add shadcn components with `npx shadcn@latest add <component> --yes` from the `dashboard/` directory

## ESLint rules to follow
- Do not call `setState` inside `useEffect` — reset page state in event handlers instead
- Do not define components (like `SortHead`) inside other components — extract them
- Unused variables cause errors — clean up imports when removing features
- `badge.jsx` and `button.jsx` export non-component constants (`badgeVariants`, `buttonVariants`) — these have `eslint-disable` comments, do not remove them

## Language
All UI text is in Bulgarian. Keep it consistent:
- "Виж в eBag" — tooltip for external links
- "Няма намерени..." — empty states
- "на страница" — per-page selector suffix
