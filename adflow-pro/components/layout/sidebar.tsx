import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const getNavItems = () => {
    const baseItems = [
      {
        href: '/dashboard/client',
        label: 'My Ads',
        roles: ['client', 'moderator', 'admin', 'super_admin']
      },
      {
        href: '/dashboard/client/ads/new',
        label: 'Create Ad',
        roles: ['client', 'moderator', 'admin', 'super_admin']
      }
    ]

    if (user.role === 'moderator' || user.role === 'admin' || user.role === 'super_admin') {
      baseItems.push({
        href: '/dashboard/moderator',
        label: 'Review Queue',
        roles: ['moderator', 'admin', 'super_admin']
      })
    }

    if (user.role === 'admin' || user.role === 'super_admin') {
      baseItems.push(
        {
          href: '/dashboard/admin',
          label: 'Payment Queue',
          roles: ['admin', 'super_admin']
        },
        {
          href: '/dashboard/admin/publish',
          label: 'Publish Ads',
          roles: ['admin', 'super_admin']
        },
        {
          href: '/dashboard/admin/analytics',
          label: 'Analytics',
          roles: ['admin', 'super_admin']
        }
      )
    }

    return baseItems
  }

  const navItems = getNavItems()

  return (
    <div className="w-64 bg-gray-50 min-h-screen border-r">
      <div className="p-6">
        <Link href="/" className="text-xl font-bold text-blue-600">
          AdFlow Pro
        </Link>
      </div>
      
      <nav className="px-4 pb-6">
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
        
        <div className="mt-8 pt-6 border-t">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            <p className="text-xs text-gray-500 mt-1">Role: {user.role}</p>
          </div>
        </div>
      </nav>
    </div>
  )
}
