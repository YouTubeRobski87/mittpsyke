import { h as head, f as ensure_array_like, c as attr, d as escape_html } from './index-CtSeC24C.js';
import { p as pillars } from './seo-architecture-ZA-Q5W2W.js';

function _page($$renderer) {
  head("1mgpyhj", $$renderer, ($$renderer2) => {
    $$renderer2.title(($$renderer3) => {
      $$renderer3.push(`<title>Guider | MittPsyke</title>`);
    });
    $$renderer2.push(`<meta name="description" content="Utforska MittPsykes guider inom ångest, stress, självkänsla, relationer och mer."/>`);
  });
  $$renderer.push(`<main class="container guides-page svelte-1mgpyhj"><header class="intro svelte-1mgpyhj"><h1 class="svelte-1mgpyhj">Guider</h1> <p class="svelte-1mgpyhj">Välj ett område och läs en samlad, lugn guide med relaterade artiklar och praktiska övningar.</p></header> <section class="grid svelte-1mgpyhj" aria-label="Alla guider"><!--[-->`);
  const each_array = ensure_array_like(pillars);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let pillar = each_array[$$index];
    $$renderer.push(`<a class="card svelte-1mgpyhj"${attr("href", `/guider/${pillar.slug}`)}><h2 class="svelte-1mgpyhj">${escape_html(pillar.title)}</h2> <p class="svelte-1mgpyhj">${escape_html(pillar.description)}</p> <span class="meta svelte-1mgpyhj">${escape_html(pillar.clusterTopics.length)} klusterartiklar</span></a>`);
  }
  $$renderer.push(`<!--]--></section></main>`);
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DpwOfPRZ.js.map
