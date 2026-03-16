import * as universal from '../entries/pages/angest/_page.js';

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/angest/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/angest/+page.js";
export const imports = ["_app/immutable/nodes/6.CUjw0TxP.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/Bk7auq0c.js","_app/immutable/chunks/DlT2UkvB.js","_app/immutable/chunks/B-RXaeeq.js"];
export const stylesheets = ["_app/immutable/assets/6.BhjECXv7.css"];
export const fonts = [];
