import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { createAdSchema } from '@/schemas'
import { normalizeMediaUrl } from '@/lib/media'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    const offset = (page - 1) * limit

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
      `, { count: 'exact' })
      .eq('user_id', user.id)

    if (status) {
      queryBuilder = queryBuilder.eq('status', status)
    }

    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: ads, error, count } = await queryBuilder

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
    console.error('Client ads fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const validatedData = createAdSchema.parse(body)

    // Generate unique slug
    const slug = generateSlug(validatedData.title)
    const slugExists = await checkSlugExists(slug)
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug

    // Create the ad
    const { data: ad, error } = await supabase
      .from('ads')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        slug: finalSlug,
        description: validatedData.description,
        category_id: validatedData.category_id,
        city_id: validatedData.city_id,
        package_id: validatedData.package_id,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Process and create media records
    const mediaRecords = validatedData.media_urls.map(url => {
      const mediaInfo = normalizeMediaUrl(url)
      return {
        ad_id: ad.id,
        source_type: mediaInfo.sourceType,
        original_url: mediaInfo.originalUrl,
        thumbnail_url: mediaInfo.thumbnailUrl,
        validation_status: mediaInfo.validationStatus
      }
    })

    if (mediaRecords.length > 0) {
      const { error: mediaError } = await supabase
        .from('ad_media')
        .insert(mediaRecords)

      if (mediaError) {
        console.error('Media creation error:', mediaError)
        // Don't fail the whole operation, but log the error
      }
    }

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action_type: 'create',
        target_type: 'ad',
        target_id: ad.id,
        old_value: null,
        new_value: { title: validatedData.title, status: 'draft' }
      })

    return NextResponse.json({
      success: true,
      data: ad
    })

  } catch (error) {
    console.error('Ad creation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function checkSlugExists(slug: string): Promise<boolean> {
  const { data } = await supabase
    .from('ads')
    .select('id')
    .eq('slug', slug)
    .single()
  
  return !!data
}
