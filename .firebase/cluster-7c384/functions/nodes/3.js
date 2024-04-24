

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/hello/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/3.0977fa0e.js","_app/immutable/chunks/scheduler.1ccb5123.js","_app/immutable/chunks/index.2c9ab685.js"];
export const stylesheets = [];
export const fonts = [];
