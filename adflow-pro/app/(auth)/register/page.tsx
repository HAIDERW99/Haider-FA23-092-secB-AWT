'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        // Store session info (in a real app, you'd use proper session management)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        localStorage.setItem('session', JSON.stringify(data.data.session))
        router.push('/dashboard/client')
      } else {
        setError(data.error || 'Registration failed')
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
            Join AdFlow Pro
          </div>
          
          {/* Tagline */}
          <div style={{
            fontSize: '18px',
            marginBottom: '48px',
            opacity: 0.9
          }}>
            Start selling in minutes
          </div>
          
          {/* Steps List */}
          <div style={{ textAlign: 'left', marginBottom: '48px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: '#F5A623',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: '16px',
                flexShrink: 0
              }}>
                1
              </div>
              <span>Create your account</span>
            </div>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: '#F5A623',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: '16px',
                flexShrink: 0
              }}>
                2
              </div>
              <span>Post your first ad</span>
            </div>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: '#F5A623',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: '16px',
                flexShrink: 0
              }}>
                3
              </div>
              <span>Get verified buyers</span>
            </div>
          </div>
          
          {/* Stats */}
          <div style={{
            fontSize: '14px',
            opacity: 0.8,
            borderTop: '1px solid rgba(255,255,255,0.2)',
            paddingTop: '24px'
          }}>
            Join 200+ successful sellers
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
          {/* Create Account Heading */}
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#0F1B2D',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            Create Account
          </div>
          
          <div style={{
            fontSize: '16px',
            color: '#6B7280',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            Join thousands of sellers
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

          {/* Register Form */}
          <form onSubmit={handleSubmit}>
            {/* Full Name Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
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
            <div style={{ marginBottom: '20px' }}>
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
                placeholder="Create a password"
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

            {/* Account Type Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Account Type
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '12px 16px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: 'white',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#F5A623'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB'
                }}
              >
                <option value="client">Client</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Create Account Button */}
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
                marginBottom: '24px'
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

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

          {/* Sign In Link */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ color: '#6B7280', fontSize: '14px' }}>
              Already have an account?{' '}
            </span>
            <Link href="/login" style={{
              color: '#F5A623',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Sign In
            </Link>
          </div>

          {/* Terms */}
          <div style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#6B7280',
            lineHeight: '1.5'
          }}>
            By registering you agree to our{' '}
            <Link href="/terms" style={{ color: '#F5A623', textDecoration: 'none' }}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
