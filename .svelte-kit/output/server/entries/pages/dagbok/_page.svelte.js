import { f as ssr_context, h as head } from "../../../chunks/index.js";
import "clsx";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import "../../../chunks/supabase.js";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    onDestroy(() => {
    });
    head("1sw7vr1", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Dagbok - MittPsyke</title>`);
      });
    });
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="container py-16 text-center opacity-60">Laddar...</div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
