import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, LogOut, Stethoscope } from 'lucide-react'
import { AdminContext } from '@/context/AdminContext'
import { DoctorContext } from '@/context/DoctorContext'
import { StaffContext } from '@/context/StaffContext'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function DashboardHeader({ title = 'Doctor Hub' }) {
  const navigate = useNavigate()
  const { aToken, setAToken } = useContext(AdminContext)
  const { dToken, setDToken } = useContext(DoctorContext)
  const { staffToken, logoutStaff, staffRole } = useContext(StaffContext)

  const logout = () => {
    navigate('/')
    if (dToken) {
      setDToken('')
      localStorage.removeItem('dToken')
    }
    if (aToken) {
      setAToken('')
      localStorage.removeItem('aToken')
    }
    if (staffToken) logoutStaff()
  }

  const roleLabel = aToken
    ? 'Administrator'
    : staffToken
      ? staffRole
      : dToken
        ? 'Doctor'
        : 'Staff'

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-2 font-semibold lg:hidden">
        <Stethoscope className="h-5 w-5 text-primary" />
        <span className="text-sm">{title}</span>
      </div>
      <div className="hidden flex-1 lg:block">
        <p className="text-xs text-muted-foreground">Staff dashboard</p>
        <p className="text-sm font-medium">{roleLabel}</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => {
            window.location.href = import.meta.env.VITE_FRONTEND_URL || '/'
          }}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Patient site
        </Button>
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  )
}
