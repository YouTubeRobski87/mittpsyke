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
	| 'cloud'
	| 'drift';

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
	wind: number;
	effects: LivingWorldEffect[];
	events: LivingWorldEvent[];
	features: Record<LivingWorldEffectKind, boolean>;
};

type LivingWorldSceneInput = {
	date?: Date;
	season?: ProgressCompanionSeason;
	timeOfDay?: ProgressCompanionDayState;
	wind?: number;
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
	cloud: true,
	drift: true
};

// Moln är fortfarande pausat tills scenen har egna transparenta molnassets -
// CSS-lagret konkurrerade visuellt med den illustrerade bakgrunden. Vatten och
// lövverk är aktiva och medvetet mer synliga (se opacitetsvärdena i
// baseEffects nedan) - lugnt och tydligt märkbart, men fortfarande under
// följeslagaren och texten i lagerordningen så de aldrig skymmer dem.
const PAUSED_AMBIENT_FEATURES: Partial<Record<LivingWorldEffectKind, boolean>> = {
	cloud: false
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
		durationMs: 84_000,
		delayMs: -18_000,
		opacity: 0.24
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
		durationMs: 112_000,
		delayMs: -61_000,
		opacity: 0.18
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
		id: 'water-surface',
		kind: 'water',
		enabled: true,
		className: 'water-surface',
		x: 0,
		y: 46,
		width: 72,
		height: 27,
		durationMs: 64_000,
		delayMs: -34_000,
		// Tydligt synlig rörelse i vattnet, men fortfarande lugn - se den
		// breddade rörelseamplituden i waterSurfaceDrift (LivingWorld.svelte).
		opacity: 0.34
	},
	{
		// Den primära, tydligt synliga vattenrörelsen: en varm ljusglimt som
		// långsamt sveper över vattenytan (helt annat visuellt uttryck än
		// water-surface ovan, inte bara högre opacitet på samma mönster).
		// Startar synlig inom ~2s (se waterGlintSweep i LivingWorld.svelte).
		id: 'water-glint',
		kind: 'water',
		enabled: true,
		className: 'water-glint',
		x: 2,
		y: 49,
		width: 58,
		height: 18,
		durationMs: 9_000,
		delayMs: 0,
		opacity: 0.75
	},
	// Kontinuerligt upprepade vattenringar - den tydligaste "vattnet rör sig"-
	// signalen, eftersom en ring är en otvetydig vattenform (till skillnad från
	// en abstrakt glimt/sken). Loopar hela tiden i stället för att vänta på
	// den slumpmässiga shore-ripple-händelsen. Se .water-ripple-loop.
	{
		id: 'water-ripple-loop-one',
		kind: 'water',
		enabled: true,
		className: 'water-ripple-loop',
		x: 51,
		y: 60,
		width: 9,
		height: 3.1,
		durationMs: 4_200,
		delayMs: 0,
		opacity: 0.75,
		scale: 1
	},
	{
		id: 'water-ripple-loop-two',
		kind: 'water',
		enabled: true,
		className: 'water-ripple-loop',
		x: 35,
		y: 64,
		width: 7.5,
		height: 2.6,
		durationMs: 5_000,
		delayMs: -1_700,
		opacity: 0.65,
		scale: 0.82
	},
	{
		id: 'water-ripple-loop-three',
		kind: 'water',
		enabled: true,
		className: 'water-ripple-loop',
		x: 61,
		y: 66,
		width: 7,
		height: 2.4,
		durationMs: 4_600,
		delayMs: -2_900,
		opacity: 0.6,
		scale: 0.75
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
		durationMs: 28_000,
		delayMs: -7_000,
		opacity: 0.3
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
		durationMs: 36_000,
		delayMs: -20_000,
		opacity: 0.26
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
		durationMs: 44_000,
		delayMs: -31_000,
		opacity: 0.22
	},
	// Ett fåtal långsamt svävande ljuspartiklar/dimstråk i övre delen av
	// scenen (aldrig i följeslagarens eller textens område), synliga direkt
	// och kontinuerligt - inte slumpmässiga händelser. Se driftFloat i
	// LivingWorld.svelte.
	{
		id: 'drift-one',
		kind: 'drift',
		enabled: true,
		x: 18,
		y: 10,
		width: 5,
		height: 5,
		durationMs: 8_000,
		delayMs: 0,
		opacity: 0.75
	},
	{
		id: 'drift-two',
		kind: 'drift',
		enabled: true,
		x: 46,
		y: 18,
		width: 4,
		height: 4,
		durationMs: 9_500,
		delayMs: -1_500,
		opacity: 0.65
	},
	{
		id: 'drift-three',
		kind: 'drift',
		enabled: true,
		x: 67,
		y: 7,
		width: 4.6,
		height: 4.6,
		durationMs: 11_000,
		delayMs: -3_000,
		opacity: 0.7
	}
];

// Chansvärden höjda så att en händelse nästan alltid väljs när minst en typ är
// aktuell för dagpart/säsong (se chooseEvent() i LivingWorld.svelte) - det gör
// naturhändelserna mer sannolika utan att ändra hur ofta de *försöker* ske
// (det styrs av schemaläggningen i LivingWorld.svelte).
const baseEvents: Omit<LivingWorldEvent, 'enabled'>[] = [
	{
		id: 'shore-ripple',
		kind: 'water',
		chance: 0.8,
		durationMs: [3_800, 5_800],
		positions: [
			{ x: 51, y: 60, scale: 0.95, opacity: 0.32 },
			{ x: 61, y: 66, scale: 0.8, opacity: 0.26 },
			{ x: 34, y: 64, scale: 0.72, opacity: 0.22 }
		]
	},
	{
		id: 'distant-birds',
		kind: 'bird',
		chance: 0.1,
		durationMs: [8_000, 12_000],
		positions: [
			{ x: -5, y: 22, scale: 0.72, opacity: 0.4 },
			{ x: -4, y: 29, scale: 0.58, opacity: 0.3 }
		]
	},
	{
		id: 'daytime-butterfly',
		kind: 'butterfly',
		chance: 0.09,
		durationMs: [6_500, 9_000],
		positions: [
			{ x: 16, y: 66, scale: 0.9, opacity: 0.42 },
			{ x: 29, y: 72, scale: 0.72, opacity: 0.32 }
		]
	},
	{
		id: 'autumn-leaf',
		kind: 'leaf',
		chance: 0.08,
		durationMs: [5_500, 7_500],
		positions: [
			{ x: 77, y: 9, scale: 0.9, opacity: 0.4 },
			{ x: 67, y: 16, scale: 0.7, opacity: 0.3 }
		]
	}
];

function getMistOpacity(timeOfDay: ProgressCompanionDayState): number {
	if (timeOfDay === 'morning') return 0.3;
	if (timeOfDay === 'evening') return 0.27;
	if (timeOfDay === 'night') return 0.29;
	return 0.24;
}

export function getLivingWorldScene(input: LivingWorldSceneInput = {}): LivingWorldScene {
	const date = input.date ?? new Date();
	const season = input.season ?? getProgressCompanionSeason(date);
	const timeOfDay = input.timeOfDay ?? getProgressCompanionDayState(date);
	const wind = Math.min(Math.max(input.wind ?? 0.18, 0), 1);
	const isDaylight = timeOfDay === 'morning' || timeOfDay === 'day';
	const features = { ...ALL_FEATURES, ...input.features, ...PAUSED_AMBIENT_FEATURES };
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

	return { season, timeOfDay, wind, effects, events, features };
}
