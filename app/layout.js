import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import CookieBanner from "./cookie-banner";

export const metadata = {
  title: {
    default: "EntretienZen — Prépare ton entretien avec l'IA",
    template: "%s | EntretienZen"
  },
  description: "Préparation d'entretien personnalisée avec IA : analyse de poste, matching CV, plan jour par jour avec quiz et ressources. Gratuit, sans carte bancaire. Réussis ton prochain entretien d'embauche.",
  keywords: [
    "préparation entretien", "entretien embauche", "coaching entretien",
    "simulation entretien", "IA entretien", "préparer entretien",
    "questions entretien", "plan préparation entretien", "EntretienZen",
    "entretien technique", "entretien RH", "entretien d'embauche",
    "réussir entretien", "se préparer entretien", "quiz entretien",
    "matching CV offre emploi", "aide entretien gratuit",
    "préparation entretien gratuit", "coach entretien IA",
  ],
  authors: [{ name: "EntretienZen", url: "https://entretienzen.com" }],
  creator: "EntretienZen",
  publisher: "EntretienZen",
  metadataBase: new URL("https://entretienzen.com"),
  alternates: {
    canonical: "/",
    languages: { "fr-FR": "/" },
  },
  category: "education",
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
    creator: "@entretienzen",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7C5CFC",
};

// ─── JSON-LD Structured Data ───
const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "EntretienZen",
  url: "https://entretienzen.com",
  logo: "https://entretienzen.com/icon-512.png",
  description: "Plateforme de préparation d'entretien d'embauche avec intelligence artificielle.",
  sameAs: [],
};

const jsonLdWebApp = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "EntretienZen",
  url: "https://entretienzen.com",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    description: "Gratuit — sans carte bancaire",
  },
  description: "Prépare ton entretien d'embauche avec l'IA : analyse de poste, matching CV, plan personnalisé jour par jour avec quiz.",
  screenshot: "https://entretienzen.com/og-image.png",
  featureList: "Analyse d'offre d'emploi, Matching CV, Plan de préparation jour par jour, Quiz adaptatifs, Culture d'entreprise",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "50",
    bestRating: "5",
    worstRating: "1",
  },
};

const jsonLdFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment préparer un entretien d'embauche efficacement ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "EntretienZen analyse ton CV et l'offre d'emploi avec l'IA pour créer un plan de préparation personnalisé jour par jour. Tu reçois des fiches de révision, des quiz adaptatifs et des informations sur la culture de l'entreprise.",
      },
    },
    {
      "@type": "Question",
      name: "Est-ce que EntretienZen est gratuit ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, EntretienZen est entièrement gratuit. Aucune carte bancaire n'est requise. Tu peux créer un compte et commencer ta préparation immédiatement.",
      },
    },
    {
      "@type": "Question",
      name: "Comment fonctionne le matching CV avec l'offre d'emploi ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "L'IA analyse les compétences requises dans l'offre et les compare avec ton CV. Tu obtiens un score de compatibilité et des recommandations précises sur les points forts à valoriser et les lacunes à combler.",
      },
    },
    {
      "@type": "Question",
      name: "Combien de temps dure la préparation ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le plan s'adapte au nombre de jours avant ton entretien (de 1 à 10 jours). Chaque jour contient des fiches, des exercices et des quiz que tu peux compléter à ton rythme.",
      },
    },
    {
      "@type": "Question",
      name: "Quels types d'entretien sont couverts ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "EntretienZen couvre tous les types d'entretiens : techniques, RH, managériaux, motivationnels. Le plan s'adapte au poste visé et à ton interlocuteur (CTO, DRH, manager, etc.).",
      },
    },
  ],
};

const jsonLdBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://entretienzen.com" },
    { "@type": "ListItem", position: 2, name: "Préparer mon entretien", item: "https://entretienzen.com/#prepare" },
    { "@type": "ListItem", position: 3, name: "Mon espace", item: "https://entretienzen.com/#dashboard" },
  ],
};

export default function RootLayout({ children }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

  return (
    <html lang="fr">
      <head>
        {/* Preconnect for faster third-party loads */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
        />

        {/* Google Analytics (si configuré — chargé APRÈS le rendu pour ne pas bloquer) */}
        {GA_ID && GA_ID.startsWith("G-") && (
          <>
            <Script id="ga-consent-default" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('consent', 'default', { analytics_storage: 'denied' });
                if (typeof localStorage !== 'undefined' && localStorage.getItem('cookie-consent') === 'accepted') {
                  gtag('consent', 'update', { analytics_storage: 'granted' });
                }
              `}
            </Script>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
            <Script id="google-analytics" strategy="lazyOnload">
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
