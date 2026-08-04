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
	/**
	 * Parallaxdjup: 0 = längst bort, 1 = närmast betraktaren. Skalar hur långt
	 * effekten rör sig i sina keyframes, så avlägsna lager (fjärran dimma, moln)
	 * driver långsammare och kortare än nära lager (strandgräs, fallande löv).
	 * Utelämnad = 0.5, dvs mellanplan.
	 */
	depth?: number;
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

export type WorldGrowthLevel = 0 | 1 | 2 | 3 | 4;

type LivingWorldSceneInput = {
	date?: Date;
	season?: ProgressCompanionSeason;
	timeOfDay?: ProgressCompanionDayState;
	wind?: number;
	features?: Partial<Record<LivingWorldEffectKind, boolean>>;
	/**
	 * Hur mycket den beständiga världen har "vuxit" (0-4), härlett ur antalet
	 * dagboksanteckningar via getGrowthLevel. Styr enbart hur rik den beständiga
	 * växtligheten är och när sekundärt liv (drift/fjäril/fågel) tänds - aldrig
	 * relationen till följeslagaren (det är relationshipStage, helt skilt) och
	 * aldrig säsong/dygn. Utelämnat/okänt värde faller tillbaka till nivå 0.
	 */
	growthLevel?: number;
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

// Extensionspunkt för att stänga av en effekttyp i hela scenen utan att röra
// enskilda effekter - t.ex. när en effekt inte har rätt assets ännu.
//
// Molnen är fortsatt pausade: de täta CSS-blobbarna konkurrerar visuellt med
// fotots egen himmel. För att slå på dem behöver .world-cloud i
// AmbientWorld.svelte först göras om till breda, flacka slöjor med
// soft-light-blend så de lägger sig i fotots ljus i stället för ovanpå det.
const PAUSED_AMBIENT_FEATURES: Partial<Record<LivingWorldEffectKind, boolean>> = {
	cloud: false
};

/**
 * Antal sparade dagboksanteckningar -> växtnivå (0-4). Samma trösklar som
 * framstegssidan alltid använt; samlad här så både världen och sifferstatistiken
 * delar en enda källa. Icke-numeriskt/negativt värde ger nivå 0.
 */
export function getGrowthLevel(entryCount: unknown): WorldGrowthLevel {
	if (typeof entryCount !== 'number' || !Number.isFinite(entryCount)) return 0;
	if (entryCount >= 31) return 4;
	if (entryCount >= 16) return 3;
	if (entryCount >= 6) return 2;
	if (entryCount >= 1) return 1;
	return 0;
}

/**
 * Klampar ett godtyckligt värde till en giltig växtnivå. Okänt, saknat, NaN
 * eller negativt -> 0 (den lugna men kompletta basvärlden). Värden över 4 -> 4.
 */
export function normalizeGrowthLevel(value: unknown): WorldGrowthLevel {
	if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
	const floored = Math.floor(value);
	if (floored <= 0) return 0;
	if (floored >= 4) return 4;
	return floored as WorldGrowthLevel;
}

// Opacitetsfaktor för den beständiga växtligheten (foliage) per nivå. Nivå 0
// hålls tydligt synlig - aldrig 0 - så basvärlden ser komplett ut; nivå 4 = 1.0,
// dvs exakt dagens utseende. Detta är den PRIMÄRA tillväxtsignalen.
const FOLIAGE_OPACITY_SCALE: Record<WorldGrowthLevel, number> = {
	0: 0.72,
	1: 0.82,
	2: 0.9,
	3: 0.96,
	4: 1.4
};

// Vilken nivå som krävs för att sekundärt liv ska tändas. Beständiga baslager
// (light/water/foliage/mist) och det årstidsstyrda lövet finns kvar på alla
// nivåer och saknas därför här. Cloud hanteras separat av PAUSED_AMBIENT_FEATURES.
const SECONDARY_FEATURE_MIN_LEVEL: Partial<Record<LivingWorldEffectKind, WorldGrowthLevel>> = {
	drift: 2,
	butterfly: 3,
	bird: 4
};

export type GrowthWorldMask = {
	level: WorldGrowthLevel;
	features: Partial<Record<LivingWorldEffectKind, boolean>>;
	foliageOpacityScale: number;
};

/**
 * Ren översättning växtnivå -> vilka sekundära lager som är tända och hur rik
 * växtligheten är. Rör aldrig säsong, dygn eller relationshipStage. Gaten läggs
 * OVANPÅ säsongslogiken: den kan bara hålla tillbaka en effekt på låg nivå, aldrig
 * tvinga fram en som säsongen/dygnet ändå stänger av.
 */
export function growthWorldMask(growthLevel: unknown): GrowthWorldMask {
	const level = normalizeGrowthLevel(growthLevel);
	const features: Partial<Record<LivingWorldEffectKind, boolean>> = {};
	for (const [kind, minLevel] of Object.entries(SECONDARY_FEATURE_MIN_LEVEL)) {
		features[kind as LivingWorldEffectKind] = level >= minLevel;
	}
	return { level, features, foliageOpacityScale: FOLIAGE_OPACITY_SCALE[level] };
}

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
		// breddade rörelseamplituden i waterSurfaceDrift (WaterLayer.svelte).
		opacity: 0.34
	},
	{
		// Den primära, tydligt synliga vattenrörelsen: en varm ljusglimt som
		// långsamt sveper över vattenytan (helt annat visuellt uttryck än
		// water-surface ovan, inte bara högre opacitet på samma mönster).
		// Startar synlig inom ~2s (se waterGlintSweep i WaterLayer.svelte).
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
		// Motsvarar den fotografiska grenen som hänger in uppifrån höger i
		// dashboard-lakeside-world.png. Egen, kort duration/delay (skild från
		// foliageBreathe/grässvajen) så den svaga vindrörelsen i canopySway
		// (AmbientWorld.svelte) inte känns synkad med gräset vid stranden.
		id: 'canopy-right',
		kind: 'foliage',
		enabled: true,
		className: 'canopy-right',
		x: 73,
		y: 0,
		width: 24,
		height: 22,
		durationMs: 7_400,
		delayMs: -2_600,
		opacity: 0.22
	},
	// Ett fåtal långsamt svävande ljuspartiklar/dimstråk i övre delen av
	// scenen (aldrig i följeslagarens eller textens område), synliga direkt
	// och kontinuerligt - inte slumpmässiga händelser. Se driftFloat i
	// AmbientWorld.svelte.
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

