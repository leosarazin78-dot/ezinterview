export const metadata = { title: "Mentions légales — EntretienZen" };

export default function MentionsLegales() {
  const s = { maxWidth: 800, margin: "0 auto", padding: "48px 24px", fontFamily: "'Inter', sans-serif", color: "#1B2559", lineHeight: 1.8 };
  const h1 = { fontSize: 28, fontWeight: 800, marginBottom: 32 };
  const h2 = { fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 };
  const p = { fontSize: 14, marginBottom: 12, color: "#334155" };

  return (
    <div style={s}>
      <h1 style={h1}>Mentions légales</h1>
      <p style={p}>Dernière mise à jour : avril 2026</p>

      <h2 style={h2}>Éditeur du site</h2>
      <p style={p}>
        EntretienZen<br />
        {/* À COMPLÉTER avec tes infos */}
        Responsable de la publication : [Ton nom complet]<br />
        Adresse : [Ton adresse ou celle de ton entreprise]<br />
        Email : admin@entretienzen.com<br />
        Statut : [Auto-entrepreneur / SAS / etc.]<br />
        SIRET : [Ton numéro SIRET]
      </p>

      <h2 style={h2}>Hébergement</h2>
      <p style={p}>
        Vercel Inc.<br />
        440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
        Site : https://vercel.com
      </p>

      <h2 style={h2}>Traitement des données</h2>
      <p style={p}>
        Les données personnelles sont traitées par Supabase Inc. (hébergement base de données et authentification) et Anthropic PBC (analyse IA). Les données sont hébergées dans l'Union européenne (Supabase, région eu-west) et aux États-Unis (Anthropic, Vercel).
      </p>

      <h2 style={h2}>Propriété intellectuelle</h2>
      <p style={p}>
        L'ensemble du contenu du site EntretienZen (textes, graphismes, logiciels, code source) est protégé par le droit d'auteur. Toute reproduction sans autorisation écrite préalable est interdite.
      </p>

      <h2 style={h2}>Responsabilité</h2>
      <p style={p}>
        EntretienZen fournit des suggestions de préparation d'entretien générées par intelligence artificielle. Ces suggestions sont données à titre indicatif et ne constituent en aucun cas une garantie de résultat. L'éditeur ne saurait être tenu responsable des résultats obtenus lors d'un entretien.
      </p>

      <p style={{ ...p, marginTop: 48, textAlign: "center" }}>
        <a href="/" style={{ color: "#3B82F6", textDecoration: "none" }}>← Retour à l'accueil</a>
      </p>
    </div>
  );
}
