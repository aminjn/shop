"use client";

import { useEffect } from "react";

type Seo = {
  gaId?: string; gtmId?: string;
  googleVerification?: string; bingVerification?: string;
  orgName?: string; orgLogo?: string; phone?: string; email?: string; address?: string; sameAs?: string;
};

/** Injects analytics, verification meta tags and Organization/WebSite JSON-LD
 *  on the client from the live SEO settings — keeps pages static & fast. */
export function SeoClient({ origin }: { origin: string }) {
  useEffect(() => {
    let done = false;
    fetch("/api/seo").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (done || !d?.seo) return;
      const s = d.seo as Seo;
      const head = document.head;

      const meta = (name: string, content: string) => {
        if (!content || document.querySelector(`meta[name="${name}"]`)) return;
        const m = document.createElement("meta");
        m.name = name; m.content = content; head.appendChild(m);
      };
      if (s.googleVerification) meta("google-site-verification", s.googleVerification);
      if (s.bingVerification) meta("msvalidate.01", s.bingVerification);

      // Organization + WebSite structured data
      if (!document.getElementById("ld-org")) {
        const sameAs = (s.sameAs || "").split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
        const ld = {
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", name: s.orgName || "", url: origin,
              ...(s.orgLogo ? { logo: s.orgLogo } : {}), ...(s.phone ? { telephone: s.phone } : {}),
              ...(s.email ? { email: s.email } : {}), ...(s.address ? { address: s.address } : {}),
              ...(sameAs.length ? { sameAs } : {}) },
            { "@type": "WebSite", name: s.orgName || "", url: origin,
              potentialAction: { "@type": "SearchAction", target: `${origin}/fa/shop?q={search_term_string}`, "query-input": "required name=search_term_string" } },
          ],
        };
        const sc = document.createElement("script");
        sc.id = "ld-org"; sc.type = "application/ld+json"; sc.text = JSON.stringify(ld);
        head.appendChild(sc);
      }

      // Google Tag Manager
      if (s.gtmId && !document.getElementById("gtm-script")) {
        const sc = document.createElement("script");
        sc.id = "gtm-script";
        sc.text = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${s.gtmId}');`;
        head.appendChild(sc);
      }
      // GA4
      if (s.gaId && !document.getElementById("ga4-lib")) {
        const lib = document.createElement("script");
        lib.id = "ga4-lib"; lib.async = true; lib.src = `https://www.googletagmanager.com/gtag/js?id=${s.gaId}`;
        head.appendChild(lib);
        const cfg = document.createElement("script");
        cfg.id = "ga4-cfg";
        cfg.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${s.gaId}');`;
        head.appendChild(cfg);
      }
    }).catch(() => {});
    return () => { done = true; };
  }, [origin]);
  return null;
}
