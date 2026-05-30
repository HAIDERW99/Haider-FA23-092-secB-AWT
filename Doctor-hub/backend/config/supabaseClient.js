import { createClient } from '@supabase/supabase-js'

let supabase = null

if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
        auth: { persistSession: false },
        db: { schema: 'public' },
    })
} else {
    console.warn('Missing Supabase env vars: SUPABASE_URL and SUPABASE_KEY')
}

export function requireSupabase() {
    if (!supabase) {
        throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY.')
    }
    return supabase
}

// Retry wrapper for Supabase queries
// Usage: const result = await withRetry(db => db.from('table').select('*'))
const withRetry = async (queryFn, retries = 3, delay = 500) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const db = requireSupabase()
            const result = await queryFn(db)
            if (result.error) throw result.error
            return result
        } catch (err) {
            if (attempt === retries) throw err
            await new Promise(res => setTimeout(res, delay * attempt))
        }
    }
}

export { withRetry }
export default supabase
