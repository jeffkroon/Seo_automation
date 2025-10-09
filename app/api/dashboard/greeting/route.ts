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
      hour,
      stats, 
      context
    } = await req.json()

    // Extract first name from email
    const emailPrefix = userEmail?.split('@')[0] || 'there'
    const firstName = emailPrefix
      .split(/[._-]/)[0]
      .replace(/[0-9]/g, '')
      .charAt(0).toUpperCase() + emailPrefix.split(/[._-]/)[0].slice(1)

    // Build rich context string for AI
    const contextDetails = []
    
    // Device & Browser
    if (context.platform) contextDetails.push(`${context.platform} user`)
    if (context.browser) contextDetails.push(`on ${context.browser}`)
    if (context.deviceType === 'mobile') contextDetails.push(`mobile device`)
    
    // Dark mode
    if (context.isDarkMode) contextDetails.push(`dark mode enabled`)
    
    // Battery (IMPORTANT!)
    if (context.battery) {
      contextDetails.push(`battery: ${context.battery.level}%, ${context.battery.charging ? 'charging' : 'not charging'}`)
    }
    
    // Location (if available) - use region for better accuracy
    if (context.location) {
      if (context.location.region && context.location.country) {
        contextDetails.push(`somewhere around ${context.location.region}, ${context.location.country}`)
      } else if (context.location.country) {
        contextDetails.push(`in ${context.location.country}`)
      }
    }
    
    // Time & Timezone
    if (context.timezone) contextDetails.push(`timezone: ${context.timezone}`)
    if (context.localTime) contextDetails.push(`local time: ${context.localTime}`)
    
    // Behavior
    if (context.visitCount > 1) contextDetails.push(`visit #${context.visitCount}`)
    else contextDetails.push(`first visit`)
    
    if (context.referrerSource && context.referrerSource !== 'direct') {
      contextDetails.push(`came from ${context.referrerSource}`)
    }
    
    if (context.timeOnSite > 0) {
      contextDetails.push(`${context.timeOnSite}s on site`)
    }
    
    // Connection
    if (context.connectionType && context.connectionType !== 'unknown') {
      contextDetails.push(`${context.connectionType} connection`)
    }

    const fullContext = contextDetails.join(", ")

    const prompt = `You're a brutally honest, witty AI assistant with "spionage energy". You notice EVERYTHING about the user and make clever, unexpected jokes about it.

User: ${firstName}
Context: ${fullContext}
Time: ${timeOfDay} (${hour}:00)
Stats: ${stats.totalArticles} articles total, ${stats.articlesThisMonth} this month, ${stats.totalProjects} projects

AVAILABLE CONTEXT (full data):
${JSON.stringify(context, null, 2)}

PRIORITY CONTEXT (use these MORE often):
${context.battery ? `🔋 BATTERY: ${context.battery.level}%, ${context.battery.charging ? 'charging' : 'NOT charging'} - USE THIS 40% OF THE TIME!` : '⚠️ NO BATTERY INFO - DO NOT MENTION BATTERY!'}
${context.location?.region ? `📍 LOCATION: Somewhere around ${context.location.region}, ${context.location.country} - USE THIS 30% OF THE TIME!` : context.location?.country ? `📍 LOCATION: ${context.location.country}` : '📍 LOCATION: Unknown - use timezone instead: ${context.timezone}'}
${hour >= 22 || hour < 6 ? `🌙 LATE NIGHT: ${hour}:00 ${context.isDarkMode ? '+ dark mode' : ''} - USE THIS 20% OF THE TIME!` : ''}

OTHER INTERESTING DETAILS (use these too):
- Referrer: ${context.referrerSource}
- Visit #${context.visitCount}
- ${context.deviceType} on ${context.browser}
- ${context.connectionType} connection
- ${context.timeOnSite}s on site

INSTRUCTIONS:
- Pick 1-2 details (prioritize battery/location/late night but mix it up!)
- Create a short, punchy greeting (max 2 sentences)
- Be brutally honest, sarcastic, but friendly
- Make them think "wow, they're watching me" 👀
- Use emojis strategically
- Address ${firstName} directly

BATTERY EXAMPLES (ONLY use if battery info is available!):
${context.battery ? `- "Battery ${context.battery.level}% and ${context.battery.charging ? 'charging' : 'not charging'}? ${firstName}, ${context.battery.level < 20 && !context.battery.charging ? "you'd better plug in before you optimize everything" : context.battery.level > 80 ? "fully charged and ready — let's boost those rankings" : "let's make this count"} 🔋⚡"` : '- DO NOT USE BATTERY EXAMPLES - NO BATTERY INFO AVAILABLE'}
${context.battery ? `- "${firstName}, ${context.battery.level}% battery${context.battery.charging ? ', charging' : ''} — ${context.battery.level < 15 ? 'living dangerously' : context.battery.level > 90 ? 'fully loaded' : 'good to go'} 🔋"` : ''}

LOCATION EXAMPLES:
- "Good ${timeOfDay} from somewhere around ${context.location?.region || 'your area'}, ${firstName}! 🌍 ${stats.articlesThisMonth} articles this month — local legend vibes 🔥"
- "${firstName}... somewhere around ${context.location?.region || 'the Netherlands'}, ${hour}:00, ${context.browser} — we see you 👀"
- "Greetings from ${context.location?.region || 'your region'}, ${firstName}! Close enough, right? 😏"

LATE NIGHT + DARK MODE EXAMPLES:
- "${firstName}, dark mode, ${hour}:00 — SEO doesn't sleep, does it? 🌙"
- "Still working at ${hour}:00, ${firstName}? Dedication level: insane 🔥"

MIX IT UP! Don't always use the same pattern. Be creative and unexpected.
do not use too much emojis

Generate NOW:`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a brutally honest, sarcastic but friendly AI assistant. You make clever jokes about user behavior and context. Be short, punchy and unexpected.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 1.0,
    })

    const greeting = completion.choices[0]?.message?.content || `Good morning ${firstName}! 🌟`

    return NextResponse.json({ greeting })
  } catch (error: any) {
    console.error('Error generating greeting:', error)
    // Fallback greeting
    const body = await req.json().catch(() => ({ userEmail: '', timeOfDay: 'morning', hour: 9 }))
    const emailPrefix = body.userEmail?.split('@')[0] || 'there'
    const firstName = emailPrefix.split(/[._-]/)[0].charAt(0).toUpperCase() + emailPrefix.split(/[._-]/)[0].slice(1)
    return NextResponse.json({ 
      greeting: `Good ${body.timeOfDay} ${firstName}! 👋 Ready to create some amazing content?` 
    })
  }
}

export const dynamic = 'force-dynamic'

