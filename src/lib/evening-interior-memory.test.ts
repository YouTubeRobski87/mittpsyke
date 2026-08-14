import { describe, expect, it } from 'vitest';
import {
	EVENING_INTERIOR_RUG_MINIMUM_DISTINCT_DAYS,
	getEveningInteriorMemory,
	isEveningInteriorMemoryEligible,
	shouldIntroduceEveningInteriorRug
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
		expect(getEveningInteriorMemory([])).toEqual({ hasBook: false, hasRug: false });
	});

	it('visar bok efter en sparad dag men inte matta', () => {
		expect(getEveningInteriorMemory(['2026-08-10'])).toEqual({ hasBook: true, hasRug: false });
	});

	it('räknar inte flera sparningar samma kalenderdag som återkomst', () => {
		expect(getEveningInteriorMemory(['2026-08-10', '2026-08-10', '2026-08-10'])).toEqual({
			hasBook: true,
			hasRug: false
		});
	});

	it('har inte matta efter två separata dagar men har den efter tre', () => {
		expect(getEveningInteriorMemory(['2026-08-10', '2026-08-11'])).toEqual({
			hasBook: true,
			hasRug: false
		});
		expect(getEveningInteriorMemory(['2026-08-10', '2026-08-11', '2026-08-12'])).toEqual({
			hasBook: true,
			hasRug: true
		});
		expect(EVENING_INTERIOR_RUG_MINIMUM_DISTINCT_DAYS).toBe(3);
	});

	it('förblir eligible vid fler dagar och ignorerar ogiltiga värden utan att läsa fritext', () => {
		expect(
			getEveningInteriorMemory(['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', 'en tanke'])
		).toEqual({ hasBook: true, hasRug: true });
	});

	it('påverkar inte följeslagarens tekniska ID:n', () => {
		expect(['fox', 'bear', 'wolf'].map(getProgressCompanionArtId)).toEqual(['fox', 'bear', 'wolf']);
	});

	it('introducerar mattan enbart vid den första övergången till eligibility', () => {
		expect(shouldIntroduceEveningInteriorRug(false, true)).toBe(true);
		expect(shouldIntroduceEveningInteriorRug(true, true)).toBe(false);
		expect(shouldIntroduceEveningInteriorRug(false, false)).toBe(false);
	});
});
