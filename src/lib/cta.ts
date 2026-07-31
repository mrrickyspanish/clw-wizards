// Canonical call-to-action treatment for the marketing pages.
//
// The reference is the home hero's "Explore the program" button, which is
// <Button size="lg"> from components/ui/button: Barlow (font-body), bold,
// uppercase, tracking-wider, text-base, h-14, px-10, square with a chamfer.
// Everything else on the marketing side was hand-rolled and had drifted --
// call-to-actions were set in Barlow Condensed or Bebas Neue rather than
// Barlow, across four tracking values, five type sizes, and four heights.
//
// These constants carry typography, geometry, and interaction state only.
// Colour stays at the call site on purpose: the marketing pages alternate
// dark and light bands, and several tokens (--clw-black, --clw-white) are
// deliberately redefined inside .section-light, so a button's palette is a
// property of the band it sits in, not of the button.

// Type alone. For call-to-actions that must keep their own geometry -- the
// full-width submit buttons at the end of the checkout and contact forms --
// so they match everything else in family, weight, size, and tracking
// without being forced to a fixed height or inline width.
export const CTA_TYPE = 'font-body text-base font-bold uppercase tracking-wider'

// Boxed buttons, filled or outlined. Mirrors <Button size="lg"> so a
// hand-written call-to-action and the shared component render identically.
export const CTA_BUTTON =
  `chamfer-sm inline-flex h-14 items-center justify-center gap-2 px-10 ${CTA_TYPE} transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clw-gold focus-visible:ring-offset-2 [&_svg]:size-4 [&_svg]:shrink-0`

// Inline text links that read as an action ("Meet all partners"). Same
// family, weight, and tracking as the buttons so they belong to the same
// system, without the box, height, or padding.
export const CTA_LINK =
  `inline-flex items-center gap-2 ${CTA_TYPE} underline-offset-4 transition-colors duration-300 hover:underline [&_svg]:size-4 [&_svg]:shrink-0`
