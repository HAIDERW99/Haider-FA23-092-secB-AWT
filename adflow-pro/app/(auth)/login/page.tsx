'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
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

      const data = await res.json()

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.data.user))
        localStorage.setItem('session', JSON.stringify(data.data.session))
        
        const redirect = searchParams.get('redirect') || '/dashboard/client'
        router.push(redirect)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Navbar />
      
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Left Side - Navy Background */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F1B2D] via-[#1A2E4A] to-[#253447] items-center justify-center p-12">
          <div className="text-center text-white max-w-md">
            <h1 className="text-4xl font-bold mb-4">
              Welcome Back
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Sign in to your AdFlow Pro account
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3a1 1 0 01-1-1v-4a1 1 0 011-1h5.586l4.707 4.707a1 1 0 001.414 0l4.707-4.707A1 1 0 0017 8v4a1 1 0 01-1 1H9a7 7 0 01-7-7z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Secure Login</h3>
                  <p className="text-white/80">Your account information is safe with us</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100 2H9z"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100 4h-.5a1 1 0 000-2H8a2 2 0 012-2h2A2 2 0 012 2v9A2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Quick Access</h3>
                  <p className="text-white/80">Get back to your dashboard instantly</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 001.732 3L13.732 15H8.268l4.866-4.5A1 1 0 0013 10V3a1 1 0 00-1-1H8a1 1 0 00-1 1v7a1 1 0 00.867.5z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">24/7 Support</h3>
                  <p className="text-white/80">We're here to help anytime</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - White Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md border-0 shadow-xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-[#0F1B2D] mb-2">
                Sign In
              </CardTitle>
              <p className="text-[#6B7280]">
                Don't have an account?{' '}
                <Link href="/register" className="text-[#F5A623] hover:text-[#B8720A] font-medium">
                  Create one here
                </Link>
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#0F1B2D] mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                    className="h-12 rounded-lg border-2 border-gray-300 focus:border-[#F5A623] focus:ring-0 text-base px-4"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[#0F1B2D] mb-2">
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    className="h-12 rounded-lg border-2 border-gray-300 focus:border-[#F5A623] focus:ring-0 text-base px-4"
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-[#F5A623] hover:bg-[#B8720A] text-white rounded-full text-base font-medium"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
              
              <div className="text-center">
                <Link href="/forgot-password" className="text-[#F5A623] hover:text-[#B8720A] text-sm">
                  Forgot your password?
                </Link>
              </div>
              
              {/* Demo Accounts */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-[#0F1B2D] mb-4">Demo Accounts:</h3>
                <div className="space-y-3 text-xs">
                  <div className="bg-[#FEF3DC] p-3 rounded-lg border border-[#F5A623]">
                    <div className="font-semibold text-[#0F1B2D]">Admin:</div>
                    <div className="text-[#6B7280]">admin@example.com</div>
                  </div>
                  <div className="bg-[#FEF3DC] p-3 rounded-lg border border-[#F5A623]">
                    <div className="font-semibold text-[#0F1B2D]">Moderator:</div>
                    <div className="text-[#6B7280]">moderator@example.com</div>
                  </div>
                  <div className="bg-[#FEF3DC] p-3 rounded-lg border border-[#F5A623]">
                    <div className="font-semibold text-[#0F1B2D]">Client:</div>
                    <div className="text-[#6B7280]">john@example.com</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}
