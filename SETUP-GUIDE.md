# EntretienZen — Guide de configuration complet

---

## 1. EMAILS SUPABASE (CRITIQUE — localhost:3000)

### Pourquoi les emails renvoient vers localhost:3000 ?
Supabase utilise une variable "Site URL" pour construire les liens dans les emails (confirmation, reset password, magic link). Par defaut elle est `http://localhost:3000`.

### FIX (2 minutes) :

#### A. Changer le Site URL
1. Va sur **https://supabase.com/dashboard**
2. Ouvre ton projet
3. Va dans **Authentication > URL Configuration**
4. Change **Site URL** en : `https://entretienzen.com`
5. Dans **Redirect URLs**, ajoute :
   ```
   https://entretienzen.com
   https://entretienzen.com/**
   https://entretienzen.com/admin
   https://entretienzen.com/auth/callback
   ```
6. **Sauvegarde**

#### B. Personnaliser les templates email
1. Va dans **Authentication > Email Templates**
2. Pour chaque template (Confirm signup, Reset Password, Magic Link), remplace le contenu :

**Confirm signup** :
```html
<h2>Bienvenue sur EntretienZen !</h2>
<p>Confirme ton email pour acceder a ta preparation d'entretien personnalisee.</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#7C5CFC,#5B8DEF);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">Confirmer mon email</a></p>
<p style="color:#888;font-size:12px;">Si tu n'as pas cree de compte, ignore cet email.</p>
<p style="color:#888;font-size:12px;">— L'equipe EntretienZen</p>
```

**Reset Password** :
```html
<h2>Reinitialisation de ton mot de passe</h2>
<p>Tu as demande a changer ton mot de passe sur EntretienZen.</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#7C5CFC,#5B8DEF);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">Changer mon mot de passe</a></p>
<p style="color:#888;font-size:12px;">Si tu n'as pas fait cette demande, ignore cet email.</p>
<p style="color:#888;font-size:12px;">— L'equipe EntretienZen</p>
```

**Magic Link** :
```html
<h2>Ton lien de connexion</h2>
<p>Clique sur le bouton pour te connecter a EntretienZen.</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#7C5CFC,#5B8DEF);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">Se connecter</a></p>
<p style="color:#888;font-size:12px;">Ce lien expire dans 1 heure.</p>
<p style="color:#888;font-size:12px;">— L'equipe EntretienZen</p>
```

3. **Changer le nom d'expediteur** (IMPORTANT — les utilisateurs voient "Supabase Auth" par defaut) :
   - Va dans **Authentication > SMTP Settings**
   - Active **"Enable Custom SMTP"**
   - Remplis :
     - **Sender email** : `contact@entretienzen.com`
     - **Sender name** : `EntretienZen`
     - **Host** : SMTP de ton fournisseur email (ex: `smtp.gmail.com` si Google Workspace, ou le SMTP de ton hébergeur de domaine)
     - **Port** : `465` (SSL) ou `587` (TLS)
     - **Username** : `contact@entretienzen.com`
     - **Password** : le mot de passe de l'adresse ou un "App Password"
   - **Sauvegarde**

   > Avec cette config, les emails arriveront de "EntretienZen <contact@entretienzen.com>"
   > au lieu de "Supabase Auth <noreply@mail.app.supabase.io>"

   Si tu utilises Google Workspace pour contact@entretienzen.com :
   1. Va sur https://myaccount.google.com/security
   2. Assure-toi que la **verification en 2 etapes** est activee
   3. Va sur https://myaccount.google.com/apppasswords
   4. Genere un mot de passe pour "Mail" > "Other" > tape "EntretienZen SMTP"
   5. Copie le mot de passe (16 caracteres, sans espaces)
   6. Colle-le dans le champ **Password** de Supabase SMTP

   > **ATTENTION** : sans SMTP custom, les emails :
   > - Arrivent de "Supabase Auth" (pas professionnel)
   > - Peuvent atterrir dans les spams
   > - Ont un taux de delivrabilite plus faible
   > Configurer le SMTP est donc FORTEMENT recommande.

