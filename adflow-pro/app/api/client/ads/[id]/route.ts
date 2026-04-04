import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { updateAdSchema } from '@/schemas'
import { normalizeMediaUrl } from '@/lib/media'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const body = await request.json()
    const validatedData = updateAdSchema.parse(body)

    // First check if the ad exists and belongs to the user
    const { data: existingAd, error: fetchError } = await supabase
      .from('ads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingAd) {
      return NextResponse.json({
        success: false,
        error: 'Ad not found or access denied'
      }, { status: 404 })
    }

    // Only allow editing draft ads
    if (existingAd.status !== 'draft') {
      return NextResponse.json({
        success: false,
        error: 'Only draft ads can be edited'
      }, { status: 400 })
    }

    // Update the ad
    const { data: updatedAd, error } = await supabase
      .from('ads')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Update media if provided
    if (validatedData.media_urls) {
      // Delete existing media
      await supabase
        .from('ad_media')
        .delete()
        .eq('ad_id', id)

      // Create new media records
      const mediaRecords = validatedData.media_urls.map(url => {
        const mediaInfo = normalizeMediaUrl(url)
        return {
          ad_id: id,
          source_type: mediaInfo.sourceType,
          original_url: mediaInfo.originalUrl,
          thumbnail_url: mediaInfo.thumbnailUrl,
          validation_status: mediaInfo.validationStatus
        }
      })

      if (mediaRecords.length > 0) {
        await supabase
          .from('ad_media')
          .insert(mediaRecords)
      }
    }

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action_type: 'update',
        target_type: 'ad',
        target_id: id,
        old_value: { title: existingAd.title, description: existingAd.description },
        new_value: validatedData
      })

    return NextResponse.json({
      success: true,
      data: updatedAd
    })

  } catch (error) {
    console.error('Ad update error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Check if the ad exists and belongs to the user
    const { data: existingAd, error: fetchError } = await supabase
      .from('ads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingAd) {
      return NextResponse.json({
        success: false,
        error: 'Ad not found or access denied'
      }, { status: 404 })
    }

    // Only allow deleting draft ads
    if (existingAd.status !== 'draft') {
      return NextResponse.json({
        success: false,
        error: 'Only draft ads can be deleted'
      }, { status: 400 })
    }

    // Delete the ad (cascade will delete media, payments, etc.)
    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action_type: 'delete',
        target_type: 'ad',
        target_id: id,
        old_value: { title: existingAd.title },
        new_value: null
      })

    return NextResponse.json({
      success: true,
      message: 'Ad deleted successfully'
    })

  } catch (error) {
    console.error('Ad deletion error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
