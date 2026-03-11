import * as universal from '../entries/pages/_page.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+page.js";
export const imports = ["_app/immutable/nodes/2.D5dKJoly.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BTdkizQl.js","_app/immutable/chunks/wmoIkXtC.js","_app/immutable/chunks/B-UAtJHB.js","_app/immutable/chunks/DVMfq8EW.js","_app/immutable/chunks/DTqKR8XC.js","_app/immutable/chunks/Bk8wH2sw.js","_app/immutable/chunks/Cu1lG7Hr.js","_app/immutable/chunks/C_n270vL.js","_app/immutable/chunks/Eiok-8fY.js","_app/immutable/chunks/DDxRFn9B.js","_app/immutable/chunks/CzyT58rr.js","_app/immutable/chunks/DVIpZhjl.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/DUyozL3x.js","_app/immutable/chunks/Z4wxj_Rn.js"];
export const stylesheets = ["_app/immutable/assets/2.ENgRkQby.css"];
export const fonts = [];
