'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import styles from './page.module.scss'
import Image from 'next/image'

const HomeImages = () => {
  const totalImages = 9

  const [loadedImages, setLoadedImages] = useState(0)
  const [allLoaded, setAllLoaded] = useState(false)
  const [isDelayComplete, setIsDelayComplete] = useState(true)

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
  useEffect(() => {
    setTimeout(() => {
      setIsDelayComplete(true)
    }, 500)
  }, [])

  return (
    <>
      <div
        className={`${styles.loadingPage} ${allLoaded ? styles.loaded : ''}`}
      >
        {isDelayComplete && (
          <>
            <span>{loadedImages}</span>
            <span>/</span>
            <span>{totalImages}</span>
          </>
        )}
      </div>
      <div
        className={`${styles.imagesContainer} ${
          allLoaded ? styles.loaded : ''
        }`}
      >
        <Link
          href='/all-photos/00176'
          className={`${styles.displayedImg} ${styles.img1}`}
          aria-label='Link to photo 00176'
        >
          <Image
            loading='eager'
            src='/images/home/1.webp'
            alt='Rainbow falling on dark mountain'
            onLoad={handleImageLoad}
            width={3120}
            height={2080}
          />
        </Link>
        <Link
          href='/all-photos/00130'
          className={`${styles.displayedImg} ${styles.img2}`}
          aria-label='Link to photo 00130'
        >
          <Image
            loading='eager'
            src='/images/home/2.webp'
            alt='Two people with blue umbrellas'
            onLoad={handleImageLoad}
            width={2080}
            height={3120}
          />
        </Link>
        <Link
          href='/all-photos/00170'
          className={`${styles.displayedImg} ${styles.img3}`}
          aria-label='Link to photo 00170'
        >
          <Image
            loading='eager'
            src='/images/home/3.webp'
            alt='Ferris wheel with blue sky backdrop'
            onLoad={handleImageLoad}
            width={3120}
            height={2080}
          />
        </Link>
        <Link
          href='/all-photos/00173'
          className={`${styles.displayedImg} ${styles.img4}`}
          aria-label='Link to photo 00173'
        >
          <Image
            loading='eager'
            src='/images/home/4.webp'
            alt='Cat sitting on fence'
            onLoad={handleImageLoad}
            width={3120}
            height={2080}
          />
        </Link>
        <Link
          href='/all-photos/00138'
          className={`${styles.displayedImg} ${styles.img5}`}
          aria-label='Link to photo 00138'
        >
          <Image
            loading='eager'
            src='/images/home/5.webp'
            alt='Cat sitting upright'
            onLoad={handleImageLoad}
            width={2080}
            height={3120}
          />
        </Link>
        <Link
          href='/all-photos/00174'
          className={`${styles.displayedImg} ${styles.img6}`}
          aria-label='Link to photo 00174'
        >
          <Image
            loading='eager'
            src='/images/home/6.webp'
            alt='Building with sunset sky'
            onLoad={handleImageLoad}
            width={3120}
            height={2080}
          />
        </Link>
        <Link
          href='/all-photos/00181'
          className={`${styles.displayedImg} ${styles.img7}`}
          aria-label='Link to photo 00181'
        >
          <Image
            loading='eager'
            src='/images/home/7.webp'
            alt='Boat docked in harbor'
            onLoad={handleImageLoad}
            width={3120}
            height={2080}
          />
        </Link>
        <Link
          href='/all-photos/00188'
          className={`${styles.displayedImg} ${styles.img8}`}
          aria-label='Link to photo 00188'
        >
          <Image
            loading='eager'
            src='/images/home/8.webp'
            alt='Two birds standing in beach waves'
            onLoad={handleImageLoad}
            width={3120}
            height={2080}
          />
        </Link>
        <Link
          href='/all-photos/00185'
          className={`${styles.displayedImg} ${styles.img9}`}
          aria-label='Link to photo 00185'
        >
          <Image
            loading='eager'
            src='/images/home/9.webp'
            alt='Group of seagulls flying above lake at beach'
            onLoad={handleImageLoad}
            width={3120}
            height={2080}
          />
        </Link>
      </div>
    </>
  )
}

export default HomeImages
