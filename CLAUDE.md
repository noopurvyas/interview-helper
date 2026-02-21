# Interview Helper

Interview preparation PWA — React 19 + TypeScript + Vite + Tailwind CSS v4. Offline-first with IndexedDB storage (via `idb`), no backend. PWA via `vite-plugin-pwa`.

## Quick Commands

- `npm run dev` — start dev server
- `npm run build` — type-check (`tsc -b`) + production build
- `npm run lint` — ESLint
- `npm test` — run all tests once (vitest)
- `npm run test:watch` — tests in watch mode

## Project Structure

```
src/
  components/   — reusable UI (cards, forms, modals, toasts)
  pages/        — route-level views (Dashboard, Behavioral, Technical, Bookmarks, Companies)
  hooks/        — custom hooks (useQuestions, useBookmarks, useSearch, useKeyboardShortcuts, usePWAInstall)
  db/           — IndexedDB schema + CRUD (indexeddb.ts)
  test/         — test setup (setup.ts) and factories (factories.ts)
  assets/       — static assets
  index.css     — Tailwind v4 theme with custom color tokens + utility classes
```

## Architecture

- **State**: React hooks only (useState, useCallback, useContext) — no Redux/Zustand
- **Global context**: ToastContext only (ToastProvider/useToast)
- **Data hooks**: useQuestions, useBookmarks wrap IndexedDB with loading/error state
- **Database**: IndexedDB (`interview-helper`, version 2). Stores: questions, bookmarks, companyNotes
- **Search**: Client-side only via useSearch hook
- **Icons**: lucide-react
- **PDF export**: jspdf

## Routing

React Router v7 (BrowserRouter): `/dashboard`, `/behavioral`, `/technical`, `/bookmarks`, `/companies`, `/companies/:companyName`

## Styling

- Tailwind CSS v4 via `@tailwindcss/postcss`
- Custom color families in `index.css`: `behavioral-*` (blue), `technical-*` (red), `bookmarks-*` (teal)
- Utility classes in `index.css`: `btn-primary`, `btn-behavioral`, `card`, `badge`, `input-field`
- Dark mode via `.dark` class on `<html>`, toggled in Header.tsx

## Data Models

- **Question** — behavioral or technical, with optional STAR fields, code snippets, difficulty, tags. Required fields: `id`, `type`, `question`
- **Bookmark** — learning resources with auto-detected type, status tracking
- **CompanyNote** — free-form notes keyed by company name

All types defined in `src/db/indexeddb.ts`.

## Testing

- **Stack**: Vitest + React Testing Library + jsdom
- **Location**: colocated — `Component.test.tsx` next to `Component.tsx`
- **Factories**: `src/test/factories.ts` (makeQuestion, makeTechnicalQuestion, makeBookmark)
- **IndexedDB mock**: `fake-indexeddb/auto` imported in `src/test/setup.ts`
- **Page tests**: mock hooks at module level with `vi.mock()`
- **Hook tests**: use `renderHook()` from Testing Library

## Common Patterns

- Modal wrapper (Modal.tsx) with focus trap + ARIA
- FilterSidebar + SearchBar + useSearch for list pages
- QuestionForm handles behavioral/technical with conditional fields
- Keyboard shortcuts via useKeyboardShortcuts (`/` = search, `n` = new)

## Key Files

- `src/db/indexeddb.ts` — all DB operations and type definitions
- `src/index.css` — full design system
- `src/App.tsx` — routing configuration
- `PLAN.md` — original project roadmap
