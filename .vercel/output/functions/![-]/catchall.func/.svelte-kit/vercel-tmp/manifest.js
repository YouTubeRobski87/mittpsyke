export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["MittPsykeLogo.png","MittPsykeLogo2.png","assets/home/25308540-alzheimer-disease-e1669787685700.jpg","assets/home/502094c3-ff57-11f0-8445-0242ac110002-Skärmklipp.png","assets/home/9edf3f6f-ff5a-11f0-b0b3-0242ac110002-AI.webp","assets/home/AdobeStock_1196066086.jpeg","assets/home/AdobeStock_1213619763.jpeg","assets/home/AdobeStock_1861184481.jpeg","assets/home/AdobeStock_569612292.jpeg","assets/home/AdobeStock_569824666.jpeg","assets/home/AdobeStock_587291991.jpeg","assets/home/AdobeStock_593344764.jpeg","assets/home/AdobeStock_601646984.jpeg","assets/home/AdobeStock_731240889.jpeg","assets/home/Angest.jpg","assets/home/Depression.jpg","assets/home/Digitalastod.PNG","assets/home/Firefly-001.png","assets/home/Firefly-002.png","assets/home/Firefly-003.png","assets/home/Firefly-004.png","assets/home/Firefly-005.png","assets/home/Firefly-006.png","assets/home/Firefly-007.png","assets/home/Firefly-008.png","assets/home/Firefly-009.png","assets/home/Firefly-010.png","assets/home/Firefly-011.png","assets/home/Firefly-012.png","assets/home/Firefly-013.png","assets/home/Firefly-014.png","assets/home/Firefly-015.png","assets/home/Firefly-016.png","assets/home/Firefly-017.png","assets/home/Firefly-018.png","assets/home/Firefly-019.png","assets/home/Firefly-020.png","assets/home/Firefly-021.png","assets/home/Firefly-022.png","assets/home/Firefly-023.png","assets/home/Firefly-024.png","assets/home/Firefly-025.png","assets/home/Firefly-026.png","assets/home/Firefly-027.png","assets/home/MittpsykeTree.jpeg","assets/home/MittpsykeTree.jpg","assets/home/Trauma.jpg","assets/home/Tryggplats.png","assets/home/heart.jpeg","assets/recursive/.DS_Store","assets/recursive/fonts/.DS_Store","assets/recursive/fonts/recursive-h/RecursiveH-Black.ttf","assets/recursive/fonts/recursive-h/RecursiveH-Black.woff","assets/recursive/fonts/recursive-h/RecursiveH-Black.woff2","assets/recursive/fonts/recursive-h/RecursiveH-BlackItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-BlackItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-BlackItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-Bold.ttf","assets/recursive/fonts/recursive-h/RecursiveH-Bold.woff","assets/recursive/fonts/recursive-h/RecursiveH-Bold.woff2","assets/recursive/fonts/recursive-h/RecursiveH-BoldItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-BoldItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-BoldItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBlack.ttf","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBlack.woff","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBlack.woff2","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBlackItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBlackItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBlackItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBold.ttf","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBold.woff","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBold.woff2","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBoldItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBoldItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBoldItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-Heavy.ttf","assets/recursive/fonts/recursive-h/RecursiveH-Heavy.woff","assets/recursive/fonts/recursive-h/RecursiveH-Heavy.woff2","assets/recursive/fonts/recursive-h/RecursiveH-HeavyItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-HeavyItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-HeavyItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-Light.ttf","assets/recursive/fonts/recursive-h/RecursiveH-Light.woff","assets/recursive/fonts/recursive-h/RecursiveH-Light.woff2","assets/recursive/fonts/recursive-h/RecursiveH-LightItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-LightItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-LightItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-Medium.ttf","assets/recursive/fonts/recursive-h/RecursiveH-Medium.woff","assets/recursive/fonts/recursive-h/RecursiveH-Medium.woff2","assets/recursive/fonts/recursive-h/RecursiveH-MediumItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-MediumItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-MediumItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-Regular.ttf","assets/recursive/fonts/recursive-h/RecursiveH-Regular.woff","assets/recursive/fonts/recursive-h/RecursiveH-Regular.woff2","assets/recursive/fonts/recursive-h/RecursiveH-RegularItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-RegularItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-RegularItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-SemiBold.ttf","assets/recursive/fonts/recursive-h/RecursiveH-SemiBold.woff","assets/recursive/fonts/recursive-h/RecursiveH-SemiBold.woff2","assets/recursive/fonts/recursive-h/RecursiveH-SemiBoldItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-SemiBoldItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-SemiBoldItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-Black.ttf","assets/recursive/fonts/recursive-t/RecursiveT-Black.woff","assets/recursive/fonts/recursive-t/RecursiveT-Black.woff2","assets/recursive/fonts/recursive-t/RecursiveT-BlackItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-BlackItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-BlackItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-Bold.ttf","assets/recursive/fonts/recursive-t/RecursiveT-Bold.woff","assets/recursive/fonts/recursive-t/RecursiveT-Bold.woff2","assets/recursive/fonts/recursive-t/RecursiveT-BoldItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-BoldItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-BoldItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-Book.ttf","assets/recursive/fonts/recursive-t/RecursiveT-Book.woff","assets/recursive/fonts/recursive-t/RecursiveT-Book.woff2","assets/recursive/fonts/recursive-t/RecursiveT-BookItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-BookItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-BookItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBlack.ttf","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBlack.woff","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBlack.woff2","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBlackItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBlackItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBlackItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBold.ttf","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBold.woff","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBold.woff2","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBoldItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBoldItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBoldItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-ExtraLight.ttf","assets/recursive/fonts/recursive-t/RecursiveT-ExtraLight.woff","assets/recursive/fonts/recursive-t/RecursiveT-ExtraLight.woff2","assets/recursive/fonts/recursive-t/RecursiveT-ExtraLightItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-ExtraLightItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-ExtraLightItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-Light.ttf","assets/recursive/fonts/recursive-t/RecursiveT-Light.woff","assets/recursive/fonts/recursive-t/RecursiveT-Light.woff2","assets/recursive/fonts/recursive-t/RecursiveT-LightItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-LightItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-LightItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-Medium.ttf","assets/recursive/fonts/recursive-t/RecursiveT-Medium.woff","assets/recursive/fonts/recursive-t/RecursiveT-Medium.woff2","assets/recursive/fonts/recursive-t/RecursiveT-MediumItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-MediumItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-MediumItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-Regular.ttf","assets/recursive/fonts/recursive-t/RecursiveT-Regular.woff","assets/recursive/fonts/recursive-t/RecursiveT-Regular.woff2","assets/recursive/fonts/recursive-t/RecursiveT-RegularItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-RegularItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-RegularItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-SemiBold.ttf","assets/recursive/fonts/recursive-t/RecursiveT-SemiBold.woff","assets/recursive/fonts/recursive-t/RecursiveT-SemiBold.woff2","assets/recursive/fonts/recursive-t/RecursiveT-SemiBoldItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-SemiBoldItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-SemiBoldItalic.woff2","assets/recursive/fonts.css","sitemap.xml"]),
	mimeTypes: {".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".jpeg":"image/jpeg",".PNG":"image/png",".ttf":"font/ttf",".woff":"font/woff",".woff2":"font/woff2",".css":"text/css",".xml":"text/xml"},
	_: {
		client: {start:"_app/immutable/entry/start.Ca1YOCMo.js",app:"_app/immutable/entry/app.D-C_A-mq.js",imports:["_app/immutable/entry/start.Ca1YOCMo.js","_app/immutable/chunks/CDIhw-iK.js","_app/immutable/chunks/DeMzE8zu.js","_app/immutable/chunks/CAl755fi.js","_app/immutable/entry/app.D-C_A-mq.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/DeMzE8zu.js","_app/immutable/chunks/BNroBeFL.js","_app/immutable/chunks/LlDTYJ_2.js","_app/immutable/chunks/CAl755fi.js","_app/immutable/chunks/Dhpr8sJ4.js","_app/immutable/chunks/BESdJwTG.js","_app/immutable/chunks/W7Cbrtc1.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:true},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js')),
			__memo(() => import('../output/server/nodes/3.js')),
			__memo(() => import('../output/server/nodes/4.js')),
			__memo(() => import('../output/server/nodes/5.js')),
			__memo(() => import('../output/server/nodes/6.js')),
			__memo(() => import('../output/server/nodes/7.js')),
			__memo(() => import('../output/server/nodes/8.js')),
			__memo(() => import('../output/server/nodes/9.js')),
			__memo(() => import('../output/server/nodes/10.js')),
			__memo(() => import('../output/server/nodes/11.js')),
			__memo(() => import('../output/server/nodes/12.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/ansvar",
				pattern: /^\/ansvar\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/api/chat",
				pattern: /^\/api\/chat\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/chat/_server.ts.js'))
			},
			{
				id: "/api/diary/create",
				pattern: /^\/api\/diary\/create\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/diary/create/_server.ts.js'))
			},
			{
				id: "/api/diary/delete",
				pattern: /^\/api\/diary\/delete\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/diary/delete/_server.ts.js'))
			},
			{
				id: "/api/diary/stats-timeline",
				pattern: /^\/api\/diary\/stats-timeline\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/diary/stats-timeline/_server.ts.js'))
			},
			{
				id: "/api/diary/update",
				pattern: /^\/api\/diary\/update\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/diary/update/_server.ts.js'))
			},
			{
				id: "/chat/[category]",
				pattern: /^\/chat\/([^/]+?)\/?$/,
				params: [{"name":"category","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/dagbok",
				pattern: /^\/dagbok\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/dashboard/installningar",
				pattern: /^\/dashboard\/installningar\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/integritet",
				pattern: /^\/integritet\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/om-mittpsyke",
				pattern: /^\/om-mittpsyke\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/portal/[slug]",
				pattern: /^\/portal\/([^/]+?)\/?$/,
				params: [{"name":"slug","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/register",
				pattern: /^\/register\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 12 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
