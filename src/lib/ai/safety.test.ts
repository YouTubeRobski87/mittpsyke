import { describe, it, expect } from 'vitest';
import { containsCrisisSignal } from './safety';

describe('containsCrisisSignal', () => {
	describe('returns false for safe inputs', () => {
		it('returns false for empty string', () => {
			expect(containsCrisisSignal('')).toBe(false);
		});

		it('returns false for normal everyday text', () => {
			expect(containsCrisisSignal('Jag är lite trött idag')).toBe(false);
			expect(containsCrisisSignal('Det har varit en lång vecka')).toBe(false);
			expect(containsCrisisSignal('Jag känner mig orolig inför provet')).toBe(false);
		});

		it('returns false for partial word matches that are not crisis signals', () => {
			// "orkar" appears in signals but alone should not match
			expect(containsCrisisSignal('Jag orkar inte städa idag')).toBe(false);
		});
	});

	describe('detects direct crisis signals', () => {
		it('detects "vill inte leva"', () => {
			expect(containsCrisisSignal('Jag vill inte leva längre')).toBe(true);
		});

		it('detects "självmord"', () => {
			expect(containsCrisisSignal('Jag tänker på självmord')).toBe(true);
		});

		it('detects "suicid"', () => {
			expect(containsCrisisSignal('suicid är det enda jag tänker på')).toBe(true);
		});

		it('detects "vill dö"', () => {
			expect(containsCrisisSignal('Jag vill dö')).toBe(true);
		});

		it('detects "ta mitt liv"', () => {
			expect(containsCrisisSignal('Jag vill ta mitt liv')).toBe(true);
		});

		it('detects "självskad"', () => {
			expect(containsCrisisSignal('Jag tänker på självskada')).toBe(true);
		});

		it('detects "skada mig själv"', () => {
			expect(containsCrisisSignal('Jag vill skada mig själv')).toBe(true);
		});

		it('detects "orkar inte leva"', () => {
			expect(containsCrisisSignal('Jag orkar inte leva')).toBe(true);
		});

		it('detects "avskedsbrev"', () => {
			expect(containsCrisisSignal('Jag har skrivit ett avskedsbrev')).toBe(true);
		});

		it('detects "ta överdos"', () => {
			expect(containsCrisisSignal('Jag funderar på att ta överdos')).toBe(true);
		});

		it('detects "sista utvägen"', () => {
			expect(containsCrisisSignal('Det känns som sista utvägen')).toBe(true);
		});

		it('detects "alla vore bättre utan mig"', () => {
			expect(containsCrisisSignal('Jag tror att alla vore bättre utan mig')).toBe(true);
		});
	});

	describe('is case-insensitive', () => {
		it('detects uppercase version of signal', () => {
			expect(containsCrisisSignal('SJÄLVMORD')).toBe(true);
		});

		it('detects mixed-case version of signal', () => {
			expect(containsCrisisSignal('Jag Vill Dö')).toBe(true);
		});
	});

	describe('handles whitespace normalization', () => {
		it('detects signal with extra spaces', () => {
			expect(containsCrisisSignal('jag  vill   dö')).toBe(true);
		});

		it('detects signal with leading/trailing whitespace', () => {
			expect(containsCrisisSignal('  vill inte leva  ')).toBe(true);
		});
	});

	describe('detects signals embedded in longer text', () => {
		it('finds signal mid-sentence', () => {
			expect(
				containsCrisisSignal(
					'Jag vet inte vad jag ska göra, ibland känner jag att jag vill försvinna för alltid'
				)
			).toBe(true);
		});

		it('finds signal in a multi-sentence message', () => {
			expect(
				containsCrisisSignal(
					'Det har gått bra idag. Men på kvällen tänker jag på att göra slut på allt.'
				)
			).toBe(true);
		});
	});
});
