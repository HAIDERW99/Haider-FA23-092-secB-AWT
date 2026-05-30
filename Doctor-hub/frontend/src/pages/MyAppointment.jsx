import axios from 'axios'
import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AppContext } from '../context/AppContext'
import { authHeaders } from '@/lib/api'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageHeader } from '@/components/shared/PageHeader'
import { AppointmentStepper } from '@/components/shared/AppointmentStepper'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { Calendar } from 'lucide-react'

const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const slotDateFormat = (slotDate) => {
  const [day, month, year] = slotDate.split('_')
  return `${day} ${months[Number(month)]} ${year}`
}

const workflowHint = (status) => {
  switch (status) {
    case 'payment_pending':
      return 'Step 4: Upload payment screenshot to continue.'
    case 'payment_submitted':
      return 'Step 5: Waiting for assistant verification (Step 6 after approval).'
    case 'verified':
      return 'Payment verified — confirmation pending.'
    case 'confirmed':
      return 'Step 6: Appointment confirmed.'
    case 'rejected':
      return 'Payment rejected — please re-upload proof.'
    case 'completed':
      return 'Visit completed.'
    case 'cancelled':
      return 'Appointment cancelled.'
    default:
      return ''
  }
}

export default function MyAppointments() {
  const { backendUrl, token, getDoctorsData } = useContext(AppContext)
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/appointments`, {
        headers: authHeaders(token),
      })
      setAppointments(data.data || data.appointments || [])
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/appointments/${appointmentId}/cancel`,
        {},
        { headers: authHeaders(token) }
      )
      if (data.success) {
        toast.success(data.message)
        getUserAppointments()
        getDoctorsData()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    getUserAppointments()
  }, [token])

  const canCancel = (status) =>
    ['payment_pending', 'payment_submitted', 'rejected'].includes(status)

  const stepForStatus = (status) => {
    const map = {
      payment_pending: 4,
      payment_submitted: 5,
      verified: 5,
      confirmed: 6,
      rejected: 4,
      completed: 6,
    }
    return map[status] || 3
  }

  return (
    <div>
      <PageHeader
        title="My appointments"
        description="Track your booking through the 6-step workflow: search → filter → book → payment → verification → confirmation."
      />

      {appointments.length > 0 && (
        <div className="mb-8">
          <AppointmentStepper currentStep={stepForStatus(appointments[0]?.status)} />
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading appointments…</p>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments yet"
          description="Find a doctor and book your first appointment."
          actionLabel="Find doctors"
          onAction={() => navigate('/doctors')}
        />
      ) : (
        <div className="space-y-4">
          {appointments.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-[auto_1fr_auto]"
            >
              <img
                className="h-28 w-28 rounded-lg bg-muted object-cover"
                src={item.doc_data?.image || '/placeholder-doctor.png'}
                alt=""
              />
              <div className="text-sm text-muted-foreground">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-foreground">{item.doc_data?.name}</p>
                  <StatusBadge status={item.status} />
                </div>
                <p>{item.doc_data?.speciality}</p>
                <p className="mt-1">
                  <span className="font-medium text-foreground">Date & time:</span>{' '}
                  {slotDateFormat(item.slot_date)} | {item.slot_time}
                </p>
                <p className="mt-1 text-xs">{workflowHint(item.status)}</p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(`/messages?doctor_id=${item.doctor_id || item.doc_data?.id}`)
                  }
                >
                  Message doctor
                </Button>
                {item.status === 'confirmed' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate(`/video/${item.id}`)}
                  >
                    Join video call
                  </Button>
                )}
                {(item.status === 'payment_pending' || item.status === 'rejected') && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate(`/payment/${item.id}`)}
                  >
                    Upload payment proof
                  </Button>
                )}
                {canCancel(item.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => cancelAppointment(item.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
