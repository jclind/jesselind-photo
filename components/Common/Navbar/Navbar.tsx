'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './Navbar.module.scss'
import { usePathname } from 'next/navigation'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  const toggleIsOpen = () => setIsOpen(state => !state)

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        hamburgerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Lock/unlock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed' // helps on iOS to stop bounce
      document.body.style.width = '100%' // prevents layout shift
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [isOpen])

  const links = [
    { name: 'Home', src: '/' },
    { name: 'Projects', src: '/projects' },
    { name: 'Collections', src: '/collections' },
    { name: 'All Photos', src: '/all-photos' },
    { name: 'About', src: '/about' },
    {
      name: 'jesselind.com',
      src: 'https://jesselind.com/',
      shouldOpenInNewTab: true,
    },
  ]

  return (
    <header>
      <button
        ref={hamburgerRef}
        className={styles.hamburger}
        onClick={toggleIsOpen}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
      >
        <span
          className={`${styles.top} ${isOpen ? styles.topOpen : ''}`}
        ></span>
        <span
          className={`${styles.middle} ${isOpen ? styles.middleOpen : ''}`}
        ></span>
        <span
          className={`${styles.bottom} ${isOpen ? styles.bottomOpen : ''}`}
        ></span>
      </button>

      <nav
        className={`${styles.navbar} ${isOpen ? styles.navOpen : ''}`}
        hidden={!isOpen}
      >
        <div className={styles.links}>
          {links.map((link, idx) =>
            link.shouldOpenInNewTab ? (
              <a
                key={idx}
                href={link.src}
                target='_blank'
                rel='noopener noreferrer'
                tabIndex={isOpen ? 0 : -1}
              >
                {link.name}
              </a>
            ) : (
              <Link
                key={idx}
                href={link.src}
                tabIndex={isOpen ? 0 : -1}
                onClick={() => {
                  if (link.src === pathname) setIsOpen(false)
                }}
              >
                {link.name}
              </Link>
            )
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.copyright}>
            All images © {new Date().getFullYear()} Jesse Lind. No images may be
            used, copied, or distributed without prior permission.
          </div>
          <div className={styles.bottom}>
            <div className={styles.developer}>
              Designed and developed by{' '}
              <a
                href='https://jesselind.com/'
                target='_blank'
                rel='noopener noreferrer'
              >
                Jesse Lind
              </a>
            </div>
            |
            <Link href='/privacy' className={styles.privacyLink}>
              Privacy
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
