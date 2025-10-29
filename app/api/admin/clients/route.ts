// app/api/admin/clients/route.ts
import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

export async function GET(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    const userRole = req.headers.get('x-user-role')
    
    console.log('🔄 GET /api/admin/clients:', { companyId, userId, userRole })
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    // Viewers: only show their assigned clients
    if (userRole === 'viewer' && userId) {
      const viewerClients = await supabaseRest<any[]>(
        'viewer_clients',
        {
          headers: { 'x-company-id': companyId },
          searchParams: {
            user_id: `eq.${userId}`,
            select: 'client_id,clients(id,naam,website_url,sitemap_url,notities)'
          }
        }
      )

      const clients = viewerClients?.map((vc: any) => vc.clients).filter(Boolean) || []
      return NextResponse.json({ clients })
    }

    // Owners and admins: show all company clients
    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get all clients for this company
    const clients = await supabaseRest<any[]>(
      'clients',
      { 
        headers: { 'x-company-id': companyId },
        searchParams: { 
          company_id: `eq.${companyId}`,
          order: 'naam.asc'
        } 
      },
    )

    console.log('🔄 Clients fetched:', clients?.length || 0, 'clients')
    return NextResponse.json({ clients: clients || [] })
  } catch (error: any) {
    console.error('Error in GET /api/admin/clients:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    const userRole = req.headers.get('x-user-role')
    
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'Authentication headers missing' }, { status: 400 })
    }

    // Check if user is owner or admin
    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()
    const { naam, website_url, sitemap_url, notities } = body

    if (!naam || !naam.trim()) {
      return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })
    }

    // Create client
    const clients = await supabaseRest<any[]>(
      'clients',
      {
        method: 'POST',
        headers: { 
          'x-company-id': companyId,
          'Prefer': 'return=representation'
        },
        body: {
          company_id: companyId,
          naam: naam.trim(),
          website_url: website_url?.trim() || null,
          sitemap_url: sitemap_url?.trim() || null,
          notities: notities?.trim() || null,
          created_by: userId
        }
      },
    )

    const client = Array.isArray(clients) ? clients[0] : clients

    return NextResponse.json({ client }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/admin/clients:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    // Check if user is owner or admin
    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()
    const { id, naam, website_url, sitemap_url, notities } = body

    if (!id) {
      return NextResponse.json({ error: 'Client ID is verplicht' }, { status: 400 })
    }

    if (!naam || !naam.trim()) {
      return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })
    }

    // Update client
    const clients = await supabaseRest<any[]>(
      'clients',
      {
        method: 'PATCH',
        headers: { 
          'x-company-id': companyId,
          'Prefer': 'return=representation'
        },
        searchParams: {
          id: `eq.${id}`,
          company_id: `eq.${companyId}` // Ensure client belongs to user's company
        },
        body: {
          naam: naam.trim(),
          website_url: website_url?.trim() || null,
          sitemap_url: sitemap_url?.trim() || null,
          notities: notities?.trim() || null,
          updated_at: new Date().toISOString()
        }
      },
    )

    const client = Array.isArray(clients) ? clients[0] : clients

    return NextResponse.json({ client })
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/clients:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    // Check if user is owner or admin
    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Client ID is verplicht' }, { status: 400 })
    }

    // Delete client
    await supabaseRest(
      'clients',
      {
        method: 'DELETE',
        headers: { 'x-company-id': companyId },
        searchParams: {
          id: `eq.${id}`,
          company_id: `eq.${companyId}` // Ensure client belongs to user's company
        }
      },
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/clients:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
