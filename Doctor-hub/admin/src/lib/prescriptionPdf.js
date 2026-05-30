import axios from 'axios'
import { authHeaders } from '@/lib/api'

export async function downloadPrescriptionPdf({ prescriptionId, token, backendUrl }) {
  const response = await axios.get(`${backendUrl}/api/prescriptions/${prescriptionId}/pdf`, {
    headers: authHeaders(token),
    responseType: 'blob',
  })

  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `doctorhub-prescription-${prescriptionId.slice(0, 8)}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
