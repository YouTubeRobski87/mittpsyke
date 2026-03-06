import { e as error } from './index-CoD1IJuy.js';
import { g as getPillarBySlug, a as getToolsForPillar } from './seo-architecture-ZA-Q5W2W.js';

function load({ params }) {
  const pillar = getPillarBySlug(params.pillar);
  if (!pillar) {
    throw error(404, "Guiden hittades inte");
  }
  return {
    pillar,
    tools: getToolsForPillar(pillar.slug)
  };
}

var _page_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 9;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-kNOIwGPj.js')).default;
const universal_id = "src/routes/guider/[pillar]/+page.ts";
const imports = ["_app/immutable/nodes/9.B2HEgLXP.js","_app/immutable/chunks/CBbuBPfZ.js","_app/immutable/chunks/BUApaBEI.js","_app/immutable/chunks/DBn-GJYj.js","_app/immutable/chunks/BAD376BG.js","_app/immutable/chunks/RwQtde1r.js","_app/immutable/chunks/DqFXm5_V.js","_app/immutable/chunks/BLGx2bIs.js","_app/immutable/chunks/YaPhPclm.js","_app/immutable/chunks/CGSwyzFb.js"];
const stylesheets = ["_app/immutable/assets/9.CJwsXTzX.css"];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page_ts as universal, universal_id };
//# sourceMappingURL=9-BV_-7pZl.js.map
