import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHealthConsentRecord, SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';
import { retrospectSnapshotId, type RetrospectPreview } from '$lib/progress-retrospect';
import { GET, POST } from './+server';

const mocks = vi.hoisted(() => ({ user: vi.fn(), consent: vi.fn(), rows: vi.fn(), generate: vi.fn() }));
vi.mock('$lib/server/supabase-admin', () => ({
	createTokenClient: () => ({ auth: { getUser: mocks.user } }),
	createServiceClient: () => ({})
}));
vi.mock('$lib/server/diary-ai-consent', () => ({ hasDiaryAiConsent: mocks.consent }));
vi.mock('$lib/server/ai/text-generation', () => ({ generateAIText: mocks.generate }));
vi.mock('$lib/server/progress-rows', () => ({ loadProgressRows: mocks.rows }));

let sequence = 0;
function auth(record: ReturnType<typeof createHealthConsentRecord> | null, id = 'test-user-' + sequence) {
	return { data: { user: { id, user_metadata: { health_data_processing_consent: record } } }, error: null };
}
const rows = [
	'Jag gick en promenad i parken.', 'Jag tog en kort promenad.',
	'Jag ville läsa hemma.', 'Jag ville inte läsa hemma.', 'Jag vilade hemma.'
].map((text, index) => ({
	id: 'entry-' + index, created_at: '2026-11-' + (10 + index) + 'T12:00:00Z', mood: 6, text
}));

function call(method: 'GET' | 'POST', body?: unknown, { health = true, signal }: { health?: boolean; signal?: AbortSignal } = {}) {
	const url = new URL('http://localhost/api/diary/insights/retrospect?period=30');
	const headers = new Headers({ Authorization: 'Bearer test-token' });
	if (health) headers.set(SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION);
	const handler = method === 'GET' ? GET : POST;
	return handler({ url, request: new Request(url, { method, headers, body: JSON.stringify(body), signal }) } as Parameters<typeof GET>[0]);
}

async function preview() {
	const response = await call('GET');
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toContain('no-store');
	const data = await response.json() as RetrospectPreview;
	mocks.generate.mockResolvedValue({ text: JSON.stringify({ observations: [] }) });
	return { data, input: { period: 30, snapshotId: data.snapshotId, refs: data.sources.map(({ ref }) => ref), confirmed: true } };
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.setSystemTime(new Date('2026-11-18T12:00:00Z'));
	sequence++;
	mocks.user.mockResolvedValue(auth(createHealthConsentRecord()));
	mocks.consent.mockResolvedValue(true);
	mocks.rows.mockResolvedValue({ rows, truncated: false, error: null });
});
afterEach(() => vi.useRealTimers());

