// photoDate keeps the camera's wall-clock time in its UTC fields and the site
// displays it in UTC, so EXIF dates are parsed straight into Date.UTC. Never
// use the local-time constructor or OffsetTimeOriginal here.
const EXIF_DATE = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/

export function parseExifDateTime(
  raw: string | null | undefined
): Date | null {
  const match = EXIF_DATE.exec(raw ?? '')
  if (!match) return null
  const [year, month, day, hour, minute, second] = match
    .slice(1)
    .map(Number)
  const ms = utcOrNaN(year, month, day, hour, minute, second)
  return Number.isNaN(ms) ? null : new Date(ms)
}

// Same UTC rule for the apply panel's date/time override inputs.
const MANUAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const MANUAL_TIME = /^(\d{2}):(\d{2})$/

export function parseManualDateTime(date: string, time: string): number | null {
  const dateMatch = MANUAL_DATE.exec(date)
  const timeMatch = MANUAL_TIME.exec(time)
  if (!dateMatch || !timeMatch) return null
  const [year, month, day] = dateMatch.slice(1).map(Number)
  const [hour, minute] = timeMatch.slice(1).map(Number)
  const ms = utcOrNaN(year, month, day, hour, minute)
  return Number.isNaN(ms) ? null : ms
}

// Rejects components Date.UTC would silently roll over, like month 13.
function utcOrNaN(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second = 0
): number {
  const ms = Date.UTC(year, month - 1, day, hour, minute, second)
  const date = new Date(ms)
  const matches =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second
  return matches ? ms : NaN
}

// Reads DateTimeOriginal as epoch milliseconds, falling back to CreateDate
// (exifr's name for the digitized date) when it is missing or malformed.
// Returns null when the file has no usable date. exifr is lazy-imported so
// it stays out of the page bundle until files are added.
export async function readCaptureTime(file: File): Promise<number | null> {
  try {
    const { parse } = await import('exifr')
    const exif = await parse(file, {
      pick: ['DateTimeOriginal', 'CreateDate'],
      reviveValues: false,
    })
    const date =
      parseExifDateTime(exif?.DateTimeOriginal) ??
      parseExifDateTime(exif?.CreateDate)
    return date ? date.getTime() : null
  } catch (err) {
    console.error(`EXIF read failed for ${file.name}:`, err)
    return null
  }
}
