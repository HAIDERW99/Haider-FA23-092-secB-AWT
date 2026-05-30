import { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { StaffContext } from '@/context/StaffContext'
import { authHeaders } from '@/lib/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/shared/EmptyState'
import { UserCog, Plus } from 'lucide-react'

const backendUrl = import.meta.env.VITE_BACKEND_URL

export default function AssistantsList() {
  const { staffToken } = useContext(StaffContext)
  const token = staffToken
  const navigate = useNavigate()
  const [assistants, setAssistants] = useState([])
  const [doctors, setDoctors] = useState([])
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterDoctor, setFilterDoctor] = useState('')
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})

  const load = async () => {
    if (!token) return
    try {
      const params = filterDoctor ? { doctor_id: filterDoctor } : {}
      const { data } = await axios.get(`${backendUrl}/api/assistants`, {
        headers: authHeaders(token),
        params,
      })
      setAssistants(data.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadDoctors = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctors`)
      if (data.success) setDoctors(data.data || [])
    } catch {
      /* optional */
    }
  }

  const loadClinics = async (doctorId) => {
    if (!doctorId) {
      setClinics([])
      return
    }
    try {
      const { data } = await axios.get(`${backendUrl}/api/clinics`, {
        params: { doctor_id: doctorId, active: 'true' },
      })
      setClinics(data.data || [])
    } catch {
      setClinics([])
    }
  }

  useEffect(() => {
    loadDoctors()
  }, [])

  useEffect(() => {
    if (token) load()
  }, [token, filterDoctor])

  const openEdit = (row) => {
    setEditing(row.user_id)
    setEditForm({
      name: row.name,
      phone: row.phone || '',
      doctor_id: row.doctor_id || '',
      clinic_id: row.clinic_id || '',
      is_active: row.is_active,
    })
    loadClinics(row.doctor_id)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await axios.patch(
        `${backendUrl}/api/assistants/${editing}`,
        {
          name: editForm.name,
          phone: editForm.phone,
          doctor_id: editForm.doctor_id || null,
          clinic_id: editForm.clinic_id || null,
          is_active: editForm.is_active,
        },
        { headers: authHeaders(token) }
      )
      if (data.success) {
        toast.success(data.message)
        setEditing(null)
        load()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  if (!token) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Sign in as admin or super_admin (Staff login) to manage assistants.
      </p>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Assistants"
        description="Create accounts and assign them to a doctor or clinic for payment verification scope."
      >
        <Button onClick={() => navigate('/add-assistant')}>
          <Plus className="mr-2 h-4 w-4" />
          Add assistant
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px]">
          <Label htmlFor="filter-doctor">Filter by doctor</Label>
          <select
            id="filter-doctor"
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
          >
            <option value="">All doctors</option>
            {doctors.map((d) => (
              <option key={d.id || d.user_id} value={d.id || d.user_id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : assistants.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No assistants"
          description="Add an assistant and link them to a doctor or clinic."
          actionLabel="Add assistant"
          onAction={() => navigate('/add-assistant')}
        />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {assistants.map((row) => (
              <div
                key={row.user_id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
              >
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-sm text-muted-foreground">{row.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.doctor_name ? `Dr. ${row.doctor_name}` : 'No doctor'}
                    {row.clinic_name ? ` · ${row.clinic_name}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={row.is_active ? 'default' : 'secondary'}>
                    {row.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {editing && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <form onSubmit={saveEdit} className="grid max-w-lg gap-4">
              <p className="font-medium">Edit assistant</p>
              <div>
                <Label>Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Doctor</Label>
                <select
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editForm.doctor_id}
                  onChange={(e) => {
                    const id = e.target.value
                    setEditForm({ ...editForm, doctor_id: id, clinic_id: '' })
                    loadClinics(id)
                  }}
                >
                  <option value="">— Select doctor —</option>
                  {doctors.map((d) => (
                    <option key={d.id || d.user_id} value={d.id || d.user_id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Clinic (optional)</Label>
                <select
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editForm.clinic_id}
                  onChange={(e) => setEditForm({ ...editForm, clinic_id: e.target.value })}
                >
                  <option value="">— Any clinic under doctor —</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                />
                Account active (can log in)
              </label>
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
