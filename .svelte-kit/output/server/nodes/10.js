

export const index = 10;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/ensamhet/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/10.DsBMjXwb.js","_app/immutable/chunks/BAD376BG.js","_app/immutable/chunks/RwQtde1r.js","_app/immutable/chunks/DmhVe2Q0.js","_app/immutable/chunks/YaPhPclm.js"];
export const stylesheets = ["_app/immutable/assets/10.D3dwumQa.css"];
export const fonts = [];
