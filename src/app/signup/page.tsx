import { SignupsPaused } from '@/components/auth/SignupsPaused'
import { getSignupStatus } from '@/lib/content/get'
import SignupForm from './SignupForm'

// Read fresh on every visit: reopening sign-ups must not wait on a cache.
export const dynamic = 'force-dynamic'

export default async function SignupPage() {
  const status = await getSignupStatus()
  if (!status.parents) return <SignupsPaused />
  return <SignupForm />
}
