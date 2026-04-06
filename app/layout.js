import Script from "next/script";
import CookieBanner from "./cookie-banner";

export const metadata = {
  title: "EZE — Prépare ton entretien avec l'IA",
  description: "Préparation d'entretien personnalisée avec IA : analyse de poste, matching CV, plan jour par jour avec sources fiables.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

  return (
    <html lang="fr">
      <head>
        {/* Google Analytics — consent mode par défaut : refusé */}
        {GA_ID && (
          <>
            <Script id="ga-consent-default" strategy="beforeInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('consent', 'default', {
                  analytics_storage: 'denied',
                });
                // Si l'utilisateur a déjà accepté, on active
                if (typeof localStorage !== 'undefined' && localStorage.getItem('cookie-consent') === 'accepted') {
                  gtag('consent', 'update', { analytics_storage: 'granted' });
                }
              `}
            </Script>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.__GA_ID = '${GA_ID}';
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname + window.location.hash,
                  anonymize_ip: true,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body style={{ margin: 0, padding: 0, background: "#0A0A0F" }}>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
