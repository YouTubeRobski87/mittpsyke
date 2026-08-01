import { describe, expect, it } from 'vitest';
import { CRISIS_RESPONSE, THIRD_PARTY_RISK_RESPONSE } from './crisis-responses';

const responses = [
	['akut kris', CRISIS_RESPONSE],
	['risk för tredje part', THIRD_PARTY_RISK_RESPONSE]
] as const;

describe('säkerhetssvar', () => {
	// ChatWindow renderar meddelanden rad för rad utan markdown-parser. Allt
	// formateringstecken som hamnar här visas bokstavligt för en användare i
	// kris. Texterna innehöll tidigare **fetstil** runt telefonnumren.
	it.each(responses)('%s innehåller ingen markdown', (_namn, text) => {
		expect(text).not.toContain('**');
		expect(text).not.toContain('__');
		expect(text).not.toMatch(/^#{1,6}\s/m);
		expect(text).not.toMatch(/^\s*[-*+]\s/m);
		expect(text).not.toMatch(/\[.+\]\(.+\)/);
	});

	it.each(responses)('%s är inte tomt och nämner 112', (_namn, text) => {
		expect(text.trim().length).toBeGreaterThan(80);
		expect(text).toContain('112');
	});

	it('hänvisar till Mind och 1177 vid akut kris', () => {
		expect(CRISIS_RESPONSE).toContain('90101');
		expect(CRISIS_RESPONSE).toContain('1177');
		expect(CRISIS_RESPONSE).toContain('Stödlinjer.se');
	});

	it('hänvisar till 1177 vid risk för någon annan', () => {
		expect(THIRD_PARTY_RISK_RESPONSE).toContain('1177');
	});

	it('lämnar dörren öppen i stället för att avsluta samtalet', () => {
		for (const [, text] of responses) {
			expect(text).toContain('Jag finns kvar här');
		}
	});
});
