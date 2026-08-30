import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Trust Pass V3.1: weekly-summary skickar rå dagbokstext till AI och ska ligga
// bakom serverägt samtycke.
//
// Consent Scope Separation V1: samtycket är numera weekly-summary-eget
// (diary_ai_weekly_summary), inte det scope reflect och checkin-reflection
// använder. Scope-oberoendet bevisas i weekly-summary-scope.test.ts.
//
// Testerna bevisar två saker som är lätta att blanda samman: att leverantören
// inte anropas, och att dagboksinnehållet inte ens läses från databasen när
// samtycke saknas. Det andra är det starkare kravet.

const mocks = vi.hoisted(() => ({
	createServiceClient: vi.fn(),
	createTokenClient: vi.fn(),
	generateAIText: vi.fn(),
	hasWeeklySummaryAiConsent: vi.fn()
}));

vi.mock('$lib/server/supabase-admin', () => ({
	createServiceClient: mocks.createServiceClient,
	createTokenClient: mocks.createTokenClient
}));

vi.mock('$lib/server/weekly-summary-ai-consent', () => ({
	hasWeeklySummaryAiConsent: mocks.hasWeeklySummaryAiConsent
}));

vi.mock('$lib/server/ai/text-generation', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/ai/text-generation')>();
	return { ...actual, generateAIText: mocks.generateAIText };
});

import { POST as weeklySummaryPost } from './weekly-summary/+server';

const DIARY_ROWS = [
	{ date: '2026-08-10', mood: 6, content: 'Tung start på veckan, men jag tog en promenad.' },
	{ date: '2026-08-13', mood: 8, content: 'Bättre i dag. Sov ordentligt.' }
];

/** Spionerar på from('diary') så vi kan se om innehållet lästes alls. */
function tokenClient(user: { id: string; user_metadata?: unknown } | null = { id: 'user-1' }) {
	const order = vi.fn().mockResolvedValue({ data: DIARY_ROWS, error: null });
	const lte = vi.fn(() => ({ order }));
	const gte = vi.fn(() => ({ lte }));
	const eq = vi.fn(() => ({ gte }));
	const select = vi.fn((_columns: string) => ({ eq }));
	// Typad parameter så anropsargumenten går att läsa i assertions nedan.
	const from = vi.fn((_table: string) => ({ select }));

	return {
		auth: {
			getUser: vi.fn().mockResolvedValue({
				data: { user },
				error: user ? null : new Error('invalid token')
			})
		},
		from,
		spies: { from, select, eq, gte, lte, order }
	};
}

function weeklyRequest(headers: HeadersInit = {}) {
	return new Request('http://localhost/api/diary/weekly-summary', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: 'Bearer access-token',
			...headers
		},
		body: JSON.stringify({ startDate: '2026-08-10', endDate: '2026-08-16' })
	});
}

function callWeeklySummary(headers: HeadersInit = {}) {
	return weeklySummaryPost({
		request: weeklyRequest(headers)
	} as unknown as Parameters<typeof weeklySummaryPost>[0]);
}

/** Läste routen dagbokstabellen? */
function readDiaryTable(client: ReturnType<typeof tokenClient>): boolean {
	return client.spies.from.mock.calls.some(([table]) => table === 'diary');
}

function weeklySummarySource(): string {
	return readFileSync(new URL('./weekly-summary/+server.ts', import.meta.url), 'utf8');
}

/**
 * Routens kod utan kommentarer. Kommentarerna förklarar vilket scope och vilken
 * gammal header det handlar om, så en råsökning i hela filen skulle träffa dem
 * i stället för faktisk logik.
 */
function weeklySummaryCode(): string {
	return weeklySummarySource()
		.split('\n')
		.filter((line) => !line.trim().startsWith('//'))
		.join('\n');
}

