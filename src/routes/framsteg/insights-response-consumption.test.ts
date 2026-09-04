// Kontraktet mellan /api/diary/insights och /framsteg.
//
// Bakgrund: när analysen blev serverlokal och periodmedveten slutade endpointen
// skicka aiSummary, bestDay, worstDay, insights och emotionDistribution. Sidans
// InsightsResponse deklarerade dem ändå, så `insightsData.insights.length` såg
// korrekt ut för typkontrollen men läste `undefined` i körning. SSR klarade sig
// (svaret var null där), och först klientuppdateringen efter laddad analys
// kastade TypeError.
//
// Testerna nedan går åt båda hållen:
//   * sidan får inte läsa något fält som endpointen inte skickar
//   * endpointens verkliga svar måste bära allt analysvyn läser
//
// Ingen rendering sker här. Sidkomponenten drar in hela världs- och
// följeslagarlagret och tar ~25 s att ens importera, vilket vore ett opålitligt
// test. Kontraktet är det som gick sönder, och det är kontraktet som vaktas.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildSupportView } from '$lib/server/diary-support-suggestions';
import {
	buildProgressAnalysis,
	filterProgressRows,
	MIN_THEME_COUNT,
	type ProgressPeriodDays
} from '$lib/server/progress-analysis';
import type { DiaryInsightRow } from '$lib/server/diary-insight-analysis';

const route = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');
const endpoint = readFileSync(
	new URL('../api/diary/insights/+server.ts', import.meta.url),
	'utf8'
);

/** Fälten endpointen faktiskt returnerar, lästa ur `return json({ ... })`. */
const SERVER_FIELDS = ['analysis', 'support'] as const;

/**
 * Fält som togs bort ur svaret. De får aldrig läsas ur svaret igen utan att
 * endpointen först börjar skicka dem.
 */
const REMOVED_RESPONSE_FIELDS = [
	'aiSummary',
	'bestDay',
	'worstDay',
	'emotionDistribution'
] as const;

const NOW = new Date('2026-05-20T09:00:00Z');

function dayBefore(daysAgo: number) {
	const date = new Date(NOW);
	date.setUTCDate(date.getUTCDate() - daysAgo);
	return date.toISOString();
}

/** Ett svar byggt av samma pipeline som endpointen kör. */
function buildResponse(rows: DiaryInsightRow[], period: ProgressPeriodDays = 30) {
	return {
		analysis: buildProgressAnalysis(rows, period, NOW, { truncated: false }),
		support: buildSupportView(filterProgressRows(rows, period, NOW))
	};
}

describe('svarsformen från /api/diary/insights', () => {
	it('returnerar exakt analysis och support', () => {
		expect(endpoint).toContain('return json({\n\t\t\tanalysis,\n\t\t\tsupport\n\t\t});');
		for (const field of REMOVED_RESPONSE_FIELDS) {
			expect(endpoint).not.toContain(`${field}:`);
		}
	});

	it('deklareras på klienten utan fält som servern inte skickar', () => {
		const declaration = route.slice(
			route.indexOf('interface InsightsResponse {'),
			route.indexOf('interface ProgressInsight {')
		);

		expect(declaration).toContain('analysis: ProgressAnalysisResponse;');
		expect(declaration).toContain('support?: SupportView | null;');

		const declaredFields = [...declaration.matchAll(/^\t\t(\w+)\??:/gm)].map(
			(match) => match[1]
		);
		expect(declaredFields.sort()).toEqual([...SERVER_FIELDS].sort());
	});

	it('läses på klienten utan borttagna fält', () => {
		// Egenskapsåtkomst, inte varje förekomst av ordet: kommentaren i
		// InsightsResponse nämner fälten med flit, för att förklara varför de är
		// borta. `.fält` täcker både `svar.fält` och `svar?.fält`.
		for (const field of REMOVED_RESPONSE_FIELDS) {
			expect(route).not.toMatch(new RegExp(`\\.${field}\\b`));
		}
		// Den kastande raden och dess härledningar ska vara borta, inte lagade
		// med optional chaining - kortet de bar kan ändå aldrig få innehåll.
		expect(route).not.toContain('hasInsightsContent');
		expect(route).not.toContain('insightsData');
		expect(route).not.toContain('shouldShowInsights');
	});

	it('läser support ur det laddade svaret, inte ur en mellanliggande fallback', () => {
		expect(route).toContain(
			'const supportView = $derived(loadedInsightsData?.support ?? EMPTY_SUPPORT_VIEW);'
		);
	});
});