#### C. Verifier que ca marche
1. Apres avoir sauvegarde, teste :
   - Inscription : un email de confirmation doit arriver avec un lien vers `entretienzen.com`
   - Reset password : le lien doit rediriger vers `entretienzen.com#reset-password`
   - Magic link (admin) : doit rediriger vers `entretienzen.com/admin`

---

## 2. Google Search Console (SEO — apparaitre sur Google)

### Pourquoi ton site n'apparait pas sur Google ?
Google met **1 a 4 semaines** pour indexer un nouveau site. Voici comment accelerer :

### Etapes :
1. Va sur https://search.google.com/search-console
2. Clique **"Ajouter une propriete"**
3. Choisis **"Prefixe de l'URL"** et entre : `https://entretienzen.com`
4. Pour la **verification**, choisis **"Balise HTML"**
   - Google te donne un code type : `<meta name="google-site-verification" content="XXXXX" />`
   - Copie uniquement la valeur du `content` (le `XXXXX`)
5. Dans **Vercel > Settings > Environment Variables**, ajoute :
   ```
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION = XXXXX
   ```
6. **Redeploie** le projet
7. Retourne sur Search Console et clique **"Verifier"**

### Soumettre le sitemap :
1. Dans Search Console, va dans **"Sitemaps"** (menu gauche)
2. Entre : `https://entretienzen.com/sitemap.xml`
3. Clique **"Envoyer"**

### Demander l'indexation (faire pour CHAQUE page) :
1. Dans Search Console, va dans **"Inspection de l'URL"**
2. Entre : `https://entretienzen.com`
3. Clique **"Demander l'indexation"**
4. Attends la confirmation
5. Repete pour `https://entretienzen.com/admin` si tu veux

### Accelerer l'indexation :
- Partage le lien sur tes reseaux (LinkedIn, Twitter) — les crawlers Google suivent ces liens
- Ajoute le site sur Google My Business si applicable
- Cree un profil LinkedIn avec un lien vers entretienzen.com
- Le delai moyen est 3-7 jours si le sitemap est soumis

### Verifier l'etat :
- Dans Search Console > "Couverture" tu verras quelles pages sont indexees
- Recherche `site:entretienzen.com` sur Google pour voir les pages indexees

### Changer le logo/icone dans les resultats Google :

Google utilise le **favicon** du site comme icone dans les resultats de recherche.
Le code est deja configure pour utiliser le bon fichier. Voici comment le personnaliser :

1. **Le favicon est deja genere** dans `/public/` :
   - `favicon.ico` (32x32) — icone navigateur
   - `icon-192.png` (192x192) — icone Google Search
   - `icon-512.png` (512x512) — icone haute resolution
   - `apple-touch-icon.png` (180x180) — icone iPhone/iPad

2. **Pour changer le logo** : remplace ces fichiers dans `/public/` par tes propres images.
   - Le format doit etre **PNG** (fond transparent OK)
   - Taille minimale recommandee par Google : **48x48 px**
   - Taille ideale : **512x512 px** (Google redimensionne)
   - Le fichier le plus important est `icon-512.png` — c'est celui utilise par Google et le JSON-LD

3. **Forcer Google a re-scanner le favicon** :
   - Va dans **Google Search Console > Inspection de l'URL**
   - Entre `https://entretienzen.com`
   - Clique **"Demander l'indexation"**
   - Google mettra a jour le favicon dans les resultats sous **quelques jours a 2 semaines**

4. **Pour un logo custom** (ex: depuis Canva ou Figma) :
   - Cree un logo carre 512x512 avec fond de couleur (pas transparent pour Google)
   - Exporte en PNG
   - Renomme-le `icon-512.png` et mets-le dans `/public/`
   - Redimensionne aussi en 192x192 → `icon-192.png`, 180x180 → `apple-touch-icon.png`, 32x32 → `favicon-32.png`
   - Pour generer le `.ico` : utilise https://favicon.io/favicon-converter/

> **Note** : Google peut mettre 2-4 semaines pour afficher le nouveau favicon dans les resultats.
> C'est normal, il n'y a pas moyen d'accelerer ce processus.

---

## 3. Connexion Gmail (Google OAuth)

