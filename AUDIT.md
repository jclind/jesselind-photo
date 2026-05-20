# Feature & Improvements Audit

A scan of the codebase for features that are noticeably missing or rough edges worth addressing, ordered by severity. Focused on what a simple photography portfolio benefits most from — not a wishlist.

---

## High — User-facing gaps that hurt the core experience

### 1. No mobile swipe / touch navigation in `PhotoViewer`
Keyboard arrows work (`PhotoViewer.tsx:84`), and there are invisible prev/next click targets, but mobile users have only the small footer buttons to advance. A horizontal swipe gesture (or even larger tap zones with visible affordance on first visit) is table-stakes for a photo viewer on phones — likely where most of your traffic lands from Instagram.

### 2. No share / copy-link affordance on a single photo
Every photo page has a canonical URL and proper OG metadata (`lib/photoMetadata.ts`), but there's no UI to actually share it. A single "copy link" or native `navigator.share` button next to the info toggle would meaningfully change how photos get circulated.

### 3. Photo "not found" is a dead end
`PhotoLoader.tsx:20` shows the string "Photo not found." with no link back to the gallery, no styling (the referenced `.errorMessage` class doesn't exist — already in `todo.md`), and no recovery. If a shared/old URL breaks, the visitor is stranded. Add a "Back to gallery" link in the error state and define the missing styles.

### 4. EXIF / camera metadata is invisible
`Photo` (`types/Photo.ts`) stores width/height/location/date but no camera, lens, ISO, focal length, aperture, or shutter speed. Most portfolio sites surface this in the info panel — it's part of why photographers visit other photographers' sites. Reading EXIF on upload (e.g. `exifr`) and persisting a small subset to Firestore is a contained change.

### 5. Stale documentation
- `CLAUDE.md` still describes the admin gate as a "password gate" reading `NEXT_PUBLIC_ADMIN_PASS` with 1-hour localStorage expiry, but `AdminGate.tsx` now uses real Firebase Auth with a custom-claims check. The env description and the `/admin` summary are wrong.
- `todo.md` line referencing "Redo authentication for admin panel" is done; the `.spinner` / `.errorMessage` style task is still valid.
- `README.md` is the default create-next-app boilerplate — no project-specific info at all.

---

## Medium — Discoverability and polish

### 6. No search or filtering
No way to search by title, location, year, or tag. At your current scale this is borderline, but a small "filter by year/location" affordance on `/all-photos` would help once the archive keeps growing. The data is already there (`photoDate`, `location`).

### 7. No archive / year browse
Photos have `photoDate` but there's no surface that exposes "2024", "2023", etc. A simple `/all-photos?year=2024` (or a chip row) would let visitors traverse the catalog more naturally than infinite scroll.

### 8. No map view despite storing `location`
`location` is a free-text field stored on every photo and shown in the info panel. Either upgrade to geocoded coords + a `/map` page (high effort, high reward for a travel-heavy portfolio with the Japan/Out West projects), or at minimum make the location text a link to a collection of photos sharing that location.

### 9. No "featured" / curated highlights
The home page has a hand-picked 9-image hero (`HomeImages.tsx`), but there's no editorial "best of" surface beyond it. A `/featured` page (or a `featured: true` flag on `Photo`) lets you point new visitors at your strongest 20–30 shots without making them scroll through everything.

### 10. No related / "more like this" in the viewer
Prev/next are strictly by sequence number. When a visitor opens a Japan photo, they don't get a "more from Japan 2023" or "more landscapes" nudge. The data joins are already there (`projectID`, `category`).

### 11. Photo count missing from gallery headers
Already noted in `todo.md`. Showing "Landscape — 42 photos" anchors the visitor and helps the page feel finite.

### 12. Production URL is a Vercel placeholder
`data/contact.ts` and `next-sitemap.config.js` both hardcode `https://jesselindphoto.vercel.app`. Once you have a real domain, this needs to move to a single env var — right now it's referenced from at least three places (contact.ts, sitemap config, JSON-LD via contact.ts).

### 13. Privacy page is sparse / boilerplate-feeling
`/privacy` exists in routing and sitemap but the content (verified by reading `page.tsx`) is minimal. If you're collecting analytics via GA, the privacy page should at least name what's collected and how to opt out.

---

## Low — Nice-to-haves and admin ergonomics

### 14. Admin can only add photos, not edit or delete
`/admin` has `add-photo` and `settings` (re-serialize + backfill blurs). There's no UI to:
- Edit a photo's title/description/location/category/project after upload
- Delete a photo (mistakes, duplicates)
- Bulk re-tag photos
- Manage categories or projects (today they're hand-edited TS files in `data/`)

A simple "edit photo" view reachable from the info panel (admin-only) would close the most common iteration loop.

### 15. No skeleton state on galleries during first fetch
On a cold load of `/all-photos`, the page is empty until the first Firestore batch resolves. A thumbnail-shaped skeleton grid would make the perceived load time shorter.

### 16. No error boundary
A single bad photo doc or a Firestore hiccup currently surfaces as a blank section or console error. A top-level `error.tsx` (Next 13+ App Router) with a friendly message and a retry would be a small, durable improvement.

### 17. Custom 404 is minimal
`app/not-found.tsx` has the title and a home link, no styling beyond `notFoundPage`, no thematic photo, no nav to collections/projects. Cheap to make this feel intentional.

### 18. Image protection is light
`PhotoImage.tsx` sets `draggable={false}` but right-click save still works and there's no watermark on full-res images. The copyright notice in the nav footer ("© Jesse Lind. No images may be used…") is good, but if licensing matters, consider a visible watermark on full-size delivery or a server-side resized "display" version distinct from the original.

### 19. No analytics events beyond pageviews
GA fires on route changes via `NavigationTracker`, but there's no signal for which photos get viewed longest, which ones get prev/next'd past quickly, share clicks, or info-panel opens. A handful of `gtag('event', …)` calls in `PhotoViewer` would let you actually answer "what resonates?"

### 20. No RSS / JSON feed for new photos
Lower priority, but for repeat visitors who follow photographers via feed readers, exposing `/feed.xml` of the N most recent photos is ~20 lines.

### 21. `image protection` and watermark — paired with #18
If the photos are meant to be sold or licensed (BuyMeACoffee link in contact suggests some commercial intent), a "Buy a print" CTA on individual photos is worth considering. Otherwise drop the consideration entirely.

---

## Closing notes

The site is in solid shape — most of the above is incremental polish. The two highest-leverage changes for a portfolio specifically are **(1) mobile swipe navigation** and **(4) EXIF display**, because they're both visible to every visitor and what people coming from other photography sites tend to expect. **(5) doc cleanup** is the cheapest win.
