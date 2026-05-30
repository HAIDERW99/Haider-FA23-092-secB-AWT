import { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { StaffContext } from '@/context/StaffContext'
import { authHeaders } from '@/lib/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { CreditCard } from 'lucide-react'

const backendUrl = import.meta.env.VITE_BACKEND_URL

export default function PaymentVerifications() {
  const { staffToken } = useContext(StaffContext)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  const loadPending = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/payments/pending`, {
        headers: authHeaders(staffToken),
      })
      setPending(data.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (staffToken) loadPending()
  }, [staffToken])

  const verify = async (paymentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/payments/${paymentId}/verify`,
        {},
        { headers: authHeaders(staffToken) }
      )
      if (data.success) {
        toast.success(data.message)
        loadPending()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  const reject = async (paymentId) => {
    const reason = window.prompt('Rejection reason (optional):') || 'Payment proof unclear'
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/payments/${paymentId}/reject`,
        { reason },
        { headers: authHeaders(staffToken) }
      )
      if (data.success) {
        toast.success(data.message)
        loadPending()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Payment verification"
        description="Step 5 — review patient payment screenshots and confirm appointments."
      />

      {loading ? (
        <p className="text-muted-foreground">Loading queue…</p>
      ) : pending.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No pending payments"
          description="All payment proofs have been processed."
        />
      ) : (
        <div className="grid gap-4">
          {pending.map((item) => {
            const appt = item.appointment
            return (
              <Card key={item.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">
                      {appt?.doc_data?.name || 'Doctor'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Patient: {appt?.user_data?.name || appt?.patient_snapshot?.name} · Fee:{' '}
                      {appt?.amount}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Slot: {appt?.slot_date} {appt?.slot_time}
                    </p>
                  </div>
                  <StatusBadge status={appt?.status || 'payment_submitted'} />
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row">
                  <a
                    href={item.screenshot_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block shrink-0"
                  >
                    <img
                      src={item.screenshot_url}
                      alt="Payment screenshot"
                      className="h-40 w-auto max-w-full rounded-md border object-contain"
                    />
                  </a>
                  <div className="flex flex-col gap-2 sm:justify-center">
                    <Button onClick={() => verify(item.id)}>Approve & confirm</Button>
                    <Button variant="outline" onClick={() => reject(item.id)}>
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
