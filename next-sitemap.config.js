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
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
      alternateRefs: config.alternateRefs ?? [],
    }
  },
  additionalPaths: async () => {
    if (!getApps().length) initializeApp(firebaseConfig)
    try {
      const db = getFirestore()
      const snap = await getDocs(collection(db, 'photos'))
      return snap.docs
        .map(d => d.data().id)
        .filter(id => typeof id === 'string' && id.length > 0)
        .map(id => ({
          loc: `/all-photos/${id}`,
          changefreq: 'monthly',
          priority: 0.8,
          lastmod: new Date().toISOString(),
        }))
    } catch (err) {
      console.warn(
        '[next-sitemap] Skipping photo URLs — Firestore fetch failed:',
        err.message
      )
      return []
    }
  },
}
