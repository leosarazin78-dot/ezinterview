# ⚡ Quick Deploy Checklist — 15 minutes

**Pour déployer EntretienZen en production rapidement. Voir DEPLOYMENT-GUIDE.md pour les détails.**

---

## ✅ PRÉ-REQUIS (5 min)

- [ ] Domain `entretienzen.com` prêt
- [ ] Email `contact@entretienzen.com` actif
- [ ] Comptes créés : GitHub, Supabase, Vercel, Google Cloud, Anthropic

---

## 📋 SUPABASE (2 min)

1. **Créer un projet** : https://app.supabase.com → New Project
   - Region: `eu-west-1`
   - Save password somewhere safe

2. **Copier les clés** : Settings → API
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
   SUPABASE_SERVICE_ROLE_KEY = eyJ...
   ```

3. **Créer les tables** : SQL Editor → copie-colle du DEPLOYMENT-GUIDE → Execute

4. **Ajouter les Redirect URLs** : Authentication → URL Configuration
   ```
   https://entretienzen.com/auth/callback
   https://entretienzen.com
   http://localhost:3000/auth/callback
   ```

5. **Configurer Google OAuth** : (voir DEPLOYMENT-GUIDE section 3)

6. **Activer Custom SMTP** : Authentication → SMTP Settings
   ```
   Sender email: contact@entretienzen.com
   Sender name: EntretienZen
   ```

---

## 🔐 GOOGLE CLOUD CONSOLE (2 min)

1. https://console.cloud.google.com → New Project → `EntretienZen`

2. APIs & Services → Library → Enable **Google+ API**

3. OAuth consent screen → External → Remplis infos + Publish

4. Credentials → Create → OAuth 2.0 Client ID (Web)
   ```
   Origins: https://entretienzen.com, http://localhost:3000
   Redirect URIs: https://entretienzen.com/auth/callback, http://localhost:3000/auth/callback
   ```

5. Copie **Client ID** et **Client Secret** → Ajoute dans Supabase Google OAuth

---

## 🚀 GITHUB (1 min)

1. https://github.com → New → `entretienzen`

2. ```bash
   cd ezinterview
   git init
   git add .
   git commit -m "Initial commit: EntretienZen"
   git remote add origin https://github.com/toncompte/entretienzen.git
   git branch -M main
   git push -u origin main
   ```

---

## 🌐 VERCEL (3 min)

1. https://vercel.com → New Project → Import GitHub → Select `entretienzen`

2. Framework: **Next.js** (auto-detected)

3. **Environment Variables** → Add all from `.env.example`:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ANTHROPIC_API_KEY
   ADMIN_EMAILS=contact@entretienzen.com
   NEXT_PUBLIC_GA_ID
   ```

4. **Deploy** → Wait for ✅

5. **Settings → Domains** → Add `entretienzen.com` → Update DNS records

---

## 📧 SMTP (1 min — optionnel mais important)

**Si tu as Google Workspace** :
1. https://myaccount.google.com/security → 2-Step Verification (enable if not done)
2. https://myaccount.google.com/apppasswords → Mail → Other → `EntretienZen SMTP`
3. Copie le mot de passe → Supabase SMTP Settings → Password

---

## 🧪 TEST (1 min)

- [ ] https://entretienzen.com charge ✅
- [ ] Signup par email ✅
- [ ] Google OAuth (fonctionne) ✅
- [ ] Reset password email reçu ✅

---

## 🎉 DÉPLOIEMENT FUTUR

Chaque changement :
```bash
git commit -m "Fix: description"
git push origin main
# Vercel redéploie automatiquement via webhook
```

---

## 🆘 SOS

| Problème | Fix |
|----------|-----|
| OAuth fails | Vérifie origins/redirects dans GCP + Supabase |
| Emails don't send | SMTP settings dans Supabase + App Password valide |
| Build fails | `npm install && npm run build` localement d'abord |
| Domain not working | Attends 24h + vérifie les DNS nameservers Vercel |

---

**C'est parti ! 🚀**
