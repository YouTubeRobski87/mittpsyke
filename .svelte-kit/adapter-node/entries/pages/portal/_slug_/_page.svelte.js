import { h as head, e as escape_html, b as attr, s as stringify, d as derived } from "../../../../chunks/index.js";
import { g as getPortalByKey } from "../../../../chunks/portals.js";
import { p as page } from "../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const slug = derived(() => page.params.slug ?? "");
    const portal = derived(() => getPortalByKey(slug()));
    head("1i6828p", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(portal() ? portal().title : "Portal")} – MittPsyke</title>`);
      });
    });
    if (portal()) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<section class="container py-16 text-center max-w-xl mx-auto"><span class="text-5xl block mb-4">${escape_html(portal().icon)}</span> <h1 class="text-3xl font-bold mb-3">${escape_html(portal().title)}</h1> <p class="opacity-75 leading-relaxed mb-8">${escape_html(portal().description)}</p> <a${attr("href", `/chat/${stringify(portal().key)}`)} class="inline-flex items-center justify-center px-6 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity">Börja samtala</a></section>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
