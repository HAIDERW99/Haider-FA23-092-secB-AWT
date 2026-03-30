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

    // Get all scheduled ads that should be published now
    const { data: scheduledAds, error } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'scheduled')
      .lte('publish_at', now.toISOString())

    if (error) {
      console.error('Error fetching scheduled ads:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    if (!scheduledAds || scheduledAds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled ads to publish',
        published_count: 0
      })
    }

    // Publish all scheduled ads
    const adIds = scheduledAds.map(ad => ad.id)
    
    const { data: publishedAds, error: publishError } = await supabase
      .from('ads')
      .update({
        status: 'published',
        updated_at: now.toISOString()
      })
      .in('id', adIds)
      .select()

    if (publishError) {
      console.error('Error publishing scheduled ads:', publishError)
      return NextResponse.json({
        success: false,
        error: publishError.message
      }, { status: 500 })
    }

    // Create status history for each published ad
    const statusHistoryRecords = publishedAds?.map(ad => ({
      ad_id: ad.id,
      previous_status: 'scheduled',
      new_status: 'published',
      changed_by: null, // System action
      note: 'Automatically published by cron job'
    })) || []

    if (statusHistoryRecords.length > 0) {
      await supabase
        .from('ad_status_history')
        .insert(statusHistoryRecords)
    }

    // Create notifications for ad owners
    const notificationRecords = publishedAds?.map(ad => ({
      user_id: ad.user_id,
      title: 'Ad Published',
      message: `Your ad "${ad.title}" has been published and is now live!`,
      type: 'success',
      link: `/ads/${ad.slug}`
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
        source: 'publish_scheduled_cron',
        response_ms: 0,
        status: 'success'
      })

    return NextResponse.json({
      success: true,
      message: `Published ${publishedAds?.length || 0} scheduled ads`,
      published_count: publishedAds?.length || 0,
      published_ads: publishedAds?.map(ad => ({ id: ad.id, title: ad.title })) || []
    })

  } catch (error) {
    console.error('Publish scheduled ads cron error:', error)
    
    // Log the cron job failure
    try {
      await supabase
        .from('system_health_logs')
        .insert({
          source: 'publish_scheduled_cron',
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
