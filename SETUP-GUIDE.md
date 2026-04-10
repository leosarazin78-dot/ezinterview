# EntretienZen — Guide de configuration complet

## 1. Umami Analytics (RGPD, sans cookies)

### Pourquoi rien ne s'affiche ?
Vérifie ces points dans l'ordre :

#### A. Variables d'environnement Vercel
Va dans **Vercel > Settings > Environment Variables** et vérifie :

```
NEXT_PUBLIC_UMAMI_URL = https://cloud.umami.is/script.js
NEXT_PUBLIC_UMAMI_WEBSITE_ID = 385a2626-da7c-44cd-aabf-6faca0a35352
```

**ATTENTION** : après avoir ajouté/modifié des variables, tu DOIS **redéployer** le projet (Deployments > Redeploy).

#### B. Vérifier sur Umami Cloud
1. Va sur https://cloud.umami.is
2. Connecte-toi à ton compte
3. Dans **Settings > Websites**, vérifie que ton site est bien ajouté
4. Le **Website ID** doit correspondre exactement à `385a2626-da7c-44cd-aabf-6faca0a35352`
5. Le **domaine** doit être `entretienzen.com` (sans https://)

#### C. Vérifier que le script se charge
1. Va sur ton site https://entretienzen.com
2. Ouvre les **DevTools** (F12 ou Cmd+Option+I)
3. Onglet **Network** > filtre par "umami" ou "script.js"
4. Recharge la page — tu devrais voir une requête vers `cloud.umami.is/script.js`
5. Si la requête est **bloquée** → un adblocker la bloque. Désactive-le pour tester.

#### D. Vérifier les données
1. Sur Umami Cloud, va dans ton **Dashboard**
2. Les données apparaissent avec un léger délai (~30 secondes)
3. Teste avec une **navigation privée** pour être sûr

#### E. Problèmes courants
- **Adblocker** : uBlock Origin, Brave Shield, etc. bloquent Umami Cloud
- **Variables non redéployées** : les vars NEXT_PUBLIC_ sont injectées au BUILD, pas au runtime
- **Domaine non ajouté** : si le domaine dans Umami Settings ne matche pas l'URL du site

---

## 2. Google Search Console (SEO — apparaître sur Google)

### Pourquoi ton site n'apparaît pas sur Google ?
Google met **1 à 4 semaines** pour indexer un nouveau site. Voici comment accélérer :

### Étapes :
1. Va sur https://search.google.com/search-console
2. Clique **"Ajouter une propriété"**
3. Choisis **"Préfixe de l'URL"** et entre : `https://entretienzen.com`
4. Pour la **vérification**, choisis **"Balise HTML"**
   - Google te donne un code type : `<meta name="google-site-verification" content="XXXXX" />`
   - Copie uniquement la valeur du `content` (le `XXXXX`)
5. Dans **Vercel > Settings > Environment Variables**, ajoute :
   ```
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION = XXXXX
   ```
6. **Redéploie** le projet
7. Retourne sur Search Console et clique **"Vérifier"**

### Soumettre le sitemap :
1. Dans Search Console, va dans **"Sitemaps"** (menu gauche)
2. Entre : `https://entretienzen.com/sitemap.xml`
3. Clique **"Envoyer"**

### Demander l'indexation :
1. Dans Search Console, va dans **"Inspection de l'URL"**
2. Entre ton URL : `https://entretienzen.com`
3. Clique **"Demander l'indexation"**

---

## 3. Connexion Gmail (Google OAuth)

### Étape 1 : Configurer Google Cloud Console
1. Va sur https://console.cloud.google.com
2. Crée un nouveau projet (ou utilise un existant)
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

### Étape 2 : Configurer Supabase
1. Va dans **Supabase > Authentication > Providers**
2. Active **Google**
3. Colle le **Client ID** et **Client Secret**
4. Sauvegarde

### Étape 3 : Configurer l'écran de consentement OAuth
1. Dans Google Cloud Console, va dans **APIs & Services > OAuth consent screen**
2. Choisis **"External"** (pour que tout le monde puisse se connecter)
3. Remplis les infos :
   - App name : **EntretienZen**
   - User support email : ton email
   - Developer contact : ton email
4. Ajoute les scopes : `email`, `profile`, `openid`
5. Ajoute ton email comme **Test user** (tant que l'app est en mode "Testing")
6. **IMPORTANT** : Pour que TOUT LE MONDE puisse se connecter, tu dois **publier l'app** :
   - Va dans OAuth consent screen > clique **"Publish App"**
   - Ça passe en mode "Production" (pas besoin de vérification Google pour les scopes basiques)

### Vérification
- Teste sur ton site : le bouton "Continuer avec Google" doit ouvrir le popup Google
- Si erreur "redirect_uri_mismatch" → vérifie que l'URI dans Google Cloud correspond EXACTEMENT à celle de Supabase

---

## 4. Variables d'environnement Vercel (récapitulatif)

```env
# Supabase (déjà configuré)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Umami Analytics
NEXT_PUBLIC_UMAMI_URL=https://cloud.umami.is/script.js
NEXT_PUBLIC_UMAMI_WEBSITE_ID=385a2626-da7c-44cd-aabf-6faca0a35352

# Google Search Console
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=ta-valeur-ici

# Anthropic (déjà configuré)
ANTHROPIC_API_KEY=sk-ant-...

# Admin
ADMIN_SECRET=ton-secret-admin
```

**Rappel** : après chaque changement de variable, il faut **redéployer** sur Vercel.
