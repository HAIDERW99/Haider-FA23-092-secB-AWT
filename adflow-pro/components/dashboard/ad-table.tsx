import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

interface AdTableProps {
  ads: Ad[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  showActions?: boolean
}

export function AdTable({ ads, onEdit, onDelete, showActions = true }: AdTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success'
      case 'draft': return 'secondary'
      case 'submitted': return 'warning'
      case 'under_review': return 'warning'
      case 'payment_pending': return 'warning'
      case 'payment_submitted': return 'warning'
      case 'rejected': return 'destructive'
      case 'expired': return 'secondary'
      default: return 'default'
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Title</th>
            <th className="text-left p-2">Category</th>
            <th className="text-left p-2">Package</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Created</th>
            {showActions && <th className="text-left p-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {ads.map((ad) => (
            <tr key={ad.id} className="border-b hover:bg-gray-50">
              <td className="p-2">
                <Link href={`/ads/${ad.slug}`} className="hover:text-blue-600">
                  {ad.title}
                </Link>
              </td>
              <td className="p-2">
                <Badge variant="outline">{ad.categories.name}</Badge>
              </td>
              <td className="p-2">
                <div>
                  <Badge variant="secondary">{ad.packages.name}</Badge>
                  <span className="text-sm text-gray-500 ml-2">${ad.packages.price}</span>
                </div>
              </td>
              <td className="p-2">
                <Badge variant={getStatusColor(ad.status) as any}>
                  {ad.status}
                </Badge>
              </td>
              <td className="p-2 text-sm text-gray-500">
                {new Date(ad.created_at).toLocaleDateString()}
              </td>
              {showActions && (
                <td className="p-2">
                  <div className="flex gap-2">
                    {onEdit && ad.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(ad.id)}
                      >
                        Edit
                      </Button>
                    )}
                    {onDelete && ad.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(ad.id)}
                      >
                        Delete
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Link href={`/ads/${ad.slug}`}>View</Link>
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      {ads.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No ads found
        </div>
      )}
    </div>
  )
}
