import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.CA9p79Du.js","_app/immutable/chunks/CDIhw-iK.js","_app/immutable/chunks/DeMzE8zu.js","_app/immutable/chunks/CAl755fi.js","_app/immutable/chunks/LlDTYJ_2.js","_app/immutable/chunks/BNroBeFL.js","_app/immutable/chunks/Dhpr8sJ4.js","_app/immutable/chunks/D6nq6o6X.js","_app/immutable/chunks/u2b8vKDI.js","_app/immutable/chunks/BFbvfCJL.js"];
export const stylesheets = ["_app/immutable/assets/0.Drn1Hhcd.css"];
export const fonts = [];
