import { h as head, a as ensure_array_like, b as attr, e as escape_html } from "../../../chunks/index.js";
import { p as pillars, t as tools } from "../../../chunks/seo-architecture.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const pillarLabelBySlug = Object.fromEntries(pillars.map((pillar) => [pillar.slug, pillar.title]));
    head("18zxqx9", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Övningar | Verktyg i lugn takt | MittPsyke</title>`);
      });
      $$renderer3.push(`<meta name="description" content="Praktiska övningar för ångest, stress, självkänsla, relationer och mental återhämtning i lugn takt."/> <meta property="og:title" content="Övningar | Verktyg i lugn takt | MittPsyke"/> <meta property="og:description" content="Utforska lugna övningar för reflektion, ångest, oro och återhämtning. Börja där du är och ta små steg."/> <link rel="canonical" href="https://mittpsyke.se/ovningar"/>`);
    });
    $$renderer2.push(`<main class="container tools-page svelte-18zxqx9"><header class="intro svelte-18zxqx9"><h1 class="svelte-18zxqx9">Övningar</h1> <p class="svelte-18zxqx9">Välkomponerade steg-för-steg-övningar som du kan använda direkt i vardagen.</p> <p class="intro-note svelte-18zxqx9">Övningarna är tänkta som stöd för reflektion och lugn. De ersätter inte vård, diagnos eller behandling.</p></header> <section class="links-block svelte-18zxqx9" aria-label="Fördjupning"><p>Om du vill börja med ångestrelaterade verktyg kan du läsa mer om <a href="/andningsovningar-mot-angest" class="svelte-18zxqx9">andningsövningar mot ångest</a> eller <a href="/ovningar-mot-angest-online" class="svelte-18zxqx9">övningar mot ångest online</a>.
			Du kan också läsa om <a href="/4-7-8-andning-ovning" class="svelte-18zxqx9">4-7-8 andning övning</a> och <a href="/exponering-ovningar-mot-angest" class="svelte-18zxqx9">exponering övningar mot ångest</a>.</p></section> <section class="grid svelte-18zxqx9" aria-label="Alla övningar"><!--[-->`);
    const each_array = ensure_array_like(tools);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let tool = each_array[$$index];
      $$renderer2.push(`<a class="card svelte-18zxqx9"${attr("href", `/ovningar/${tool.slug}`)}><h2 class="svelte-18zxqx9">${escape_html(tool.title)}</h2> <p class="svelte-18zxqx9">${escape_html(tool.description)}</p> <span class="meta svelte-18zxqx9">${escape_html(pillarLabelBySlug[tool.pillarSlug])}</span></a>`);
    }
    $$renderer2.push(`<!--]--></section></main>`);
  });
}
export {
  _page as default
};
