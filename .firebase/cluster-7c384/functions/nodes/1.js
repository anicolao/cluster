

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.02d5fde1.js","_app/immutable/chunks/scheduler.1ccb5123.js","_app/immutable/chunks/index.2c9ab685.js","_app/immutable/chunks/singletons.73219050.js"];
export const stylesheets = [];
export const fonts = [];
