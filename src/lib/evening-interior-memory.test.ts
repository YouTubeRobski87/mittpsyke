import { describe, expect, it } from 'vitest';
import {
	EVENING_INTERIOR_BLANKET_MINIMUM_DISTINCT_DAYS,
	EVENING_INTERIOR_BLANKET_MINIMUM_SPAN_DAYS,
	EVENING_INTERIOR_RUG_MINIMUM_DISTINCT_DAYS,
	EVENING_VERANDA_MINIMUM_DISTINCT_DAYS,
	EVENING_VERANDA_MINIMUM_SPAN_DAYS,
	getEveningInteriorMemory,
	isEveningInteriorMemory,
	isEveningInteriorMemoryEligible,
	shouldIntroduceEveningInteriorBlanket,
	shouldIntroduceEveningInteriorRug,
	shouldIntroduceEveningVeranda
} from './evening-interior-memory';
import { getProgressCompanionArtId } from './progressCompanion';

describe('Kvällsstugans inredningsminne', () => {
	it('visar ingen bok utan ett sparat kvällsavtryck', () => {
		expect(isEveningInteriorMemoryEligible(false, false)).toBe(false);
	});

	it('blir berättigat först efter ett lyckat sparande', () => {
		expect(isEveningInteriorMemoryEligible(false, true)).toBe(true);
	});

	it('blir inte berättigat av ett misslyckat sparande', () => {
		expect(isEveningInteriorMemoryEligible(false, false)).toBe(false);
	});

	it('finns kvar vid återbesök, rerender och frånvaro när den verkliga datan finns kvar', () => {
		expect(isEveningInteriorMemoryEligible(true, false)).toBe(true);
		expect(isEveningInteriorMemoryEligible(true, false)).toBe(true);
	});

	it('faller tillbaka säkert utan tillförlitlig persistence', () => {
		expect(isEveningInteriorMemoryEligible(false, false)).toBe(false);
	});

	it('har varken bok eller matta utan sparade dagar', () => {
		expect(getEveningInteriorMemory([])).toEqual({
			hasBook: false,
			hasRug: false,
			hasBlanket: false,
			hasVeranda: false
		});
	});

	it('visar bok efter en sparad dag men inte matta', () => {
		expect(getEveningInteriorMemory(['2026-08-10'])).toEqual({
			hasBook: true,
			hasRug: false,
			hasBlanket: false,
			hasVeranda: false
		});
	});

	it('räknar inte flera sparningar samma kalenderdag som återkomst', () => {
		expect(getEveningInteriorMemory(['2026-08-10', '2026-08-10', '2026-08-10'])).toEqual({
			hasBook: true,
			hasRug: false,
			hasBlanket: false,
			hasVeranda: false
		});
	});

	it('har inte matta efter två separata dagar men har den efter tre', () => {
		expect(getEveningInteriorMemory(['2026-08-10', '2026-08-11'])).toEqual({
			hasBook: true,
			hasRug: false,
			hasBlanket: false,
			hasVeranda: false
		});
		expect(getEveningInteriorMemory(['2026-08-10', '2026-08-11', '2026-08-12'])).toEqual({
			hasBook: true,
			hasRug: true,
			hasBlanket: false,
			hasVeranda: false
		});
		expect(EVENING_INTERIOR_RUG_MINIMUM_DISTINCT_DAYS).toBe(3);
	});

	it('förblir eligible vid fler dagar och ignorerar ogiltiga värden utan att läsa fritext', () => {
		expect(
			getEveningInteriorMemory(['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', 'en tanke'])
		).toEqual({ hasBook: true, hasRug: true, hasBlanket: false, hasVeranda: false });
	});

	it('kräver minst fem dagar över minst sju kalenderdagar för filten', () => {
		expect(
			getEveningInteriorMemory(['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14'])
		).toEqual({ hasBook: true, hasRug: true, hasBlanket: false, hasVeranda: false });
		expect(
			getEveningInteriorMemory(['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-17'])
		).toEqual({ hasBook: true, hasRug: true, hasBlanket: true, hasVeranda: false });
		expect(EVENING_INTERIOR_BLANKET_MINIMUM_DISTINCT_DAYS).toBe(5);
		expect(EVENING_INTERIOR_BLANKET_MINIMUM_SPAN_DAYS).toBe(7);
	});

	it('bevarar filten vid senare återkomst och räknar dubbla dagar en gång', () => {
		expect(
			getEveningInteriorMemory([
				'2026-08-10',
				'2026-08-10',
				'2026-08-11',
				'2026-08-12',
				'2026-08-13',
				'2026-08-17',
				'2026-09-01'
			])
		).toEqual({ hasBook: true, hasRug: true, hasBlanket: true, hasVeranda: false });
	});

	it('påverkar inte följeslagarens tekniska ID:n', () => {
		expect(['fox', 'bear', 'wolf'].map(getProgressCompanionArtId)).toEqual(['fox', 'bear', 'wolf']);
	});

	it('introducerar mattan enbart vid den första övergången till eligibility', () => {
		expect(shouldIntroduceEveningInteriorRug(false, true)).toBe(true);
		expect(shouldIntroduceEveningInteriorRug(true, true)).toBe(false);
		expect(shouldIntroduceEveningInteriorRug(false, false)).toBe(false);
	});

	it('introducerar filten enbart vid den första övergången till eligibility', () => {
		expect(shouldIntroduceEveningInteriorBlanket(false, true)).toBe(true);
		expect(shouldIntroduceEveningInteriorBlanket(true, true)).toBe(false);
		expect(shouldIntroduceEveningInteriorBlanket(false, false)).toBe(false);
	});
});

