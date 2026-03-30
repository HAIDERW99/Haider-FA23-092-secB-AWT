import Link from 'next/link'

export function Navbar() {
  return (
    <nav style={{ 
      background: '#0F1B2D', 
      height: '64px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0 32px', 
      position: 'sticky', 
      top: 0, 
      zIndex: 100 
    }}>
      {/* Logo */}
      <div>
        <Link href="/" style={{ color: '#F5A623', fontWeight: 'bold', textDecoration: 'none', fontSize: '20px' }}>
          AdFlow Pro
        </Link>
      </div>
      
      {/* Navigation Links */}
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <Link href="/explore" style={{ color: 'white', margin: '0 16px', textDecoration: 'none' }}>
          Explore
        </Link>
        <Link href="/packages" style={{ color: 'white', margin: '0 16px', textDecoration: 'none' }}>
          Packages
        </Link>
        <Link href="/categories" style={{ color: 'white', margin: '0 16px', textDecoration: 'none' }}>
          Categories
        </Link>
        <Link href="/cities" style={{ color: 'white', margin: '0 16px', textDecoration: 'none' }}>
          Cities
        </Link>
      </div>

      {/* Right Side Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <Link href="/login">
          <button style={{ 
            border: '1px solid white', 
            color: 'white', 
            padding: '8px 20px', 
            borderRadius: '20px',
            background: 'transparent',
            cursor: 'pointer'
          }}>
            Login
          </button>
        </Link>
        <Link href="/register">
          <button style={{ 
            background: '#F5A623', 
            color: '#0F1B2D', 
            padding: '8px 20px', 
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer'
          }}>
            Register
          </button>
        </Link>
      </div>
    </nav>
  )
}
