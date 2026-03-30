import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getExpiryCountdown } from '@/lib/ranking'

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

interface AdCardProps {
  ad: Ad
  showSellerInfo?: boolean
}

export function AdCard({ ad, showSellerInfo = true }: AdCardProps) {
  const primaryMedia = ad.ad_media[0]
  const expiryCountdown = getExpiryCountdown(ad.expire_at)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-slate-100 text-slate-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'under_review': return 'bg-orange-100 text-orange-800'
      case 'payment_pending': return 'bg-purple-100 text-purple-800'
      case 'payment_submitted': return 'bg-indigo-100 text-indigo-800'
      case 'payment_verified': return 'bg-cyan-100 text-cyan-800'
      case 'scheduled': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPackageBadgeColor = (packageName: string, isFeatured: boolean) => {
    if (isFeatured) return 'bg-[#F5A623] text-white'
    if (packageName === 'Standard') return 'bg-blue-500 text-white'
    return 'bg-gray-500 text-white'
  }

  return (
    <Card className="overflow-hidden bg-white border-0 rounded-xl card-lift">
      <Link href={`/ads/${ad.slug}`}>
        <CardHeader className="p-0">
          {primaryMedia ? (
            <div className="relative h-56 w-full">
              <img
                src={primaryMedia.thumbnail_url || '/placeholder.jpg'}
                alt={ad.title}
                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                onError={(e) => e.currentTarget.src = '/placeholder.jpg'}
              />
              {ad.packages.is_featured && (
                <Badge className="absolute top-3 right-3 bg-[#F5A623] text-white">
                  Featured
                </Badge>
              )}
            </div>
          ) : (
            <div className="h-56 w-full bg-gray-100 flex items-center justify-center">
              <div style={{ width: '100%', height: '200px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                No Image
              </div>
            </div>
          )}
        </CardHeader>
      </Link>
      
      <CardContent className="p-5">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <Link href={`/ads/${ad.slug}`} className="flex-1">
              <h3 className="font-bold text-lg text-[#0F1B2D] line-clamp-2 hover:text-[#F5A623] transition-colors">
                {ad.title}
              </h3>
            </Link>
            <Badge className={`px-3 py-1 text-xs font-medium ${getStatusColor(ad.status)}`}>
              {ad.status}
            </Badge>
          </div>
          
          <p className="text-[#6B7280] text-sm line-clamp-2">
            {ad.description}
          </p>
          
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="outline" className="border-[#E5E7EB] text-[#6B7280]">
              {ad.categories.name}
            </Badge>
            <div className="flex items-center text-[#6B7280]">
              📍 {ad.cities.name}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-[#F0F0F0]">
            <div className="flex items-center gap-2">
              <Badge className={`px-3 py-1 text-xs font-medium ${getPackageBadgeColor(ad.packages.name, ad.packages.is_featured)}`}>
                {ad.packages.name}
              </Badge>
              <span className="text-xl font-bold text-[#F5A623]">
                ${ad.packages.price}
              </span>
            </div>
            {expiryCountdown !== 'No expiry' && (
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                {expiryCountdown}
              </span>
            )}
          </div>
          
          {showSellerInfo && (
            <div className="border-t border-[#F0F0F0] pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#F8F9FB] rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-[#0F1B2D]">
                      {(ad.seller_profiles?.display_name || ad.users.name).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[#0F1B2D]">
                      {ad.seller_profiles?.display_name || ad.users.name}
                    </span>
                    {ad.seller_profiles?.is_verified && (
                      <div className="flex items-center gap-1">
                        ✓<span className="text-xs text-green-600">Verified</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-[#6B7280]">
                  {new Date(ad.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
