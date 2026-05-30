import { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { StaffContext } from '@/context/StaffContext'
import { authHeaders } from '@/lib/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const backendUrl = import.meta.env.VITE_BACKEND_URL

export default function AddAssistant() {
  const { staffToken, staffRole } = useContext(StaffContext)
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [clinics, setClinics] = useState([])
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    doctor_id: '',
    clinic_id: '',
  })

  const canManage = staffToken && ['admin', 'super_admin'].includes(staffRole)

  useEffect(() => {
    axios.get(`${backendUrl}/api/doctors`).then(({ data }) => {
      if (data.success) setDoctors(data.data || [])
    })
  }, [])

  useEffect(() => {
    if (!form.doctor_id) {
      setClinics([])
      return
    }
    axios
      .get(`${backendUrl}/api/clinics`, { params: { doctor_id: form.doctor_id, active: 'true' } })
      .then(({ data }) => setClinics(data.data || []))
      .catch(() => setClinics([]))
  }, [form.doctor_id])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.doctor_id && !form.clinic_id) {
      toast.error('Select a doctor or clinic for assignment')
      return
    }
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/assistants`,
        {
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          doctor_id: form.doctor_id || undefined,
          clinic_id: form.clinic_id || undefined,
        },
        { headers: authHeaders(staffToken) }
      )
      if (data.success) {
        toast.success(data.message)
        navigate('/assistants')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  if (!canManage) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Only admin or super_admin can create assistants.
      </p>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Add assistant"
        description="Assistants verify payments for appointments under their assigned doctor or clinic."
      />

      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="grid gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Password (min 8 characters)</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Assigned doctor</Label>
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.doctor_id}
                onChange={(e) =>
                  setForm({ ...form, doctor_id: e.target.value, clinic_id: '' })
                }
              >
                <option value="">— Select doctor —</option>
                {doctors.map((d) => (
                  <option key={d.id || d.user_id} value={d.id || d.user_id}>
                    {d.name} · {d.speciality}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Clinic (optional, narrows scope)</Label>
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.clinic_id}
                onChange={(e) => setForm({ ...form, clinic_id: e.target.value })}
                disabled={!form.doctor_id && clinics.length === 0}
              >
                <option value="">— Doctor-wide —</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              At least one of doctor or clinic is required. Clinic must belong to the selected
              doctor.
            </p>
            <div className="flex gap-2">
              <Button type="submit">Create assistant</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/assistants')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
