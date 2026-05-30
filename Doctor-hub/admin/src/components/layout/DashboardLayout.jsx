import { useState } from 'react'
import { Menu } from 'lucide-react'
import DashboardHeader from '@/components/layout/DashboardHeader'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader />
      <div className="flex">
        <div className="hidden lg:block">
          <DashboardSidebar />
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="fixed bottom-4 right-4 z-50 lg:hidden shadow-lg">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <DashboardSidebar />
          </SheetContent>
        </Sheet>

        <main className="min-h-[calc(100vh-3.5rem)] flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
