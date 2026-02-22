# Interview Helper

Interview preparation PWA — React 19 + TypeScript + Vite + Tailwind CSS v4. Offline-first with IndexedDB as cache and SQLite as persistent backend. PWA via `vite-plugin-pwa`.

## Quick Commands

- `npm run dev` — start Vite + Express server (via concurrently)
- `npm run dev:client` — start Vite only (no backend)
- `npm run build` — type-check (`tsc -b`) + production build
- `npm run lint` — ESLint
- `npm test` — run all tests once (vitest)
- `npm run test:watch` — tests in watch mode
- `cd server && npm run dev` — start Express server only (port 3001)

## IMPORTANT INSTRUCTIONS

1. Always deeply inspect the project before planning a new feature.
2. Always ask plenty of clarifying questions.
3. Always ensure the application works and the tests pass. Use Playwright MCP to verify that the application is working and to do visual comparisons.
4. IMPORTANT: Do not compromise to make tests pass. Do not make large design changes if you cannot make tests pass. Work harder to make the tests pass.
5. Always work in a new branch and commit frequently.
6. Always create a pull request when done.
7. IMPORTANT: When bumping `DB_VERSION` in `src/db/indexeddb.ts`, always write a proper **version-based migration** using the `oldVersion` parameter in the `upgrade(db, oldVersion)` callback. Use `if (oldVersion < N)` guards so each version's migration runs sequentially. Never drop or recreate existing stores — existing user data MUST be preserved across upgrades. Test the upgrade path by verifying data created in previous versions is still accessible after the version bump.

## Project Structure

```
src/
  components/   — reusable UI (cards, forms, modals, toasts)
  pages/        — route-level views (Dashboard, Behavioral, Technical, Bookmarks, Companies)
  hooks/        — custom hooks (useQuestions, useBookmarks, useSearch, useKeyboardShortcuts, usePWAInstall)
  db/           — IndexedDB schema + CRUD (indexeddb.ts), sync layer (api.ts, sync.ts, syncBridge.ts)
  test/         — test setup (setup.ts) and factories (factories.ts)
  assets/       — static assets
  index.css     — Tailwind v4 theme with custom color tokens + utility classes
server/
  src/
    index.ts        — Express app (port 3001)
    db.ts           — SQLite schema, serialization helpers
    routes/         — REST endpoints (questions, bookmarks, interviews, notes, sync)
  data/             — SQLite database file (gitignored)
```

## Architecture

- **State**: React hooks only (useState, useCallback, useContext) — no Redux/Zustand
- **Global context**: ToastContext only (ToastProvider/useToast)
- **Data hooks**: useQuestions, useBookmarks, useInterviews wrap IndexedDB with loading/error state
- **Database**: IndexedDB (`interview-helper`, version 4). Stores: questions, bookmarks, companyNotes, interviews, syncQueue
- **Backend**: Express + better-sqlite3 (`server/`). SQLite is the durable store; data survives browser storage wipes
- **Search**: Client-side only via useSearch hook
- **Icons**: lucide-react
- **PDF export**: jspdf

## Sync Architecture

```
Components → Hooks (unchanged) → indexeddb.ts → IndexedDB (cache, primary read source)
                                       ↓ mutation callback
                                  syncBridge.ts → sync.ts → api.ts → Express → SQLite (persistent)
```

- **IndexedDB** is the primary data source for all reads (zero latency impact)
- **SQLite** is the durable store — syncs on every mutation (fire-and-forget)
- **On startup**: `initSync()` pulls from SQLite → merges into IndexedDB (restores wiped data), pushes local-only data to server
- **On mutation**: `setMutationCallback` fires after every IndexedDB write → API call in background → queued in `syncQueue` store on failure → retried every 5s
- **Offline-safe**: all API calls return `null` on failure; app works fully offline
- **Test-safe**: sync is inert when `setupSync()` is never called (test environment check in `syncBridge.ts`)

