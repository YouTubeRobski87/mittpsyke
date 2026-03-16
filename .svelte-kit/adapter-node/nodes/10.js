import * as server from '../entries/pages/avregistrera/_page.server.ts.js';

export const index = 10;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/avregistrera/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/avregistrera/+page.server.ts";
export const imports = ["_app/immutable/nodes/10.eK0NqdpW.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/DlT2UkvB.js","_app/immutable/chunks/CqSsvO_u.js","_app/immutable/chunks/CHmE6rIj.js","_app/immutable/chunks/B-RXaeeq.js","_app/immutable/chunks/rGX2rA98.js"];
export const stylesheets = ["_app/immutable/assets/10.Bcn2Zh4L.css"];
export const fonts = [];
