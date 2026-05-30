import { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  Calendar,
  ShieldCheck,
  Stethoscope,
  Users,
  UserCog,
  ClipboardList,
} from 'lucide-react'
import { StaffContext } from '@/context/StaffContext'
import { authHeaders } from '@/lib/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'

const backendUrl = import.meta.env.VITE_BACKEND_URL

const slotDateFormat = (slotDate) => {
  if (!slotDate) return ''
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const [day, month, year] = slotDate.split('_')
  return `${day} ${months[Number(month)]} ${year}`
}

export default function StaffDashboard() {
  const { staffRole, staffToken } = useContext(StaffContext)
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)

  useEffect(() => {
    if (!staffToken) return
    const load = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/dashboard`, {
          headers: authHeaders(staffToken),
        })
        if (data.success) {
          setDashboard(data.data)
        } else {
          toast.error(data.message)
        }
      } catch (err) {
        toast.error(err.response?.data?.message || err.message)
      }
    }
    load()
  }, [staffToken])

  if (!dashboard) {
    return <p className="p-6 text-muted-foreground">Loading dashboard…</p>
  }

  const { stats, recentAppointments, recentPendingPayments } = dashboard
  const isAdmin = ['admin', 'super_admin'].includes(staffRole)

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? 'Admin dashboard' : 'Assistant dashboard'}
        description={
          isAdmin
            ? 'System overview — doctors, patients, and payment queue.'
            : 'Scoped to your clinic or doctor — verify payments and track bookings.'
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isAdmin ? (
          <>
            <StatCard title="Doctors" value={stats.doctors} icon={Stethoscope} />
            <StatCard title="Patients" value={stats.patients} icon={Users} />
            <StatCard title="Assistants" value={stats.assistants} icon={UserCog} />
            <StatCard title="Appointments" value={stats.appointments} icon={Calendar} />
          </>
        ) : (
          <>
            <StatCard
              title="Pending payments"
              value={stats.pendingPayments}
              description="Awaiting verification"
              icon={ShieldCheck}
            />
            <StatCard title="Appointments" value={stats.appointments} icon={ClipboardList} />
            <StatCard title="Upcoming" value={stats.upcoming} icon={Calendar} />
          </>
        )}
        {isAdmin && (
          <StatCard
            title="Pending payments"
            value={stats.pendingPayments}
            description="Screenshots to review"
            icon={ShieldCheck}
          />
        )}
      </div>

      <Button onClick={() => navigate('/payment-verifications')}>Open payment verification</Button>

      {recentPendingPayments?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment queue (latest)</CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {recentPendingPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {p.appointment?.patient_snapshot?.name || 'Patient'}
                  </p>
                  <p className="text-muted-foreground">
                    {slotDateFormat(p.appointment?.slot_date)} · {p.appointment?.slot_time}
                  </p>
                </div>
                <StatusBadge status={p.appointment?.status || 'payment_submitted'} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {recentAppointments?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent appointments</CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {recentAppointments.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {item.patient_snapshot?.name || item.user_data?.name}
                  </p>
                  <p className="text-muted-foreground">
                    Dr. {item.doctor_snapshot?.name || item.doc_data?.name} ·{' '}
                    {slotDateFormat(item.slot_date)}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
