import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()

    // Test database connection with a simple query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    const responseTime = Date.now() - startTime

    if (error) {
      // Log the health check failure
      await supabase
        .from('system_health_logs')
        .insert({
          source: 'db_health_check',
          response_ms: responseTime,
          status: 'error'
        })

      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        response_time: responseTime,
        status: 'unhealthy'
      }, { status: 503 })
    }

    // Log successful health check
    await supabase
      .from('system_health_logs')
      .insert({
        source: 'db_health_check',
        response_ms: responseTime,
        status: 'healthy'
      })

    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        response_time: responseTime,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Health check error:', error)
    
    // Log the health check failure
    try {
      await supabase
        .from('system_health_logs')
        .insert({
          source: 'db_health_check',
          response_ms: 0,
          status: 'error'
        })
    } catch (logError) {
      console.error('Failed to log health check:', logError)
    }

    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      status: 'unhealthy'
    }, { status: 503 })
  }
}
