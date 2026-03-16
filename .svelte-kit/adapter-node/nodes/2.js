import * as universal from '../entries/pages/_page.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+page.js";
export const imports = ["_app/immutable/nodes/2.X1Z73wAD.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/Bk7auq0c.js","_app/immutable/chunks/DlT2UkvB.js","_app/immutable/chunks/D6dMlv6x.js","_app/immutable/chunks/CqSsvO_u.js","_app/immutable/chunks/Bi9XG5rR.js","_app/immutable/chunks/B-RXaeeq.js","_app/immutable/chunks/2XERNgEC.js","_app/immutable/chunks/rGX2rA98.js","_app/immutable/chunks/BPWqAAGZ.js","_app/immutable/chunks/TchEhpiA.js","_app/immutable/chunks/CzyT58rr.js","_app/immutable/chunks/CHmE6rIj.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/D8-W2HOT.js","_app/immutable/chunks/CoBLP8aw.js","_app/immutable/chunks/Cg5pz6k7.js"];
export const stylesheets = ["_app/immutable/assets/2.BZRiMKJt.css"];
export const fonts = [];
