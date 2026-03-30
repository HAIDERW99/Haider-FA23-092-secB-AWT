import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, hasRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Check if user has moderator role or higher
    if (!hasRole(user, 'moderator')) {
      return NextResponse.json({
        success: false,
        error: 'Access denied. Moderator role required.'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'under_review'

    const offset = (page - 1) * limit

    const { data: ads, error, count } = await supabase
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
        )
      `, { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      success: true,
      data: ads || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    })

  } catch (error) {
    console.error('Moderator review fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
