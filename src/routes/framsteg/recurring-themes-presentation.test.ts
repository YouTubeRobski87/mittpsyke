// Presentationen av "Det som börjar synas i dina anteckningar".
//
// Kortet renderas på riktigt (svelte/server) med syntetiska anteckningar, så
// att det som kontrolleras är det användaren faktiskt ser. Sidans ordning,
// samtycke och dataflöden kontrolleras i sidans egen källkod, eftersom sidan
// inte går att serverrendera som inloggad.

import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import RecurringThemesCard from '$lib/components/progress/RecurringThemesCard.svelte';
import { RECURRING_THEME_THRESHOLD_COPY, type RecurringTheme } from '$lib/progress-recurring-themes';
import { findForbiddenProgressPhrase } from '$lib/progress-language';
import { GET } from '../api/diary/insights/+server';

const route = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');
const cardSource = readFileSync(
	new URL('../../lib/components/progress/RecurringThemesCard.svelte', import.meta.url),
	'utf8'
);

const INJECTED = '<img src=x onerror="alert(1)"><script>alert(2)</script> sov dåligt';

function theme(overrides: Partial<RecurringTheme> = {}): RecurringTheme {
	return {
		id: 'Sömn',
		label: 'Sömn',
		count: 3,
		textEntryCount: 5,
		weekCount: 3,
		firstHalfCount: 1,
		secondHalfCount: 2,
		firstDate: '2026-07-21',
		lastDate: '2026-08-06',
		firstDateLabel: '21 juli 2026',
		lastDateLabel: '6 augusti 2026',
		evidence: [
			{ entryId: 's3', date: '2026-08-06', dateLabel: '6 augusti 2026', excerpt: 'Somnade tidigt för en gångs skull.' },
			{ entryId: 's2', date: '2026-07-29', dateLabel: '29 juli 2026', excerpt: INJECTED },
			{ entryId: 's1', date: '2026-07-21', dateLabel: '21 juli 2026', excerpt: null }
		],
		...overrides
	};
}

