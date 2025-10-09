import { createClient, type SupabaseClientOptions } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Configure it in your environment.')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Configure it in your environment.')
}

const defaultCookieOptions = {
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 365, // one year
}

/**
 * Creates a Supabase client that reads/writes auth state using Next.js request cookies.
 * This mimics the behaviour of @supabase/auth-helpers-nextjs without adding the dependency.
 */
export function createSupabaseRouteClient<Database = any>(options?: SupabaseClientOptions<Database>) {
  const cookieStore = cookies()

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    ...options,
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
      storage: {
        getItem(key) {
          return cookieStore.get(key)?.value ?? null
        },
        setItem(key, value) {
          cookieStore.set(key, value, defaultCookieOptions)
        },
        removeItem(key) {
          cookieStore.delete(key)
        },
      },
      ...options?.auth,
    },
  })
}
