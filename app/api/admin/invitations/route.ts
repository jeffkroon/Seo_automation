import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    // Get all invitations for this company
    const invitations = await supabaseRest<any[]>(
      'invitations',
      { 
        headers: { 'x-company-id': companyId },
        searchParams: { 
          company_id: `eq.${companyId}`,
          order: 'created_at.desc'
        } 
      },
    )

    return NextResponse.json({ invitations })
  } catch (error: any) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: error?.message || 'Onbekende fout' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const body = await req.json()
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    const { email, role = 'user', clientIds } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is verplicht' }, { status: 400 })
    }

    // Validate viewer has at least one client
    if (role === 'viewer' && (!clientIds || clientIds.length === 0)) {
      return NextResponse.json({ error: 'Minimaal één client is verplicht voor viewer rol' }, { status: 400 })
    }

    // Skip user existence check - we'll handle this during registration

    // Check if invitation already exists
    const existingInvitations = await supabaseRest<any[]>(
      'invitations',
      { 
        headers: { 'x-company-id': companyId },
        searchParams: { 
          email: `eq.${email}`,
          company_id: `eq.${companyId}`,
          used_at: 'is.null'
        }
      },
    )

    if (existingInvitations && existingInvitations.length > 0) {
      return NextResponse.json({ 
        error: 'Er is al een uitnodiging verstuurd naar dit email adres.' 
      }, { status: 409 })
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex')

    // Create invitation
    const invitationBody: any = {
      email: email.toLowerCase(),
      company_id: companyId,
      invited_by: req.headers.get('x-user-id') || 'unknown',
      role: role,
      token: token
    }

    // Add client_ids for viewers
    if (role === 'viewer' && clientIds && clientIds.length > 0) {
      invitationBody.client_ids = clientIds
    }

    const invitation = await supabaseRest(
      'invitations',
      {
        method: 'POST',
        headers: { 'x-company-id': companyId },
        body: invitationBody
      }
    )

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lionfish-app-es8ks.ondigitalocean.app'
    const invitationLink = `${baseUrl}/auth/register?token=${token}`

    // Send invitation email
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@lionfish-app-es8ks.ondigitalocean.app',
        to: email,
        subject: 'Uitnodiging voor MarketingCompanion',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">MarketingCompanion</h1>
              </div>
              
              <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Je bent uitgenodigd! 🎉</h2>
                
                <p style="font-size: 16px; color: #555;">
                  Je bent uitgenodigd om lid te worden van een team op <strong>MarketingCompanion</strong>, 
                  het professionele SEO automation platform.
                </p>
                
                <p style="font-size: 16px; color: #555;">
                  Klik op de knop hieronder om je account aan te maken en aan de slag te gaan:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invitationLink}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 14px 32px; 
                            text-decoration: none; 
                            border-radius: 8px; 
                            font-weight: 600; 
                            font-size: 16px;
                            display: inline-block;
                            box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                    Account aanmaken
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #777; margin-top: 30px;">
                  Of kopieer deze link in je browser:
                </p>
                <p style="font-size: 12px; color: #999; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px;">
                  ${invitationLink}
                </p>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                  Deze uitnodiging is verstuurd naar ${email}. 
                  Als je deze uitnodiging niet verwacht had, kun je deze email negeren.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p>© 2024 MarketingCompanion. All rights reserved.</p>
              </div>
            </body>
          </html>
        `
      })
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError)
      // Continue even if email fails - return the link so admin can manually share it
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Uitnodiging succesvol aangemaakt en verzonden.',
      invitation: {
        ...invitation,
        invitation_link: invitationLink
      }
    })
  } catch (error: any) {
    console.error('Error creating invitation:', error)
    return NextResponse.json({ error: error?.message || 'Onbekende fout' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const body = await req.json()
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    const { invitationId } = body

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is verplicht' }, { status: 400 })
    }

    // Delete invitation
    await supabaseRest(
      'invitations',
      {
        method: 'DELETE',
        headers: { 'x-company-id': companyId },
        searchParams: {
          id: `eq.${invitationId}`,
          company_id: `eq.${companyId}`
        }
      }
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Uitnodiging succesvol verwijderd.' 
    })
  } catch (error: any) {
    console.error('Error deleting invitation:', error)
    return NextResponse.json({ error: error?.message || 'Onbekende fout' }, { status: 500 })
  }
}
