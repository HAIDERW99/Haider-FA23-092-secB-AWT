'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { AdCard } from '@/components/ads/ad-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Ad {
  id: string
  title: string
  slug: string
  description: string
  status: string
  expire_at: string | null
  created_at: string
  categories: {
    id: string
    name: string
    slug: string
  }
  cities: {
    id: string
    name: string
    slug: string
  }
  packages: {
    id: string
    name: string
    is_featured: boolean
    price: number
  }
  users: {
    id: string
    name: string
    email: string
  }
  seller_profiles?: {
    display_name: string
    business_name: string
    phone: string
    city: string
    is_verified: boolean
  }
  ad_media: Array<{
    id: string
    source_type: string
    original_url: string
    thumbnail_url: string
    validation_status: string
  }>
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function ExplorePage() {
  const searchParams = useSearchParams()
  const [ads, setAds] = useState<Ad[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    sort: searchParams.get('sort') || 'rank'
  })

  useEffect(() => {
    fetchCategories()
    fetchCities()
  }, [])

  useEffect(() => {
    fetchAds()
  }, [filters])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchCities = async () => {
    try {
      const res = await fetch('/api/cities')
      if (res.ok) {
        const data = await res.json()
        setCities(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching cities:', error)
    }
  }

  const fetchAds = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...filters,
        page: '1',
        limit: '12'
      })
      
      const res = await fetch(`/api/ads?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAds(data.data || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching ads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      city: '',
      sort: 'rank'
    })
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search ads..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="h-12 rounded-lg border-2 border-gray-300 focus:border-[#F5A623] focus:ring-0 text-lg"
              />
            </div>
            
            <div className="flex gap-2">
              <Select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="h-12 rounded-lg border-2 border-gray-300 focus:border-[#F5A623] focus:ring-0"
              >
                <option value="rank">Best Match</option>
                <option value="newest">Newest First</option>
                <option value="price_low">Price Low-High</option>
                <option value="price_high">Price High-Low</option>
              </Select>
              
              <Link href="/register">
                <Button className="bg-[#F5A623] hover:bg-[#B8720A] text-white h-12 px-6">
                  Post Ad
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F1B2D] mb-2">Category</label>
              <Select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="rounded-lg border-gray-300 focus:border-[#F5A623] focus:ring-0"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#0F1B2D] mb-2">City</label>
              <Select
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="rounded-lg border-gray-300 focus:border-[#F5A623] focus:ring-0"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.slug}>
                    {city.name}
                  </option>
                ))}
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="rounded-lg border-gray-300 hover:border-[#0F1B2D]"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#0F1B2D]">
              {filters.search ? `"${filters.search}"` : 'All Ads'}
            </h2>
            {pagination && (
              <p className="text-[#6B7280] mt-1">
                Showing {ads.length} of {pagination.total} ads
              </p>
            )}
          </div>
        </div>

        {/* Ads Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-56 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : ads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-[#0F1B2D] mb-2">No ads found</h3>
              <p className="text-[#6B7280] mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button onClick={clearFilters} className="bg-[#F5A623] hover:bg-[#B8720A] text-white">
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => handleFilterChange('page', String(pagination.page - 1))}
                className="rounded-lg"
              >
                Previous
              </Button>
              
              <div className="flex space-x-1">
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handleFilterChange('page', String(i + 1))}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      pagination.page === i + 1
                        ? 'bg-[#F5A623] text-white'
                        : 'bg-white text-[#0F1B2D] hover:bg-[#F8F9FB] border border-gray-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              
              <Button
                variant="outline"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handleFilterChange('page', String(pagination.page + 1))}
                className="rounded-lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
