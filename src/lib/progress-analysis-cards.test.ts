import { describe, expect, it } from 'vitest';
import {
	MAX_CONCLUSION_LENGTH,
	MAX_EXPLANATION_LENGTH,
	NO_PATTERN_COPY,
	buildAnalysisCards,
	type AnalysisCardsInput,
	type EvidenceClaimLike
} from './progress-analysis-cards';

function claim(overrides: Partial<EvidenceClaimLike> = {}): EvidenceClaimLike {
	return {
		title: 'Motion förekommer oftare under ljusare dagar',
		description:
			'När motion nämns ligger humörvärdet oftare högre än i dina övriga texter. Det visar ett samband i underlaget, inte vad som orsakar det.',
		evidence:
			'7 av 24 texter nämner motion, med humörsnitt 7,4 jämfört med 5,1 i 17 övriga texter.',
		topic: 'Motion',
		...overrides
	};
}

const full: AnalysisCardsInput = {
	recentComparison: {
		title: 'Den senaste perioden ligger lägre',
		description:
			'Dina senaste registreringar ligger lägre på skalan än perioden före. Det gäller de senaste två veckorna.',
		evidence: 'De senaste 14 dagarna bygger på 9 registreringar med snitt 4,2, jämfört med 11 och snitt 5,6.'
	},
	patterns: [
		claim({ title: 'Stress och Sömn återkommer tillsammans', topic: undefined }),
		claim({ title: 'Helgerna verkar ge lite mer lugn', topic: undefined })
	],
	strengths: [
		claim(),
		claim({ title: 'Social kontakt förekommer oftare under ljusare dagar', topic: 'Social kontakt' }),
		claim({ title: 'Natur förekommer oftare under ljusare dagar', topic: 'Natur' }),
		claim({ title: 'Vila förekommer oftare under ljusare dagar', topic: 'Vila' })
	],
	challenges: [claim({ title: 'Stress sammanfaller oftare med tyngre dagar', topic: 'Stress' })],
	timelineObservations: [
		claim({
			title: 'Måendet har blivit mer växlande',
			description:
				'De senare registreringarna ligger längre ifrån varandra än i början av underlaget. Skillnaden är tydlig.',
			topic: undefined
		})
	],
	themes: [
		{ label: 'Stress', count: 9 },
		{ label: 'Familj', count: 7 },
		{ label: 'Sömn', count: 5 },
		{ label: 'Ekonomi', count: 3 },
		{ label: 'Natur', count: 2 },
		{ label: 'Enstaka', count: 1 }
	],
	dataBasis: { moodEntryCount: 30, textEntryCount: 24 }
};

describe('kortens struktur', () => {
	it('ger alltid exakt fyra kort i samma ordning', () => {
		expect(buildAnalysisCards(full).map((card) => card.id)).toEqual([
			'recent',
			'recurring',
			'helping',
			'change'
		]);
		expect(buildAnalysisCards({}).map((card) => card.id)).toEqual([
			'recent',
			'recurring',
			'helping',
			'change'
		]);
	});

	it('håller varje slutsats och förklaring kort nog att skannas', () => {
		for (const card of buildAnalysisCards(full)) {
			expect(card.conclusion.length, card.id).toBeLessThanOrEqual(MAX_CONCLUSION_LENGTH);
			expect(card.explanation?.length ?? 0, card.id).toBeLessThanOrEqual(MAX_EXPLANATION_LENGTH);
		}
	});

	it('lämnar aldrig ett helt stycke i huvudvyn', () => {
		for (const card of buildAnalysisCards(full)) {
			// Ett stycke känns igen på att det innehåller mer än en avslutad mening.
			const sentences = (card.explanation ?? '').split(/[.!?]\s+/).filter(Boolean);
			expect(sentences.length, card.id).toBeLessThanOrEqual(1);
		}
	});
});

