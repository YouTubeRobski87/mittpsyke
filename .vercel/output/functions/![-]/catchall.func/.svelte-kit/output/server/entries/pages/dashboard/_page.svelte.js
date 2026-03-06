import { h as head } from "../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import "../../../chunks/supabase.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    head("x1i5gj", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Min portal - MittPsyke</title>`);
      });
    });
    $$renderer2.push(`<main class="portal-page container svelte-x1i5gj">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="loading-copy svelte-x1i5gj">Laddar din portal...</p>`);
    }
    $$renderer2.push(`<!--]--></main>`);
  });
}
export {
  _page as default
};
