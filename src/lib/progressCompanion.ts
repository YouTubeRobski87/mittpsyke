export type ProgressCompanionSelection = {
	id: string;
	name?: string;
	icon?: string;
};

type ProgressCompanionPresenceInput = {
	lastEntryDaysAgo?: number | null;
	hasEntries?: boolean;
};

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
