import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { questionQuerySchema } from '@/schemas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = questionQuerySchema.parse(query)

    let queryBuilder = supabase
      .from('learning_questions')
      .select('*')
      .eq('is_active', true)

    if (validatedQuery.topic) {
      queryBuilder = queryBuilder.eq('topic', validatedQuery.topic)
    }

    if (validatedQuery.difficulty) {
      queryBuilder = queryBuilder.eq('difficulty', validatedQuery.difficulty)
    }

    // Get random question
    const { data: questions, error } = await queryBuilder

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No questions found'
      }, { status: 404 })
    }

    // Select random question
    const randomIndex = Math.floor(Math.random() * questions.length)
    const randomQuestion = questions[randomIndex]

    return NextResponse.json({
      success: true,
      data: randomQuestion
    })

  } catch (error) {
    console.error('Random question fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
