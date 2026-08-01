/**
 * Feed and changelog text is untrusted. Keep it as plain text from the first
 * import step; callers must not render it with `{@html}`.
 */
const namedEntities: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	'#39': "'"
};

export function decodeHtmlEntities(value: string): string {
	return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, token) => {
		const normalized = String(token).toLowerCase();
		if (normalized in namedEntities) return namedEntities[normalized];
		const codePoint = normalized.startsWith('#x')
			? Number.parseInt(normalized.slice(2), 16)
			: Number.parseInt(normalized.slice(1), 10);
		return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
			? String.fromCodePoint(codePoint)
			: entity;
	});
}

export function toPlainText(value: unknown, maxLength = 900): string | null {
	if (typeof value !== 'string') return null;
	let text = value;
	// A double pass handles feeds that have encoded an already escaped excerpt.
	text = decodeHtmlEntities(decodeHtmlEntities(text));
	text = text
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	if (!text) return null;
	return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

export function isBareVersion(value: string): boolean {
	return /^(?:v)?\d+(?:\.\d+){1,3}(?:[-+][\w.-]+)?$/i.test(value.trim());
}

export function normalizedTitle(title: unknown, provider: unknown): string {
	const cleanTitle = toPlainText(title, 180) ?? 'Odaterat fynd';
	const cleanProvider = toPlainText(provider, 80);
	return cleanProvider && isBareVersion(cleanTitle) ? `${cleanProvider} ${cleanTitle}` : cleanTitle;
}

/** Keep a compact, readable excerpt instead of saving a raw changelog. */
export function summarizeSourceText(value: unknown): string | null {
	const text = toPlainText(value, 1_800);
	if (!text) return null;
	const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];
	return sentences.slice(0, 3).join(' ').trim().slice(0, 520);
}
