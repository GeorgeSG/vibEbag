# vibEbag — Agent Guide

## Project overview
A personal grocery analytics dashboard built from eBag order export data. The stack is React 19 + Vite + Tailwind CSS v4 + shadcn/ui (base-ui variant) + Recharts. All source lives in `dashboard/src/`. The scraper lives in `scraper/`.

## Architecture

### Data flow
- The Vite plugin (`dashboard/scraper-plugin.js`) serves `data/order-details.json` (or `data/order-details.dev.json` when `VITE_USE_SEED=true`) directly to the browser — no manual file copying needed
- Processing: `dashboard/src/data/processOrders.js` — single function that transforms raw orders into all dashboard-ready structures
- Pages receive pre-computed data as props from `App.jsx`
- `App.jsx` also handles login form, sync button, status checking, and error states

### Pages
- `Overview.jsx` — KPI tiles + charts, max-w-6xl
- `Products.jsx` — sortable/filterable product table with sheet detail, max-w-screen-2xl
- `Orders.jsx` — sortable orders table with sheet detail, max-w-6xl

### Scraper (`scraper/`)
| File | Purpose |
|---|---|
| `auth.js` | Playwright headless login — reads credentials from `data/credentials.json`, saves session cookies to `data/cookies.json` |
| `fetch-orders.js` | Fetches paginated order list + full line-item details in one run. Incremental: skips already-fetched orders. Rate-limited: concurrency 2, 500–1000 ms random delay |
| `seed.js` | Generates synthetic dev data (`data/order-details.dev.json`) using `@faker-js/faker` with realistic Bulgarian brands and categories |

### Vite plugin (`dashboard/scraper-plugin.js`)
Exposes API endpoints on the Vite dev server:
| Endpoint | Method | Purpose |
|---|---|---|
| `/data/order-details.json` | GET | Serves the data file from `../data/` |
| `/api/status` | GET | Returns `{ hasCredentials, hasCookies, email }` |
| `/api/credentials` | POST | Saves `{ email, password }` to `data/credentials.json` |
| `/api/login` | GET | SSE stream — runs `auth.js` |
| `/api/scrape` | GET | SSE stream — runs `fetch-orders.js` |

Login and scrape endpoints use Server-Sent Events (SSE) to stream stdout/stderr from the child process. Messages are `{ type: "log"|"done"|"error", text }`. Only one job can run at a time (`activeJob` guard).

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

### Brand color
The brand teal is defined as `--brand: #138484` in `index.css` (both light and dark themes). Always use `var(--brand)` — never hardcode `#138484` in components. In Tailwind classes: `border-[var(--brand)]`. In inline styles: `style={{ color: "var(--brand)" }}`.

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

### Error handling
- `App.jsx` wraps all routes in an `ErrorBoundary` class component — catches render errors and shows a Bulgarian error message with a reload button
- `loadData()` and `fetchStatus()` both have `.catch()` handlers that set a `loadError` state, shown as an inline error with a retry button
- EventSource streams (login/sync) have a 5-minute timeout that auto-closes the connection and shows "Времето за изчакване изтече."

### Dev vs prod data
- `npm run dev` — serves `data/order-details.json` (real data)
- `npm run dev:seeded` — sets `VITE_USE_SEED=true`, serves `data/order-details.dev.json` (synthetic data)
- `npm run seed` (in `scraper/`) — regenerates the synthetic data file

## eBag API reference

All endpoints require a valid session cookie (obtained via Playwright login). Pass cookies as a `Cookie` header.

### Order list
```
GET https://www.ebag.bg/orders/list/json?page=1&exclude_additional_order=true
```
Response: `{ count, next, previous, results: [order summaries] }`. Each summary includes: `encrypted_id`, `shipping_date`, `final_amount`, `final_amount_eur`, `order_status`, `last_payment_method`. Pagination: follow `next` until `null`.

### Order details
```
GET https://www.ebag.bg/orders/{encrypted_id}/details/json
```
Response: `{ order, grouped_items: [{ group_name, group_items }], additional_orders, overall_saved, overall_final_amount }`.

**Important processing rules:**
- `grouped_items` covers the main order; `additional_orders[].grouped_items` covers add-on orders. Flatten both.
- Skip `group_name = "Променени количества"` and `group_name = null` — these are picker-adjusted duplicates. Including them double-counts spend.
- `order_status`: `4` = delivered, `3` = cancelled/other
- `unit_type`: `1` = sold by weight (kg), `2` = sold by unit
- `item.price` = quantity × unit price. Use `product_saved.current_price` for the unit price.

### Product images
```
https://www.ebag.bg/products/{productId}/images/0/200/webp
```
Where `productId` is `product_saved.id`. The `0` is the image index (main image). Use `200` for thumbnails or `800` for full size.

## Data model (processOrders.js output)

| Field | Description |
|---|---|
| `totalSpend` | Sum of `order.final_amount` across all orders |
| `totalOrders` | Count of orders |
| `avgBasket` | `totalSpend / totalOrders` |
| `totalSaved` | Sum of `overall_saved` (promo/discount savings) |
| `monthlySpend` | `{ month: "YYYY-MM", spend }[]` sorted chronologically |
| `categorySpend` | `{ category, spend }[]` sorted by spend descending |
| `topProducts` | Top 15 products by total spend |
| `topByFrequency` | Top 15 products by order count |
| `productList` | All unique products with `count`, `totalSpend`, `avgPrice`, `firstPurchase`, `lastPurchase`, `priceHistory[]` |
| `orderList` | All orders with `date`, `total`, `saved`, `itemCount`, `categories`, `items[]` |

Each `priceHistory` entry: `{ date, orderId, unitPrice, wasPromo }`.

`avgPrice` is average **unit price** (mean of `product_saved.current_price`), not average order spend.

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
