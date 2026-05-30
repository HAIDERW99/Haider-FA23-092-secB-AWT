import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import {
  Calendar,
  CreditCard,
  FileText,
  Pill,
  Stethoscope,
  Clock,
} from 'lucide-react'
import { AppContext } from '@/context/AppContext'
import { authHeaders } from '@/lib/api'
import { StatCard } from '@/components/shared/StatCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const slotDateFormat = (slotDate) => {
  if (!slotDate) return ''
  const [day, month, year] = slotDate.split('_')
  return `${day} ${months[Number(month)]} ${year}`
}

export default function PatientDashboard() {
  const { backendUrl, token, currencySymbol } = useContext(AppContext)
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    const load = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/dashboard`, {
          headers: authHeaders(token),
        })
        if (data.success) {
          setDashboard(data.data)
        } else {
          toast.error(data.message)
        }
      } catch (err) {
        toast.error(err.response?.data?.message || err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, backendUrl, navigate])

  if (loading) {
    return <p className="container py-10 text-muted-foreground">Loading dashboard…</p>
  }

  if (!dashboard) return null

  const { stats, recentAppointments } = dashboard

  return (
    <div className="container max-w-5xl space-y-8 py-8">
      <PageHeader
        title="My dashboard"
        description="Overview of appointments, payments, and medical records."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Upcoming visits"
          value={stats.upcoming}
          description="Confirmed or verified"
          icon={Calendar}
        />
        <StatCard
          title="Payment needed"
          value={stats.needsPayment}
          description="Upload screenshot to continue"
          icon={CreditCard}
        />
        <StatCard
          title="Awaiting verification"
          value={stats.awaitingVerification}
          description="Assistant reviewing payment"
          icon={Clock}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={Stethoscope}
        />
        <StatCard
          title="History entries"
          value={stats.historyRecords}
          icon={FileText}
        />
        <StatCard
          title="Prescriptions"
          value={stats.prescriptions}
          icon={Pill}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/doctors">Book appointment</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/my-appointments">All appointments</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/my-history">Medical history</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent appointments</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {recentAppointments.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No appointments yet.</p>
          ) : (
            recentAppointments.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <img
                  className="h-10 w-10 rounded-full object-cover"
                  src={item.doc_data?.image || item.doctor_snapshot?.image}
                  alt=""
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">
                    {item.doc_data?.name || item.doctor_snapshot?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {slotDateFormat(item.slot_date)} · {item.slot_time} · {currencySymbol}
                    {item.amount}
                  </p>
                </div>
                <StatusBadge status={item.status} />
                {['payment_pending', 'rejected'].includes(item.status) && (
                  <Button size="sm" onClick={() => navigate(`/payment/${item.id}`)}>
                    Upload payment
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