describe('weekly-summary: serverägt diary AI-samtycke', () => {
	let client: ReturnType<typeof tokenClient>;

	beforeEach(() => {
		mocks.createServiceClient.mockReset();
		mocks.createTokenClient.mockReset();
		mocks.generateAIText.mockReset();
		mocks.hasWeeklySummaryAiConsent.mockReset();

		client = tokenClient();
		mocks.createServiceClient.mockReturnValue({});
		mocks.createTokenClient.mockReturnValue(client);
		mocks.generateAIText.mockResolvedValue({ text: 'En lugnare vecka än den förra.' });
		mocks.hasWeeklySummaryAiConsent.mockResolvedValue(true);
	});

	it('släpper igenom med giltigt serversamtycke och anropar leverantören exakt en gång', async () => {
		const response = await callWeeklySummary();

		expect(response.status).toBe(200);
		expect(mocks.hasWeeklySummaryAiConsent).toHaveBeenCalledTimes(1);
		expect(mocks.hasWeeklySummaryAiConsent).toHaveBeenCalledWith({}, 'user-1');
		expect(mocks.generateAIText).toHaveBeenCalledTimes(1);
		expect(readDiaryTable(client)).toBe(true);
	});

	it('använder samma scope och policyversion som övriga diary AI-endpoints', async () => {
		const consentModule = await import('$lib/server/weekly-summary-ai-consent');
		const code = weeklySummaryCode();

		// Ingen egen tabell, inget eget scope, ingen egen policyversion - routen
		// går helt genom den delade helpern.
		expect(code).toContain("from '$lib/server/weekly-summary-ai-consent'");
		expect(code).toContain('hasWeeklySummaryAiConsent');
		expect(code).not.toContain('user_ai_consents');
		expect(code).not.toMatch(/scope|policy_version|diary-ai-v|diary_ai_reflection/);
		expect(Object.keys(consentModule)).toContain('hasWeeklySummaryAiConsent');
	});

	describe('blockerade lägen', () => {
		// Alla dessa gör hasWeeklySummaryAiConsent falsk. Helpern är fail-closed och
		// returnerar false för saknad row, revoked, stale policyversion och
		// DB-fel, så routen behöver bara ett enda villkor.
		const blockedCases: { name: string; headers?: HeadersInit }[] = [
			{ name: 'saknad consent-row' },
			{ name: 'revoked consent' },
			{ name: 'stale policyversion' },
			{ name: 'DB-fel vid consentläsning' },
			{
				name: 'endast gammal klientheader',
				headers: { 'x-mittpsyke-sensitive-consent': '2026-04-29' }
			}
		];

		for (const testCase of blockedCases) {
			it(`${testCase.name} → 403, ingen leverantör, ingen dagboksläsning`, async () => {
				mocks.hasWeeklySummaryAiConsent.mockResolvedValue(false);

				const response = await callWeeklySummary(testCase.headers);

				expect(response.status).toBe(403);
				expect(mocks.generateAIText).not.toHaveBeenCalled();
				expect(readDiaryTable(client)).toBe(false);
			});
		}

		it('gammalt user_metadata-samtycke räcker inte', async () => {
			mocks.hasWeeklySummaryAiConsent.mockResolvedValue(false);
			client = tokenClient({
				id: 'user-1',
				user_metadata: {
					health_data_processing_consent: {
						accepted: true,
						type: 'health_data_processing',
						policy_version: '2026-04-29',
						timestamp: '2026-08-15T08:00:00.000Z'
					}
				}
			});
			mocks.createTokenClient.mockReturnValue(client);

			const response = await callWeeklySummary();

			expect(response.status).toBe(403);
			expect(mocks.generateAIText).not.toHaveBeenCalled();
			expect(readDiaryTable(client)).toBe(false);
		});

		it('den gamla headern kan aldrig ensam auktorisera weekly-summary', async () => {
			// Routen läser inte längre headern alls.
			const code = weeklySummaryCode();
			expect(code).not.toContain('hasSensitiveConsentHeader');
			expect(code).not.toContain('x-mittpsyke-sensitive-consent');
			expect(code).not.toContain("from '$lib/consent'");

			// Och beteendemässigt: header satt, serversamtycke saknas → 403.
			mocks.hasWeeklySummaryAiConsent.mockResolvedValue(false);
			const response = await callWeeklySummary({
				'x-mittpsyke-sensitive-consent': '2026-04-29'
			});

			expect(response.status).toBe(403);
			expect(mocks.generateAIText).not.toHaveBeenCalled();
		});

		it('saknad service-role stänger routen i stället för att öppna den', async () => {
			mocks.createServiceClient.mockReturnValue(null);

			const response = await callWeeklySummary();

			expect(response.status).toBe(500);
			expect(mocks.hasWeeklySummaryAiConsent).not.toHaveBeenCalled();
			expect(mocks.generateAIText).not.toHaveBeenCalled();
			expect(readDiaryTable(client)).toBe(false);
		});
	});

	describe('återkallande', () => {
		it('tillåtet vid granted, 403 vid nästa anrop efter revoke', async () => {
			const granted = await callWeeklySummary();
			expect(granted.status).toBe(200);
			expect(mocks.generateAIText).toHaveBeenCalledTimes(1);

			// Simulerar att raden återkallats mellan anropen.
			mocks.generateAIText.mockClear();
			client = tokenClient();
			mocks.createTokenClient.mockReturnValue(client);
			mocks.hasWeeklySummaryAiConsent.mockResolvedValue(false);

			const revoked = await callWeeklySummary();

			expect(revoked.status).toBe(403);
			expect(mocks.generateAIText).not.toHaveBeenCalled();
			expect(readDiaryTable(client)).toBe(false);
		});
	});

	describe('ordning i requesten', () => {
		it('avvisar utan Authorization innan samtycke ens prövas', async () => {
			const response = await weeklySummaryPost({
				request: new Request('http://localhost/api/diary/weekly-summary', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ startDate: '2026-08-10', endDate: '2026-08-16' })
				})
			} as unknown as Parameters<typeof weeklySummaryPost>[0]);

			expect(response.status).toBe(401);
			expect(mocks.hasWeeklySummaryAiConsent).not.toHaveBeenCalled();
			expect(mocks.generateAIText).not.toHaveBeenCalled();
		});

		it('avvisar ogiltig token innan samtycke prövas', async () => {
			client = tokenClient(null);
			mocks.createTokenClient.mockReturnValue(client);

			const response = await callWeeklySummary();

			expect(response.status).toBe(401);
			expect(mocks.hasWeeklySummaryAiConsent).not.toHaveBeenCalled();
			expect(readDiaryTable(client)).toBe(false);
		});

		it('samtyckeskontrollen står före dagboksläsningen i källan', () => {
			const code = weeklySummaryCode();
			const consentIndex = code.indexOf('hasWeeklySummaryAiConsent(serviceClient');
			const bodyIndex = code.indexOf('await request.json()');
			const diaryIndex = code.indexOf("from('diary')");

			expect(consentIndex).toBeGreaterThan(-1);
			expect(consentIndex).toBeLessThan(bodyIndex);
			expect(consentIndex).toBeLessThan(diaryIndex);
		});
	});
});

