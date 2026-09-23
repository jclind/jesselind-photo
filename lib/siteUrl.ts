const fallback = 'https://jesselindphoto.vercel.app'

// One place for the production URL. Set NEXT_PUBLIC_SITE_URL when the site
// moves to a real domain; the sitemap, robots, and contact data all read this.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? fallback
).replace(/\/+$/, '')
