'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.scss'

const BREAKPOINT_LG = 992

const HoverInteractivity = () => {
  const [currHoveredName, setCurrHoveredName] = useState<string | null>(null)

  useEffect(() => {
    if (window.innerWidth < BREAKPOINT_LG) return
    const links = document.querySelectorAll(`[data-category-name]`)

    const handleActivate = (event: Event) => {
      const target = event.currentTarget as HTMLElement
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
