import { getProgressCompanionDisplayName } from '$lib/progressCompanion';

export type CompanionPoseDaypart = 'day' | 'evening' | 'night';
export type CompanionPoseRole = 'base' | 'overlay';
export type CompanionId = 'fox' | 'bear' | 'wolf' | 'schafer' | 'australisk_shepherd';

export type CompanionPoseFrame = {
	src: string;
};

export type CompanionScenePositionId = 'foreground-right' | 'shore-near' | 'shore-far';

/** Vilken vy följeslagaren visas i. Samma namn som CompanionVisitor redan
 *  använder, så scenbegreppet betyder samma sak i hela världen. */
export type CompanionSceneContext = 'dashboard' | 'progress';

export type CompanionScenePosition = {
	id: CompanionScenePositionId;
	x: number;
	y: number;
	scale: number;
	zIndex: number;
	shadow: {
		width: number;
		height: number;
		blur: number;
		opacity: number;
	};
	allowedPoseIds: string[];
	dayparts: CompanionPoseDaypart[];
	weight?: number;
};

/**
 * Visuell placering ovanpå en scenposition. `compact` används av dashboardens
 * smala viewport utan att ändra följeslagarens pose- eller relationsdata.
 */
export type CompanionPlacement = {
	scale: number;
	x: number;
	y: number;
	compact?: {
		scale: number;
		x: number;
		y: number;
	};
};

export type CompanionPose = {
	id: string;
	companionId?: CompanionId;
	role: CompanionPoseRole;
	motion?: 'blink' | 'gesture' | 'sleep';
	dayparts: CompanionPoseDaypart[];
	frames: CompanionPoseFrame[];
	alt: string;
	weight?: number;
	frameMs?: number;
	eventChance?: number;
	durationMs?: number;
	sceneAdjustment?: {
		x?: number;
		y?: number;
		scale?: number;
	};
};

const FOX_POSE_BASE_PATH = '/images/avatars/presets';

const foxPoseSrc = (fileName: string) => `${FOX_POSE_BASE_PATH}/${fileName}`;
const bearPoseSrc = (fileName: string) => `${FOX_POSE_BASE_PATH}/${fileName}`;
const wolfPoseSrc = (fileName: string) => `${FOX_POSE_BASE_PATH}/${fileName}`;
// Hundarnas frilagda bilder ligger i /images/scenes, till skillnad från de
// äldre djuren som bor i presets. Egna hjälpare i stället för att flytta filer.
const DOG_POSE_BASE_PATH = '/images/scenes';
const dogPoseSrc = (fileName: string) => `${DOG_POSE_BASE_PATH}/${fileName}`;
const FOX_DISPLAY_NAME = getProgressCompanionDisplayName('fox');
const BEAR_DISPLAY_NAME = getProgressCompanionDisplayName('bear');
const WOLF_DISPLAY_NAME = getProgressCompanionDisplayName('wolf');

