// Endpointen för "Sammanfatta mina anteckningar": samtycken, ögonblicksbild,
// begränsning och kontroll av svaret.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHealthConsentRecord, SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';
import type { PeriodSummaryPreview } from '$lib/progress-period-summary';
import { GET, POST } from './+server';

const mocks = vi.hoisted(() => ({ user: vi.fn(), consent: vi.fn(), rows: vi.fn(), generate: vi.fn() }));
vi.mock('$lib/server/supabase-admin', () => ({
	createTokenClient: () => ({ auth: { getUser: mocks.user } }),
	createServiceClient: () => ({})
}));
vi.mock('$lib/server/diary-ai-consent', () => ({ hasDiaryAiConsent: mocks.consent }));
vi.mock('$lib/server/ai/text-generation', () => ({ generateAIText: mocks.generate }));
vi.mock('$lib/server/progress-rows', () => ({ loadProgressRows: mocks.rows }));

// Varje test får ett eget konto, så begränsningen per konto inte läcker mellan testerna.
let sequence = 0;
const userId = () => 'summary-user-' + sequence;
function auth(record: ReturnType<typeof createHealthConsentRecord> | null, id = userId()) {
	return { data: { user: { id, user_metadata: { health_data_processing_consent: record } } }, error: null };
}

const texts = [
	'Jag sov dåligt igen och tankarna snurrade länge.',
	'Gick en lång promenad. Det kändes lugnt.',
	'Sov lite bättre i natt.',
	'Jobbet var stressigt men jag tog en paus vid sjön.',
	'En bra dag. Jag vill komma ihåg stunden vid sjön.'
];
const rows = texts.map((text, index) => ({
	id: 'entry-' + index,
	created_at: `2026-11-${String(10 + index).padStart(2, '0')}T12:00:00Z`,
	mood: 5 + index,
	text
}));

const goodAnswer = {
	themes: [{ text: 'Du skriver om sömn.', refs: [1, 3] }],
	changes: [],
	moments: [{ ref: 5, quote: 'Jag vill komma ihåg stunden vid sjön.' }],
	question: 'Vad gör stunderna vid sjön för dig?'
};

function call(
	method: 'GET' | 'POST',
	body?: unknown,
	{ health = true, period = 30 }: { health?: boolean; period?: number } = {}
) {
	const url = new URL(`http://localhost/api/diary/insights/period-summary?period=${period}`);
	const headers = new Headers({ Authorization: 'Bearer test-token' });
	if (health) headers.set(SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION);
	const handler = method === 'GET' ? GET : POST;
	return handler({
		url,
		request: new Request(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
	} as Parameters<typeof GET>[0]);
}

async function preview() {
	const response = await call('GET');
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toContain('no-store');
	const data = (await response.json()) as PeriodSummaryPreview;
	return { data, input: { period: 30, snapshotId: data.snapshotId, confirmed: true } };
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date('2026-11-18T12:00:00Z'));
	sequence++;
	mocks.user.mockResolvedValue(auth(createHealthConsentRecord()));
	mocks.consent.mockResolvedValue(true);
	mocks.rows.mockResolvedValue({ rows, truncated: false, error: null });
	mocks.generate.mockResolvedValue({ text: JSON.stringify(goodAnswer) });
});
afterEach(() => vi.useRealTimers());

describe('förhandsvisning', () => {
	it('visar bara omfånget, ingen text och inget AI-anrop', async () => {
		const { data } = await preview();
		expect(data).toMatchObject({ period: 30, entryCount: 5, excludedCount: 0, capped: false, firstDate: '2026-11-10', lastDate: '2026-11-14' });
		expect(JSON.stringify(data)).not.toContain('sov dåligt');
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it('kräver hälsodatasamtycke både i header och i kontot', async () => {
		expect((await call('GET', undefined, { health: false })).status).toBe(403);
		mocks.user.mockResolvedValue(auth(null));
		const response = await call('GET');
		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ reason: 'health-consent' });
		expect(mocks.rows).not.toHaveBeenCalled();
	});

	it('säger ifrån vid för lite underlag', async () => {
		mocks.rows.mockResolvedValue({ rows: rows.slice(0, 3), truncated: false, error: null });
		const response = await call('GET');
		expect(response.status).toBe(422);
		expect(await response.json()).toMatchObject({ reason: 'insufficient-data', basis: { entryCount: 3 } });
	});

	it('redovisar ett begränsat urval när hämtningen kapats', async () => {
		mocks.rows.mockResolvedValue({ rows, truncated: true, error: null });
		const { data } = await preview();
		expect(data.capped).toBe(true);
	});

	it('avvisar okända perioder och läsfel', async () => {
		expect((await call('GET', undefined, { period: 7 })).status).toBe(400);
		mocks.rows.mockResolvedValue({ rows: [], truncated: false, error: 'boom' });
		expect((await call('GET')).status).toBe(503);
	});

	it('kräver inloggning', async () => {
		mocks.user.mockResolvedValue({ data: { user: null }, error: { message: 'nej' } });
		expect((await call('GET')).status).toBe(401);
	});
});

