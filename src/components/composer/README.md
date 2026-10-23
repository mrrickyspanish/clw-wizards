# Shared composer

A small rich text box with pictures placed inline, for writing messages and
emails. Ported from the Creative Eye Studios article editor
(`creative-eye-studio/components/admin/RichTextEditor.tsx`) and cut down: no
headings, quotes, dividers, video or social embeds. Same TipTap version
(3.17.0) on both sites.

| File | What it is | Site-specific? |
|---|---|---|
| `Composer.tsx` | The editor: bold, italic, lists, link, pictures (paste, drop or the Picture button) | Colours only (`clw-*` tokens) |
| `email-html.ts` | Document to email HTML with inline styles and only safe markup; `composerHasContent`, `textToComposerContent` | No |
| `prepare-image.ts` | Redraws each picture before upload: drops hidden location and camera data, shrinks big ones to 1600px wide | No |

## Using it

```tsx
const ref = useRef<ComposerHandle>(null)
<Composer
  ref={ref}
  ariaLabelledBy="message-label"
  placeholder="Write your message…"
  features={{ lists: true, link: true, images: true }}
  uploadImage={async (file) => publicHttpsUrl}   // your storage; throw a readable Error on failure
  onChange={setDoc}
/>
const html = composerEmailHtml(doc)
```

`ref.current.prependText(text)` puts plain text above what is written (event
details here); `ref.current.clear()` empties it after sending.

## Copying it to another site

1. Copy this folder.
2. Install the same packages with every `@tiptap/*` pinned to one version
   (here: `@tiptap/core`, `react`, `pm`, `starter-kit`, `extension-image`,
   `extensions`, plus `overrides` in `package.json` so the starter kit's own
   parts can't pull a newer copy).
3. Swap the `clw-*` colour classes for that site's.
4. Give it an `uploadImage` that stores the file somewhere public over https
   and returns the address. Here: `prepareCommsImageUpload` (a signed upload
   slot at a random path in the `comms-images` bucket, admins and staff only).

The studio editor still saves uploads into its own repo with a git push,
which only works on a computer, not on Vercel. Moving it to this upload pattern
is the first step to sharing one composer between both sites.
