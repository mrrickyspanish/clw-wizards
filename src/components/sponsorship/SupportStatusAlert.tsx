import { Alert, AlertDescription } from '@/components/ui/alert'

type SupportStatusAlertProps = {
  status?: string
  successMessage: string
}

export function SupportStatusAlert({ status, successMessage }: SupportStatusAlertProps) {
  if (status !== 'success' && status !== 'cancelled') return null

  return (
    <div className="bg-clw-black px-5 pt-5 sm:px-8 sm:pt-8">
      <Alert
        className={`mx-auto max-w-3xl ${
          status === 'success'
            ? 'border-clw-gold/40 bg-clw-gold/10'
            : 'border-clw-white/20 bg-clw-black-2'
        }`}
      >
        <AlertDescription className={status === 'success' ? 'text-clw-gold' : 'text-clw-gray'}>
          {status === 'success' ? successMessage : 'Checkout was cancelled. No payment was made.'}
        </AlertDescription>
      </Alert>
    </div>
  )
}
