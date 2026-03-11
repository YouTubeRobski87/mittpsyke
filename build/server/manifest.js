const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["assets/home/25308540-alzheimer-disease-e1669787685700.jpg","assets/home/502094c3-ff57-11f0-8445-0242ac110002-Skärmklipp.png","assets/home/9edf3f6f-ff5a-11f0-b0b3-0242ac110002-AI.webp","assets/home/AdobeStock_1196066086.jpeg","assets/home/AdobeStock_1213619763.jpeg","assets/home/AdobeStock_1861184481.jpeg","assets/home/AdobeStock_569612292.jpeg","assets/home/AdobeStock_569824666.jpeg","assets/home/AdobeStock_587291991.jpeg","assets/home/AdobeStock_593344764.jpeg","assets/home/AdobeStock_601646984.jpeg","assets/home/AdobeStock_731240889.jpeg","assets/home/Angest.jpg","assets/home/Depression.jpg","assets/home/Digitalastod.PNG","assets/home/Firefly-001.png","assets/home/Firefly-002.png","assets/home/Firefly-003.png","assets/home/Firefly-004.png","assets/home/Firefly-005.png","assets/home/Firefly-006.png","assets/home/Firefly-007.png","assets/home/Firefly-008.png","assets/home/Firefly-009.png","assets/home/Firefly-010.png","assets/home/Firefly-011.png","assets/home/Firefly-012.png","assets/home/Firefly-013.png","assets/home/Firefly-014.png","assets/home/Firefly-015.png","assets/home/Firefly-016.png","assets/home/Firefly-017.png","assets/home/Firefly-018.png","assets/home/Firefly-019.png","assets/home/Firefly-020.png","assets/home/Firefly-021.png","assets/home/Firefly-022.png","assets/home/Firefly-023.png","assets/home/Firefly-024.png","assets/home/Firefly-025.png","assets/home/Firefly-026.png","assets/home/Firefly-027.png","assets/home/heart.jpeg","assets/home/MittPsykeLogo.png","assets/home/MittpsykeTree.jpeg","assets/home/MittpsykeTree.jpg","assets/home/og-image.png","assets/home/Trauma.jpg","assets/home/Tryggplats.png","assets/recursive/.DS_Store","assets/recursive/fonts/.DS_Store","assets/recursive/fonts/recursive-h/RecursiveH-Black.ttf","assets/recursive/fonts/recursive-h/RecursiveH-Black.woff","assets/recursive/fonts/recursive-h/RecursiveH-Black.woff2","assets/recursive/fonts/recursive-h/RecursiveH-BlackItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-BlackItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-BlackItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-Bold.ttf","assets/recursive/fonts/recursive-h/RecursiveH-Bold.woff","assets/recursive/fonts/recursive-h/RecursiveH-Bold.woff2","assets/recursive/fonts/recursive-h/RecursiveH-BoldItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-BoldItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-BoldItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBlack.ttf","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBlack.woff","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBlack.woff2","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBlackItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBlackItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBlackItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBold.ttf","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBold.woff","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBold.woff2","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBoldItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBoldItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-ExtraBoldItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-Heavy.ttf","assets/recursive/fonts/recursive-h/RecursiveH-Heavy.woff","assets/recursive/fonts/recursive-h/RecursiveH-Heavy.woff2","assets/recursive/fonts/recursive-h/RecursiveH-HeavyItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-HeavyItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-HeavyItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-Light.ttf","assets/recursive/fonts/recursive-h/RecursiveH-Light.woff","assets/recursive/fonts/recursive-h/RecursiveH-Light.woff2","assets/recursive/fonts/recursive-h/RecursiveH-LightItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-LightItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-LightItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-Medium.ttf","assets/recursive/fonts/recursive-h/RecursiveH-Medium.woff","assets/recursive/fonts/recursive-h/RecursiveH-Medium.woff2","assets/recursive/fonts/recursive-h/RecursiveH-MediumItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-MediumItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-MediumItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-Regular.ttf","assets/recursive/fonts/recursive-h/RecursiveH-Regular.woff","assets/recursive/fonts/recursive-h/RecursiveH-Regular.woff2","assets/recursive/fonts/recursive-h/RecursiveH-RegularItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-RegularItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-RegularItalic.woff2","assets/recursive/fonts/recursive-h/RecursiveH-SemiBold.ttf","assets/recursive/fonts/recursive-h/RecursiveH-SemiBold.woff","assets/recursive/fonts/recursive-h/RecursiveH-SemiBold.woff2","assets/recursive/fonts/recursive-h/RecursiveH-SemiBoldItalic.ttf","assets/recursive/fonts/recursive-h/RecursiveH-SemiBoldItalic.woff","assets/recursive/fonts/recursive-h/RecursiveH-SemiBoldItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-Black.ttf","assets/recursive/fonts/recursive-t/RecursiveT-Black.woff","assets/recursive/fonts/recursive-t/RecursiveT-Black.woff2","assets/recursive/fonts/recursive-t/RecursiveT-BlackItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-BlackItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-BlackItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-Bold.ttf","assets/recursive/fonts/recursive-t/RecursiveT-Bold.woff","assets/recursive/fonts/recursive-t/RecursiveT-Bold.woff2","assets/recursive/fonts/recursive-t/RecursiveT-BoldItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-BoldItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-BoldItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-Book.ttf","assets/recursive/fonts/recursive-t/RecursiveT-Book.woff","assets/recursive/fonts/recursive-t/RecursiveT-Book.woff2","assets/recursive/fonts/recursive-t/RecursiveT-BookItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-BookItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-BookItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBlack.ttf","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBlack.woff","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBlack.woff2","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBlackItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBlackItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBlackItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBold.ttf","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBold.woff","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBold.woff2","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBoldItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBoldItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-ExtraBoldItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-ExtraLight.ttf","assets/recursive/fonts/recursive-t/RecursiveT-ExtraLight.woff","assets/recursive/fonts/recursive-t/RecursiveT-ExtraLight.woff2","assets/recursive/fonts/recursive-t/RecursiveT-ExtraLightItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-ExtraLightItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-ExtraLightItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-Light.ttf","assets/recursive/fonts/recursive-t/RecursiveT-Light.woff","assets/recursive/fonts/recursive-t/RecursiveT-Light.woff2","assets/recursive/fonts/recursive-t/RecursiveT-LightItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-LightItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-LightItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-Medium.ttf","assets/recursive/fonts/recursive-t/RecursiveT-Medium.woff","assets/recursive/fonts/recursive-t/RecursiveT-Medium.woff2","assets/recursive/fonts/recursive-t/RecursiveT-MediumItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-MediumItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-MediumItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-Regular.ttf","assets/recursive/fonts/recursive-t/RecursiveT-Regular.woff","assets/recursive/fonts/recursive-t/RecursiveT-Regular.woff2","assets/recursive/fonts/recursive-t/RecursiveT-RegularItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-RegularItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-RegularItalic.woff2","assets/recursive/fonts/recursive-t/RecursiveT-SemiBold.ttf","assets/recursive/fonts/recursive-t/RecursiveT-SemiBold.woff","assets/recursive/fonts/recursive-t/RecursiveT-SemiBold.woff2","assets/recursive/fonts/recursive-t/RecursiveT-SemiBoldItalic.ttf","assets/recursive/fonts/recursive-t/RecursiveT-SemiBoldItalic.woff","assets/recursive/fonts/recursive-t/RecursiveT-SemiBoldItalic.woff2","assets/recursive/fonts.css","assets/__MACOSX/._recursive","assets/__MACOSX/recursive/._.DS_Store","assets/__MACOSX/recursive/._fonts.css","assets/__MACOSX/recursive/fonts/._.DS_Store","assets/__MACOSX/recursive/fonts/._recursive-h","assets/__MACOSX/recursive/fonts/._recursive-t","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Black.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Black.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Black.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-BlackItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-BlackItalic.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-BlackItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Bold.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Bold.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Bold.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-BoldItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-BoldItalic.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-BoldItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-ExtraBlack.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-ExtraBlack.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-ExtraBlack.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-ExtraBlackItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-ExtraBlackItalic.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-ExtraBlackItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-ExtraBold.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-ExtraBold.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-ExtraBold.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-ExtraBoldItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-ExtraBoldItalic.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-ExtraBoldItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Heavy.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Heavy.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Heavy.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-HeavyItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-HeavyItalic.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-HeavyItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Light.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Light.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Light.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-LightItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-LightItalic.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-LightItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Medium.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Medium.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Medium.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-MediumItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-MediumItalic.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-MediumItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Regular.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Regular.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-Regular.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-RegularItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-RegularItalic.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-RegularItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-SemiBold.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-SemiBold.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-SemiBold.woff2","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-SemiBoldItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-SemiBoldItalic.woff","assets/__MACOSX/recursive/fonts/recursive-h/._RecursiveH-SemiBoldItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Black.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Black.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Black.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-BlackItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-BlackItalic.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-BlackItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Bold.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Bold.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Bold.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-BoldItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-BoldItalic.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-BoldItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Book.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Book.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Book.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-BookItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-BookItalic.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-BookItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraBlack.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraBlack.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraBlack.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraBlackItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraBlackItalic.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraBlackItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraBold.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraBold.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraBold.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraBoldItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraBoldItalic.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraBoldItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraLight.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraLight.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraLight.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraLightItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraLightItalic.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-ExtraLightItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Light.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Light.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Light.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-LightItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-LightItalic.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-LightItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Medium.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Medium.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Medium.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-MediumItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-MediumItalic.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-MediumItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Regular.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Regular.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-Regular.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-RegularItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-RegularItalic.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-RegularItalic.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-SemiBold.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-SemiBold.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-SemiBold.woff2","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-SemiBoldItalic.ttf","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-SemiBoldItalic.woff","assets/__MACOSX/recursive/fonts/recursive-t/._RecursiveT-SemiBoldItalic.woff2","intro.mp4","MittPsykeLogo.png","MittPsykeLogo2.png","og-image.png","sitemap.xml"]),
	mimeTypes: {".jpg":"image/jpeg",".png":"image/png",".webp":"image/webp",".jpeg":"image/jpeg",".PNG":"image/png",".ttf":"font/ttf",".woff":"font/woff",".woff2":"font/woff2",".css":"text/css",".mp4":"video/mp4",".xml":"text/xml"},
	_: {
		client: {start:"_app/immutable/entry/start.IVvfm8f_.js",app:"_app/immutable/entry/app.D14wobh0.js",imports:["_app/immutable/entry/start.IVvfm8f_.js","_app/immutable/chunks/BaslfmLv.js","_app/immutable/chunks/JdD-YLJe.js","_app/immutable/chunks/BQr_Q-x4.js","_app/immutable/chunks/BOQfYkl3.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/CIri5Iom.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/entry/app.D14wobh0.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/BQr_Q-x4.js","_app/immutable/chunks/BOQfYkl3.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/JdD-YLJe.js","_app/immutable/chunks/MT3Jh7cz.js","_app/immutable/chunks/DMwWxkBP.js","_app/immutable/chunks/C8RLevSm.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:true},
		nodes: [
			__memo(() => import('./chunks/0-iW6-fruY.js')),
			__memo(() => import('./chunks/1-DU1-5M15.js')),
			__memo(() => import('./chunks/2-DirEPJRz.js')),
			__memo(() => import('./chunks/3-D85oh4mr.js')),
			__memo(() => import('./chunks/4-bjDLtt3s.js')),
			__memo(() => import('./chunks/5-DB9jh6WT.js')),
			__memo(() => import('./chunks/6-m7PYNjII.js')),
			__memo(() => import('./chunks/7-Dgr1U79J.js')),
			__memo(() => import('./chunks/8-CEWbduQq.js')),
			__memo(() => import('./chunks/9-BVpUNBh3.js')),
			__memo(() => import('./chunks/10-Q4gy60cc.js')),
			__memo(() => import('./chunks/11-c2CkJBmG.js')),
			__memo(() => import('./chunks/12-DudGK1d4.js')),
			__memo(() => import('./chunks/13-Xzphkink.js')),
			__memo(() => import('./chunks/14-C7dB7YiF.js')),
			__memo(() => import('./chunks/15-1tulbQ5M.js')),
			__memo(() => import('./chunks/16-De3pdDES.js')),
			__memo(() => import('./chunks/17-KRvzL5lh.js')),
			__memo(() => import('./chunks/18-X9Fsb56w.js')),
			__memo(() => import('./chunks/19-DlAcLejM.js')),
			__memo(() => import('./chunks/20-C0uP5Tgo.js')),
			__memo(() => import('./chunks/21-Yncj7X8k.js')),
			__memo(() => import('./chunks/22-BPlDMAoc.js')),
			__memo(() => import('./chunks/23-2lyY1jUR.js')),
			__memo(() => import('./chunks/24-CTM13f-V.js')),
			__memo(() => import('./chunks/25-BiWb6Qkm.js')),
			__memo(() => import('./chunks/26-BG9Y8Pjh.js')),
			__memo(() => import('./chunks/27-CFw5pO5t.js')),
			__memo(() => import('./chunks/28-DSxNUzLn.js')),
			__memo(() => import('./chunks/29-CunYMmIA.js')),
			__memo(() => import('./chunks/30-BziDdvlB.js')),
			__memo(() => import('./chunks/31-BYu0sM16.js')),
			__memo(() => import('./chunks/32-Rcg-6wZY.js')),
			__memo(() => import('./chunks/33-BJLZSUBl.js')),
			__memo(() => import('./chunks/34-BTFbFRWz.js')),
			__memo(() => import('./chunks/35-3Xl77_t8.js')),
			__memo(() => import('./chunks/36-75yDsIPr.js')),
			__memo(() => import('./chunks/37-Bl1xBxVn.js')),
			__memo(() => import('./chunks/38-DPidXFOR.js')),
			__memo(() => import('./chunks/39-BCmJZ30R.js')),
			__memo(() => import('./chunks/40-d8lMTlUj.js')),
			__memo(() => import('./chunks/41-DiPGIQ31.js')),
			__memo(() => import('./chunks/42-BS9FylCo.js')),
			__memo(() => import('./chunks/43-D6c-bvaE.js')),
			__memo(() => import('./chunks/44-D8xlHr4l.js')),
			__memo(() => import('./chunks/45-D49SrYbf.js')),
			__memo(() => import('./chunks/46-D0CWSgdt.js')),
			__memo(() => import('./chunks/47-CUsQcvfs.js')),
			__memo(() => import('./chunks/48-C0jrZS5R.js')),
			__memo(() => import('./chunks/49-CAGBF1mq.js')),
			__memo(() => import('./chunks/50-CJt95oZ4.js')),
			__memo(() => import('./chunks/51-DBhZIgRF.js'))
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
				id: "/4-7-8-andning-ovning",
				pattern: /^\/4-7-8-andning-ovning\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/ai-samtalsstod-online",
				pattern: /^\/ai-samtalsstod-online\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/andningsovningar-mot-angest",
				pattern: /^\/andningsovningar-mot-angest\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/angest",
				pattern: /^\/angest\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/anonym-dagbok-online",
				pattern: /^\/anonym-dagbok-online\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/anonymt-samtalsstod-online",
				pattern: /^\/anonymt-samtalsstod-online\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/ansvar",
				pattern: /^\/ansvar\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/api/account/delete",
				pattern: /^\/api\/account\/delete\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DbHRpHdN.js'))
			},
			{
				id: "/api/chat",
				pattern: /^\/api\/chat\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CLEZN1Rc.js'))
			},
			{
				id: "/api/diary/create",
				pattern: /^\/api\/diary\/create\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-S7pLNzGj.js'))
			},
			{
				id: "/api/diary/delete",
				pattern: /^\/api\/diary\/delete\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B_nXh0KK.js'))
			},
			{
				id: "/api/diary/heatmap",
				pattern: /^\/api\/diary\/heatmap\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Llb_gI6b.js'))
			},
			{
				id: "/api/diary/insights",
				pattern: /^\/api\/diary\/insights\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BxfhTGG6.js'))
			},
			{
				id: "/api/diary/milestones",
				pattern: /^\/api\/diary\/milestones\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-2tuuL05N.js'))
			},
			{
				id: "/api/diary/stats-timeline",
				pattern: /^\/api\/diary\/stats-timeline\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Ccx2Pkbc.js'))
			},
			{
				id: "/api/diary/streak",
				pattern: /^\/api\/diary\/streak\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dz6v9ehR.js'))
			},
			{
				id: "/api/diary/update",
				pattern: /^\/api\/diary\/update\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BnLfra5c.js'))
			},
			{
				id: "/api/diary/weekly-summary",
				pattern: /^\/api\/diary\/weekly-summary\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BJdF7b5f.js'))
			},
			{
				id: "/api/events",
				pattern: /^\/api\/events\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DIgljs4F.js'))
			},
			{
				id: "/api/retell-webcall",
				pattern: /^\/api\/retell-webcall\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-K0YzEU94.js'))
			},
			{
				id: "/api/unsubscribe/link",
				pattern: /^\/api\/unsubscribe\/link\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CxuumJT4.js'))
			},
			{
				id: "/avregistrera",
				pattern: /^\/avregistrera\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/chatta-anonymt-med-nagon",
				pattern: /^\/chatta-anonymt-med-nagon\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/chattstod-psykisk-ohalsa",
				pattern: /^\/chattstod-psykisk-ohalsa\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/chat",
				pattern: /^\/chat\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/chat/[category]",
				pattern: /^\/chat\/([^/]+?)\/?$/,
				params: [{"name":"category","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/dagbok",
				pattern: /^\/dagbok\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/dashboard/installningar",
				pattern: /^\/dashboard\/installningar\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/depression",
				pattern: /^\/depression\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/digital-dagbok-for-maende",
				pattern: /^\/digital-dagbok-for-maende\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/ensamhet",
				pattern: /^\/ensamhet\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/exponering-ovningar-mot-angest",
				pattern: /^\/exponering-ovningar-mot-angest\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/framsteg",
				pattern: /^\/framsteg\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/guider-seo",
				pattern: /^\/guider-seo\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 25 },
				endpoint: null
			},
			{
				id: "/guider-seo/[pillar]",
				pattern: /^\/guider-seo\/([^/]+?)\/?$/,
				params: [{"name":"pillar","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 26 },
				endpoint: null
			},
			{
				id: "/guider-seo/[pillar]/[guide]",
				pattern: /^\/guider-seo\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"pillar","optional":false,"rest":false,"chained":false},{"name":"guide","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 27 },
				endpoint: null
			},
			{
				id: "/guider",
				pattern: /^\/guider\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/guider/[pillar]",
				pattern: /^\/guider\/([^/]+?)\/?$/,
				params: [{"name":"pillar","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/hjalp-mot-oro-online",
				pattern: /^\/hjalp-mot-oro-online\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 28 },
				endpoint: null
			},
			{
				id: "/hjalp-vid-angest-online",
				pattern: /^\/hjalp-vid-angest-online\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 29 },
				endpoint: null
			},
			{
				id: "/hjalp-vid-depression-online",
				pattern: /^\/hjalp-vid-depression-online\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 30 },
				endpoint: null
			},
			{
				id: "/integritet",
				pattern: /^\/integritet\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 31 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 32 },
				endpoint: null
			},
			{
				id: "/nedstamdhet",
				pattern: /^\/nedstamdhet\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 33 },
				endpoint: null
			},
			{
				id: "/om-mittpsyke",
				pattern: /^\/om-mittpsyke\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 34 },
				endpoint: null
			},
			{
				id: "/oro",
				pattern: /^\/oro\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 35 },
				endpoint: null
			},
			{
				id: "/ovningar-mot-angest-online",
				pattern: /^\/ovningar-mot-angest-online\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 38 },
				endpoint: null
			},
			{
				id: "/ovningar",
				pattern: /^\/ovningar\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 36 },
				endpoint: null
			},
			{
				id: "/ovningar/[tool]",
				pattern: /^\/ovningar\/([^/]+?)\/?$/,
				params: [{"name":"tool","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 37 },
				endpoint: null
			},
			{
				id: "/panikattack",
				pattern: /^\/panikattack\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 39 },
				endpoint: null
			},
			{
				id: "/portal/[slug]",
				pattern: /^\/portal\/([^/]+?)\/?$/,
				params: [{"name":"slug","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 40 },
				endpoint: null
			},
			{
				id: "/prata-anonymt-online",
				pattern: /^\/prata-anonymt-online\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 41 },
				endpoint: null
			},
			{
				id: "/psykiskt-stod-online",
				pattern: /^\/psykiskt-stod-online\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 42 },
				endpoint: null
			},
			{
				id: "/register",
				pattern: /^\/register\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 43 },
				endpoint: null
			},
			{
				id: "/robots.txt",
				pattern: /^\/robots\.txt\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-LVniLytL.js'))
			},
			{
				id: "/samtalsstod-utan-vantetid",
				pattern: /^\/samtalsstod-utan-vantetid\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 44 },
				endpoint: null
			},
			{
				id: "/samtalsstod-vid-trauma",
				pattern: /^\/samtalsstod-vid-trauma\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 45 },
				endpoint: null
			},
			{
				id: "/sitemap.xml",
				pattern: /^\/sitemap\.xml\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B5lNU0vW.js'))
			},
			{
				id: "/sjalvkansla",
				pattern: /^\/sjalvkansla\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 46 },
				endpoint: null
			},
			{
				id: "/sovproblem",
				pattern: /^\/sovproblem\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 47 },
				endpoint: null
			},
			{
				id: "/stod-vid-ptsd-online",
				pattern: /^\/stod-vid-ptsd-online\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 48 },
				endpoint: null
			},
			{
				id: "/stod-vid-stress-online",
				pattern: /^\/stod-vid-stress-online\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 49 },
				endpoint: null
			},
			{
				id: "/stress",
				pattern: /^\/stress\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 50 },
				endpoint: null
			},
			{
				id: "/trauma",
				pattern: /^\/trauma\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 51 },
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

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
