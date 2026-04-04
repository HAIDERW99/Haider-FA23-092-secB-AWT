import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getExpiryCountdown } from '@/lib/ranking'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const { data: ad, error } = await supabase
      .from('ads')
      .select(`
        *,
        packages (
          id,
          name,
          duration_days,
          weight,
          is_featured,
          price
        ),
        categories (
          id,
          name,
          slug
        ),
        cities (
          id,
          name,
          slug
        ),
        users (
          id,
          name,
          email
        ),
        seller_profiles (
          display_name,
          business_name,
          phone,
          city,
          is_verified
        ),
        ad_media (
          id,
          source_type,
          original_url,
          thumbnail_url,
          validation_status
        ),
        payments (
          id,
          amount,
          method,
          transaction_ref,
          sender_name,
          status,
          created_at
        )
      `)
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Ad not found'
        }, { status: 404 })
      }
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    if (!ad) {
      return NextResponse.json({
        success: false,
        error: 'Ad not found'
      }, { status: 404 })
    }

    // Add expiry countdown
    const processedAd = {
      ...ad,
      expiry_countdown: getExpiryCountdown(ad.expire_at)
    }

    return NextResponse.json({
      success: true,
      data: processedAd
    })

  } catch (error) {
    console.error('Ad fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