export const FOX_COMPANION_POSES = [
	{
		id: 'idle',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox-realistic-standing-front-alert.png') }],
		alt: `Din följeslagare, ${FOX_DISPLAY_NAME}, står avslappnat.`,
		weight: 3,
		sceneAdjustment: { scale: 0.45 }
	},
	{
		id: 'look-left',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox-realistic-standing-side-left-lake.png') }],
		alt: `Din följeslagare, ${FOX_DISPLAY_NAME}, tittar lugnt åt vänster.`,
		weight: 1.1,
		sceneAdjustment: { scale: 0.42 }
	},
	{
		id: 'look-right',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox-realistic-standing-side-right-listening.png') }],
		alt: `Din följeslagare, ${FOX_DISPLAY_NAME}, tittar lugnt åt höger.`,
		weight: 1.1,
		sceneAdjustment: { scale: 0.46 }
	},
	{
		id: 'sit',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox-realistic-resting-sitting.png') }],
		alt: `Din följeslagare, ${FOX_DISPLAY_NAME}, sitter stilla.`,
		weight: 2.2,
		sceneAdjustment: { scale: 0.55 }
	},
	{
		id: 'sit-look-up',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_sit_look_up.png') }],
		alt: `Din följeslagare, ${FOX_DISPLAY_NAME}, sitter och tittar upp.`,
		weight: 0.9
	},
	{
		id: 'drink',
		role: 'base',
		// Även kväll: shore-near tillåter redan 'drink' på både day och evening
		// (se COMPANION_SCENE_POSITIONS nedan), men posen själv var låst till
		// day - och Framstegs scen är en kvällsscen, så urvalet blev tomt och
		// räven kunde aldrig dricka där. Vikten hålls låg mot evening-lake
		// (2.6), så drickandet förblir det sällsynta undantaget i posbytet
		// var 20-40 min, inte ett nytt normalläge.
		dayparts: ['day', 'evening'],
		frames: [{ src: foxPoseSrc('fox-realistic-lake-drinking.png') }],
		alt: `Din följeslagare, ${FOX_DISPLAY_NAME}, dricker stilla vid sjön.`,
		weight: 0.75,
		sceneAdjustment: { scale: 0.55 }
	},
	{
		id: 'sniff',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox-realistic-lake-sniffing.png') }],
		alt: `Din följeslagare, ${FOX_DISPLAY_NAME}, nosar försiktigt på marken.`,
		weight: 0.8,
		sceneAdjustment: { scale: 0.55 }
	},
	{
		id: 'stretch',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_stretch.png') }],
		alt: `Din följeslagare, ${FOX_DISPLAY_NAME}, sträcker lugnt på sig.`,
		weight: 0.65
	},
	{
		id: 'walk',
		role: 'base',
		dayparts: ['day'],
		// Endast en realistisk gångbild finns ännu (ingen gångcykel-animation).
		frames: [{ src: foxPoseSrc('fox-realistic-walking-curious.png') }],
		alt: `Din följeslagare, ${FOX_DISPLAY_NAME}, går långsamt genom platsen.`,
		weight: 0.22,
		frameMs: 620,
		sceneAdjustment: { scale: 0.42 }
	},
	{
		id: 'evening-lake',
		role: 'base',
		dayparts: ['evening'],
		frames: [{ src: foxPoseSrc('fox-realistic-lake-sitting-gazing.png') }],
		alt: `Din följeslagare, ${FOX_DISPLAY_NAME}, sitter och tittar mot sjön i kvällsljus.`,
		weight: 2.6,
		sceneAdjustment: { scale: 0.55 }
	},
	{
		id: 'rest',
		role: 'base',
		dayparts: ['evening'],
		frames: [{ src: foxPoseSrc('fox-realistic-resting-lying-half-asleep.png') }],
		alt: `Din följeslagare, ${FOX_DISPLAY_NAME}, ligger och vilar i kvällslugnet.`,
		weight: 1.7,
		sceneAdjustment: { scale: 0.5 }
	},
	{
		id: 'sleep-curled',
		role: 'base',
		dayparts: ['night'],
		frames: [{ src: foxPoseSrc('fox-realistic-sleeping-curled.png') }],
		alt: `Din följeslagare, ${FOX_DISPLAY_NAME}, sover hoprullad.`,
		weight: 2.3,
		sceneAdjustment: { scale: 0.45 }
	},
	{
		id: 'sleep-side',
		role: 'base',
		dayparts: ['night'],
		frames: [{ src: foxPoseSrc('fox-realistic-sleeping-side-dreaming.png') }],
		alt: `Din följeslagare, ${FOX_DISPLAY_NAME}, sover lugnt på sidan.`,
		weight: 1.8,
		sceneAdjustment: { scale: 0.38 }
	},
	{
		id: 'blink',
		role: 'overlay',
		motion: 'blink',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_idle_blink.png') }],
		alt: '',
		eventChance: 0.06,
		durationMs: 1450
	},
	{
		id: 'happy',
		role: 'overlay',
		motion: 'gesture',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_happy.png') }],
		alt: '',
		eventChance: 0.025,
		durationMs: 5200
	},
	{
		id: 'curious',
		role: 'overlay',
		motion: 'gesture',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_curious.png') }],
		alt: '',
		eventChance: 0.03,
		durationMs: 5600
	},
	{
		id: 'thoughtful',
		role: 'overlay',
		motion: 'gesture',
		dayparts: ['day', 'evening'],
		frames: [{ src: foxPoseSrc('fox_thoughtful.png') }],
		alt: '',
		eventChance: 0.02,
		durationMs: 5600
	},
	{
		id: 'listening',
		role: 'overlay',
		motion: 'gesture',
		dayparts: ['day', 'evening'],
		frames: [{ src: foxPoseSrc('fox_listening.png') }],
		alt: '',
		eventChance: 0.022,
		durationMs: 5600
	},
	{
		id: 'look-user',
		role: 'overlay',
		motion: 'gesture',
		dayparts: ['day', 'evening'],
		frames: [{ src: foxPoseSrc('fox_look_user.png') }],
		alt: '',
		eventChance: 0.018,
		durationMs: 5200
	},
	{
		id: 'yawn',
		role: 'overlay',
		motion: 'gesture',
		dayparts: ['evening'],
		frames: [{ src: foxPoseSrc('fox_yawn.png') }],
		alt: '',
		eventChance: 0.045,
		durationMs: 4300
	},
	{
		id: 'sleep-ear-twitch',
		role: 'overlay',
		motion: 'sleep',
		dayparts: ['night'],
		frames: [{ src: foxPoseSrc('fox_sleep_ear_twitch.png') }],
		alt: '',
		eventChance: 0.035,
		durationMs: 2600
	},
	{
		id: 'sleep-tail-move',
		role: 'overlay',
		motion: 'sleep',
		dayparts: ['night'],
		frames: [{ src: foxPoseSrc('fox_sleep_tail_move.png') }],
		alt: '',
		eventChance: 0.028,
		durationMs: 3200
	}
] satisfies CompanionPose[];

