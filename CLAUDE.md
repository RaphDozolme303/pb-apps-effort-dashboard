# Effort Dashboard — Claude Context

## What this app does
Standalone Next.js 16 app (port 3001) that visualizes Productboard **product → component → feature** hierarchy with effort aggregation and release filtering.

## Stack
- Next.js 16 App Router, TypeScript strict, Tailwind v4
- No UI libraries — plain Tailwind + inline styles
- Brand colors: `--pb-blue: #1B5BD4`, `--pb-yellow: #F5C518`, `--pb-blue-light: #E8F0FE`

## Key files
| File | Purpose |
|---|---|
| `lib/productboard.ts` | Fetches `product`, `component`, `feature`, `release` from `/v2/entities` |
| `lib/transform.ts` | `buildTree()` recursive, `collectFilteredFeatures()`, `sumEffort()` |
| `lib/cache.ts` | Load/save `data/cache.json` |
| `lib/config.ts` | `getApiToken()` — env var first, fallback to `data/api-key.json` |
| `components/EffortTree.tsx` | Client component: release dropdown, collapse/expand, live rollup |
| `components/ConnectPanel.tsx` | First-run API key input form |
| `app/api/api-key/route.ts` | GET/POST/DELETE for API key storage |

## API key
Stored in `data/api-key.json` (`{ "token": "..." }`). Env var `PRODUCTBOARD_API_TOKEN` takes priority. Both are gitignored.

## Critical API findings (live-tested)

### Relationship types
- **feature → component parent**: `{ type: "parent", target.type: "component" }` — NOT `"link"`
- **feature → release**: `{ type: "link", target.type: "release" }` — correct
- **component → product parent**: `{ type: "link" | "parent", target.type: "product" }` — either works

### Effort field
- Native PB field, key `"effort"`, schema `NumberFieldValue`
- **Returned as a plain number** in the individual entity response (e.g. `"effort": 40`), NOT as `{ value: 40 }`
- **CRITICAL: The paginated `/v2/entities` endpoint does NOT return the effort field at all** — it is absent from every feature in the bulk response
- Fix: after the pagination loop, call `fetchEffortForFeatures()` which fetches each feature individually (`GET /v2/entities/{id}`) in batches of 10 to hydrate effort values
- Read as: `typeof raw.fields.effort === 'number' ? raw.fields.effort : null`
- The pb-dashboard reads effort as `{ value: number }` — this is WRONG for the product tree; this app uses the correct plain-number extraction

### Archived features
- Archived features (e.g. "Won't do" status) are included — only archived products/components/releases are filtered out
- Filter: `if (entity.archived && entity.type !== 'feature') continue`

### Feature count
- 86 features in the product hierarchy (distinct from the 59 strategy-tree features in pb-dashboard)
- All 86 have a component parent (via `"parent"` relationship type)

## Data/cache
- `data/cache.json` — gitignored, stores products/components/features/releases
- `data/api-key.json` — gitignored, stores API token
- TTL: 24h (override with `CACHE_TTL_HOURS` env var)
- Refresh: POST `/api/refresh`, or click Refresh button in UI

## Dev
```bash
cd effort-dashboard
npm run dev   # http://localhost:3001
```