### Etape 1 : Configurer Google Cloud Console
1. Va sur https://console.cloud.google.com
2. Cree un nouveau projet (ou utilise un existant)
3. Active l'API : **APIs & Services > Library > cherche "Google Identity"** et active-le
4. Va dans **APIs & Services > Credentials**
5. Clique **"Create Credentials" > "OAuth 2.0 Client ID"**
6. Choisis **"Web application"**
7. Ajoute dans **Authorized redirect URIs** :
   ```
   https://<TON-PROJET-REF>.supabase.co/auth/v1/callback
   ```
   (Trouve ton Project Ref dans Supabase > Settings > General)
8. Copie le **Client ID** et **Client Secret**

### Etape 2 : Configurer Supabase
1. Va dans **Supabase > Authentication > Providers**
2. Active **Google**
3. Colle le **Client ID** et **Client Secret**
4. Sauvegarde

### Etape 3 : Ecran de consentement OAuth (CRITIQUE — ce qui s'affiche a l'utilisateur)

C'est ici que tu changes le nom qui apparait dans la popup Google ("Se connecter avec...").
Par defaut, Google affiche l'ID du projet (ex: "prj-12345"). Il faut le changer :

1. Dans Google Cloud Console : **APIs & Services > OAuth consent screen**
2. Choisis **"External"**
3. Remplis :
   - **App name** : `EntretienZen` ← C'EST CE NOM QUI S'AFFICHE aux utilisateurs
   - **App logo** : upload ton logo (optionnel mais recommande, 120x120px)
   - **App home page** : `https://entretienzen.com`
   - **App privacy policy** : `https://entretienzen.com` (ou une page dediee)
   - **App terms of service** : `https://entretienzen.com`
   - User support email : `contact@entretienzen.com`
   - Developer contact : `contact@entretienzen.com`
4. **Scopes** (informations demandees a l'utilisateur) — ne coche QUE :
   - `email` — pour identifier l'utilisateur
   - `profile` — pour le prenom/nom
   - `openid` — pour l'authentification
   (Ne demande PAS d'acces au Drive, Agenda, etc. — ca effraie les utilisateurs)
5. **PUBLIER L'APP** : OAuth consent screen > **"Publish App"** (sinon seuls les test users peuvent se connecter)

> **Note** : Apres avoir publie, Google peut mettre 24-48h pour verifier ton app. En attendant,
> les utilisateurs verront un ecran "Cette application n'est pas verifiee" mais pourront continuer
> via "Parametres avances > Acceder a entretienzen.com".

### Si erreur "redirect_uri_mismatch" :
- L'URI dans Google Cloud DOIT etre EXACTEMENT : `https://<TON-PROJET-REF>.supabase.co/auth/v1/callback`
- Pas de slash final, pas de http, pas de localhost

---

## 4. Vercel Analytics (zero-config, automatique)

Vercel Analytics est integre directement dans le code via `@vercel/analytics/next`.
Aucune variable d'environnement a configurer — c'est automatique sur Vercel.

### Activer dans le dashboard Vercel :
1. Va sur https://vercel.com/dashboard
2. Selectionne ton projet **entretienzen**
3. Va dans **Analytics** (menu gauche)
4. Clique **"Enable"** si pas deja actif
5. Tu verras les pages vues, visiteurs uniques, pays, devices, etc.

### Avantages vs Umami :
- Zero config, pas de variable d'env
- Integre dans Vercel (meme dashboard que le deploy)
- Web Vitals (LCP, FID, CLS) inclus
- Conforme RGPD (pas de cookies)

### Anciennes variables Umami a supprimer dans Vercel :
```
NEXT_PUBLIC_UMAMI_URL        ← SUPPRIMER
NEXT_PUBLIC_UMAMI_WEBSITE_ID ← SUPPRIMER
```

---

## 5. Variables d'environnement Vercel (recapitulatif)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Search Console
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=ta-valeur-ici

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Admin (liste des emails admin, separes par des virgules)
ADMIN_EMAILS=contact@entretienzen.com

# (Vercel Analytics = automatique, pas de variable necessaire)
# (Umami supprime — supprimer NEXT_PUBLIC_UMAMI_URL et NEXT_PUBLIC_UMAMI_WEBSITE_ID si encore presentes)
```

**Rappel** : apres chaque changement de variable, il faut **redeployer** sur Vercel (Deployments > Redeploy).
