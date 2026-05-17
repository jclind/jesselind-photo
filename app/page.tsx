import Image from 'next/image'
import styles from './page.module.scss'
import HomeImages from './HomeImages'

export const metadata = {
  title: 'Home | Jesse Lind Photography',
}
export default function Home() {
  return (
    <div className={styles.hero}>
      <div className={styles.content}>
        <Image
          src='/images/logo.webp'
          alt='Jesse Lind Photography Logo'
          className={styles.logo}
          width={608}
          height={314}
          priority
          fetchPriority='high'
          sizes='100px'
        />
        <HomeImages />
      </div>
    </div>
  )
}