function visibleText(html: string) {
	return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const body = render(RecurringThemesCard, {
	props: { themes: [theme()], periodLabel: 'den senaste månaden' }
}).body;

describe('kortet med återkommande teman', () => {
	it('har en rubrik som inte påstår vad som är viktigast', () => {
		expect(body).toContain('Det som börjar synas i dina anteckningar');
		expect(body).not.toMatch(/viktigast/i);
	});

	it('visar temanamn, antal anteckningar och tidsperiod', () => {
		const text = visibleText(body);
		expect(text).toContain('Sömn');
		expect(text).toContain('Finns i 3 av 5 anteckningar med text, spritt över 3 veckor.');
		expect(text).toContain('Från 21 juli 2026 till 6 augusti 2026.');
	});

	it('visar ordagranna utdrag med datum, och hoppar över anteckningar utan utdrag', () => {
		expect(body).toMatch(/<blockquote[^>]*>Somnade tidigt för en gångs skull\.<\/blockquote>/);
		expect(body).toMatch(/<time datetime="2026-08-06"[^>]*>6 augusti 2026<\/time>/);
		// Anteckningen utan utdrag visas inte som ett tomt citat.
		expect(body).not.toMatch(/<blockquote[^>]*><\/blockquote>/);
	});

	it('renderar injicerad HTML i ett utdrag som text, aldrig som element', () => {
		expect(body).not.toContain('<script>alert(2)</script>');
		expect(body).not.toMatch(/<img[^>]*onerror/i);
		expect(body).toContain('&lt;img src=x onerror="alert(1)">&lt;script>alert(2)&lt;/script> sov dåligt');
		expect(cardSource).not.toContain('{@html');
	});

	it('har en tydlig väg till underlaget', () => {
		expect(body).toContain('Vad bygger det här på?');
		expect(body).toContain('aria-expanded="false"');
	});

	it('visar alla teman den får, i den ordning servern skickat dem', () => {
		const three = render(RecurringThemesCard, {
			props: {
				themes: [theme({ id: 'Arbete', label: 'Arbete' }), theme(), theme({ id: 'Natur', label: 'Natur' })],
				periodLabel: 'de senaste tre månaderna'
			}
		}).body;
		const headings = [...three.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((match) => match[1]);
		expect(headings).toEqual(['Arbete', 'Sömn', 'Natur']);
	});

	it('använder observerande språk utan diagnos, identitet eller orsak', () => {
		// Användarens egna citat granskas inte; bara kortets egen text.
		const ownText = visibleText(
			render(RecurringThemesCard, {
				props: { themes: [theme({ evidence: [] })], periodLabel: 'den senaste månaden' }
			}).body
		);
		expect(findForbiddenProgressPhrase(ownText)).toBeNull();
		expect(ownText).toContain('Det finns inget att hålla igång.');
	});
});

describe('kortets dataflöde', () => {
	it('skickar inga utdrag vidare: inga anrop, ingen spårning, ingen text i länkar', () => {
		expect(cardSource).not.toMatch(/fetch\(|gtag|track[A-Z]|sendBeacon|localStorage|sessionStorage/);
		// Den enda länken är fast och bär varken text, datum eller id.
		const hrefs = [...cardSource.matchAll(/href=("[^"]*"|\{[^}]*\})/g)].map((match) => match[1]);
		expect(hrefs).toEqual(['"/dagbok"']);
	});

	it('spårar bara antal insikter, aldrig teman eller utdrag', () => {
		const tracking = route.slice(route.indexOf('trackInsightOpened({'), route.indexOf('});', route.indexOf('trackInsightOpened({')));
		expect(tracking).toContain("insight_type: 'diary_insights'");
		expect(tracking).not.toMatch(/recurringThemes|evidence|excerpt|label|themes/);
	});

	it('kräver samtycke till känsliga uppgifter innan analysen läses', async () => {
		const request = new Request('http://localhost/api/diary/insights?period=30', {
			headers: { authorization: 'Bearer syntetisk-token' }
		});
		const event = { request, url: new URL(request.url) } as unknown as Parameters<typeof GET>[0];
		const response = await GET(event);
		expect(response.status).toBe(403);
	});
});

describe('Framstegs ordning med egna ord först', () => {
	const main = route.slice(route.indexOf('<div class="framsteg-layout framsteg-layout-v2">'));

	it('visar temana efter den lugna överblicken och före humörkurvan och analysen', () => {
		const intro = main.indexOf('data-testid="week-summary"');
		const themes = main.indexOf('data-testid="recurring-themes"');
		const moodHistory = main.indexOf('data-testid="mood-history"');
		const analysis = main.indexOf('data-testid="mood-analysis"');
		const lighterDays = main.indexOf('data-testid="lighter-days"');

		expect(intro).toBeGreaterThan(-1);
		expect(themes).toBeGreaterThan(intro);
		expect(moodHistory).toBeGreaterThan(themes);
		expect(analysis).toBeGreaterThan(moodHistory);
		expect(lighterDays).toBeGreaterThan(analysis);
	});

	it('visar temakortet bara inloggad, med samtycke och när servern skickat teman', () => {
		const condition = route.slice(
			route.indexOf('const showRecurringThemes = $derived('),
			route.indexOf(');', route.indexOf('const showRecurringThemes = $derived('))
		);
		expect(condition).toContain('!isAnonymous');
		expect(condition).toContain('hasSensitiveDataConsent');
		expect(condition).toContain('!insightsError');
		expect(condition).toContain('recurringThemes.length > 0');
		expect(main).toContain('{#if showRecurringThemes && progressAnalysis}');
	});

	it('räknar teman som konkret underlag, så lågdataläget inte visas samtidigt', () => {
		const concrete = route.slice(
			route.indexOf('const hasConcretePersonalAnalysis = $derived('),
			route.indexOf(');', route.indexOf('const hasConcretePersonalAnalysis = $derived('))
		);
		expect(concrete).toContain('recurringThemes.length > 0');
	});

	it('förklarar lugnt i lågdataläget när teman kan börja synas', () => {
		const lowData = route.slice(
			route.indexOf('<section class="card low-data-overview"'),
			route.indexOf('</section>', route.indexOf('<section class="card low-data-overview"'))
		);
		expect(lowData).toContain('{RECURRING_THEME_THRESHOLD_COPY}');
		expect(RECURRING_THEME_THRESHOLD_COPY).toContain('Du behöver inte skriva varje dag.');
	});

	it('behåller periodvalen och humöranalysen', () => {
		expect(route).toContain('/api/diary/insights?period=${requestedPeriod}');
		expect(main).toContain('data-testid="mood-history"');
		expect(main).toContain('<h2 id="analysis-heading">Humör och mönster över tid</h2>');
		expect(main).toContain('<h3 id="primary-insight-heading">Det som syns tydligast i perioden</h3>');
	});
});
