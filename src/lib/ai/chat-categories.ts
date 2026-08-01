// Stödkategorierna som styr vilken systemprompt /api/chat använder.
//
// A, B och E är de befintliga spåren och ligger sparade i conversations.category.
// G är det neutrala spåret: samtal utan vald kategori, vilket numera är den
// normala vägen in. G finns för att en saknad kategori tidigare föll tillbaka på
// A, så att någon som skrev "jag saknar mina barn" fick en ångestinriktad prompt
// pålagd. Ett samtal utan kategori ska följa användarens egna ord i stället.

export type SupportCategory = 'A' | 'B' | 'E' | 'G';

export const NEUTRAL_CATEGORY: SupportCategory = 'G';

export function normalizeCategory(value: unknown): SupportCategory {
	const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
	if (normalized === 'A') return 'A';
	if (normalized === 'B') return 'B';
	if (normalized === 'E') return 'E';
	return NEUTRAL_CATEGORY;
}

/** True när samtalet saknar vald kategori och alltså kör det neutrala spåret. */
export function isNeutralCategory(category: SupportCategory): boolean {
	return category === NEUTRAL_CATEGORY;
}
