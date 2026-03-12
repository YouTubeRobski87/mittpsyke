import * as universal from '../entries/pages/dagbok/_page.js';

export const index = 15;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dagbok/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/dagbok/+page.js";
export const imports = ["_app/immutable/nodes/15.BXc4SjfL.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/JdD-YLJe.js","_app/immutable/chunks/BQr_Q-x4.js","_app/immutable/chunks/BOQfYkl3.js","_app/immutable/chunks/MT3Jh7cz.js","_app/immutable/chunks/Bfc1vJWG.js","_app/immutable/chunks/C_KV6prj.js","_app/immutable/chunks/CYgZKK4h.js","_app/immutable/chunks/B7cFAAl_.js","_app/immutable/chunks/kHPNoaER.js","_app/immutable/chunks/C6hIir7v.js","_app/immutable/chunks/DMwWxkBP.js","_app/immutable/chunks/CL9dHE6z.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/CD0uLGFz.js","_app/immutable/chunks/CQz5IhF6.js"];
export const stylesheets = [];
export const fonts = [];
