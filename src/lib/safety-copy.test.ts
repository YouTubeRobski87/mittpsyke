import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CRISIS_RESPONSE, THIRD_PARTY_RISK_RESPONSE } from '$lib/ai/crisis-responses';
import { GENERAL_SAFETY_COPY } from './safety-copy';

const consentGate = readFileSync(new URL('./components/ConsentGate.svelte', import.meta.url), 'utf8');
const healthConsent = readFileSync(new URL('./components/HealthConsent.svelte', import.meta.url), 'utf8');
const homeSafetyStrip = readFileSync(new URL('./components/HomeSafetyStrip.svelte', import.meta.url), 'utf8');
const chatPage = readFileSync(new URL('./components/ChatPage.svelte', import.meta.url), 'utf8');
const chatWindow = readFileSync(new URL('./components/ChatWindow.svelte', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../routes/+layout.svelte', import.meta.url), 'utf8');

describe('generell trygghetscopy', () => {
	it('har en lugn och tydlig gräns för MittPsykes roll', () => {
		expect(GENERAL_SAFETY_COPY).toBe(
			'MittPsyke är ett stöd för reflektion i egen takt. Det ersätter inte vård eller behandling.'
		);
	});

	it('återanvänder samma källa i de avgränsade känsliga ytorna', () => {
		for (const source of [consentGate, healthConsent, layout]) {
			expect(source).toContain("import { GENERAL_SAFETY_COPY } from '$lib/safety-copy';");
			expect(source).toContain('{GENERAL_SAFETY_COPY}');
		}
	});

	it('lämnar tidigare generella dubbletter borta från de ersatta ytorna', () => {
		expect(consentGate).not.toContain('MittPsyke är ett stöd i egen takt, inte vård.');
		expect(healthConsent).not.toContain('MittPsyke är ett stöd i egen takt, inte vård.');
		expect(chatPage).not.toContain('MittPsyke är ett stödverktyg och ersätter inte vård eller behandling.');
		expect(layout).not.toContain('MittPsyke ersätter inte vård. Vid akut fara ring 112');
	});
});

describe('akut- och säkerhetscopy', () => {
	it('håller det uttryckliga hälsosamtycket i chatten, inte i en ruta framför den', () => {
		// Chatten renderas direkt - ingen helskärmsgrind före ChatWindow.
		expect(chatPage).toContain('<ChatWindow');
		expect(chatPage).not.toContain('HealthConsent');
		expect(chatPage).not.toMatch(/\{#if !hasConsent\}/);

		// Samtycket är kvar, men som ett enda beslut ovanför skrivfältet, och
		// det kräver fortfarande en aktiv kryssruta innan knappen går att trycka på.
		expect(chatWindow).toContain('<ConsentGate');
		expect(chatWindow).toContain('requireExplicitConfirmation');
		expect(chatWindow).toContain('showEmergencyGuidance');
		expect(consentGate).toContain('requireExplicitConfirmation');
		expect(consentGate).toContain('disabled={submitting || !canAccept}');
		expect(consentGate).toContain('href="tel:112"');
		expect(consentGate).toContain('https://www.1177.se');
	});

	it('behåller 112 och 1177 i den globala akutvägledningen', () => {
		expect(layout).toContain('href="tel:112"');
		expect(layout).toContain('https://www.1177.se');
		expect(healthConsent).toContain('href="tel:112"');
		expect(healthConsent).toContain('https://www.1177.se');
		expect(layout).toContain('Vid akut fara ring 112');
		expect(homeSafetyStrip).toContain('Ring 112');
		expect(homeSafetyStrip).toContain('1177');
		expect(homeSafetyStrip).not.toContain('GENERAL_SAFETY_COPY');
	});

	it('behåller de separata krissvaren oförändrat användbara', () => {
		for (const response of [CRISIS_RESPONSE, THIRD_PARTY_RISK_RESPONSE]) {
			expect(response).toContain('112');
			expect(response).toContain('1177');
		}
	});
});
