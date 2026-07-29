export type ProgressCompanionSelection = {
	id: string;
	name?: string;
	icon?: string;
};

export type ProgressCompanionId = 'fox' | 'bear' | 'wolf';

export type ProgressCompanionAnimal = {
	id: string;
	name: string;
	temperament: string;
};

export type ProgressCompanionArtId =
	| 'fox'
	| 'bear'
	| 'wolf'
	| 'owl'
	| 'rabbit'
	| 'squirrel'
	| 'turtle'
	| 'dino';

export type ProgressCompanionDayState = 'morning' | 'day' | 'evening' | 'night';
export type ProgressCompanionSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export type DashboardCompanionGreeting = {
	label: string;
	note: string;
};

export type DashboardCompanionScene = {
	greeting: DashboardCompanionGreeting;
	imageSrc: string;
	alt: string;
	season: ProgressCompanionSeason;
	light: 'day' | 'night';
};

type ProgressCompanionPresenceInput = {
	lastEntryDaysAgo?: number | null;
	hasEntries?: boolean;
};

const COMPANION_IMAGE_VERSION = 'v=2';
// WebP i stället för PNG: 2416 kB -> 272 kB (-89%) utan synlig kvalitetsskillnad.
// Bilden är LCP-element på både Mitt Hem och Framsteg, och laddas dessutom en
// gång till som suddig bakgrund i .companion-hero::before - besparingen slår
// alltså dubbelt. PNG-originalet ligger kvar i static/ som källfil.
export const COMPANION_WORLD_SCENE_IMAGE = '/images/dashboard-lakeside-world.webp';

const DASHBOARD_COMPANION_IMAGE_PATHS = {
	day: '/images/avatars/presets/fox-morning.webp',
	night: '/images/avatars/presets/fox-night.webp',
	autumn: '/images/avatars/presets/fox-autumn.webp',
	winter: '/images/avatars/presets/fox-winter.webp'
} as const;

export const PROGRESS_COMPANION_ANIMALS = [
	{ id: 'fox', name: 'Räv', temperament: 'Nyfiken och varsam' },
	{ id: 'bear', name: 'Björn', temperament: 'Lugn och stadig' },
	{ id: 'wolf', name: 'Varg', temperament: 'Trygg och närvarande' },
	{ id: 'owl', name: 'Uggla', temperament: 'Vaken och stilla' },
	{ id: 'rabbit', name: 'Kanin', temperament: 'Mjuk och uppmärksam' },
	{ id: 'squirrel', name: 'Ekorre', temperament: 'Liten och närvarande' },
	{ id: 'turtle', name: 'Sköldpadda', temperament: 'Långsam och trygg' },
	{ id: 'dino', name: 'Liten dino', temperament: 'Vänlig och stillsam' }
] satisfies ProgressCompanionAnimal[];

const COMPANION_METADATA_KEYS = [
	'progress_companion',
	'progressCompanion',
	'companion',
	'selected_companion',
	'selectedCompanion',
	'companion_id',
	'companionId',
	'companion_slug',
	'companionSlug',
	'garden_companion',
	'gardenCompanion'
] as const;

const COMPANION_CONTAINER_KEYS = [
	'preferences',
	'settings',
	'user_preferences',
	'userPreferences',
	'user_settings',
	'userSettings',
	'profile'
] as const;

const COMPANION_ID_KEYS = ['id', 'slug', 'key', 'value', 'companionId', 'companion_id'] as const;
const COMPANION_NESTED_KEYS = [
	'companion',
	'selected',
	'selection',
	'progressCompanion',
	'progress_companion'
] as const;

function isSupportedProgressCompanionId(id: string): id is ProgressCompanionId {
	return id === 'fox' || id === 'bear' || id === 'wolf';
}

