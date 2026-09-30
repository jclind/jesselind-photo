// Grid previews. Decoding 50 picked camera files at full resolution would
// hold 50 full bitmaps in memory, so each file is decoded once, drawn small
// onto a canvas, and turned into a JPEG blob whose object URL the grid shows.
const PREVIEW_WIDTH = 320

export async function generatePreviewUrl(file: File): Promise<string> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, {
      resizeWidth: PREVIEW_WIDTH,
      resizeQuality: 'medium',
    })
  } catch {
    // Some engines throw on the resize options. Decode at full size and
    // let the canvas do the shrinking instead.
    bitmap = await createImageBitmap(file)
  }
  try {
    const scale = Math.min(1, PREVIEW_WIDTH / bitmap.width)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('no 2d context for preview canvas')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    )
    if (!blob) throw new Error('canvas.toBlob returned nothing')
    return URL.createObjectURL(blob)
  } finally {
    bitmap.close()
  }
}
