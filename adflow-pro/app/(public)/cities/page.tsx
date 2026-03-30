import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import Link from 'next/link'

export default function CitiesPage() {
  const cities = [
    { name: 'Karachi', slug: 'karachi' },
    { name: 'Lahore', slug: 'lahore' },
    { name: 'Islamabad', slug: 'islamabad' },
    { name: 'Peshawar', slug: 'peshawar' },
    { name: 'Quetta', slug: 'quetta' },
    { name: 'Faisalabad', slug: 'faisalabad' },
    { name: 'Multan', slug: 'multan' },
    { name: 'Rawalpindi', slug: 'rawalpindi' },
    { name: 'Gujranwala', slug: 'gujranwala' },
    { name: 'Sialkot', slug: 'sialkot' },
    { name: 'Hyderabad', slug: 'hyderabad' },
    { name: 'Sukkur', slug: 'sukkur' }
  ]

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#0F1B2D] mb-4">
            Browse by City
          </h1>
          <p className="text-lg text-[#6B7280]">
            Find ads and services in your local area
          </p>
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cities.map((city) => (
            <div key={city.slug} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#FEF3DC] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[#F5A623]">
                    {city.name.charAt(0)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#0F1B2D] mb-3">
                  {city.name}
                </h3>
                <Link href={`/explore?city=${city.slug}`}>
                  <button className="bg-[#F5A623] hover:bg-[#B8720A] text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    Browse Ads
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
              Don't see your city?
            </h2>
            <p className="text-[#6B7280] mb-6">
              We're expanding to more cities across Pakistan
            </p>
            <Link href="/contact">
              <button className="bg-[#0F1B2D] hover:bg-[#1A2E4A] text-white px-8 py-3 rounded-full font-medium transition-colors">
                Request Your City
              </button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
