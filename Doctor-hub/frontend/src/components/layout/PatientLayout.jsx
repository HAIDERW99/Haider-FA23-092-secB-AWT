import PatientNavbar from '@/components/layout/PatientNavbar'
import Footer from '@/components/Footer'

export default function PatientLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PatientNavbar />
      <main className="container flex-1 max-w-7xl px-4 py-8">{children}</main>
      <Footer />
    </div>
  )
}
