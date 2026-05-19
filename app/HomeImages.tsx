'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import styles from './page.module.scss'
import Image from 'next/image'

const HomeImages = () => {
  const totalImages = 9

  const [loadedImages, setLoadedImages] = useState(0)
  const [allLoaded, setAllLoaded] = useState(false)

  const handleImageLoad = () => {
    setLoadedImages(prev => prev + 1)
  }

  useEffect(() => {
    if (loadedImages === totalImages) {
      // wait until next paint
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAllLoaded(true)
        })
      })
    }
  }, [loadedImages, totalImages])

  return (
    <>
      <div
        className={`${styles.loadingPage} ${allLoaded ? styles.loaded : ''}`}
      >
        <span>{loadedImages}</span>
        <span>/</span>
        <span>{totalImages}</span>
      </div>
      <div
        className={`${styles.imagesContainer} ${
          allLoaded ? styles.loaded : ''
        }`}
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
            onLoad={handleImageLoad}
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
            onLoad={handleImageLoad}
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
            onLoad={handleImageLoad}
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
            onLoad={handleImageLoad}
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
            onLoad={handleImageLoad}
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
            onLoad={handleImageLoad}
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
            onLoad={handleImageLoad}
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
            onLoad={handleImageLoad}
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
            onLoad={handleImageLoad}
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
