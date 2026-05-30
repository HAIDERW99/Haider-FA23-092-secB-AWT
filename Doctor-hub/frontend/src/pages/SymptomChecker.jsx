import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Sparkles, Stethoscope } from 'lucide-react'
import { AppContext } from '@/context/AppContext'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const treatmentLabel = (t) =>
  ({ allopathic: 'Allopathic', homeopathic: 'Homeopathic', herbal: 'Herbal' }[t] || t)

export default function SymptomChecker() {
  const { backendUrl } = useContext(AppContext)
  const navigate = useNavigate()
  const [symptoms, setSymptoms] = useState('')
  const [age, setAge] = useState('')
  const [durationDays, setDurationDays] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const { data } = await axios.post(`${backendUrl}/api/ai/predict`, {
        symptoms,
        age: age ? Number(age) : undefined,
        duration_days: durationDays ? Number(durationDays) : undefined,
      })
      if (data.success) {
        setResult(data.data)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  const findDoctors = (disease, treatmentType) => {
    const params = new URLSearchParams()
    if (disease && disease !== 'General consultation') params.set('disease', disease)
    if (treatmentType) params.set('treatment_type', treatmentType)
    navigate(`/doctors?${params.toString()}`)
  }

  return (
    <div className="container max-w-3xl py-8">
      <PageHeader
        title="AI symptom checker"
        description="Describe how you feel — we suggest possible conditions and doctors on Doctor Hub. Not a replacement for professional diagnosis."
      />

      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="grid gap-4">
            <div>
              <Label htmlFor="symptoms">Symptoms</Label>
              <textarea
                id="symptoms"
                className="mt-1 flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g. frequent thirst, tiredness, and headaches for 2 weeks"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required
                minLength={3}
                maxLength={2000}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="age">Age (optional)</Label>
                <input
                  id="age"
                  type="number"
                  min={1}
                  max={120}
                  className="mt-1 flex h-10 w-full rounded-md border border-input px-3 text-sm"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration in days (optional)</Label>
                <input
                  id="duration"
                  type="number"
                  min={0}
                  className="mt-1 flex h-10 w-full rounded-md border border-input px-3 text-sm"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? 'Analyzing…' : 'Get suggestions'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {result.disclaimer}
          </p>
          <p className="text-xs text-muted-foreground">
            Engine: {result.mode === 'external' ? 'AI model + platform doctors' : 'Rule-based + platform doctors'}
          </p>
          {result.predictions.map((p, i) => (
            <Card key={`${p.disease}-${i}`}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg">{p.disease}</CardTitle>
                  <Badge variant="secondary">
                    {Math.round(p.confidence * 100)}% match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{p.rationale}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge>{treatmentLabel(p.treatment_type)}</Badge>
                  {p.doctors_available && (
                    <Badge variant="outline" className="text-primary">
                      Doctors available on Doctor Hub
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => findDoctors(p.disease, p.treatment_type)}
                >
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Find matching doctors
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
