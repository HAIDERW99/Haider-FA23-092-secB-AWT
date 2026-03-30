export interface Ad {
  id: string
  title: string
  status: string
  publish_at: string | null
  expire_at: string | null
  admin_boost: number
  rank_score: number
  package: {
    weight: number
    is_featured: boolean
  }
}

export function calculateRankScore(ad: Partial<Ad>): number {
  let score = 0
  
  // Featured bonus
  if (ad.package?.is_featured) {
    score += 50
  }
  
  // Package weight bonus
  if (ad.package?.weight) {
    score += ad.package.weight * 10
  }
  
  // Freshness points
  score += getFreshnessPoints(ad.publish_at)
  
  // Admin boost
  score += ad.admin_boost || 0
  
  return score
}

function getFreshnessPoints(publishAt: string | null): number {
  if (!publishAt) return 0
  
  const now = new Date()
  const published = new Date(publishAt)
  const hoursDiff = (now.getTime() - published.getTime()) / (1000 * 60 * 60)
  
  if (hoursDiff <= 24) {
    return 20 // Published within last 24 hours
  } else if (hoursDiff <= 72) {
    return 10 // Published within last 3 days
  } else {
    return 0 // Older than 3 days
  }
}

export function isAdActive(ad: Partial<Ad>): boolean {
  if (ad.status !== 'published') return false
  
  const now = new Date()
  
  // Check if ad has expired
  if (ad.expire_at) {
    const expireDate = new Date(ad.expire_at)
    if (now > expireDate) {
      return false
    }
  }
  
  // Check if ad is scheduled for future
  if (ad.publish_at) {
    const publishDate = new Date(ad.publish_at)
    if (now < publishDate) {
      return false
    }
  }
  
  return true
}

export function sortAdsByRank(ads: Ad[]): Ad[] {
  return ads
    .filter(ad => isAdActive(ad))
    .sort((a, b) => {
      const scoreA = calculateRankScore(a)
      const scoreB = calculateRankScore(b)
      
      if (scoreB !== scoreA) {
        return scoreB - scoreA // Higher rank first
      }
      
      // If same rank, sort by publish date (newer first)
      const dateA = a.publish_at ? new Date(a.publish_at).getTime() : 0
      const dateB = b.publish_at ? new Date(b.publish_at).getTime() : 0
      return dateB - dateA
    })
}

export function getExpiryCountdown(expireAt: string | null): string {
  if (!expireAt) return 'No expiry'
  
  const now = new Date()
  const expiry = new Date(expireAt)
  const diffMs = expiry.getTime() - now.getTime()
  
  if (diffMs <= 0) {
    return 'Expired'
  }
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hour${diffHours > 1 ? 's' : ''}`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
  } else {
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`
  }
}
