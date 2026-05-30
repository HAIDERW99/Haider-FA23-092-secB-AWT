import { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { DoctorContext } from '@/context/DoctorContext'
import { StaffContext } from '@/context/StaffContext'
import { authHeaders } from '@/lib/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { UserCog } from 'lucide-react'

const backendUrl = import.meta.env.VITE_BACKEND_URL

export default function MyAssistants() {
  const { dToken } = useContext(DoctorContext)
  const { staffToken, staffRole } = useContext(StaffContext)
  const token =
    staffRole === 'doctor' && staffToken ? staffToken : dToken
  const [assistants, setAssistants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    const load = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/assistants`, {
          headers: authHeaders(token),
        })
        setAssistants(data.data || [])
      } catch (err) {
        toast.error(err.response?.data?.message || err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="My assistants"
        description="Staff assigned to help verify payments and manage bookings for your practice."
      />

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : assistants.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No assistants assigned"
          description="Ask your clinic admin to assign an assistant to your account."
        />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {assistants.map((row) => (
              <div key={row.user_id} className="px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-sm text-muted-foreground">{row.email}</p>
                    {row.phone && (
                      <p className="text-xs text-muted-foreground">{row.phone}</p>
                    )}
                  </div>
                  <Badge variant={row.is_active ? 'default' : 'secondary'}>
                    {row.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                {row.clinic_name && (
                  <p className="mt-2 text-xs text-muted-foreground">Clinic: {row.clinic_name}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
