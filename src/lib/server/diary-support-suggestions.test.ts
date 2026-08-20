import { describe, expect, it } from 'vitest';
import { buildSupportView, extractTopicSentence } from './diary-support-suggestions';
import type { DiaryInsightRow } from './diary-insight-analysis';

const NOW = new Date('2026-08-21T12:00:00.000Z');

function dayBefore(days: number): string {
	return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Bygger en historik där promenader konsekvent sammanfaller med högre värden. */
function walkHistory(): DiaryInsightRow[] {
	const rows: DiaryInsightRow[] = [];
	for (let index = 0; index < 6; index += 1) {
		rows.push({
			created_at: dayBefore(index * 4 + 1),
			mood: 8,
			text: 'Tog en lång promenad i skogen efter jobbet. Det blev en bra eftermiddag ändå.'
		});
		rows.push({
			created_at: dayBefore(index * 4 + 3),
			mood: 4,
			text: 'Satt inne hela dagen och kom inte igång med något alls.'
		});
	}
	return rows;
}

describe('underlagskravet', () => {
	it('skapar inga förslag alls när historiken är för kort', () => {
		const rows: DiaryInsightRow[] = [
			{ created_at: dayBefore(1), mood: 7, text: 'En promenad idag.' },
			{ created_at: dayBefore(2), mood: 5, text: 'Trött.' }
		];
		const view = buildSupportView(rows, { now: NOW });

		expect(view).toMatchObject({ learning: true, suggestions: [], examples: [] });
	});

	it('skapar inga förslag när inget tema skiljer sig från jämförelsegruppen', () => {
		const rows: DiaryInsightRow[] = Array.from({ length: 12 }, (_, index) => ({
			created_at: dayBefore(index + 1),
			mood: 6,
			text: 'En helt vanlig dag med promenad och lite jobb.'
		}));
		const view = buildSupportView(rows, { now: NOW });

		expect(view.suggestions.filter((item) => item.kind === 'walk')).toEqual([]);
	});

	it('bygger förslaget ur det egna sambandet och räknar upp underlaget', () => {
		const view = buildSupportView(walkHistory(), { now: NOW });
		const walk = view.suggestions.find((item) => item.kind === 'walk');

		expect(view.learning).toBe(false);
		expect(walk).toBeDefined();
		expect(walk?.topicLabel).toBe('Motion');
		expect(walk?.evidence).toMatch(/humörsnitt/);
		expect(view.breathingRoom).toContain('Motion');
	});
});

describe('språket i förslagen', () => {
	it('beskriver samvariation, aldrig orsak', () => {
		const view = buildSupportView(walkHistory(), { now: NOW });

		for (const item of view.suggestions) {
			expect(item.body).not.toMatch(/gör att du mår|leder till|hjälper dig att|du bör|du måste/i);
			expect(item.body).toMatch(/förekommer|återkommer|brukar|under perioder|när flera saker/i);
		}
	});
});

describe('tyngre perioder', () => {
	function heavyHistory(): DiaryInsightRow[] {
		const rows = walkHistory();
		for (let index = 0; index < 8; index += 1) {
			rows.push({
				created_at: dayBefore(index + 1),
				mood: 2,
				text: 'Mycket stress och oro samtidigt, sov dåligt igen och räkningarna ligger kvar.'
			});
		}
		return rows;
	}

	it('växlar till den mindre tonen och lägger det minsta förslaget först', () => {
		const view = buildSupportView(heavyHistory(), { now: NOW });

		expect(view.heavyPeriod).toBe(true);
		expect(view.suggestions[0].kind).toBe('smaller-day');
		expect(view.suggestions[0].title).toBe('Gör dagen mindre');
		expect(view.suggestions.every((item) => item.tone === 'gentle')).toBe(true);
	});

	it('motiverar det minsta förslaget med flera belastningar i samma text', () => {
		const view = buildSupportView(heavyHistory(), { now: NOW });

		expect(view.suggestions[0].evidence).toMatch(/minst två belastningar samtidigt/);
	});

	it('föreslår aldrig något stort under en tyngre period', () => {
		const view = buildSupportView(heavyHistory(), { now: NOW });

		for (const item of view.suggestions) {
			expect(item.title).not.toMatch(/träna|städa|rutin|positiv/i);
		}
	});
});

describe('säkerhetsspärren', () => {
	it('stänger av vardagsförslagen när de senaste texterna innehåller krisord', () => {
		const rows = [
			...walkHistory(),
			{ created_at: dayBefore(1), mood: 2, text: 'Jag vill inte leva längre.' }
		];
		const view = buildSupportView(rows, { now: NOW });

		expect(view).toMatchObject({ withheldForSafety: true, suggestions: [], examples: [], breathingRoom: [] });
	});

	it('visar inte krisinnehåll som ett exempel', () => {
		expect(extractTopicSentence('Jag tog en promenad och ville ta mitt liv efteråt.', ['promenad'])).toBeNull();
	});
});

describe('exempel ur den egna historiken', () => {
	it('citerar bara meningen där temat faktiskt nämns', () => {
		expect(
			extractTopicSentence('Vaknade sent. Efter promenaden kändes det lite lättare än på morgonen.', ['promenad'])
		).toBe('Efter promenaden kändes det lite lättare än på morgonen.');
	});

	it('hoppar över meningar som är för korta för att säga något', () => {
		expect(extractTopicSentence('Promenad.', ['promenad'])).toBeNull();
	});

	it('har alltid en neutral sammanfattning även när citatet uteblir', () => {
		const view = buildSupportView(walkHistory(), { now: NOW });
		const examples = view.examples.filter((example) => example.topicLabel === 'Motion');

		expect(examples.length).toBeGreaterThan(0);
		expect(examples.length).toBeLessThanOrEqual(4);
		for (const example of examples) {
			expect(example.summary).toMatch(/humör \d,\d av 10/);
			expect(example.date).not.toBe('');
		}
	});

	it('hämtar bara exempel från dagar som låg högre', () => {
		const view = buildSupportView(walkHistory(), { now: NOW });

		for (const example of view.examples) {
			expect(example.summary).not.toMatch(/humör [1-5],\d av 10/);
		}
	});
});
