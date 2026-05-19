import Link from 'next/link'
import Image from 'next/image'
import styles from './page.module.scss'
import { categories } from '@/data/categories'
import HoverInteractivity from './HoverInteractivity'

export const metadata = {
  title: 'Collections | Jesse Lind Photography',
  description: 'Browse photo collections by Jesse Lind',
}

const Collections = () => {
  return (
    <div className={styles.collection}>
      <div className={styles.content}>
        <Link href='/all-photos' className={styles.myPhotosLink}>
          My Photos
        </Link>

        <div className={styles.links}>
          {categories.filter(c => !c.hidden).map((category, index) => (
            <Link
              key={category.name}
              href={category.path}
              data-category-name={category.name}
            >
              <span className={styles.leftNumbers}>{`${index < 9 ? '0' : ''}${
                index + 1
              }`}</span>
              <span className={styles.name}>{category.name}</span>
              <div className={styles.imageContainer}>
                <Image
                  src={category.imgSrc}
                  alt=''
                  width={3120}
                  height={2080}
                  sizes='(max-width: 992px) 60vw, 40vw'
                />
              </div>
              <div className={styles.line}></div>
            </Link>
          ))}
        </div>

        {/* Client component for hover interactivity only */}
        <HoverInteractivity />
      </div>
    </div>
  )
}

export default Collections
