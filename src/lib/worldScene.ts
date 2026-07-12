import {
	getProgressCompanionDayState,
	getProgressCompanionSeason,
	type ProgressCompanionDayState,
	type ProgressCompanionSeason
} from '$lib/progressCompanion';

export type LivingWorldEffectKind =
	| 'light'
	| 'water'
	| 'foliage'
	| 'mist'
	| 'bird'
	| 'butterfly'
	| 'leaf'
	| 'cloud';

export type LivingWorldEffect = {
	id: string;
	kind: LivingWorldEffectKind;
	enabled: boolean;
	className?: string;
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	durationMs?: number;
	delayMs?: number;
	opacity?: number;
	scale?: number;
};

export type LivingWorldEvent = {
	id: string;
	kind: Extract<LivingWorldEffectKind, 'water' | 'bird' | 'butterfly' | 'leaf'>;
	enabled: boolean;
	chance: number;
	durationMs: [number, number];
	positions: Array<{
		x: number;
		y: number;
		scale: number;
		opacity: number;
	}>;
};

export type LivingWorldScene = {
	season: ProgressCompanionSeason;
	timeOfDay: ProgressCompanionDayState;
	effects: LivingWorldEffect[];
	events: LivingWorldEvent[];
	features: Record<LivingWorldEffectKind, boolean>;
};

type LivingWorldSceneInput = {
	date?: Date;
	season?: ProgressCompanionSeason;
	timeOfDay?: ProgressCompanionDayState;
	features?: Partial<Record<LivingWorldEffectKind, boolean>>;
};

const ALL_FEATURES: Record<LivingWorldEffectKind, boolean> = {
	light: true,
	water: true,
	foliage: true,
	mist: true,
	bird: true,
	butterfly: true,
	leaf: true,
	cloud: true
};

const baseEffects: LivingWorldEffect[] = [
	{ id: 'sunlight', kind: 'light', enabled: true, durationMs: 52_000, opacity: 0.45 },
	{
		id: 'cloud-back',
		kind: 'cloud',
		enabled: true,
		className: 'cloud-back',
		x: 10,
		y: 9,
		width: 28,
		height: 9,
		durationMs: 132_000,
		delayMs: -18_000,
		opacity: 0.13
	},
	{
		id: 'cloud-front',
		kind: 'cloud',
		enabled: true,
		className: 'cloud-front',
		x: 48,
		y: 15,
		width: 22,
		height: 7,
		durationMs: 164_000,
		delayMs: -61_000,
		opacity: 0.1
	},
	{
		id: 'mist-one',
		kind: 'mist',
		enabled: true,
		className: 'mist-one',
		x: -10,
		y: 50,
		width: 118,
		height: 15,
		durationMs: 118_000,
		delayMs: -12_000,
		opacity: 0.18
	},
	{
		id: 'mist-two',
		kind: 'mist',
		enabled: true,
		className: 'mist-two',
		x: -15,
		y: 57,
		width: 122,
		height: 13,
		durationMs: 146_000,
		delayMs: -44_000,
		opacity: 0.12
	},
	{
		id: 'grass-left',
		kind: 'foliage',
		enabled: true,
		className: 'grass-left',
		x: 8,
		y: 70,
		width: 20,
		height: 24,
		durationMs: 47_000,
		delayMs: -7_000,
		opacity: 0.18
	},
	{
		id: 'grass-bank',
		kind: 'foliage',
		enabled: true,
		className: 'grass-bank',
		x: 63,
		y: 63,
		width: 23,
		height: 28,
		durationMs: 61_000,
		delayMs: -20_000,
		opacity: 0.16
	},
	{
		id: 'canopy-right',
		kind: 'foliage',
		enabled: true,
		className: 'canopy-right',
		x: 73,
		y: 0,
		width: 24,
		height: 22,
		durationMs: 79_000,
		delayMs: -31_000,
		opacity: 0.11
	}
];

const baseEvents: Omit<LivingWorldEvent, 'enabled'>[] = [
	{
		id: 'shore-ripple',
		kind: 'water',
		chance: 0.68,
		durationMs: [3_800, 5_800],
		positions: [
			{ x: 51, y: 60, scale: 0.85, opacity: 0.2 },
			{ x: 61, y: 66, scale: 0.7, opacity: 0.16 },
			{ x: 34, y: 64, scale: 0.62, opacity: 0.12 }
		]
	},
	{
		id: 'distant-birds',
		kind: 'bird',
		chance: 0.06,
		durationMs: [8_000, 12_000],
		positions: [
			{ x: -5, y: 22, scale: 0.72, opacity: 0.2 },
			{ x: -4, y: 29, scale: 0.58, opacity: 0.14 }
		]
	},
	{
		id: 'daytime-butterfly',
		kind: 'butterfly',
		chance: 0.05,
		durationMs: [6_500, 9_000],
		positions: [
			{ x: 16, y: 66, scale: 0.9, opacity: 0.26 },
			{ x: 29, y: 72, scale: 0.72, opacity: 0.2 }
		]
	},
	{
		id: 'autumn-leaf',
		kind: 'leaf',
		chance: 0.04,
		durationMs: [5_500, 7_500],
		positions: [
			{ x: 77, y: 9, scale: 0.9, opacity: 0.24 },
			{ x: 67, y: 16, scale: 0.7, opacity: 0.18 }
		]
	}
];

function getMistOpacity(timeOfDay: ProgressCompanionDayState): number {
	if (timeOfDay === 'morning') return 0.2;
	if (timeOfDay === 'evening') return 0.17;
	if (timeOfDay === 'night') return 0.18;
	return 0.055;
}

export function getLivingWorldScene(input: LivingWorldSceneInput = {}): LivingWorldScene {
	const date = input.date ?? new Date();
	const season = input.season ?? getProgressCompanionSeason(date);
	const timeOfDay = input.timeOfDay ?? getProgressCompanionDayState(date);
	const isDaylight = timeOfDay === 'morning' || timeOfDay === 'day';
	const features = { ...ALL_FEATURES, ...input.features };
	const mistOpacity = getMistOpacity(timeOfDay);

	const effects = baseEffects.map((effect) => {
		const next = { ...effect };

		if (next.kind === 'mist') {
			next.opacity = mistOpacity * (effect.id === 'mist-two' ? 0.72 : 1);
		}

		if (next.kind === 'light' && timeOfDay === 'night') next.opacity = 0.12;
		return next;
	});

	const events = baseEvents.map((event) => ({
		...event,
		enabled:
			features[event.kind] &&
			(event.kind !== 'bird' || (isDaylight && season !== 'winter')) &&
			(event.kind !== 'butterfly' || (isDaylight && (season === 'spring' || season === 'summer'))) &&
			(event.kind !== 'leaf' || season === 'autumn')
	}));

	return { season, timeOfDay, effects, events, features };
}
