import { h as head, a as ensure_array_like, b as attr, e as escape_html } from "../../../chunks/index.js";
import { p as pillars } from "../../../chunks/seo-architecture.js";
function _page($$renderer) {
  head("1mgpyhj", $$renderer, ($$renderer2) => {
    $$renderer2.title(($$renderer3) => {
      $$renderer3.push(`<title>Guider | MittPsyke</title>`);
    });
    $$renderer2.push(`<meta name="description" content="Utforska MittPsykes guider inom ångest, stress, självkänsla, relationer och mer."/>`);
  });
  $$renderer.push(`<main class="container guides-page svelte-1mgpyhj"><header class="intro svelte-1mgpyhj"><h1 class="svelte-1mgpyhj">Guider</h1> <p class="svelte-1mgpyhj">Välj ett område och läs en samlad, lugn guide med relaterade artiklar och praktiska övningar.</p> <p class="intro-note svelte-1mgpyhj">Innehållet är sammanställt av MittPsyke som stöd för reflektion och ökad förståelse. Det ersätter inte vård eller behandling.</p></header> <section class="grid svelte-1mgpyhj" aria-label="Alla guider"><!--[-->`);
  const each_array = ensure_array_like(pillars);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let pillar = each_array[$$index];
    $$renderer.push(`<a class="card svelte-1mgpyhj"${attr("href", `/guider/${pillar.slug}`)}><h2 class="svelte-1mgpyhj">${escape_html(pillar.title)}</h2> <p class="svelte-1mgpyhj">${escape_html(pillar.description)}</p> <span class="meta svelte-1mgpyhj">${escape_html(pillar.clusterTopics.length)} klusterartiklar</span></a>`);
  }
  $$renderer.push(`<!--]--></section></main>`);
}
export {
  _page as default
};
