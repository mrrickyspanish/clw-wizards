import { SignupsPaused } from '@/components/auth/SignupsPaused'
import { getSignupStatus } from '@/lib/content/get'
import AdminSignupForm from './AdminSignupForm'

export const dynamic = 'force-dynamic'

export default async function AdminSignupPage() {
  const status = await getSignupStatus()
  if (!status.admins) return <SignupsPaused audience="admins" />
  return <AdminSignupForm />
}
