import AdminSignupForm from './AdminSignupForm'

// Always open (Ricky, Nov 5): pausing parent sign-ups never blocks adding an
// admin. The single-use invite code from Admin team is what keeps it safe.
export default function AdminSignupPage() {
  return <AdminSignupForm />
}
