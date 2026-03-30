import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-[#0F1B2D] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find. List. Sell.
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            Pakistan's most trusted sponsored listings marketplace
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore">
              <button className="bg-white text-[#0F1B2D] px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors">
                Explore Ads
              </button>
            </Link>
            <Link href="/register">
              <button className="bg-[#F5A623] hover:bg-[#B8720A] text-white px-8 py-3 rounded-full font-medium transition-colors">
                Post Your Ad
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1B2D] mb-4">
              Why Choose AdFlow Pro?
            </h2>
            <p className="text-lg text-[#6B7280]">
              Experience the best marketplace platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-[#0F1B2D] mb-3">Verified Listings</h3>
              <p className="text-[#6B7280]">
                All listings are verified for authenticity and quality. Trust what you see and buy with confidence.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-[#0F1B2D] mb-3">Premium Features</h3>
              <p className="text-[#6B7280]">
                Get advanced features with premium packages. Boost your visibility and reach more customers.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-[#0F1B2D] mb-3">Fast & Easy</h3>
              <p className="text-[#6B7280]">
                Quick ad creation and instant publishing. Get your listings live in minutes, not hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1B2D] mb-4">
              Choose Your Package
            </h2>
            <p className="text-lg text-[#6B7280]">
              Select the perfect plan for your advertising needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border-2 border-gray-200 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-[#0F1B2D] mb-2">Basic</h3>
              <div className="text-4xl font-bold text-[#6B7280] mb-2">
                $29
              </div>
              <p className="text-[#6B7280] mb-6">7 days duration</p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  7 days visibility
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Basic placement
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  1 media item
                </li>
              </ul>
              <Link href="/register">
                <button className="w-full bg-[#0F1B2D] hover:bg-[#1A2E4A] text-white py-3 rounded-full font-medium transition-colors">
                  Get Started
                </button>
              </Link>
            </div>
            
            <div className="border-2 border-blue-500 rounded-xl p-8 text-center relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#0F1B2D] mb-2">Standard</h3>
              <div className="text-4xl font-bold text-blue-500 mb-2">
                $49
              </div>
              <p className="text-[#6B7280] mb-6">14 days duration</p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  14 days visibility
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Priority placement
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  3 media items
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Basic analytics
                </li>
              </ul>
              <Link href="/register">
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-full font-medium transition-colors">
                  Get Started
                </button>
              </Link>
            </div>
            
            <div className="border-2 border-[#F5A623] rounded-xl p-8 text-center relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#F5A623] text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Premium
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#0F1B2D] mb-2">Premium</h3>
              <div className="text-4xl font-bold text-[#F5A623] mb-2">
                $99
              </div>
              <p className="text-[#6B7280] mb-6">30 days duration</p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  30 days visibility
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Top placement
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  5 media items
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Advanced analytics
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Featured badge
                </li>
              </ul>
              <Link href="/register">
                <button className="w-full bg-[#F5A623] hover:bg-[#B8720A] text-white py-3 rounded-full font-medium transition-colors">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#0F1B2D] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Selling?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of trusted sellers on Pakistan's best marketplace
          </p>
          <Link href="/register">
            <button className="bg-[#F5A623] hover:bg-[#B8720A] text-white px-8 py-3 rounded-full font-medium transition-colors">
              Get Started Now
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
