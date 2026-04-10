import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import CookieBanner from "./cookie-banner";

export const metadata = {
  title: {
    default: "EntretienZen — Prépare ton entretien avec l'IA",
    template: "%s | EntretienZen"
  },
  description: "Préparation d'entretien personnalisée avec IA : analyse de poste, matching CV, plan jour par jour avec quiz et ressources fiables. Gratuit et sans carte bancaire.",
  keywords: ["préparation entretien", "entretien embauche", "coaching entretien", "simulation entretien", "IA entretien", "préparer entretien", "questions entretien", "plan préparation entretien", "EntretienZen", "entretien technique", "entretien RH"],
  authors: [{ name: "EntretienZen" }],
  creator: "EntretienZen",
  publisher: "EntretienZen",
  metadataBase: new URL("https://entretienzen.com"),
  alternates: {
    canonical: "/",
    languages: { "fr-FR": "/" },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://entretienzen.com",
    siteName: "EntretienZen",
    title: "EntretienZen — Prépare ton entretien avec l'IA",
    description: "Plan de préparation personnalisé, jour par jour. Analyse ton CV, match avec l'offre, quiz adapté à ton niveau. Gratuit.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "EntretienZen — Préparation d'entretien IA" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EntretienZen — Prépare ton entretien avec l'IA",
    description: "Plan personnalisé jour par jour pour réussir ton entretien. IA + quiz + ressources fiables.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  // ─── Analytics config ───
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

  return (
    <html lang="fr">
      <head>
        {/* ═══ Google Analytics (si configuré) ═══ */}
        {GA_ID && (
          <>
            <Script id="ga-consent-default" strategy="beforeInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('consent', 'default', { analytics_storage: 'denied' });
                if (typeof localStorage !== 'undefined' && localStorage.getItem('cookie-consent') === 'accepted') {
                  gtag('consent', 'update', { analytics_storage: 'granted' });
                }
              `}
            </Script>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.__GA_ID = '${GA_ID}';
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname, anonymize_ip: true });
              `}
            </Script>
          </>
        )}
      </head>
      <body style={{ margin: 0, padding: 0, background: "#0A0A0F" }}>
        {children}
        <Analytics />
        <CookieBanner />
      </body>
    </html>
  );
}
