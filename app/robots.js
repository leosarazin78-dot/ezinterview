export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/auth/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/admin", "/auth/"],
      },
    ],
    sitemap: "https://entretienzen.com/sitemap.xml",
    host: "https://entretienzen.com",
  };
}
