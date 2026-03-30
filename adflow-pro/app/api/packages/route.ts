import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { packageQuerySchema } from '@/schemas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = packageQuerySchema.parse(query)

    let queryBuilder = supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('weight', { ascending: false })

    if (validatedQuery.featured !== undefined) {
      queryBuilder = queryBuilder.eq('is_featured', validatedQuery.featured)
    }

    const { data, error } = await queryBuilder

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Packages fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
