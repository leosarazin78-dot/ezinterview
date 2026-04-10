import Script from "next/script";
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
  // ─── Analytics config (au choix) ───
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
  const UMAMI_URL = process.env.NEXT_PUBLIC_UMAMI_URL || "";
  const UMAMI_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || "";
  const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
  const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

  return (
    <html lang="fr">
      <head>
        {/* ═══ OPTION 1 : Umami (open source, RGPD sans cookies, gratuit) ═══ */}
        {UMAMI_URL && UMAMI_ID && (
          <Script
            src={UMAMI_URL}
            data-website-id={UMAMI_ID}
            strategy="afterInteractive"
            async
          />
        )}

        {/* ═══ OPTION 2 : PostHog (open source, free tier 1M events/mois) ═══ */}
        {POSTHOG_KEY && (
          <Script id="posthog-init" strategy="afterInteractive">
            {`
              !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group setPersonProperties resetPersonProperties setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
              posthog.init('${POSTHOG_KEY}', {
                api_host: '${POSTHOG_HOST}',
                person_profiles: 'identified_only',
                capture_pageview: true,
                capture_pageleave: true,
                autocapture: true,
              });
            `}
          </Script>
        )}

        {/* ═══ OPTION 3 : Google Analytics (si configuré) ═══ */}
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
        <CookieBanner />
      </body>
    </html>
  );
}
