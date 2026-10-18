/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS QA script, run with plain node. */
// Layout sweep: flags clipped content and anything past the screen edge, not just page scroll.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright')
const b = (s) => Buffer.from(s).toString('base64url'), exp = 4102444800
const cookieFor = (sub) => 'base64-' + b(JSON.stringify({ access_token: [b('{}'), b(JSON.stringify({ sub, exp })), 's'].join('.'), token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'r', user: { id: sub } }))
const FAM = '00000000-0000-4000-8000-620000000001', KID = '00000000-0000-4000-8000-6b0000000001'
const ADMIN = ['/admin', '/admin/communications', '/admin/content', '/admin/dues', '/admin/families', `/admin/families/${FAM}`, '/admin/families/00000000-0000-4000-8000-620000000003', '/admin/families/00000000-0000-4000-8000-620000000004', '/admin/families?q=Tommy', '/admin/review', '/admin/review?type=cards', '/admin/communications?tab=uploads', '/admin/registrations?q=Tina%20Parent', '/admin/practices', '/admin/registrations', '/admin/sponsors', '/admin/team', '/admin/tournaments']
const PARENT = ['/dashboard', '/athletes', '/athletes/new', '/documents', '/dues', '/events', '/family', '/profile', '/registration', `/registration/${KID}`, '/tournaments', '/onboarding']
const PUBLIC = ['/', '/about', '/coaches', '/faq', '/golf-outing', '/join', '/login', '/signup', '/forgot-password', '/partners', '/privacy', '/program', '/schedule', '/sms-terms', '/sponsorship', '/sponsorship/boosters', '/sponsorship/donate', '/sponsorship/sponsor', '/sponsorship/thank-you', '/sponsorship/volunteer', '/staff', '/terms', '/admin-signup']
const widths = (process.argv[3] || '320,360,390,768').split(',').map(Number)
;(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] })
  let total = 0
  for (const [who, paths] of [['admin', ADMIN], ['parent', PARENT], ['anon', PUBLIC]]) {
    await fetch('http://127.0.0.1:54329/__as?who=' + (who === 'anon' ? 'parent' : who))
    for (const width of widths) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } })
      if (who !== 'anon') await ctx.addCookies([{ name: 'sb-127-auth-token', value: cookieFor(who), domain: '127.0.0.1', path: '/' }])
      const page = await ctx.newPage()
      for (const path of paths) {
        try { await page.goto('http://127.0.0.1:3100' + path, { waitUntil: 'networkidle', timeout: 20000 }) } catch { console.log('TIMEOUT', path); continue }
        await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)))
        await page.waitForTimeout(150)
        const issues = await page.evaluate(() => {
          const out = []
          const vw = document.documentElement.clientWidth
          const label = (el) => (el.innerText || el.getAttribute('aria-label') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 50)
          const inHScroll = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const ox = getComputedStyle(p).overflowX; if ((ox === 'auto' || ox === 'scroll') && p.scrollWidth > p.clientWidth + 1) return true } return false }
          const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' }
          // 1. Clipped: an overflow-hidden box whose content is wider than it (and is not a deliberate ellipsis).
          for (const el of document.querySelectorAll('body *')) {
            if (!visible(el)) continue
            const cs = getComputedStyle(el)
            if ((cs.overflowX === 'hidden' || cs.overflowX === 'clip') && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 2 && !/sr-only|screenReaderOnly/.test(String(el.className.baseVal ?? el.className)) && !el.matches('html,body,[data-radix-scroll-area-viewport]') && !(el.tagName === 'svg')) {
              // ignore decorative/absolute/marquee wrappers: only report if a control or text is cut
              const cut = [...el.querySelectorAll('button,a,p,span,h1,h2,h3,label,input,select,textarea')].find((c) => { if (!visible(c)) return false; const r = c.getBoundingClientRect(), pr = el.getBoundingClientRect(); return r.right > pr.right + 2 && r.left < pr.right && getComputedStyle(c).position !== 'absolute' && !inHScroll(c) && (c.innerText || '').trim() })
              if (cut) out.push(`CLIPPED "${label(cut)}" inside <${el.tagName.toLowerCase()} class="${(el.className.baseVal ?? el.className).slice(0, 60)}">`)
            }
          }
          // 2. Off-screen controls or text (not inside a sideways-scroll area).
          for (const el of document.querySelectorAll('button,a,input,select,textarea,h1,h2,h3,p,label,td,th')) {
            if (!visible(el) || inHScroll(el)) continue
            const r = el.getBoundingClientRect()
            if (r.right > vw + 1 && r.left < vw && getComputedStyle(el).position !== 'fixed') out.push(`OFFSCREEN "${label(el)}" right=${Math.round(r.right)} vw=${vw}`)
          }
          // 2b. Text spilling out of its own button, link or badge (the box fits, the words don't).
          for (const el of document.querySelectorAll('button,a,[class*="rounded-full"],[class*="badge"]')) {
            if (!visible(el) || inHScroll(el)) continue
            const cs = getComputedStyle(el)
            if (cs.textOverflow === 'ellipsis' || cs.overflowX === 'auto' || cs.overflowX === 'scroll') continue
            if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && (el.innerText || '').trim()) out.push(`TEXT SPILLS "${label(el)}" (${el.scrollWidth}px text in ${el.clientWidth}px box)`)
          }
          // 2c. Tap targets under 44px (buttons only; inline text links are exempt).
          for (const el of document.querySelectorAll('button')) {
            if (!visible(el) || el.getAttribute('role') === 'switch' || el.getAttribute('role') === 'checkbox' || el.getAttribute('role') === 'radio' || el.closest('[aria-hidden="true"]')) continue
            const r = el.getBoundingClientRect()
            if (r.width < 43.5 || r.height < 43.5) out.push(`SMALL TAP "${label(el)}" ${Math.round(r.width)}x${Math.round(r.height)}`)
          }
          // 3. Pages that scroll sideways.
          if (document.documentElement.scrollWidth > vw + 1) out.push(`PAGE SCROLLS SIDEWAYS by ${document.documentElement.scrollWidth - vw}px`)
          // 4. Tables that need a sideways swipe on this width (worth knowing, not always wrong).
          for (const el of document.querySelectorAll('table')) { const p = el.parentElement; if (visible(el) && p && p.scrollWidth > p.clientWidth + 2) out.push(`TABLE needs sideways swipe (${p.scrollWidth}px in ${p.clientWidth}px)`) }
          return [...new Set(out)]
        })
        if (issues.length) { total += issues.length; console.log(`${width} ${who} ${path}\n   ` + issues.slice(0, 8).join('\n   ')) }
      }
      await ctx.close()
    }
  }
  console.log('TOTAL', total)
  await browser.close()
})()
