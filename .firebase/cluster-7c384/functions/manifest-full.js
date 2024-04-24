export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.f7ba0e29.js","app":"_app/immutable/entry/app.262d0f7b.js","imports":["_app/immutable/entry/start.f7ba0e29.js","_app/immutable/chunks/scheduler.1ccb5123.js","_app/immutable/chunks/singletons.73219050.js","_app/immutable/entry/app.262d0f7b.js","_app/immutable/chunks/scheduler.1ccb5123.js","_app/immutable/chunks/index.2c9ab685.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/hello",
				pattern: /^\/hello\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
}
})();
