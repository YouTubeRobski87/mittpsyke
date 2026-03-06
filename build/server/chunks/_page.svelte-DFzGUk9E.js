import { h as head, d as escape_html, c as attr, l as stringify, j as derived } from './index-CtSeC24C.js';
import { g as getPortalByKey } from './portals-dDiiJZBT.js';
import { p as page } from './index2-CQEO0GnZ.js';
import './root-D-GT__9B.js';
import './state.svelte-BDsCnSn7.js';
import './index3-BhvTCElu.js';

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

export { _page as default };
//# sourceMappingURL=_page.svelte-DFzGUk9E.js.map
