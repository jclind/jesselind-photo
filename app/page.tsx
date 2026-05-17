import styles from './page.module.scss'
import HomeImages from './HomeImages'

export const metadata = {
  title: 'Home | Jesse Lind Photography',
}
export default function Home() {
  return (
    <div className={styles.hero}>
      <div className={styles.content}>
        <img
          src='/images/logo.webp'
          alt='Jesse Lind Photography Logo'
          className={styles.logo}
        />
        <HomeImages />
      </div>
    </div>
  )
}
