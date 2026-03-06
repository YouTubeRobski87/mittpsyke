import { a as ensure_array_like, c as attr_class, s as stringify, e as escape_html, b as attr, h as head, d as derived } from "../../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import "../../../../chunks/supabase.js";
import { g as getPortalByKey } from "../../../../chunks/portals.js";
import { p as page } from "../../../../chunks/index2.js";
function ChatWindow($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let messages = [];
    let input = "";
    let savePromptHidden = {};
    $$renderer2.push(`<div class="chat-container flex flex-col h-[calc(100vh-200px)] max-w-2xl mx-auto"><div class="chat-messages flex-1 overflow-y-auto p-4 space-y-3">`);
    if (messages.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-center mt-6"><img src="/assets/mittpsyke-hero.png" alt="" class="mx-auto mb-4 opacity-80" style="max-width: 220px"/> <p class="text-sm opacity-70 mb-2">Hur mår du?</p> <p class="text-center opacity-60">Skriv något så börjar vi prata. Allt sker utan dömande.</p></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <!--[-->`);
    const each_array = ensure_array_like(messages);
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let msg = each_array[i];
      $$renderer2.push(`<div class="space-y-1"><div${attr_class(`flex ${stringify(msg.role === "user" ? "justify-end" : "justify-start")}`)}><div${attr_class(`max-w-[80%] px-4 py-3 rounded-[var(--radius-card)] text-sm leading-relaxed ${stringify(msg.role === "user" ? "bg-[var(--primary)] text-white rounded-br-md" : "bg-black/5 dark:bg-white/10 rounded-bl-md")}`)}><!--[-->`);
      const each_array_1 = ensure_array_like(msg.content.split("\n"));
      for (let j = 0, $$length2 = each_array_1.length; j < $$length2; j++) {
        let line = each_array_1[j];
        if (j > 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<br/>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> ${escape_html(line)}`);
      }
      $$renderer2.push(`<!--]--></div></div> `);
      if (msg.role === "assistant" && !savePromptHidden[i]) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="text-xs opacity-55 px-1 text-left">Vill du spara detta som anteckning? <button type="button" class="ml-1 underline hover:opacity-100 transition-opacity">Ja</button></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="chat-input-area border-t border-black/8 dark:border-white/10 p-4"><div class="flex gap-2"><textarea placeholder="Skriv här..."${attr("rows", 1)} class="flex-1 resize-none rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus:border-[var(--primary)] transition-colors">`);
    const $$body = escape_html(input);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea> <button${attr("disabled", !input.trim(), true)} class="px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white text-sm font-medium disabled:opacity-40 transition-opacity">Skicka</button></div> <p class="mt-3 sm:mt-2 text-xs opacity-60 text-center sm:text-left">Behöver du akut stöd? <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="underline opacity-75 hover:opacity-100 transition-opacity">Stödlinjer</a></p> <div class="mt-3 text-center"><a href="mailto:mittpsyke@ownit.nu" class="inline-block px-4 py-2 rounded-[12px] bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-200 text-sm font-medium hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors border border-teal-200 dark:border-teal-800/50" title="Skicka e-post till support">Kontakta oss</a></div></div></div>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const category = derived(() => page.params.category ?? "");
    const portal = derived(() => getPortalByKey(category()));
    head("1dpu1ns", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(portal() ? portal().title : "Chatt")} - MittPsyke</title>`);
      });
    });
    $$renderer2.push(`<div class="container py-6" data-page="chat">`);
    if (portal()) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="portal-header text-center mb-4"><span class="text-2xl">${escape_html(portal().icon)}</span> <h1 class="text-xl font-semibold mt-1">${escape_html(portal().title)}</h1> <p class="text-sm opacity-70">${escape_html(portal().description)}</p></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    ChatWindow($$renderer2, { category: category() });
    $$renderer2.push(`<!----></div>`);
  });
}
export {
  _page as default
};
