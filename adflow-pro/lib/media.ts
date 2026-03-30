export interface MediaInfo {
  sourceType: 'youtube' | 'image' | 'cloudinary'
  originalUrl: string
  thumbnailUrl: string
  validationStatus: 'pending' | 'verified' | 'failed'
}

export function normalizeMediaUrl(url: string): MediaInfo {
  const trimmedUrl = url.trim()
  
  // YouTube URL normalization
  if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be')) {
    const videoId = extractYouTubeVideoId(trimmedUrl)
    if (videoId) {
      return {
        sourceType: 'youtube',
        originalUrl: trimmedUrl,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        validationStatus: 'verified'
      }
    }
  }
  
  // Direct image validation
  if (isValidImageUrl(trimmedUrl)) {
    return {
      sourceType: 'image',
      originalUrl: trimmedUrl,
      thumbnailUrl: trimmedUrl,
      validationStatus: 'verified'
    }
  }
  
  // Cloudinary URLs (basic validation)
  if (trimmedUrl.includes('cloudinary.com')) {
    return {
      sourceType: 'cloudinary',
      originalUrl: trimmedUrl,
      thumbnailUrl: trimmedUrl,
      validationStatus: 'pending'
    }
  }
  
  // Fallback for invalid URLs
  return {
    sourceType: 'image',
    originalUrl: trimmedUrl,
    thumbnailUrl: '/placeholder.jpg',
    validationStatus: 'failed'
  }
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    
    // Must be HTTPS
    if (urlObj.protocol !== 'https:') {
      return false
    }
    
    // Check for valid image extensions
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    const pathname = urlObj.pathname.toLowerCase()
    
    return validExtensions.some(ext => pathname.endsWith(ext))
  } catch {
    return false
  }
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url)
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

export function validateMediaUrls(urls: string[]): MediaInfo[] {
  return urls.map(url => normalizeMediaUrl(url))
}
