"use client";
import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Ne s'affiche que si l'utilisateur n'a pas encore fait de choix
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
    // Active Google Analytics si le script est chargé
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
      });
    }
  };

  const refuse = () => {
    localStorage.setItem("cookie-consent", "refused");
    setVisible(false);
    // Désactive Google Analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
      });
    }
    // Supprime les cookies GA existants
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      if (name.startsWith("_ga") || name.startsWith("_gid")) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: "#1B2559", color: "#fff", padding: "16px 24px",
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 16, flexWrap: "wrap",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
      fontFamily: "'Inter', sans-serif",
    }}>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, maxWidth: 600 }}>
        Ce site utilise des cookies essentiels (authentification) et, avec votre accord, des cookies analytiques (Google Analytics) pour améliorer le service.{" "}
        <a href="/confidentialite" style={{ color: "#93C5FD", textDecoration: "underline" }}>En savoir plus</a>
      </p>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button onClick={refuse} style={{
          background: "transparent", border: "1px solid rgba(255,255,255,0.3)",
          color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13,
          fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
        }}>
          Refuser
        </button>
        <button onClick={accept} style={{
          background: "#3B82F6", border: "none", color: "#fff",
          borderRadius: 8, padding: "8px 16px", fontSize: 13,
          fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>
          Accepter
        </button>
      </div>
    </div>
  );
}
