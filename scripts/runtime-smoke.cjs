const { webkit, devices } = require('playwright')

const routes = [
  '/',
  '/sponsorship',
  '/sponsorship/donate',
  '/sponsorship/boosters',
  '/sponsorship/volunteer',
]

async function main() {
  const browser = await webkit.launch()
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    reducedMotion: 'no-preference',
  })

  const failures = []

  for (const route of routes) {
    const page = await context.newPage()
    const pageErrors = []

    page.on('pageerror', (error) => {
      pageErrors.push(error.stack || error.message)
    })

    try {
      const response = await page.goto(`http://127.0.0.1:3000${route}`, {
        waitUntil: 'networkidle',
        timeout: 45_000,
      })
      await page.waitForTimeout(1_000)

      const bodyText = (await page.locator('body').innerText()).trim()
      const hasApplicationError = bodyText.includes('Application error: a client-side exception has occurred')
      const hasMain = (await page.locator('main').count()) > 0

      if (!response || response.status() >= 400 || hasApplicationError || !hasMain || pageErrors.length > 0) {
        failures.push({
          route,
          status: response?.status() ?? null,
          hasApplicationError,
          hasMain,
          pageErrors,
          bodyPreview: bodyText.slice(0, 500),
        })
      } else {
        console.log(`PASS ${route} (${response.status()})`)
      }
    } catch (error) {
      failures.push({ route, navigationError: error.stack || error.message, pageErrors })
    } finally {
      await page.close()
    }
  }

  await context.close()
  await browser.close()

  if (failures.length > 0) {
    console.error(JSON.stringify(failures, null, 2))
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
