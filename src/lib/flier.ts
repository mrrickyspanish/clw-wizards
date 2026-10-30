// A tournament's flier (Tyler, Oct 30) is either a picture (uploaded, or a
// link to a .png/.jpg) or a link to a PDF or the tournament's web page.
// Pictures are shown; anything else opens as a link.

const PICTURE = /\.(png|jpe?g|gif|webp|avif)$/i

export function flierKind(url: string | null | undefined): 'image' | 'link' | null {
  if (!url) return null
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
  if (PICTURE.test(parsed.pathname)) return 'image'
  // Uploaded in Admin -> Tournaments (only pictures can be uploaded there).
  if (parsed.pathname.includes('/storage/v1/object/public/tournament-flyers/')) return 'image'
  return 'link'
}

/** The flier only when it is a picture (for places that draw it as one). */
export const flierPicture = (url: string | null | undefined) => (flierKind(url) === 'image' ? url! : null)
