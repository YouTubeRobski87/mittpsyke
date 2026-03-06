import { e as error } from './index-CoD1IJuy.js';
import { b as getToolBySlug, g as getPillarBySlug } from './seo-architecture-ZA-Q5W2W.js';

function load({ params }) {
  const tool = getToolBySlug(params.tool);
  if (!tool) {
    throw error(404, "Övningen hittades inte");
  }
  const pillar = getPillarBySlug(tool.pillarSlug);
  if (!pillar) {
    throw error(500, "Kunde inte hitta tillhörande guide");
  }
  return {
    tool,
    pillar
  };
}

var _page_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 14;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-wHUB5bTc.js')).default;
const universal_id = "src/routes/ovningar/[tool]/+page.ts";
const imports = ["_app/immutable/nodes/14.ClYOjT46.js","_app/immutable/chunks/CBbuBPfZ.js","_app/immutable/chunks/BUApaBEI.js","_app/immutable/chunks/DBn-GJYj.js","_app/immutable/chunks/BAD376BG.js","_app/immutable/chunks/RwQtde1r.js","_app/immutable/chunks/DqFXm5_V.js","_app/immutable/chunks/YaPhPclm.js","_app/immutable/chunks/CGSwyzFb.js"];
const stylesheets = ["_app/immutable/assets/14.BJOqsMDh.css"];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page_ts as universal, universal_id };
//# sourceMappingURL=14-Li10XFaW.js.map
