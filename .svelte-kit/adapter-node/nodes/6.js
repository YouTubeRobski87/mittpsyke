import * as universal from '../entries/pages/angest/_page.js';

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/angest/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/angest/+page.js";
export const imports = ["_app/immutable/nodes/6.C0v6L_wQ.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BTdkizQl.js","_app/immutable/chunks/wmoIkXtC.js","_app/immutable/chunks/Bk8wH2sw.js"];
export const stylesheets = ["_app/immutable/assets/6.Dnbq8kK3.css"];
export const fonts = [];
