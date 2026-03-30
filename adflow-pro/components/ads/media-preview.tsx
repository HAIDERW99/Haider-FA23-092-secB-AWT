import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

interface MediaPreviewProps {
  media: {
    source_type: string
    original_url: string
    thumbnail_url: string
    validation_status: string
  }
}

export function MediaPreview({ media }: MediaPreviewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'success'
      case 'pending': return 'warning'
      case 'failed': return 'destructive'
      default: return 'secondary'
    }
  }

  if (media.source_type === 'youtube') {
    return (
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <Image
          src={media.thumbnail_url}
          alt="YouTube thumbnail"
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/placeholder.jpg'
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-red-600 rounded-full p-3">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        <Badge variant={getStatusColor(media.validation_status) as any} className="absolute top-2 right-2">
          {media.validation_status}
        </Badge>
      </div>
    )
  }

  return (
    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
      <Image
        src={media.thumbnail_url}
        alt="Ad media"
        fill
        className="object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.src = '/placeholder.jpg'
        }}
      />
      <Badge variant={getStatusColor(media.validation_status) as any} className="absolute top-2 right-2">
        {media.validation_status}
      </Badge>
    </div>
  )
}
