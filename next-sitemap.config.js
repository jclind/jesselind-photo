const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd())

const { initializeApp, getApps } = require('firebase/app')
const {
  getFirestore,
  collection,
  getDocs,
} = require('firebase/firestore/lite')

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// lastmod comes from photo content, never from the clock.
//
// This file used to stamp `new Date().toISOString()` on every path, so each
// build rewrote all 344 entries and told crawlers the whole site had changed.
// Now every date traces back to a `photoDate` in Firestore: a page's lastmod
// moves only when a photo behind it moves. Two builds over unchanged data
// produce byte-identical output.
//
// `/about` and `/privacy` have no photo behind them and so get no lastmod at
// all. Omitting it is honest, and Google ignores lastmod it cannot trust.

function toDate(value) {
  // firestore/lite hands back a Timestamp; be tolerant of a raw Date or string
  // in case a doc was written by hand.
  if (!value) return null
  const date =
    typeof value.toDate === 'function' ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function newer(a, b) {
  if (!a) return b
  if (!b) return a
  return a > b ? a : b
}

// One Firestore read per build, shared by transform() and additionalPaths().
// next-sitemap calls transform() once per path, so this must not refetch.
let photoIndexPromise = null

function getPhotoIndex() {
  if (photoIndexPromise) return photoIndexPromise
  photoIndexPromise = (async () => {
    const empty = {
      photos: [],
      byCategory: new Map(),
      byProject: new Map(),
      newest: null,
    }
    try {
      if (!getApps().length) initializeApp(firebaseConfig)
      const snap = await getDocs(collection(getFirestore(), 'photos'))

      const index = {
        photos: [],
        byCategory: new Map(),
        byProject: new Map(),
        newest: null,
      }
      for (const doc of snap.docs) {
        const data = doc.data()
        if (typeof data.id !== 'string' || !data.id) continue
        const date = toDate(data.photoDate)
        index.photos.push({ id: data.id, date })
        index.newest = newer(index.newest, date)
        if (data.category) {
          index.byCategory.set(
            data.category,
            newer(index.byCategory.get(data.category), date)
          )
        }
        if (data.projectID) {
          index.byProject.set(
            data.projectID,
            newer(index.byProject.get(data.projectID), date)
          )
        }
      }
      // Firestore returns documents ordered by document name, which has no
      // relation to the padded `id`. Sort so the file's line order is stable
      // and readable rather than merely deterministic.
      index.photos.sort((a, b) => a.id.localeCompare(b.id))
      return index
    } catch (err) {
      console.warn(
        '[next-sitemap] Skipping photo URLs — Firestore fetch failed:',
        err.message
      )
      return empty
    }
  })()
  return photoIndexPromise
}

// The newest photo in a section, as the ISO string next-sitemap wants.
function lastmodFor(path, index) {
  if (path.startsWith('/collections/')) {
    return index.byCategory.get(path.slice('/collections/'.length)) ?? null
  }
  if (path.startsWith('/projects/')) {
    return index.byProject.get(path.slice('/projects/'.length)) ?? null
  }
  // The home page and the three listing pages all surface the newest work, so
  // they move when anything is added.
  if (
    path === '/' ||
    path === '/all-photos' ||
    path === '/collections' ||
    path === '/projects'
  ) {
    return index.newest
  }
  return null
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://jesselindphoto.vercel.app',
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
    if (path === '/') {
      priority = 1.0
    } else if (
      path === '/all-photos' ||
      path === '/collections' ||
      path === '/projects'
    ) {
      priority = 0.9
    } else if (
      path.startsWith('/projects/') ||
      path.startsWith('/collections/')
    ) {
      priority = 0.8
    } else if (path === '/about') {
      priority = 0.6
      changefreq = 'monthly'
    } else if (path === '/privacy') {
      priority = 0.3
      changefreq = 'yearly'
    }

    const lastmod = lastmodFor(path, await getPhotoIndex())

    return {
      loc: path,
      changefreq,
      priority,
      ...(lastmod ? { lastmod: lastmod.toISOString() } : {}),
      alternateRefs: config.alternateRefs ?? [],
    }
  },
  additionalPaths: async () => {
    const index = await getPhotoIndex()
    return index.photos.map(photo => ({
      loc: `/all-photos/${photo.id}`,
      changefreq: 'monthly',
      priority: 0.8,
      ...(photo.date ? { lastmod: photo.date.toISOString() } : {}),
    }))
  },
}
