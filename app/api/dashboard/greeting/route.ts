import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { userEmail, timeOfDay, stats } = await req.json()

    // Extract first name from email (before @ and before any dots/numbers)
    const emailPrefix = userEmail?.split('@')[0] || 'daar'
    const firstName = emailPrefix
      .split(/[._-]/)[0]  // Split on dots, underscores, dashes
      .replace(/[0-9]/g, '')  // Remove numbers
      .charAt(0).toUpperCase() + emailPrefix.split(/[._-]/)[0].slice(1)  // Capitalize

    const prompt = `Je bent een vriendelijke AI assistent voor een SEO content platform. Genereer een korte, persoonlijke en motiverende groet (max 2 zinnen) voor ${firstName}.

Tijd van de dag: ${timeOfDay}
Statistieken:
- Totaal artikelen: ${stats.totalArticles}
- Artikelen deze maand: ${stats.articlesThisMonth}
- Projecten: ${stats.totalProjects}

Maak het persoonlijk, enthousiast en motiverend. Gebruik emojis. Wees kort en krachtig. Spreek ${firstName} direct aan met hun naam.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent een vriendelijke, enthousiaste AI assistent die korte, persoonlijke groeten maakt. Gebruik emojis en wees motiverend.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.9,
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

