# SEO Automation Platform

Een AI-gestuurde SEO automatisering tool voor het genereren van geoptimaliseerde content die je zoekmachine rankings verbetert.

## 🚀 Features

- **AI-Gestuurde Content Generatie**: Genereer automatisch drie SEO-geoptimaliseerde artikelen
- **Multi-taal Ondersteuning**: Ondersteuning voor Nederlands, Engels, Duits, Frans en Spaans
- **Regionale Optimalisatie**: Content aangepast voor verschillende landen en regio's
- **Focus Keyword Optimalisatie**: Geoptimaliseerd voor specifieke zoekwoorden
- **Modern UI**: Gebruiksvriendelijke interface gebouwd met Next.js en Tailwind CSS

## 🛠️ Technologie Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Icons**: Lucide React
- **Forms**: React Hook Form met Zod validatie
- **Deployment**: Vercel-ready

## 📦 Installatie

1. Clone de repository:
```bash
git clone git@github.com:jeffkroon/Seo_automation.git
cd Seo_automation
```

2. Installeer dependencies:
```bash
pnpm install
```

3. Start de development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in je browser.

## 🔧 Configuratie

### Environment Variables

Maak een `.env.local` bestand aan in de root directory:

```env
NEXT_PUBLIC_WEBHOOK_URL=your_webhook_url_here
```

### Webhook Integratie

Het platform ondersteunt webhook integratie voor AI content generatie. Configureer je webhook URL in de environment variables.

## 📝 Gebruik

1. **Vul de SEO Parameters in**:
   - Focus Keyword (Focus Zoekwoord)
   - Land/Regio
   - Taal
   - Bedrijfsnaam
   - Website URL

2. **Genereer Content**: Klik op "Genereer 3 SEO Artikelen"

3. **Bekijk Resultaten**: De gegenereerde artikelen worden getoond met HTML content

## 🏗️ Project Structuur

```
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── content-generation-form.tsx
│   ├── article-results.tsx
│   ├── header.tsx
│   └── loading-state.tsx
├── lib/                  # Utility functions
└── public/               # Static assets
```

## 🚀 Deployment

### Vercel (Aanbevolen)

1. Push je code naar GitHub
2. Verbind je repository met Vercel
3. Configureer environment variables
4. Deploy automatisch

### Andere Platforms

Het project is compatibel met alle Next.js hosting platforms:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork de repository
2. Maak een feature branch (`git checkout -b feature/amazing-feature`)
3. Commit je changes (`git commit -m 'Add amazing feature'`)
4. Push naar de branch (`git push origin feature/amazing-feature`)
5. Open een Pull Request

## 📄 License

Dit project is gelicenseerd onder de MIT License - zie het [LICENSE](LICENSE) bestand voor details.

## 📞 Support

Voor vragen of ondersteuning, open een issue in de GitHub repository of neem contact op via:

- Email: jeffkroon@example.com
- GitHub: [@jeffkroon](https://github.com/jeffkroon)

## 🔮 Roadmap

- [ ] Keyword research integratie
- [ ] Competitor analysis tools
- [ ] Content performance tracking
- [ ] Bulk content generation
- [ ] SEO score analysis
- [ ] Multi-platform publishing

---

**Gemaakt met ❤️ voor SEO professionals**
