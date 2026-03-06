import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.Q5oGR3Y5.js","_app/immutable/chunks/B3MuFy6C.js","_app/immutable/chunks/RwQtde1r.js","_app/immutable/chunks/BUApaBEI.js","_app/immutable/chunks/diwoDcsS.js","_app/immutable/chunks/BAD376BG.js","_app/immutable/chunks/DqFXm5_V.js","_app/immutable/chunks/yyO-L5D3.js","_app/immutable/chunks/YaPhPclm.js","_app/immutable/chunks/CGSwyzFb.js","_app/immutable/chunks/Wy1ENC4U.js"];
export const stylesheets = ["_app/immutable/assets/0.BxcEWapz.css"];
export const fonts = [];
