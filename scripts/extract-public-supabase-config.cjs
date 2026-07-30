const baseUrl = 'https://clw-wizards-ovw5g3h2h-creativeeyemm.vercel.app'

async function main() {
  const html = await fetch(baseUrl).then(async (response) => {
    if (!response.ok) throw new Error(`Failed to fetch ${baseUrl}: ${response.status}`)
    return response.text()
  })

  const scriptUrls = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)]
    .map((match) => new URL(match[1], baseUrl).toString())

  const haystacks = [html]
  for (const url of scriptUrls) {
    try {
      const text = await fetch(url).then((response) => response.text())
      haystacks.push(text)
    } catch {}
  }

  const combined = haystacks.join('\n')
  const urls = [...new Set(combined.match(/https:\/\/[a-z0-9-]+\.supabase\.co/g) || [])]
  const tokens = [...new Set(combined.match(/eyJ[A-Za-z0-9_-]{80,}/g) || [])]

  console.log('SUPABASE_URL_MATCHES=' + JSON.stringify(urls))
  console.log('SUPABASE_TOKEN_MATCHES=' + JSON.stringify(tokens))

  if (urls.length === 0 || tokens.length === 0) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
