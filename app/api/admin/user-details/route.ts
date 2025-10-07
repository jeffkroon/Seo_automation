import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { userIds } = await req.json()
    
    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'User IDs array is required' }, { status: 400 })
    }

    // Get user details from auth.users
    const userDetails = await Promise.all(
      userIds.map(async (userId: string) => {
        try {
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
          
          if (authError) {
            console.error(`Error fetching user ${userId}:`, authError)
            return { id: userId, email: `user-${userId.substring(0, 8)}` }
          }
          
          return {
            id: userId,
            email: authUser?.user?.email || `user-${userId.substring(0, 8)}`
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error)
          return { id: userId, email: `user-${userId.substring(0, 8)}` }
        }
      })
    )

    return NextResponse.json({ userDetails })
  } catch (error: any) {
    console.error('Error fetching user details:', error)
    return NextResponse.json({ error: error?.message || 'Onbekende fout' }, { status: 500 })
  }
}
