# Support runtime incident validation

The first production merge of the rebuilt Support system passed TypeScript, ESLint, and Vercel build checks but produced a client-side exception in mobile Safari/WebKit.

This branch adds a real WebKit browser smoke test for the public homepage and Support routes. The Support rebuild must not return to `main` until the test loads every covered route without a page error, generic Next.js application-error screen, HTTP error, or missing main content.
