# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server with Turbopack (http://localhost:3000)
- `npm run build` — production build; `postbuild` runs `next-sitemap` (sitemap excludes `/admin/*`)
- `npm run start` — serve the production build
- `npm run lint` — run `next lint`

There is no test suite configured.

## Environment

Firebase config is read from `NEXT_PUBLIC_FIREBASE_*` vars in `.env` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId). The admin password gate reads `NEXT_PUBLIC_ADMIN_PASS`. All are exposed to the client — the admin gate is a soft barrier, not real auth.

TypeScript path alias `@/*` resolves to the project root (see `tsconfig.json`).

## Architecture

Next.js 15 App Router + React 19 photography portfolio backed by Firebase (Firestore for metadata, Storage for image binaries). Photo metadata is dynamic; collection/project listings are static.

### Data model

- **Firestore `photos` collection** — one doc per photo. Shape in `types/Photo.ts`. Key fields: `id` (zero-padded sequence, see `getPhotoID`), `sequenceNumber` (global ordering), `category`, `projectID`, `width`/`height`, `fullUrl`, `thumbnailUrl`, `photoDate` (Timestamp).
- **Firestore `counters/photos`** — single doc holding `lastSequenceNumber`. The admin upload flow uses a `runTransaction` to increment this and assign IDs atomically. `util/reSerializePhotos.ts` rebuilds ids/sequence numbers by re-sorting all photos by `photoDate` ascending and updating the counter — invoked from `/admin/settings`.
- **Storage paths** — `full/<filename>` and `thumbnails/<filename>` (thumbnail compressed to maxWidthOrHeight 500 via `browser-image-compression`).
- **Static taxonomies** — `data/categories.ts` (collections) and `data/projects.ts` (projects, sorted newest-first) are hand-edited TS arrays. The photo's `category` / `projectID` fields are the join keys.

### Routing & gallery pattern

All gallery pages share `components/GalleryTemplate`, which is a client component that takes a `fetchPhotos(lastDoc?)` callback and handles infinite scroll, paging state, and a thumbnail-vs-rows view toggle. Each route supplies its own Firestore query:

- `/all-photos` — orders by `sequenceNumber` desc.
- `/collections/[collectionID]` — filtered by `where('category', '==', collectionID)`, ordered by `sequenceNumber` desc.
- `/projects/[projectID]` — filtered by `where('projectID', '==', projectID)`, ordered by `sequenceNumber` **asc** (projects display chronologically).

Each gallery has a nested `[photoID]` route that renders `components/PhotoViewer`. The viewer uses `hooks/usePhotoCollection` to fetch the full ordered photo list (with the same optional filter), find prev/next neighbors, and wrap around at the ends. `store/photoStore.ts` is a Zustand cache that preloads adjacent full-size images so navigation is instant — when adding new viewer features, prefer reading from this store before re-fetching.

When adding a new gallery surface: write a client component that builds a Firestore query matching the desired filter/ordering, pass it as `fetchPhotos` to `GalleryTemplate`, and supply a parallel `[photoID]` route that renders `PhotoViewer` with the matching `filter` so prev/next stays scoped.

### Admin

`/admin/*` routes wrap their children in `components/AdminGate`, a client-side password prompt with 1-hour localStorage expiry. Routes:

- `/admin/add-photo` — multi-file upload form; reads image dimensions client-side, uploads original + compressed thumbnail to Storage, and writes Firestore docs inside a single transaction that also bumps `counters/photos`.
- `/admin/settings` — currently only exposes "Re-serialize Image Database" (calls `reSerializePhotos`).

### Styling

SCSS modules co-located with components (`*.module.scss`). Globals in `app/globals.scss`, shared variables in `styles/_vars.scss`, fonts in `styles/_fonts.scss`. Geist / Geist Mono are loaded via `next/font/google` in `app/layout.tsx`.

## Things to know

- `getPhotoID` zero-pads to 5 digits — keep sequenceNumber and id in sync; reSerialize is the only tool that fixes drift.
- Several Firestore queries combine `where` + `orderBy` and require composite indexes; if a new filter is added, expect to create an index in the Firebase console.
- Photo navigation in `usePhotoCollection` loads the entire filtered list on each viewer load (no pagination) — fine at current scale but worth knowing before adding heavy per-photo work.
- `next-sitemap.config.js` hardcodes the production URL `https://jesselindphoto.vercel.app`.