describe('V3.1-avgränsning', () => {
	it('diary/insights använder den deterministiska Framstegsmotorn', () => {
		const endpoint = readFileSync(new URL('./insights/+server.ts', import.meta.url), 'utf8');
		const analysis = readFileSync(
			new URL('../../../lib/server/diary-insight-analysis.ts', import.meta.url),
			'utf8'
		);
		const progressAnalysis = readFileSync(
			new URL('../../../lib/server/progress-analysis.ts', import.meta.url),
			'utf8'
		);

		// Ingen extern AI får användas när den periodvalda analysen räknas fram.
		for (const source of [endpoint, analysis, progressAnalysis]) {
			expect(source).not.toContain('generateAIText');
			expect(source).not.toMatch(/openai|anthropic/i);
		}
		expect(endpoint).toContain('buildProgressAnalysis');
		expect(endpoint).toContain('filterProgressRows');
	});

	it('ingen kvarvarande AI-endpoint under api/diary saknar serversamtycke', async () => {
		const { readdirSync, statSync } = await import('node:fs');
		const { join } = await import('node:path');
		const diaryApiDir = join(process.cwd(), 'src/routes/api/diary');

		const unprotected: string[] = [];
		for (const entry of readdirSync(diaryApiDir)) {
			const endpointPath = join(diaryApiDir, entry, '+server.ts');
			try {
				if (!statSync(endpointPath).isFile()) continue;
			} catch {
				continue;
			}

			const source = readFileSync(endpointPath, 'utf8');
			const callsProvider = source.includes('generateAIText');
			// Vilket scope som gäller skiljer sig mellan endpoints - reflect och
			// checkin-reflection har diary_ai_reflection, weekly-summary sitt eget.
			// Kravet här är att någon serverägd consent-grind finns, inte vilken.
			const hasServerConsent = /has\w*AiConsent\(/.test(source);
			if (callsProvider && !hasServerConsent) unprotected.push(entry);
		}

		expect(unprotected).toEqual([]);
	});
});
