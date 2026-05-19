# SEO + Structured Data Review — jesselind-photo

Reviewed: 2026-05-19 — `audit` branch
Site: https://jesselindphoto.vercel.app
Read-only review. No code changes applied. Recommendations only.

---

## Executive summary

The site has a clean baseline: comprehensive root metadata, OG/Twitter tags, per-route titles, a working sitemap for static routes, robots.txt, and an HTTPS canonical host. The gaps are concentrated in the highest-leverage area for a photo portfolio:

- **Photo viewer routes** carry the weakest metadata, no canonical, no structured data, and are absent from the sitemap. They are also the URLs you most want crawled and ranked.
- **No JSON-LD anywhere.** `Photograph`, `ImageGallery`, and `Person` are the single biggest unrealized opportunity for Google Image Search visibility and rich attribution.
- **Duplicate-content risk** is real: the same photo is reachable at three URLs (`/all-photos/<id>`, `/projects/<x>/<id>`, `/collections/<y>/<id>`) with no canonical pointing to a single primary.
- The Firebase Lite SDK in `lib/firebase.ts` calls `getFirestore` at module load. It will run in a Node server context, so `generateMetadata` *can* fetch a photo doc server-side — but consider a small server-only helper that caches the read across the metadata + page request to avoid double-fetching.

Performance / Core Web Vitals were covered in the prior pass; not repeated here beyond noting LCP 2.6s is just over the "good" threshold and CWV is a soft ranking signal.

---

## Findings

