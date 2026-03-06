import { h as head, c as attr, d as escape_html } from './index-CtSeC24C.js';
import './supabase-CC3ezZS5.js';
import './root-D-GT__9B.js';
import './state.svelte-BDsCnSn7.js';
import '@supabase/supabase-js';
import './shared-server-DaWdgxVh.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let email = "";
    let password = "";
    let loading = false;
    head("1x05zx6", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Logga in – MittPsyke</title>`);
      });
    });
    $$renderer2.push(`<section class="container max-w-sm py-16"><h1 class="text-2xl font-bold text-center mb-6">Logga in</h1> <form class="space-y-4"><input type="email"${attr("value", email)} placeholder="E-post" required="" class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 outline-none focus:border-[var(--primary)] transition-colors"/> <input type="password"${attr("value", password)} placeholder="Lösenord" required="" class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 outline-none focus:border-[var(--primary)] transition-colors"/> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <button type="submit"${attr("disabled", loading, true)} class="w-full px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white font-medium disabled:opacity-40 transition-opacity">${escape_html("Logga in")}</button></form> <p class="text-center text-sm mt-4 opacity-70">Inget konto? <a href="/register" class="underline">Registrera dig</a></p></section>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CIpIqitA.js.map
