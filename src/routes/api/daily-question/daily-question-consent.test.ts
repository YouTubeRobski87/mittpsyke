import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	callClaude: vi.fn(),
	createServiceClient: vi.fn(),
	hasDailyQuestionAiConsent: vi.fn()
}));

vi.mock('$lib/server/ai/anthropic', () => ({ callClaude: mocks.callClaude }));

vi.mock('$lib/server/supabase-admin', () => ({
	createServiceClient: mocks.createServiceClient
}));

vi.mock('$lib/server/daily-question-ai-consent', () => ({
	hasDailyQuestionAiConsent: mocks.hasDailyQuestionAiConsent
}));

import { GET as dailyQuestionGet } from './+server';
import { POST as regenerateDailyQuestionPost } from './regenerate/+server';

type DailyQuestionMode = 'missing' | 'existing';

function questionRecord(regenerations = 0) {
	return {
		id: 'question-1',
		user_id: 'user-1',
		date: '2026-08-22',
		question_text: 'Vad behöver få lite mer plats hos dig idag?',
		context_snapshot: {},
		regenerations,
		created_at: '2026-08-22T08:00:00.000Z'
	};
}

function dailyQuestionClient(
	mode: DailyQuestionMode = 'missing',
	metadata: Record<string, unknown> = {}
) {
	const from = vi.fn((table: string) => {
		if (table === 'diary') {
			const entries = {
				data: [
					{
						text: 'Jag tog en lugn promenad i dag.',
						mood: '6',
						created_at: '2026-08-21T18:00:00.000Z'
					}
				],
				error: null
			};
			const count = { data: null, error: null, count: 1 };
			return {
				select: (_columns: string, options?: { head?: boolean }) => {
					if (options?.head) return { eq: vi.fn().mockResolvedValue(count) };
					return {
						eq: vi.fn(() => ({
							order: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(entries) }))
						}))
					};
				}
			};
		}

		const existing = mode === 'existing' ? questionRecord() : null;
		return {
			select: vi.fn(() => ({
				eq: vi.fn(() => ({
					eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: existing, error: null }) }))
				}))
			})),
			insert: vi.fn(() => ({
				select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: questionRecord(), error: null }) }))
			})),
			update: vi.fn(() => ({
				eq: vi.fn(() => ({
					eq: vi.fn(() => ({
						select: vi.fn(() => ({
							single: vi.fn().mockResolvedValue({ data: questionRecord(1), error: null })
						}))
					}))
				}))
			}))
		};
	});

	return {
		auth: {
			getUser: vi.fn().mockResolvedValue({
				data: { user: { id: 'user-1', user_metadata: metadata } },
				error: null
			})
		},
		from
	};
}

/**
 * `generate` avgör om anropet får orsaka ny AI-behandling. Utan flaggan läser
 * routen bara en redan sparad fråga - det är hela poängen med att ett sidbesök
 * inte längre skickar dagbokskontext vidare.
 */
function getEvent(client: ReturnType<typeof dailyQuestionClient>, generate = true) {
	return {
		locals: { supabase: client },
		url: new URL(`http://localhost/api/daily-question${generate ? '?generate=true' : ''}`)
	} as unknown as Parameters<typeof dailyQuestionGet>[0];
}

function regenerateEvent(client: ReturnType<typeof dailyQuestionClient>) {
	return { locals: { supabase: client } } as unknown as Parameters<typeof regenerateDailyQuestionPost>[0];
}

function readDiaryTable(client: ReturnType<typeof dailyQuestionClient>) {
	return client.from.mock.calls.filter(([table]) => table === 'diary').length;
}

describe('daily-question: serverägt diary AI-samtycke', () => {
	beforeEach(() => {
		mocks.callClaude.mockReset();
		mocks.createServiceClient.mockReset();
		mocks.hasDailyQuestionAiConsent.mockReset();
		mocks.callClaude.mockResolvedValue('Vad skulle vara hjälpsamt att skriva ner just nu?');
		mocks.createServiceClient.mockReturnValue({ service: true });
		mocks.hasDailyQuestionAiConsent.mockResolvedValue(true);
	});

	it('läser diary-kontext och anropar Claude vid giltigt serversamtycke', async () => {
		const client = dailyQuestionClient();

		const response = await dailyQuestionGet(getEvent(client));

		expect(response.status).toBe(200);
		expect(mocks.hasDailyQuestionAiConsent).toHaveBeenCalledWith({ service: true }, 'user-1');
		expect(readDiaryTable(client)).toBe(2);
		expect(mocks.callClaude).toHaveBeenCalledTimes(1);
	});

	describe('blockerade lägen', () => {
		for (const name of ['saknad consent-row', 'revoked consent', 'stale policyversion', 'DB-fel']) {
			it(`${name} → 403 utan diary-läsning eller Claude`, async () => {
				mocks.hasDailyQuestionAiConsent.mockResolvedValue(false);
				const client = dailyQuestionClient();

				const response = await dailyQuestionGet(getEvent(client));

				expect(response.status).toBe(403);
				expect(await response.json()).toMatchObject({ code: 'DIARY_AI_CONSENT_REQUIRED' });
				expect(readDiaryTable(client)).toBe(0);
				expect(mocks.callClaude).not.toHaveBeenCalled();
			});
		}

		it('gammal klientmetadata räcker inte utan serversamtycke', async () => {
			mocks.hasDailyQuestionAiConsent.mockResolvedValue(false);
			const client = dailyQuestionClient('missing', {
				health_data_processing_consent: { accepted: true, policy_version: '2026-04-29' }
			});

			const response = await dailyQuestionGet(getEvent(client));

			expect(response.status).toBe(403);
			expect(readDiaryTable(client)).toBe(0);
			expect(mocks.callClaude).not.toHaveBeenCalled();
		});
	});

	it('regenerate kan inte kringgå grinden utan samtycke', async () => {
		mocks.hasDailyQuestionAiConsent.mockResolvedValue(false);
		const client = dailyQuestionClient('existing');

		const response = await regenerateDailyQuestionPost(regenerateEvent(client));

		expect(response.status).toBe(403);
		expect(readDiaryTable(client)).toBe(0);
		expect(mocks.callClaude).not.toHaveBeenCalled();
	});

	it('blockerar nästa request efter återkallat samtycke', async () => {
		const grantedClient = dailyQuestionClient();
		const granted = await dailyQuestionGet(getEvent(grantedClient));
		expect(granted.status).toBe(200);
		expect(mocks.callClaude).toHaveBeenCalledTimes(1);

		mocks.callClaude.mockClear();
		mocks.hasDailyQuestionAiConsent.mockResolvedValue(false);
		const revokedClient = dailyQuestionClient();
		const revoked = await dailyQuestionGet(getEvent(revokedClient));

		expect(revoked.status).toBe(403);
		expect(readDiaryTable(revokedClient)).toBe(0);
		expect(mocks.callClaude).not.toHaveBeenCalled();
	});
});