/**
 * Verandan läser samma servervaliderade kalenderdagar som resten av
 * inredningsminnet. Dagarna uttrycks som offset från BASE_DAY, så att antal
 * unika dagar och kalenderspann går att läsa direkt ur varje testfall.
 */
const BASE_DAY = Date.UTC(2026, 7, 1);

function days(...offsets: readonly number[]): string[] {
	return offsets.map((offset) => new Date(BASE_DAY + offset * 86_400_000).toISOString().slice(0, 10));
}

/** Åtta unika dagar med exakt 14 kalenderdagars spann: minsta berättigade historik. */
const VERANDA_ELIGIBLE_DAYS = days(0, 1, 2, 3, 4, 5, 6, 14);

describe('Kvällsstugans veranda', () => {
	it('har inga trösklar som råkat glida', () => {
		expect(EVENING_VERANDA_MINIMUM_DISTINCT_DAYS).toBe(8);
		expect(EVENING_VERANDA_MINIMUM_SPAN_DAYS).toBe(14);
	});

	it('ger ingen veranda utan sparade dagar', () => {
		expect(getEveningInteriorMemory([]).hasVeranda).toBe(false);
	});

	it('ger ingen veranda vid sju unika dagar trots trettio dagars spann', () => {
		const history = days(0, 1, 2, 3, 4, 5, 30);

		expect(new Set(history).size).toBe(7);
		expect(getEveningInteriorMemory(history).hasVeranda).toBe(false);
	});

	it('ger ingen veranda vid åtta unika dagar med bara tretton dagars spann', () => {
		const history = days(0, 1, 2, 3, 4, 5, 6, 13);

		expect(new Set(history).size).toBe(8);
		expect(getEveningInteriorMemory(history).hasVeranda).toBe(false);
	});

	it('ger veranda vid åtta unika dagar med fjorton dagars spann', () => {
		expect(new Set(VERANDA_ELIGIBLE_DAYS).size).toBe(8);
		expect(getEveningInteriorMemory(VERANDA_ELIGIBLE_DAYS).hasVeranda).toBe(true);
	});

	it('lägger gränsen mellan exakt tretton och exakt fjorton dagars spann', () => {
		expect(getEveningInteriorMemory(days(0, 1, 2, 3, 4, 5, 6, 13)).hasVeranda).toBe(false);
		expect(getEveningInteriorMemory(days(0, 1, 2, 3, 4, 5, 6, 14)).hasVeranda).toBe(true);
	});

	it('räknar flera sparningar samma kalenderdag som en enda dag', () => {
		const duplicated = [...VERANDA_ELIGIBLE_DAYS, ...VERANDA_ELIGIBLE_DAYS];
		expect(getEveningInteriorMemory(duplicated).hasVeranda).toBe(true);

		// Sju verkliga dagar blir inte åtta av att en av dem sparats flera gånger.
		const sevenDays = days(0, 0, 0, 1, 2, 3, 4, 5, 14);
		expect(new Set(sevenDays).size).toBe(7);
		expect(getEveningInteriorMemory(sevenDays).hasVeranda).toBe(false);
	});

	it('ger samma resultat oavsett inputordning', () => {
		const shuffled = days(14, 3, 0, 5, 1, 6, 2, 4);

		expect(getEveningInteriorMemory(shuffled)).toEqual(
			getEveningInteriorMemory(VERANDA_ELIGIBLE_DAYS)
		);
		expect(getEveningInteriorMemory(shuffled).hasVeranda).toBe(true);
	});

	it('ignorerar ogiltiga värden utan egen specialregel', () => {
		const withNoise = [
			...VERANDA_ELIGIBLE_DAYS,
			'en tanke',
			'2026-13-01',
			'2026-02-30',
			null,
			undefined,
			42
		];

		expect(getEveningInteriorMemory(withNoise).hasVeranda).toBe(true);
		// Skräpet får varken lyfta en underkänd historik eller vidga spannet.
		expect(getEveningInteriorMemory(['en tanke', '2026-13-01', 42]).hasVeranda).toBe(false);
	});

	it('förblir tillgänglig när historiken växer med senare dagar', () => {
		const later = [...VERANDA_ELIGIBLE_DAYS, ...days(40, 41, 120)];

		expect(getEveningInteriorMemory(later).hasVeranda).toBe(true);
	});

	it('är permanent eftersom append-only historik bara kan växa', () => {
		// Varje senare session läser en historik som är ett supersätt av den
		// tidigare, och tillgången kan därför aldrig gå förlorad.
		let history = [...VERANDA_ELIGIBLE_DAYS];
		expect(getEveningInteriorMemory(history).hasVeranda).toBe(true);

		for (const offset of [30, 31, 60, 200]) {
			history = [...history, ...days(offset)];
			expect(getEveningInteriorMemory(history).hasVeranda).toBe(true);
		}
	});

	it('introducerar verandan enbart vid den första övergången till eligibility', () => {
		expect(shouldIntroduceEveningVeranda(false, true)).toBe(true);
		expect(shouldIntroduceEveningVeranda(true, true)).toBe(false);
		expect(shouldIntroduceEveningVeranda(false, false)).toBe(false);
		expect(shouldIntroduceEveningVeranda(true, false)).toBe(false);
	});

	it('kräver hasVeranda som boolean i typvakten', () => {
		expect(
			isEveningInteriorMemory({
				hasBook: true,
				hasRug: true,
				hasBlanket: true,
				hasVeranda: true
			})
		).toBe(true);
		expect(isEveningInteriorMemory({ hasBook: true, hasRug: true, hasBlanket: true })).toBe(false);
		expect(
			isEveningInteriorMemory({
				hasBook: true,
				hasRug: true,
				hasBlanket: true,
				hasVeranda: 'ja'
			})
		).toBe(false);
	});
});

