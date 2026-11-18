import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';
import { getLighterDaysSummaryView, getSummarySnapshotId } from '$lib/progress-summary-request';
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
		}, {
			entryId: 'entry-2', date: '2026-06-10', dateLabel: '10 juni', mood: 8,
			excerpt: 'I natt vaknade jag flera gånger.'
		}]
	}]
};

view.helpfulPatterns = { ready: true, themes: view.themes };
const visibleSnapshot = getLighterDaysSummaryView(view, false, 'Sömn')!;

async function summarize(snapshot = visibleSnapshot, { authenticated = true, sensitiveConsent = true } = {}) {
	const headers = new Headers({ 'Content-Type': 'application/json' });
	if (authenticated) headers.set('Authorization', 'Bearer test-token');
	if (sensitiveConsent) headers.set(SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION);
	return POST({
		request: new Request('http://localhost/api/diary/insights/summary', {
			method: 'POST',
			headers,
			body: JSON.stringify({ period: snapshot.periodDays, themeId: snapshot.themeId, snapshotId: await getSummarySnapshotId(snapshot) })
		})
	} as Parameters<typeof POST>[0]);
}

let userSequence = 0;

beforeEach(() => {
	vi.resetAllMocks();
	mocks.user.mockResolvedValue({ data: { user: { id: `test-user-${++userSequence}` } }, error: null });
	mocks.consent.mockResolvedValue(true);
	mocks.rows.mockResolvedValue({ rows: [], truncated: false, error: null });
	mocks.view.mockReturnValue(view);
	mocks.generate.mockResolvedValue({ text: JSON.stringify({
		selection: { ref: 2, span: 'vaknade jag flera gånger', kind: 'notice' }
	}) });
});

describe('Framstegs sammanfattningsendpoint', () => {
	it('behåller inloggnings- och samtyckeskrav före läsning av dagboken', async () => {
		expect((await summarize(visibleSnapshot, { sensitiveConsent: false })).status).toBe(403);
		expect((await summarize(visibleSnapshot, { authenticated: false })).status).toBe(401);
		mocks.consent.mockResolvedValue(false);
		const denied = await summarize();
		expect(denied.status).toBe(403);
		expect(await denied.json()).toMatchObject({ reason: 'ai-consent' });
		expect(mocks.rows).not.toHaveBeenCalled();
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it('avvisar en tidigare vy när det synliga temat har bytt namn', async () => {
		mocks.view.mockReturnValue({
			...view,
			helpfulPatterns: { ready: true, themes: [{ ...view.themes[0], note: 'Vila fanns med i 3 av 4.', label: 'Vila' }] }
		});
		expect((await summarize()).status).toBe(409);
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it('hoppar över modellen vid tomt, tunt eller avkortat underlag', async () => {
		const thin = { ...view, lowConfidence: true, relevantEntryCount: 4 };
		mocks.view.mockReturnValue(thin);
		expect(await (await summarize()).json()).toEqual({ question: null, reason: 'insufficient-data' });
		const empty = { ...view, helpfulPatterns: { ready: true, themes: [] } };
		mocks.view.mockReturnValue(empty);
		expect(await (await summarize()).json()).toEqual({ question: null, reason: 'no-sources' });
		mocks.view.mockReturnValue(view);
		mocks.rows.mockResolvedValue({ rows: [], truncated: true, error: null });
		expect(await (await summarize()).json()).toEqual({ question: null, reason: 'insufficient-data' });
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it('returnerar en verifierad reflektion och skickar bara lokalt numrerade, synliga utdrag', async () => {
		mocks.view.mockReturnValue({
			...view,
			themes: [...view.themes, { ...view.themes[0], id: 'Motion', label: 'Motion',
				note: 'Motion fanns med i 3 av 4.', evidence: [{ ...view.themes[0].evidence[0], excerpt: 'Tog en promenad.' }] }]
		});
		const response = await summarize();
		expect(response.status).toBe(200);
		expect(response.headers.get('Cache-Control')).toBe('no-store');
		expect(await response.json()).toMatchObject({
			sourceRef: 2,
			question: 'Vad lägger du märke till när du läser ”vaknade jag flera gånger” igen?',
			reason: null
		});
		expect(mocks.generate).toHaveBeenCalledTimes(1);
		const request = mocks.generate.mock.calls[0][0];
		expect(JSON.parse(request.messages[0].content)).toEqual([
			{ ref: 1, excerpt: 'Jag sov länge i går.' },
			{ ref: 2, excerpt: 'I natt vaknade jag flera gånger.' }
		]);
	});

	it('ger besked om otillräckligt underlag när modellen avstår', async () => {
		mocks.generate.mockResolvedValue({ text: '{"selection":null}' });
		expect(await (await summarize()).json()).toEqual({ question: null, reason: 'insufficient-data' });
	});

	it('lämnar inget AI-innehåll om samtycket återkallas medan modellen arbetar', async () => {
		mocks.consent.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
		const response = await summarize();
		expect(mocks.generate).toHaveBeenCalledOnce();
		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({
			error: 'Consent required for sensitive diary AI features.',
			reason: 'ai-consent'
		});
	});

	it('avvisar ett förhandsvisat utdrag som har ändrats före anropet', async () => {
		const theme = view.themes[0];
		mocks.view.mockReturnValue({ ...view, helpfulPatterns: { ready: true, themes: [{
			...theme,
			evidence: [{ ...theme.evidence[0], excerpt: 'Jag läste tills jag blev sömnig.' }, theme.evidence[1]]
		}] } });
		expect((await summarize()).status).toBe(409);
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it('tar inte emot ett tema som saknas i den aktuella vyn', async () => {
		const response = await summarize({ ...visibleSnapshot, themeId: 'Annat tema' });
		expect(await response.json()).toEqual({ question: null, reason: 'no-sources' });
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it('hanterar felaktigt modellformat utan att visa modellens text', async () => {
		mocks.generate.mockResolvedValue({ text: '{"selection":{"question":"Egen fråga?"}}' });
		const response = await summarize();
		expect(await response.json()).toEqual({ question: null, reason: 'invalid-response' });
		expect(response.headers.get('Cache-Control')).toBe('no-store');
	});

	it('låter krisspärren stoppa hela anropet före modellen', async () => {
		const unsafe = {
			...view,
			helpfulPatterns: { ready: true, themes: [{
				...view.themes[0],
				evidence: [
					{ ...view.themes[0].evidence[0], excerpt: 'Jag vill ta livet av mig.' },
					view.themes[0].evidence[1]
				]
			}] }
		};
		mocks.view.mockReturnValue(unsafe);
		const response = await summarize(getLighterDaysSummaryView(unsafe, false, 'Sömn')!);
		expect(await response.json()).toEqual({ question: null, reason: 'withheld' });
		expect(mocks.generate).not.toHaveBeenCalled();
	});
});
