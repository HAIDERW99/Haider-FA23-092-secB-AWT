import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { adQuerySchema } from '@/schemas'
import { calculateRankScore, isAdActive } from '@/lib/ranking'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = adQuerySchema.parse(query)

    const offset = (validatedQuery.page - 1) * validatedQuery.limit

    // Build the main query
    let queryBuilder = supabase
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
        ad_media (
          id,
          source_type,
          original_url,
          thumbnail_url,
          validation_status
        )
      `, { count: 'exact' })

    // Apply filters
    if (validatedQuery.category) {
      queryBuilder = queryBuilder.eq('categories.slug', validatedQuery.category)
    }

    if (validatedQuery.city) {
      queryBuilder = queryBuilder.eq('cities.slug', validatedQuery.city)
    }

    if (validatedQuery.search) {
      queryBuilder = queryBuilder.or(`title.ilike.%${validatedQuery.search}%,description.ilike.%${validatedQuery.search}%`)
    }

    // Only get published ads
    queryBuilder = queryBuilder.eq('status', 'published')

    // Apply sorting
    if (validatedQuery.sort === 'rank') {
      // We'll sort by rank score after getting the data
      queryBuilder = queryBuilder.order('created_at', { ascending: false })
    } else {
      queryBuilder = queryBuilder.order('created_at', { ascending: false })
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + validatedQuery.limit - 1)

    const { data: ads, error, count } = await queryBuilder

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Process ads: calculate rank scores and filter active ads
    const processedAds = (ads || [])
      .map(ad => ({
        ...ad,
        rank_score: calculateRankScore(ad)
      }))
      .filter(ad => isAdActive(ad))
      .sort((a, b) => b.rank_score - a.rank_score)
      .slice(0, validatedQuery.limit)

    const totalPages = Math.ceil((count || 0) / validatedQuery.limit)

    return NextResponse.json({
      success: true,
      data: processedAds,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: count || 0,
        totalPages
      }
    })

  } catch (error) {
    console.error('Ads fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // This would be for creating ads, but we'll implement it in the client routes
    return NextResponse.json({
      success: false,
      error: 'Use /api/client/ads for creating ads'
    }, { status: 400 })

  } catch (error) {
    console.error('Ads post error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
