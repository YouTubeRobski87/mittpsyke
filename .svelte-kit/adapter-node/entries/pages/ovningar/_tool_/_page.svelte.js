import { h as head, e as escape_html, b as attr } from "../../../../chunks/index.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    head("7bxy88", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.tool.title)} | Övningar | MittPsyke</title>`);
      });
      $$renderer3.push(`<meta name="description"${attr("content", data.tool.description)}/>`);
    });
    $$renderer2.push(`<main class="container tool-page svelte-7bxy88"><nav class="crumbs svelte-7bxy88" aria-label="Breadcrumb"><a href="/">Hem</a> <span>/</span> <a href="/ovningar">Övningar</a> <span>/</span> <span>${escape_html(data.tool.title)}</span></nav> <header class="intro svelte-7bxy88"><h1 class="svelte-7bxy88">${escape_html(data.tool.title)}</h1> <p class="svelte-7bxy88">${escape_html(data.tool.description)}</p></header> <section class="block svelte-7bxy88"><h2 class="svelte-7bxy88">Tillhörande guide</h2> <p class="svelte-7bxy88">Övningen hör ihop med guiden <a${attr("href", `/guider/${data.pillar.slug}`)} class="svelte-7bxy88">${escape_html(data.pillar.title)}</a>.</p></section> <section class="block svelte-7bxy88"><h2 class="svelte-7bxy88">Arbetsgång</h2> <ol class="svelte-7bxy88"><li class="svelte-7bxy88">Läs igenom syftet med övningen.</li> <li class="svelte-7bxy88">Avsätt 5-15 minuter i lugn miljö.</li> <li class="svelte-7bxy88">Följ stegen i din egen takt.</li> <li class="svelte-7bxy88">Reflektera kort över vad du märker efteråt.</li></ol></section></main>`);
  });
}
export {
  _page as default
};
