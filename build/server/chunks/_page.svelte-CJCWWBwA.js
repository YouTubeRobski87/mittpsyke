import { h as head, f as ensure_array_like, c as attr, d as escape_html } from './index-CtSeC24C.js';
import { p as pillars, t as tools } from './seo-architecture-ZA-Q5W2W.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const pillarLabelBySlug = Object.fromEntries(pillars.map((pillar) => [pillar.slug, pillar.title]));
    head("18zxqx9", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Övningar | MittPsyke</title>`);
      });
      $$renderer3.push(`<meta name="description" content="Praktiska övningar för ångest, stress, självkänsla, relationer och mental återhämtning."/>`);
    });
    $$renderer2.push(`<main class="container tools-page svelte-18zxqx9"><header class="intro svelte-18zxqx9"><h1 class="svelte-18zxqx9">Övningar</h1> <p class="svelte-18zxqx9">Välkomponerade steg-för-steg-övningar som du kan använda direkt i vardagen.</p></header> <section class="grid svelte-18zxqx9" aria-label="Alla övningar"><!--[-->`);
    const each_array = ensure_array_like(tools);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let tool = each_array[$$index];
      $$renderer2.push(`<a class="card svelte-18zxqx9"${attr("href", `/ovningar/${tool.slug}`)}><h2 class="svelte-18zxqx9">${escape_html(tool.title)}</h2> <p class="svelte-18zxqx9">${escape_html(tool.description)}</p> <span class="meta svelte-18zxqx9">${escape_html(pillarLabelBySlug[tool.pillarSlug])}</span></a>`);
    }
    $$renderer2.push(`<!--]--></section></main>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CJCWWBwA.js.map
