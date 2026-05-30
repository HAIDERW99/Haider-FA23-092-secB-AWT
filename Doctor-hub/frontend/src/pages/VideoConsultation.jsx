import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Video } from 'lucide-react'
import { AppContext } from '@/context/AppContext'
import { authHeaders } from '@/lib/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function VideoConsultation() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const { backendUrl, token, userData } = useContext(AppContext)
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    const init = async () => {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/consultations/${appointmentId}/video-room`,
          { display_name: userData?.name || 'Patient' },
          { headers: authHeaders(token) }
        )
        if (data.success) {
          setRoom(data.data)
        } else {
          toast.error(data.message)
        }
      } catch (err) {
        toast.error(err.response?.data?.message || err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [appointmentId, token, backendUrl, userData, navigate])

  const iframeSrc = room?.join_url

  return (
    <div className="container max-w-5xl py-8">
      <PageHeader
        title="Video consultation"
        description="Secure video call for your confirmed appointment. Allow camera and microphone when prompted."
      />

      {loading ? (
        <p className="text-muted-foreground">Preparing video room…</p>
      ) : room ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">With:</span>{' '}
                {room.doctor_name || 'Your doctor'}
              </p>
              <p>
                <span className="font-medium text-foreground">Slot:</span> {room.slot_date}{' '}
                {room.slot_time}
              </p>
              <p className="mt-2 text-xs">
                Provider: {room.provider}. Room expires after the scheduled visit window.
              </p>
            </CardContent>
          </Card>

          {iframeSrc ? (
            <iframe
              title="Video consultation"
              src={iframeSrc}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="h-[min(70vh,600px)] w-full rounded-lg border bg-black"
            />
          ) : (
            <p className="text-destructive">Could not load video room.</p>
          )}

          <Button variant="outline" onClick={() => navigate('/my-appointments')}>
            Back to appointments
          </Button>
        </div>
      ) : (
        <EmptyFallback onBack={() => navigate('/my-appointments')} />
      )}
    </div>
  )
}

function EmptyFallback({ onBack }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <Video className="h-12 w-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Video room unavailable.</p>
      <Button variant="outline" onClick={onBack}>
        Back to appointments
      </Button>
    </div>
  )
}
