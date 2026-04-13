export const metadata = { title: "Politique de confidentialité — EntretienZen" };

export default function Confidentialite() {
  const s = { maxWidth: 800, margin: "0 auto", padding: "48px 24px", fontFamily: "'Inter', sans-serif", color: "#1B2559", lineHeight: 1.8 };
  const h1 = { fontSize: 28, fontWeight: 800, marginBottom: 32 };
  const h2 = { fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 };
  const p = { fontSize: 14, marginBottom: 12, color: "#334155" };

  return (
    <div style={s}>
      <h1 style={h1}>Politique de confidentialité</h1>
      <p style={p}>Dernière mise à jour : avril 2026</p>

      <h2 style={h2}>1. Responsable du traitement</h2>
      <p style={p}>
        EntretienZen, [ton adresse].<br />
        Contact : admin@entretienzen.com
      </p>

      <h2 style={h2}>2. Données collectées</h2>
      <p style={p}>Nous collectons les données suivantes :</p>
      <p style={p}>
        <strong>Données de compte</strong> : adresse email, méthode de connexion (email ou Google), date d'inscription, date de dernière connexion.
      </p>
      <p style={p}>
        <strong>Données de préparation</strong> : lien de l'offre d'emploi analysée, résultat du matching (compétences identifiées), plan de préparation généré, progression dans le plan.
      </p>
      <p style={p}>
        <strong>Données techniques</strong> : adresse IP (pour la sécurité et le rate limiting), données de navigation anonymisées via Google Analytics.
      </p>

      <h2 style={h2}>3. Données NON conservées</h2>
      <p style={p}>
        <strong>Votre CV n'est jamais stocké.</strong> Le contenu de votre CV est transmis en mémoire à l'API d'analyse, utilisé pour le matching, puis supprimé immédiatement. Aucune copie n'est conservée sur nos serveurs ni dans notre base de données. Seul le résultat du matching (liste de compétences avec leur niveau) est sauvegardé.
      </p>

      <h2 style={h2}>4. Finalités du traitement</h2>
      <p style={p}>
        Vos données sont utilisées pour : fournir le service de préparation d'entretien, sauvegarder vos plans de préparation entre sessions, améliorer le service (statistiques anonymisées), assurer la sécurité du service (rate limiting, détection d'abus).
      </p>

      <h2 style={h2}>5. Base légale</h2>
      <p style={p}>
        Le traitement est fondé sur votre consentement (article 6.1.a du RGPD) donné lors de la création de votre compte, et sur notre intérêt légitime à assurer la sécurité du service (article 6.1.f).
      </p>

      <h2 style={h2}>6. Sous-traitants</h2>
      <p style={p}>
        <strong>Supabase Inc.</strong> (San Francisco, USA) — Authentification et base de données. Données hébergées en région EU (eu-west). Conforme aux clauses contractuelles types (SCC) de la Commission européenne.
      </p>
      <p style={p}>
        <strong>Anthropic PBC</strong> (San Francisco, USA) — Analyse IA des offres et génération des plans. Les données envoyées à Anthropic ne sont pas utilisées pour entraîner leurs modèles (API usage policy). Conforme SCC.
      </p>
      <p style={p}>
        <strong>Vercel Inc.</strong> (USA) — Hébergement du site web. Conforme SCC.
      </p>
      <p style={p}>
        <strong>Google LLC</strong> — Analytics (si vous acceptez les cookies). Données anonymisées.
      </p>

      <h2 style={h2}>7. Durée de conservation</h2>
      <p style={p}>
        Données de compte : conservées tant que le compte est actif, supprimées 12 mois après la dernière connexion.
        Plans de préparation : conservés tant que le compte est actif.
        Données techniques (IP, logs) : supprimées après 90 jours.
      </p>

      <h2 style={h2}>8. Vos droits (RGPD)</h2>
      <p style={p}>
        Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :
      </p>
      <p style={p}>
        <strong>Droit d'accès</strong> : obtenir une copie de toutes vos données personnelles.<br />
        <strong>Droit de rectification</strong> : corriger vos données inexactes.<br />
        <strong>Droit à l'effacement</strong> : demander la suppression de votre compte et de toutes vos données.<br />
        <strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré (JSON).<br />
        <strong>Droit d'opposition</strong> : vous opposer au traitement de vos données.<br />
        <strong>Droit de retrait du consentement</strong> : retirer votre consentement à tout moment.
      </p>
      <p style={p}>
        Pour exercer ces droits, envoyez un email à <strong>admin@entretienzen.com</strong>. Nous répondrons sous 30 jours.
      </p>

      <h2 style={h2}>9. Cookies</h2>
      <p style={p}>
        <strong>Cookies essentiels</strong> (toujours actifs) : session d'authentification Supabase. Nécessaires au fonctionnement du service.
      </p>
      <p style={p}>
        <strong>Cookies analytiques</strong> (optionnels) : Google Analytics, activés uniquement avec votre consentement via la bannière cookies. Vous pouvez retirer votre consentement à tout moment.
      </p>

      <h2 style={h2}>10. Sécurité</h2>
      <p style={p}>
        Nous mettons en œuvre des mesures techniques pour protéger vos données : chiffrement HTTPS (TLS 1.3), authentification sécurisée (bcrypt, tokens JWT), rate limiting sur les API, Content Security Policy, en-têtes de sécurité HTTP. Aucun mot de passe n'est stocké en clair.
      </p>

      <h2 style={h2}>11. Réclamation</h2>
      <p style={p}>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès de la CNIL : https://www.cnil.fr/fr/plaintes
      </p>

      <p style={{ ...p, marginTop: 48, textAlign: "center" }}>
        <a href="/" style={{ color: "#3B82F6", textDecoration: "none" }}>← Retour à l'accueil</a>
      </p>
    </div>
  );
}
