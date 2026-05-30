import { useContext } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  UserPlus,
  Users,
  User,
  Stethoscope,
  ShieldCheck,
  UserCog,
  MessageCircle,
  MessageSquare,
} from 'lucide-react'
import { AdminContext } from '@/context/AdminContext'
import { DoctorContext } from '@/context/DoctorContext'
import { StaffContext } from '@/context/StaffContext'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const linkClass = ({ isActive }) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
  )

export default function DashboardSidebar({ collapsed = false }) {
  const { aToken } = useContext(AdminContext)
  const { dToken } = useContext(DoctorContext)
  const { staffToken, staffRole } = useContext(StaffContext)

  return (
    <aside
      className={cn(
        'flex h-[calc(100vh-3.5rem)] flex-col border-r bg-card',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className={cn('flex items-center gap-2 p-4', collapsed && 'justify-center p-2')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Stethoscope className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-semibold leading-none">Doctor Hub</p>
            <p className="text-xs text-muted-foreground">Staff panel</p>
          </div>
        )}
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-3">
        {aToken && (
          <>
            <NavLink to="/admin-dashboard" className={linkClass} title="Dashboard">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!collapsed && 'Dashboard'}
            </NavLink>
            <NavLink to="/all-appointments" className={linkClass} title="Appointments">
              <Calendar className="h-4 w-4 shrink-0" />
              {!collapsed && 'Appointments'}
            </NavLink>
            <NavLink to="/add-doctor" className={linkClass} title="Add doctor">
              <UserPlus className="h-4 w-4 shrink-0" />
              {!collapsed && 'Add doctor'}
            </NavLink>
            <NavLink to="/doctor-list" className={linkClass} title="Doctors">
              <Users className="h-4 w-4 shrink-0" />
              {!collapsed && 'Doctors list'}
            </NavLink>
          </>
        )}
        {staffToken && staffRole === 'doctor' && (
          <>
            <NavLink to="/doctor-dashboard" className={linkClass} title="Dashboard">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!collapsed && 'Dashboard'}
            </NavLink>
            <NavLink to="/doctor-appointments" className={linkClass} title="Appointments">
              <Calendar className="h-4 w-4 shrink-0" />
              {!collapsed && 'Appointments'}
            </NavLink>
            <NavLink to="/doctor-profile" className={linkClass} title="Profile">
              <User className="h-4 w-4 shrink-0" />
              {!collapsed && 'Profile'}
            </NavLink>
            <NavLink to="/my-assistants" className={linkClass} title="Assistants">
              <UserCog className="h-4 w-4 shrink-0" />
              {!collapsed && 'Assistants'}
            </NavLink>
            <NavLink to="/messages" className={linkClass} title="Messages">
              <MessageCircle className="h-4 w-4 shrink-0" />
              {!collapsed && 'Messages'}
            </NavLink>
          </>
        )}
        {staffToken && ['admin', 'super_admin'].includes(staffRole) && (
          <>
            <NavLink to="/staff-dashboard" className={linkClass} title="Dashboard">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!collapsed && 'Dashboard'}
            </NavLink>
            <NavLink to="/payment-verifications" className={linkClass} title="Payments">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {!collapsed && 'Verify payments'}
            </NavLink>
            <NavLink to="/whatsapp" className={linkClass} title="WhatsApp">
              <MessageSquare className="h-4 w-4 shrink-0" />
              {!collapsed && 'WhatsApp'}
            </NavLink>
            <NavLink to="/assistants" className={linkClass} title="Assistants">
              <UserCog className="h-4 w-4 shrink-0" />
              {!collapsed && 'Assistants'}
            </NavLink>
          </>
        )}
        {staffToken && staffRole === 'assistant' && (
          <>
            <NavLink to="/staff-dashboard" className={linkClass} title="Dashboard">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!collapsed && 'Dashboard'}
            </NavLink>
            <NavLink to="/payment-verifications" className={linkClass} title="Payments">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {!collapsed && 'Verify payments'}
            </NavLink>
            <NavLink to="/whatsapp" className={linkClass} title="WhatsApp">
              <MessageSquare className="h-4 w-4 shrink-0" />
              {!collapsed && 'WhatsApp'}
            </NavLink>
          </>
        )}
        {dToken && (
          <>
            <NavLink to="/doctor-dashboard" className={linkClass} title="Dashboard">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!collapsed && 'Dashboard'}
            </NavLink>
            <NavLink to="/doctor-appointments" className={linkClass} title="Appointments">
              <Calendar className="h-4 w-4 shrink-0" />
              {!collapsed && 'Appointments'}
            </NavLink>
            <NavLink to="/doctor-profile" className={linkClass} title="Profile">
              <User className="h-4 w-4 shrink-0" />
              {!collapsed && 'Profile'}
            </NavLink>
            <NavLink to="/my-assistants" className={linkClass} title="Assistants">
              <UserCog className="h-4 w-4 shrink-0" />
              {!collapsed && 'Assistants'}
            </NavLink>
            <NavLink to="/messages" className={linkClass} title="Messages">
              <MessageCircle className="h-4 w-4 shrink-0" />
              {!collapsed && 'Messages'}
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  )
}
