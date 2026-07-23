// Beskrivande URL-slugs för chattspåren, och deras interna kategorikoder (a/b/e).
// De interna koderna är oförändrade — de används redan i databasen (conversations.category),
// portalnycklar och /api/chat, så de byts inte. Bara den publika webbadressen blir läsbar.

export const CHAT_CATEGORY_TO_SLUG: Record<string, string> = {
	a: 'angest',
	b: 'nedstamdhet',
	e: 'trauma'
};

export const CHAT_SLUG_TO_CATEGORY: Record<string, string> = {
	angest: 'a',
	nedstamdhet: 'b',
	trauma: 'e'
};

export function resolveChatCategory(slugOrCategory: string): string {
	return CHAT_SLUG_TO_CATEGORY[slugOrCategory] ?? slugOrCategory;
}

export function resolveChatSlug(category: string): string {
	return CHAT_CATEGORY_TO_SLUG[category] ?? category;
}
