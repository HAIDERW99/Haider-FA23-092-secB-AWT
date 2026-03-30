import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, hasRole } from '@/lib/auth'
import { publishAdSchema } from '@/schemas'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const { id } = params

    // Check if user has admin role or higher
    if (!hasRole(user, 'admin')) {
      return NextResponse.json({
        success: false,
        error: 'Access denied. Admin role required.'
      }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = publishAdSchema.parse(body)

    // Get current ad with package info
    const { data: currentAd, error: fetchError } = await supabase
      .from('ads')
      .select(`
        *,
        packages (
          id,
          name,
          duration_days
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !currentAd) {
      return NextResponse.json({
        success: false,
        error: 'Ad not found'
      }, { status: 404 })
    }

    // Only allow publishing payment_verified ads
    if (currentAd.status !== 'payment_verified') {
      return NextResponse.json({
        success: false,
        error: 'Ad must be in payment_verified status to publish'
      }, { status: 400 })
    }

    // Calculate publish and expire dates
    const now = new Date()
    const publishAt = validatedData.publish_at ? new Date(validatedData.publish_at) : now
    const durationDays = currentAd.packages?.duration_days || 30
    const expireAt = new Date(publishAt.getTime() + (durationDays * 24 * 60 * 60 * 1000))

    // Update ad
    const { data: updatedAd, error: updateError } = await supabase
      .from('ads')
      .update({
        status: publishAt > now ? 'scheduled' : 'published',
        publish_at: publishAt.toISOString(),
        expire_at: expireAt.toISOString(),
        admin_boost: validatedData.admin_boost || currentAd.admin_boost || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 })
    }

    // Create ad status history
    await supabase
      .from('ad_status_history')
      .insert({
        ad_id: id,
        previous_status: currentAd.status,
        new_status: updatedAd.status,
        changed_by: user.id,
        note: `Published by admin${publishAt > now ? ` (scheduled for ${publishAt.toISOString()})` : ''}`
      })

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action_type: 'publish',
        target_type: 'ad',
        target_id: id,
        old_value: { status: currentAd.status },
        new_value: { 
          status: updatedAd.status, 
          publish_at: updatedAd.publish_at,
          expire_at: updatedAd.expire_at,
          admin_boost: updatedAd.admin_boost
        }
      })

    // Create notification for the ad owner
    await supabase
      .from('notifications')
      .insert({
        user_id: currentAd.user_id,
        title: publishAt > now ? 'Ad Scheduled' : 'Ad Published',
        message: `Your ad "${currentAd.title}" has been ${publishAt > now ? `scheduled for ${publishAt.toLocaleDateString()}` : 'published and is now live'}!`,
        type: 'success',
        link: `/ads/${currentAd.slug}`
      })

    return NextResponse.json({
      success: true,
      data: updatedAd,
      message: `Ad ${publishAt > now ? 'scheduled' : 'published'} successfully`
    })

  } catch (error) {
    console.error('Ad publish error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
