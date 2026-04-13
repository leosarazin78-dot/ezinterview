# Guide de Déploiement Complet — EntretienZen

**Pour déployer EntretienZen sur une nouvelle infrastructure (GitHub + Supabase + Vercel)**

---

## 📋 Checklist Préalable

- [ ] Domain `entretienzen.com` actif et pointant vers Vercel
- [ ] Email `contact@entretienzen.com` créé et fonctionnel
- [ ] Compte GitHub (gratuit ou payant)
- [ ] Compte Supabase (gratuit)
- [ ] Compte Vercel (gratuit, connecté via GitHub)
- [ ] Compte Google Cloud Console (pour OAuth)
- [ ] Compte Anthropic avec clé API active
- [ ] Google Workspace ou service email pour SMTP

---

## ⚙️ 1. CRÉER LE REPOSITORY GITHUB

### Étape 1 : Initialiser le repo

```bash
# Clone ou crée le repo
cd /chemin/vers/ezinterview
git init
git add .
git commit -m "Initial commit: EntretienZen application"

# Ajoute le remote GitHub
git remote add origin https://github.com/toncompte/entretienzen.git
git branch -M main
git push -u origin main
```

### Fichiers à IGNORER (.gitignore)

```
node_modules/
.env
.env.local
.env.*.local
.next/
out/
build/
dist/
*.log
.DS_Store
.vscode/
.idea/
.env.example (optionnel — à garder si les infos sont publiques)
```

### Dossier Racine du Repo

```
ezinterview/
├── app/
├── public/
├── .github/
├── .gitignore
├── package.json
├── next.config.js
├── SETUP-GUIDE.md
├── DEPLOYMENT-GUIDE.md
├── .env.example
└── README.md
```

---

## 🗄️ 2. CONFIGURER SUPABASE

### Étape 1 : Créer le projet Supabase

1. Va sur https://app.supabase.com
2. Clique **"New Project"**
3. Remplis :
   - **Project name** : `EntretienZen`
   - **Database password** : Génère un mot de passe fort (32+ caractères) → **GARDE-LE EN SÛRETÉ**
   - **Region** : `eu-west-1` (Irlande) — conforme RGPD
4. Clique **"Create new project"** (attends ~2 min)

### Étape 2 : Récupérer les clés API

1. Va dans **Settings → API**
2. Copie :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (clé) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (clé secrète) → `SUPABASE_SERVICE_ROLE_KEY`

### Étape 3 : Configurer l'authentification

#### A. Ajouter le callback OAuth

1. Va dans **Authentication → URL Configuration**
2. Clique **"Edit Configuration"**
3. Ajoute dans **Redirect URLs** :
   ```
   https://entretienzen.com/auth/callback
   https://entretienzen.com
   http://localhost:3000/auth/callback
   ```
4. Sauvegarde

#### B. Ajouter Google OAuth

1. Va dans **Authentication → Providers → Google**
2. Active **"Enable Sign in with Google"**
3. Remplis :
   - **Client ID** : (voir section "Google Cloud Console" ci-dessous)
   - **Client Secret** : (voir section "Google Cloud Console" ci-dessous)
4. Sauvegarde

#### C. Configurer le SMTP personnalisé

1. Va dans **Authentication → SMTP Settings**
2. Clique **"Enable Custom SMTP"**
3. Remplis :
   - **Sender email** : `contact@entretienzen.com`
   - **Sender name** : `EntretienZen`
   - **Host** : (voir instructions Google Workspace ci-dessous)
   - **Port** : `465` (SSL) ou `587` (TLS)
   - **Username** : `contact@entretienzen.com`
   - **Password** : App Password Google ou mot de passe email
4. **Sauvegarde**

#### D. Personnaliser les templates email

1. Va dans **Authentication → Email Templates**
2. Pour chaque template (**Confirm signup, Reset Password, Magic Link**), remplace le contenu :

**Template : Confirm signup**
```html
<h2>Bienvenue sur EntretienZen !</h2>
<p>Confirme ton email pour accéder à ta préparation d'entretien personnalisée.</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#7C5CFC,#5B8DEF);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">Confirmer mon email</a></p>
<p style="color:#888;font-size:12px;">Si tu n'as pas créé de compte, ignore cet email.</p>
<p style="color:#888;font-size:12px;">— L'équipe EntretienZen</p>
```

**Template : Reset Password**
```html
<h2>Réinitialisation de mot de passe</h2>
<p>Tu as demandé à changer ton mot de passe sur EntretienZen.</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#7C5CFC,#5B8DEF);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">Changer mon mot de passe</a></p>
<p style="color:#888;font-size:12px;">Si tu n'as pas fait cette demande, ignore cet email.</p>
<p style="color:#888;font-size:12px;">— L'équipe EntretienZen</p>
```

