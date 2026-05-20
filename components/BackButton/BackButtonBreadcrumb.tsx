import Link from 'next/link'
import styles from './BackButton.module.scss'

type Props = {
  // When both are provided, render as a multi-crumb breadcrumb (parent →
  // current). When omitted, render as a single-crumb page heading.
  href?: string
  label?: string
  current: string
  // Wrap the current crumb in <h1>. Defaults to true; pages with their own
  // heading should pass false. Ignored in single-crumb mode (always h1 there).
  currentAsHeading?: boolean
}

const BackButtonBreadcrumb = ({
  href,
  label,
  current,
  currentAsHeading = true,
}: Props) => {
  const currentLink = (
    <a href='#' className={styles.crumbLink} aria-current='page'>
      {current}
    </a>
  )

  const hasParent = !!(href && label)
  if (!hasParent) {
    return (
      <div className={styles.breadcrumb}>
        <h1 className={styles.currentHeading}>{currentLink}</h1>
      </div>
    )
  }

  return (
    <nav className={styles.breadcrumb} aria-label='Breadcrumb'>
      <Link href={href!} className={styles.crumbLink}>
        {label}
      </Link>
      <span className={styles.separator} aria-hidden>
        /
      </span>
      {currentAsHeading ? (
        <h1 className={styles.currentHeading}>{currentLink}</h1>
      ) : (
        currentLink
      )}
    </nav>
  )
}

export default BackButtonBreadcrumb
