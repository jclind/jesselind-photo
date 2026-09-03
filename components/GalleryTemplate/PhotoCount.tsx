import styles from './GalleryTemplate.module.scss'

type PhotoCountProps = {
  loaded: number
  total: number
}

// Fixed readout in the one empty corner of the gallery chrome. Reads
// "24 / 137" while there is more to load and collapses to "137" once the
// gallery holds everything, so the slash itself carries the "there is more
// below" signal.
const PhotoCount = ({ loaded, total }: PhotoCountProps) => {
  const complete = loaded >= total
  const noun = total === 1 ? 'photo' : 'photos'
  const label = complete
    ? `${total} ${noun}`
    : `Showing ${loaded} of ${total} ${noun}`

  return (
    <div className={styles.photo_count}>
      {/* The spoken form is a sentence; the visible form is two numerals and a
          slash, which a screen reader would read as a date. */}
      <span className='visually-hidden'>{label}</span>
      <span className={styles.count_value} aria-hidden>
        {complete ? (
          total
        ) : (
          <>
            {loaded}
            <span className={styles.count_divider}>/</span>
            {total}
          </>
        )}
      </span>
    </div>
  )
}

export default PhotoCount
