# EzInterview — Guide de deploiement complet

## 1. Obtenir une cle API Claude

1. Va sur **https://console.anthropic.com**
2. Cree un compte (ou connecte-toi)
3. Va dans **Settings > API Keys**
4. Clique **Create Key**, copie la cle (commence par `sk-ant-...`)
5. Ajoute du credit : **Settings > Billing > Add funds** (5$ suffisent largement pour tester)

## 2. Configurer Supabase (Auth + Base de donnees)

### 2.1 Creer le projet Supabase

1. Va sur **https://supabase.com** et connecte-toi (ou cree un compte gratuit)
2. Clique **New Project**
3. Choisis un nom (ex: `ezinterview`), un mot de passe DB, et la region la plus proche (ex: `West EU (Paris)`)
4. Attends 1-2 minutes que le projet se cree

### 2.2 Recuperer les cles API

1. Dans ton projet Supabase, va dans **Settings** (icone engrenage en bas a gauche)
2. Clique **API** dans le menu
3. Copie ces 3 valeurs :
   - **Project URL** → c'est ton `NEXT_PUBLIC_SUPABASE_URL` (ex: `https://abcdef.supabase.co`)
   - **anon public** key → c'est ton `NEXT_PUBLIC_SUPABASE_ANON_KEY` (commence par `eyJ...`)
   - **service_role** key → c'est ton `SUPABASE_SERVICE_ROLE_KEY` (commence par `eyJ...`)

> **IMPORTANT** : La cle `service_role` est secrete, ne la mets JAMAIS dans du code cote client. Elle sert uniquement cote serveur (API routes).

### 2.3 Creer la table plans

1. Dans ton projet Supabase, va dans **SQL Editor** (icone terminal dans le menu de gauche)
2. Clique **New Query**
3. Copie-colle le contenu complet du fichier `supabase-setup.sql` :

```sql
-- Table des plans de preparation
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  job_url TEXT,
  job_data JSONB,
  company_info JSONB,
  profile JSONB,
  matches JSONB,
  interview_steps JSONB,
  interview_date DATE,
  next_interlocutor TEXT,
  plan_data JSONB NOT NULL,
  completed_days JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plans"
  ON plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans"
  ON plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
  ON plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans"
  ON plans FOR DELETE
  USING (auth.uid() = user_id);
```

4. Clique **Run** (bouton vert)
5. Tu devrais voir "Success. No rows returned" — c'est normal

### 2.4 Activer l'auth Email

1. Va dans **Authentication** (icone cadenas dans le menu de gauche)
2. Clique **Providers** dans le sous-menu
3. Verifie que **Email** est active (c'est le cas par defaut)
4. Optionnel : desactive **Confirm email** si tu veux que les comptes soient utilisables immediatement sans verifier l'email
   - Dans **Authentication > Settings > Email Auth**, decoche "Enable email confirmations"

### 2.5 Activer l'auth Google (optionnel mais recommande)

1. **Cote Google** :
   - Va sur **https://console.cloud.google.com**
   - Cree un nouveau projet ou selectionne un existant
   - Va dans **APIs & Services > Credentials**
   - Clique **Create Credentials > OAuth client ID**
   - Type : **Web application**
   - Nom : `EzInterview`
   - **Authorized redirect URIs** : ajoute `https://XXXXX.supabase.co/auth/v1/callback` (remplace XXXXX par l'ID de ton projet Supabase qu'on trouve dans l'URL du dashboard)
   - Clique **Create** et copie le **Client ID** et **Client Secret**

2. **Cote Supabase** :
   - Va dans **Authentication > Providers > Google**
   - Active le toggle
   - Colle le **Client ID** et **Client Secret** de Google
   - Sauvegarde

### 2.6 Configurer le redirect URL

1. Dans Supabase, va dans **Authentication > URL Configuration**
2. Dans **Site URL**, mets l'URL de ton app deployee (ex: `https://ezinterview-xxx.vercel.app`)
3. Dans **Redirect URLs**, ajoute :
   - `https://ezinterview-xxx.vercel.app` (ton URL Vercel)
   - `http://localhost:3000` (pour le dev local)

## 3. Mettre le code sur GitHub

1. Va sur **https://github.com/new** et cree un nouveau repo (ex: `ezinterview`)
2. Dans le dossier `ezinterview/` sur ton ordi, execute :

```bash
cd ezinterview
git init
git add .
git commit -m "Initial commit - EzInterview v2"
git remote add origin https://github.com/TON_USERNAME/ezinterview.git
git push -u origin main
```

## 4. Deployer sur Vercel

1. Va sur **https://vercel.com** et connecte-toi avec GitHub
2. Clique **Add New > Project**
3. Selectionne ton repo `ezinterview`
4. Dans **Environment Variables**, ajoute ces 4 variables :

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (ta cle Claude) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` (URL du projet) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (cle anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (cle service_role) |

5. Clique **Deploy**
6. En 1-2 minutes, ton app est live sur `ezinterview-xxx.vercel.app`

> **Apres le premier deploiement**, retourne dans Supabase > Authentication > URL Configuration et mets a jour le Site URL avec ton vrai domaine Vercel.

## 5. Partager avec tes amis

Envoie le lien Vercel. Chacun peut :
- Creer un compte (email ou Google)
- Coller un lien d'offre d'emploi
- Uploader son CV
- Recevoir un plan de preparation personnalise
- Retrouver ses plans en se reconnectant

## Structure du projet

```
ezinterview/
  app/
    layout.js          — Layout HTML global
    page.js            — Frontend complet (React + Auth + Plan interactif)
    lib/
      supabase.js      — Client Supabase (browser + server)
    api/
      scrape-job/      — Extraction d'offre depuis un lien
      parse-cv/        — Parsing de CV (PDF, DOCX, TXT)
      analyze/         — Matching profil/poste via Claude
      generate-plan/   — Generation du plan jour par jour (contenu riche)
      company-intel/   — Veille entreprise (actualites, concurrents)
      plans/           — CRUD plans (sauvegarde, chargement, progression)
  supabase-setup.sql   — Schema SQL a executer dans Supabase
  package.json
  next.config.js
  .env.example
```

## Couts estimes

- **Vercel** : gratuit (plan Hobby)
- **Supabase** : gratuit (plan Free — 50k auth users, 500MB DB)
- **Claude API** : ~0.03-0.10$ par utilisation complete (scrape + parse + analyze + plan)
- Avec 5$ de credit, environ 50-150 utilisations completes

## Developpement local

```bash
npm install
cp .env.example .env.local
# Remplis les 4 variables dans .env.local
npm run dev
# Ouvre http://localhost:3000
```

## Troubleshooting

**"Invalid API key"** : Verifie que les 3 cles Supabase sont bien copiees dans Vercel, sans espaces

**"auth/invalid-provider"** : Google n'est pas active dans Supabase > Authentication > Providers

**"relation plans does not exist"** : Tu n'as pas execute le SQL — va dans SQL Editor et lance supabase-setup.sql

**"RLS policy violation"** : La cle `service_role` n'est pas la bonne ou n'est pas dans les env vars Vercel

**Login Google boucle** : Verifie que l'URL de redirect dans Google Console correspond a `https://XXXXX.supabase.co/auth/v1/callback`
