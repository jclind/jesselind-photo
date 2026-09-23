import type { MetadataRoute } from 'next'
import { collection, getDocs } from 'firebase/firestore/lite'
import { categories } from '@/data/categories'
import { projects } from '@/data/projects'
import { db } from '@/lib/firebase'
import { siteUrl } from '@/lib/siteUrl'

// lastmod comes from photo content, never from the clock. Every date traces
// back to a `photoDate` in Firestore, so a page's lastmod moves only when a
// photo behind it moves, and two builds over unchanged data agree. `/about`
// and `/privacy` have no photo behind them and get no lastmod at all.
// Omitting it is honest, and Google ignores lastmod it cannot trust.
//
// There is no catch around the Firestore read: a failure fails the build. The
// old next-sitemap setup soft-failed to an empty sitemap, so a rules change
// or an outage could silently publish a site no crawler could index. Missing
// a deploy is cheaper than quietly disappearing from search.

type ChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]['changeFrequency']
>

type PhotoEntry = { id: string; date: Date | null }

function toDate(value: unknown): Date | null {
  // firestore/lite hands back a Timestamp; be tolerant of a raw Date or string
  // in case a doc was written by hand.
  if (!value) return null
  const date =
    typeof value === 'object' && 'toDate' in value
      ? (value as { toDate: () => Date }).toDate()
      : new Date(value as string | number)
  return Number.isNaN(date.getTime()) ? null : date
}

function newer(a: Date | null, b: Date | null): Date | null {
  if (!a) return b
  if (!b) return a
  return a > b ? a : b
}

async function getPhotoIndex() {
  const index = {
    photos: [] as PhotoEntry[],
    byCategory: new Map<string, Date | null>(),
    byProject: new Map<string, Date | null>(),
    newest: null as Date | null,
  }
  const snap = await getDocs(collection(db, 'photos'))
  for (const doc of snap.docs) {
    const data = doc.data()
    if (typeof data.id !== 'string' || !data.id) continue
    const date = toDate(data.photoDate)
    index.photos.push({ id: data.id, date })
    index.newest = newer(index.newest, date)
    if (data.category) {
      index.byCategory.set(
        data.category,
        newer(index.byCategory.get(data.category) ?? null, date)
      )
    }
    if (data.projectID) {
      index.byProject.set(
        data.projectID,
        newer(index.byProject.get(data.projectID) ?? null, date)
      )
    }
  }
  // Firestore returns documents ordered by document name, which has no
  // relation to the padded `id`. Sort so the file's line order is stable
  // and readable rather than merely deterministic.
  index.photos.sort((a, b) => a.id.localeCompare(b.id))
  return index
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const index = await getPhotoIndex()
  const entries: MetadataRoute.Sitemap = []

  const push = (
    path: string,
    priority: number,
    changeFrequency: ChangeFrequency,
    lastmod: Date | null = null
  ) => {
    entries.push({
      // The home entry keeps the bare-origin form the old sitemap used, so
      // crawlers see one stable home URL.
      url: path === '/' ? siteUrl : `${siteUrl}${path}`,
      changeFrequency,
      priority,
      ...(lastmod ? { lastModified: lastmod } : {}),
    })
  }

  push('/', 1, 'weekly', index.newest)
  push('/about', 0.6, 'monthly')
  push('/privacy', 0.3, 'yearly')

  // The three listing pages surface the newest work, so they move when
  // anything is added.
  push('/all-photos', 0.9, 'weekly', index.newest)
  push('/collections', 0.9, 'weekly', index.newest)
  push('/projects', 0.9, 'weekly', index.newest)

  for (const category of categories) {
    if (category.hidden) continue
    push(
      `/collections/${category.slug}`,
      0.8,
      'weekly',
      index.byCategory.get(category.slug) ?? null
    )
  }

  for (const project of projects) {
    push(`/projects/${project.id}`, 0.8, 'weekly', index.byProject.get(project.id) ?? null)
  }

  for (const photo of index.photos) {
    push(`/all-photos/${photo.id}`, 0.8, 'monthly', photo.date)
  }

  return entries
}
