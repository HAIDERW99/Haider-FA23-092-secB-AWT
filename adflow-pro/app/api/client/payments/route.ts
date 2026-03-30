import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { createPaymentSchema } from '@/schemas'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)

    // Check if the ad exists and belongs to the user
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select(`
        *,
        packages (
          id,
          name,
          price
        )
      `)
      .eq('id', validatedData.ad_id)
      .eq('user_id', user.id)
      .single()

    if (adError || !ad) {
      return NextResponse.json({
        success: false,
        error: 'Ad not found or access denied'
      }, { status: 404 })
    }

    // Check if ad is in correct status for payment
    if (ad.status !== 'payment_pending') {
      return NextResponse.json({
        success: false,
        error: 'Ad is not in payment pending status'
      }, { status: 400 })
    }

    // Validate payment amount (±5% of package price)
    const packagePrice = ad.packages?.price || 0
    const minAmount = packagePrice * 0.95
    const maxAmount = packagePrice * 1.05

    if (validatedData.amount < minAmount || validatedData.amount > maxAmount) {
      return NextResponse.json({
        success: false,
        error: `Payment amount must be between $${minAmount.toFixed(2)} and $${maxAmount.toFixed(2)}`
      }, { status: 400 })
    }

    // Check for duplicate transaction reference
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('transaction_ref', validatedData.transaction_ref)
      .single()

    if (existingPayment) {
      return NextResponse.json({
        success: false,
        error: 'Transaction reference already exists'
      }, { status: 409 })
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        ad_id: validatedData.ad_id,
        amount: validatedData.amount,
        method: validatedData.method,
        transaction_ref: validatedData.transaction_ref,
        sender_name: validatedData.sender_name,
        screenshot_url: validatedData.screenshot_url,
        status: 'pending'
      })
      .select()
      .single()

    if (paymentError) {
      return NextResponse.json({
        success: false,
        error: paymentError.message
      }, { status: 500 })
    }

    // Update ad status to payment_submitted
    const { error: adUpdateError } = await supabase
      .from('ads')
      .update({ status: 'payment_submitted' })
      .eq('id', validatedData.ad_id)

    if (adUpdateError) {
      console.error('Ad status update error:', adUpdateError)
    }

    // Create ad status history
    await supabase
      .from('ad_status_history')
      .insert({
        ad_id: validatedData.ad_id,
        previous_status: 'payment_pending',
        new_status: 'payment_submitted',
        changed_by: user.id,
        note: 'Payment proof submitted by client'
      })

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action_type: 'create',
        target_type: 'payment',
        target_id: payment.id,
        old_value: null,
        new_value: {
          ad_id: validatedData.ad_id,
          amount: validatedData.amount,
          transaction_ref: validatedData.transaction_ref
        }
      })

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Payment submitted successfully. Waiting for verification.'
    })

  } catch (error) {
    console.error('Payment submission error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
