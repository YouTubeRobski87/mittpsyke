export type CompanionPoseDaypart = 'day' | 'evening' | 'night';
export type CompanionPoseRole = 'base' | 'overlay';
export type CompanionId = 'fox' | 'bear' | 'wolf';

export type CompanionPoseFrame = {
	src: string;
};

export type CompanionScenePositionId = 'foreground-right' | 'shore-near' | 'shore-far';

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

export const FOX_COMPANION_POSES = [
	{
		id: 'idle',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox-realistic-standing-front-alert.png') }],
		alt: 'Din följeslagare, räven, står avslappnat.',
		weight: 3,
		sceneAdjustment: { scale: 0.75 }
	},
	{
		id: 'look-left',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox-realistic-standing-side-left-lake.png') }],
		alt: 'Din följeslagare, räven, tittar lugnt åt vänster.',
		weight: 1.1,
		sceneAdjustment: { scale: 0.68 }
	},
	{
		id: 'look-right',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox-realistic-standing-side-right-listening.png') }],
		alt: 'Din följeslagare, räven, tittar lugnt åt höger.',
		weight: 1.1,
		sceneAdjustment: { scale: 0.76 }
	},
	{
		id: 'sit',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox-realistic-resting-sitting.png') }],
		alt: 'Din följeslagare, räven, sitter stilla.',
		weight: 2.2,
		sceneAdjustment: { scale: 0.89 }
	},
	{
		id: 'sit-look-up',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_sit_look_up.png') }],
		alt: 'Din följeslagare, räven, sitter och tittar upp.',
		weight: 0.9
	},
	{
		id: 'drink',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox-realistic-lake-drinking.png') }],
		alt: 'Din följeslagare, räven, dricker stilla vid sjön.',
		weight: 0.75,
		sceneAdjustment: { scale: 0.92 }
	},
	{
		id: 'sniff',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox-realistic-lake-sniffing.png') }],
		alt: 'Din följeslagare, räven, nosar försiktigt på marken.',
		weight: 0.8,
		sceneAdjustment: { scale: 0.93 }
	},
	{
		id: 'stretch',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_stretch.png') }],
		alt: 'Din följeslagare, räven, sträcker lugnt på sig.',
		weight: 0.65
	},
	{
		id: 'walk',
		role: 'base',
		dayparts: ['day'],
		// Endast en realistisk gångbild finns ännu (ingen gångcykel-animation).
		frames: [{ src: foxPoseSrc('fox-realistic-walking-curious.png') }],
		alt: 'Din följeslagare, räven, går långsamt genom platsen.',
		weight: 0.22,
		frameMs: 620,
		sceneAdjustment: { scale: 0.67 }
	},
	{
		id: 'evening-lake',
		role: 'base',
		dayparts: ['evening'],
		frames: [{ src: foxPoseSrc('fox-realistic-lake-sitting-gazing.png') }],
		alt: 'Din följeslagare, räven, sitter och tittar mot sjön i kvällsljus.',
		weight: 2.6,
		sceneAdjustment: { scale: 0.95 }
	},
	{
		id: 'rest',
		role: 'base',
		dayparts: ['evening'],
		frames: [{ src: foxPoseSrc('fox-realistic-resting-lying-half-asleep.png') }],
		alt: 'Din följeslagare, räven, ligger och vilar i kvällslugnet.',
		weight: 1.7,
		sceneAdjustment: { scale: 0.82 }
	},
	{
		id: 'sleep-curled',
		role: 'base',
		dayparts: ['night'],
		frames: [{ src: foxPoseSrc('fox-realistic-sleeping-curled.png') }],
		alt: 'Din följeslagare, räven, sover hoprullad.',
		weight: 2.3,
		sceneAdjustment: { scale: 0.75 }
	},
	{
		id: 'sleep-side',
		role: 'base',
		dayparts: ['night'],
		frames: [{ src: foxPoseSrc('fox-realistic-sleeping-side-dreaming.png') }],
		alt: 'Din följeslagare, räven, sover lugnt på sidan.',
		weight: 1.8,
		sceneAdjustment: { scale: 0.58 }
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
		alt: 'Din följeslagare, björnen, står lugnt.',
		weight: 2.4,
		sceneAdjustment: { scale: 0.82, y: 1 }
	},
	{
		id: 'bear-sitting',
		companionId: 'bear',
		role: 'base',
		dayparts: ['day', 'evening'],
		frames: [{ src: bearPoseSrc('bear-sitting.png') }],
		alt: 'Din följeslagare, björnen, sitter stilla.',
		weight: 2.1,
		sceneAdjustment: { scale: 0.78, y: 2 }
	},
	{
		id: 'bear-sleeping',
		companionId: 'bear',
		role: 'base',
		dayparts: ['night'],
		frames: [{ src: bearPoseSrc('bear-sleeping.png') }],
		alt: 'Din följeslagare, björnen, sover lugnt.',
		weight: 2.4,
		sceneAdjustment: { scale: 0.76, y: 4 }
	},
	{
		id: 'bear-stretching',
		companionId: 'bear',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: bearPoseSrc('bear-stretching.png') }],
		alt: 'Din följeslagare, björnen, sträcker lugnt på sig.',
		weight: 0.9,
		sceneAdjustment: { scale: 0.78, x: -1, y: 3 }
	}
] satisfies CompanionPose[];

export const WOLF_COMPANION_POSES = [
	{
		id: 'wolf-standing',
		companionId: 'wolf',
		role: 'base',
		dayparts: ['day', 'evening', 'night'],
		frames: [{ src: wolfPoseSrc('wolf-standing-transparent.png') }],
		alt: 'Din följeslagare, vargen, står lugnt.',
		weight: 2.4,
		sceneAdjustment: { scale: 0.74, y: 3 }
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
		bottom: '39%',
		right: '21%',
		groundLeft: '76%',
		groundTop: '53%',
		compact: {
			scale: 1.55,
			bottom: '39%',
			right: '20%',
			groundLeft: '75%',
			groundTop: '54%'
		}
	}
} as const;

export const COMPANION_POSES: readonly CompanionPose[] = [
	...FOX_COMPANION_POSES,
	...BEAR_COMPANION_POSES,
	...WOLF_COMPANION_POSES
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
			'wolf-standing'
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
	{
		id: 'shore-far',
		x: 73,
		y: 66,
		scale: 0.26,
		zIndex: 1,
		shadow: {
			width: 28,
			height: 3,
			blur: 4,
			opacity: 0.05
		},
		allowedPoseIds: ['idle', 'look-left', 'look-right', 'sit', 'sit-look-up', 'evening-lake'],
		dayparts: ['day', 'evening'],
		weight: 0.85
	}
];

export const COMPANION_POSE_CHANGE_MIN_MS = 20 * 60 * 1000;
export const COMPANION_POSE_CHANGE_MAX_MS = 40 * 60 * 1000;
