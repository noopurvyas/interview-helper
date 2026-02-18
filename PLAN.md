# Interview Helper — Project Plan

A PWA journal app for organizing interview preparation across behavioral and technical domains, segmented by company, with a bookmarks hub for learning resources.

---

## Current State

### What's Built
- React 19 + TypeScript + Vite + Tailwind CSS + React Router
- IndexedDB persistence via `idb` (questions & bookmarks stores)
- 4 pages: Dashboard, Behavioral Questions, Technical Questions, Bookmarks
- Full CRUD for questions (with answer variations, key points, practice tracking)
- Full CRUD for bookmarks (blog/video/course/other with categories)
- Search (debounced), company & category filtering, favorites
- Dark/light theme toggle (persisted in localStorage)
- JSON & PDF export
- Responsive, mobile-first layout

### What's Missing
- PWA support (service worker, manifest, offline, installability)
- Per-company views within behavioral/technical sections
- Richer bookmark organization (folders/tags, link previews)
- Journal/notes capability for tracking prep progress

---

## Architecture

```
src/
├── components/       # Reusable UI (cards, forms, search, filters)
├── pages/            # Route-level views
├── hooks/            # Data hooks (useQuestions, useBookmarks, useSearch)
├── db/               # IndexedDB schema & operations
├── assets/           # Static assets
├── main.tsx          # Entry point
└── App.tsx           # Router & layout shell
```

**Data layer:** IndexedDB with `idb` wrapper
**State management:** React hooks + custom data hooks (no external store)
**Styling:** Tailwind CSS with custom color tokens per section (blue=behavioral, red=technical, teal=bookmarks)

---

## Phase 1 — PWA Foundation

> Make the app installable, offline-capable, and feel native.

### 1.1 Web App Manifest
- Create `public/manifest.json` with app name, icons, theme color, display: standalone
- Add icon set (192x192, 512x512) for install prompts
- Link manifest in `index.html`

### 1.2 Service Worker
- Use `vite-plugin-pwa` for zero-config service worker generation
- Cache strategy: precache app shell + runtime cache for IndexedDB reads
- Offline fallback page

### 1.3 Install Prompt
- Add an in-app install banner/button using `beforeinstallprompt` event
- Persist dismissal preference in localStorage

### 1.4 App Metadata
- Set viewport, theme-color, apple-touch-icon meta tags
- Add splash screen configuration for iOS

---

## Phase 2 — Company-Centric Organization

> Let users drill into a specific company and see all their behavioral + technical prep in one place.

### 2.1 Company Hub Page (`/companies`)
- Grid/list of all companies the user has added questions for
- Each card shows: company name, question counts (behavioral/technical), last practiced date
- Click to navigate to `/companies/:companyName`

### 2.2 Company Detail Page (`/companies/:companyName`)
- Tabbed view: Behavioral | Technical | Notes
- Shows only questions for that company
- Reuse existing `QuestionCard` and `QuestionForm` components
- Add company-specific notes/journal section (free-form markdown or plain text)

### 2.3 Company Management
- Add/rename/delete companies from the hub
- Merge duplicate companies
- Company color or icon customization (optional, low priority)

### 2.4 Navigation Update
- Add "Companies" tab to the main navigation bar
- Keep existing Behavioral/Technical pages as cross-company views

---

## Phase 3 — Enhanced Behavioral Section

> Deepen the behavioral prep workflow.

### 3.1 STAR Framework Support
- Extend `AnswerVariation` schema with structured STAR fields:
  `{ situation, task, action, result }` (optional — user can use free-form or STAR)
- Render STAR sections visually in `QuestionCard`
- Toggle between free-form and STAR mode in `QuestionForm`

### 3.2 Common Question Templates
- Seed a set of common behavioral categories (leadership, conflict, teamwork, failure, etc.)
- Users can pick from templates or create custom questions
- Category badges on question cards

