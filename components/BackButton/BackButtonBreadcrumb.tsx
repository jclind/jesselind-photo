import Link from 'next/link'
import styles from './BackButton.module.scss'

type Props = {
  href: string
  label: string
  current: string
  // When true, the current crumb is also the page <h1>. Pages that render
  // their own heading should pass false to avoid duplicate h1s.
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
  return (
    <nav className={styles.breadcrumb} aria-label='Breadcrumb'>
      <Link href={href} className={styles.crumbLink}>
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
