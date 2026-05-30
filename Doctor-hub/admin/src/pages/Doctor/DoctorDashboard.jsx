import { useContext, useEffect } from 'react'
import { Calendar, DollarSign, Users } from 'lucide-react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { RecentAppointmentsList } from '@/components/shared/RecentAppointmentsList'

const DoctorDashboard = () => {
  const { dashData, getDashData, cancelAppointment, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat, currency } = useContext(AppContext)
  useEffect(() => {
    const token = localStorage.getItem('staffToken') || localStorage.getItem('dToken')
    if (token) getDashData()
  }, [])

  if (!dashData) {
    return <p className="p-6 text-muted-foreground">Loading dashboard…</p>
  }

  const stats = dashData.stats || dashData

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader title="Doctor dashboard" description="Appointments and earnings at a glance." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Earnings"
          value={`${currency} ${stats.earnings ?? dashData.earnings}`}
          icon={DollarSign}
        />
        <StatCard
          title="Appointments"
          value={stats.appointments ?? dashData.appointments}
          icon={Calendar}
        />
        <StatCard
          title="Patients"
          value={stats.patients ?? dashData.patients}
          icon={Users}
        />
      </div>

      <RecentAppointmentsList
        items={dashData.latestAppointments || []}
        slotDateFormat={slotDateFormat}
        view="doctor"
        recordsLink="/patient-records"
        onCancel={cancelAppointment}
        onComplete={completeAppointment}
        cancelIcon={assets.cancel_icon}
        tickIcon={assets.tick_icon}
      />
    </div>
  )
}

export default DoctorDashboard
