import { h as head, c as attr, d as escape_html } from './index-CtSeC24C.js';
import './supabase-CC3ezZS5.js';
import '@supabase/supabase-js';
import './shared-server-DaWdgxVh.js';

function ThemeToggle($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<button class="p-2 rounded-[var(--radius-input)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors" aria-label="Växla tema" type="button">${escape_html("🌙")}</button>`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { children } = $$props;
    let mobileMenuOpen = false;
    head("12qhfyh", $$renderer2, ($$renderer3) => {
      {
        $$renderer3.push("<!--[!-->");
        $$renderer3.title(($$renderer4) => {
          $$renderer4.push(`<title>MittPsyke – Digitalt samtalsstöd för ångest och nedstämdhet</title>`);
        });
        $$renderer3.push(`<meta name="description" content="MittPsyke är ett lugnt och tryggt digitalt samtalsstöd för ångest, nedstämdhet och trauma. Samtala i din egen takt."/> <meta name="robots" content="index, follow"/> <meta name="author" content="MittPsyke"/> <meta name="viewport" content="width=device-width, initial-scale=1"/> <link rel="canonical" href="https://mittpsyke.se"/> <meta property="og:title" content="MittPsyke – Digitalt samtalsstöd"/> <meta property="og:description" content="Ett lugnt och tryggt digitalt stöd för ångest, nedstämdhet och trauma."/> <meta property="og:type" content="website"/> <meta property="og:url" content="https://mittpsyke.se"/> <meta property="og:site_name" content="MittPsyke"/> <meta name="twitter:card" content="summary"/>`);
      }
      $$renderer3.push(`<!--]-->`);
    });
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<header class="sticky top-0 z-30 border-b border-black/8 bg-white/75 dark:bg-black/35 backdrop-blur"><div class="flex items-center justify-between gap-3 px-5 py-3.5"><div class="flex items-center gap-3 sm:gap-4 min-w-0"><a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0" aria-label="MittPsyke hemsida"><img src="/assets/home/MittPsykeLogo.png" alt="MittPsyke logotyp" class="h-8 w-auto"/></a> <a href="/" class="text-sm font-semibold opacity-95 hover:opacity-100 hover:underline transition-opacity whitespace-nowrap">Hem</a> <nav class="hidden md:flex items-center gap-4"><a href="/guider" class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity">Guider</a> <a href="/ovningar" class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity">Övningar</a> <a href="/om-mittpsyke" class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity">Om MittPsyke</a> <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity">Akut hjälp (Stödlinjer)</a></nav></div> <div class="flex items-center gap-3"><nav class="hidden md:flex items-center gap-4">`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<a href="mailto:mittpsyke@ownit.nu" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">Kontakt</a> <a href="/login" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">Logga in</a> <a href="/register" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">Registrera</a>`);
      }
      $$renderer2.push(`<!--]--></nav> `);
      ThemeToggle($$renderer2);
      $$renderer2.push(`<!----> <button type="button" class="md:hidden inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/10 px-2.5 py-2 text-sm opacity-80 hover:opacity-100 transition-opacity" aria-label="Öppna meny"${attr("aria-expanded", mobileMenuOpen)}>☰</button></div></div> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></header> <main class="mt-6">`);
      children($$renderer2);
      $$renderer2.push(`<!----></main> <section class="mt-10 px-5"><p class="mx-auto max-w-4xl text-center text-xs sm:text-sm opacity-70 leading-relaxed">MittPsyke är ett AI-baserat samtalsstöd och ersätter inte medicinsk eller psykologisk vård.
			Vid akut fara: ring 112. Vid behov av vårdråd: 1177. <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="underline hover:no-underline ml-1">Akut hjälp</a></p></section> <footer class="border-t border-black/8 py-5 px-5 text-sm opacity-60 text-center mt-12">© ${escape_html((/* @__PURE__ */ new Date()).getFullYear())} MittPsyke. Alla rättigheter förbehållna. <span class="mx-2">·</span> <a href="/om-mittpsyke" class="text-sm opacity-70 hover:opacity-100 transition-opacity">Om MittPsyke</a> <span class="mx-2">·</span> <a href="/integritet" class="text-sm opacity-70 hover:opacity-100 transition-opacity">Integritetspolicy</a> <span class="mx-2">·</span> <a href="/ansvar" class="text-sm opacity-70 hover:opacity-100 transition-opacity">Ansvarsinfo</a> <span class="mx-2">·</span> <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-teal-700/90 dark:text-teal-300/90 opacity-90 hover:opacity-100 transition-opacity">Akut hjälp (Stödlinjer)</a></footer>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-CQjk085O.js.map
