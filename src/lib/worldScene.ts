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

export type LivingWorldScene = {
	season: ProgressCompanionSeason;
	timeOfDay: ProgressCompanionDayState;
	effects: LivingWorldEffect[];
	features: Record<LivingWorldEffectKind, boolean>;
};

type LivingWorldSceneInput = {
	date?: Date;
	season?: ProgressCompanionSeason;
	timeOfDay?: ProgressCompanionDayState;
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
	{
		id: 'sunlight',
		kind: 'light',
		enabled: true,
		durationMs: 52_000,
		opacity: 0.45
	},
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
		durationMs: 72_000,
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
		durationMs: 96_000,
		delayMs: -44_000,
		opacity: 0.12
	},
	{
		id: 'ripple-near-bank',
		kind: 'water',
		enabled: true,
		className: 'ripple-near-bank',
		x: 51,
		y: 60,
		width: 12,
		height: 4,
		durationMs: 41_000,
		delayMs: 8_000,
		opacity: 0.2
	},
	{
		id: 'ripple-low-bank',
		kind: 'water',
		enabled: true,
		className: 'ripple-low-bank',
		x: 61,
		y: 66,
		width: 10,
		height: 3,
		durationMs: 57_000,
		delayMs: 29_000,
		opacity: 0.16
	},
	{
		id: 'ripple-left-bank',
		kind: 'water',
		enabled: true,
		className: 'ripple-left-bank',
		x: 34,
		y: 64,
		width: 9,
		height: 2.8,
		durationMs: 63_000,
		delayMs: 47_000,
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
		durationMs: 32_000,
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
		durationMs: 39_000,
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
		durationMs: 46_000,
		delayMs: -31_000,
		opacity: 0.11
	},
	{
		id: 'bird-high',
		kind: 'bird',
		enabled: true,
		className: 'bird-high',
		x: -8,
		y: 22,
		width: 2.2,
		height: 1,
		durationMs: 118_000,
		delayMs: 34_000,
		opacity: 0.24,
		scale: 0.78
	},
	{
		id: 'bird-far',
		kind: 'bird',
		enabled: true,
		className: 'bird-far',
		x: -10,
		y: 29,
		width: 1.7,
		height: 0.8,
		durationMs: 157_000,
		delayMs: 91_000,
		opacity: 0.16,
		scale: 0.62
	},
	{
		id: 'butterfly-day',
		kind: 'butterfly',
		enabled: true,
		className: 'butterfly-day',
		x: 16,
		y: 66,
		width: 1.1,
		height: 1.1,
		durationMs: 172_000,
		delayMs: 68_000,
		opacity: 0.28
	},
	{
		id: 'leaf-autumn',
		kind: 'leaf',
		enabled: true,
		className: 'leaf-autumn',
		x: 77,
		y: 9,
		width: 0.8,
		height: 0.55,
		durationMs: 111_000,
		delayMs: 43_000,
		opacity: 0.24
	}
];

function getMistOpacity(timeOfDay: ProgressCompanionDayState): number {
	if (timeOfDay === 'morning') return 0.22;
	if (timeOfDay === 'evening') return 0.16;
	if (timeOfDay === 'night') return 0.12;
	return 0.07;
}

export function getLivingWorldScene(input: LivingWorldSceneInput = {}): LivingWorldScene {
	const date = input.date ?? new Date();
	const season = input.season ?? getProgressCompanionSeason(date);
	const timeOfDay = input.timeOfDay ?? getProgressCompanionDayState(date);
	const isDaylight = timeOfDay === 'morning' || timeOfDay === 'day';
	const mistOpacity = getMistOpacity(timeOfDay);

	const effects = baseEffects.map((effect) => {
		const next = { ...effect };

		if (next.kind === 'mist') {
			next.opacity = mistOpacity * (effect.id === 'mist-two' ? 0.78 : 1);
		}

		if (next.kind === 'bird') {
			next.enabled = isDaylight && season !== 'winter';
		}

		if (next.kind === 'butterfly') {
			next.enabled = isDaylight && (season === 'spring' || season === 'summer');
		}

		if (next.kind === 'leaf') {
			next.enabled = season === 'autumn';
		}

		if (next.kind === 'light' && timeOfDay === 'night') {
			next.opacity = 0.12;
		}

		return next;
	});

	return {
		season,
		timeOfDay,
		effects,
		features: { ...ALL_FEATURES }
	};
}
