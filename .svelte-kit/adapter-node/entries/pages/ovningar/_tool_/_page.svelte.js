import { h as head, e as escape_html, a as attr } from "../../../../chunks/index2.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    head("7bxy88", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.tool.title)} | Övningar | MittPsyke</title>`);
      });
      $$renderer3.push(`<meta name="description"${attr("content", data.tool.description)}/>`);
    });
    $$renderer2.push(`<main class="container tool-page svelte-7bxy88"><nav class="crumbs svelte-7bxy88" aria-label="Breadcrumb"><a href="/">Hem</a> <span>/</span> <a href="/ovningar">Övningar</a> <span>/</span> <span>${escape_html(data.tool.title)}</span></nav> <header class="intro svelte-7bxy88"><h1 class="svelte-7bxy88">${escape_html(data.tool.title)}</h1> <p class="svelte-7bxy88">${escape_html(data.tool.description)}</p></header> <section class="info-box svelte-7bxy88" aria-label="Om övningen"><p class="svelte-7bxy88"><strong>Sammanställt av MittPsyke.</strong> Övningen är ett stöd för reflektion och lugn i vardagen.</p> <p class="svelte-7bxy88">Den ersätter inte vård, diagnos eller behandling. Om något känns för starkt kan du pausa och välja ett mindre steg.</p></section> <section class="block svelte-7bxy88"><h2 class="svelte-7bxy88">Guide i samma område</h2> <p class="svelte-7bxy88">Övningen hör ihop med guiden <a${attr("href", `/guider/${data.pillar.slug}`)} class="svelte-7bxy88">${escape_html(data.pillar.title)}</a> om du vill ha mer bakgrund och fler steg.</p></section> <section class="block svelte-7bxy88"><h2 class="svelte-7bxy88">Så går övningen till</h2> <ol class="step-list svelte-7bxy88"><li class="svelte-7bxy88">Läs igenom syftet med övningen.</li> <li class="svelte-7bxy88">Avsätt 5-15 minuter i en lugn miljö.</li> <li class="svelte-7bxy88">Följ stegen i din egen takt.</li> <li class="svelte-7bxy88">Reflektera kort över vad du märker efteråt.</li></ol></section> `);
    if (data.tool.slug === "4-7-8-andning") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<section class="block svelte-7bxy88"><h2 class="svelte-7bxy88">Fördjupa vidare</h2> <ul class="link-list svelte-7bxy88"><li class="svelte-7bxy88"><a href="/4-7-8-andning-ovning" class="svelte-7bxy88">Läs mer om 4-7-8 andning</a></li> <li class="svelte-7bxy88"><a href="/andningsovningar-mot-angest" class="svelte-7bxy88">Se fler andningsövningar mot ångest</a></li> <li class="svelte-7bxy88"><a href="/ovningar-mot-angest-online" class="svelte-7bxy88">Utforska övningar mot ångest online</a></li> <li class="svelte-7bxy88"><a href="/hjalp-vid-angest-online" class="svelte-7bxy88">Läs mer om hjälp vid ångest online</a></li></ul></section>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <section class="block svelte-7bxy88"><h2 class="svelte-7bxy88">Läs vidare</h2> <p class="svelte-7bxy88">Du kan läsa vidare i guiden <a${attr("href", `/guider/${data.pillar.slug}`)} class="svelte-7bxy88">${escape_html(data.pillar.title)}</a> och utforska fler övningar i samma område när du vill ta nästa steg.</p></section></main>`);
  });
}
export {
  _page as default
};