export const BEAR_COMPANION_POSES = [
	{
		id: 'bear-standing',
		companionId: 'bear',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: bearPoseSrc('bear-standing.png') }],
		alt: `Din följeslagare, ${BEAR_DISPLAY_NAME}, står lugnt.`,
		weight: 2.4,
		sceneAdjustment: { scale: 0.82, y: 1 }
	},
	{
		id: 'bear-sitting',
		companionId: 'bear',
		role: 'base',
		dayparts: ['day', 'evening'],
		frames: [{ src: bearPoseSrc('bear-sitting.png') }],
		alt: `Din följeslagare, ${BEAR_DISPLAY_NAME}, sitter stilla.`,
		weight: 2.1,
		sceneAdjustment: { scale: 0.78, y: 2 }
	},
	{
		id: 'bear-sleeping',
		companionId: 'bear',
		role: 'base',
		dayparts: ['night'],
		frames: [{ src: bearPoseSrc('bear-sleeping.png') }],
		alt: `Din följeslagare, ${BEAR_DISPLAY_NAME}, sover lugnt.`,
		weight: 2.4,
		sceneAdjustment: { scale: 0.76, y: 4 }
	},
	{
		id: 'bear-stretching',
		companionId: 'bear',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: bearPoseSrc('bear-stretching.png') }],
		alt: `Din följeslagare, ${BEAR_DISPLAY_NAME}, sträcker lugnt på sig.`,
		weight: 0.9,
		sceneAdjustment: { scale: 0.78, x: -1, y: 3 }
	}
] satisfies CompanionPose[];

export const WOLF_COMPANION_POSES = [
	{
		id: 'wolf-standing',
		companionId: 'wolf',
		role: 'base',
		dayparts: ['day', 'evening'],
		frames: [{ src: wolfPoseSrc('wolf-standing-transparent.png') }],
		alt: `Din följeslagare, ${WOLF_DISPLAY_NAME}, står lugnt.`,
		weight: 2.4,
		sceneAdjustment: { scale: 0.74, y: 3 }
	},
	{
		id: 'wolf-sleeping',
		companionId: 'wolf',
		role: 'base',
		dayparts: ['night'],
		frames: [{ src: wolfPoseSrc('wolf-sleeping.png') }],
		alt: `${WOLF_DISPLAY_NAME} sover lugnt.`,
		weight: 2.4,
		sceneAdjustment: { scale: 0.96 }
	}
] satisfies CompanionPose[];

