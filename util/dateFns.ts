import { Timestamp } from 'firebase/firestore/lite'

export const timestampToMMDDYYYY = (timestamp: Timestamp): string => {
  if (!timestamp) return ''

  const date = timestamp.toDate()

  // photoDate keeps the date (and capture time) in its UTC fields. Formatting
  // in local time shows the previous day for visitors west of UTC.
  const options: Intl.DateTimeFormatOptions = {
    month: 'long', // Full month name (e.g., January)
    day: 'numeric', // Day of the month
    year: 'numeric', // Full year
    timeZone: 'UTC',
  }

  return date.toLocaleDateString(undefined, options)
}
