import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, hasRole } from '@/lib/auth'
import { verifyPaymentSchema } from '@/schemas'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Check if user has admin role or higher
    if (!hasRole(user, 'admin')) {
      return NextResponse.json({
        success: false,
        error: 'Access denied. Admin role required.'
      }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = verifyPaymentSchema.parse(body)

    // Get current payment and related ad
    const { data: currentPayment, error: fetchError } = await supabase
      .from('payments')
      .select(`
        *,
        ads (
          id,
          title,
          status,
          packages (
            id,
            name,
            duration_days
          )
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !currentPayment) {
      return NextResponse.json({
        success: false,
        error: 'Payment not found'
      }, { status: 404 })
    }

    // Only allow verification of pending payments
    if (currentPayment.status !== 'pending') {
      return NextResponse.json({
        success: false,
        error: 'Payment is not in pending status'
      }, { status: 400 })
    }

    // Update payment status
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: validatedData.status
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

    // Update ad status based on payment verification
    let newAdStatus: string
    let notificationMessage: string

    if (validatedData.status === 'verified') {
      newAdStatus = 'payment_verified'
      notificationMessage = `Payment for your ad "${currentPayment.ads?.title}" has been verified. Your ad will be published soon.`
    } else {
      newAdStatus = 'payment_pending' // Reset to pending for resubmission
      notificationMessage = `Payment for your ad "${currentPayment.ads?.title}" was rejected. ${validatedData.note ? `Reason: ${validatedData.note}` : 'Please submit payment proof again.'}`
    }

    const { error: adUpdateError } = await supabase
      .from('ads')
      .update({
        status: newAdStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentPayment.ad_id)

    if (adUpdateError) {
      console.error('Ad status update error:', adUpdateError)
    }

    // Create ad status history
    await supabase
      .from('ad_status_history')
      .insert({
        ad_id: currentPayment.ad_id,
        previous_status: currentPayment.ads?.status,
        new_status: newAdStatus,
        changed_by: user.id,
        note: `Payment ${validatedData.status}${validatedData.note ? `: ${validatedData.note}` : ''}`
      })

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action_type: 'verify',
        target_type: 'payment',
        target_id: id,
        old_value: { status: currentPayment.status },
        new_value: { status: validatedData.status, note: validatedData.note }
      })

    // Create notification for the ad owner
    await supabase
      .from('notifications')
      .insert({
        user_id: currentPayment.ads?.user_id,
        title: validatedData.status === 'verified' ? 'Payment Verified' : 'Payment Rejected',
        message: notificationMessage,
        type: validatedData.status === 'verified' ? 'success' : 'error',
        link: `/dashboard/client`
      })

    return NextResponse.json({
      success: true,
      data: updatedPayment,
      message: `Payment ${validatedData.status} successfully`
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
