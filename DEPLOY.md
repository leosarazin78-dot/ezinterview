# EzInterview — Guide de déploiement

## 1. Obtenir une clé API Claude

1. Va sur **https://console.anthropic.com**
2. Crée un compte (ou connecte-toi)
3. Va dans **Settings > API Keys**
4. Clique **Create Key**, copie la clé (commence par `sk-ant-...`)
5. Ajoute du crédit : **Settings > Billing > Add funds** (5$ suffisent largement pour tester)

## 2. Mettre le code sur GitHub

1. Va sur **https://github.com/new** et crée un nouveau repo (ex: `ezinterview`)
2. Dans le dossier `ezinterview/` sur ton ordi, exécute :

```bash
cd ezinterview
git init
git add .
git commit -m "Initial commit - EzInterview v2"
git remote add origin https://github.com/TON_USERNAME/ezinterview.git
git push -u origin main
```

## 3. Déployer sur Vercel

1. Va sur **https://vercel.com** et connecte-toi avec GitHub
2. Clique **Add New > Project**
3. Sélectionne ton repo `ezinterview`
4. Dans **Environment Variables**, ajoute :
   - Name: `ANTHROPIC_API_KEY`
   - Value: ta clé `sk-ant-...`
5. Clique **Deploy**
6. En 1-2 minutes, ton app est live sur `ezinterview-xxx.vercel.app`

## 4. Partager avec tes amis

Envoie le lien Vercel. C'est tout ! Chacun peut :
- Coller un lien d'offre d'emploi
- Uploader son CV
- Recevoir un plan de préparation personnalisé

## Structure du projet

```
ezinterview/
  app/
    layout.js          — Layout HTML global
    page.js            — Frontend complet (React)
    api/
      scrape-job/      — Extraction d'offre depuis un lien
      parse-cv/        — Parsing de CV (PDF, DOCX, TXT)
      analyze/         — Matching profil/poste via Claude
      generate-plan/   — Génération du plan jour par jour
      company-intel/   — Veille entreprise (actualités, concurrents)
  package.json
  next.config.js
  .env.example
```

## Coûts estimés

- **Vercel** : gratuit (plan Hobby)
- **Claude API** : ~0.03-0.10$ par utilisation complète (scrape + parse + analyze + plan)
- Avec 5$ de crédit, environ 50-150 utilisations complètes

## Développement local

```bash
npm install
cp .env.example .env.local
# Mets ta clé API dans .env.local
npm run dev
# Ouvre http://localhost:3000
```