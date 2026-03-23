import { describe, it, expect } from 'vitest';
import { getParagraphType, getRenderParagraphs, isSeparatorParagraph, formatParagraph } from './paragraphs';

describe('getParagraphType', () => {
	// --- Horoscope headings ---
	it('detects Swedish horoscope heading', () => {
		expect(getParagraphType('Horoskop för Lejonet')).toBe('horoscope-heading');
	});

	it('detects English horoscope heading', () => {
		expect(getParagraphType('Horoscope for Leo')).toBe('horoscope-heading');
	});

	it('detects horoscope heading with surrounding asterisks', () => {
		expect(getParagraphType('**Horoskop för Skorpionen**')).toBe('horoscope-heading');
	});

	it('does not detect horoscope mid-sentence', () => {
		expect(getParagraphType('Idag läste jag Horoskop för Lejonet')).toBe('regular');
	});

	// --- On this day headings ---
	it('detects Swedish on-this-day heading', () => {
		expect(getParagraphType('På denna dag...')).toBe('onthisday-heading');
	});

	it('detects English on-this-day heading', () => {
		expect(getParagraphType('On this day...')).toBe('onthisday-heading');
	});

	it('detects on-this-day with trailing dash', () => {
		expect(getParagraphType('På denna dag—')).toBe('onthisday-heading');
	});

	it('does not detect on-this-day with trailing content after colon', () => {
		expect(getParagraphType('På denna dag: något hände')).toBe('regular');
	});

	it('does not detect on-this-day with colon only', () => {
		expect(getParagraphType('På denna dag:')).toBe('regular');
	});

	// --- Homework headings ---
	it('detects Swedish homework heading', () => {
		expect(getParagraphType('Hemläxa')).toBe('homework-heading');
	});

	it('detects English homework heading', () => {
		expect(getParagraphType('Homework')).toBe('homework-heading');
	});

	it('detects homework heading with trailing dots', () => {
		expect(getParagraphType('Homework...')).toBe('homework-heading');
	});

	it('detects homework heading with trailing dash', () => {
		expect(getParagraphType('Hemläxa—')).toBe('homework-heading');
	});

	it('does not detect homework with colon (stat line pattern)', () => {
		expect(getParagraphType('Homework:')).toBe('regular');
	});

	// --- Quest-log collision tests ---
	it('does not detect quest-log debuff line as homework', () => {
		expect(getParagraphType('💀 [DEBUFF] Homework Pending: Anxiety stacking +5/hour')).toBe('regular');
	});

	it('does not detect quest-log achievement as homework', () => {
		expect(getParagraphType('🏆 HOMEWORK HERO — Slutförde läxa samma dag')).toBe('regular');
	});

	it('does not detect quest-log objective as homework', () => {
		expect(getParagraphType('- Homework ☐')).toBe('regular');
	});

	it('does not detect quest-log stat bar as homework', () => {
		expect(getParagraphType('Homework: ███░░░░░░░ 30% ⚠️')).toBe('regular');
	});

	it('does not detect quest-log debuff as homework', () => {
		expect(getParagraphType('💀 [DEBUFF] Homework Pending — Duration: Until completed')).toBe('regular');
	});

	// --- Regular paragraphs ---
	it('returns regular for normal text', () => {
		expect(getParagraphType('Det var en fin dag idag.')).toBe('regular');
	});

	it('returns regular for empty string', () => {
		expect(getParagraphType('')).toBe('regular');
	});
});

describe('isSeparatorParagraph', () => {
	it('detects triple dash separator', () => {
		expect(isSeparatorParagraph('---')).toBe(true);
	});

	it('detects long dash separator', () => {
		expect(isSeparatorParagraph('----------')).toBe(true);
	});

	it('does not detect text as separator', () => {
		expect(isSeparatorParagraph('hello')).toBe(false);
	});

	it('does not detect short dashes as separator', () => {
		expect(isSeparatorParagraph('--')).toBe(false);
	});
});

describe('formatParagraph', () => {
	it('formats bold text', () => {
		expect(formatParagraph('**bold**')).toBe('<strong>bold</strong>');
	});

	it('formats italic text', () => {
		expect(formatParagraph('*italic*')).toBe('<em>italic</em>');
	});

	it('escapes HTML', () => {
		expect(formatParagraph('<script>alert("xss")</script>')).toContain('&lt;script&gt;');
	});

	it('converts newlines to br', () => {
		expect(formatParagraph('line1\nline2')).toBe('line1<br>line2');
	});
});

describe('getRenderParagraphs', () => {
	it('returns empty array for empty input', () => {
		expect(getRenderParagraphs('')).toEqual([]);
	});

	it('splits regular paragraphs by double newlines', () => {
		const result = getRenderParagraphs('First paragraph.\n\nSecond paragraph.');
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ type: 'regular', text: 'First paragraph.' });
		expect(result[1]).toEqual({ type: 'regular', text: 'Second paragraph.' });
	});

	it('filters out separator paragraphs', () => {
		const result = getRenderParagraphs('Before.\n\n---\n\nAfter.');
		expect(result).toHaveLength(2);
		expect(result[0].text).toBe('Before.');
		expect(result[1].text).toBe('After.');
	});

	it('extracts addon heading from paragraph with content after double newline', () => {
		const result = getRenderParagraphs('Diary text.\n\nHemläxa\n\nGör något bra imorgon.');
		expect(result).toHaveLength(3);
		expect(result[0]).toEqual({ type: 'regular', text: 'Diary text.' });
		expect(result[1]).toEqual({ type: 'homework-heading', text: 'Hemläxa' });
		expect(result[2]).toEqual({ type: 'regular', text: 'Gör något bra imorgon.' });
	});

	it('treats heading with single-newline content as regular paragraph', () => {
		// getParagraphType checks the full paragraph text; single \n doesn't split paragraphs
		const result = getRenderParagraphs('Diary.\n\nHemläxa\nGör något bra imorgon.');
		expect(result).toHaveLength(2);
		expect(result[1].type).toBe('regular');
	});

	it('splits horoscope heading from content within same paragraph', () => {
		// Horoscope regex has no $ anchor, so it matches even with trailing content
		const result = getRenderParagraphs('Diary.\n\nHoroskop för Lejonet\nStjärnorna ler mot dig.');
		expect(result).toHaveLength(3);
		expect(result[1]).toEqual({ type: 'horoscope-heading', text: 'Horoskop för Lejonet' });
		expect(result[2]).toEqual({ type: 'regular', text: 'Stjärnorna ler mot dig.' });
	});

	it('does not treat quest-log homework stat as addon heading', () => {
		const input = 'Quest log.\n\nHomework: ███░░░░░░░ 30%\n\nMore text.';
		const result = getRenderParagraphs(input);
		expect(result.every((p) => p.type === 'regular')).toBe(true);
	});

	it('handles full quest-log entry without false positives', () => {
		const input = [
			'═══ DAILY LOG — Day 127 ═══',
			'',
			'⚡ [MAIN QUEST] Survive Wednesday',
			'- Homework ☐',
			'',
			'💀 [DEBUFF] Homework Pending: Anxiety +5/hour',
			'',
			'🏆 HOMEWORK HERO — Achievement unlocked',
			'',
			'Homework: ███░░░░░░░ 30% ⚠️'
		].join('\n');

		const result = getRenderParagraphs(input);
		const homeworkHeadings = result.filter((p) => p.type === 'homework-heading');
		expect(homeworkHeadings).toHaveLength(0);
	});
});
