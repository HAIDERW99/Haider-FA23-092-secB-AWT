import { Calendar, Users, CreditCard } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { AppointmentStepper } from '@/components/shared/AppointmentStepper'
import { PaymentUploadZone } from '@/components/shared/PaymentUploadZone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

export default function UiPreview() {
  return (
    <div className="space-y-10 pb-16">
      <PageHeader
        title="UI component library"
        description="Doctor Hub design system — use these building blocks for all new screens (Phase 0b)."
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Appointment workflow (documentation)</h2>
        <Card>
          <CardContent className="pt-6">
            <AppointmentStepper currentStep={4} />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Status badges</h2>
        <div className="flex flex-wrap gap-2">
          {['payment_pending', 'payment_submitted', 'verified', 'confirmed', 'rejected', 'completed'].map(
            (s) => (
              <StatusBadge key={s} status={s} />
            )
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Doctors" value="24" description="Available on platform" icon={Users} />
        <StatCard title="Appointments" value="128" description="This month" icon={Calendar} />
        <StatCard title="Payments verified" value="96%" description="Assistant approved" icon={CreditCard} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Form pattern</CardTitle>
            <CardDescription>Login / register fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" />
            </div>
            <Button className="w-full">Sign in</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment upload</CardTitle>
            <CardDescription>Step 4 — screenshot proof</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentUploadZone onFileSelect={() => {}} />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Loading & empty</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <EmptyState
            icon={Calendar}
            title="No appointments yet"
            description="Book a doctor to start your healthcare journey."
            actionLabel="Find doctors"
            onAction={() => {}}
          />
        </div>
      </section>

      <Separator />

      <div className="flex flex-wrap gap-2">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
    </div>
  )
}
