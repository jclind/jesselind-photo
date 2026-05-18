import { Timestamp } from 'firebase/firestore/lite'

export const timestampToMMDDYYYY = (timestamp: Timestamp): string => {
  if (!timestamp) return ''

  let date: Date

  date = timestamp.toDate()

  const options: Intl.DateTimeFormatOptions = {
    month: 'long', // Full month name (e.g., January)
    day: 'numeric', // Day of the month
    year: 'numeric', // Full year
  }

  return date.toLocaleDateString(undefined, options)
}
