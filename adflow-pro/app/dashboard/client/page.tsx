'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/sidebar'
import { StatsCard } from '@/components/dashboard/stats-card'
import { AdTable } from '@/components/dashboard/ad-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Ad {
  id: string
  title: string
  slug: string
  status: string
  created_at: string
  expire_at: string | null
  categories: {
    name: string
  }
  packages: {
    name: string
    price: number
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function ClientDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [ads, setAds] = useState<Ad[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    expired: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    
    fetchAds()
  }, [])

  const fetchAds = async () => {
    try {
      const res = await fetch('/api/client/ads')
      if (res.ok) {
        const data = await res.json()
        setAds(data.data || [])
        
        const adsData = data.data || []
        setStats({
          total: adsData.length,
          active: adsData.filter((ad: Ad) => ad.status === 'published').length,
          pending: adsData.filter((ad: Ad) => ['submitted', 'under_review', 'payment_pending', 'payment_submitted'].includes(ad.status)).length,
          expired: adsData.filter((ad: Ad) => ad.status === 'expired').length
        })
      }
    } catch (error) {
      console.error('Error fetching ads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditAd = (id: string) => {
    window.location.href = `/dashboard/client/ads/${id}/edit`
  }

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return
    
    try {
      const res = await fetch(`/api/client/ads/${id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        fetchAds()
      }
    } catch (error) {
      console.error('Error deleting ad:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'under_review': return 'bg-orange-100 text-orange-800'
      case 'payment_pending': return 'bg-yellow-100 text-yellow-800'
      case 'payment_submitted': return 'bg-purple-100 text-purple-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-slate-100 text-slate-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <div className="flex">
          <Sidebar user={{ id: '', name: '', email: '', role: 'client' }} />
          <div className="flex-1 p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#0F1B2D] mb-4">Please Login</h1>
              <Link href="/login">
                <Button className="bg-[#F5A623] hover:bg-[#B8720A] text-white rounded-full">
                  Go to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="flex">
        <Sidebar user={user} />
        
        <div className="flex-1">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-[#0F1B2D]">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-[#6B7280] mt-1">Manage your ads and track their performance</p>
              </div>
              
              <Link href="/dashboard/client/ads/new">
                <Button className="bg-[#F5A623] hover:bg-[#B8720A] text-white rounded-full">
                  Create New Ad
                </Button>
              </Link>
            </div>
          </div>

          <div className="p-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Ads"
                value={stats.total}
                description="All your advertisements"
                trend={{ value: 8, isPositive: true }}
              />
              <StatsCard
                title="Active"
                value={stats.active}
                description="Currently published"
                trend={{ value: 12, isPositive: true }}
              />
              <StatsCard
                title="Pending"
                value={stats.pending}
                description="Awaiting approval/payment"
              />
              <StatsCard
                title="Expired"
                value={stats.expired}
                description="No longer active"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-[#0F1B2D] mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/explore">
                    <Button variant="outline" className="w-full justify-start rounded-full border-gray-300 hover:border-[#0F1B2D]">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.893 3.476l4.817 4.817a1 1 0 001.414-1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                      </svg>
                      Browse Ads
                    </Button>
                  </Link>
                  <Link href="/packages">
                    <Button variant="outline" className="w-full justify-start rounded-full border-gray-300 hover:border-[#0F1B2D]">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100 2H9z"/>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2A2 2 0 100 4h-.5a1 1 0 000-2H8a2 2 0 012-2h2A2 2 0 012 2v9A2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd"/>
                      </svg>
                      View Packages
                    </Button>
                  </Link>
                  <Link href="/dashboard/client/ads/new">
                    <Button className="w-full justify-start bg-[#F5A623] hover:bg-[#B8720A] text-white rounded-full">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1h1a1 1 0 011 1v1a1 1 0 011 1h1a1 1 0 011 1v1a1 1 0 011 1h1A1 1 0 011 1v1A1 1 0 01-1 1H11a1 1 0 01-1 1V6a1 1 0 01-1-1H11a1 1 0 01-1 1V4a1 1 0 01-1-1z" clipRule="evenodd"/>
                      </svg>
                      Create New Ad
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-[#0F1B2D] mb-4">Account Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Name:</span>
                    <span className="font-medium text-[#0F1B2D]">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Email:</span>
                    <span className="font-medium text-[#0F1B2D]">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Role:</span>
                    <Badge className="bg-[#F5A623] text-white">{user.role}</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-[#0F1B2D] mb-4">Tips</h3>
                <ul className="text-sm text-[#6B7280] space-y-2">
                  <li className="flex items-start">
                    <span className="text-[#F5A623] mr-2">•</span>
                    Use high-quality images for better engagement
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#F5A623] mr-2">•</span>
                    Write detailed descriptions (min 50 chars)
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#F5A623] mr-2">•</span>
                    Choose appropriate categories for visibility
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#F5A623] mr-2">•</span>
                    Premium packages get more views
                  </li>
                </ul>
              </div>
            </div>

            {/* Recent Ads */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-[#0F1B2D]">Your Recent Ads</h2>
                  <Link href="/dashboard/client/ads">
                    <Button variant="outline" className="rounded-full border-gray-300 hover:border-[#0F1B2D]">
                      View All
                    </Button>
                  </Link>
                </div>
              </div>
              
              {loading ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <AdTable
                    ads={ads.slice(0, 5)}
                    onEdit={handleEditAd}
                    onDelete={handleDeleteAd}
                    showActions={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
