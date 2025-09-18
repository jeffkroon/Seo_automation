import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL
    
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL niet geconfigureerd' },
        { status: 500 }
      )
    }

    console.log('Server-side webhook call to:', webhookUrl)
    console.log('Payload:', body)

    // Server-side fetch with no timeout
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    console.log('Response status:', response.status)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Webhook error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Response data:', data)

    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Server-side error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
