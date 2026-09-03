'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import styles from './page.module.scss'
import Image from 'next/image'

const TOTAL_IMAGES = 9

// The counter sits on a fixed, full-screen overlay, so a single image that
// never fires `load` locks the user out of the whole site. Reveal the page
// anyway once this much time has passed.
const REVEAL_TIMEOUT_MS = 10000

const HomeImages = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  const [settledImages, setSettledImages] = useState(0)
  const [revealed, setRevealed] = useState(false)

  // Listen on the DOM elements instead of React's onLoad. Images can finish
  // before hydration attaches a handler, and an image that 404s or is blocked
  // fires `error` rather than `load`. Both count as settled here.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const images = Array.from(container.querySelectorAll('img'))
    const settled = new Set<HTMLImageElement>()

    const markSettled = (img: HTMLImageElement) => {
      if (settled.has(img)) return
      settled.add(img)
      setSettledImages(settled.size)
    }

    const handleSettle = (event: Event) => {
      markSettled(event.currentTarget as HTMLImageElement)
    }

    const pending: HTMLImageElement[] = []
    images.forEach(img => {
      if (img.complete) {
        markSettled(img)
        return
      }
      pending.push(img)
      img.addEventListener('load', handleSettle)
      img.addEventListener('error', handleSettle)
    })

    return () => {
      pending.forEach(img => {
        img.removeEventListener('load', handleSettle)
        img.removeEventListener('error', handleSettle)
      })
    }
  }, [])

  useEffect(() => {
    if (settledImages < TOTAL_IMAGES) return

    // wait until next paint
    let innerFrame = 0
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        setRevealed(true)
      })
    })

    return () => {
      cancelAnimationFrame(outerFrame)
      cancelAnimationFrame(innerFrame)
    }
  }, [settledImages])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setRevealed(true)
    }, REVEAL_TIMEOUT_MS)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <>
      <div className={`${styles.loadingPage} ${revealed ? styles.loaded : ''}`}>
        <span>{settledImages}</span>
        <span>/</span>
        <span>{TOTAL_IMAGES}</span>
      </div>
      <div
        ref={containerRef}
        className={`${styles.imagesContainer} ${revealed ? styles.loaded : ''}`}
      >
        <Link
          href='/all-photos/00176'
          className={`${styles.displayedImg} ${styles.img1}`}
        >
          <Image
            priority
            fetchPriority='high'
            src='/images/home/1.webp'
            alt='Rainbow falling on dark mountain'
            width={3120}
            height={2080}
            sizes='(max-width: 576px) 92vw, 58vw'
          />
        </Link>
        <Link
          href='/all-photos/00130'
          className={`${styles.displayedImg} ${styles.img2}`}
        >
          <Image
            loading='eager'
            src='/images/home/2.webp'
            alt='Two people with blue umbrellas'
            width={2080}
            height={3120}
            sizes='33vw'
          />
        </Link>
        <Link
          href='/all-photos/00170'
          className={`${styles.displayedImg} ${styles.img3}`}
        >
          <Image
            loading='eager'
            src='/images/home/3.webp'
            alt='Ferris wheel with blue sky backdrop'
            width={3120}
            height={2080}
            sizes='(max-width: 576px) 50vw, 42vw'
          />
        </Link>
        <Link
          href='/all-photos/00173'
          className={`${styles.displayedImg} ${styles.img4}`}
        >
          <Image
            loading='eager'
            src='/images/home/4.webp'
            alt='Cat sitting on fence'
            width={3120}
            height={2080}
            sizes='(max-width: 576px) 83vw, 58vw'
          />
        </Link>
        <Link
          href='/all-photos/00138'
          className={`${styles.displayedImg} ${styles.img5}`}
        >
          <Image
            loading='eager'
            src='/images/home/5.webp'
            alt='Cat sitting upright'
            width={2080}
            height={3120}
            sizes='33vw'
          />
        </Link>
        <Link
          href='/all-photos/00174'
          className={`${styles.displayedImg} ${styles.img6}`}
        >
          <Image
            loading='eager'
            src='/images/home/6.webp'
            alt='Building with sunset sky'
            width={3120}
            height={2080}
            sizes='58vw'
          />
        </Link>
        <Link
          href='/all-photos/00181'
          className={`${styles.displayedImg} ${styles.img7}`}
        >
          <Image
            loading='eager'
            src='/images/home/7.webp'
            alt='Boat docked in harbor'
            width={3120}
            height={2080}
            sizes='42vw'
          />
        </Link>
        <Link
          href='/all-photos/00188'
          className={`${styles.displayedImg} ${styles.img8}`}
        >
          <Image
            loading='eager'
            src='/images/home/8.webp'
            alt='Two birds standing in beach waves'
            width={3120}
            height={2080}
            sizes='42vw'
          />
        </Link>
        <Link
          href='/all-photos/00185'
          className={`${styles.displayedImg} ${styles.img9}`}
        >
          <Image
            loading='eager'
            src='/images/home/9.webp'
            alt='Group of seagulls flying above lake at beach'
            width={3120}
            height={2080}
            sizes='58vw'
          />
        </Link>
      </div>
    </>
  )
}

export default HomeImages
