# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server with Turbopack (http://localhost:3000)
- `npm run build` — production build. The sitemap and robots routes (`app/sitemap.ts`, `app/robots.ts`) read Firestore during the build, so the build fails without working Firebase values.
- `npm run start` — serve the production build
- `npm run lint` — run `eslint` against `eslint.config.mjs`, which extends `eslint-config-next`'s core-web-vitals and typescript presets

There is no test suite configured.

## Environment

Firebase config is read from `NEXT_PUBLIC_FIREBASE_*` vars (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId), set in Vercel's environment config. There is no local `.env`; local builds need the vars exported in the shell (see Things to know). All of them ship to the client by design.

Admin access is Firebase Auth email/password plus a custom-claims check, not a site password (see Admin).

TypeScript path alias `@/*` resolves to the project root (see `tsconfig.json`).

## Architecture

Next.js 16 App Router + React 19 photography portfolio backed by Firebase (Firestore for metadata, Storage for image binaries). Photo metadata is dynamic; collection/project listings are static.

### Data model

- **Firestore `photos` collection** — one doc per photo. Shape in `types/Photo.ts`. Key fields: `id` (zero-padded sequence, see `getPhotoID`), `sequenceNumber` (global ordering), `category`, `projectID`, `width`/`height`, `fullUrl`, `thumbnailUrl`, `photoDate` (Timestamp).
- **Firestore `counters/photos`** — single doc holding `lastSequenceNumber`. The admin upload flow uses a `runTransaction` to increment this and assign IDs atomically. `util/reSerializePhotos.ts` rebuilds ids/sequence numbers by re-sorting all photos by `photoDate` ascending and updating the counter — invoked from `/admin/settings`.
- **Storage paths** — `full/<filename>` and `thumbnails/<filename>` (thumbnail compressed to maxWidthOrHeight 500 via `browser-image-compression`).
- **Static taxonomies** — `data/categories.ts` (collections) and `data/projects.ts` (projects, sorted newest-first) are hand-edited TS arrays. The photo's `category` / `projectID` fields are the join keys.
- **Project images** — each project in `data/projects.ts` points at three files in `public/images/projects/`, all square WebP with the same crop: `<id>-poster.webp` at 2000×2000, `<id>-poster-mobile.webp` at 1000×1000, and `<id>-thumbnail.webp` at 500×500. They must be square because both project pages set `aspect-ratio: 1` on the image box. The thumbnail is only the `blurDataURL` placeholder, so don't go above 500. The poster doubles as the project page's Open Graph image.

### Routing & gallery pattern

All gallery pages share `components/GalleryTemplate`, which is a client component that takes a `fetchPhotos(lastDoc?)` callback and handles infinite scroll, paging state, and a thumbnail-vs-rows view toggle. Each route supplies its own Firestore query:

- `/all-photos` — orders by `sequenceNumber` desc.
- `/collections/[collectionID]` — filtered by `where('category', '==', collectionID)`, ordered by `sequenceNumber` desc.
- `/projects/[projectID]` — filtered by `where('projectID', '==', projectID)`, ordered by `sequenceNumber` **asc** (projects display chronologically).

Each gallery has a nested `[photoID]` route that renders `components/PhotoViewer`. The viewer uses `hooks/usePhotoCollection` to fetch the full ordered photo list (with the same optional filter), find prev/next neighbors, and wrap around at the ends. `store/photoStore.ts` is a Zustand cache that preloads adjacent full-size images so navigation is instant — when adding new viewer features, prefer reading from this store before re-fetching.

When adding a new gallery surface: write a client component that builds a Firestore query matching the desired filter/ordering, pass it as `fetchPhotos` to `GalleryTemplate`, and supply a parallel `[photoID]` route that renders `PhotoViewer` with the matching `filter` so prev/next stays scoped.

### Admin

`/admin/*` routes wrap their children in `components/AdminGate`, a Firebase Auth email/password gate. `onAuthStateChanged` drives the gate and `getIdTokenResult(true)` checks the `admin === true` custom claim, force-refreshing the token so a freshly granted claim applies without a re-login (`AdminGate.tsx:26-38`). AdminGate is UX only; the real boundary is the Firestore security rules plus that claim. Routes:

- `/admin/add-photo` — multi-file upload form; reads image dimensions client-side, uploads original + compressed thumbnail to Storage, and writes Firestore docs inside a single transaction that also bumps `counters/photos`.
- `/admin/settings` — currently only exposes "Re-serialize Image Database" (calls `reSerializePhotos`).

### Styling

SCSS modules co-located with components (`*.module.scss`). Globals in `app/globals.scss`, shared variables in `styles/_vars.scss`, fonts in `styles/_fonts.scss`. Geist / Geist Mono are loaded via `next/font/google` in `app/layout.tsx`.

## Things to know

- `getPhotoID` zero-pads to 5 digits — keep sequenceNumber and id in sync; reSerialize is the only tool that fixes drift.
- Several Firestore queries combine `where` + `orderBy` and require composite indexes; if a new filter is added, expect to create an index in the Firebase console.
- Photo navigation in `usePhotoCollection` loads the entire filtered list on each viewer load (no pagination) — fine at current scale but worth knowing before adding heavy per-photo work.
- The production URL lives in one place, `lib/siteUrl.ts` (override with `NEXT_PUBLIC_SITE_URL`); the sitemap, robots, and contact data all read it.
- There is no local `.env`, and `next build` needs working Firebase values twice over: the `/admin` prerender calls `getAuth()` at module scope, and `app/sitemap.ts` reads the `photos` collection, where a denied read fails the build. The real public values live in `.github/workflows/ci.yml`; export them in the shell for local builds.
- ESLint is held at 9.x deliberately. ESLint 9 is EOL upstream (since 2026-08-06, no security patches), but 10 is blocked by `eslint-plugin-react` (a transitive dep of `eslint-config-next`): it still calls the removed `context.getFilename()` and has shipped no compatible release (jsx-eslint#3977). The rest of the lint stack (typescript-eslint, eslint-plugin-react-hooks) already supports 10. Revisit quarterly; don't bump ESLint ad hoc.
- `AGENTS.md` exists to host the agent-rules block that `next dev` injects when it detects an AI agent. Next writes to `AGENTS.md` in preference to `CLAUDE.md`, so keeping it there leaves this file hand-maintained. Don't delete it, or the block lands here instead. `agentRules: false` in `next.config.ts` turns the whole thing off.
