// Idempotent import av lokal historik: samma lokala inlägg (local_import_id)
// ska aldrig kunna skapa två dagboksrader, även om klienten avbryts efter att
// servern redan sparat och importen körs om. Skyddet ligger i databasen - ett
// partiellt unikt index på (user_id, local_import_id) - och den här filen
// simulerar det indexet med en enkel, stateful låtsastabell.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';

const mocks = vi.hoisted(() => ({
	createClient: vi.fn(),
	recordCurrentCompanionPresence: vi.fn(),
	recordDiaryFunnelEvents: vi.fn()
}));

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));

vi.mock('$lib/server/companion-presence', () => ({
	recordCurrentCompanionPresence: mocks.recordCurrentCompanionPresence
}));

vi.mock('$lib/server/funnel-events', () => ({
	recordDiaryFunnelEvents: mocks.recordDiaryFunnelEvents
}));

vi.mock('$env/dynamic/private', () => ({
	env: { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_ANON_KEY: 'anon-key' }
}));
vi.mock('$env/dynamic/public', () => ({ env: {} }));

const { POST } = await import('./+server');

const USER_ID = 'user-1';

type FakeRow = {
	id: string;
	user_id: string;
	text: string;
	mood: string | null;
	tags: string[] | null;
	image_url: string | null;
	video_path: string | null;
	prompt_question: string | null;
	daily_question_id: string | null;
	local_import_id: string | null;
	created_at: string;
};

/**
 * Simulerar tabellen `diary` med det partiella unika indexet på
 * (user_id, local_import_id): ett försök att sätta in samma icke-null
 * local_import_id igen ger samma felkod (23505) som Postgres skulle ge.
 */
function fakeDiaryTable() {
	const rows: FakeRow[] = [];
	let nextId = 1;

	return {
		rows,
		client: {
			auth: {
				getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER_ID } }, error: null })
			},
			from: () => ({
				insert: (row: Partial<FakeRow>) => ({
					select: () => ({
						single: () => {
							const localImportId = row.local_import_id ?? null;
							if (localImportId && rows.some((r) => r.local_import_id === localImportId)) {
								return Promise.resolve({
									data: null,
									error: {
										code: '23505',
										message: 'duplicate key value violates unique constraint "diary_user_local_import_id_key"'
									}
								});
							}

							const inserted: FakeRow = {
								id: `entry-${nextId++}`,
								user_id: USER_ID,
								text: row.text ?? '',
								mood: row.mood ?? null,
								tags: row.tags ?? null,
								image_url: row.image_url ?? null,
								video_path: row.video_path ?? null,
								prompt_question: row.prompt_question ?? null,
								daily_question_id: row.daily_question_id ?? null,
								local_import_id: localImportId,
								created_at: new Date(2026, 4, 4).toISOString()
							};
							rows.push(inserted);
							return Promise.resolve({ data: inserted, error: null });
						}
					})
				}),
				select: () => ({
					eq: (colA: string, valA: unknown) => ({
						eq: (colB: string, valB: unknown) => ({
							maybeSingle: () => {
								const found = rows.find(
									(r) => (r as Record<string, unknown>)[colA] === valA && (r as Record<string, unknown>)[colB] === valB
								);
								return Promise.resolve({ data: found ?? null, error: null });
							}
						})
					})
				})
			})
		}
	};
}

function createRequest(body: Record<string, unknown>) {
	return new Request('http://localhost/api/diary/create', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: 'Bearer access-token',
			[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
		},
		body: JSON.stringify(body)
	});
}

async function post(body: Record<string, unknown>) {
	return POST({ request: createRequest(body) } as never);
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.recordCurrentCompanionPresence.mockResolvedValue(true);
	mocks.recordDiaryFunnelEvents.mockResolvedValue([]);
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/diary/create — idempotent import via local_import_id', () => {
	it('samma local_import_id skickas två gånger ger bara ett serverinlägg', async () => {
		const table = fakeDiaryTable();
		mocks.createClient.mockReturnValue(table.client);

		const first = await post({ text: 'Kväll ett', local_import_id: 'local-abc' });
		const firstBody = (await first.json()) as { success: boolean; diary?: { id: string } };

		const second = await post({ text: 'Kväll ett', local_import_id: 'local-abc' });
		const secondBody = (await second.json()) as { success: boolean; diary?: { id: string } };

		expect(first.status).toBe(200);
		expect(second.status).toBe(200);
		expect(firstBody.success).toBe(true);
		expect(secondBody.success).toBe(true);
		expect(secondBody.diary?.id).toBe(firstBody.diary?.id);
		expect(table.rows).toHaveLength(1);
	});

	it('retry efter simulerat klientavbrott skapar ingen dubblett', async () => {
		const table = fakeDiaryTable();
		mocks.createClient.mockReturnValue(table.client);

		// Servern sparar och skulle svara, men klienten "avbryts" innan den ser
		// svaret - importSelected() hann aldrig radera det lokala inlägget.
		const original = await post({ text: 'Avbruten kväll', local_import_id: 'local-xyz' });
		const originalBody = (await original.json()) as { diary?: { id: string } };
		mocks.recordDiaryFunnelEvents.mockClear();
		mocks.recordCurrentCompanionPresence.mockClear();

		// Importflödet körs om (t.ex. vid nästa sidladdning) med samma lokala id.
		const retry = await post({ text: 'Avbruten kväll', local_import_id: 'local-xyz' });
		const retryBody = (await retry.json()) as { success: boolean; diary?: { id: string } };

		expect(retry.status).toBe(200);
		expect(retryBody.success).toBe(true);
		expect(retryBody.diary?.id).toBe(originalBody.diary?.id);
		expect(table.rows).toHaveLength(1);
		// Ingen ny rad skapades, så inget AI/analys/analytics ska triggas om.
		expect(mocks.recordDiaryFunnelEvents).not.toHaveBeenCalled();
		expect(mocks.recordCurrentCompanionPresence).not.toHaveBeenCalled();
	});

	it('vanliga manuella inlägg utan local_import_id blockeras inte av det unika indexet', async () => {
		const table = fakeDiaryTable();
		mocks.createClient.mockReturnValue(table.client);

		const first = await post({ text: 'Ett vanligt inlägg' });
		const second = await post({ text: 'Ett annat vanligt inlägg' });

		expect(first.status).toBe(200);
		expect(second.status).toBe(200);
		expect(table.rows).toHaveLength(2);
		expect(table.rows.every((row) => row.local_import_id === null)).toBe(true);
	});
});
