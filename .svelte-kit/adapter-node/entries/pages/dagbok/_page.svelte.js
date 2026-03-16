import { a5 as ssr_context, h as head } from "../../../chunks/index2.js";
import "clsx";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import "../../../chunks/supabase.js";
import { g as getCachedTheme } from "../../../chunks/theme.js";
import { h as html } from "../../../chunks/html.js";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Hem",
              "item": "https://www.mittpsyke.se/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Dagbok",
              "item": "https://www.mittpsyke.se/dagbok"
            }
          ]
        },
        {
          "@type": "WebApplication",
          "name": "MittPsyke Dagbok",
          "url": "https://www.mittpsyke.se/dagbok",
          "description": "Digitalt verktyg mot ångest – skriv din personliga dagbok och följ ditt mående med visuell statistik.",
          "applicationCategory": "HealthApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "SEK" },
          "publisher": {
            "@type": "Organization",
            "name": "MittPsyke",
            "url": "https://www.mittpsyke.se"
          }
        }
      ]
    };
    getCachedTheme();
    onDestroy(() => {
    });
    head("1sw7vr1", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Dagbok | Skriv, följ och förstå ditt mående | MittPsyke</title>`);
      });
      $$renderer3.push(`<meta name="description" content="Skriv i dagboken, följ ditt mående över tid och få en lugn plats för reflektion. MittPsykes dagbok hjälper dig att se mönster och nästa steg."/> <meta property="og:title" content="Dagbok | Skriv, följ och förstå ditt mående | MittPsyke"/> <meta property="og:description" content="En lugn digital dagbok där du kan skriva av dig, följa känslor över tid och få mer kontinuitet i ditt mående."/> <link rel="canonical" href="https://www.mittpsyke.se/dagbok"/> ${html(`<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`)}`);
    });
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="container py-16 text-center opacity-60">Laddar din dagbok...</div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
