import { describe, expect, it } from 'vitest';
import { dataflowCopy } from '$lib/dataflow-copy';
import { seoSupportPages } from './seo-support-pages';

const LANDING_KEY = 'chatta-anonymt';

// Fälten som driver landningsvarianten. Om någon av dem läcker ut till en
// annan stödsida ändras den sidans layout, vilket V1 uttryckligen inte ska göra.
const LANDING_ONLY_FIELDS = [
	'variant',
	'eyebrow',
	'trustPoints',
	'ctaNote',
	'howItWorksTitle',
	'howItWorks',
	'safetyNote',
	'resourceLayout'
] as const;

describe('landningsvarianten för /chatta-anonymt', () => {
	const config = seoSupportPages[LANDING_KEY];

	it('är den enda sidan som väljer in landningslayouten', () => {
		for (const [key, page] of Object.entries(seoSupportPages)) {
			if (key === LANDING_KEY) continue;

			for (const field of LANDING_ONLY_FIELDS) {
				expect(
					page[field],
					`${key} ska rendera oförändrat och får därför inte sätta "${field}"`
				).toBeUndefined();
			}
		}
	});

	it('leder besökaren till chatten', () => {
		expect(config.primaryCta.href).toBe('/chat');
		expect(config.primaryCta.label).toBe('Börja skriva');
	});

	it('hämtar AI- och lagringsstegen ur den verifierade dataflödescopyn', () => {
		const bodies = (config.howItWorks ?? []).map((step) => step.body);

		// Steg 2 och 3 får aldrig skrivas om för hand. De speglar gästflödet i
		// api/chat/+server.ts och ska ändras först när dataflödet ändras.
		expect(bodies).toContain(dataflowCopy.guestChat.aiTransfer);
		expect(bodies).toContain(dataflowCopy.guestChat.retention);
	});

	it('nämner att meddelandet skickas vidare för att skapa svaret', () => {
		const bodies = (config.howItWorks ?? []).map((step) => step.body).join(' ');

		expect(bodies).toContain('OpenAI');
	});

	it('formulerar lagringspåståenden med MittPsyke som subjekt', () => {
		const claims = [
			...(config.trustPoints ?? []).flatMap((point) => [point.label, point.body]),
			...(config.howItWorks ?? []).map((step) => step.body),
			config.lead
		];

		for (const claim of claims) {
			// "Inget sparas" och liknande vore en överdrift: meddelandet skickas
			// till OpenAI för att svaret ska kunna skapas.
			expect(claim).not.toMatch(/inget sparas/i);
			expect(claim).not.toMatch(/ingen (kan )?(ser|läser)/i);
			expect(claim).not.toMatch(/helt privat|aldrig lämnar|stannar hos oss/i);
		}

		const storageClaim = (config.trustPoints ?? []).find((point) =>
			/sparar inte/i.test(point.label)
		);

		expect(storageClaim?.label).toBe('MittPsyke sparar inte gästchatten');
	});

	it('lovar inte vård, terapi eller mänsklig kontakt', () => {
		const surface = [
			config.h1,
			config.lead,
			config.eyebrow ?? '',
			config.ctaNote ?? '',
			...(config.trustPoints ?? []).flatMap((point) => [point.label, point.body])
		].join(' ');

		expect(surface).not.toMatch(/terapeut|behandling|psykolog|vi finns alltid/i);
	});

	it('behåller de interna länkmålen från SEO-baselinen', () => {
		const targets = [
			config.primaryCta.href,
			...config.resourceListItems.map((item) => item.href),
			...config.nextStepLinks.map((link) => link.href)
		];

		for (const expected of [
			'/chat',
			'/prata-anonymt-online',
			'/anonymt-samtalstod-online',
			'/chatta-anonymt-med-nagon',
			'/blogg/chatta-anonymt-utan-konto',
			'/anonym-dagbok-online',
			'/dagbok',
			'/skriv',
			'/om-mittpsyke'
		]) {
			expect(targets).toContain(expected);
		}
	});

	it('behåller metadata och FAQ-schemat från baselinen', () => {
		expect(config.title).toBe('Chatta anonymt utan konto – börja direkt | MittPsyke');
		expect(config.canonical).toBe('https://mittpsyke.se/chatta-anonymt');
		expect(config.faqSchema).toBe(true);
		expect(config.faq).toHaveLength(3);
		expect(config.faq[0].question).toBe('Kan jag chatta anonymt utan konto?');
	});
});