/**
 * Hundarna har än så länge en enda frilagd bild vardera, så de får exakt en
 * pose var som gäller alla dygnsdelar. Det är avsiktligt statiskt: hellre en
 * korrekt stillastående hund än en simulerad rotation av samma bild under
 * flera pose-ID:n.
 *
 * Poserna måste finnas, inte utelämnas. getFallbackPose() faller i sista hand
 * tillbaka på COMPANION_POSES[0], som är en rävpose - en hund utan egen pose
 * skulle alltså renderas som räv.
 *
 * När riktiga pose-assets finns läggs de till här på samma sätt som björnens
 * och vargens, utan att något annat behöver ändras.
 */
const SCHAFER_DISPLAY_NAME = getProgressCompanionDisplayName('schafer');
const AUSTRALISK_SHEPHERD_DISPLAY_NAME = getProgressCompanionDisplayName('australisk_shepherd');

/**
 * Hundarnas sex poser följer samma modell som björnen och vargen: en pose per
 * bild, dygnsdelar som speglar vad posen föreställer, och `sceneAdjustment.y`
 * som kompenserar bildens genomskinliga marginal under tassarna.
 *
 * y-värdena är inte satta på känsla. CompanionPose ankrar bildens NEDERKANT
 * (translate -100%), så en pose med tom yta under tassarna svävar. Marginalen
 * är uppmätt per fil och omräknad till scenprocent:
 *   flyt% = bottenmarginal% x (renderad elementhöjd / scenhöjd)
 * På stugscenen (element 310 px, scen 331 px hög) ger det faktorn ~0,26 för
 * schäfern och ~0,29 för australisk shepherd.
 *
 * Ingen scale-justering per pose: alla tolv bilderna är 512x512 med samma
 * inramning, och höjdskillnaderna mellan poserna är verkliga (en sittande hund
 * ÄR lägre än en stående). Att normalisera bort dem hade sett fel ut.
 */
export const SCHAFER_COMPANION_POSES = [
	{
		id: 'schafer-standing',
		companionId: 'schafer',
		role: 'base',
		dayparts: ['day', 'evening'],
		frames: [{ src: dogPoseSrc('schafer-standing.png') }],
		alt: `Din följeslagare, ${SCHAFER_DISPLAY_NAME}, står lugnt.`,
		weight: 2.4
	},
	{
		id: 'schafer-sitting',
		companionId: 'schafer',
		role: 'base',
		dayparts: ['day', 'evening'],
		frames: [{ src: dogPoseSrc('schafer-sitting.png') }],
		alt: `${SCHAFER_DISPLAY_NAME} sitter stilla.`,
		weight: 2,
		sceneAdjustment: { y: 3 }
	},
	{
		id: 'schafer-sideway',
		companionId: 'schafer',
		role: 'base',
		dayparts: ['day', 'evening'],
		frames: [{ src: dogPoseSrc('schafer-sideway.png') }],
		alt: `${SCHAFER_DISPLAY_NAME} står vänd åt sidan.`,
		weight: 1.4,
		sceneAdjustment: { y: 3 }
	},
	{
		id: 'schafer-resting',
		companionId: 'schafer',
		role: 'base',
		dayparts: ['evening', 'night'],
		frames: [{ src: dogPoseSrc('schafer-resting.png') }],
		alt: `${SCHAFER_DISPLAY_NAME} vilar i lugn takt.`,
		weight: 1.8,
		sceneAdjustment: { y: 1 }
	},
	{
		id: 'schafer-sleeping',
		companionId: 'schafer',
		role: 'base',
		dayparts: ['night'],
		frames: [{ src: dogPoseSrc('schafer-sleeping.png') }],
		alt: `${SCHAFER_DISPLAY_NAME} sover lugnt.`,
		weight: 2.4,
		sceneAdjustment: { y: 1 }
	},
	{
		id: 'schafer-playful',
		companionId: 'schafer',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: dogPoseSrc('schafer-playful.png') }],
		alt: `${SCHAFER_DISPLAY_NAME} är på lekhumör.`,
		weight: 1,
		sceneAdjustment: { y: 2 }
	}
] satisfies CompanionPose[];

