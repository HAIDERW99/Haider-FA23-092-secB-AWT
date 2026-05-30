import { Link } from 'react-router-dom'

const TREATMENTS = [
  { label: 'Allopathic', value: 'allopathic', desc: 'Modern medicine' },
  { label: 'Homeopathic', value: 'homeopathic', desc: 'Homeopathy care' },
  { label: 'Herbal', value: 'herbal', desc: 'Herbal remedies' },
]

export default function SpecialityMenu() {
  return (
    <div id="speciality" className="flex flex-col items-center gap-4 py-16 text-foreground">
      <h1 className="text-3xl font-medium">Find by treatment type</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        Browse doctors by Allopathic, Homeopathic, or Herbal approach — or use the{' '}
        <Link to="/symptom-checker" className="font-medium text-primary underline">
          AI symptom checker
        </Link>{' '}
        first.
      </p>
      <div className="flex w-full flex-wrap justify-center gap-4 pt-5">
        {TREATMENTS.map((item) => (
          <Link
            key={item.value}
            to={`/doctors?treatment_type=${item.value}`}
            onClick={() => scrollTo(0, 0)}
            className="flex min-w-[140px] flex-col items-center rounded-xl border bg-card px-6 py-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <p className="font-semibold">{item.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
