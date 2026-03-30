import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import Link from 'next/link'

export default function CategoriesPage() {
  const categories = [
    { name: 'Electronics', icon: '📱', slug: 'electronics' },
    { name: 'Vehicles', icon: '🚗', slug: 'vehicles' },
    { name: 'Property', icon: '🏠', slug: 'property' },
    { name: 'Jobs', icon: '💼', slug: 'jobs' },
    { name: 'Services', icon: '🔧', slug: 'services' },
    { name: 'Fashion', icon: '👗', slug: 'fashion' },
    { name: 'Home & Garden', icon: '🏡', slug: 'home-garden' },
    { name: 'Sports', icon: '⚽', slug: 'sports' },
    { name: 'Education', icon: '📚', slug: 'education' },
    { name: 'Business', icon: '💼', slug: 'business' },
    { name: 'Pets', icon: '🐕', slug: 'pets' },
    { name: 'Food', icon: '🍔', slug: 'food' }
  ]

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#0F1B2D] mb-4">
            Browse Categories
          </h1>
          <p className="text-lg text-[#6B7280]">
            Find what you're looking for in our organized categories
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div key={category.slug} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-bold text-[#0F1B2D] mb-3">
                  {category.name}
                </h3>
                <Link href={`/explore?category=${category.slug}`}>
                  <button className="bg-[#F5A623] hover:bg-[#B8720A] text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    Browse
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-[#0F1B2D] mb-4">
              Can't find what you're looking for?
            </h2>
            <p className="text-[#6B7280] mb-6">
              Post your own ad and reach thousands of potential buyers
            </p>
            <Link href="/register">
              <button className="bg-[#F5A623] hover:bg-[#B8720A] text-white px-8 py-3 rounded-full font-medium transition-colors">
                Post an Ad
              </button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
