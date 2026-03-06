import { h as head, m as ssr_context } from './index-CtSeC24C.js';
import './root-D-GT__9B.js';
import './state.svelte-BDsCnSn7.js';
import './supabase-CC3ezZS5.js';
import '@supabase/supabase-js';
import './shared-server-DaWdgxVh.js';

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

export { _page as default };
//# sourceMappingURL=_page.svelte-CUUzRNya.js.map
