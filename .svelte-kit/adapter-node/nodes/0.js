import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.DqNxtYwY.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BQr_Q-x4.js","_app/immutable/chunks/BOQfYkl3.js","_app/immutable/chunks/MT3Jh7cz.js","_app/immutable/chunks/C_KV6prj.js","_app/immutable/chunks/CYgZKK4h.js","_app/immutable/chunks/B7cFAAl_.js","_app/immutable/chunks/kHPNoaER.js","_app/immutable/chunks/CQz5IhF6.js","_app/immutable/chunks/CHUjuVOA.js","_app/immutable/chunks/CL9dHE6z.js","_app/immutable/chunks/JdD-YLJe.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/D8LvX-uv.js","_app/immutable/chunks/CYgJF_JY.js"];
export const stylesheets = ["_app/immutable/assets/0.DekPwlWw.css"];
export const fonts = [];
