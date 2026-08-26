-[X] Change GalleryTemplate max height based on height and width of screen. -[X] Change PAGE_LIMIT for photo gallery to get more photos with each query -[X] update abstract and astronomy and people and plane & machine and studio category images -[X] update abstract collection image for styling issue -[X] check about page link mobile sizing -[X] on route change close navbar -[X] don't allow home page logo to be selected / or turn it into a link -[X] collections page on mobile needs default height to prevent shift

# features

- [ ] add number of photos in cycle in each gallery / photo page -[X] ad loading where number of loaded images are shown. (Added to home page)
- [x] eventually figure out how to make home page loading not be called again (or be delayed while checking for loaded images) if it has already been visited (and the images have been loaded therefore) in this session.
- [x] set persistent state for gallery style
- [ ] recalculate gallery layout on page size update
- [x] Redo authentication for admin panel
- [x] update firestore rules
- [x] add styles for the `PhotoLoader` messages in `components/PhotoViewer/PhotoViewer.module.scss`. `.spinner` was renamed `.loadingMessage` since it never rendered a spinner; it and `.errorMessage` now use `$secondary-text` / `$fs-small` instead of falling back to body defaults
- [ ] add catch for when home screen doesn't load correctly (is stuck in 0/9)
- [ ] gallery images have greater clickable areas than what the image shows

# chores

- [ ] migrate lint to flat-config ESLint. `npm run lint` runs `next lint`, which Next 16 removed, so it fails with "Invalid project directory provided, no such directory: ./lint". The repo still has an `.eslintrc`. Needs an `eslint.config.mjs` plus `eslint-config-next` wired up, and the `lint` script pointed at `eslint`. `CLAUDE.md` documents the old command and needs updating too.
