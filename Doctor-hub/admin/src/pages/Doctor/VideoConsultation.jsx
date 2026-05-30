import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { DoctorContext } from '@/context/DoctorContext'
import { StaffContext } from '@/context/StaffContext'
import { authHeaders } from '@/lib/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const backendUrl = import.meta.env.VITE_BACKEND_URL

export default function VideoConsultation() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const { dToken } = useContext(DoctorContext)
  const { staffToken, staffRole } = useContext(StaffContext)
  const token = staffRole === 'doctor' && staffToken ? staffToken : dToken
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('Doctor')

  useEffect(() => {
    if (!token) {
      navigate('/')
      return
    }
    const init = async () => {
      try {
        const me = await axios.get(`${backendUrl}/api/auth/me`, {
          headers: authHeaders(token),
        })
        const name = me.data?.data?.name || 'Doctor'
        setDisplayName(name)

        const { data } = await axios.post(
          `${backendUrl}/api/consultations/${appointmentId}/video-room`,
          { display_name: name },
          { headers: authHeaders(token) }
        )
        if (data.success) setRoom(data.data)
        else toast.error(data.message)
      } catch (err) {
        toast.error(err.response?.data?.message || err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [appointmentId, token, navigate])

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        title="Video consultation"
        description={`Join as ${displayName}. Confirmed appointments only.`}
      />

      {loading ? (
        <p className="text-muted-foreground">Preparing room…</p>
      ) : room ? (
        <>
          <Card>
            <CardContent className="pt-4 text-sm text-muted-foreground">
              <p>
                Patient: <span className="font-medium text-foreground">{room.patient_name}</span>
              </p>
              <p>
                Slot: {room.slot_date} {room.slot_time}
              </p>
            </CardContent>
          </Card>
          <iframe
            title="Video consultation"
            src={room.join_url}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="h-[min(70vh,600px)] w-full rounded-lg border bg-black"
          />
          <Button variant="outline" onClick={() => navigate('/doctor-appointments')}>
            Back to appointments
          </Button>
        </>
      ) : (
        <Button variant="outline" onClick={() => navigate('/doctor-appointments')}>
          Back
        </Button>
      )}
    </div>
  )
}
