import Script from "next/script";

export const metadata = {
  title: "EntretienZen — Prépare ton entretien avec l'IA",
  description: "Préparation d'entretien personnalisée avec IA : analyse de poste, matching CV, plan jour par jour avec sources fiables.",
};

export default function RootLayout({ children }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

  return (
    <html lang="fr">
      <head>
        {/* Google Analytics */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname + window.location.hash,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body style={{ margin: 0, padding: 0, background: "#FAF8F5" }}>{children}</body>
    </html>
  );
}
