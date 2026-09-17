import { COMPANION } from '$lib/progressCompanion';

export type CompanionPoseDaypart = 'day' | 'evening' | 'night';
export type CompanionPoseRole = 'base' | 'overlay';
export type CompanionId = typeof COMPANION.id;

export type CompanionPoseFrame = {
	src: string;
};

export type CompanionScenePositionId = 'foreground-right';

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
	companionId: CompanionId;
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

const POSE_BASE_PATH = '/images/avatars/presets';
const bearPoseSrc = (fileName: string) => `${POSE_BASE_PATH}/${fileName}`;
const BEAR_DISPLAY_NAME = COMPANION.name;

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
		// Sittande sedd bakifrån: Balder sitter kvar bredvid personen och tittar
		// ut över scenen. Tänkt för kväll, återblick och andra stilla lägen -
		// silhuetten är avslappnad och vänd bort från betraktaren, inte alert.
		id: 'bear-sitting-away',
		companionId: 'bear',
		role: 'base',
		// Natten lämnas åt den sovande posen: där är sömn det enda som gäller,
		// och två möjliga nattposer hade gjort valet slumpmässigt.
		dayparts: ['day', 'evening'],
		frames: [{ src: bearPoseSrc('bear-sitting-back.png') }],
		alt: `Din följeslagare, ${BEAR_DISPLAY_NAME}, sitter vänd mot utsikten.`,
		weight: 2.2,
		sceneAdjustment: { scale: 0.74, y: 2 }
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

// Björnen har ett eget markankare på Framsteg: i den fria strandremsan framför
// och till vänster om personen.
// Den avsatta mellanrutan håller siluetterna tydligt isär, utan att björnen
// lämnar samma stilla ögonblick vid strandkanten.
// Värdena hålls per vy så att nya björnposer kan läggas till utan att påverka
// den andra vyn.
export const BEAR_SCENE_PLACEMENTS = {
	dashboard: { scale: 0.72, x: 78, y: 82 },
	progress: {
		// Desktopscenen beskär bort en stor del av strandens nederkant. Ett
		// lägre ankare här placerar Björn på gruset intill personen, inte i
		// vattenytan som ligger direkt ovanför stranden i den beskärningen.
		scale: 1.16,
		bottom: '8.5%',
		right: '44.5%',
		groundLeft: '50.5%',
		groundTop: '91.5%',
		compact: {
			// På mobil ryms nästan hela originalbilden. Där ligger samma
			// strandremsa högre i rutan, så den behöver ett eget markankare.
			scale: 1.06,
			bottom: '16%',
			right: '44.5%',
			groundLeft: '50.5%',
			groundTop: '84%'
		}
	}
} as const;

export const COMPANION_POSES: readonly CompanionPose[] = [...BEAR_COMPANION_POSES];

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
		allowedPoseIds: BEAR_COMPANION_POSES.map((pose) => pose.id),
		dayparts: ['day', 'evening', 'night'],
		weight: 2.2
	}
];

// Vilka scenpositioner varje vy tillåter. Björnen har bara förgrunden; de
// avlägsna strandpositionerna användes enbart av räven.
export const COMPANION_SCENE_CONTEXT_POSITION_IDS: Record<
	CompanionSceneContext,
	readonly CompanionScenePositionId[]
> = {
	dashboard: ['foreground-right'],
	progress: ['foreground-right']
};

export const COMPANION_POSE_CHANGE_MIN_MS = 20 * 60 * 1000;
export const COMPANION_POSE_CHANGE_MAX_MS = 40 * 60 * 1000;