**Template : Magic Link**
```html
<h2>Lien de connexion sécurisé</h2>
<p>Clique ci-dessous pour te connecter à EntretienZen :</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#7C5CFC,#5B8DEF);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">Me connecter</a></p>
<p style="color:#888;font-size:12px;">Ce lien expire dans 1 heure.</p>
<p style="color:#888;font-size:12px;">— L'équipe EntretienZen</p>
```

### Étape 4 : Créer les tables Supabase

Copie-colle ce SQL dans **SQL Editor → New Query** et exécute :

```sql
-- Users (géré par Supabase Auth, on enrichit juste les metadata)

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title VARCHAR(255),
  company VARCHAR(255),
  interview_date DATE,
  plan_data JSONB,
  job_data JSONB,
  stats JSONB,
  completed_days JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_plans_user_id ON plans(user_id);
CREATE INDEX idx_plans_created_at ON plans(created_at DESC);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Policy : chaque utilisateur ne voit que ses propres plans
CREATE POLICY "Users can only see their own plans"
  ON plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own plans"
  ON plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own plans"
  ON plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own plans"
  ON plans FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 🔐 3. GOOGLE CLOUD CONSOLE (OAuth)

### Étape 1 : Créer un projet GCP

1. Va sur https://console.cloud.google.com
2. Crée un **New Project** → Nom : `EntretienZen`

### Étape 2 : Activer les APIs

1. **APIs & Services → Library**
2. Cherche **"Google+ API"** → Clique → **Enable**
3. Cherche **"OAuth 2.0"** → Clique → **Enable** (si demandé)

### Étape 3 : Configurer le consentement OAuth

1. **APIs & Services → OAuth consent screen**
2. Choisis **"External"** (utilisateurs externes)
3. Remplis :
   - **App name** : `EntretienZen`
   - **User support email** : `contact@entretienzen.com`
   - **App logo** : Upload ton logo (optionnel)
   - **App home page** : `https://entretienzen.com`
   - **App privacy policy** : `https://entretienzen.com/confidentialite`
   - **App terms of service** : `https://entretienzen.com/cgu`
   - **Developer contact** : `contact@entretienzen.com`
4. **Scopes** → Ajoute :
   - `email`
   - `profile`
   - `openid`
4. **Sauvegarde et continue**

### Étape 4 : Créer les identifiants OAuth

1. **APIs & Services → Credentials**
2. Clique **"Create Credentials" → OAuth 2.0 Client IDs**
3. Type : **Web application**
4. Remplis :
   - **Name** : `EntretienZen Web`
   - **Authorized JavaScript origins** :
     ```
     https://entretienzen.com
     http://localhost:3000
     ```
   - **Authorized redirect URIs** :
     ```
     https://entretienzen.com/auth/callback
     http://localhost:3000/auth/callback
     ```
5. Clique **Create**
6. **Copie immédiatement** :
   - **Client ID** → `GOOGLE_OAUTH_CLIENT_ID` (Supabase + optionnel local)
   - **Client Secret** → `GOOGLE_OAUTH_CLIENT_SECRET` (Supabase + optionnel local)

### Étape 5 : Valider l'app OAuth

1. **OAuth consent screen → Test users (optionnel)**
   - Ajoute `contact@entretienzen.com` pour tester en local avant publication
2. **Publish App** (pour production) — rend l'OAuth disponible à tous les utilisateurs

---

## 🚀 4. VERCEL (Déploiement)

### Étape 1 : Connecter GitHub à Vercel

1. Va sur https://vercel.com
2. Clique **"New Project"**
3. Clique **"Import Git Repository"**
4. Autorise Vercel à accéder à GitHub
5. Sélectionne ton repo `entretienzen`

### Étape 2 : Configurer le projet

**Framework Preset** : `Next.js`  
**Build Command** : `npm run build` (défaut OK)  
**Output Directory** : `.next` (défaut OK)  
**Install Command** : `npm install` (défaut OK)

### Étape 3 : Ajouter les variables d'environnement

1. Clique **Settings → Environment Variables**
2. Ajoute toutes ces variables (voir section ci-dessous)
3. Clique **Save**

### Étape 4 : Configurer le domaine

1. **Settings → Domains**
2. Ajoute `entretienzen.com`
3. Change tes DNS nameservers vers Vercel (ou ajoute les records CNAME)

### Étape 5 : Déployer

1. Clique **"Deploy"** (déclenche le build)
2. Attends que le déploiement soit ✅ (2-3 min)

---

## 🔑 5. VARIABLES D'ENVIRONNEMENT

### Pour Vercel (Production)

**Dans : Settings → Environment Variables → Add**

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-...

# Admin
ADMIN_EMAILS=contact@entretienzen.com

# Google Analytics (optionnel — récupère sur Google Analytics)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**Production scope** : Sélectionne `Production` pour chaque variable.

### Pour Local (.env.local)

