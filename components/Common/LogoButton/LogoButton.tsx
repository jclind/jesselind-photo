'use client'

import React from 'react'
import styles from './LogoButton.module.scss'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const LogoButton = () => {
  const pathname = usePathname()

  // Only show LogoButton if NOT on the homepage
  const showLogo = pathname !== '/' && !pathname.includes('admin')
  if (!showLogo) return null
  return (
    <Link href='/' className={styles.nav_logo} aria-label='Home'>
      <Image
        src='/images/logo.webp'
        alt='jesse lind photography logo'
        width={608}
        height={314}
        sizes='60px'
      />
    </Link>
  )
}

export default LogoButton
