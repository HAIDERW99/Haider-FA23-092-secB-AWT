import { useContext, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'

const DoctorAppointments = () => {
  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment } =
    useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const staffRole = localStorage.getItem('staffRole')

  useEffect(() => {
    if (dToken || localStorage.getItem('staffToken')) {
      getAppointments()
    }
  }, [dToken])

  const patientId = (item) => item.patient_id || item.user_id

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">All Appointments</p>

      <div className="max-h-[80vh] overflow-y-scroll rounded border bg-white text-sm">
        <div className="grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr_1fr] gap-1 border-b px-6 py-3 max-sm:hidden">
          <p>#</p>
          <p>Patient</p>
          <p>Status</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Records</p>
          <p>Action</p>
        </div>
        {appointments.map((item, index) => (
          <div
            className="grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr_1fr] items-center gap-1 border-b px-6 py-3 hover:bg-gray-50 max-sm:grid-cols-1"
            key={item.id || index}
          >
            <p className="max-sm:hidden">{index + 1}</p>
            <div className="flex items-center gap-2">
              <img
                src={item.user_data?.image || item.patient_snapshot?.image}
                className="h-8 w-8 rounded-full"
                alt=""
              />
              <p>{item.user_data?.name || item.patient_snapshot?.name}</p>
            </div>
            <div>
              {staffRole === 'doctor' && item.status ? (
                <StatusBadge status={item.status} />
              ) : (
                <p className="inline rounded-full border border-primary px-2 text-xs">
                  {item.payment ? 'Paid' : 'Pending'}
                </p>
              )}
            </div>
            <p className="max-sm:hidden">
              {calculateAge(item.user_data?.dob || item.patient_snapshot?.dob)}
            </p>
            <p>
              {slotDateFormat(item.slot_date)}, {item.slot_time}
            </p>
            <p>
              {currency}
              {item.amount}
            </p>
            <div className="flex flex-col gap-1">
              {patientId(item) && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/patient-records?patient_id=${patientId(item)}`}>History</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/messages?patient_id=${patientId(item)}`}>Message</Link>
                  </Button>
                  {item.status === 'confirmed' && (
                    <Button variant="default" size="sm" asChild>
                      <Link to={`/video/${item.id}`}>Video</Link>
                    </Button>
                  )}
                </>
              )}
            </div>
            {item.cancelled || item.status === 'cancelled' ? (
              <p className="text-xs font-medium text-red-400">Cancelled</p>
            ) : item.isCompleted || item.status === 'completed' ? (
              <p className="text-xs font-medium text-green-500">Completed</p>
            ) : (
              <div className="flex">
                <img
                  onClick={() => cancelAppointment(item.id)}
                  className="w-10 cursor-pointer"
                  src={assets.cancel_icon}
                  alt=""
                />
                <img
                  onClick={() => completeAppointment(item.id)}
                  className="w-10 cursor-pointer"
                  src={assets.tick_icon}
                  alt=""
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default DoctorAppointments