export const AUSTRALISK_SHEPHERD_COMPANION_POSES = [
	{
		id: 'australisk-shepherd-standing',
		companionId: 'australisk_shepherd',
		role: 'base',
		dayparts: ['day', 'evening'],
		frames: [{ src: dogPoseSrc('australisk_shepherd-standing.png') }],
		alt: `Din följeslagare, ${AUSTRALISK_SHEPHERD_DISPLAY_NAME}, står lugnt.`,
		weight: 2.4
	},
	{
		id: 'australisk-shepherd-sitting',
		companionId: 'australisk_shepherd',
		role: 'base',
		dayparts: ['day', 'evening'],
		frames: [{ src: dogPoseSrc('australisk_shepherd-sitting.png') }],
		alt: `${AUSTRALISK_SHEPHERD_DISPLAY_NAME} sitter stilla.`,
		weight: 2
	},
	{
		id: 'australisk-shepherd-lying',
		companionId: 'australisk_shepherd',
		role: 'base',
		dayparts: ['day', 'evening'],
		frames: [{ src: dogPoseSrc('australisk_shepherd-lying.png') }],
		alt: `${AUSTRALISK_SHEPHERD_DISPLAY_NAME} ligger ned och vilar.`,
		weight: 1.4
	},
	{
		id: 'australisk-shepherd-resting',
		companionId: 'australisk_shepherd',
		role: 'base',
		dayparts: ['evening', 'night'],
		frames: [{ src: dogPoseSrc('australisk_shepherd-resting.png') }],
		alt: `${AUSTRALISK_SHEPHERD_DISPLAY_NAME} vilar i lugn takt.`,
		weight: 1.8,
		sceneAdjustment: { y: 4 }
	},
	{
		id: 'australisk-shepherd-sleeping',
		companionId: 'australisk_shepherd',
		role: 'base',
		dayparts: ['night'],
		frames: [{ src: dogPoseSrc('australisk_shepherd-sleeping.png') }],
		alt: `${AUSTRALISK_SHEPHERD_DISPLAY_NAME} sover lugnt.`,
		weight: 2.4,
		sceneAdjustment: { y: 6 }
	},
	{
		id: 'australisk-shepherd-playful',
		companionId: 'australisk_shepherd',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: dogPoseSrc('australisk_shepherd-playful.png') }],
		alt: `${AUSTRALISK_SHEPHERD_DISPLAY_NAME} är på lekhumör.`,
		weight: 1,
		sceneAdjustment: { y: 3 }
	}
] satisfies CompanionPose[];

// Björnen använder samma värld som räven, men behöver en mindre och lägre placering
// tills fler miljöanpassade poser finns. Värdena hålls per vy så att nya björnposer
// kan läggas till utan att påverka rävens scenlogik.
export const BEAR_SCENE_PLACEMENTS = {
	dashboard: { scale: 0.72, x: 78, y: 82 },
	progress: {
		scale: 1.1,
		bottom: '30%',
		right: '25%',
		groundLeft: '62.6%',
		groundTop: '64.7%',
		compact: {
			scale: 1.12,
			bottom: '30%',
			right: '24%',
			groundLeft: '62.6%',
			groundTop: '64.7%'
		}
	}
} as const;

