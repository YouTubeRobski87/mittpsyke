import { describe, expect, it } from 'vitest';
import { detectReassurancePattern } from './reassurance-pattern';

const assistant = 'Jag hör att det här känns oroande.';

describe('detectReassurancePattern', () => {
	it('aktiveras för nästan identiska svenska bekräftelsefrågor flera gånger', () => {
		const result = detectReassurancePattern('Är du säker på att jag är säker?', [
			{ role: 'user', content: 'Är jag säker?' },
			{ role: 'assistant', content: assistant },
			{ role: 'user', content: 'Kan du säga att jag verkligen är säker?' },
			{ role: 'assistant', content: assistant }
		]);

		expect(result).toMatchObject({ detected: true, confidence: 'high' });
	});

	it('kan aktiveras när samma oro formuleras om utan ny information', () => {
		const result = detectReassurancePattern('Kan du lova att paniken inte är farlig?', [
			{ role: 'user', content: 'Är paniken farlig?' },
			{ role: 'assistant', content: assistant },
			{ role: 'user', content: 'Är du säker på att paniken är trygg?' },
			{ role: 'assistant', content: assistant }
		]);

		expect(result.detected).toBe(true);
	});

	it('aktiveras inte när användaren tillför viktig ny information', () => {
		const result = detectReassurancePattern('Nu har jag fått bröstsmärta också, är det farligt?', [
			{ role: 'user', content: 'Är paniken farlig?' },
			{ role: 'assistant', content: assistant },
			{ role: 'user', content: 'Kan du lova att paniken inte är farlig?' }
		]);

		expect(result.detected).toBe(false);
	});

	it('aktiveras inte när användaren ber om en djupare förklaring', () => {
		const result = detectReassurancePattern('Varför känns paniken så farlig i kroppen?', [
			{ role: 'user', content: 'Är paniken farlig?' },
			{ role: 'assistant', content: assistant },
			{ role: 'user', content: 'Kan du lova att paniken inte är farlig?' }
		]);

		expect(result.detected).toBe(false);
	});

	it('aktiveras inte när ord överlappar men avsikten skiljer sig', () => {
		const result = detectReassurancePattern('Kan du lova att hjälpa mig att förbereda intervjun?', [
			{ role: 'user', content: 'Är jag säker hemma i kväll?' },
			{ role: 'assistant', content: assistant },
			{ role: 'user', content: 'Kan du säga att jag är säker?' }
		]);

		expect(result.detected).toBe(false);
	});

	it('aktiveras inte med för kort historik', () => {
		const result = detectReassurancePattern('Kan du lova att allt går bra?', [
			{ role: 'user', content: 'Är jag säker?' },
			{ role: 'assistant', content: assistant }
		]);

		expect(result.detected).toBe(false);
	});
});
