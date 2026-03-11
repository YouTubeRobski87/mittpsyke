import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.sSlNgBj7.js","_app/immutable/chunks/D6s-Oylg.js","_app/immutable/chunks/B-UAtJHB.js","_app/immutable/chunks/wmoIkXtC.js","_app/immutable/chunks/DVMfq8EW.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/B5Jmxh4I.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/DVIpZhjl.js","_app/immutable/chunks/CEzjo8uT.js","_app/immutable/chunks/Bk8wH2sw.js","_app/immutable/chunks/Cu1lG7Hr.js","_app/immutable/chunks/C_n270vL.js","_app/immutable/chunks/YZ4iP_vp.js","_app/immutable/chunks/BarRw8po.js","_app/immutable/chunks/CGEkWFwX.js"];
export const stylesheets = ["_app/immutable/assets/0.Dahtgf3I.css"];
export const fonts = [];
