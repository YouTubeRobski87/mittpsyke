import * as universal from '../entries/pages/_page.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+page.js";
export const imports = ["_app/immutable/nodes/2.CyBAkaeo.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/td4CxS7I.js","_app/immutable/chunks/BQr_Q-x4.js","_app/immutable/chunks/JdD-YLJe.js","_app/immutable/chunks/BOQfYkl3.js","_app/immutable/chunks/Bfc1vJWG.js","_app/immutable/chunks/CYgZKK4h.js","_app/immutable/chunks/B7cFAAl_.js","_app/immutable/chunks/kHPNoaER.js","_app/immutable/chunks/DMwWxkBP.js","_app/immutable/chunks/CZMIbMsR.js","_app/immutable/chunks/CzyT58rr.js","_app/immutable/chunks/MT3Jh7cz.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/BAGRYuLo.js","_app/immutable/chunks/C8RLevSm.js"];
export const stylesheets = ["_app/immutable/assets/2.CBnAsP-L.css"];
export const fonts = [];
