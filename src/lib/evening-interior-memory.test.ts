import { describe, expect, it } from 'vitest';
import { isEveningInteriorMemoryEligible } from './evening-interior-memory';

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
});
