import { h as head } from "../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import "../../../../chunks/supabase.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    head("1t3utr2", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Kontoinställningar - MittPsyke</title>`);
      });
    });
    $$renderer2.push(`<main class="settings-page container svelte-1t3utr2">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="loading-copy svelte-1t3utr2">Laddar inställningar...</p>`);
    }
    $$renderer2.push(`<!--]--></main>`);
  });
}
export {
  _page as default
};
