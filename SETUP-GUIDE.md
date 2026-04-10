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

3. Dans **SMTP Settings** (optionnel mais recommande pour eviter les spams) :
   - Active "Enable Custom SMTP"
   - Host : `smtp.gmail.com`
   - Port : `465`
   - Username : ton email Gmail
   - Password : un "App Password" Google (pas ton mot de passe normal)
   
   Pour creer un App Password Gmail :
   1. Va sur https://myaccount.google.com/apppasswords
   2. Connecte-toi
   3. Genere un mot de passe pour "Mail" > "Other" > "Supabase"
   4. Copie le mot de passe (16 caracteres)
   5. Colle-le dans le champ Password de Supabase SMTP

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
   - User support email : ton email
   - Developer contact : ton email
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

## 4. Umami Analytics (RGPD, sans cookies)

### Variables Vercel :
```
NEXT_PUBLIC_UMAMI_URL = https://cloud.umami.is/script.js
NEXT_PUBLIC_UMAMI_WEBSITE_ID = 385a2626-da7c-44cd-aabf-6faca0a35352
```

### Sur Umami Cloud (https://cloud.umami.is) :
- Le domaine doit etre `entretienzen.com` (sans https://)
- Le Website ID doit matcher

### Redeploy apres changement de variables.

---

## 5. Variables d'environnement Vercel (recapitulatif)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Umami Analytics
NEXT_PUBLIC_UMAMI_URL=https://cloud.umami.is/script.js
NEXT_PUBLIC_UMAMI_WEBSITE_ID=385a2626-da7c-44cd-aabf-6faca0a35352

# Google Search Console
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=ta-valeur-ici

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Admin (liste des emails admin, separes par des virgules)
ADMIN_EMAILS=leo.sarazin78@gmail.com
```

**Rappel** : apres chaque changement de variable, il faut **redeployer** sur Vercel (Deployments > Redeploy).
