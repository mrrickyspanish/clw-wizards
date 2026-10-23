'use client'

/**
 * Shared composer: a small rich text box with pictures placed inline.
 *
 * Ported from the Creative Eye Studios article editor (TipTap, same version)
 * and cut down to what a message needs: bold, italic, lists, links and
 * pictures. Pictures can be pasted, dropped or picked with the Picture button.
 * Nothing here knows about this site's data: the page passes in how to upload
 * a picture, which features to show, and the labels. Only the colours are this
 * site's theme tokens (clw-*). Turn the document into email HTML with
 * composerEmailHtml (email-html.ts). Copying it to another site: README.md.
 */

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extensions'
import type { EditorView } from '@tiptap/pm/view'
import { Bold, ImagePlus, Italic, Link2, List, ListOrdered } from 'lucide-react'

import { resizeImage } from './resize-image'
import { textToComposerContent } from './email-html'

export type ComposerFeatures = {
  lists?: boolean
  link?: boolean
  images?: boolean
}

export type ComposerHandle = {
  /** Puts text (blank lines split paragraphs) above what is already written. */
  prependText: (text: string) => void
  clear: () => void
}

type Props = {
  id?: string
  ariaLabelledBy?: string
  placeholder?: string
  features?: ComposerFeatures
  /** Uploads a picture and returns its public https address. Throws with a readable message on failure. */
  uploadImage?: (file: File) => Promise<string>
  maxImageMb?: number
  onChange: (doc: JSONContent) => void
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((file) => file.type.startsWith('image/'))
}

export const Composer = forwardRef<ComposerHandle, Props>(function Composer(
  { id, ariaLabelledBy, placeholder, features = {}, uploadImage, maxImageMb = 10, onChange },
  ref
) {
  const { lists = true, link = true, images = true } = features
  const canUpload = images && Boolean(uploadImage)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState<string | null>(null)
  // Paste and drop handlers are set once with the editor; they read this.
  const uploadRef = useRef<(files: File[], at?: number) => void>(() => {})

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        bulletList: lists ? {} : false,
        orderedList: lists ? {} : false,
        listItem: lists ? {} : false,
        link: link ? { openOnClick: false, autolink: true, defaultProtocol: 'https' } : false,
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        ...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
        role: 'textbox',
        'aria-multiline': 'true',
        class:
          'min-h-[240px] px-3 py-3 text-base leading-relaxed text-clw-white focus:outline-none [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-clw-gold [&_a]:underline [&_img]:my-3 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_img.ProseMirror-selectednode]:outline [&_img.ProseMirror-selectednode]:outline-2 [&_img.ProseMirror-selectednode]:outline-clw-gold [&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-clw-gray [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
      },
      handlePaste: (_view: EditorView, event: ClipboardEvent) => {
        const files = imageFiles(event.clipboardData?.files)
        if (!files.length) return false
        event.preventDefault()
        uploadRef.current(files)
        return true
      },
      handleDrop: (view: EditorView, event: DragEvent) => {
        const files = imageFiles(event.dataTransfer?.files)
        if (!files.length) return false
        event.preventDefault()
        const at = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })?.pos
        uploadRef.current(files, at)
        return true
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getJSON()),
  })

  const upload = useCallback(
    async (files: File[], at?: number) => {
      if (!editor) return
      setError(null)
      if (!canUpload || !uploadImage) {
        setError('Pictures can’t be added here.')
        return
      }
      for (const original of files) {
        if (!ACCEPTED.includes(original.type)) {
          setError('Use a JPG, PNG, WebP or GIF picture.')
          continue
        }
        setUploading((n) => n + 1)
        try {
          const file = await resizeImage(original)
          if (file.size > maxImageMb * 1024 * 1024) {
            setError(`Pictures must be under ${maxImageMb} MB.`)
            continue
          }
          const src = await uploadImage(file)
          const alt = original.name
            .replace(/\.[^.]+$/, '')
            .replace(/[_-]+/g, ' ')
            .slice(0, 80)
          const chain = editor.chain().focus()
          ;(typeof at === 'number'
            ? chain.insertContentAt(at, { type: 'image', attrs: { src, alt } })
            : chain.setImage({ src, alt })
          ).run()
          at = undefined
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not add the picture. Try again.')
        } finally {
          setUploading((n) => n - 1)
        }
      }
    },
    [editor, canUpload, uploadImage, maxImageMb]
  )
  uploadRef.current = (files, at) => void upload(files, at)

  useImperativeHandle(
    ref,
    () => ({
      prependText: (text: string) => {
        if (!editor) return
        const content = textToComposerContent(text)
        if (content.length) editor.chain().insertContentAt(0, content).focus('end').run()
      },
      clear: () => editor?.commands.clearContent(true),
    }),
    [editor]
  )

  const addLink = useCallback(() => {
    if (!editor) return
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link address (https://…)', previous ?? 'https://')
    if (url === null) return
    if (url.trim() === '' || url.trim() === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }, [editor])

  if (!editor) {
    return <div className="min-h-[288px] rounded-md border border-input bg-background" aria-busy="true" />
  }

  const tool = (active: boolean) =>
    `inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-md px-2.5 text-base transition-colors disabled:opacity-50 ${
      active ? 'bg-clw-gold/20 text-clw-gold' : 'text-clw-gray hover:bg-clw-gold/10 hover:text-clw-white'
    }`

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
        <div
          role="toolbar"
          aria-label="Formatting"
          className="flex flex-wrap items-center gap-1 border-b border-input p-1"
        >
          <button
            type="button"
            aria-label="Bold"
            title="Bold"
            aria-pressed={editor.isActive('bold')}
            className={tool(editor.isActive('bold'))}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Italic"
            title="Italic"
            aria-pressed={editor.isActive('italic')}
            className={tool(editor.isActive('italic'))}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-5 w-5" />
          </button>
          {lists && (
            <>
              <button
                type="button"
                aria-label="Bulleted list"
                title="Bulleted list"
                aria-pressed={editor.isActive('bulletList')}
                className={tool(editor.isActive('bulletList'))}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <List className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Numbered list"
                title="Numbered list"
                aria-pressed={editor.isActive('orderedList')}
                className={tool(editor.isActive('orderedList'))}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered className="h-5 w-5" />
              </button>
            </>
          )}
          {link && (
            <button
              type="button"
              aria-label="Link"
              title="Link"
              aria-pressed={editor.isActive('link')}
              className={tool(editor.isActive('link'))}
              onClick={addLink}
            >
              <Link2 className="h-5 w-5" />
            </button>
          )}
          {canUpload && (
            <button
              type="button"
              className={tool(false)}
              disabled={uploading > 0}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-5 w-5" /> {uploading > 0 ? 'Adding…' : 'Picture'}
            </button>
          )}
        </div>
        <EditorContent editor={editor} />
        {canUpload && (
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            multiple
            className="hidden"
            onChange={(e) => {
              const files = imageFiles(e.target.files)
              e.target.value = ''
              void upload(files)
            }}
          />
        )}
      </div>
      {uploading > 0 && (
        <p role="status" className="text-base text-clw-gray">
          Adding picture…
        </p>
      )}
      {error && <p className="text-base text-red-400">{error}</p>}
    </div>
  )
})
