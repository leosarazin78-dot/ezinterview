# EntretienZen — Préparation d'Entretien Assistée par IA

**Une plateforme de préparation d'entretien personnalisée avec intelligence artificielle** — Analyse automatique de l'offre, matching de compétences, et plan jour par jour.

**Lien** : https://entretienzen.com

---

## 🎯 Fonctionnalités

- **Analyse automatique d'offre** : Scrape LinkedIn, Indeed, Welcome to the Jungle, etc. et extrait les compétences requises
- **Matching CV** : Compare ton CV aux compétences de l'offre (Acquis/Partiel/À travailler)
- **Plan personnalisé** : Génère un plan de préparation jour par jour basé sur l'intervalle jusqu'à l'entretien
- **Contenu riche** : Notes détaillées, vidéos, exercices pratiques, quizzes
- **Suivi de progression** : Valide chaque jour, vois ton bilan final avec récap des compétences
- **Responsive** : Fonctionne sur Desktop, Tablet, Mobile (testé sur Brave, Safari, Firefox, Chrome)

---

## 🛠️ Stack Technique

- **Frontend** : Next.js 14 App Router + React 18
- **Authentication** : Supabase Auth (PKCE flow)
- **Database** : Supabase PostgreSQL (EU-West)
- **API AI** : Anthropic Claude API
- **Hosting** : Vercel
- **DNS/Domain** : entretienzen.com via Vercel
- **Analytics** : Vercel Analytics (ex-Umami)

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[SETUP-GUIDE.md](./SETUP-GUIDE.md)** | Configuration locale + Supabase + environnement |
| **[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)** | Déploiement complet (GitHub + Supabase + Vercel) |

---

## 🚀 Quick Start (Local)

### 1. Cloner et installer

```bash
git clone https://github.com/toncompte/entretienzen.git
cd ezinterview
npm install
```

### 2. Configurer l'env

Copie `.env.example` en `.env.local` et remplis :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_EMAILS=contact@entretienzen.com
```

### 3. Lancer localement

```bash
npm run dev
```

Ouvre http://localhost:3000 dans ton navigateur.

---

## 📁 Structure du Projet

```
ezinterview/
├── app/
│   ├── page.js                    # App principale (Landing + Dashboard + Plan)
│   ├── layout.js                  # Layout global + SEO + JSON-LD
│   ├── lib/
│   │   ├── validation.js          # Zod schemas
│   │   ├── parse-json.js          # Extracteurs JSON robustes
│   │   ├── rate-limit.js          # Rate limiting (IP-based)
│   │   └── sanitize.js            # Sanitization des inputs
│   ├── api/
│   │   ├── analyze-job/route.js   # Scrape + analyse offre
│   │   ├── analyze-profile/route.js # Matching CV vs offre
│   │   ├── generate-plan/route.js  # Génération du plan (Claude)
│   │   ├── plans/route.js          # CRUD plans
│   │   ├── auth/                   # Auth endpoints
│   │   └── admin/                  # Admin dashboard
│   ├── auth/callback/route.js      # OAuth callback (PKCE)
│   ├── cgu/page.js                 # Conditions Générales
│   ├── confidentialite/page.js      # Politique de confidentialité
│   ├── mentions-legales/page.js     # Mentions légales
│   ├── sitemap.js                  # Sitemap SEO
│   ├── robots.js                   # Robots.txt
│   └── manifest.json               # PWA manifest
├── public/
│   ├── icon-512.png, icon-192.png  # Favicons
│   ├── apple-touch-icon.png        # iOS
│   ├── favicon.ico                 # Favicon
│   └── manifest.json               # PWA
├── package.json
├── next.config.js
├── .env.example
├── SETUP-GUIDE.md
├── DEPLOYMENT-GUIDE.md
└── README.md
```

---

## 🔑 Variables d'Environnement

| Variable | Source | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Clé anon (publique, safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | Clé secrète (côté serveur) |
| `ANTHROPIC_API_KEY` | Anthropic Console | Clé API Claude |
| `ADMIN_EMAILS` | Custom | Email(s) admin (comma-separated) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics | GA tracking ID (optionnel) |

---

## 🧪 Tests

```bash
# Tests syntaxe
npm run lint

# Build de prod (pré-test)
npm run build

# Lancer le serveur de prod localement
npm start
```

---

## 🔐 Sécurité

- **Auth** : PKCE flow (plus sécurisé que implicit)
- **Database** : RLS (Row Level Security) — chaque utilisateur ne voit que ses plans
- **Rate limiting** : Par IP, sur `/api/analyze-job` et `/api/generate-plan`
- **Input sanitization** : Zod schemas + Supabase parameterized queries
- **HTTPS** : Enforced sur Vercel et Supabase
- **CORS** : Configuré strictement (Supabase + Vercel)

---

## 📈 Déploiement

### Développement

```bash
npm run dev  # http://localhost:3000
```

### Production

Utilise Vercel avec GitHub webhooks — chaque `git push` redéploie automatiquement.

Pour un déploiement manuel :

```bash
npm run build
npm start
```

Voir **[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)** pour la procédure complète.

---

## 🐛 Troubleshooting

### Build échoue localement ?

```bash
rm -rf node_modules .next
npm install
npm run build
```

### PKCE code exchange fails ?

- Vérifie que `localStorage` n'est pas bloqué (Brave Shields)
- Vérifie Redirect URLs dans Supabase
- Teste sur Chrome/Firefox comme fallback

### Emails ne s'envoient pas ?

- Vérifie SMTP dans Supabase (Custom SMTP Settings)
- Teste la connexion SMTP avec telnet
- Vérifie que `contact@entretienzen.com` existe et a accès aux App Passwords

---

## 📧 Support

Pour toute question ou bug : **contact@entretienzen.com**

---

## 📜 Licence

Proprietary — EntretienZen © 2024-2026

---

## 🙋 Crédits

- **Frontend** : Claude (Anthropic)
- **Infra** : Vercel, Supabase, Google Cloud
- **AI** : Claude API (Anthropic)

---

## 🎯 Roadmap

- [ ] Mobile app native (React Native)
- [ ] Simulation d'entretien vidéo (avec feedback IA)
- [ ] Intégration Calendly
- [ ] Rappels par email/SMS
- [ ] Historique des préparations
- [ ] Partage de plans (anonymisé)
- [ ] Statistiques publiques

---

**Happy interviewing! 🚀**
