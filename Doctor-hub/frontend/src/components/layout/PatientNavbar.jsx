import { useContext } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Stethoscope } from 'lucide-react'
import { assets } from '@/assets/assets'
import { AppContext } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/symptom-checker', label: 'Symptom checker' },
  { to: '/doctors', label: 'Find doctors' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function PatientNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, setToken, userData } = useContext(AppContext)

  const logout = () => {
    localStorage.removeItem('token')
    setToken(false)
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    cn(
      'text-sm font-medium transition-colors hover:text-primary',
      isActive ? 'text-primary' : 'text-muted-foreground'
    )

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="hidden sm:inline">Doctor Hub</span>
          <img src={assets.logo} alt="" className="h-8 sm:hidden" />
        </button>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {location.pathname === '/' && (
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => window.open(import.meta.env.VITE_ADMIN_URL, '_blank')}
            >
              Staff login
            </Button>
          )}

          {token && userData ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userData.image} alt={userData.name} />
                    <AvatarFallback>{userData.name?.[0] || 'P'}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{userData.name}</p>
                  <p className="text-xs text-muted-foreground">{userData.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-profile')}>My profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-appointments')}>My appointments</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-history')}>Medical history</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/messages')}>Messages</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" className="hidden md:inline-flex" onClick={() => navigate('/login')}>
              Sign in
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} className={linkClass}>
                    {link.label}
                  </NavLink>
                ))}
                {!token && (
                  <Button className="mt-4" onClick={() => navigate('/login')}>
                    Sign in
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
