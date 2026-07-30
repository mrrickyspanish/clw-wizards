const routes = [
  '/',
  '/sponsorship',
  '/sponsorship/donate',
  '/sponsorship/boosters',
  '/sponsorship/sponsor',
  '/sponsorship/volunteer',
]

function routeSlug(route) {
  return route === '/' ? 'home' : route.replace(/^\//, '').replaceAll('/', '-')
}

async function main() {
  const { webkit, devices } = await import('playwright')
  const { mkdir, writeFile } = await import('node:fs/promises')

  const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
  const reportDir = process.env.REPORT_DIR || 'artifacts/runtime-smoke'
  const reportOnly = process.env.REPORT_ONLY === '1'

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
      pageErrors,
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

      await page.screenshot({
        path: `${reportDir}/${routeSlug(route)}.png`,
        fullPage: true,
      })
    } catch (error) {
      result.navigationError = error.stack || error.message
      await page.screenshot({
        path: `${reportDir}/${routeSlug(route)}-failure.png`,
        fullPage: true,
      }).catch(() => undefined)
    } finally {
      await page.close()
    }

    results.push(result)

    const failed =
      result.navigationError ||
      result.status === null ||
      result.status >= 400 ||
      result.hasApplicationError ||
      !result.hasMain ||
      result.pageErrors.length > 0

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
    if (!reportOnly) process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
