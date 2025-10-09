import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { 
      userEmail, 
      timeOfDay, 
      stats, 
      browser, 
      isDarkMode, 
      isReturning,
      deviceType,
      hour 
    } = await req.json()

    // Extract first name from email
    const emailPrefix = userEmail?.split('@')[0] || 'daar'
    const firstName = emailPrefix
      .split(/[._-]/)[0]
      .replace(/[0-9]/g, '')
      .charAt(0).toUpperCase() + emailPrefix.split(/[._-]/)[0].slice(1)

    // Build context for AI
    const contextParts = []
    
    // Time context
    if (hour >= 0 && hour < 6) {
      contextParts.push("het is midden in de nacht")
    } else if (hour >= 22) {
      contextParts.push("het is laat in de avond")
    }
    
    // Browser/device context
    if (browser) contextParts.push(`gebruikt ${browser}`)
    if (isDarkMode) contextParts.push("heeft dark mode aan")
    if (deviceType === 'mobile') contextParts.push("is op mobiel")
    
    // Behavior context
    if (isReturning) {
      contextParts.push("is een terugkerende gebruiker")
    } else {
      contextParts.push("is nieuw")
    }
    
    // Stats context
    if (stats.articlesThisMonth === 0) {
      contextParts.push("heeft nog geen artikelen deze maand")
    } else if (stats.articlesThisMonth > 10) {
      contextParts.push(`heeft al ${stats.articlesThisMonth} artikelen deze maand gemaakt`)
    }

    const context = contextParts.join(", ")

    const prompt = `Je bent een brutaal eerlijke, grappige AI assistent voor een SEO content platform. Je hebt een scherpe, sarcastische humor maar blijft vriendelijk.

Gebruiker: ${firstName}
Context: ${context}
Tijd: ${timeOfDay} (${hour}:00 uur)
Stats: ${stats.totalArticles} artikelen totaal, ${stats.articlesThisMonth} deze maand, ${stats.totalProjects} projecten

INSTRUCTIES:
- Maak een korte, pakkende groet (max 2 zinnen)
- Wees brutaal eerlijk en grappig, maar niet gemeen
- Gebruik de context op een slimme, onverwachte manier
- Als het laat is + dark mode: maak een grap over "nog aan het werk?"
- Als ze veel artikelen hebben: complimenteer op een sarcastische manier
- Als ze weinig hebben: motiveer op een brutale maar grappige manier
- Gebruik emojis strategisch
- Spreek ${firstName} direct aan

Voorbeelden van de tone:
- "Goedemorgen ${firstName}! Chrome, dark mode, 3 uur 's nachts — SEO wacht niet op slaap, toch? 😅"
- "Welkom terug ${firstName}. ${stats.articlesThisMonth} artikelen deze maand? Iemand is on fire 🔥"
- "Hey ${firstName}, laat in de avond nog even checken? We zien je dedication 👀"

Genereer NU een unieke groet in deze stijl:`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent een brutaal eerlijke, sarcastische maar vriendelijke AI assistent. Je maakt slimme grappen over gebruikersgedrag en context. Wees kort, pakkend en onverwacht.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 1.0,
    })

    const greeting = completion.choices[0]?.message?.content || `Goedemorgen ${firstName}! 🌟`

    return NextResponse.json({ greeting })
  } catch (error: any) {
    console.error('Error generating greeting:', error)
    // Fallback greeting
    const body = await req.json().catch(() => ({ userEmail: '', timeOfDay: 'dag' }))
    const emailPrefix = body.userEmail?.split('@')[0] || 'daar'
    const firstName = emailPrefix.split(/[._-]/)[0].charAt(0).toUpperCase() + emailPrefix.split(/[._-]/)[0].slice(1)
    return NextResponse.json({ 
      greeting: `Goed${body.timeOfDay} ${firstName}! 👋 Klaar om vandaag weer geweldige content te maken?` 
    })
  }
}

export const dynamic = 'force-dynamic'