describe('analysvyn mot verkliga svar', () => {
	/** Allt sidan läser ur analysis, i den ordning mallen rör det. */
	function assertAnalysisIsRenderable(analysis: ReturnType<typeof buildProgressAnalysis>) {
		expect(Array.isArray(analysis.insights)).toBe(true);
		expect(Array.isArray(analysis.halfYearSummary)).toBe(true);
		expect(Array.isArray(analysis.monthly)).toBe(true);
		expect(typeof analysis.coverage.truncated).toBe('boolean');
		expect(typeof analysis.coverage.entryCount).toBe('number');
		expect(typeof analysis.coverage.textEntryCount).toBe('number');
		expect(Array.isArray(analysis.coverage.sparsePeriods)).toBe(true);
		expect(typeof analysis.moodSummary.entryCount).toBe('number');
		// primaryInsight och remainingInsights indexerar direkt i listan.
		expect(analysis.insights.slice(1)).toBeInstanceOf(Array);
	}

	it('bär allt mallen läser när användaren inte har sparat något', () => {
		const response = buildResponse([]);

		assertAnalysisIsRenderable(response.analysis);
		expect(response.analysis.insights).toHaveLength(0);
		expect(response.analysis.coverage.entryCount).toBe(0);
		// Tomt läge, inte undanhållet läge: kortet ska visas med sin lugna text.
		expect(response.support.withheldForSafety).toBe(false);
	});

	it('bär allt mallen läser vid tunt underlag', () => {
		const response = buildResponse([
			{ created_at: dayBefore(3), mood: 6, text: 'Lite trött idag.', tags: null },
			{ created_at: dayBefore(1), mood: 7, text: 'Bättre än igår.', tags: null }
		]);

		assertAnalysisIsRenderable(response.analysis);
		// Under varje tröskel: inga påhittade mönster, men full täckningsdata.
		expect(response.analysis.insights).toHaveLength(0);
		expect(response.analysis.coverage.entryCount).toBe(2);
		expect(response.analysis.coverage.textEntryCount).toBe(2);
	});

	it('ger ett primärt kort med evidens när underlaget räcker', () => {
		const rows: DiaryInsightRow[] = Array.from({ length: MIN_THEME_COUNT }, (_, index) => ({
			created_at: dayBefore(index + 1),
			mood: null,
			text: 'Sov dåligt igen, vaken halva natten.',
			tags: null
		}));
		const response = buildResponse(rows);

		assertAnalysisIsRenderable(response.analysis);
		const primaryInsight = response.analysis.insights[0];
		expect(primaryInsight).toBeDefined();
		// Mallen renderar title, description och evidence utan fallback.
		expect(primaryInsight.title).toBeTruthy();
		expect(primaryInsight.description).toBeTruthy();
		expect(primaryInsight.evidence).toBeTruthy();
		expect(primaryInsight.id).toBeTruthy();
	});

	it('bär halvårsvyns månadsblock när perioden är 180 dagar', () => {
		const rows: DiaryInsightRow[] = Array.from({ length: 40 }, (_, index) => ({
			created_at: dayBefore(index * 4),
			mood: 4 + (index % 5),
			text: 'Mycket att hinna med på jobbet.',
			tags: null
		}));
		const response = buildResponse(rows, 180);

		assertAnalysisIsRenderable(response.analysis);
		expect(response.analysis.monthly.length).toBeGreaterThan(0);
		for (const month of response.analysis.monthly) {
			expect(['sufficient', 'thin', 'missing']).toContain(month.status);
			expect(typeof month.entryCount).toBe('number');
		}
	});
});

describe('samtyckesspärren på framsteg', () => {
	it('hämtar aldrig analysen utan samtycke', () => {
		const guard = route.slice(
			route.indexOf('function maybeLoadInsights()'),
			route.indexOf('void loadInsights();', route.indexOf('function maybeLoadInsights()'))
		);

		expect(guard).toContain('!hasSensitiveDataConsent');
		expect(guard).toContain('!insightsVisible');
	});

	it('visar samtyckesgrinden i stället för analysen, och bara en gång', () => {
		expect(route).toContain('{#if !isAnonymous && !hasSensitiveDataConsent}');
		// Efter borttaget legacy-kort finns exakt en ConsentGate på sidan.
		expect(route.match(/<ConsentGate/g)).toHaveLength(1);
	});

	it('skickar samtyckesheadern när analysen väl hämtas', () => {
		expect(route).toContain('[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION');
		expect(endpoint).toContain('hasSensitiveConsentHeader(request)');
	});
});