describe('personlig återblick', () => {
	it('visar ett begränsat underlag utan anrop och kräver hälsosamtycke samt ett uttryckligt val', async () => {
		expect((await call('GET', undefined, { health: false })).status).toBe(403);
		expect(mocks.rows).not.toHaveBeenCalled();
		const { input } = await preview();
		expect(mocks.generate).not.toHaveBeenCalled();
		expect((await call('POST', { ...input, confirmed: false })).status).toBe(400);
		mocks.consent.mockResolvedValue(false);
		expect((await call('POST', input)).status).toBe(403);
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it('binder urvalet till konto och period och skickar bara granskade utdrag', async () => {
		const { input, data } = await preview();
		expect((await call('POST', { ...input, period: 90 })).status).toBe(409);
		expect(mocks.generate).not.toHaveBeenCalled();
		const response = await call('POST', input);
		expect(response.status).toBe(200);
		expect(response.headers.get('Cache-Control')).toContain('no-store');
		expect((await response.json()).sources).toHaveLength(4);
		const [request] = mocks.generate.mock.calls[0];
		expect(JSON.parse(request.messages[0].content)).toEqual(data.sources.map(({ ref, excerpt }) => ({ ref, excerpt })));
		mocks.user.mockResolvedValue(auth(createHealthConsentRecord(), 'other-user'));
		expect((await call('POST', input)).status).toBe(409);
		expect(mocks.generate).toHaveBeenCalledTimes(1);
	});

	it('kräver en ny ögonblicksbild för ett bytt utdrag och skickar endast den nya uppsättningen', async () => {
		const { input, data } = await preview();
		const replacement = data.candidates.find(({ ref }) => !input.refs.includes(ref))!;
		const refs = [replacement.ref, ...input.refs.slice(1)];
		const sources = data.candidates.filter(({ ref }) => refs.includes(ref));
		expect((await call('POST', { ...input, refs })).status).toBe(409);
		expect(mocks.generate).not.toHaveBeenCalled();
		const snapshotId = await retrospectSnapshotId('test-user-' + sequence, 30, sources);
		expect((await call('POST', { ...input, refs, snapshotId })).status).toBe(200);
		expect(JSON.parse(mocks.generate.mock.calls[0][0].messages[0].content)).toEqual(
			sources.map(({ ref, excerpt }) => ({ ref, excerpt }))
		);
	});

	it('lämnar inget resultat om samtycket återkallas under anropet', async () => {
		const { input } = await preview();
		mocks.generate.mockImplementation(async () => {
			mocks.consent.mockResolvedValue(false);
			return { text: '{}' };
		});
		const response = await call('POST', input);
		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ reason: 'ai-consent' });
	});

	it('avvisar en gammal öppen flik när hälsosamtycket är återkallat trots giltig header och snapshot', async () => {
		const { input } = await preview();
		mocks.user.mockResolvedValue(auth(null));
		const response = await call('POST', input);
		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ reason: 'health-consent' });
		expect((await call('GET')).status).toBe(403);
		expect(mocks.rows).toHaveBeenCalledTimes(1);
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it('kontrollerar hälsosamtycket igen efter läsningen och före OpenAI', async () => {
		const { input } = await preview();
		mocks.rows.mockImplementation(async () => {
			mocks.user.mockResolvedValue(auth(null));
			return { rows, truncated: false, error: null };
		});
		expect(await (await call('POST', input)).json()).toEqual({ reason: 'health-consent' });
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it.each([null, '2026-11-18T12:00:01Z'])('utesluter resultat när hälsosamtycket ändrats under OpenAI-anropet (%s)', async (timestamp) => {
		const { input } = await preview();
		mocks.generate.mockImplementation(async () => {
			mocks.user.mockResolvedValue(auth(timestamp ? createHealthConsentRecord(timestamp) : null));
			return { text: '{"observations":[]}' };
		});
		const response = await call('POST', input);
		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ reason: 'health-consent' });
		expect(mocks.generate).toHaveBeenCalledTimes(1);
	});

	it('lämnar inget resultat om dagboken ändras under anropet', async () => {
		const { input } = await preview();
		mocks.generate.mockImplementation(async () => {
			mocks.rows.mockResolvedValue({ rows: rows.slice(1), truncated: false, error: null });
			return { text: '{}' };
		});
		expect((await call('POST', input)).status).toBe(409);
	});

	it('stoppar responsen efter avbrutet anrop och avvisar ogiltiga modellsvar', async () => {
		const { input } = await preview();
		mocks.generate.mockResolvedValue({ text: 'ogiltigt' });
		expect(await (await call('POST', input)).json()).toEqual({ reason: 'invalid-response' });
		vi.setSystemTime(new Date('2026-11-18T12:02:00Z'));
		const controller = new AbortController();
		mocks.generate.mockImplementation(async () => {
			controller.abort();
			return { text: '{}' };
		});
		expect((await call('POST', input, { signal: controller.signal })).status).toBe(408);
	});

	it('skickar inget om det granskade underlaget får krisinnehåll före anropet', async () => {
		const { input } = await preview();
		mocks.rows.mockResolvedValue({ rows: [
			{ ...rows[0], text: rows[0].text + '\n\nJag tänker ta mitt liv.' }, ...rows.slice(1)
		], truncated: false, error: null });
		expect(await (await call('POST', input)).json()).toEqual({ reason: 'changed' });
		expect(mocks.generate).not.toHaveBeenCalled();
	});
});
