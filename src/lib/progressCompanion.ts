export type ProgressCompanionSelection = {
	id: string;
	name?: string;
	icon?: string;
};

export type ProgressCompanionAnimal = {
	id: string;
	name: string;
	temperament: string;
};

export type ProgressCompanionArtId =
	| 'fox'
	| 'bear'
	| 'owl'
	| 'rabbit'
	| 'squirrel'
	| 'turtle'
	| 'dino';

export type ProgressCompanionDayState = 'morning' | 'day' | 'evening' | 'night';

type ProgressCompanionPresenceInput = {
	lastEntryDaysAgo?: number | null;
	hasEntries?: boolean;
};

export const PROGRESS_COMPANION_ANIMALS = [
	{ id: 'fox', name: 'Räv', temperament: 'Nyfiken och varsam' },
	{ id: 'bear', name: 'Björn', temperament: 'Lugn och stadig' },
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
		if (selection) return selection;
	}

	for (const containerKey of COMPANION_CONTAINER_KEYS) {
		const container = metadata[containerKey];
		if (!container || typeof container !== 'object' || Array.isArray(container)) continue;
		const record = container as Record<string, unknown>;

		for (const key of COMPANION_METADATA_KEYS) {
			const selection = normalizeProgressCompanion(record[key]);
			if (selection) return selection;
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

export function getProgressCompanionArtId(id: string | null | undefined): ProgressCompanionArtId {
	if (
		id === 'fox' ||
		id === 'bear' ||
		id === 'owl' ||
		id === 'rabbit' ||
		id === 'squirrel' ||
		id === 'turtle' ||
		id === 'dino'
	) {
		return id;
	}
	return 'bear';
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
	return '/images/bear-growth-garden.jpg';
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
