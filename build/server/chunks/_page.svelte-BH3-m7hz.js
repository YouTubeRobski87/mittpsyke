import { h as head, f as ensure_array_like, c as attr, d as escape_html } from './index-CtSeC24C.js';
import { p as portals } from './portals-dDiiJZBT.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    head("1uha8ag", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>MittPsyke - Tryggt stöd för ditt psyke</title>`);
      });
    });
    $$renderer2.push(`<main class="staging-look svelte-1uha8ag"><section class="hero-section svelte-1uha8ag" aria-label="Introduktion till MittPsyke"><div class="hero-bg svelte-1uha8ag"></div> <div class="hero-overlay svelte-1uha8ag"></div> <div class="hero-content svelte-1uha8ag"><h1 class="svelte-1uha8ag">Välkommen till MittPsyke</h1> <p class="svelte-1uha8ag">Hitta rätt stöd för psykiskt mående på ett enkelt och tryggt sätt.</p> <a href="/om-mittpsyke" class="hero-cta svelte-1uha8ag">Läs mer om MittPsyke</a></div></section> <section class="content-hub svelte-1uha8ag"><div class="narrow cards-narrow hub-inner svelte-1uha8ag"><h2 class="svelte-1uha8ag">Guider och övningar</h2> <p class="svelte-1uha8ag">Läs strukturerade guider och prova konkreta steg som du kan använda direkt i din vardag.</p> <div class="hub-grid svelte-1uha8ag"><a class="hub-card svelte-1uha8ag" href="/guider"><h3 class="svelte-1uha8ag">Guider</h3> <p class="svelte-1uha8ag">8 fokusområden med klusterartiklar inom psykiskt mående.</p> <span class="svelte-1uha8ag">Gå till guider</span></a> <a class="hub-card svelte-1uha8ag" href="/ovningar"><h3 class="svelte-1uha8ag">Övningar</h3> <p class="svelte-1uha8ag">Praktiska steg-för-steg-övningar för reflektion och lugn.</p> <span class="svelte-1uha8ag">Gå till övningar</span></a></div></div></section> <section class="focus-section svelte-1uha8ag"><div class="narrow cards-narrow focus-content svelte-1uha8ag"><header class="focus-header svelte-1uha8ag"><h2 class="svelte-1uha8ag">Välj fokusområde</h2> <p class="svelte-1uha8ag">Du behöver inte förklara allt. Välj det som känns närmast just nu.</p></header> <div class="focus-cards svelte-1uha8ag"><!--[-->`);
    const each_array = ensure_array_like(portals);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let portal = each_array[$$index];
      $$renderer2.push(`<a class="focus-card svelte-1uha8ag"${attr("href", `/chat/${portal.key}`)}><img class="focus-cover svelte-1uha8ag"${attr("src", portal.image)}${attr("alt", `Bild for ${portal.title}`)} loading="lazy"/> <div class="focus-body svelte-1uha8ag"><span class="focus-icon svelte-1uha8ag">${escape_html(portal.icon)}</span> <h3 class="svelte-1uha8ag">${escape_html(portal.title)}</h3> <p class="svelte-1uha8ag">${escape_html(portal.description)}</p> <span class="focus-cta svelte-1uha8ag">Börja skriva</span></div></a>`);
    }
    $$renderer2.push(`<!--]--></div></div></section> <section class="band band-olive svelte-1uha8ag"><div class="narrow intro-grid svelte-1uha8ag"><img src="/assets/home/Tryggplats.png" alt="Trygg plats" loading="lazy" class="svelte-1uha8ag"/> <div><h2 class="svelte-1uha8ag">Ett tryggt rum online</h2> <p class="svelte-1uha8ag">MittPsyke är byggt för att ge lugn, struktur och varsamt stöd när tankarna blir tunga.</p> <p class="svelte-1uha8ag">Du väljer själv tempo, fokus och vilken inriktning som passar din situation just nu.</p></div></div></section> <section class="band band-brown svelte-1uha8ag"><div class="narrow support-grid svelte-1uha8ag"><div><h2 class="svelte-1uha8ag">Din väg till psykiskt stöd</h2> <p class="svelte-1uha8ag">Varje portal är specialiserad för att skapa ett mer träffsäkert och tryggt samtal.</p> <ul class="svelte-1uha8ag"><li>stabilt stöd för oro och ångest</li> <li>varsam struktur vid nedstämdhet</li> <li>fokus på trygghet och gränssättning vid trauma</li></ul> <p class="svelte-1uha8ag">Målet är inte snabba svar, utan ett hållbart samtal där du kan landa och ta nästa steg.</p></div> <img src="/assets/home/Digitalastod.PNG" alt="Digitalt stöd" loading="lazy" class="svelte-1uha8ag"/></div></section></main>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BH3-m7hz.js.map
