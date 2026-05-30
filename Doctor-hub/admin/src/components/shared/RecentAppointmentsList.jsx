import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function patientName(item) {
  return item.user_data?.name || item.patient_snapshot?.name || 'Patient'
}

function patientImage(item) {
  return item.user_data?.image || item.patient_snapshot?.image
}

function doctorName(item) {
  return item.doc_data?.name || item.doctor_snapshot?.name || 'Doctor'
}

function doctorImage(item) {
  return item.doc_data?.image || item.doctor_snapshot?.image
}

export function RecentAppointmentsList({
  items = [],
  slotDateFormat,
  view = 'patient',
  recordsLink,
  onCancel,
  onComplete,
  cancelIcon,
  tickIcon,
}) {
  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No appointments yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent appointments</CardTitle>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {items.map((item) => {
          const pid = item.patient_id
          const showActions =
            onCancel &&
            onComplete &&
            !item.cancelled &&
            item.status !== 'cancelled' &&
            !item.isCompleted &&
            item.status !== 'completed'

          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <img
                className="h-10 w-10 rounded-full object-cover"
                src={view === 'doctor' ? patientImage(item) : doctorImage(item)}
                alt=""
              />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">
                  {view === 'doctor' ? patientName(item) : doctorName(item)}
                </p>
                <p className="text-muted-foreground">
                  {slotDateFormat(item.slot_date)} · {item.slot_time}
                </p>
              </div>
              {item.status ? (
                <StatusBadge status={item.status} />
              ) : item.cancelled ? (
                <span className="text-xs text-red-500">Cancelled</span>
              ) : item.isCompleted ? (
                <span className="text-xs text-green-600">Completed</span>
              ) : null}
              {recordsLink && pid && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`${recordsLink}?patient_id=${pid}`}>Records</Link>
                </Button>
              )}
              {showActions && (
                <div className="flex shrink-0">
                  <button type="button" onClick={() => onCancel(item.id)} className="p-1">
                    <img className="w-9" src={cancelIcon} alt="Cancel" />
                  </button>
                  <button type="button" onClick={() => onComplete(item.id)} className="p-1">
                    <img className="w-9" src={tickIcon} alt="Complete" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
