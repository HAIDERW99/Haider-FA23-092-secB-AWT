import { supabase } from './supabase'

export interface User {
  id: string
  name: string
  email: string
  role: 'client' | 'moderator' | 'admin' | 'super_admin'
  status: string
  created_at: string
}

export interface AuthResponse {
  user: User | null
  error: string | null
}

export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { user: null, error: error?.message || 'No user found' }
    }

    // Get user profile from our users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return { user: null, error: profileError.message }
    }

    return { user: profile as User, error: null }
  } catch (error) {
    return { user: null, error: 'Failed to get current user' }
  }
}

export async function requireAuth(request: Request): Promise<User> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization header provided')
  }

  const token = authHeader.split(' ')[1]
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      throw new Error('Invalid token')
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('User profile not found')
    }

    return profile as User
  } catch (error) {
    throw new Error('Authentication failed')
  }
}

export function hasRole(user: User, requiredRole: string): boolean {
  const roleHierarchy = {
    'client': 0,
    'moderator': 1,
    'admin': 2,
    'super_admin': 3
  }
  
  const userLevel = roleHierarchy[user.role] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0
  
  return userLevel >= requiredLevel
}

export function canAccessRoute(user: User, pathname: string): boolean {
  if (pathname.startsWith('/dashboard/client')) {
    return hasRole(user, 'client')
  }
  
  if (pathname.startsWith('/dashboard/moderator')) {
    return hasRole(user, 'moderator')
  }
  
  if (pathname.startsWith('/dashboard/admin')) {
    return hasRole(user, 'admin')
  }
  
  return true // Public routes
}