describe('senaste tiden', () => {
	it('bär jämförelsefönstret som undertext och räknar underlaget', () => {
		const [recent] = buildAnalysisCards(full);

		expect(recent.caption).toBe('Senaste 14 dagarna jämfört med tidigare period');
		expect(recent.conclusion).toBe('Den senaste perioden ligger lägre');
		expect(recent.dataPoint).toBe('30 registreringar');
	});

	it('flyttar hela beräkningen till fördjupningen', () => {
		const [recent] = buildAnalysisCards(full);

		expect(recent.details).toHaveLength(1);
		expect(recent.details[0].value).toContain('14 dagarna bygger på 9 registreringar');
	});
});

describe('det som återkommer', () => {
	it('visar högst fyra teman som chips', () => {
		const [, recurring] = buildAnalysisCards(full);

		expect(recurring.chips).toEqual(['Stress', 'Familj', 'Sömn', 'Ekonomi']);
	});

	it('utelämnar teman med för litet underlag', () => {
		const [, recurring] = buildAnalysisCards(full);

		expect(recurring.chips).not.toContain('Enstaka');
	});

	it('lyfter ett samband mellan två teman före ett enskilt', () => {
		const [, recurring] = buildAnalysisCards(full);

		expect(recurring.conclusion).toBe('Stress och Sömn återkommer tillsammans');
	});

	it('lägger överskjutande teman i fördjupningen i stället för i vyn', () => {
		const [, recurring] = buildAnalysisCards(full);

		expect(recurring.details.map((item) => item.label)).toContain('Natur');
	});
});

describe('det som verkar hjälpa', () => {
	it('visar högst tre rader med kort etikett', () => {
		const [, , helping] = buildAnalysisCards(full);

		expect(helping.items).toHaveLength(3);
		expect(helping.items.map((item) => item.label)).toEqual(['Motion', 'Social kontakt', 'Natur']);
		for (const item of helping.items) expect(item.note.length).toBeLessThanOrEqual(60);
	});

	it('sammanfattar antalet i stället för att upprepa första raden', () => {
		const [, , helping] = buildAnalysisCards(full);

		expect(helping.conclusion).toBe('Tre teman återkommer i dina lättare perioder.');
		expect(helping.conclusion).not.toContain(helping.items[0].label);
	});

	it('härleder etiketten ur rubriken när temat saknas', () => {
		const cards = buildAnalysisCards({
			strengths: [claim({ title: 'Promenader förekommer oftare under ljusare dagar', topic: undefined })]
		});

		expect(cards[2].items[0].label).toBe('Promenader');
	});

	it('påstår aldrig att något orsakar ett bättre mående', () => {
		const [, , helping] = buildAnalysisCards(full);

		for (const item of helping.items) {
			expect(item.note).not.toMatch(/gör att|leder till|hjälper dig att|orsakar/i);
			expect(item.note).toMatch(/förekommer|återkommer|syns/i);
		}
	});
});

describe('förändring över tid', () => {
	it('säger tydligt när ingen trend går att se', () => {
		const [, , , change] = buildAnalysisCards({});

		expect(change.conclusion).toBe('Ingen tydlig långsiktig trend ännu.');
		expect(change.explanation).toBe('Underlaget räcker inte för att jämföra längre perioder.');
	});

	it('visar den starkaste observationen och gömmer resten', () => {
		const [, , , change] = buildAnalysisCards(full);

		expect(change.conclusion).toBe('Måendet har blivit mer växlande');
		expect(change.details.length).toBeGreaterThan(0);
	});
});

describe('tomma lägen', () => {
	it('säger att mönstret saknas i stället för att fylla ut', () => {
		const cards = buildAnalysisCards({});

		expect(cards[0].empty).toBe(true);
		expect(cards[0].conclusion).toBe(NO_PATTERN_COPY);
		expect(cards[1].conclusion).toBe(NO_PATTERN_COPY);
		expect(cards[2].conclusion).toBe(NO_PATTERN_COPY);
		for (const card of cards) expect(card.details).toEqual([]);
	});

	it('tål trasiga teman utan att välta', () => {
		const cards = buildAnalysisCards({
			themes: [
				{ label: '   ', count: 9 },
				{ label: 'Sömn', count: Number.NaN }
			] as { label: string; count: number }[]
		});

		expect(cards[1].chips).toEqual([]);
		expect(cards[1].empty).toBe(true);
	});
});