// Vargens frilagda, liggande bild har luft under tassarna i sin egen canvas.
// Dashboardplaceringen hålls därför separat så att den kan vila på marken
// utan att påverka rävens eller björnens etablerade placeringar.
export const WOLF_SCENE_PLACEMENTS = {
	dashboard: { scale: 0.9, x: 76, y: 84 },
	progress: {
		scale: 1.6,
		// Vargbildens genomskinliga marginal under tassarna (se kommentaren ovan)
		// gör att "bottom" måste sättas lägre än det visuella fotfästet för att
		// tassarna ska hamna på gräset i stället för att glida ut i sjön.
		bottom: '26%',
		right: '18%',
		groundLeft: '80%',
		groundTop: '65%',
		compact: {
			scale: 1.55,
			bottom: '26%',
			right: '17%',
			groundLeft: '79%',
			groundTop: '66%'
		}
	}
} as const;

/**
 * Mitt Hem ligger vid stugan, inte ute i den breda sjövyn. Detta är enbart
 * scengeometri för den befintliga dashboard-vyn: poseval, positionernas
 * lagring och companion-state fortsätter använda samma `dashboard`-kontext.
 */
export const DASHBOARD_CABIN_COMPANION_PLACEMENTS: Record<
	CompanionId,
	CompanionPlacement
> = {
	fox: { scale: 0.8, x: 37, y: 91 },
	// Björnens breda canvas har genomskinlig marginal under tassarna. Ett eget
	// dashboardankare håller därför den synliga kroppen mindre och tassarna på
	// den sluttande marken vid verandan, utan att ändra poser eller andra vyer.
	bear: {
		scale: 0.68,
		x: 35,
		y: 94,
		compact: { scale: 0.72, x: 31, y: 92 }
	},
	// Vargens duk är bred och liggande. På desktop läser den som en följeslagare
	// bredvid stugan, men i mobilcropen (scenen ankras då till 0 % 60 %, och
	// posen får bredden min(50 %, 220 px) i stället för min(39 %, 310 px)) växte
	// samma scale till scenens huvudmotiv och täckte stuga och landskap. Ett
	// eget compact-ankare - samma mönster som björnen och hundarna redan har -
	// krymper henne där utan att röra desktopvärdena ovan.
	wolf: { scale: 0.9, x: 37, y: 91, compact: { scale: 0.7, x: 34, y: 92 } },
	// Hundarnas dukar är porträttformat och nästan helt fyllda av motivet
	// (schäfer 97,5 % av höjden, australisk shepherd 96,0 %), medan vargens duk
	// är till 83 % genomskinlig och rävens motiv är litet i sin ruta. Samma
	// scale hade därför gjort hundarna dubbelt så stora i scenen.
	//
	// Värdena är räknade ur faktisk synlig storlek i stugscenen, inte kopierade
	// från något annat djur. Referens: räven syns som 9,6 % av scenens bredd och
	// 13,6 % av dess höjd, vargen 12,8 % / 11,6 %. Hundarna landar på ~10 % / 14 %
	// respektive ~11 % / 14 % - alltså samma storleksband, med hundarnas
	// naturligt högre och smalare kroppsform.
	//
	// y = 91 är samma markankare som räv och varg. CompanionPose ankrar bildens
	// nederkant (translate -100%), och hundarnas 12 px bottenmarginal motsvarar
	// bara ~0,2 % av scenen, så tassarna vilar på marken utan eget y-värde.
	schafer: { scale: 0.36, x: 37, y: 91, compact: { scale: 0.38, x: 34, y: 91 } },
	australisk_shepherd: {
		scale: 0.37,
		x: 37,
		y: 91,
		compact: { scale: 0.39, x: 34, y: 91 }
	}
};

/** Startpunkten för Mitt Hems högra textyta i stugscenen. */
export const DASHBOARD_CABIN_COPY_SAFE_START_PCT = 54;

export const COMPANION_POSES: readonly CompanionPose[] = [
	...FOX_COMPANION_POSES,
	...BEAR_COMPANION_POSES,
	...WOLF_COMPANION_POSES,
	...SCHAFER_COMPANION_POSES,
	...AUSTRALISK_SHEPHERD_COMPANION_POSES
];

