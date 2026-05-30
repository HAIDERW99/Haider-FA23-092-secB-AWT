import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const APPOINTMENT_STEPS = [
  { id: 1, key: 'search', label: 'Search' },
  { id: 2, key: 'filter', label: 'Filter' },
  { id: 3, key: 'book', label: 'Book' },
  { id: 4, key: 'payment', label: 'Payment upload' },
  { id: 5, key: 'verification', label: 'Verification' },
  { id: 6, key: 'confirmation', label: 'Confirmation' },
]

export function AppointmentStepper({ currentStep = 1, className }) {
  return (
    <nav aria-label="Appointment progress" className={cn('w-full', className)}>
      <ol className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {APPOINTMENT_STEPS.map((step, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <li key={step.key} className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
              <div className="flex items-center gap-3 sm:flex-col">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                    isComplete && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-primary/10 text-primary',
                    !isComplete && !isCurrent && 'border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : stepNumber}
                </div>
                {index < APPOINTMENT_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'hidden h-0.5 flex-1 sm:block sm:h-auto sm:w-full sm:flex-none sm:border-t-2 sm:border-dashed',
                      isComplete ? 'sm:border-primary' : 'sm:border-muted'
                    )}
                    aria-hidden
                  />
                )}
              </div>
              <div className="min-w-0 pt-0.5 sm:pt-2">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isCurrent ? 'text-primary' : isComplete ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
