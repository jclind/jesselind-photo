-[X] Change GalleryTemplate max height based on height and width of screen. -[X] Change PAGE_LIMIT for photo gallery to get more photos with each query -[X] update abstract and astronomy and people and plane & machine and studio category images -[X] update abstract collection image for styling issue -[X] check about page link mobile sizing -[X] on route change close navbar -[X] don't allow home page logo to be selected / or turn it into a link -[X] collections page on mobile needs default height to prevent shift

# features

- [ ] add number of photos in cycle in each gallery / photo page -[X] ad loading where number of loaded images are shown. (Added to home page)
- [ ] eventually figure out how to make home page loading not be called again (or be delayed while checking for loaded images) if it has already been visited (and the images have been loaded therefore) in this session.
- [ ] set persistent state for gallery style
- [ ] recalculate gallery layout on page size update
- [ ] Redo authentication for admin panel
- [ ] update firestore rules
- [ ] add `.spinner` and `.errorMessage` styles to `components/PhotoViewer/PhotoViewer.module.scss` — currently referenced by `PhotoLoader.tsx` but undefined, so the "Loading..." / "Photo not found." fallbacks render unstyled
- [ ] add catch for when home screen doesn't load correctly (is stuck in 0/9)
