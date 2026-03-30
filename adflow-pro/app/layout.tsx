import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AdFlow Pro - Sponsored Listing Marketplace',
  description: 'Your trusted marketplace for sponsored listings. Connect with customers and grow your business.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
