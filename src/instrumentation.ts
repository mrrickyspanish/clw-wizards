import { DEMO_MODE, demoProblems, scrubDemoEnv } from '@/lib/demo'

// Runs once when a server starts, before any request. In a Homefield demo
// deployment it removes every key that could reach a real person or real
// money, and refuses to start at all if the demo points at the live club.
export async function register() {
  if (!DEMO_MODE) return
  const problems = demoProblems(process.env)
  if (problems.length) throw new Error(`Homefield demo refused to start: ${problems.join(' ')}`)
  scrubDemoEnv(process.env)
}
