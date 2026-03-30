import Link from 'next/link'

export function Footer() {
  return (
    <footer style={{ background: '#0F1B2D', color: 'white' }}>
      {/* Top Section */}
      <div style={{ padding: '48px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
          {/* Column 1: Logo + Tagline + Social */}
          <div>
            <h3 style={{ color: '#F5A623', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
              AdFlow Pro
            </h3>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '16px' }}>
              Pakistan's most trusted marketplace
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <a href="#" style={{ color: '#9CA3AF', textDecoration: 'none' }}>FB</a>
              <a href="#" style={{ color: '#9CA3AF', textDecoration: 'none' }}>TW</a>
              <a href="#" style={{ color: '#9CA3AF', textDecoration: 'none' }}>IG</a>
              <a href="#" style={{ color: '#9CA3AF', textDecoration: 'none' }}>LI</a>
            </div>
          </div>

          {/* Column 2: Explore */}
          <div>
            <h4 style={{ color: '#F5A623', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Explore
            </h4>
            <Link href="/explore" style={{ color: '#9CA3AF', display: 'block', margin: '8px 0', textDecoration: 'none' }}>
              Browse Ads
            </Link>
            <Link href="/categories" style={{ color: '#9CA3AF', display: 'block', margin: '8px 0', textDecoration: 'none' }}>
              Categories
            </Link>
            <Link href="/cities" style={{ color: '#9CA3AF', display: 'block', margin: '8px 0', textDecoration: 'none' }}>
              Cities
            </Link>
            <Link href="/packages" style={{ color: '#9CA3AF', display: 'block', margin: '8px 0', textDecoration: 'none' }}>
              Packages
            </Link>
          </div>

          {/* Column 3: Support */}
          <div>
            <h4 style={{ color: '#F5A623', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Support
            </h4>
            <Link href="/help" style={{ color: '#9CA3AF', display: 'block', margin: '8px 0', textDecoration: 'none' }}>
              Help Center
            </Link>
            <Link href="/faq" style={{ color: '#9CA3AF', display: 'block', margin: '8px 0', textDecoration: 'none' }}>
              FAQ
            </Link>
            <Link href="/contact" style={{ color: '#9CA3AF', display: 'block', margin: '8px 0', textDecoration: 'none' }}>
              Contact
            </Link>
            <Link href="/terms" style={{ color: '#9CA3AF', display: 'block', margin: '8px 0', textDecoration: 'none' }}>
              Terms
            </Link>
          </div>

          {/* Column 4: Company */}
          <div>
            <h4 style={{ color: '#F5A623', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Company
            </h4>
            <Link href="/about" style={{ color: '#9CA3AF', display: 'block', margin: '8px 0', textDecoration: 'none' }}>
              About
            </Link>
            <Link href="/blog" style={{ color: '#9CA3AF', display: 'block', margin: '8px 0', textDecoration: 'none' }}>
              Blog
            </Link>
            <Link href="/careers" style={{ color: '#9CA3AF', display: 'block', margin: '8px 0', textDecoration: 'none' }}>
              Careers
            </Link>
            <Link href="/privacy" style={{ color: '#9CA3AF', display: 'block', margin: '8px 0', textDecoration: 'none' }}>
              Privacy
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ 
        background: '#0A1628', 
        padding: '16px 32px', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ color: 'white', fontSize: '14px' }}>
          &copy; 2025 AdFlow Pro
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/privacy" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>
            Privacy Policy
          </Link>
          <span style={{ color: '#6B7280' }}>·</span>
          <Link href="/terms" style={{ color: 'white', textDecoration: 'none', fontSize: '14px' }}>
            Terms of Service
          </Link>
        </div>
        
        <div style={{ color: 'white', fontSize: '14px' }}>
          Made with love in Pakistan
        </div>
      </div>
    </footer>
  )
}