function cleanString(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function parseJsonLikeString(value: string): unknown {
	const trimmed = value.trim();
	if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;

	try {
		return JSON.parse(trimmed) as unknown;
	} catch {
		return value;
	}
}

function normalizeObjectCompanion(value: Record<string, unknown>): ProgressCompanionSelection | null {
	for (const key of COMPANION_ID_KEYS) {
		const id = cleanString(value[key]);
		if (id) {
			return {
				id,
				name: cleanString(value.name) ?? cleanString(value.label) ?? undefined,
				icon: cleanString(value.icon) ?? cleanString(value.emoji) ?? undefined
			};
		}
	}

	for (const key of COMPANION_NESTED_KEYS) {
		const nested = normalizeProgressCompanion(value[key]);
		if (nested) return nested;
	}

	return null;
}

export function normalizeProgressCompanion(value: unknown): ProgressCompanionSelection | null {
	const stringValue = cleanString(value);
	if (stringValue) {
		const parsed = parseJsonLikeString(stringValue);
		if (parsed !== stringValue) return normalizeProgressCompanion(parsed);
		return { id: stringValue };
	}

	if (value && typeof value === 'object') {
		if (Array.isArray(value)) {
			for (const item of value) {
				const selection = normalizeProgressCompanion(item);
				if (selection) return selection;
			}
			return null;
		}

		return normalizeObjectCompanion(value as Record<string, unknown>);
	}

	return null;
}

export function readProgressCompanionFromMetadata(
	metadata: Record<string, unknown> | null | undefined
): ProgressCompanionSelection | null {
	if (!metadata) return null;

	for (const key of COMPANION_METADATA_KEYS) {
		const selection = normalizeProgressCompanion(metadata[key]);
		if (selection) return isSupportedProgressCompanionId(selection.id) ? selection : null;
	}

	for (const containerKey of COMPANION_CONTAINER_KEYS) {
		const container = metadata[containerKey];
		if (!container || typeof container !== 'object' || Array.isArray(container)) continue;
		const record = container as Record<string, unknown>;

		for (const key of COMPANION_METADATA_KEYS) {
			const selection = normalizeProgressCompanion(record[key]);
			if (selection) return isSupportedProgressCompanionId(selection.id) ? selection : null;
		}
	}

	return null;
}

export function formatProgressCompanionName(id: string) {
	const normalized = id
		.replace(/[_-]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	if (!normalized) return 'Din följeslagare';
	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function getProgressCompanionAnimal(value: unknown): ProgressCompanionAnimal | null {
	const selection = normalizeProgressCompanion(value);
	if (!selection) return null;

	const builtInAnimal = PROGRESS_COMPANION_ANIMALS.find((option) => option.id === selection.id);
	if (builtInAnimal) return builtInAnimal;

	return {
		id: selection.id,
		name: selection.name ?? formatProgressCompanionName(selection.id),
		temperament: 'Din egen lilla närvaro'
	};
}

// Standardfokus (object-position) för hero-bilden. Räven använder detta värde,
// så det håller nuvarande komposition oförändrad om en följeslagare saknar eget värde.
export const DEFAULT_COMPANION_HERO_FOCUS = '70% 64%';

// Varje följeslagare kan ange sitt eget bildfokus för hero-scenen utan att röra CSS.
// Lägg bara till en rad här när en ny följeslagare får en egen hero-bild.
const PROGRESS_COMPANION_HERO_FOCUS: Partial<Record<ProgressCompanionArtId, string>> = {
	fox: '70% 64%'
};

// Ger object-position för hero-bilden utifrån vald följeslagare, med räv/standard som fallback.
export function getProgressCompanionHeroFocus(id: string | null | undefined): string {
	const artId = getProgressCompanionArtId(id);
	return PROGRESS_COMPANION_HERO_FOCUS[artId] ?? DEFAULT_COMPANION_HERO_FOCUS;
}

export function getProgressCompanionArtId(id: string | null | undefined): ProgressCompanionArtId {
	if (
		id === 'fox' ||
		id === 'bear' ||
		id === 'wolf' ||
		id === 'owl' ||
		id === 'rabbit' ||
		id === 'squirrel' ||
		id === 'turtle' ||
		id === 'dino'
	) {
		return id;
	}
	return 'fox';
}

export function getProgressCompanionSeason(date = new Date()): ProgressCompanionSeason {
	const month = date.getMonth() + 1;

	if (month === 12 || month <= 2) return 'winter';
	if (month >= 9 && month <= 11) return 'autumn';
	if (month >= 3 && month <= 5) return 'spring';
	return 'summer';
}

export function getDashboardCompanionGreeting(date = new Date()): DashboardCompanionGreeting {
	const hour = date.getHours();

	if (hour >= 5 && hour <= 10) return { label: 'God morgon', note: 'En ny dag börjar.' };
	if (hour >= 11 && hour <= 16) return { label: 'God dag', note: 'En sak i taget.' };
	if (hour >= 17 && hour <= 21) return { label: 'God kväll', note: 'Du får landa här.' };
	return { label: 'God natt', note: 'Det får vara stilla nu.' };
}

function appendImageVersion(path: string): string {
	return `${path}?${COMPANION_IMAGE_VERSION}`;
}

export function getDashboardCompanionScene(date = new Date()): DashboardCompanionScene {
	const season = getProgressCompanionSeason(date);
	const hour = date.getHours();
	const light = hour >= 6 && hour <= 17 ? 'day' : 'night';

	let imagePath: string =
		light === 'day' ? DASHBOARD_COMPANION_IMAGE_PATHS.day : DASHBOARD_COMPANION_IMAGE_PATHS.night;

	if (season === 'autumn') {
		imagePath = DASHBOARD_COMPANION_IMAGE_PATHS.autumn;
	} else if (season === 'winter') {
		imagePath = DASHBOARD_COMPANION_IMAGE_PATHS.winter;
	}

	return {
		greeting: getDashboardCompanionGreeting(date),
		imageSrc: appendImageVersion(imagePath),
		alt:
			season === 'winter'
				? 'Din följeslagare, räven, sitter vid sjön i en stilla vintermiljö.'
				: season === 'autumn'
					? 'Din följeslagare, räven, sitter vid sjön i ett mjukt höstljus.'
					: light === 'night'
						? 'Din följeslagare, räven, sitter vid sjön i kvälls- eller nattljus.'
						: 'Din följeslagare, räven, sitter vid sjön i ett lugnt dagsljus.',
		season,
		light
	};
}

export function getProgressCompanionDayState(date = new Date()): ProgressCompanionDayState {
	const hour = Number(
		new Intl.DateTimeFormat('sv-SE', {
			timeZone: 'Europe/Stockholm',
			hour: 'numeric',
			hour12: false
		}).format(date)
	);

	if (!Number.isFinite(hour)) return 'day';
	if (hour >= 5 && hour < 10) return 'morning';
	if (hour >= 10 && hour < 17) return 'day';
	if (hour >= 17 && hour < 22) return 'evening';
	return 'night';
}

export function getProgressCompanionDayStateLabel(state: ProgressCompanionDayState): string {
	if (state === 'morning') return 'Morgon';
	if (state === 'evening') return 'Kväll';
	if (state === 'night') return 'Natt';
	return 'Dag';
}

export function getProgressCompanionDayStateImage(
	state: ProgressCompanionDayState
): string | null {
	return '/images/fox-growth-garden.jpg';
}

export function getProgressCompanionStatusMessage({
	lastEntryDaysAgo = null,
	hasEntries = false
}: ProgressCompanionPresenceInput): string {
	if (!hasEntries) return 'Jag är här när du vill börja.';
	if (lastEntryDaysAgo === null) return 'Fint att du kom tillbaka.';
	if (lastEntryDaysAgo <= 0) return 'Du är här idag. Det räcker fint.';
	if (lastEntryDaysAgo === 1) return 'Fint att du kom tillbaka igen.';
	if (lastEntryDaysAgo <= 6) return 'Skönt att se dig igen. Platsen har väntat lugnt.';
	if (lastEntryDaysAgo <= 21) return 'Det var ett tag sedan. Vi tar det varsamt härifrån.';
	return 'Välkommen tillbaka. Trädgården finns kvar, precis som den är.';
}

export function getProgressCompanionCarePhrases(
	input: ProgressCompanionPresenceInput = {}
): string[] {
	const { lastEntryDaysAgo = null, hasEntries = false } = input;

	if (!hasEntries) {
		return [
			'Jag är här när du vill börja.',
			'En liten stund räcker.',
			'Platsen kan växa långsamt.'
		];
	}

	if (lastEntryDaysAgo !== null && lastEntryDaysAgo >= 7) {
		return [
			'Välkommen tillbaka.',
			'Vi börjar mjukt igen.',
			'Trädgården finns kvar här.',
			'Det går bra att ta en rad i taget.'
		];
	}

	return [
		'Fint att du kom tillbaka.',
		'Skönt att se dig igen.',
		'Du har gett trädgården lite mer ljus.',
		'Jag finns kvar här med dig.'
	];
}
