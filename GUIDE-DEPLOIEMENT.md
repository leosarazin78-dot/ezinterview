# Guide de déploiement — EntretienZen (prepentretien.fr)

## 1. Nom de domaine

Tu as le choix entre OVH (français, support FR) et Namecheap (moins cher, en anglais). Puisque tu cibles le marché FR, prends les deux :

- `prepentretien.fr` → domaine principal (~7€/an chez OVH)
- `prepentretien.com` → redirect vers .fr (~10€/an chez Namecheap)

**Chez OVH (recommandé pour .fr) :**
1. Va sur https://www.ovh.com/fr/domaines/
2. Recherche `prepentretien.fr`
3. Achète le domaine (prends juste le domaine, pas l'hébergement OVH)
4. Dans l'espace client OVH → Domaines → Zone DNS, configure les enregistrements ci-dessous

## 2. Configuration DNS (vers Scaleway)

Puisque tu as de l'hébergement gratuit chez Scaleway, voici les options :

### Option A : Scaleway Serverless Containers (recommandé pour Next.js)

Scaleway propose des Serverless Containers parfaits pour Next.js. Tu dois d'abord dockeriser l'app.

**Dockerfile à créer à la racine du projet :**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**Dans `next.config.js`, ajoute :**
```js
module.exports = {
  output: 'standalone',
};
```

**Déploiement sur Scaleway :**
1. Installe le CLI Scaleway : `brew install scw` (ou `curl -s https://raw.githubusercontent.com/scaleway/scaleway-cli/master/scripts/get.sh | sh`)
2. `scw init` → configure avec ton token API Scaleway
3. Crée un namespace Serverless Containers dans la console Scaleway
4. Build et push l'image Docker :
```bash
docker build -t rg.fr-par.scw.cloud/ton-namespace/entretienzen:latest .
docker push rg.fr-par.scw.cloud/ton-namespace/entretienzen:latest
```
5. Crée le container dans la console Scaleway → Serverless → Containers
6. Configure les variables d'environnement (voir section 5)

**DNS chez OVH :**
```
Type    Nom     Valeur
CNAME   @       ton-container-id.functions.fnc.fr-par.scw.cloud.
CNAME   www     ton-container-id.functions.fnc.fr-par.scw.cloud.
```

### Option B : Scaleway Instance (VPS classique)

Si tu préfères un VPS classique :

1. Crée une instance DEV1-S (gratuit dans le free tier)
2. SSH dessus, installe Node.js 20, clone ton repo
3. `npm install && npm run build && npm start`
4. Configure Nginx en reverse proxy + Certbot pour SSL

**DNS chez OVH :**
```
Type    Nom     Valeur
A       @       IP_DE_TON_INSTANCE
CNAME   www     prepentretien.fr.
```

**Nginx config (`/etc/nginx/sites-available/entretienzen`) :**
```nginx
server {
    server_name prepentretien.fr www.prepentretien.fr;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Puis :
```bash
sudo ln -s /etc/nginx/sites-available/entretienzen /etc/nginx/sites-enabled/
sudo certbot --nginx -d prepentretien.fr -d www.prepentretien.fr
sudo systemctl reload nginx
```

## 3. SSL

- **Scaleway Serverless Containers** : SSL automatique, rien à faire
- **Scaleway Instance** : `sudo certbot --nginx` (voir ci-dessus), renouvellement auto avec `certbot renew`

## 4. Redirect www → racine

- **Nginx** : ajouter dans la config :
```nginx
server {
    server_name www.prepentretien.fr;
    return 301 https://prepentretien.fr$request_uri;
}
```

- **Scaleway Serverless** : configurer le custom domain avec les deux entrées, la redirect se fait côté DNS (CNAME www → @)

## 5. Variables d'environnement

Configure ces variables dans ton hébergement (Scaleway Console → Container → Environment) :

```
ANTHROPIC_API_KEY=sk-ant-...          # Clé API Anthropic (JAMAIS côté client)
NEXT_PUBLIC_SUPABASE_URL=https://...  # URL Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Clé anonyme Supabase
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # Service role (serveur uniquement)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX        # Google Analytics
ADMIN_SECRET=ton-secret-admin-long    # Pour le dashboard admin
```

**Important** : `ANTHROPIC_API_KEY` et `SUPABASE_SERVICE_ROLE_KEY` ne sont JAMAIS préfixées par `NEXT_PUBLIC_` — elles restent côté serveur.

## 6. CI/CD avec GitHub

### Option avec GitHub Actions (pour Scaleway) :

Crée `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Scaleway
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to Scaleway Registry
        uses: docker/login-action@v3
        with:
          registry: rg.fr-par.scw.cloud
          username: nologin
          password: ${{ secrets.SCW_SECRET_KEY }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: rg.fr-par.scw.cloud/${{ secrets.SCW_NAMESPACE }}/entretienzen:latest

      - name: Deploy container
        run: |
          curl -X PATCH \
            -H "X-Auth-Token: ${{ secrets.SCW_SECRET_KEY }}" \
            "https://api.scaleway.com/containers/v1beta1/regions/fr-par/containers/${{ secrets.SCW_CONTAINER_ID }}/deploy" \
            -d '{}'
```

**Secrets GitHub à configurer :** `SCW_SECRET_KEY`, `SCW_NAMESPACE`, `SCW_CONTAINER_ID`

## 7. Email transactionnel

### Avec Brevo (ex-Sendinblue) — gratuit jusqu'à 300 emails/jour :

1. Crée un compte sur https://www.brevo.com
2. Va dans Settings → Senders → ajoute `noreply@prepentretien.fr`
3. Configure les DNS (SPF, DKIM) qu'ils te donnent chez OVH
4. Récupère ta clé API

**DNS à ajouter chez OVH pour Brevo :**
```
Type    Nom                          Valeur
TXT     @                            v=spf1 include:sendinblue.com ~all
TXT     mail._domainkey              (valeur DKIM fournie par Brevo)
CNAME   sib-sender-verification      (valeur fournie par Brevo)
```

### Configurer l'envoi d'email de bienvenue

Crée le fichier `app/api/welcome-email/route.js` :

```javascript
export async function POST(request) {
  try {
    const { email, name } = await request.json();

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "EntretienZen", email: "noreply@prepentretien.fr" },
        to: [{ email }],
        subject: "Bienvenue sur EntretienZen !",
        htmlContent: `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #1B2559; font-size: 28px;">Bienvenue sur EntretienZen</h1>
            </div>
            <p style="color: #334155; font-size: 16px; line-height: 1.8;">
              Salut${name ? ` ${name}` : ""} !
            </p>
            <p style="color: #334155; font-size: 16px; line-height: 1.8;">
              Ton compte est prêt. Tu peux dès maintenant créer ton premier plan
              de préparation d'entretien personnalisé.
            </p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://prepentretien.fr/#prepare" style="background: #3B82F6; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">
                Créer mon premier plan
              </a>
            </div>
            <p style="color: #94A3B8; font-size: 13px; text-align: center;">
              EntretienZen — Ton copilote pour réussir tes entretiens
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) throw new Error(`Brevo error: ${res.status}`);
    return Response.json({ success: true });
  } catch (err) {
    console.error("Welcome email error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
```

**Ajoute `BREVO_API_KEY` dans les variables d'environnement.**

## 8. Dashboard Admin

Une API admin est déjà en place (`/api/admin`). Pour y accéder :

```bash
curl -H "x-admin-secret: TON_ADMIN_SECRET" https://prepentretien.fr/api/admin
```

Cela retourne :
- Nombre total d'utilisateurs et confirmés
- Liste complète des emails avec date d'inscription
- Provider (Google / email)
- Nombre de plans créés
- Inscriptions des 7 derniers jours

## 9. Checklist de lancement

- [ ] Acheter prepentretien.fr (OVH)
- [ ] Acheter prepentretien.com (Namecheap) + redirect
- [ ] Dockeriser l'app (Dockerfile + next.config.js standalone)
- [ ] Déployer sur Scaleway (Container ou Instance)
- [ ] Configurer DNS chez OVH
- [ ] Vérifier SSL (automatique ou Certbot)
- [ ] Configurer redirect www → racine
- [ ] Ajouter les variables d'environnement
- [ ] Configurer GitHub Actions pour CI/CD
- [ ] Créer le compte Brevo
- [ ] Configurer SPF/DKIM/CNAME chez OVH pour Brevo
- [ ] Créer le template email de bienvenue
- [ ] Configurer Google Analytics (GA4)
- [ ] Tester le dashboard admin
- [ ] Tester l'inscription + email de bienvenue
- [ ] Tester la création de plan de A à Z
- [ ] Tester sur mobile
