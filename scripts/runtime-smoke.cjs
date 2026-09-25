// The set this script was originally written for: the Support rebuild that
// shipped a client-side exception to production. Left as the default so the
// deploy-gating workflow behaves exactly as before.
const DEFAULT_ROUTES = [
  '/',
  '/sponsorship',
  '/sponsorship/donate',
  '/sponsorship/boosters',
  '/sponsorship/sponsor',
  '/sponsorship/volunteer',
]

// SMOKE_ROUTES lets a caller check a different set without touching this file
// -- production-monitor.yml uses it to sweep the public site plus every auth
// entry point on a schedule, which is a much wider net than a deploy gate
// needs.
const routes = process.env.SMOKE_ROUTES
  ? process.env.SMOKE_ROUTES.split(',')
      .map((route) => route.trim())
      .filter(Boolean)
  : DEFAULT_ROUTES

// A rendered page draws far more than this. A blank body, a bare error string
// or a stalled shell draws far less.
const MIN_BODY_TEXT_LENGTH = 200

const IGNORED_PAGE_ERROR_PATTERNS = [
  /ResizeObserver loop completed with undelivered notifications/i,
  /due to access control checks/i,
  // Cloudflare Turnstile runs in its own cross-origin iframe and throws from
  // inside its own bundle when it cannot reach challenges.cloudflare.com --
  // which is the normal state on a CI runner. The stack is entirely
  // Cloudflare's, never ours, and the same pages load fine for real visitors.
  // Failing on it would mean every auth page reports broken forever.
  /Blocked a frame with origin "https:\/\/challenges\.cloudflare\.com"/i,
]

// An error is only ours if something in the stack came from our own origin.
// Third-party widgets (Turnstile, analytics) throwing inside their own
// scripts is not this site being broken.
function isThirdPartyPageError(message) {
  return /https:\/\/(challenges\.cloudflare\.com|static\.cloudflareinsights\.com)/.test(message)
}

function routeSlug(route) {
  return route === '/' ? 'home' : route.replace(/^\//, '').replaceAll('/', '-')
}

function isIgnoredPageError(message) {
  return IGNORED_PAGE_ERROR_PATTERNS.some((pattern) => pattern.test(message)) || isThirdPartyPageError(message)
}

/**
 * Screenshots are evidence, not an assertion. WebKit refuses a full-page
 * capture taller than 32767px, which the longer marketing pages exceed -- and
 * a failed capture was being caught as a navigation error, reporting a
 * perfectly healthy page as down. Never let this fail a route.
 */
async function captureScreenshot(page, path) {
  try {
    await page.screenshot({ path, fullPage: true })
  } catch {
    await page.screenshot({ path }).catch(() => undefined)
  }
}

async function main() {
  const { webkit, devices } = await import('playwright')
  const { mkdir, writeFile } = await import('node:fs/promises')

  const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
  const reportDir = process.env.REPORT_DIR || 'artifacts/runtime-smoke'

  await mkdir(reportDir, { recursive: true })

  const browser = await webkit.launch()
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    reducedMotion: 'no-preference',
  })

  const failures = []
  const results = []

  for (const route of routes) {
    const page = await context.newPage()
    const pageErrors = []
    const consoleErrors = []
    const failedRequests = []

    page.on('pageerror', (error) => {
      pageErrors.push(error.stack || error.message)
    })
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'unknown failure'}`)
    })

    const result = {
      baseUrl,
      route,
      status: null,
      hasApplicationError: false,
      hasMain: false,
      hasContent: false,
      textLength: 0,
      isVercelLogin: false,
      pageErrors,
      fatalPageErrors: [],
      consoleErrors,
      failedRequests,
      bodyPreview: '',
      navigationError: null,
    }

    try {
      const response = await page.goto(`${baseUrl}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      })
      result.status = response?.status() ?? null

      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined)
      await page.waitForTimeout(2_500)

      const bodyText = (await page.locator('body').innerText()).trim()
      result.bodyPreview = bodyText.slice(0, 1_000)
      result.hasApplicationError = bodyText.includes('Application error: a client-side exception has occurred')
      result.hasMain = (await page.locator('main').count()) > 0
      result.isVercelLogin = bodyText.includes('Log in to Vercel') && bodyText.includes('Continue with GitHub')
      result.fatalPageErrors = pageErrors.filter((message) => !isIgnoredPageError(message))

      // The auth pages (/login, /signup, /forgot-password, /update-password)
      // and /terms render a centered card rather than a <main> landmark, so
      // requiring <main> reported them broken when they were fine. What
      // actually distinguishes a rendered page from a blank or crashed one is
      // whether it drew any real text.
      result.textLength = bodyText.length
      const finalPath = new URL(page.url()).pathname
      if (['/login', '/signup', '/forgot-password'].includes(finalPath)) {
        // Auth cards are intentionally short. Assert real controls instead of
        // falsely treating a healthy 135-character login form as a blank page.
        result.hasContent = await page.locator('input[type="email"]').isVisible() &&
          await page.locator('form button[type="submit"]').isVisible()
        if (finalPath !== '/forgot-password') {
          result.hasContent = result.hasContent && await page.locator('input[type="password"]').first().isVisible()
        }
      } else {
        result.hasContent = result.hasMain || bodyText.length >= MIN_BODY_TEXT_LENGTH
      }

      await captureScreenshot(page, `${reportDir}/${routeSlug(route)}.png`)
    } catch (error) {
      result.navigationError = error.stack || error.message
      await captureScreenshot(page, `${reportDir}/${routeSlug(route)}-failure.png`)
    } finally {
      await page.close()
    }

    results.push(result)

    const failed =
      result.navigationError ||
      result.status === null ||
      result.status >= 400 ||
      result.hasApplicationError ||
      result.isVercelLogin ||
      !result.hasContent ||
      result.fatalPageErrors.length > 0

    if (failed) {
      failures.push(result)
      console.error(`FAIL ${baseUrl}${route}`)
    } else {
      console.log(`PASS ${baseUrl}${route} (${result.status})`)
    }
  }

  await context.close()
  await browser.close()

  await writeFile(`${reportDir}/results.json`, JSON.stringify(results, null, 2))

  if (failures.length > 0) {
    console.error(JSON.stringify(failures, null, 2))
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
