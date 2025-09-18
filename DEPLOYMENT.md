# Deployment Guide

## Voorbereiding voor hosting

Je Next.js app is klaar voor deployment! Hier zijn de stappen:

### 1. Build testen
De app is al getest en bouwt succesvol:
```bash
pnpm install
pnpm run build
```

### 2. Environment variabelen
Configureer de webhook URL voor artikel generatie:

**Voor lokale ontwikkeling:**
Maak een `.env.local` file aan:
```
NEXT_PUBLIC_WEBHOOK_URL=http://localhost:3000/api/generate-articles
```

**Voor productie:**
Stel de volgende environment variabelen in in je hosting platform:
```
NEXT_PUBLIC_WEBHOOK_URL=https://jouw-webhook-url.com/api/generate
WEBHOOK_API_KEY=jouw-api-key (optioneel)
```

**Webhook integratie:**
- De app roept nu een echte webhook aan in plaats van mock data
- Fallback naar mock data in development mode
- Error handling voor webhook failures

### 3. Hosting opties

#### Vercel (Aanbevolen voor Next.js)
1. Push je code naar GitHub/GitLab
2. Ga naar [vercel.com](https://vercel.com)
3. Import je repository
4. Vercel detecteert automatisch dat het een Next.js project is
5. Deploy!

#### Netlify
1. Push je code naar een Git repository
2. Ga naar [netlify.com](https://netlify.com)
3. Connect je repository
4. Build settings:
   - Build command: `pnpm run build`
   - Publish directory: `out` (als je static export gebruikt) of `.next` (voor server-side rendering)

#### Railway
1. Ga naar [railway.app](https://railway.app)
2. Connect je GitHub repository
3. Railway detecteert automatisch Next.js
4. Deploy!

#### VPS/Server
1. Upload je code naar de server
2. Installeer Node.js en pnpm
3. Run:
   ```bash
   pnpm install
   pnpm run build
   pnpm start
   ```

### 4. Domain en SSL
- Configureer je custom domain in je hosting platform
- SSL certificaten worden meestal automatisch afgehandeld

### 5. Monitoring
Je app heeft al Vercel Analytics geïnstalleerd voor monitoring.

## Status
✅ Build werkt correct  
✅ Dependencies geïnstalleerd  
✅ Ready for deployment  

Je app is klaar om live te gaan!
