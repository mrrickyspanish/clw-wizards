import type { Metadata } from 'next'

// Next does not derive openGraph.title/description from a page's own title
// and description -- an unset openGraph field falls through to the root
// layout's value instead. So every page that only set title/description was
// sharing to the same site-wide preview text, no matter which page the link
// pointed at. This mirrors a page's own copy into the Open Graph and Twitter
// fields so a shared link describes the page it actually opens.
//
// Anything explicitly passed in openGraph/twitter wins, so a page that wants
// different social copy than its <title> can still say so.
export function pageMetadata(metadata: Metadata & { title: string; description: string }): Metadata {
  const { title, description, openGraph, twitter, ...rest } = metadata

  return {
    ...rest,
    title,
    description,
    openGraph: { title, description, type: 'website', ...openGraph },
    twitter: { title, description, ...twitter },
  }
}
