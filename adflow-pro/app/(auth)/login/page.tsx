'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const data = await res.json()
        router.push(searchParams.get('redirect') || '/dashboard/client')
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Login failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex' }}>
      {/* LEFT SIDE - Navy Background */}
      <div style={{ 
        width: '50%', 
        background: '#0F1B2D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center', color: 'white', maxWidth: '400px' }}>
          {/* Logo */}
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#F5A623',
            marginBottom: '16px'
          }}>
            AdFlow Pro
          </div>
          
          {/* Tagline */}
          <div style={{
            fontSize: '18px',
            marginBottom: '48px',
            opacity: 0.9
          }}>
            Pakistan's Most Trusted Marketplace
          </div>
          
          {/* Feature Bullets */}
          <div style={{ textAlign: 'left', marginBottom: '48px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#F5A623', marginRight: '12px', fontSize: '18px' }}>✓</span>
              <span>Verified Listings</span>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#F5A623', marginRight: '12px', fontSize: '18px' }}>✓</span>
              <span>Secure Payments</span>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#F5A623', marginRight: '12px', fontSize: '18px' }}>✓</span>
              <span>Fast Approval</span>
            </div>
          </div>
          
          {/* Stats */}
          <div style={{
            fontSize: '14px',
            opacity: 0.8,
            borderTop: '1px solid rgba(255,255,255,0.2)',
            paddingTop: '24px'
          }}>
            500+ Ads | 200+ Sellers | 5 Cities
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - White Background */}
      <div style={{ 
        width: '50%', 
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Welcome Heading */}
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#0F1B2D',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            Welcome Back
          </div>
          
          <div style={{
            fontSize: '16px',
            color: '#6B7280',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            Sign in to your account
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#FEE2E2',
              color: '#DC2626',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '12px 16px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#F5A623'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB'
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '12px 16px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#F5A623'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB'
                }}
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '48px',
                background: '#F5A623',
                color: '#0F1B2D',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                marginBottom: '16px'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#B8720A'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#F5A623'
                }
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Forgot Password */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Link href="/forgot-password" style={{
              color: '#F5A623',
              textDecoration: 'none',
              fontSize: '14px'
            }}>
              Forgot password?
            </Link>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }}></div>
            <span style={{ padding: '0 16px', color: '#6B7280', fontSize: '14px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }}></div>
          </div>

          {/* Register Link */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ color: '#6B7280', fontSize: '14px' }}>
              Don't have an account?{' '}
            </span>
            <Link href="/register" style={{
              color: '#F5A623',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Register
            </Link>
          </div>

          {/* Demo Accounts */}
          <div style={{
            background: '#FEF3DC',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#0F1B2D' }}>
              Demo Accounts:
            </div>
            <div style={{ marginBottom: '4px', color: '#6B7280' }}>
              Client: client@demo.com / password
            </div>
            <div style={{ marginBottom: '4px', color: '#6B7280' }}>
              Moderator: mod@demo.com / password
            </div>
            <div style={{ color: '#6B7280' }}>
              Admin: admin@demo.com / password
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
