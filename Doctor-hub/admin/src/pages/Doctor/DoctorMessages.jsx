import { useContext, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { MessageCircle, Send } from 'lucide-react'
import { DoctorContext } from '@/context/DoctorContext'
import { StaffContext } from '@/context/StaffContext'
import { authHeaders } from '@/lib/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const backendUrl = import.meta.env.VITE_BACKEND_URL

export default function DoctorMessages() {
  const { dToken } = useContext(DoctorContext)
  const { staffToken } = useContext(StaffContext)
  const token = staffRole === 'doctor' && staffToken ? staffToken : dToken
  const [searchParams] = useSearchParams()
  const [threads, setThreads] = useState([])
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  const loadThreads = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/messages`, {
        headers: authHeaders(token),
      })
      if (data.success) setThreads(data.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (patientId, docId) => {
    if (!patientId || !docId) return
    try {
      const { data } = await axios.get(`${backendUrl}/api/messages`, {
        headers: authHeaders(token),
        params: { patient_id: patientId, doctor_id: docId },
      })
      if (data.success) setMessages(data.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  useEffect(() => {
    if (!token) return
    loadThreads()
  }, [token])

  useEffect(() => {
    const patientId = searchParams.get('patient_id')
    if (patientId && threads.length) {
      const t = threads.find((x) => x.patient_id === patientId)
      if (t) setSelected(t)
    }
  }, [threads, searchParams])

  useEffect(() => {
    if (selected) {
      loadMessages(selected.patient_id, selected.doctor_id)
    }
  }, [selected?.patient_id, selected?.doctor_id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim() || !selected) return
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/messages`,
        { patient_id: selected.patient_id, body: text.trim() },
        { headers: authHeaders(token) }
      )
      if (data.success) {
        setText('')
        setMessages((prev) => [...prev, data.data])
        loadThreads()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  if (!token) {
    return <p className="p-6 text-muted-foreground">Doctor login required.</p>
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Patient messages"
        description="Reply to patients you have appointments with."
      />

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : threads.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations"
          description="When patients with appointments message you, threads appear here."
        />
      ) : (
        <div className="grid min-h-[420px] gap-4 md:grid-cols-[240px_1fr]">
          <Card className="overflow-hidden">
            <CardContent className="divide-y p-0">
              {threads.map((t) => (
                <button
                  key={t.patient_id}
                  type="button"
                  onClick={() => setSelected(t)}
                  className={cn(
                    'w-full px-3 py-3 text-left text-sm hover:bg-muted/50',
                    selected?.patient_id === t.patient_id && 'bg-primary/10'
                  )}
                >
                  <p className="font-medium">{t.patient_name}</p>
                  {t.last_message && (
                    <p className="truncate text-xs text-muted-foreground">{t.last_message}</p>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            {selected ? (
              <>
                <div className="border-b px-4 py-3">
                  <p className="font-medium">{selected.patient_name}</p>
                  <p className="text-xs text-muted-foreground">Patient thread</p>
                </div>
                <div className="max-h-[360px] flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                        m.sender_role === 'doctor'
                          ? 'ml-auto bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {m.body}
                      <p
                        className={cn(
                          'mt-1 text-[10px] opacity-70',
                          m.sender_role === 'doctor' ? 'text-right' : ''
                        )}
                      >
                        {new Date(m.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <form onSubmit={send} className="flex gap-2 border-t p-3">
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Reply to patient…"
                    maxLength={4000}
                  />
                  <Button type="submit" size="icon" disabled={!text.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Select a patient conversation.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
