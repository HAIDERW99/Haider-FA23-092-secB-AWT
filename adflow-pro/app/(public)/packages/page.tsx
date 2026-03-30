import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import Link from 'next/link'

export default function PackagesPage() {
  const packages = [
    {
      id: 'basic',
      name: 'Basic',
      price: 'Rs. 500',
      duration: '7 days',
      color: 'gray',
      features: [
        '7 days visibility',
        'Basic placement',
        '1 media item',
        'Standard support'
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 'Rs. 1,200',
      duration: '15 days',
      color: 'blue',
      features: [
        '15 days visibility',
        'Priority placement',
        '3 media items',
        'Email support',
        'Basic analytics'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 'Rs. 2,500',
      duration: '30 days',
      color: 'amber',
      isHighlighted: true,
      features: [
        '30 days visibility',
        'Top placement',
        '5 media items',
        'Priority support',
        'Advanced analytics',
        'Featured badge',
        'Homepage placement'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#0F1B2D] mb-4">
            Choose Your Package
          </h1>
          <p className="text-xl text-[#6B7280] mb-8">
            Select the perfect plan for your advertising needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div 
              key={pkg.id} 
              className={`relative bg-white rounded-xl p-8 border-2 ${
                pkg.isHighlighted 
                  ? 'border-[#F5A623] shadow-lg scale-105' 
                  : pkg.color === 'blue' 
                    ? 'border-blue-500'
                    : 'border-gray-200'
              }`}
            >
              {pkg.isHighlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#F5A623] text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#0F1B2D] mb-2">{pkg.name}</h3>
                <div className={`text-4xl font-bold mb-2 ${
                  pkg.color === 'amber' ? 'text-[#F5A623]' : 
                  pkg.color === 'blue' ? 'text-blue-500' : 'text-gray-500'
                }`}>
                  {pkg.price}
                </div>
                <p className="text-[#6B7280] mb-6">{pkg.duration}</p>
              </div>
              
              <div className="space-y-3 mb-8">
                {pkg.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    <span className="text-[#0F1B2D]">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3">
                <Link href="/register">
                  <button className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    pkg.color === 'amber' 
                      ? 'bg-[#F5A623] hover:bg-[#B8720A] text-white' 
                      : pkg.color === 'blue'
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-500 hover:bg-gray-600 text-white'
                  }`}>
                    Get Started
                  </button>
                </Link>
                
                <p className="text-xs text-[#6B7280] text-center">
                  No hidden fees • Cancel anytime • Instant activation
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-[#0F1B2D] mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-[#0F1B2D] mb-3">
                How long does my ad stay active?
              </h3>
              <p className="text-[#6B7280]">
                Your ad remains active for the duration specified in your package (7, 15, or 30 days). 
                You can renew your ad before it expires to maintain visibility.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-[#0F1B2D] mb-3">
                What's included in each package?
              </h3>
              <p className="text-[#6B7280]">
                All packages include basic ad creation, media uploads, and search visibility. 
                Higher tiers offer longer duration, better ranking, and premium features.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-[#0F1B2D] mb-3">
                How does the ranking system work?
              </h3>
              <p className="text-[#6B7280]">
                Ads are ranked based on package weight, featured status, freshness, and admin boost. 
                Premium packages get higher visibility and better placement.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-[#0F1B2D] mb-3">
                Can I upgrade my package later?
              </h3>
              <p className="text-[#6B7280]">
                Yes! You can upgrade to a higher package at any time. The additional benefits 
                will be applied immediately with prorated pricing.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
