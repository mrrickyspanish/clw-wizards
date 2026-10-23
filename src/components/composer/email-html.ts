import type { JSONContent } from '@tiptap/core'

/**
 * Composer document -> email HTML.
 *
 * Email apps ignore page stylesheets, so every element carries its own inline
 * style. Only what the composer can make is written out (paragraphs, line
 * breaks, bold, italic, links, lists, pictures); anything else keeps its text
 * and drops the markup. Text and attributes are escaped, links must be http(s),
 * mailto or tel, and pictures must be https (pasted base64 data is dropped).
 * Pass imageSrcPrefix to allow only pictures from your own storage: a picture
 * hosted anywhere else would tell that site who opened the email.
 *
 * No browser APIs here, so the same function runs in the browser, on the
 * server and in tests. Part of the shared composer (see Composer.tsx).
 */

export type EmailHtmlOptions = {
  // Link colour; the default reads on white, which is what email apps show.
  linkColor?: string
  // Only pictures whose address starts with this are kept.
  imageSrcPrefix?: string
}

type Resolved = { linkColor: string; imageSrcPrefix: string | null }

const P = 'margin:0 0 14px;font-size:16px;line-height:1.5;'
const LIST = 'margin:0 0 14px;padding-left:24px;font-size:16px;line-height:1.5;'
const LI = 'margin:0 0 6px;'
const IMG = 'display:block;max-width:100%;height:auto;margin:12px 0;border:0;'

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;')
}

export function safeLinkHref(href: unknown): string | null {
  if (typeof href !== 'string') return null
  const value = href.trim()
  return /^(https?:\/\/|mailto:|tel:)/i.test(value) ? value : null
}

export function safeImageSrc(src: unknown, prefix: string | null = null): string | null {
  if (typeof src !== 'string') return null
  const value = src.trim()
  if (prefix && !value.startsWith(prefix)) return null
  // https only; plain http is allowed for this computer alone, for local testing.
  return /^https:\/\//i.test(value) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(value) ? value : null
}

function renderText(node: JSONContent, options: Resolved): string {
  let html = escapeText(node.text ?? '')
  // Inner marks first so a link wraps the bold/italic text inside it.
  const marks = [...(node.marks ?? [])].sort((a, b) => (a.type === 'link' ? 1 : 0) - (b.type === 'link' ? 1 : 0))
  for (const mark of marks) {
    if (mark.type === 'bold') html = `<strong>${html}</strong>`
    else if (mark.type === 'italic') html = `<em>${html}</em>`
    else if (mark.type === 'link') {
      const href = safeLinkHref(mark.attrs?.href)
      if (href)
        html = `<a href="${escapeAttr(href)}" style="color:${options.linkColor};text-decoration:underline;">${html}</a>`
    }
  }
  return html
}

function renderChildren(node: JSONContent, options: Resolved): string {
  return (node.content ?? []).map((child) => renderNode(child, options)).join('')
}

function renderNode(node: JSONContent, options: Resolved): string {
  switch (node.type) {
    case 'doc':
      return renderChildren(node, options)
    case 'paragraph': {
      const inner = renderChildren(node, options)
      return `<p style="${P}">${inner || '&nbsp;'}</p>`
    }
    case 'text':
      return renderText(node, options)
    case 'hardBreak':
      return '<br>'
    case 'bulletList':
      return `<ul style="${LIST}">${renderChildren(node, options)}</ul>`
    case 'orderedList':
      return `<ol style="${LIST}">${renderChildren(node, options)}</ol>`
    case 'listItem':
      // A list item holds paragraphs; drop their bottom margin inside the list.
      return `<li style="${LI}">${renderChildren(node, options).replace(new RegExp(`<p style="${P}">`, 'g'), '<p style="margin:0;">')}</li>`
    case 'image': {
      const src = safeImageSrc(node.attrs?.src, options.imageSrcPrefix)
      if (!src) return ''
      const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt : ''
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" style="${IMG}">`
    }
    default:
      return renderChildren(node, options)
  }
}

const isBlankParagraph = (node: JSONContent) =>
  node.type === 'paragraph' && !(node.content ?? []).some((c) => c.type !== 'text' || Boolean(c.text?.trim()))

export function composerEmailHtml(doc: JSONContent | null | undefined, options: EmailHtmlOptions = {}): string {
  if (!doc) return ''
  // Blank lines left at the start or end (pressing Enter after a picture) are not sent.
  const content = [...(doc.content ?? [])]
  while (content.length && isBlankParagraph(content[0])) content.shift()
  while (content.length && isBlankParagraph(content[content.length - 1])) content.pop()
  return renderNode(
    { ...doc, content },
    { linkColor: options.linkColor ?? '#1a56db', imageSrcPrefix: options.imageSrcPrefix ?? null }
  )
}

/** True when the document has any words or a picture: an empty message can't be sent. */
export function composerHasContent(doc: JSONContent | null | undefined, options: EmailHtmlOptions = {}): boolean {
  if (!doc) return false
  const visit = (node: JSONContent): boolean =>
    (node.type === 'text' && Boolean(node.text?.trim())) ||
    (node.type === 'image' && safeImageSrc(node.attrs?.src, options.imageSrcPrefix ?? null) !== null) ||
    (node.content ?? []).some(visit)
  return visit(doc)
}

/** Plain text into composer paragraphs: blank lines split paragraphs, single newlines become line breaks. */
export function textToComposerContent(text: string): JSONContent[] {
  return text
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s+$/, ''))
    .filter((block) => block.length > 0)
    .map((block) => ({
      type: 'paragraph',
      content: block
        .split('\n')
        .flatMap((line, i): JSONContent[] => [
          ...(i > 0 ? [{ type: 'hardBreak' }] : []),
          ...(line ? [{ type: 'text', text: line }] : []),
        ]),
    }))
}
