import { e as escape_html, h as head, a as attr, c as attr_class, d as derived } from "../../chunks/index.js";
import "clsx";
import "../../chunks/supabase.js";
import { p as page } from "../../chunks/index2.js";
import { h as html } from "../../chunks/html.js";
function ThemeToggle($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<button class="p-2 rounded-[var(--radius-input)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors" aria-label="Växla tema" type="button">${escape_html("🌙")}</button>`);
  });
}
function CookieBanner($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { children } = $$props;
    const organizationJsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "MittPsyke",
      url: "https://www.mittpsyke.se",
      email: "mittpsyke@ownit.nu",
      founder: { "@type": "Person", name: "Robert Claesson" },
      identifier: "198712284895"
    };
    const isChat = derived(() => Boolean(page.route.id?.includes("/chat/")));
    const isPrivateOrUtilityPage = derived(() => Boolean(page.route.id && (page.route.id.includes("/dashboard") || page.route.id.includes("/framsteg") || page.route.id.includes("/login") || page.route.id.includes("/register"))));
    let mobileMenuOpen = false;
    head("12qhfyh", $$renderer2, ($$renderer3) => {
      {
        $$renderer3.push("<!--[!-->");
        $$renderer3.title(($$renderer4) => {
          $$renderer4.push(`<title>${escape_html(page.data?.title ? `${page.data.title} | Mittpsyke` : "Psykiskt stöd online | Verktyg mot ångest | Mittpsyke.se")}</title>`);
        });
        $$renderer3.push(`<meta name="description"${attr("content", page.data?.description || "AI-baserat samtalsstöd för reflektion och stöd i vardagen. Börja utan konto eller skapa en egen plats över tid.")}/> <meta name="robots"${attr("content", isPrivateOrUtilityPage() ? "noindex, nofollow" : "index, follow")}/> <meta name="author" content="MittPsyke"/> <meta name="viewport" content="width=device-width, initial-scale=1"/> <meta property="og:title"${attr("content", page.data?.title ? `${page.data.title} | Mittpsyke` : "MittPsyke – Psykiskt stöd online")}/> <meta property="og:description"${attr("content", page.data?.description || "AI-baserat samtalsstöd för reflektion och stöd i vardagen. Börja utan konto eller skapa en egen plats över tid.")}/> <meta property="og:type" content="website"/> <meta property="og:site_name" content="MittPsyke"/> <meta property="og:url"${attr("content", `https://www.mittpsyke.se${page.url.pathname}`)}/> <meta property="og:image" content="https://www.mittpsyke.se/og-image.png"/> <link rel="canonical"${attr("href", `https://www.mittpsyke.se${page.url.pathname}`)}/> <meta name="twitter:card" content="summary_large_image"/> <meta name="twitter:title"${attr("content", page.data?.title ? `${page.data.title} | Mittpsyke` : "MittPsyke – Psykiskt stöd online")}/> <meta name="twitter:description"${attr("content", page.data?.description || "AI-baserat samtalsstöd för reflektion och stöd i vardagen. Börja utan konto eller skapa en egen plats över tid.")}/> ${html(`<script type="application/ld+json">${JSON.stringify(organizationJsonLd)}<\/script>`)}`);
      }
      $$renderer3.push(`<!--]-->`);
    });
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<a href="#main-content" class="skip-link svelte-12qhfyh">Hoppa till innehåll</a> <header class="sticky top-0 z-30 border-b border-black/8 bg-white/75 dark:bg-black/35 backdrop-blur"><div class="flex items-center justify-between gap-3 px-5 py-3.5"><div class="flex items-center gap-3 sm:gap-4 min-w-0"><a href="/" class="text-sm font-semibold opacity-95 hover:opacity-100 hover:underline transition-opacity whitespace-nowrap">Hem</a> <nav class="hidden md:flex items-center gap-4" aria-label="Huvudnavigering"><a href="/guider" class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity">Guider</a> <a href="/ovningar" class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity">Övningar</a> <a href="/om-mittpsyke" class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity">Om MittPsyke</a> <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity">Akut hjälp (Stödlinjer)</a></nav></div> <div class="flex items-center gap-3"><nav class="hidden md:flex items-center gap-4" aria-label="Kontonavigering">`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<a href="mailto:mittpsyke@ownit.nu" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">Kontakt</a> <a href="/login" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">Logga in</a> <a href="/register" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">Registrera</a>`);
      }
      $$renderer2.push(`<!--]--></nav> `);
      ThemeToggle($$renderer2);
      $$renderer2.push(`<!----> <button type="button" class="md:hidden inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/10 px-2.5 py-2 text-sm opacity-80 hover:opacity-100 transition-opacity" aria-label="Öppna meny"${attr("aria-expanded", mobileMenuOpen)} aria-controls="mobile-menu">☰</button></div></div> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></header> <div${attr_class("", void 0, { "is-chat-page": isChat() })}><main id="main-content" class="mt-6">`);
      children($$renderer2);
      $$renderer2.push(`<!----></main> <section class="site-disclaimer mt-10 px-5"><p class="mx-auto max-w-4xl text-center text-xs sm:text-sm opacity-70 leading-relaxed">MittPsyke ersätter inte vård. Vid akut fara ring 112 · Vårdråd 1177.</p></section> <footer class="site-footer border-t border-black/8 py-5 px-5 text-sm opacity-60 text-center mt-12">© ${escape_html((/* @__PURE__ */ new Date()).getFullYear())} MittPsyke. Alla rättigheter förbehållna. <span class="mx-2">·</span> <a href="/om-mittpsyke" class="text-sm opacity-70 hover:opacity-100 transition-opacity">Om MittPsyke</a> <span class="mx-2">·</span> <a href="/integritet" class="text-sm opacity-70 hover:opacity-100 transition-opacity">Integritetspolicy</a> <span class="mx-2">·</span> <a href="/ansvar" class="text-sm opacity-70 hover:opacity-100 transition-opacity">Ansvarsinfo</a> <span class="mx-2">·</span> <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-teal-700/90 dark:text-teal-300/90 opacity-90 hover:opacity-100 transition-opacity">Akut hjälp (Stödlinjer)</a> <div class="footer-company mt-2 text-xs opacity-70 svelte-12qhfyh"><p class="svelte-12qhfyh">© MittPsyke</p> <p class="svelte-12qhfyh">Enskild näringsverksamhet</p> <p class="svelte-12qhfyh">Org.nr: 198712284895</p> <p class="svelte-12qhfyh"><a href="mailto:mittpsyke@ownit.nu" class="hover:opacity-100 transition-opacity">mittpsyke@ownit.nu</a></p></div></footer></div> `);
      CookieBanner($$renderer2);
      $$renderer2.push(`<!---->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _layout as default
};
