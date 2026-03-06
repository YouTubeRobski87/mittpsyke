import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.CpKYmgIw.js","_app/immutable/chunks/Ii4lj8Yz.js","_app/immutable/chunks/RwQtde1r.js","_app/immutable/chunks/BUApaBEI.js","_app/immutable/chunks/diwoDcsS.js","_app/immutable/chunks/BAD376BG.js","_app/immutable/chunks/DqFXm5_V.js","_app/immutable/chunks/yyO-L5D3.js","_app/immutable/chunks/YaPhPclm.js","_app/immutable/chunks/CGSwyzFb.js","_app/immutable/chunks/C3NTvTqd.js","_app/immutable/chunks/DO5KUeOO.js","_app/immutable/chunks/PUQKrAem.js"];
export const stylesheets = ["_app/immutable/assets/0.BI0bSF6U.css"];
export const fonts = [];