| Priority | Area | Location | Issue | Recommendation |
|---|---|---|---|---|
| 🔴 High | Image SEO | `app/all-photos/[photoID]/page.tsx:9-12`, `app/projects/[projectID]/[photoID]/page.tsx:10-13`, `app/collections/[collectionID]/[photoID]/page.tsx:10-13` | Title and description are only `photoID` — Google sees `00324 \| Jesse Lind Photography` / `View photo 00324 by Jesse Lind`. No category, location, date, or actual photo title surfaced. No OG image. | Fetch the photo doc in `generateMetadata` (Firestore Lite supports server `getDocs`). Build title from `photo.title || \`${category} photograph by Jesse Lind\``; description from title + location + formatted `photoDate`. Set `openGraph.images: [{ url: photo.fullUrl, width: photo.width, height: photo.height, alt: ... }]`. |
| 🔴 High | Canonical URLs | All three photo viewer routes | Same photo reachable at `/all-photos/<id>`, `/projects/<x>/<id>`, `/collections/<y>/<id>` with no canonical tag — Google treats them as duplicates and splits link equity. | Set `alternates: { canonical: \`/all-photos/${photoID}\` }` in `generateMetadata` for all three viewer routes. Pick `/all-photos/<id>` as the single canonical. |
| 🔴 High | Sitemap | `next-sitemap.config.js`, `public/sitemap-0.xml` | Sitemap contains only 19 static URLs. Every photo viewer route (the bulk of the site's indexable surface) is missing. Photos are only reachable via infinite-scroll galleries, which Googlebot does not scroll. | Add `additionalPaths` to `next-sitemap.config.js` that queries Firestore at build time for every photo id and emits `/all-photos/<id>`. Optionally include `image:` sitemap extensions for image search. Snippet at end. |
| 🔴 High | Structured data | All routes | No `application/ld+json` anywhere. Largest miss: `Photograph` schema on viewer routes — fuels Google Images attribution, date facets, licensing. | Add `<script type="application/ld+json">` blocks: `WebSite`+`Person` on `/`, `Person` on `/about`, `ImageGallery` or `CollectionPage` on project/collection pages, `Photograph` on viewer pages. Ready-to-paste templates below. |
| 🟡 Medium | OG images | `app/projects/[projectID]/page.tsx:11-24`, `app/collections/[collectionID]/page.tsx:11-23` | Every project/collection page falls back to the generic `/default-og.webp`. Sharing a project page on Twitter/Discord shows the generic site card, not the project poster. | Add `openGraph.images` in each `generateMetadata`. Project pages → `project.posterUrl` (already 2000×2000). Collection pages → `category.imgSrc`. |
| 🟡 Medium | Crawlability | `components/GalleryTemplate/GalleryTemplate.tsx:66-81` | Photos are only linked from `GalleryTemplate`, which loads pages via `IntersectionObserver`. Googlebot does not scroll, so only the first page of photos in each gallery is crawlable through link discovery. | Two complementary fixes: (1) ensure every photo URL is in the sitemap (see above); (2) consider rendering an SEO-only `<noscript>` or hidden `<ul>` of `<a href="/all-photos/<id>">` for all photos on the gallery pages, or paginated SSR via search params. |
| 🟡 Medium | Per-route metadata depth | `app/projects/[projectID]/page.tsx:11-24`, `app/collections/[collectionID]/page.tsx:11-23` | Only `title` + `description`; description for collection pages is `\`A Collection of photos in the ${collectionID} category by Jesse Lind\`` — uses the raw slug (e.g. `plane-and-machine`) without humanizing. No `openGraph` overrides, no `keywords`. | Use `category.name` (already humanized) instead of `collectionID`. Add `openGraph.images`, `openGraph.description`, `keywords: [category.name, 'photography', 'jesse lind']`. |
| 🟡 Medium | metadataBase / OG image URL | `app/layout.tsx:24-50` | `twitter.images: ['/default-og.png']` references `.png` but only `default-og.webp` exists in `public/`. This means Twitter's preview falls back to nothing. | Change `twitter.images` to `['/default-og.webp']` (or add a `.png` variant — Twitter has historically been pickier than OG about WebP support; verify with the [Twitter card validator](https://cards-dev.twitter.com/validator)). |
| 🟡 Medium | Canonical host | `next-sitemap.config.js:3`, `data/contact.ts:3` | Production URL is hardcoded as `https://jesselindphoto.vercel.app`. If a custom domain is ever added, Google will see the Vercel preview-style host as canonical and the custom domain as duplicate. | Confirm whether the Vercel domain is final. If not, plan to switch `PHOTO_WEBSITE_URL` and `next-sitemap.config.js#siteUrl` together (the comment at `data/contact.ts:3` already flags this). |
| 🟡 Medium | Alt text quality | `util/getPhotoAlt.ts:5-15` | Fallback chain is good (`title → "${category}, ${location}" → "Photograph"`) but the final `'Photograph'` and the bare `"${category}, ${location}"` versions miss Jesse's name and the date. Image-search ranking weights alt heavily. | Enrich the final fallback to include author and date, e.g. `\`${category} photograph by Jesse Lind, ${year}\``. Keep it short (Google truncates ~125 chars). |
| 🟠 Low | Breadcrumbs | All viewer routes | No visual or schema breadcrumbs. Visually it's fine, but `BreadcrumbList` JSON-LD would surface "Home › Collections › Landscape" in Google SERPs. | Add `BreadcrumbList` schema in viewer route metadata. Template below. |
| 🟠 Low | robots.txt | `public/robots.txt` | Generated by `next-sitemap`. Currently `Allow: /` only — does not disallow `/admin/*`. Sitemap exclusion is not the same as a robots disallow. Soft password gate doesn't stop crawling. | Add `disallow: ['/admin', '/admin/*']` under `robotsTxtOptions` in `next-sitemap.config.js` so the generated robots.txt blocks crawlers from indexing admin pages directly. |
| 🟠 Low | Sitemap priority | `public/sitemap-0.xml` | Every URL has `priority=0.7` and `changefreq=daily`. Homepage and `/all-photos` deserve higher priority; static legal pages deserve lower. | Configure `priority`/`changefreq` per-route via `transform` in `next-sitemap.config.js`. Modest impact — Google largely ignores these, but Bing still respects them. |
| 🟠 Low | viewport / themeColor | `app/layout.tsx:88-90` | Only `themeColor` is set. Setting `width: 'device-width', initialScale: 1` is implicit via Next's default but worth being explicit for Lighthouse SEO scoring. | Optional — `next` already inserts the default viewport. Verify Lighthouse SEO category is 100/100; if not, this is the likely gap. |
| 🟠 Low | hreflang | All routes | English-only site, but `<html lang='en'>` is set at `app/layout.tsx:100`. Fine. No `hreflang` needed unless a localized version is planned. | No action. Noted for completeness. |
| 🟠 Low | `not-found.tsx` | `app/not-found.tsx` | The "Home" link goes to `/all-photos/00176` — a deep photo link. Crawlers landing on a 404 typically expect a link to `/`. | Change the link target to `/` (or both — primary to `/`, optionally a secondary "Browse photos" link). Minor SEO; mostly a UX fix. |

---

## Ready-to-paste JSON-LD

All blocks below are templates. Drop them into the relevant `generateMetadata` or page component, either as `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />` or via `metadata.other`. Per Next 15, the recommended pattern is inline `<script>` in the page component (server component) — `next/script`'s `beforeInteractive` is overkill for static JSON-LD.

### 1. `WebSite` + `Person` (home `/`)

```jsonc
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://jesselindphoto.vercel.app/#website",
      "url": "https://jesselindphoto.vercel.app",
      "name": "Jesse Lind Photography",
      "description": "Photography portfolio of Jesse Lind",
      "inLanguage": "en-US",
      "publisher": { "@id": "https://jesselindphoto.vercel.app/#person" }
    },
    {
      "@type": "Person",
      "@id": "https://jesselindphoto.vercel.app/#person",
      "name": "Jesse Lind",
      "url": "https://jesselindphoto.vercel.app",
      "image": "https://jesselindphoto.vercel.app/default-og.webp",
      "jobTitle": "Photographer",
      "sameAs": [
        "https://www.instagram.com/jesselindphoto",
        "https://github.com/jclind",
        "https://jesselind.com",
        "https://buymeacoffee.com/jesseclind"
      ]
    }
  ]
}
```

Pull the `sameAs` array dynamically from `CONTACT_LINKS` (filter out the `mailto:` and the "Support Me" entry if you'd rather not surface it).

### 2. `Photograph` (each viewer route — `/all-photos/[photoID]`, `/projects/[projectID]/[photoID]`, `/collections/[collectionID]/[photoID]`)

```jsonc
{
  "@context": "https://schema.org",
  "@type": "Photograph",
  "@id": "https://jesselindphoto.vercel.app/all-photos/{photo.id}#photograph",
  "name": "{photo.title || `${capitalize(photo.category)} photograph by Jesse Lind`}",
  "description": "{photo.title || ''}{photo.location ? ` — ${photo.location}` : ''}",
  "contentUrl": "{photo.fullUrl}",
  "thumbnailUrl": "{photo.thumbnailUrl}",
  "width": { "@type": "QuantitativeValue", "value": "{photo.width}", "unitCode": "E37" },
  "height": { "@type": "QuantitativeValue", "value": "{photo.height}", "unitCode": "E37" },
  "datePublished": "{photo.photoDate.toDate().toISOString()}",
  "dateCreated": "{photo.photoDate.toDate().toISOString()}",
  "representativeOfPage": true,
  "license": "https://jesselindphoto.vercel.app/about",
  "acquireLicensePage": "https://jesselindphoto.vercel.app/about",
  "creditText": "Jesse Lind",
  "creator": { "@id": "https://jesselindphoto.vercel.app/#person" },
  "copyrightHolder": { "@id": "https://jesselindphoto.vercel.app/#person" },
  "copyrightNotice": "© Jesse Lind",
  "contentLocation": {
    "@type": "Place",
    "name": "{photo.location}"
  }
}
```

Notes:
- Omit `contentLocation` entirely when `photo.location` is empty (don't emit a `Place` with no name).
- `unitCode: "E37"` is UN/CEFACT for pixels.
- Setting `license` to an internal URL is standard when no formal license exists; replace with a stock-photo license URL if you ever sell prints.

### 3. `ImageGallery` (project pages `/projects/[projectID]` and collection pages `/collections/[collectionID]`)

```jsonc
{
  "@context": "https://schema.org",
  "@type": "ImageGallery",
  "@id": "https://jesselindphoto.vercel.app/projects/{project.id}#gallery",
  "name": "{project.name}",
  "description": "{project.description}",
  "url": "https://jesselindphoto.vercel.app/projects/{project.id}",
  "dateCreated": "{new Date(project.date).toISOString()}",
  "image": "{project.posterUrl}",
  "creator": { "@id": "https://jesselindphoto.vercel.app/#person" }
}
```

For collection pages, swap `ImageGallery` → `CollectionPage` and omit `dateCreated`:

```jsonc
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://jesselindphoto.vercel.app/collections/{category.name}#collection",
  "name": "{capitalize(category.name)} — Jesse Lind Photography",
  "url": "https://jesselindphoto.vercel.app{category.path}",
  "about": "{category.name}",
  "image": "https://jesselindphoto.vercel.app{category.imgSrc}",
  "isPartOf": { "@id": "https://jesselindphoto.vercel.app/#website" }
}
```

### 4. `BreadcrumbList` (viewer routes — optional but high polish)

```jsonc
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://jesselindphoto.vercel.app" },
    { "@type": "ListItem", "position": 2, "name": "Collections", "item": "https://jesselindphoto.vercel.app/collections" },
    { "@type": "ListItem", "position": 3, "name": "{capitalize(category.name)}", "item": "https://jesselindphoto.vercel.app/collections/{category.name}" },
    { "@type": "ListItem", "position": 4, "name": "{photo.id}", "item": "https://jesselindphoto.vercel.app/collections/{category.name}/{photo.id}" }
  ]
}
```

Generate the trail dynamically based on which viewer route is rendering (all-photos / projects / collections).

---

## Sitemap fix

`next-sitemap` runs after `next build`. To include every photo URL, hand it an `additionalPaths` function that pulls photo ids from Firestore at build time. Two preconditions:

1. The build environment has the `NEXT_PUBLIC_FIREBASE_*` env vars (Vercel does).
2. `additionalPaths` runs in Node — `firebase/firestore/lite` works there.

```js
// next-sitemap.config.js
/** @type {import('next-sitemap').IConfig} */
const { initializeApp, getApps } = require('firebase/app')
const { getFirestore, collection, getDocs } = require('firebase/firestore/lite')

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const SITE = 'https://jesselindphoto.vercel.app'

module.exports = {
  siteUrl: SITE,
  generateRobotsTxt: true,
  exclude: ['/admin', '/admin/*'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/admin/*'] },
    ],
  },
  transform: async (config, path) => {
    let priority = 0.7
    let changefreq = 'weekly'
    if (path === '/') { priority = 1.0; changefreq = 'weekly' }
    else if (path === '/all-photos' || path === '/collections' || path === '/projects') { priority = 0.9 }
    else if (path.startsWith('/all-photos/') || path.startsWith('/projects/') || path.startsWith('/collections/')) { priority = 0.8 }
    else if (path === '/privacy') { priority = 0.3; changefreq = 'yearly' }
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    }
  },
  additionalPaths: async () => {
    if (!getApps().length) initializeApp(firebaseConfig)
    const db = getFirestore()
    const snap = await getDocs(collection(db, 'photos'))
    return snap.docs.map(d => ({
      loc: `/all-photos/${d.id}`,
      changefreq: 'monthly',
      priority: 0.8,
      lastmod: new Date().toISOString(),
    }))
  },
}
```

Notes:
- Only emit one URL per photo (the canonical `/all-photos/<id>`). Don't add the `projects/` and `collections/` variants — they should canonicalize to `/all-photos/<id>` via the `<link rel="canonical">` you add in the viewer route metadata.
- If you want richer image-sitemap output (image captions, license), `next-sitemap` supports a custom `additionalSitemaps` for image XML. That's optional and most search engines now derive image info from page metadata + JSON-LD anyway.
- Verify by running `npm run build` and inspecting `public/sitemap-0.xml` — it should grow from ~20 URLs to (photo count + ~20).

---

## Sanity-check checklist

After applying the above, validate:

- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results) — paste a photo viewer URL; expect `Photograph` to be detected.
- [ ] [Schema.org validator](https://validator.schema.org/) — paste raw JSON-LD; expect zero errors.
- [ ] Open Graph debugger ([opengraph.xyz](https://www.opengraph.xyz/)) — paste a photo viewer URL; expect the photo (not the default OG) to appear.
- [ ] [Twitter card validator](https://cards-dev.twitter.com/validator) — paste home + photo URLs.
- [ ] Inspect `public/sitemap-0.xml` after build — confirm photo URLs are present.
- [ ] Search Google for `site:jesselindphoto.vercel.app` after deploy + 1-2 weeks — confirm photo viewer URLs are indexed.
- [ ] [PageSpeed Insights](https://pagespeed.web.dev/) for a photo viewer URL — confirm LCP doesn't regress from the OG image fetch in `generateMetadata`.

---

## Out of scope (already covered or no action needed)

- Root metadata (`app/layout.tsx`) — comprehensive; only nit is the `.png` reference at line 49.
- Robots meta — `index, follow` on every page via root metadata.
- Favicons — all sizes covered.
- HTTPS — Vercel-provided.
- `lang` attribute — set at `app/layout.tsx:100`.
- Sitemap base existence — present; just incomplete.
- Core Web Vitals — covered in `performance-report.md`.
