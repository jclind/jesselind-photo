// Generate a tiny base64 JPEG suitable for Next.js <Image placeholder='blur'>.
// Renders the source at 16px wide on a canvas and exports as a low-quality
// JPEG, producing ~1–2 KB strings that inline directly into the HTML payload.

export async function generateBlurPlaceholder(blob: Blob): Promise<string> {
  const img = await loadImage(blob)
  const canvas = document.createElement('canvas')
  const W = 16
  const H = Math.max(1, Math.round((W * img.height) / img.width))
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(img, 0, 0, W, H)
  return canvas.toDataURL('image/jpeg', 0.5)
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = err => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}
