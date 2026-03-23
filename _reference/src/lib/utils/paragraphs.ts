export type ParagraphType = 'horoscope-heading' | 'onthisday-heading' | 'homework-heading' | 'dailychallenge-heading' | 'regular';
export type RenderParagraph = { type: ParagraphType; text: string };

export function getParagraphType(text: string): ParagraphType {
	const trimmed = text.trim().replace(/^\*+|\*+$/g, '');
	if (/^Horoskop för /i.test(trimmed) || /^Horoscope for /i.test(trimmed)) {
		return 'horoscope-heading';
	}
	if (
		/^På denna dag(?:[\s.!…—–-]*)$/i.test(trimmed) ||
		/^On this day(?:[\s.!…—–-]*)$/i.test(trimmed)
	) {
		return 'onthisday-heading';
	}
	if (/^Hemläxa(?:[\s.!…—–-]*)$/i.test(trimmed) || /^Homework(?:[\s.!…—–-]*)$/i.test(trimmed)) {
		return 'homework-heading';
	}
	if (/^Dagens utmaning(?:[\s.!…—–-]*)$/i.test(trimmed) || /^Daily challenge(?:[\s.!…—–-]*)$/i.test(trimmed)) {
		return 'dailychallenge-heading';
	}
	return 'regular';
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

export function formatParagraph(text: string): string {
	return escapeHtml(text)
		.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.*?)\*/g, '<em>$1</em>')
		.replace(/\n/g, '<br>');
}

export function isSeparatorParagraph(text: string): boolean {
	return /^-{3,}$/.test(text.trim());
}

export function getRenderParagraphs(entry: string): RenderParagraph[] {
	if (!entry) return [];
	const paragraphs = entry.split(/\n{2,}/);
	const result: RenderParagraph[] = [];

	for (const paragraph of paragraphs) {
		if (!paragraph.trim()) continue;
		if (isSeparatorParagraph(paragraph)) continue;

		const paragraphType = getParagraphType(paragraph);
		if (paragraphType === 'regular') {
			result.push({ type: 'regular', text: paragraph });
			continue;
		}

		const lines = paragraph
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line && !isSeparatorParagraph(line));
		if (lines.length === 0) continue;

		result.push({ type: paragraphType, text: lines[0] });

		if (lines.length > 1) {
			result.push({ type: 'regular', text: lines.slice(1).join('\n') });
		}
	}

	return result;
}
