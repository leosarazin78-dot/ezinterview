export const metadata = {
  title: "EzInterview — Prépare ton entretien technique",
  description: "Préparation d'entretien personnalisée avec IA : analyse de poste, matching CV, plan jour par jour.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, background: "#FBF8F3" }}>{children}</body>
    </html>
  );
}