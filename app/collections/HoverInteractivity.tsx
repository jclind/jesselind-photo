'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.scss'

const BREAKPOINT_LG = 992
const VIEWPORT_PADDING = 24

// Choose whether the hover preview should appear above or below the link based
// on available viewport space. The preview is `width: 50%` of the `.content`
// container, `aspect-ratio: 3/2`, capped at `max-height: 45vh`.
const placePreview = (link: HTMLElement) => {
  const rect = link.getBoundingClientRect()
  // `.imageContainer` is positioned absolute relative to `.content`, which is
  // the link's grandparent (link -> .links -> .content).
  const contentEl = link.parentElement?.parentElement
  const contentWidth =
    contentEl?.getBoundingClientRect().width ?? window.innerWidth
  const previewHeight = Math.min(
    (contentWidth * 0.5 * 2) / 3,
    window.innerHeight * 0.45
  )
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING
  const spaceAbove = rect.top - VIEWPORT_PADDING

  let useTop: boolean
  if (spaceBelow >= previewHeight) useTop = false
  else if (spaceAbove >= previewHeight) useTop = true
  else useTop = spaceAbove > spaceBelow

  link.classList.toggle(styles.imgToTop, useTop)
}

const HoverInteractivity = () => {
  const [currHoveredName, setCurrHoveredName] = useState<string | null>(null)

  useEffect(() => {
    if (window.innerWidth < BREAKPOINT_LG) return
    const links = document.querySelectorAll(`[data-category-name]`)

    const handleActivate = (event: Event) => {
      const target = event.currentTarget as HTMLElement
      placePreview(target)
      const categoryName = target.getAttribute('data-category-name')
      if (categoryName) {
        setCurrHoveredName(categoryName)
      }
    }

    const handleDeactivate = () => {
      setCurrHoveredName(null)
    }

    links.forEach(link => {
      link.addEventListener('mouseenter', handleActivate)
      link.addEventListener('mouseleave', handleDeactivate)
      link.addEventListener('focusin', handleActivate)
      link.addEventListener('focusout', handleDeactivate)
    })

    return () => {
      links.forEach(link => {
        link.removeEventListener('mouseenter', handleActivate)
        link.removeEventListener('mouseleave', handleDeactivate)
        link.removeEventListener('focusin', handleActivate)
        link.removeEventListener('focusout', handleDeactivate)
      })
    }
  }, [])

  useEffect(() => {
    if (window.innerWidth < BREAKPOINT_LG) return
    const links = document.querySelectorAll(`[data-category-name]`)
    const isAnyHovered = currHoveredName !== null

    links.forEach(link => {
      const categoryName = link.getAttribute('data-category-name')
      const isHovered = currHoveredName === categoryName

      // Remove all hover-related classes
      link.classList.remove(styles.hovered, styles.notHovered)

      // Add appropriate class based on hover state
      if (isAnyHovered) {
        if (isHovered) {
          link.classList.add(styles.hovered)
        } else {
          link.classList.add(styles.notHovered)
        }
      }
    })
  }, [currHoveredName])

  // This component renders nothing - it only adds interactivity
  return null
}

export default HoverInteractivity
