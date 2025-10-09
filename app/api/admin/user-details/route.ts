import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(req: Request) {
  try {
    const { userIds } = await req.json()
    
    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'User IDs array is required' }, { status: 400 })
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 })
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get user details from auth.users
    const userDetails = await Promise.all(
      userIds.map(async (userId: string) => {
        try {
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
          
          if (authError) {
            console.error(`Error fetching user ${userId}:`, authError)
            return { id: userId, email: `user-${userId.substring(0, 8)}`, email_confirmed_at: null }
          }
          
          return {
            id: userId,
            email: authUser?.user?.email || `user-${userId.substring(0, 8)}`,
            email_confirmed_at: authUser?.user?.email_confirmed_at || null
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error)
          return { id: userId, email: `user-${userId.substring(0, 8)}`, email_confirmed_at: null }
        }
      })
    )

    return NextResponse.json({ userDetails })
  } catch (error: any) {
    console.error('Error fetching user details:', error)
    return NextResponse.json({ error: error?.message || 'Onbekende fout' }, { status: 500 })
  }
}
