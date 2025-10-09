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
${context.battery ? `🔋 BATTERY: ${context.battery.level}%, ${context.battery.charging ? 'charging' : 'NOT charging'} - USE THIS 35% OF THE TIME!` : '⚠️ NO BATTERY INFO - DO NOT MENTION BATTERY AT ALL!'}
${context.location?.region ? `📍 REGION: ${context.location.region} (NEVER mention city, ONLY region!) - USE THIS 25% OF THE TIME!` : ''}
${hour >= 22 || hour < 6 ? `🌙 LATE NIGHT: ${hour}:00 ${context.isDarkMode ? '+ dark mode' : ''} - USE THIS 15% OF THE TIME!` : ''}

OTHER DETAILS:
- Referrer: ${context.referrerSource}
- Visit #${context.visitCount}
- ${context.deviceType} on ${context.browser}

TWO GREETING STYLES (alternate 50/50):

STYLE 1: PERSONAL CONTEXT (50% of greetings)
Use battery, region, time, browser, etc. Make it personal and creepy-cool.
${context.battery ? `- "Battery ${context.battery.level}%${context.battery.charging ? ', charging' : ', not charging'}, ${firstName}. ${context.battery.level < 20 && !context.battery.charging ? "Better plug in before you optimize everything." : context.battery.level > 80 ? "Fully charged — let's boost those rankings." : "Let's make this count."}"` : ''}
- "${firstName}, ${context.location?.region || 'your region'}, ${hour}:00, ${context.browser}${context.isDarkMode ? ', dark mode' : ''} — we see you."
${hour >= 22 || hour < 6 ? `- "Still working at ${hour}:00, ${firstName}? SEO doesn't sleep."` : ''}

STYLE 2: BRUTAL SEO ONE-LINERS (50% of greetings)
Confident, witty, value-driven. CAN mix in context (battery, time, region) with SEO confidence!
- "Your meta description's fine, ${firstName}. Mine would just convert better."
- "${firstName}, you create. I elevate. ${stats.articlesThisMonth} articles this month — let's make them rank."
- "Good ${timeOfDay}, ${firstName}. You've done the hard work — I make it count."
- "Your keywords are solid, ${firstName}. I turn solid into first page."
${context.battery && context.battery.level < 20 ? `- "Battery ${context.battery.level}%, ${firstName}. Your content's running low on potential too — let me charge both up."` : ''}
${hour >= 22 ? `- "Still optimizing at ${hour}:00, ${firstName}? Your dedication's solid. Your rankings could be too."` : ''}
- "You write for humans and search engines? I optimize for both perfectly, ${firstName}."
- "You're ranking, ${firstName}. I make sure you stay there."
- "Think of me as your ranking co-pilot, ${firstName}. ${stats.totalProjects} projects — ready for takeoff?"
- "${firstName}, you bring ideas. I bring visibility. ${stats.totalArticles} articles — let's get them seen."
${context.location?.region ? `- "Good ${timeOfDay} from ${context.location.region}, ${firstName}. You write. I rank. Simple."` : ''}
- "Your SEO's clean, ${firstName}. I make it clever."
- "You got indexed, ${firstName}. I get you found."
- "Your content's doing okay, ${firstName}. I make 'okay' obsolete."
- "You've optimized your structure, ${firstName} — now let's optimize your results."
- "Not bad, ${firstName}. But your title tag could pull more clicks with a little help from me."

COMBINED (powerful!):
${context.battery ? `- "Battery ${context.battery.level}%, ${firstName}. Your content's at 67% potential too — let me optimize both."` : ''}
- "${context.location?.region || 'Your region'}, ${hour}:00. You write. I rank. Simple, ${firstName}."

RULES:
- NEVER mention city, ONLY region (e.g., "Noord-Holland" not "Aalsmeer")
- If no battery: DO NOT mention battery at all
- Alternate between Style 1 (personal) and Style 2 (SEO one-liner)
- Max 2 sentences
- Minimal emojis (0-2 max)
- Be unexpected

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