### Key sync files
- `src/db/api.ts` — fetch wrappers for all REST endpoints, returns `null` on network failure
- `src/db/sync.ts` — `initSync()` (startup hydration), `handleMutation()` (per-write sync), `flushSyncQueue()` (offline retry)
- `src/db/syncBridge.ts` — wires sync to IndexedDB via callback, called from `App.tsx` on mount
- `src/db/indexeddb.ts` — `setMutationCallback()`, `putXxxDirect()` (hydration without triggering callback), `syncQueue` CRUD

### Server API

All routes under `/api` (proxied by Vite in dev). Express on port 3001.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/questions | All questions |
| POST | /api/questions | Upsert question |
| PUT | /api/questions/:id | Update question |
| DELETE | /api/questions/:id | Delete question |
| GET | /api/bookmarks | All bookmarks |
| POST | /api/bookmarks | Upsert bookmark |
| PUT | /api/bookmarks/:id | Update bookmark |
| DELETE | /api/bookmarks/:id | Delete bookmark |
| GET | /api/interviews | All interviews |
| POST | /api/interviews | Upsert interview |
| PUT | /api/interviews/:id | Update interview |
| DELETE | /api/interviews/:id | Delete interview |
| GET | /api/notes/:company | Get company note |
| PUT | /api/notes/:company | Upsert company note |
| POST | /api/sync/pull | Returns all 4 tables |
| POST | /api/sync/push | Bulk upsert with deletions |
| GET | /api/health | Health check |

## Routing

React Router v7 (BrowserRouter): `/dashboard`, `/behavioral`, `/technical`, `/bookmarks`, `/interviews`, `/companies`, `/companies/:companyName`

## Styling

- Tailwind CSS v4 via `@tailwindcss/postcss`
- Custom color families in `index.css`: `behavioral-*` (blue), `technical-*` (red), `bookmarks-*` (teal), `interviews-*` (purple)
- Utility classes in `index.css`: `btn-primary`, `btn-behavioral`, `card`, `badge`, `input-field`
- Dark mode via `.dark` class on `<html>`, toggled in Header.tsx

## Data Models

- **Question** — behavioral or technical, with optional STAR fields, code snippets, difficulty, tags. Required fields: `id`, `type`, `question`
- **Bookmark** — learning resources with auto-detected type, status tracking
- **CompanyNote** — free-form notes keyed by company name
- **Interview** — scheduled interviews with company (required), dateTime, type, status, optional role/round/location/contacts/notes/linkedQuestionIds/icalUid

All types defined in `src/db/indexeddb.ts`.

## Testing

- **Stack**: Vitest + React Testing Library + jsdom
- **Location**: colocated — `Component.test.tsx` next to `Component.tsx`
- **Factories**: `src/test/factories.ts` (makeQuestion, makeTechnicalQuestion, makeBookmark, makeInterview)
- **IndexedDB mock**: `fake-indexeddb/auto` imported in `src/test/setup.ts`
- **Page tests**: mock hooks at module level with `vi.mock()`
- **Hook tests**: use `renderHook()` from Testing Library

## Common Patterns

- Modal wrapper (Modal.tsx) with focus trap + ARIA
- FilterSidebar + SearchBar + useSearch for list pages
- QuestionForm handles behavioral/technical with conditional fields
- Keyboard shortcuts via useKeyboardShortcuts (`/` = search, `n` = new)

## Key Files

- `src/db/indexeddb.ts` — all DB operations, type definitions, mutation callback, sync queue
- `src/db/syncBridge.ts` — sync initialization (called from App.tsx)
- `server/src/db.ts` — SQLite schema + serialization helpers
- `server/src/routes/sync.ts` — bulk pull/push endpoints
- `src/index.css` — full design system
- `src/App.tsx` — routing configuration
- `vite.config.ts` — Vite config with `/api` proxy to localhost:3001
- `PLAN.md` — original project roadmap
