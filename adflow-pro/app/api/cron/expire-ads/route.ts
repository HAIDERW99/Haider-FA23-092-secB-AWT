import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const cronSecret = request.headers.get('x-cron-secret')
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const now = new Date()

    // Get all published ads that should be expired
    const { data: expiredAds, error } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'published')
      .lte('expire_at', now.toISOString())

    if (error) {
      console.error('Error fetching expired ads:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    if (!expiredAds || expiredAds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No ads to expire',
        expired_count: 0
      })
    }

    // Expire all outdated ads
    const adIds = expiredAds.map(ad => ad.id)
    
    const { data: updatedAds, error: expireError } = await supabase
      .from('ads')
      .update({
        status: 'expired',
        updated_at: now.toISOString()
      })
      .in('id', adIds)
      .select()

    if (expireError) {
      console.error('Error expiring ads:', expireError)
      return NextResponse.json({
        success: false,
        error: expireError.message
      }, { status: 500 })
    }

    // Create status history for each expired ad
    const statusHistoryRecords = updatedAds?.map(ad => ({
      ad_id: ad.id,
      previous_status: 'published',
      new_status: 'expired',
      changed_by: null, // System action
      note: 'Automatically expired by cron job'
    })) || []

    if (statusHistoryRecords.length > 0) {
      await supabase
        .from('ad_status_history')
        .insert(statusHistoryRecords)
    }

    // Create notifications for ad owners
    const notificationRecords = updatedAds?.map(ad => ({
      user_id: ad.user_id,
      title: 'Ad Expired',
      message: `Your ad "${ad.title}" has expired. You can renew it by creating a new ad.`,
      type: 'info',
      link: `/dashboard/client`
    })) || []

    if (notificationRecords.length > 0) {
      await supabase
        .from('notifications')
        .insert(notificationRecords)
    }

    // Log the cron job execution
    await supabase
      .from('system_health_logs')
      .insert({
        source: 'expire_ads_cron',
        response_ms: 0,
        status: 'success'
      })

    return NextResponse.json({
      success: true,
      message: `Expired ${updatedAds?.length || 0} ads`,
      expired_count: updatedAds?.length || 0,
      expired_ads: updatedAds?.map(ad => ({ id: ad.id, title: ad.title })) || []
    })

  } catch (error) {
    console.error('Expire ads cron error:', error)
    
    // Log the cron job failure
    try {
      await supabase
        .from('system_health_logs')
        .insert({
          source: 'expire_ads_cron',
          response_ms: 0,
          status: 'error'
        })
    } catch (logError) {
      console.error('Failed to log cron job failure:', logError)
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