describe('Kvällsstugans befintliga trappa efter verandan', () => {
	it('behåller bokens, mattans och filtens trösklar oförändrade', () => {
		expect(EVENING_INTERIOR_RUG_MINIMUM_DISTINCT_DAYS).toBe(3);
		expect(EVENING_INTERIOR_BLANKET_MINIMUM_DISTINCT_DAYS).toBe(5);
		expect(EVENING_INTERIOR_BLANKET_MINIMUM_SPAN_DAYS).toBe(7);
	});

	it('behåller bokens gräns vid en enda unik dag', () => {
		expect(getEveningInteriorMemory([]).hasBook).toBe(false);
		expect(getEveningInteriorMemory(days(0)).hasBook).toBe(true);
	});

	it('behåller mattans gräns vid tre unika dagar', () => {
		expect(getEveningInteriorMemory(days(0, 1)).hasRug).toBe(false);
		expect(getEveningInteriorMemory(days(0, 1, 2)).hasRug).toBe(true);
	});

	it('behåller filtens gräns vid fem unika dagar över sju kalenderdagar', () => {
		expect(getEveningInteriorMemory(days(0, 1, 2, 3)).hasBlanket).toBe(false);
		expect(getEveningInteriorMemory(days(0, 1, 2, 3, 6)).hasBlanket).toBe(false);
		expect(getEveningInteriorMemory(days(0, 1, 2, 3, 7)).hasBlanket).toBe(true);
	});

	it('lämnar bok, matta och filt orörda när verandan blir tillgänglig', () => {
		const belowVeranda = getEveningInteriorMemory(days(0, 1, 2, 3, 4, 5, 6, 13));
		const atVeranda = getEveningInteriorMemory(VERANDA_ELIGIBLE_DAYS);

		expect(belowVeranda).toEqual({
			hasBook: true,
			hasRug: true,
			hasBlanket: true,
			hasVeranda: false
		});
		expect(atVeranda).toEqual({
			hasBook: true,
			hasRug: true,
			hasBlanket: true,
			hasVeranda: true
		});
	});
});
