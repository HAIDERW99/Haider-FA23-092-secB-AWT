import { useContext, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { AppContext } from '../context/AppContext'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const TREATMENT_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'allopathic', label: 'Allopathic' },
  { value: 'homeopathic', label: 'Homeopathic' },
  { value: 'herbal', label: 'Herbal' },
]

const treatmentLabel = (t) =>
  ({ allopathic: 'Allopathic', homeopathic: 'Homeopathic', herbal: 'Herbal' }[t] || t)

export default function Doctors() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { doctors, getDoctorsData, currencySymbol } = useContext(AppContext)

  const [disease, setDisease] = useState(searchParams.get('disease') || '')
  const [treatmentType, setTreatmentType] = useState(searchParams.get('treatment_type') || '')
  const [loading, setLoading] = useState(true)

  const loadDoctors = async (overrides = {}) => {
    setLoading(true)
    await getDoctorsData({
      disease: overrides.disease ?? disease,
      treatment_type: overrides.treatment_type ?? treatmentType,
    })
    setLoading(false)
  }

  useEffect(() => {
    loadDoctors({
      disease: searchParams.get('disease') || '',
      treatment_type: searchParams.get('treatment_type') || '',
    })
  }, [])

  const onSearch = (e) => {
    e.preventDefault()
    loadDoctors()
  }

  return (
    <div>
      <PageHeader
        title="Find doctors"
        description="Search by disease and filter by treatment type: Allopathic, Homeopathic, or Herbal."
      />

      <form onSubmit={onSearch} className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label htmlFor="disease" className="text-sm font-medium text-muted-foreground">
            Disease or condition
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="disease"
              placeholder="e.g. Diabetes, Skin Allergy"
              className="pl-9"
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
            />
          </div>
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        {TREATMENT_OPTIONS.map((opt) => (
          <Button
            key={opt.value || 'all'}
            type="button"
            size="sm"
            variant={treatmentType === opt.value ? 'default' : 'outline'}
            onClick={() => {
              setTreatmentType(opt.value)
              loadDoctors({ treatment_type: opt.value })
            }}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-auto gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <EmptyState
          title="No doctors found"
          description="Try another disease name or treatment type."
          actionLabel="Clear filters"
          onAction={() => {
            setDisease('')
            setTreatmentType('')
            loadDoctors({ disease: '', treatment_type: '' })
          }}
        />
      ) : (
        <div className="grid grid-cols-auto gap-4 gap-y-6">
          {doctors.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                navigate(`/appointment/${item.id}`)
                scrollTo(0, 0)
              }}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/appointment/${item.id}`)}
              className="cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <img
                className="h-48 w-full bg-muted object-cover"
                src={item.image || '/placeholder-doctor.png'}
                alt={item.name}
              />
              <div className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{treatmentLabel(item.treatment)}</Badge>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      item.available ? 'text-green-600' : 'text-muted-foreground'
                    )}
                  >
                    {item.available ? 'Available' : 'Not available'}
                  </span>
                </div>
                <p className="text-lg font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.speciality}</p>
                {(item.diseases || []).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Treats: {(item.diseases || []).slice(0, 3).join(', ')}
                    {(item.diseases || []).length > 3 ? '…' : ''}
                  </p>
                )}
                <p className="text-sm font-medium text-primary">
                  Fee: {currencySymbol}
                  {item.fees}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