// Parallaxdjup per effekt: 0 = längst bort, 1 = närmast. Samlat här i stället
// för utspritt i baseEffects ovan, så hela djupordningen i scenen går att läsa
// och justera på ett ställe. Effekter som saknas här hamnar på mellanplan.
//
// Ordningen speglar hur scenen faktiskt ser ut: himmel/moln längst bort, sedan
// sjön, sedan stranden, och lövverket närmast betraktaren.
const EFFECT_DEPTHS: Record<string, number> = {
	sunlight: 0.05,
	'cloud-back': 0.1,
	'cloud-front': 0.2,
	'mist-two': 0.22,
	'mist-one': 0.32,
	'water-surface': 0.4,
	'water-glint': 0.45,
	'water-ripple-loop-three': 0.42,
	'water-ripple-loop-two': 0.52,
	'water-ripple-loop-one': 0.58,
	'drift-three': 0.55,
	'drift-two': 0.65,
	'drift-one': 0.72,
	'grass-bank': 0.7,
	'grass-left': 0.8,
	'canopy-right': 0.95
};

// Chansvärden höjda så att en händelse nästan alltid väljs när minst en typ är
// aktuell för dagpart/säsong (se chooseEvent() i AmbientWorld.svelte) - det gör
// naturhändelserna mer sannolika utan att ändra hur ofta de *försöker* ske
// (det styrs av schemaläggningen i AmbientWorld.svelte).
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
	const growth = growthWorldMask(input.growthLevel);
	// Ordning: växtnivåns sekundärgate först, explicit input.features får skriva
	// över den (t.ex. tester), och pausade moln vinner alltid sist.
	const features = {
		...ALL_FEATURES,
		...growth.features,
		...input.features,
		...PAUSED_AMBIENT_FEATURES
	};
	const mistOpacity = getMistOpacity(timeOfDay);

	const effects = baseEffects.map((effect) => {
		const next = { ...effect, depth: effect.depth ?? EFFECT_DEPTHS[effect.id] ?? 0.5 };

		if (next.kind === 'mist') {
			next.opacity = mistOpacity * (effect.id === 'mist-two' ? 0.72 : 1);
		}

		// Den beständiga växtligheten skalas av växtnivån - den primära, alltid
		// synliga tillväxtsignalen. Rör bara foliage, aldrig övriga lager.
		if (next.kind === 'foliage') {
			next.opacity = (effect.opacity ?? 0.22) * growth.foliageOpacityScale;
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
