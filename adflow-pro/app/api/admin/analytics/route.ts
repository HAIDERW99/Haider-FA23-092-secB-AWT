import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, hasRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Check if user has admin role or higher
    if (!hasRole(user, 'admin')) {
      return NextResponse.json({
        success: false,
        error: 'Access denied. Admin role required.'
      }, { status: 403 })
    }

    // Get total ads by status
    const { data: allAds } = await supabase
      .from('ads')
      .select('status')

    const adsByStatus = allAds?.reduce((acc: any, ad: any) => {
      acc[ad.status] = (acc[ad.status] || 0) + 1
      return acc
    }, {}) || {}

    // Get revenue data
    const { data: revenueData, error: revenueError } = await supabase
      .from('payments')
      .select('amount, packages!inner(name, is_featured)')
      .eq('status', 'verified')

    // Get ads by category
    const { data: adsByCategory, error: categoryError } = await supabase
      .from('ads')
      .select('categories!inner(name)')
      .eq('status', 'published')

    // Get ads by city
    const { data: adsByCity, error: cityError } = await supabase
      .from('ads')
      .select('cities!inner(name)')
      .eq('status', 'published')

    // Get approval vs rejection rate
    const { data: approvalStats, error: approvalError } = await supabase
      .from('ad_status_history')
      .select('new_status')
      .in('new_status', ['published', 'rejected'])

    // Get system health logs
    const { data: healthLogs, error: healthError } = await supabase
      .from('system_health_logs')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(10)

    // Process revenue by package
    const revenueByPackage = revenueData?.reduce((acc: any, payment: any) => {
      const packageName = payment.packages?.name || 'Unknown'
      acc[packageName] = (acc[packageName] || 0) + payment.amount
      return acc
    }, {}) || {}

    // Process ads by category
    const categoryCounts = adsByCategory?.reduce((acc: any, ad: any) => {
      const categoryName = ad.categories?.name || 'Unknown'
      acc[categoryName] = (acc[categoryName] || 0) + 1
      return acc
    }, {}) || {}

    // Process ads by city
    const cityCounts = adsByCity?.reduce((acc: any, ad: any) => {
      const cityName = ad.cities?.name || 'Unknown'
      acc[cityName] = (acc[cityName] || 0) + 1
      return acc
    }, {}) || {}

    // Process approval stats
    const approvalCounts = approvalStats?.reduce((acc: any, history: any) => {
      acc[history.new_status] = (acc[history.new_status] || 0) + 1
      return acc
    }, {}) || {}

    // Calculate totals
    const totalAds = Object.values(adsByStatus || {}).reduce((sum: number, count: any) => sum + count, 0)
    const totalRevenue = revenueData?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0

    const summary = {
      totalAds,
      activeAds: adsByStatus?.published || 0,
      pendingAds: (adsByStatus?.submitted || 0) + (adsByStatus?.under_review || 0) + (adsByStatus?.payment_pending || 0) + (adsByStatus?.payment_submitted || 0),
      expiredAds: adsByStatus?.expired || 0,
      totalRevenue,
      approvalRate: approvalCounts.published ? (approvalCounts.published / (approvalCounts.published + (approvalCounts.rejected || 0))) * 100 : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        revenueByPackage,
        adsByCategory: categoryCounts,
        adsByCity: cityCounts,
        approvalStats: approvalCounts,
        healthLogs: healthLogs || []
      }
    })

  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