### 3.3 Practice Mode
- Flashcard-style practice: show question, reveal answer on click/tap
- Track practice sessions with timestamps
- Spaced repetition suggestions (surface least-practiced or oldest questions)

---

## Phase 4 — Enhanced Technical Section

> Support the variety of technical interview formats.

### 4.1 Question Subtypes
- Add a `subtype` field: coding, system design, knowledge, take-home
- Filter by subtype within the technical page
- Distinct visual treatment per subtype

### 4.2 Code Snippet Support
- Add optional `codeSnippet` field (language + code string)
- Render with syntax highlighting (use a lightweight lib like `prism-react-renderer`)
- Copy-to-clipboard button

### 4.3 Complexity & Topic Tags
- Difficulty level: easy, medium, hard
- Topic tags: arrays, trees, SQL, API design, etc.
- Filter and sort by difficulty/tags

---

## Phase 5 — Bookmarks & Resources Hub

> Turn bookmarks into a structured knowledge base.

### 5.1 Folder/Collection Support
- Let users group bookmarks into named collections (e.g., "System Design Reading", "LC Patterns")
- Drag-and-drop reordering within collections (stretch)
- A bookmark can belong to multiple collections

### 5.2 Link Previews
- Fetch Open Graph metadata (title, description, image) on bookmark creation
- Display preview cards with thumbnail
- Fallback to plain URL display if fetch fails

### 5.3 Progress Tracking
- Mark bookmarks as: unread, in-progress, completed
- Filter by read status
- Show progress bar on collections

### 5.4 Resource Type Enhancements
- Auto-detect type from URL (YouTube → video, medium.com → blog, etc.)
- Add `podcast` and `documentation` as resource types
- Type-specific icons

---

## Phase 6 — Dashboard & Analytics

> Give users actionable insight into their prep progress.

### 6.1 Dashboard Improvements
- Prep streak tracker (days with activity)
- Per-company readiness score (questions answered / total, practice recency)
- Weekly activity chart (simple bar/line chart, no heavy chart lib)

### 6.2 Quick Actions
- "Random question" button for surprise practice
- "Needs attention" section: stale questions, unread bookmarks, unpracticed companies

---

## Phase 7 — Data & Polish

> Round out the experience with data portability and UX polish.

### 7.1 Import/Export Improvements
- Import from JSON (restore backup)
- Export per-company or per-section
- Share a company prep bundle as a file

### 7.2 UX Polish
- Toast notifications for actions (add, delete, save)
- Keyboard shortcuts (n = new question, / = search, etc.)
- Empty state illustrations
- Skeleton loading states

### 7.3 Accessibility
- ARIA labels on interactive elements
- Focus management in modals
- Screen reader-friendly navigation

---

## Priority Order

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| 1 | Phase 1 — PWA Foundation | Medium | High — installability & offline |
| 2 | Phase 2 — Company Hub | Medium | High — core organizational model |
| 3 | Phase 5 — Bookmarks Hub | Medium | High — resource management |
| 4 | Phase 3 — Behavioral Enhancements | Medium | Medium — prep quality |
| 5 | Phase 4 — Technical Enhancements | Medium | Medium — prep quality |
| 6 | Phase 6 — Dashboard & Analytics | Low | Medium — motivation & insight |
| 7 | Phase 7 — Data & Polish | Low | Medium — UX completeness |

---

## Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PWA tooling | `vite-plugin-pwa` | Tight Vite integration, workbox under the hood |
| State management | Keep React hooks | App complexity doesn't warrant Redux/Zustand yet |
| Syntax highlighting | `prism-react-renderer` | Lightweight, React-native, no DOM manipulation |
| Charts (if needed) | Lightweight/custom SVG | Avoid heavy chart libraries for a few simple visuals |
| Markdown rendering | `react-markdown` (if needed) | Only if journal/notes feature warrants it |
| Database | Stay with IndexedDB | All data is local-first; no backend needed |