describe('sammanfattning', () => {
	it('kräver ett uttryckligt val och en giltig ögonblicksbild', async () => {
		const { input } = await preview();
		expect((await call('POST', { ...input, confirmed: false })).status).toBe(400);
		expect((await call('POST', { ...input, snapshotId: 'abc' })).status).toBe(400);
		expect((await call('POST', { ...input, snapshotId: 'a'.repeat(64) })).status).toBe(409);
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it('anropar aldrig AI utan dagboks-AI-samtycke', async () => {
		const { input } = await preview();
		mocks.consent.mockResolvedValue(false);
		const response = await call('POST', input);
		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ reason: 'ai-consent' });
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it('skickar urvalet och svarar med kontrollerade delar och källor', async () => {
		const { input } = await preview();
		const response = await call('POST', input);
		expect(response.status).toBe(200);
		expect(response.headers.get('Cache-Control')).toContain('no-store');
		const result = await response.json();
		expect(result.themes[0]).toEqual({
			text: 'Du skriver om sömn.',
			sources: [
				{ ref: 1, entryId: 'entry-0', date: '2026-11-10' },
				{ ref: 3, entryId: 'entry-2', date: '2026-11-12' }
			]
		});
		expect(result.moments[0].source.entryId).toBe('entry-4');
		expect(result.basis.entryCount).toBe(5);
		const [request] = mocks.generate.mock.calls[0];
		const sent = JSON.parse(request.messages[0].content);
		expect(sent.map((entry: { text: string }) => entry.text)).toEqual(texts);
		expect(request.messages[0].content).not.toContain(userId());
	});

	it('binder ögonblicksbilden till kontot och perioden', async () => {
		const { input } = await preview();
		expect((await call('POST', { ...input, period: 90 })).status).toBe(409);
		mocks.user.mockResolvedValue(auth(createHealthConsentRecord(), 'someone-else'));
		expect((await call('POST', input)).status).toBe(409);
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it('skickar aldrig en anteckning som krisvakten flaggar', async () => {
		mocks.rows.mockResolvedValue({
			rows: [...rows, { id: 'risk', created_at: '2026-11-15T12:00:00Z', mood: 2, text: 'Jag vill ta livet av mig.' }],
			truncated: false,
			error: null
		});
		const { data, input } = await preview();
		expect(data.excludedCount).toBe(1);
		await call('POST', input);
		expect(mocks.generate.mock.calls[0][0].messages[0].content).not.toContain('livet');
	});

	it('kontrollerar hälsosamtycket igen efter läsningen och före AI', async () => {
		const { input } = await preview();
		mocks.rows.mockImplementation(async () => {
			mocks.user.mockImplementation(async () => auth(null));
			return { rows, truncated: false, error: null };
		});
		mocks.user.mockResolvedValueOnce(auth(createHealthConsentRecord()));
		const response = await call('POST', input);
		expect(response.status).toBe(403);
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it('lämnar inget resultat om samtycket återkallas under anropet', async () => {
		const { input } = await preview();
		mocks.generate.mockImplementation(async () => {
			mocks.consent.mockResolvedValue(false);
			return { text: JSON.stringify(goodAnswer) };
		});
		const response = await call('POST', input);
		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ reason: 'ai-consent' });
	});

	it('lämnar inget resultat om underlaget ändras under anropet', async () => {
		const { input } = await preview();
		mocks.generate.mockImplementation(async () => {
			mocks.rows.mockResolvedValue({
				rows: rows.map((r, index) => (index === 4 ? { ...r, text: 'Ändrad.' } : r)),
				truncated: false,
				error: null
			});
			return { text: JSON.stringify(goodAnswer) };
		});
		const response = await call('POST', input);
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ reason: 'changed' });
	});

	it('visar ingenting när krisvakten flaggar svaret och säger till när svaret inte håller', async () => {
		const { input } = await preview();
		mocks.generate.mockResolvedValue({
			text: JSON.stringify({ themes: [{ text: 'Du vill ta livet av dig.', refs: [1, 2] }] })
		});
		let response = await call('POST', input);
		expect(response.status).toBe(422);
		expect(await response.json()).toEqual({ reason: 'withheld' });

		vi.setSystemTime(new Date('2026-11-18T12:02:00Z'));
		mocks.generate.mockResolvedValue({ text: 'inte json' });
		response = await call('POST', input);
		expect(response.status).toBe(422);
		expect(await response.json()).toEqual({ reason: 'invalid-response' });
	});

	it('svarar 502 när AI-tjänsten fallerar', async () => {
		const { input } = await preview();
		mocks.generate.mockRejectedValue(new Error('provider'));
		expect((await call('POST', input)).status).toBe(502);
	});

	it('tillåter ett anrop per minut och högst fem per dygn', async () => {
		const { input } = await preview();
		expect((await call('POST', input)).status).toBe(200);
		let response = await call('POST', input);
		expect(response.status).toBe(429);
		expect(await response.json()).toEqual({ reason: 'rate-limit' });

		for (let minute = 2; minute <= 5; minute++) {
			vi.setSystemTime(new Date(`2026-11-18T12:0${minute}:00Z`));
			expect((await call('POST', input)).status).toBe(200);
		}
		vi.setSystemTime(new Date('2026-11-18T12:10:00Z'));
		response = await call('POST', input);
		expect(response.status).toBe(429);
		expect(await response.json()).toEqual({ reason: 'daily-limit' });
		expect(mocks.generate).toHaveBeenCalledTimes(5);

		// Nästa dygn i Stockholm går det igen.
		vi.setSystemTime(new Date('2026-11-19T12:00:00Z'));
		expect((await call('POST', input)).status).toBe(200);
	});
});
