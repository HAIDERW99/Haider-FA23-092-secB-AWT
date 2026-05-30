import { useContext, useEffect } from 'react'
import { Stethoscope, Calendar, Users, ShieldCheck } from 'lucide-react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { RecentAppointmentsList } from '@/components/shared/RecentAppointmentsList'

const Dashboard = () => {
  const { aToken, getDashData, cancelAppointment, dashData } = useContext(AdminContext)
  const { slotDateFormat } = useContext(AppContext)

  useEffect(() => {
    if (aToken) getDashData()
  }, [aToken])

  if (!dashData) {
    return <p className="p-6 text-muted-foreground">Loading dashboard…</p>
  }

  const stats = dashData.stats || dashData

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader title="Admin dashboard" description="Platform overview and recent bookings." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Doctors" value={stats.doctors ?? dashData.doctors} icon={Stethoscope} />
        <StatCard title="Patients" value={stats.patients ?? dashData.patients} icon={Users} />
        <StatCard
          title="Appointments"
          value={stats.appointments ?? dashData.appointments}
          icon={Calendar}
        />
        {stats.pendingPayments != null && (
          <StatCard title="Pending payments" value={stats.pendingPayments} icon={ShieldCheck} />
        )}
      </div>

      <RecentAppointmentsList
        items={dashData.latestAppointments || []}
        slotDateFormat={slotDateFormat}
        view="admin"
        onCancel={cancelAppointment}
        cancelIcon={assets.cancel_icon}
      />
    </div>
  )
}

export default Dashboard
