import { h as head, a4 as attr_style, d as derived } from "../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import "../../../chunks/supabase.js";
import { g as getCachedTheme } from "../../../chunks/theme.js";
const DAILY_PROMPTS = [
  "Vad snurrar i huvudet just nu?",
  "Vad gav dig lite lugn idag?",
  "Vad tog mest energi idag?",
  "Vad behöver du just nu?",
  "Vad var lite lättare idag?",
  "Vad bar du på idag som du vill lägga ner en stund?",
  "Vad skulle du vilja göra mer av?",
  "Vad fick dig att andas ut idag?",
  "Vad är du glad att du klarade av idag?",
  "Hur behandlade du dig själv idag?",
  "Vad ville du egentligen säga men höll inne med?",
  "Vad kändes tungt idag?",
  "Vad gav dig en liten stund av frihet?",
  "Vad är du tacksam för just nu, hur liten det än är?",
  "Vad vill du lämna bakom dig idag?",
  "Vad behöver du höra just nu?",
  "Vad är du nyfiken på i ditt eget liv?",
  "Vad fick dig att stanna upp idag?",
  "Vad bar du på idag som ingen annan visste om?",
  "Vad skulle framtida du tacka dig för idag?",
  "Vad vill du ge dig själv tillåtelse att känna?",
  "Vad är du inte färdig med att bearbeta än?",
  "Vad fick dig att le, om än kort, idag?",
  "Hur mår kroppen just nu — inte tankarna, utan kroppen?"
];
function hashDate(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = hash * 31 + dateStr.charCodeAt(i) & 4294967295;
  }
  return Math.abs(hash);
}
function getDailyPrompt() {
  const today = (/* @__PURE__ */ new Date()).toDateString();
  const index = hashDate(today) % DAILY_PROMPTS.length;
  return DAILY_PROMPTS[index];
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    getCachedTheme();
    getDailyPrompt();
    const themeStyle = derived(() => `--theme-accent: \${currentTheme.accent}; --theme-bg: \${currentTheme.bg};`);
    head("x1i5gj", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Min portal - MittPsyke</title>`);
      });
    });
    $$renderer2.push(`<main class="portal-page container svelte-x1i5gj"${attr_style(themeStyle())}>`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="loading-copy svelte-x1i5gj">Laddar din portal. Det kan ta en liten stund.</p>`);
    }
    $$renderer2.push(`<!--]--></main>`);
  });
}
export {
  _page as default
};
