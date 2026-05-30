import { useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Lock, FileDown } from 'lucide-react'
import { downloadPrescriptionPdf } from '@/lib/prescriptionPdf'
import { StaffContext } from '@/context/StaffContext'
import { authHeaders } from '@/lib/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const backendUrl = import.meta.env.VITE_BACKEND_URL

export default function PatientRecords() {
  const { staffToken } = useContext(StaffContext)
  const [searchParams] = useSearchParams()
  const patientId = searchParams.get('patient_id')

  const [history, setHistory] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [noteTitle, setNoteTitle] = useState('')
  const [noteDetails, setNoteDetails] = useState('')
  const [medName, setMedName] = useState('')
  const [medDose, setMedDose] = useState('')
  const [medFreq, setMedFreq] = useState('')
  const [medDuration, setMedDuration] = useState('')
  const [rxNotes, setRxNotes] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)

  const handleDownloadPdf = async (rxId) => {
    setDownloadingId(rxId)
    try {
      await downloadPrescriptionPdf({
        prescriptionId: rxId,
        token: staffToken,
        backendUrl,
      })
      toast.success('Prescription PDF downloaded')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setDownloadingId(null)
    }
  }

  const load = async () => {
    if (!patientId) return
    try {
      const params = { patient_id: patientId }
      const [h, p] = await Promise.all([
        axios.get(`${backendUrl}/api/history`, { headers: authHeaders(staffToken), params }),
        axios.get(`${backendUrl}/api/prescriptions`, { headers: authHeaders(staffToken), params }),
      ])
      setHistory(h.data.data || [])
      setPrescriptions(p.data.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  useEffect(() => {
    if (staffToken && patientId) load()
  }, [staffToken, patientId])

  const addNote = async (e) => {
    e.preventDefault()
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/history`,
        { title: noteTitle, details: noteDetails, patient_id: patientId },
        { headers: authHeaders(staffToken) }
      )
      if (data.success) {
        toast.success(data.message)
        setNoteTitle('')
        setNoteDetails('')
        load()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  const addPrescription = async (e) => {
    e.preventDefault()
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/prescriptions`,
        {
          patient_id: patientId,
          notes: rxNotes,
          medicines: [
            { name: medName, dose: medDose, frequency: medFreq, duration: medDuration, instructions: '' },
          ],
        },
        { headers: authHeaders(staffToken) }
      )
      if (data.success) {
        toast.success(data.message)
        setMedName('')
        setMedDose('')
        setMedFreq('')
        setMedDuration('')
        setRxNotes('')
        load()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  if (!patientId) {
    return <p className="text-muted-foreground">Missing patient_id in URL.</p>
  }

  return (
    <div>
      <PageHeader
        title="Patient medical records"
        description="Append-only history and prescriptions. Existing records cannot be edited or deleted."
      />

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add visit note</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addNote} className="space-y-3">
              <Input placeholder="Title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} required />
              <Input placeholder="Details" value={noteDetails} onChange={(e) => setNoteDetails(e.target.value)} />
              <Button type="submit" size="sm">
                Add note (append only)
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add prescription</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addPrescription} className="space-y-3">
              <Input placeholder="Medicine name" value={medName} onChange={(e) => setMedName(e.target.value)} required />
              <Input placeholder="Dose" value={medDose} onChange={(e) => setMedDose(e.target.value)} />
              <Input placeholder="Frequency" value={medFreq} onChange={(e) => setMedFreq(e.target.value)} />
              <Input placeholder="Duration" value={medDuration} onChange={(e) => setMedDuration(e.target.value)} />
              <Input placeholder="Notes" value={rxNotes} onChange={(e) => setRxNotes(e.target.value)} />
              <Button type="submit" size="sm">
                Save prescription (permanent)
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h3 className="mb-3 font-semibold">History</h3>
          <ul className="space-y-2">
            {history.map((item) => (
              <li key={item.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.title}</span>
                  <Lock className="h-3 w-3" />
                  <Badge variant="outline">{item.record_type}</Badge>
                </div>
                <p className="text-muted-foreground">{item.details}</p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-3 font-semibold">Prescriptions</h3>
          <ul className="space-y-2">
            {prescriptions.map((rx) => (
              <li key={rx.id} className="rounded-md border p-3 text-sm">
                <Lock className="mb-1 inline h-3 w-3" /> Permanent
                <ul className="list-inside list-disc">
                  {(rx.medicines || []).map((m, i) => (
                    <li key={i}>
                      {m.name} — {m.dose}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={downloadingId === rx.id}
                  onClick={() => handleDownloadPdf(rx.id)}
                >
                  <FileDown className="mr-2 h-3 w-3" />
                  {downloadingId === rx.id ? 'PDF…' : 'Download PDF'}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