export const COMPANION_SCENE_POSITIONS: readonly CompanionScenePosition[] = [
	{
		id: 'foreground-right',
		x: 78,
		y: 82,
		scale: 1,
		zIndex: 2,
		shadow: {
			width: 68,
			height: 8,
			blur: 8,
			opacity: 0.22
		},
		allowedPoseIds: [
			'idle',
			'look-left',
			'look-right',
			'sit',
			'sit-look-up',
			'sniff',
			'stretch',
			'rest',
			'sleep-curled',
			'sleep-side',
			'bear-standing',
			'bear-sitting',
			'bear-sleeping',
			'bear-stretching',
			'wolf-standing',
			'wolf-sleeping',
			'schafer-standing',
			'schafer-sitting',
			'schafer-sideway',
			'schafer-resting',
			'schafer-sleeping',
			'schafer-playful',
			'australisk-shepherd-standing',
			'australisk-shepherd-sitting',
			'australisk-shepherd-lying',
			'australisk-shepherd-resting',
			'australisk-shepherd-sleeping',
			'australisk-shepherd-playful'
		],
		dayparts: ['day', 'evening', 'night'],
		weight: 2.2
	},
	{
		id: 'shore-near',
		x: 66,
		y: 76,
		scale: 0.64,
		zIndex: 2,
		shadow: {
			width: 44,
			height: 5,
			blur: 4,
			opacity: 0.22
		},
		allowedPoseIds: ['drink', 'sniff', 'sit', 'sit-look-up', 'look-left', 'look-right', 'evening-lake'],
		dayparts: ['day', 'evening'],
		weight: 1.25
	},
	// Låg scale + hög y placerade följeslagaren så långt bort att den blev en
	// prick i scenen (~25 px motiv på en hero som är upp till 984 px bred).
	// Flyttad något närmare och uppskalad i motsvarande grad, så djupkänslan
	// finns kvar men följeslagaren alltid går att känna igen. Skuggan behöver
	// då också synas, annars ser den ut att strunta i marken.
	{
		id: 'shore-far',
		x: 73,
		y: 70,
		scale: 0.44,
		zIndex: 1,
		shadow: {
			width: 28,
			height: 3,
			blur: 4,
			opacity: 0.12
		},
		allowedPoseIds: ['idle', 'look-left', 'look-right', 'sit', 'sit-look-up', 'evening-lake'],
		dayparts: ['day', 'evening'],
		weight: 0.6
	}
];

// Vilka scenpositioner varje vy tillåter. Generell regel, inte ett
// specialfall per följeslagare: dashboardhjälten är liten och har text
// bredvid sig, så följeslagaren måste läsas direkt - de riktigt avlägsna
// positionerna hör hemma i Framsteg, där scenen får vara en upptäckt.
// En framtida uggla eller hjort ärver samma regel utan ny kod.
export const COMPANION_SCENE_CONTEXT_POSITION_IDS: Record<
	CompanionSceneContext,
	readonly CompanionScenePositionId[]
> = {
	dashboard: ['foreground-right', 'shore-near'],
	progress: ['foreground-right', 'shore-near', 'shore-far']
};

/**
 * Andel av dashboardhjältens bredd, räknat från vänsterkanten, som garanterat
 * är fri från både följeslagare och besökare. Hjältetexten får aldrig bli
 * bredare än så.
 *
 * Värdet är inte godtyckligt och får inte höjas på känsla: testet i
 * companionPoseState.test.ts räknar fram den västligaste kant någon tillåten
 * dashboardposition kan nå (idag det vakna besöket på x 52 %) och faller om en
 * ny position, pose eller placement skulle krympa marginalen under det här
 * talet. Hjältetexten vet alltså ingenting om var djuret står - den vet bara
 * hur mycket yta scenen lovar att lämna ifred.
 */
export const COMPANION_DASHBOARD_COPY_SAFE_WIDTH_PCT = 40;

export const COMPANION_POSE_CHANGE_MIN_MS = 20 * 60 * 1000;
export const COMPANION_POSE_CHANGE_MAX_MS = 40 * 60 * 1000;
