import type { Metadata } from 'next'
import './globals.scss'
import Navbar from '@/components/Common/Navbar'
import { PHOTO_WEBSITE_URL } from '@/data/contact'
import LogoButton from '@/components/Common/LogoButton'

export const metadata: Metadata = {
  metadataBase: new URL(PHOTO_WEBSITE_URL),
  title: 'Jesse Lind Photography',
  description:
    'Explore the photography portfolio of Jesse Lind, featuring curated galleries and projects.',

  openGraph: {
    title: 'Jesse Lind Photography',
    url: PHOTO_WEBSITE_URL,
    siteName: 'Jesse Lind Photography',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/default-og.webp',
        width: 1000,
        height: 1000,
        alt: 'Jesse Lind Photography Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jesse Lind Photography',
    description: 'Explore curated galleries and projects by Jesse Lind.',
    images: ['/default-og.png'],
  },
  icons: [
    // Desktop favicons
    {
      rel: 'icon',
      url: '/favicon-16x16.png',
      sizes: '16x16',
      type: 'image/png',
    },
    {
      rel: 'icon',
      url: '/favicon-32x32.png',
      sizes: '32x32',
      type: 'image/png',
    },

    // iOS / Apple touch
    {
      rel: 'apple-touch-icon',
      url: '/apple-icon-180x180.png',
      sizes: '180x180',
    },

    // Android / Chrome
    {
      rel: 'icon',
      url: '/android-icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
    },
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  authors: [{ name: 'Jesse Lind', url: 'https://jesselind.com' }],
}
export const viewport = {
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const GA_ID = 'G-G4SQVX634K'

  return (
    <html lang='en'>
      <head>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        <link
          rel='preconnect'
          href='https://firebasestorage.googleapis.com'
          crossOrigin=''
        />
        <link
          rel='preconnect'
          href='https://firestore.googleapis.com'
          crossOrigin=''
        />
      </head>
      <body>
        <LogoButton />
        <Navbar />
        {children}
      </body>
    </html>
  )
}
