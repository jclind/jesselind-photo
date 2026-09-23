const fallback = 'https://jesselindphoto.vercel.app'

// One place for the production URL. Set NEXT_PUBLIC_SITE_URL when the site
// moves to a real domain; the sitemap, robots, and contact data all read
// this. A set-but-unusable value (placeholder text, no scheme) falls back to
// the default instead of breaking the build: layout.tsx feeds this straight
// into new URL() for metadataBase, which throws on anything that does not
// parse, and a deployed garbage value once did exactly that.
function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured && /^https?:\/\//.test(configured)) {
    return configured.replace(/\/+$/, '')
  }
  return fallback
}

export const siteUrl = resolveSiteUrl()
