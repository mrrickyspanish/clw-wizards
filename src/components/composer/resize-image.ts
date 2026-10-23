/**
 * Shrinks a big photo before upload so emails open fast on a phone. Pictures
 * already within maxWidth go up untouched; GIFs are left alone so they keep
 * moving. Browser only. Part of the shared composer.
 */
export async function resizeImage(file: File, maxWidth = 1600, quality = 0.85): Promise<File> {
  if (file.type === 'image/gif' || typeof createImageBitmap !== 'function') return file
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }
  if (bitmap.width <= maxWidth) {
    bitmap.close()
    return file
  }
  const scale = maxWidth / bitmap.width
  const canvas = document.createElement('canvas')
  canvas.width = maxWidth
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return file
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  // PNG keeps sharp text on screenshots and flyers; photos become JPEG.
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  if (!blob || blob.size >= file.size) return file
  const name = file.name.replace(/\.[^.]+$/, '') + (type === 'image/png' ? '.png' : '.jpg')
  return new File([blob], name, { type })
}
