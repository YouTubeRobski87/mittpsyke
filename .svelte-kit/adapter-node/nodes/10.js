import * as server from '../entries/pages/avregistrera/_page.server.ts.js';

export const index = 10;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/avregistrera/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/avregistrera/+page.server.ts";
export const imports = ["_app/immutable/nodes/10.C3aQg1dD.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/wmoIkXtC.js","_app/immutable/chunks/DVMfq8EW.js","_app/immutable/chunks/DVIpZhjl.js","_app/immutable/chunks/Bk8wH2sw.js","_app/immutable/chunks/C_n270vL.js"];
export const stylesheets = ["_app/immutable/assets/10.Bcn2Zh4L.css"];
export const fonts = [];
