import { h as head, e as escape_html, b as ensure_array_like, a as attr } from "../../../../chunks/index.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    head("1misdmc", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.pillar.title)} | Guider | MittPsyke</title>`);
      });
      $$renderer3.push(`<meta name="description"${attr("content", data.pillar.description)}/>`);
    });
    $$renderer2.push(`<main class="container pillar-page svelte-1misdmc"><nav class="crumbs svelte-1misdmc" aria-label="Breadcrumb"><a href="/">Hem</a> <span>/</span> <a href="/guider">Guider</a> <span>/</span> <span>${escape_html(data.pillar.title)}</span></nav> <header class="intro svelte-1misdmc"><h1 class="svelte-1misdmc">${escape_html(data.pillar.title)}</h1> <p class="svelte-1misdmc">${escape_html(data.pillar.description)}</p></header> <section class="block svelte-1misdmc" aria-label="Klusterartiklar"><h2 class="svelte-1misdmc">Klusterartiklar</h2> <ul class="svelte-1misdmc"><!--[-->`);
    const each_array = ensure_array_like(data.pillar.clusterTopics);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let topic = each_array[$$index];
      $$renderer2.push(`<li class="svelte-1misdmc">${escape_html(topic)}</li>`);
    }
    $$renderer2.push(`<!--]--></ul></section> <section class="block svelte-1misdmc" aria-label="Relaterade övningar"><h2 class="svelte-1misdmc">Relaterade övningar</h2> <div class="tool-grid svelte-1misdmc"><!--[-->`);
    const each_array_1 = ensure_array_like(data.tools);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let tool = each_array_1[$$index_1];
      $$renderer2.push(`<a class="tool-card svelte-1misdmc"${attr("href", `/ovningar/${tool.slug}`)}><h3 class="svelte-1misdmc">${escape_html(tool.title)}</h3> <p class="svelte-1misdmc">${escape_html(tool.description)}</p></a>`);
    }
    $$renderer2.push(`<!--]--></div></section></main>`);
  });
}
export {
  _page as default
};
