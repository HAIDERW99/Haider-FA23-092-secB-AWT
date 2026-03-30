import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { registerSchema } from '@/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name
        }
      }
    })

    if (authError) {
      return NextResponse.json({
        success: false,
        error: authError.message
      }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create user account'
      }, { status: 500 })
    }

    // Create user profile in our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role
      })
      .select()
      .single()

    if (userError) {
      // Rollback auth user creation
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({
        success: false,
        error: userError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        session: authData.session
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
