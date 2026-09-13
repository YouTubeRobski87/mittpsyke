// Användarens egna korrigeringar av teman i Framstegs återblick.
//
// Korrigeringarna sparas i user_metadata under PROGRESS_THEME_OVERRIDES_KEY,
// samma mönster som övriga personliga inställningar. De påverkar bara hur
// återblicken räknar och visar teman. Dagboksinläggen läses aldrig om och
// ändras aldrig: ett dolt tema tas bara bort ur analysen, och ett nytt namn är
// bara en visningsetikett.

export const PROGRESS_THEME_OVERRIDES_KEY = 'progress_theme_overrides';
export const MAX_THEME_LABEL_LENGTH = 40;

export type ProgressThemeOverride = {
	/** Användarens eget namn på temat. Saknas när originalnamnet gäller. */
	label?: string;
	/** Sant när användaren markerat "Det här stämmer inte". */
	hidden?: boolean;
};

/** Nyckeln är temats tekniska id, dvs originalnamnet i TOPICS. */
export type ProgressThemeOverrides = Record<string, ProgressThemeOverride>;

/** Ett visningsnamn: en rad, trimmad, 1–40 tecken. Annars null. */
export function normalizeThemeLabel(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const label = value.replace(/\s+/g, ' ').trim();
	if (!label || label.length > MAX_THEME_LABEL_LENGTH) return null;
	return label;
}

/**
 * Läser korrigeringarna defensivt. user_metadata kan användaren skriva själv,
 * så allt som inte har rätt form kastas. Med knownIds släpps bara teman som
 * analysen faktiskt känner till igenom.
 */
export function normalizeProgressThemeOverrides(
	value: unknown,
	knownIds?: readonly string[]
): ProgressThemeOverrides {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
	const known = knownIds ? new Set(knownIds) : null;
	const result: ProgressThemeOverrides = {};
	for (const [id, raw] of Object.entries(value as Record<string, unknown>)) {
		if (known && !known.has(id)) continue;
		if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
		const entry = raw as { label?: unknown; hidden?: unknown };
		const override: ProgressThemeOverride = {};
		const label = normalizeThemeLabel(entry.label);
		if (label && label !== id) override.label = label;
		if (entry.hidden === true) override.hidden = true;
		if (override.label || override.hidden) result[id] = override;
	}
	return result;
}

/** Temats visningsnamn: användarens eget om det finns, annars originalet. */
export function getThemeDisplayLabel(overrides: ProgressThemeOverrides, id: string): string {
	return overrides[id]?.label ?? id;
}

export function isThemeHidden(overrides: ProgressThemeOverrides, id: string): boolean {
	return overrides[id]?.hidden === true;
}

function withOverride(
	overrides: ProgressThemeOverrides,
	id: string,
	update: ProgressThemeOverride
): ProgressThemeOverrides {
	const merged: ProgressThemeOverride = { ...overrides[id], ...update };
	const next = { ...overrides };
	const label = normalizeThemeLabel(merged.label);
	const cleaned: ProgressThemeOverride = {};
	if (label && label !== id) cleaned.label = label;
	if (merged.hidden === true) cleaned.hidden = true;
	if (cleaned.label || cleaned.hidden) next[id] = cleaned;
	else delete next[id];
	return next;
}

/** Byter namn. Ett tomt namn, eller originalnamnet, återställer temat. */
export function renameTheme(
	overrides: ProgressThemeOverrides,
	id: string,
	label: string
): ProgressThemeOverrides {
	return withOverride(overrides, id, { label: normalizeThemeLabel(label) ?? undefined });
}

/** Döljer eller visar temat i återblicken. Inläggen påverkas inte. */
export function setThemeHidden(
	overrides: ProgressThemeOverrides,
	id: string,
	hidden: boolean
): ProgressThemeOverrides {
	return withOverride(overrides, id, { hidden });
}

type SupportLike = {
	suggestions: { topicLabel: string | null }[];
	breathingRoom: string[];
	examples: { topicLabel: string }[];
};

/**
 * Samma korrigeringar i "Kanske värt att prova": ett dolt tema tas bort ur
 * förslag, andrum och exempel, och ett omdöpt tema visas med användarens namn.
 */
export function applyThemeOverridesToSupport<T extends SupportLike>(
	view: T,
	overrides: ProgressThemeOverrides
): T {
	const visible = (id: string | null) => id === null || !isThemeHidden(overrides, id);
	const rename = (id: string) => getThemeDisplayLabel(overrides, id);
	return {
		...view,
		suggestions: view.suggestions
			.filter((suggestion) => visible(suggestion.topicLabel))
			.map((suggestion) =>
				suggestion.topicLabel === null ? suggestion : { ...suggestion, topicLabel: rename(suggestion.topicLabel) }
			),
		breathingRoom: view.breathingRoom.filter((id) => visible(id)).map(rename),
		examples: view.examples
			.filter((example) => visible(example.topicLabel))
			.map((example) => ({ ...example, topicLabel: rename(example.topicLabel) }))
	};
}
