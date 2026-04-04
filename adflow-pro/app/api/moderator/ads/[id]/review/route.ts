import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, hasRole } from '@/lib/auth'
import { reviewAdSchema } from '@/schemas'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Check if user has moderator role or higher
    if (!hasRole(user, 'moderator')) {
      return NextResponse.json({
        success: false,
        error: 'Access denied. Moderator role required.'
      }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = reviewAdSchema.parse(body)

    // Get current ad status
    const { data: currentAd, error: fetchError } = await supabase
      .from('ads')
      .select('status, title')
      .eq('id', id)
      .single()

    if (fetchError || !currentAd) {
      return NextResponse.json({
        success: false,
        error: 'Ad not found'
      }, { status: 404 })
    }

    // Validate status transition
    const validTransitions = {
      'under_review': ['rejected', 'payment_pending'],
      'submitted': ['under_review', 'rejected']
    }

    const allowedStatuses = validTransitions[currentAd.status as keyof typeof validTransitions] || []
    
    if (!allowedStatuses.includes(validatedData.status)) {
      return NextResponse.json({
        success: false,
        error: `Cannot transition from ${currentAd.status} to ${validatedData.status}`
      }, { status: 400 })
    }

    // Update ad status
    const { data: updatedAd, error: updateError } = await supabase
      .from('ads')
      .update({
        status: validatedData.status,
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
        new_status: validatedData.status,
        changed_by: user.id,
        note: validatedData.note || `Status changed by ${user.name}`
      })

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action_type: 'status_change',
        target_type: 'ad',
        target_id: id,
        old_value: { status: currentAd.status },
        new_value: { status: validatedData.status, note: validatedData.note }
      })

    // Create notification for the ad owner
    if (validatedData.status === 'rejected') {
      await supabase
        .from('notifications')
        .insert({
          user_id: updatedAd.user_id,
          title: 'Ad Rejected',
          message: `Your ad "${currentAd.title}" has been rejected. ${validatedData.note ? `Reason: ${validatedData.note}` : ''}`,
          type: 'error',
          link: `/dashboard/client`
        })
    } else if (validatedData.status === 'payment_pending') {
      await supabase
        .from('notifications')
        .insert({
          user_id: updatedAd.user_id,
          title: 'Ad Approved - Payment Required',
          message: `Your ad "${currentAd.title}" has been approved. Please submit payment to publish it.`,
          type: 'info',
          link: `/dashboard/client`
        })
    }

    return NextResponse.json({
      success: true,
      data: updatedAd,
      message: `Ad ${validatedData.status === 'rejected' ? 'rejected' : 'approved for payment'} successfully`
    })

  } catch (error) {
    console.error('Ad review error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
