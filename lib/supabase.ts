import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Configure it in your environment.')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Configure it in your environment.')
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

// Export createClient for server-side usage
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
