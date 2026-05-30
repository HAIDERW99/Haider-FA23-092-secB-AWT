import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { MessageCircle, Send } from 'lucide-react'
import { AppContext } from '@/context/AppContext'
import { authHeaders } from '@/lib/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function Messages() {
  const { backendUrl, token, userData } = useContext(AppContext)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [threads, setThreads] = useState([])
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  const patientId = userData?.id

  const loadThreads = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/messages`, {
        headers: authHeaders(token),
      })
      if (data.success) {
        setThreads(data.data || [])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (doctorId) => {
    if (!patientId || !doctorId) return
    try {
      const { data } = await axios.get(`${backendUrl}/api/messages`, {
        headers: authHeaders(token),
        params: { patient_id: patientId, doctor_id: doctorId },
      })
      if (data.success) setMessages(data.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    loadThreads()
  }, [token])

  useEffect(() => {
    const doctorId = searchParams.get('doctor_id')
    if (doctorId && threads.length) {
      const t = threads.find((x) => x.doctor_id === doctorId)
      if (t) setSelected(t)
    }
  }, [threads, searchParams])

  useEffect(() => {
    if (selected) loadMessages(selected.doctor_id)
  }, [selected?.doctor_id, patientId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim() || !selected) return
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/messages`,
        { doctor_id: selected.doctor_id, body: text.trim() },
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

  return (
    <div className="container max-w-5xl py-8">
      <PageHeader
        title="Messages"
        description="Chat with doctors you have booked. Messages are tied to your appointment relationship."
      />

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : threads.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="Book an appointment first, then you can message your doctor here."
          actionLabel="Find doctors"
          onAction={() => navigate('/doctors')}
        />
      ) : (
        <div className="grid min-h-[420px] gap-4 md:grid-cols-[240px_1fr]">
          <Card className="overflow-hidden">
            <CardContent className="divide-y p-0">
              {threads.map((t) => (
                <button
                  key={t.doctor_id}
                  type="button"
                  onClick={() => setSelected(t)}
                  className={cn(
                    'w-full px-3 py-3 text-left text-sm hover:bg-muted/50',
                    selected?.doctor_id === t.doctor_id && 'bg-primary/10'
                  )}
                >
                  <p className="font-medium">{t.doctor_name}</p>
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
                  <p className="font-medium">{selected.doctor_name}</p>
                  <p className="text-xs text-muted-foreground">Secure patient–doctor thread</p>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-4 max-h-[360px]">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                      No messages yet. Say hello to your doctor.
                    </p>
                  )}
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                        m.sender_role === 'patient'
                          ? 'ml-auto bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {m.body}
                      <p
                        className={cn(
                          'mt-1 text-[10px] opacity-70',
                          m.sender_role === 'patient' ? 'text-right' : ''
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
                    placeholder="Type a message…"
                    maxLength={4000}
                  />
                  <Button type="submit" size="icon" disabled={!text.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Select a doctor to view the conversation.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
