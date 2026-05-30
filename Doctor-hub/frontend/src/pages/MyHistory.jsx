import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Lock, FileText, Pill, FileDown } from 'lucide-react'
import { AppContext } from '../context/AppContext'
import { authHeaders } from '@/lib/api'
import { downloadPrescriptionPdf } from '@/lib/prescriptionPdf'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'

export default function MyHistory() {
  const { backendUrl, token } = useContext(AppContext)
  const navigate = useNavigate()

  const [history, setHistory] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)

  const handleDownloadPdf = async (rxId) => {
    setDownloadingId(rxId)
    try {
      await downloadPrescriptionPdf({ prescriptionId: rxId, token, backendUrl })
      toast.success('Prescription PDF downloaded')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setDownloadingId(null)
    }
  }
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const [hRes, pRes] = await Promise.all([
        axios.get(`${backendUrl}/api/history`, { headers: authHeaders(token) }),
        axios.get(`${backendUrl}/api/prescriptions`, { headers: authHeaders(token) }),
      ])
      setHistory(hRes.data.data || [])
      setPrescriptions(pRes.data.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    loadData()
  }, [token])

  const uploadReport = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.warning('Title is required')
      return
    }

    const formData = new FormData()
    formData.append('title', title)
    formData.append('details', details)
    files.forEach((f) => formData.append('attachments', f))

    setSubmitting(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/history`, formData, {
        headers: { ...authHeaders(token), 'Content-Type': 'multipart/form-data' },
      })
      if (data.success) {
        toast.success(data.message)
        setTitle('')
        setDetails('')
        setFiles([])
        loadData()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Medical history"
        description="Upload reports and view prescriptions. Records are permanent and cannot be deleted per healthcare policy."
      />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Upload medical report</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={uploadReport} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Report title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Blood test results"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Details (optional)</Label>
              <Input
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Notes about this report"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="files">Attachments (images/PDF)</Label>
              <Input
                id="files"
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Uploading…' : 'Add to history'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5" /> History timeline
            </h2>
            {history.length === 0 ? (
              <EmptyState title="No history yet" description="Upload your first medical report above." />
            ) : (
              <ul className="space-y-3">
                {history.map((item) => (
                  <li key={item.id} className="rounded-lg border bg-card p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      <Badge variant="secondary">
                        {item.record_type === 'doctor_note' ? 'Doctor note' : 'Your report'}
                      </Badge>
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" title="Immutable" />
                    </div>
                    {item.details && (
                      <p className="text-sm text-muted-foreground">{item.details}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                    {(item.attachments || []).length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {item.attachments.map((att, i) => (
                          <li key={i}>
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-primary underline"
                            >
                              {att.name || 'Attachment'}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Pill className="h-5 w-5" /> Prescriptions
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Prescriptions from doctors are permanent — you cannot remove them.
            </p>
            {prescriptions.length === 0 ? (
              <EmptyState title="No prescriptions" description="Prescriptions appear after doctor visits." />
            ) : (
              <ul className="space-y-3">
                {prescriptions.map((rx) => (
                  <li key={rx.id} className="rounded-lg border border-primary/20 bg-accent/30 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-medium">Prescription</span>
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <ul className="list-inside list-disc text-sm">
                      {(rx.medicines || []).map((m, i) => (
                        <li key={i}>
                          {m.name} — {m.dose} ({m.frequency}) {m.duration}
                        </li>
                      ))}
                    </ul>
                    {rx.notes && <p className="mt-2 text-sm text-muted-foreground">{rx.notes}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(rx.created_at).toLocaleString()}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      disabled={downloadingId === rx.id}
                      onClick={() => handleDownloadPdf(rx.id)}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      {downloadingId === rx.id ? 'Generating…' : 'Download PDF'}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
