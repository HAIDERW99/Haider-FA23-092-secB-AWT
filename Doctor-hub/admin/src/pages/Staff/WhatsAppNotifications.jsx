import { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { StaffContext } from '@/context/StaffContext'
import { authHeaders } from '@/lib/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MessageSquare } from 'lucide-react'

const backendUrl = import.meta.env.VITE_BACKEND_URL

const TEMPLATES = [
  { value: 'appointment_confirmed', label: 'Appointment confirmed' },
  { value: 'payment_rejected', label: 'Payment rejected' },
  { value: 'appointment_booked', label: 'Appointment booked' },
  { value: 'custom', label: 'Custom message' },
]

export default function WhatsAppNotifications() {
  const { staffToken } = useContext(StaffContext)
  const [log, setLog] = useState([])
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [appointmentId, setAppointmentId] = useState('')
  const [template, setTemplate] = useState('custom')

  const loadLog = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/notifications/whatsapp`, {
        headers: authHeaders(staffToken),
      })
      setLog(data.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  useEffect(() => {
    if (staffToken) loadLog()
  }, [staffToken])

  const send = async (e) => {
    e.preventDefault()
    try {
      const body = {
        phone: phone || undefined,
        message: template === 'custom' ? message : undefined,
        appointment_id: appointmentId || undefined,
        template: appointmentId ? template : 'custom',
      }
      if (!body.appointment_id && !body.phone) {
        toast.error('Provide phone or appointment ID')
        return
      }
      if (template === 'custom' && !body.message) {
        toast.error('Message is required for custom template')
        return
      }

      const { data } = await axios.post(`${backendUrl}/api/notifications/whatsapp`, body, {
        headers: authHeaders(staffToken),
      })
      if (data.success) {
        toast.success(data.message)
        setMessage('')
        loadLog()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  const statusVariant = (status) => {
    if (status === 'sent') return 'default'
    if (status === 'demo') return 'secondary'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp notifications"
        description="Automatic messages on booking and payment events. Manual send for staff. Without Twilio credentials, messages are logged in demo mode."
      />

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <form onSubmit={send} className="space-y-4">
            <p className="font-medium text-sm">Send manual notification</p>
            <div>
              <Label>Appointment ID (optional)</Label>
              <Input
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                placeholder="UUID from appointments"
              />
            </div>
            <div>
              <Label>Template</Label>
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              >
                {TEMPLATES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Phone (if no appointment)</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03001234567"
              />
            </div>
            {template === 'custom' && (
              <div>
                <Label>Message</Label>
                <textarea
                  className="mt-1 flex min-h-[80px] w-full rounded-md border border-input px-3 py-2 text-sm"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1600}
                />
              </div>
            )}
            <Button type="submit">
              <MessageSquare className="mr-2 h-4 w-4" />
              Send
            </Button>
          </form>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Automatic triggers</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Appointment booked → payment reminder</li>
              <li>Payment uploaded → verification pending</li>
              <li>Payment approved → confirmed</li>
              <li>Payment rejected → re-upload request</li>
            </ul>
            <p className="mt-4 text-xs">
              Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in backend
              .env for live WhatsApp.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y p-0 pt-2">
          <p className="px-4 py-2 font-medium text-sm">Recent log</p>
          {log.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            log.map((row) => (
              <div key={row.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{row.recipient_phone}</p>
                  <p className="text-muted-foreground line-clamp-2">{row.message_body}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.template} · {new Date(row.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
