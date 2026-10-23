/**
 * Gets a picture ready to upload: redraws it, which drops everything hidden in
 * the file (a phone photo's location, the camera, the date), and shrinks a big
 * one to maxWidth so emails open fast on a phone. GIFs are kept as they are so
 * they keep moving; they don't carry location data. Browser only. Part of the
 * shared composer.
 *
 * Throws if the picture can't be redrawn, rather than uploading it with its
 * hidden details still inside.
 */
export async function prepareImage(file: File, maxWidth = 1600, quality = 0.85): Promise<File> {
  if (file.type === 'image/gif') return file
  const unreadable = new Error('Couldn’t read that picture. Save it as a JPG or PNG and try again.')
  if (typeof createImageBitmap !== 'function') throw unreadable
  let bitmap: ImageBitmap
  try {
    // Honour the photo's rotation before the rotation tag is dropped.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw unreadable
  }
  const scale = Math.min(1, maxWidth / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw unreadable
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  // PNG keeps sharp text on screenshots and flyers; photos (and WebP) become JPEG.
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  if (!blob) throw unreadable
  return new File([blob], type === 'image/png' ? 'picture.png' : 'picture.jpg', { type })
}
