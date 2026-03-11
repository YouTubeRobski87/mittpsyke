import * as server from '../entries/pages/avregistrera/_page.server.ts.js';

export const index = 10;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/avregistrera/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/avregistrera/+page.server.ts";
export const imports = ["_app/immutable/nodes/10.ZmY84nYl.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BQr_Q-x4.js","_app/immutable/chunks/BOQfYkl3.js","_app/immutable/chunks/MT3Jh7cz.js","_app/immutable/chunks/CYgZKK4h.js","_app/immutable/chunks/kHPNoaER.js"];
export const stylesheets = ["_app/immutable/assets/10.Bcn2Zh4L.css"];
export const fonts = [];
