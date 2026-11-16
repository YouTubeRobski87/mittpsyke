import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';
import { getSummarySnapshotId } from '$lib/progress-summary-request';
import type { LighterDaysView } from '$lib/progress-lighter-days-types';
import { POST } from './+server';

const mocks = vi.hoisted(() => ({
	user: vi.fn(),
	consent: vi.fn(),
	rows: vi.fn(),
	view: vi.fn(),
	generate: vi.fn()
}));

vi.mock('$lib/server/supabase-admin', () => ({
	createTokenClient: () => ({ auth: { getUser: mocks.user } }),
	createServiceClient: () => ({})
}));
vi.mock('$lib/server/diary-ai-consent', () => ({ hasDiaryAiConsent: mocks.consent }));
vi.mock('$lib/server/ai/text-generation', () => ({ generateAIText: mocks.generate }));
vi.mock('$lib/server/progress-lighter-days', () => ({ buildLighterDaysView: mocks.view }));
vi.mock('$lib/server/progress-rows', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/server/progress-rows')>()),
	loadProgressRows: mocks.rows
}));

const view: LighterDaysView = {
	periodDays: 30,
	relevantEntryCount: 10,
	higherEntryCount: 4,
	medianMood: 5,
	lowConfidence: false,
	basis: '10 inlägg',
	hiddenThemes: [],
	themes: [{
		id: 'Sömn', label: 'Sömn', renamed: false, count: 3, base: 4, otherCount: 1, otherBase: 6,
		weekCount: 2, note: 'Sömn fanns med i 3 av 4.', comparison: 'I övriga inlägg: 1 av 6.',
		evidence: [{
			entryId: 'entry-1', date: '2026-06-01', dateLabel: '1 juni', mood: 8,
			excerpt: 'Jag sov länge i går.'
		}]
	}]
};

async function summarize(snapshot = view, { authenticated = true, sensitiveConsent = true } = {}) {
	const headers = new Headers({ 'Content-Type': 'application/json' });
	if (authenticated) headers.set('Authorization', 'Bearer test-token');
	if (sensitiveConsent) headers.set(SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION);
	return POST({
		request: new Request('http://localhost/api/diary/insights/summary', {
			method: 'POST',
			headers,
			body: JSON.stringify({ period: snapshot.periodDays, snapshotId: await getSummarySnapshotId(snapshot) })
		})
	} as Parameters<typeof POST>[0]);
}

beforeEach(() => {
	vi.resetAllMocks();
	mocks.user.mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null });
	mocks.consent.mockResolvedValue(true);
	mocks.rows.mockResolvedValue({ rows: [], truncated: false, error: null });
	mocks.view.mockReturnValue(view);
	mocks.generate.mockResolvedValue({ text: '{"factIds":[1]}' });
});

describe('Framstegs sammanfattningsendpoint', () => {
	it('behåller inloggnings- och samtyckeskrav före läsning av dagboken', async () => {
		expect((await summarize(view, { sensitiveConsent: false })).status).toBe(403);
		expect((await summarize(view, { authenticated: false })).status).toBe(401);
		mocks.consent.mockResolvedValue(false);
		const denied = await summarize();
		expect(denied.status).toBe(403);
		expect(await denied.json()).toMatchObject({ reason: 'ai-consent' });
		expect(mocks.rows).not.toHaveBeenCalled();
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it('avvisar en tidigare vy när serverns temainställningar har ändrats', async () => {
		mocks.view.mockReturnValue({ ...view, themes: [], hiddenThemes: [{ id: 'Sömn', label: 'Sömn' }] });
		expect((await summarize()).status).toBe(409);
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it('hoppar över modellen vid tomt, tunt eller avkortat underlag', async () => {
		const thin = { ...view, lowConfidence: true, relevantEntryCount: 4 };
		mocks.view.mockReturnValue(thin);
		expect(await (await summarize(thin)).json()).toEqual({ statements: [], reason: 'insufficient-data' });
		const empty = { ...view, themes: [] };
		mocks.view.mockReturnValue(empty);
		expect(await (await summarize(empty)).json()).toEqual({ statements: [], reason: 'no-sources' });
		mocks.view.mockReturnValue(view);
		mocks.rows.mockResolvedValue({ rows: [], truncated: true, error: null });
		expect(await (await summarize()).json()).toEqual({ statements: [], reason: 'insufficient-data' });
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it('returnerar serverns verifierbara text och dess källor vid ett giltigt urval', async () => {
		const response = await summarize();
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			statements: [{ text: 'Sömn fanns med i 3 av 4. I övriga inlägg: 1 av 6.', sources: [{ entryId: 'entry-1' }] }],
			reason: null
		});
		expect(mocks.generate).toHaveBeenCalledTimes(1);
	});
});