Crée un fichier `.env.local` à la racine du projet :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_EMAILS=contact@entretienzen.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 📧 6. CONFIGURER SMTP (Google Workspace)

### Si tu utilises Google Workspace pour contact@entretienzen.com

**Option A : App Password (recommandé)**

1. Va sur https://myaccount.google.com/security
2. Active **"2-Step Verification"** (si pas déjà fait)
3. Va sur https://myaccount.google.com/apppasswords
4. Sélectionne **"Mail"** → **"Other (custom name)"** → tape `EntretienZen SMTP`
5. Google génère un mot de passe 16 caractères
6. Copie ce mot de passe → **Supabase Authentication > SMTP Settings > Password**

**Option B : Utiliser directement le mot de passe du compte**

- **Host** : `smtp.gmail.com`
- **Port** : `465` (SSL) ou `587` (TLS)
- **Username** : `contact@entretienzen.com`
- **Password** : Ton mot de passe Google Workspace

### Si tu utilises un autre fournisseur email

Remplace les paramètres SMTP ci-dessus par ceux de ton fournisseur (ex: Mailgun, SendGrid, OVH, etc.)

---

## 🔄 7. PROCESSUS DE DÉPLOIEMENT COMPLET

### Depuis Zéro (5-10 min)

```bash
# 1. Push vers GitHub
git push origin main

# 2. Vercel se redéploie automatiquement (via webhook GitHub)
# Vérifie : https://vercel.com → Projects → EntretienZen → Deployments

# 3. Test en prod
# Ouvre : https://entretienzen.com
# Teste inscription + Google OAuth
```

### Après un changement local

```bash
# 1. Modifie le code localement
# 2. Commit et push
git add .
git commit -m "Fix: [description courte]"
git push origin main

# 3. Vercel redéploie automatiquement (webhook GitHub)
# 4. Attends le ✅ sur Vercel
```

---

## ✅ 8. CHECKLIST DE VALIDATION

### Avant le lancement public

- [ ] **GitHub** : Repo créé avec tout le code
- [ ] **Supabase** :
  - [ ] Projet créé dans eu-west-1
  - [ ] Tables créées (plans + RLS)
  - [ ] Google OAuth configuré (client ID + secret)
  - [ ] Custom SMTP configuré (contact@entretienzen.com)
  - [ ] Email templates personnalisés
  - [ ] Redirect URLs ajoutées
- [ ] **Google Cloud Console** :
  - [ ] OAuth consent screen rempli
  - [ ] App publiée
  - [ ] Client ID/Secret en sûreté
- [ ] **Vercel** :
  - [ ] Projet importé depuis GitHub
  - [ ] Variables d'environnement ajoutées
  - [ ] Domaine entretienzen.com configuré
  - [ ] Déploiement ✅
- [ ] **Tests** :
  - [ ] Accès au site : https://entretienzen.com ✅
  - [ ] Inscription par email ✅
  - [ ] Google OAuth (test user) ✅
  - [ ] Reset password (email reçu) ✅
  - [ ] Création de plan ✅
  - [ ] Génération du plan (Anthropic) ✅
  - [ ] Progression et bilan ✅
  - [ ] Sur Brave, Firefox, Safari, Chrome ✅

---

## 🆘 Troubleshooting

| Problème | Solution |
|----------|----------|
| **"Invalid client ID" Google OAuth** | Vérifie les origins/redirects dans GCP Console |
| **Emails ne s'envoient pas** | Vérifie SMTP dans Supabase + App Password Google valide |
| **Session utilisateur perd après redirection** | Vérifie Redirect URLs dans Supabase (inclure /auth/callback) |
| **Erreur "NEXT_PUBLIC_SUPABASE_URL undefined"** | Vérifie .env.local ou variables Vercel (doit commencer par NEXT_PUBLIC_) |
| **Vercel build échoue** | Vérifie `npm install` et `npm run build` localement d'abord |
| **PKCE code exchange échoue sur Brave** | Vérifier que localStorage n'est pas bloqué par Brave shields |

---

## 📝 Fichiers à créer/adapter

Crée un `.env.example` à la racine (à commiter, sans vraies clés) :

```
# .env.example — copie ce fichier en .env.local et remplis les valeurs

# Supabase (obtenir sur https://app.supabase.com → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic (obtenir sur https://console.anthropic.com → API keys)
ANTHROPIC_API_KEY=sk-ant-...

# Admin (pour accès au dashboard admin /admin)
ADMIN_EMAILS=contact@entretienzen.com

# Google Analytics (optionnel — obtenir sur https://analytics.google.com)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 🎉 Voilà !

Ton app EntretienZen est maintenant en production sur `https://entretienzen.com` !

Pour tout redéploiement futur, il suffit de :
1. Commit et push sur GitHub
2. Vercel se redéploie automatiquement

Bon déploiement ! 🚀
