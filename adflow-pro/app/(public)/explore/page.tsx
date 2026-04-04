'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
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

function ExploreContent() {
  const searchParams = useSearchParams()
  const [allAds, setAllAds] = useState<Ad[]>([])
  const [filteredAds, setFilteredAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'all')

  useEffect(() => {
    fetchAds()
  }, [])

  useEffect(() => {
    // Apply all filters whenever any filter changes
    let result = allAds
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(ad => 
        ad.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(ad => ad.categories.name === selectedCategory)
    }
    
    // Apply city filter
    if (selectedCity !== 'all') {
      result = result.filter(ad => ad.cities.name === selectedCity)
    }
    
    setFilteredAds(result)
  }, [searchQuery, selectedCategory, selectedCity, allAds])

  const fetchAds = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/ads')
      if (res.ok) {
        const data = await res.json()
        setAllAds(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching ads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    // Search button triggers the filter effect (already handled by useEffect)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedCity('all')
  }

  const getPackageBadgeColor = (packageName: string, isFeatured: boolean) => {
    if (isFeatured) return '#F5A623' // Amber
    if (packageName === 'Standard') return '#3B82F6' // Blue
    return '#6B7280' // Gray
  }

  const getStatusBadgeColor = (status: string) => {
    if (status === 'published') return '#10B981' // Green
    return '#6B7280' // Gray
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FB' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '100px' }}>
          <div style={{ fontSize: '18px', color: '#6B7280' }}>Loading ads...</div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FB' }}>
      <Navbar />
      
      {/* Search and Filters Section */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '24px',
        background: 'white',
        borderBottom: '1px solid #E5E7EB'
      }}>
        {/* Search Bar */}
        <div style={{ 
          marginBottom: '16px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Search ads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              height: '48px',
              padding: '0 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              height: '48px',
              padding: '0 24px',
              background: '#0F1B2D',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </div>

        {/* Filters Row */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              height: '40px',
              padding: '0 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="all">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Vehicles">Vehicles</option>
            <option value="Property">Property</option>
            <option value="Jobs">Jobs</option>
          </select>

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{
              height: '40px',
              padding: '0 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="all">All Cities</option>
            <option value="Karachi">Karachi</option>
            <option value="Lahore">Lahore</option>
            <option value="Islamabad">Islamabad</option>
            <option value="Peshawar">Peshawar</option>
          </select>

          <button
            onClick={clearFilters}
            style={{
              height: '40px',
              padding: '0 16px',
              background: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>

          <div style={{ 
            fontSize: '14px', 
            color: '#6B7280',
            marginLeft: 'auto'
          }}>
            Showing {filteredAds.length} ads
          </div>
        </div>
      </div>

      {/* Ads Grid */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '24px'
      }}>
        {filteredAds.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            fontSize: '18px',
            color: '#6B7280'
          }}>
            No ads found. Try adjusting your filters.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px'
          }}>
            {filteredAds.map((ad) => (
              <div
                key={ad.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Image Placeholder */}
                <div style={{ 
                  height: '180px', 
                  background: '#1A2E4A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {ad.ad_media && ad.ad_media[0] ? (
                    <img
                      src={ad.ad_media[0].thumbnail_url}
                      alt={ad.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `
                          <div style="
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100%;
                            color: white;
                            font-size: 48px;
                            font-weight: bold;
                          ">
                            ${ad.title.charAt(0).toUpperCase()}
                          </div>
                        `
                      }}
                    />
                  ) : (
                    <div style={{
                      color: 'white',
                      fontSize: '48px',
                      fontWeight: 'bold'
                    }}>
                      {ad.title.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Package Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'white',
                    background: getPackageBadgeColor(ad.packages.name, ad.packages.is_featured)
                  }}>
                    {ad.packages.is_featured ? 'Premium' : ad.packages.name}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '16px' }}>
                  {/* Title */}
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#0F1B2D',
                    marginBottom: '8px',
                    lineHeight: '1.4'
                  }}>
                    {ad.title}
                  </h3>

                  {/* Price */}
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#F5A623',
                    marginBottom: '8px'
                  }}>
                    ${ad.packages.price}
                  </div>

                  {/* City + Category */}
                  <div style={{
                    fontSize: '13px',
                    color: '#6B7280',
                    marginBottom: '12px',
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <span>📍 {ad.cities.name}</span>
                    <span>📁 {ad.categories.name}</span>
                  </div>

                  {/* Status Badge */}
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'white',
                    background: getStatusBadgeColor(ad.status),
                    marginBottom: '12px'
                  }}>
                    {ad.status}
                  </div>

                  {/* View Details Button */}
                  <Link href={`/ads/${ad.slug}`}>
                    <div style={{
                      background: '#F5A623',
                      color: 'white',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#B8720A'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F5A623'
                      }}
                    >
                      View Details
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <ExploreContent />
    </Suspense>
  )
}
