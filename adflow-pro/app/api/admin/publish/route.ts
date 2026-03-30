import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth, hasRole } from '@/lib/auth'
import { publishAdSchema } from '@/schemas'

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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'payment_verified'

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
        payments (
          id,
          amount,
          method,
          transaction_ref,
          status,
          created_at
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
    console.error('Admin publish queue fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Check if user has admin role or higher
    if (!hasRole(user, 'admin')) {
      return NextResponse.json({
        success: false,
        error: 'Access denied. Admin role required.'
      }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = publishAdSchema.parse(body)

    // This would be for batch publishing, but we'll implement individual ad publishing
    return NextResponse.json({
      success: false,
      error: 'Use PATCH /api/admin/ads/[id]/publish for individual ad publishing'
    }, { status: 400 })

  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
