import { a as attr, c as ensure_array_like, b as attr_class, a3 as stringify, e as escape_html, d as derived, h as head } from "../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { C as ConsentGate } from "../../../../chunks/ConsentGate.js";
import { g as grantSensitiveConsent } from "../../../../chunks/consent.js";
import "../../../../chunks/supabase.js";
import { g as getPortalByKey } from "../../../../chunks/portals.js";
import { p as page } from "../../../../chunks/index3.js";
const CRISIS_SIGNALS = Object.freeze([
  "vill inte leva",
  "ta mitt liv",
  "ta livet av mig",
  "självmord",
  "suicid",
  "avsluta allt",
  "avsluta mitt liv",
  "orkar inte mer",
  "orkar inte leva",
  "inte orkar leva",
  "skada mig",
  "skada mig själv",
  "självskad",
  "vill försvinna",
  "försvinna för alltid",
  "allt är hopplöst",
  "ingen mening",
  "ingen mening att leva",
  "vill dö",
  "vill vara död",
  "hoppas att jag dör",
  "bättre om jag var död",
  "ingen anledning att leva",
  "hoppa från",
  "inte vilja finnas",
  "ge upp allt",
  "ge upp hoppet",
  "inget hopp",
  "alla vore bättre utan mig",
  "ingen saknar mig",
  "ingen bryr sig om mig",
  "ta tabletter",
  "ta överdos",
  "avskedsbrev",
  "inte vakna imorgon",
  "inte vakna igen",
  "somna för alltid",
  "somna in för alltid",
  "göra slut på allt",
  "kan inte fortsätta",
  "sista utvägen"
]);
function containsCrisisSignal(text) {
  if (!text) return false;
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  return CRISIS_SIGNALS.some((signal) => normalized.includes(signal));
}
function ChatWindow($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let messages = [];
    let input = "";
    let sending = false;
    let savePromptHidden = {};
    let hasSensitiveDataConsent = false;
    const starterSuggestions = ["Jag känner mig orolig", "Hjälp mig sortera mina tankar"];
    const elevatedSupportKeywords = [
      "för mycket",
      "orkar inte",
      "hopplös",
      "hopplöst",
      "ensam",
      "kan inte mer",
      "prata med någon",
      "prata med en människa",
      "text räcker inte",
      "texten räcker inte"
    ];
    const acuteSupportKeywords = [
      "akut fara",
      "självmord",
      "suicid",
      "ta mitt liv",
      "ta livet av mig",
      "vill dö",
      "vill vara död",
      "orkar inte leva",
      "inte orkar leva",
      "skada mig själv",
      "självskad",
      "skada någon annan",
      "hoppa från",
      "försvinna för alltid",
      "ingen mening att leva",
      "hoppas att jag dör",
      "bättre om jag var död",
      "avsluta allt",
      "avsluta mitt liv",
      "inte vakna",
      "somna för alltid",
      "avskedsbrev",
      "ta tabletter",
      "ta överdos",
      "sista utvägen",
      "göra slut på allt"
    ];
    function latestUserMessageContent() {
      for (let i = messages.length - 1; i >= 0; i -= 1) {
        const msg = messages[i];
        if (msg.role === "user") return msg.content.toLowerCase();
      }
      return "";
    }
    function supportLevel() {
      const text = latestUserMessageContent();
      if (!text) return "standard";
      if (acuteSupportKeywords.some((keyword) => text.includes(keyword)) || containsCrisisSignal(text)) return "acute";
      if (elevatedSupportKeywords.some((keyword) => text.includes(keyword))) return "elevated";
      return "standard";
    }
    let currentSupportLevel = derived(supportLevel);
    let showStarterSuggestions = derived(() => hasSensitiveDataConsent && messages.length === 0 && input.trim().length === 0);
    function acceptSensitiveConsent() {
      grantSensitiveConsent();
      hasSensitiveDataConsent = true;
    }
    $$renderer2.push(`<div class="chat-container flex flex-col h-[calc(100vh-200px)] max-w-2xl mx-auto"><div class="px-4 pb-2 text-right"><a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="text-xs underline opacity-70 hover:opacity-100 transition-opacity">Behöver du mänsklig kontakt? Se stödlinjer</a></div> <div class="chat-messages flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite"${attr("aria-busy", sending)}>`);
    if (messages.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-center mt-4"><p class="text-sm opacity-60">Skriv något så börjar vi prata. Allt sker utan dömande.</p></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <!--[-->`);
    const each_array = ensure_array_like(messages);
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let msg = each_array[i];
      $$renderer2.push(`<div class="space-y-1"><div${attr_class(`flex ${stringify(msg.role === "user" ? "justify-end" : "justify-start")}`)}><div${attr_class(`max-w-[80%] px-4 py-3 rounded-[var(--radius-card)] text-sm leading-relaxed ${stringify(msg.role === "user" ? "bg-[var(--primary)] text-white rounded-br-md" : msg.crisis ? "bg-rose-50 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-700 rounded-bl-md crisis-message" : "bg-black/5 dark:bg-white/10 rounded-bl-md")}`)}><!--[-->`);
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
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="chat-input-area border-t border-black/8 dark:border-white/10 p-4">`);
    if (!hasSensitiveDataConsent) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="mb-3">`);
      ConsentGate($$renderer2, {
        title: "Samtycke innan chatt",
        dataLabel: "Det du skriver i chatten",
        serviceLabel: "AI- och tredjepartstjänster",
        onAccept: acceptSensitiveConsent
      });
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (currentSupportLevel() === "acute") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="mb-3 rounded-[var(--radius-card)] border border-rose-300/70 bg-rose-50 dark:bg-rose-900/20 px-3 py-3 text-sm"><p class="font-medium text-rose-900 dark:text-rose-100">Om du är i akut fara eller riskerar att skada dig själv eller någon annan, ring 112 direkt.</p> <div class="mt-2 flex flex-wrap gap-2"><a href="tel:112" class="support-chip support-chip-urgent svelte-1jlre7m">Ring 112</a> <a href="tel:90101" class="support-chip support-chip-mind svelte-1jlre7m">Mind 90101</a> <a href="tel:1177" class="support-chip svelte-1jlre7m">Ring 1177</a> <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="support-chip svelte-1jlre7m">Se stödlinjer</a></div> <p class="mt-2 text-xs opacity-70">MittPsyke är inte en akuttjänst. Vid akut kris, kontakta alltid professionell hjälp.</p></div>`);
    } else if (currentSupportLevel() === "elevated") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="mb-3 rounded-[var(--radius-card)] border border-amber-300/70 bg-amber-50 dark:bg-amber-900/20 px-3 py-3 text-sm"><p class="text-amber-900 dark:text-amber-100">Du behöver inte bära allt ensam. Här finns stödlinjer om du vill prata med någon.</p> <div class="mt-2 flex flex-wrap gap-2"><a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="support-chip svelte-1jlre7m">Se stödlinjer</a> <a href="tel:+15672921889" class="support-chip svelte-1jlre7m">Prata med någon</a></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="mb-3 rounded-[var(--radius-card)] border border-black/10 dark:border-white/12 bg-black/[0.02] dark:bg-white/[0.03] px-3 py-3 text-sm"><p class="opacity-85">Behöver du mänsklig kontakt? Här finns stödlinjer med chatt och telefon.</p> <div class="mt-2"><a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="support-chip svelte-1jlre7m">Se stödlinjer</a></div></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (showStarterSuggestions()) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="mb-4"><p class="text-xs opacity-55 mb-2">Eller börja med ett förslag:</p> <div class="starter-chips svelte-1jlre7m"><!--[-->`);
      const each_array_2 = ensure_array_like(starterSuggestions);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let suggestion = each_array_2[$$index_2];
        $$renderer2.push(`<button type="button" class="starter-chip svelte-1jlre7m">${escape_html(suggestion)}</button>`);
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<button type="button" class="starter-chip starter-chip-more svelte-1jlre7m">Visa fler…</button>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (hasSensitiveDataConsent) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex gap-2"><label class="sr-only" for="chat-message">Skriv ditt meddelande</label> <textarea id="chat-message" aria-label="Skriv ditt meddelande" placeholder="Skriv här..." aria-describedby="chat-help-text"${attr("rows", 1)} class="flex-1 resize-none rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 focus:border-[var(--primary)] transition-colors">`);
      const $$body = escape_html(input);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea> <button type="button"${attr("disabled", !input.trim(), true)} class="px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white text-sm font-medium disabled:opacity-40 transition-opacity">Skicka</button></div> <p id="chat-help-text" class="mt-2 text-xs opacity-60">Skriv i din egen takt. Vid akut fara, ring 112. För vårdråd, kontakta 1177.</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="mt-3 text-center"><a href="mailto:mittpsyke@ownit.nu" class="inline-block px-4 py-2 rounded-[12px] bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-200 text-sm font-medium hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors border border-teal-200 dark:border-teal-800/50" title="Skicka e-post till support">Kontakta oss</a></div></div></div>`);
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
