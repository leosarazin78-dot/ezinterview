export const metadata = { title: "Conditions Générales d'Utilisation — EntretienZen" };

export default function CGU() {
  const s = { maxWidth: 800, margin: "0 auto", padding: "48px 24px", fontFamily: "'Inter', sans-serif", color: "#1B2559", lineHeight: 1.8 };
  const h1 = { fontSize: 28, fontWeight: 800, marginBottom: 32 };
  const h2 = { fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 };
  const p = { fontSize: 14, marginBottom: 12, color: "#334155" };

  return (
    <div style={s}>
      <h1 style={h1}>Conditions Générales d'Utilisation</h1>
      <p style={p}>Dernière mise à jour : avril 2026</p>

      <h2 style={h2}>1. Objet</h2>
      <p style={p}>
        Les présentes CGU régissent l'utilisation du service EntretienZen, accessible à l'adresse entretienzen.com. EntretienZen est un outil de préparation d'entretien d'embauche assisté par intelligence artificielle.
      </p>

      <h2 style={h2}>2. Accès au service</h2>
      <p style={p}>
        L'accès au service nécessite la création d'un compte via une adresse email ou un compte Google. Le service est actuellement proposé gratuitement en version beta. L'éditeur se réserve le droit de modifier les conditions d'accès, notamment en introduisant des fonctionnalités payantes, avec un préavis de 30 jours.
      </p>

      <h2 style={h2}>3. Description du service</h2>
      <p style={p}>
        EntretienZen permet à l'utilisateur de : soumettre un lien vers une offre d'emploi pour analyse automatique, télécharger un CV pour un matching de compétences, générer un plan de préparation personnalisé avec cours, exercices et quiz, suivre sa progression dans le plan.
      </p>

      <h2 style={h2}>4. Limitation de responsabilité</h2>
      <p style={p}>
        Les contenus générés par EntretienZen sont produits par intelligence artificielle et fournis à titre indicatif. Ils ne constituent en aucun cas un conseil professionnel, une formation certifiante, ni une garantie d'embauche. L'éditeur ne saurait être tenu responsable de l'exactitude, de l'exhaustivité ou de la pertinence des contenus générés, des résultats obtenus lors d'entretiens, des liens vers des ressources externes dont le contenu peut évoluer, de toute interruption temporaire du service.
      </p>

      <h2 style={h2}>5. Obligations de l'utilisateur</h2>
      <p style={p}>
        L'utilisateur s'engage à fournir des informations exactes lors de son inscription, ne pas utiliser le service à des fins illicites ou contraires aux bonnes mœurs, ne pas tenter de contourner les mesures de sécurité (rate limiting, authentification), ne pas utiliser de systèmes automatisés pour accéder au service de manière abusive, ne pas revendre ou redistribuer les contenus générés à des fins commerciales.
      </p>

      <h2 style={h2}>6. Propriété intellectuelle</h2>
      <p style={p}>
        Le code source, le design et la marque EntretienZen sont la propriété de l'éditeur. Les plans de préparation générés sont la propriété de l'utilisateur qui les a créés. L'utilisateur accorde à EntretienZen un droit d'utilisation anonymisé à des fins d'amélioration du service.
      </p>

      <h2 style={h2}>7. Suppression de compte</h2>
      <p style={p}>
        L'utilisateur peut demander la suppression de son compte et de toutes ses données à tout moment en envoyant un email à contact@entretienzen.com. La suppression est effective sous 30 jours. L'éditeur se réserve le droit de suspendre ou supprimer un compte en cas de violation des présentes CGU, sans préavis.
      </p>

      <h2 style={h2}>8. Disponibilité</h2>
      <p style={p}>
        EntretienZen est fourni "en l'état" et "selon disponibilité". L'éditeur ne garantit pas un fonctionnement ininterrompu et ne saurait être tenu responsable des interruptions, quelle qu'en soit la cause. En cas d'interruption programmée, l'éditeur s'efforcera d'en informer les utilisateurs à l'avance.
      </p>

      <h2 style={h2}>9. Modification des CGU</h2>
      <p style={p}>
        L'éditeur se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés par email de toute modification substantielle. L'utilisation continue du service après notification vaut acceptation des nouvelles conditions.
      </p>

      <h2 style={h2}>10. Droit applicable</h2>
      <p style={p}>
        Les présentes CGU sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.
      </p>

      <h2 style={h2}>11. Contact</h2>
      <p style={p}>
        Pour toute question relative aux présentes CGU : contact@entretienzen.com
      </p>

      <p style={{ ...p, marginTop: 48, textAlign: "center" }}>
        <a href="/" style={{ color: "#3B82F6", textDecoration: "none" }}>← Retour à l'accueil</a>
      </p>
    </div>
  );
}
