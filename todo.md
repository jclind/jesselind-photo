-[X] Change GalleryTemplate max height based on height and width of screen. -[X] Change PAGE_LIMIT for photo gallery to get more photos with each query -[X] update abstract and astronomy and people and plane & machine and studio category images -[X] update abstract collection image for styling issue -[X] check about page link mobile sizing -[X] on route change close navbar -[X] don't allow home page logo to be selected / or turn it into a link -[X] collections page on mobile needs default height to prevent shift

# features

- [ ] add number of photos in cycle in each gallery / photo page -[X] ad loading where number of loaded images are shown. (Added to home page)
- [x] eventually figure out how to make home page loading not be called again (or be delayed while checking for loaded images) if it has already been visited (and the images have been loaded therefore) in this session.
- [x] set persistent state for gallery style
- [ ] recalculate gallery layout on page size update
- [x] Redo authentication for admin panel
- [x] update firestore rules
- [x] add styles for the `PhotoLoader` messages in `components/PhotoViewer/PhotoViewer.module.scss`. `.spinner` was renamed `.loadingMessage` since it never rendered a spinner; it and `.errorMessage` now use `$secondary-text` / `$fs-small` instead of falling back to body defaults
- [x] add catch for when home screen doesn't load correctly (is stuck in 0/9). `HomeImages` now counts an image as settled on `error` as well as `load`, tracks them through DOM listeners instead of React's `onLoad` (so images that finish before hydration still count), and reveals the page after 10s no matter what. `page.module.scss` has a 14s CSS-only fallback for the case where the bundle never runs, since the overlay is `position: fixed; z-index: 20` and otherwise blocks the whole site.
- [ ] gallery images have greater clickable areas than what the image shows

# chores

- [x] migrate lint to flat-config ESLint. `eslint.config.mjs` now spreads `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`, and the `lint` script runs `eslint` directly. Pinned to `eslint@^9`: eslint 10 crashes because `eslint-plugin-react` 7.x still calls the removed `context.getFilename()`.
- [ ] clear the 18 react-hooks errors the new lint setup surfaced. All from `eslint-plugin-react-hooks` v7, which added compiler-backed rules the old config never ran. Until these are fixed `npm run lint` exits 1.
  - `react-hooks/refs`, 13 errors in `components/GalleryTemplate/GalleryTemplate.tsx` lines 53-69. `initialEntryRef.current` is read and written during render for lazy init, and the `useState` initializers read `initial` off it. This drives scroll restoration, so changing it needs manual testing of back-navigation from a photo viewer.
  - `react-hooks/set-state-in-effect`, 5 errors: `app/admin/add-photo/page.tsx:49`, `components/Common/Navbar/Navbar.tsx:16`, `components/GalleryTemplate/PhotoRows.tsx:65`, `components/PhotoViewer/PhotoViewer.tsx:42`, `hooks/usePhotoCollection.tsx:100`.
- [ ] add a CI workflow. There is no `.github/workflows` directory at all, which is how `next lint` stayed broken from the Next 16 upgrade until someone happened to run it. Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` on PRs into main. Blocked on the react-hooks errors above, since lint exits 1 until those are cleared.
- [ ] stop committing the generated sitemap. `next-sitemap` stamps `lastmod: new Date().toISOString()` onto every path on every `postbuild`, so any local build leaves a 344-line diff in `public/sitemap-0.xml` that has to be reverted by hand. `public/sitemap.xml` and `public/robots.txt` are generated too. Two ways out: gitignore all three, or make `lastmod` stable so it only moves when content does. Before gitignoring, confirm Vercel's build environment has the `NEXT_PUBLIC_FIREBASE_*` vars. `additionalPaths` pulls every photo URL from Firestore and its catch block returns `[]` on failure, so a build without those vars would publish a sitemap missing every photo page and say so only in a build log warning.
- [ ] `GalleryTemplate` accepts a `pageSize` prop, defaults it to 10, and never reads it. All three galleries pass `pageSize={PAGE_SIZE}` and it goes nowhere. Either wire it into the fetch or drop the prop and the three call sites.
- [ ] `react-hooks/exhaustive-deps` warnings in `components/PhotoViewer/PhotoViewer.tsx:108` (`handleClickNext`, `handleClickPrev`) and `hooks/usePhotoCollection.tsx:169` (`filter`).
- [ ] swap the raw `<img>` upload preview in `app/admin/add-photo/page.tsx:214` for `next/image`, or silence `@next/next/no-img-element` there on purpose.
