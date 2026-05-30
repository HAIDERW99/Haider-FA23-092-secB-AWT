import { useContext, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../context/AppContext'
import { authHeaders } from '@/lib/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { AppointmentStepper } from '@/components/shared/AppointmentStepper'
import { PaymentUploadZone } from '@/components/shared/PaymentUploadZone'
import { Button } from '@/components/ui/button'

export default function PaymentUpload() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const { backendUrl, token } = useContext(AppContext)
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      toast.warning('Please login first')
      return navigate('/login')
    }
    if (!file) {
      toast.warning('Please select a payment screenshot')
      return
    }

    const formData = new FormData()
    formData.append('appointment_id', appointmentId)
    formData.append('screenshot', file)

    setSubmitting(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/payments`, formData, {
        headers: {
          ...authHeaders(token),
          'Content-Type': 'multipart/form-data',
        },
      })
      if (data.success) {
        toast.success(data.message)
        navigate('/my-appointments')
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg">
      <PageHeader
        title="Upload payment proof"
        description="Step 4 — upload a screenshot of your payment. An assistant will verify it before your appointment is confirmed."
      />
      <div className="mb-8">
        <AppointmentStepper currentStep={4} />
      </div>
      <form onSubmit={onSubmit} className="space-y-6 rounded-lg border bg-card p-6">
        <PaymentUploadZone onFileSelect={setFile} />
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting ? 'Uploading…' : 'Submit payment proof'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/my-appointments')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
