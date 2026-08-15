import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Trust Pass V3.2: inloggad chatt bakom serverägt samtycke, scope
// chat_ai_support. Den gamla headern och user_metadata är båda skrivbara av
// användaren själv och får inte längre auktorisera ett leverantörsanrop.
//
// Gästchatt är avsiktligt oförändrad i det här passet - en anonym besökare har
// inget auth.users-id och kan därför inte ha en consentrad. Se rapporten.

const mocks = vi.hoisted(() => ({
	createServiceClient: vi.fn(),
	hasChatAiConsent: vi.fn(),
	generateAIText: vi.fn(),
	createClient: vi.fn()
}));

vi.mock('$lib/server/supabase-admin', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/supabase-admin')>();
	return { ...actual, createServiceClient: mocks.createServiceClient };
});

vi.mock('$lib/server/chat-ai-consent', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/chat-ai-consent')>();
	return { ...actual, hasChatAiConsent: mocks.hasChatAiConsent };
});

vi.mock('$lib/server/ai/text-generation', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/ai/text-generation')>();
	return { ...actual, generateAIText: mocks.generateAIText };
});

vi.mock('@supabase/supabase-js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@supabase/supabase-js')>();
	return { ...actual, createClient: mocks.createClient };
});

vi.mock('$env/dynamic/private', () => ({
	env: {
		OPENAI_API_KEY: 'sk-test-key',
		SUPABASE_URL: 'https://example.supabase.co',
		SUPABASE_ANON_KEY: 'anon-key',
		SUPABASE_SERVICE_ROLE_KEY: 'service-key'
	}
}));

vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
		PUBLIC_SUPABASE_ANON_KEY: 'anon-key'
	}
}));

import { POST as chatPost } from './+server';
import { SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';

const SAFE_MESSAGE = 'Jag har haft en lite tung vecka på jobbet och vill prata om det.';

const VALID_METADATA = {
	health_data_processing_consent: {
		accepted: true,
		type: 'health_data_processing',
		policy_version: SENSITIVE_CONSENT_VERSION,
		timestamp: '2026-08-15T08:00:00.000Z'
	}
};

/**
 * Auth-klient med spioner på persistensen. Mockar hela den inloggade vägen:
 * skapa konversation, läsa historik, spara meddelanden och användarminnen.
 */
function authClient(user: { id: string; user_metadata?: unknown } | null) {
	const insertMessage = vi.fn().mockResolvedValue({ error: null });

	const from = vi.fn((table: string) => {
		if (table === 'conversations') {
			return {
				insert: vi.fn(() => ({
					select: vi.fn(() => ({
						single: vi.fn().mockResolvedValue({ data: { id: 'conversation-1' }, error: null })
					}))
				})),
				select: vi.fn(() => ({
					eq: vi.fn(() => ({
						eq: vi.fn(() => ({
							maybeSingle: vi
								.fn()
								.mockResolvedValue({ data: { id: 'conversation-1', user_id: 'user-1', category: 'A' }, error: null })
						}))
					}))
				}))
			};
		}

		if (table === 'messages') {
			return {
				insert: insertMessage,
				select: vi.fn(() => ({
					eq: vi.fn(() => ({
						order: vi.fn(() => ({
							limit: vi.fn().mockResolvedValue({ data: [], error: null })
						}))
					}))
				}))
			};
		}

		// Användarminnen och övriga tabeller: tomt men felfritt.
		return {
			insert: vi.fn().mockResolvedValue({ error: null }),
			upsert: vi.fn().mockResolvedValue({ error: null }),
			select: vi.fn(() => ({
				eq: vi.fn(() => ({
					eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })),
					order: vi.fn(() => ({ limit: vi.fn().mockResolvedValue({ data: [], error: null }) })),
					limit: vi.fn().mockResolvedValue({ data: [], error: null }),
					maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
				}))
			}))
		};
	});

	return {
		auth: {
			getUser: vi.fn().mockResolvedValue({
				data: { user },
				error: user ? null : new Error('invalid token')
			})
		},
		from,
		spies: { from, insert: insertMessage }
	};
}

function chatRequest(options: { headers?: HeadersInit; message?: string } = {}) {
	return new Request('http://localhost/api/chat', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION,
			authorization: 'Bearer access-token',
			...options.headers
		},
		body: JSON.stringify({ message: options.message ?? SAFE_MESSAGE, category: 'A' })
	});
}

function callChat(options: { headers?: HeadersInit; message?: string } = {}) {
	return chatPost({
		request: chatRequest(options),
		getClientAddress: () => `10.0.0.${Math.floor(Math.random() * 250) + 1}`
	} as unknown as Parameters<typeof chatPost>[0]);
}

describe('inloggad chatt: serverägt samtycke', () => {
	let client: ReturnType<typeof authClient>;

	beforeEach(() => {
		mocks.createServiceClient.mockReset();
		mocks.hasChatAiConsent.mockReset();
		mocks.generateAIText.mockReset();
		mocks.createClient.mockReset();

		client = authClient({ id: 'user-1' });
		mocks.createClient.mockReturnValue(client);
		mocks.createServiceClient.mockReturnValue({});
		mocks.hasChatAiConsent.mockResolvedValue(true);
		mocks.generateAIText.mockResolvedValue({ text: 'Det låter tungt. Vill du berätta mer?' });
	});

	it('giltigt serversamtycke → leverantören anropas', async () => {
		const response = await callChat();

		expect(response.status).toBe(200);
		expect(mocks.hasChatAiConsent).toHaveBeenCalledWith({}, 'user-1');
		expect(mocks.generateAIText).toHaveBeenCalledTimes(1);
	});

	describe('blockerade lägen', () => {
		// hasChatAiConsent är fail-closed: saknad rad, revoked, fel
		// policyversion och DB-fel ger alla false.
		const cases: { name: string; headers?: HeadersInit; metadata?: unknown }[] = [
			{ name: 'ingen consentrad' },
			{ name: 'revoked' },
			{ name: 'stale policyversion' },
			{ name: 'DB-fel vid consentläsning' },
			{
				name: 'endast gammal header',
				headers: { [SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION }
			},
			{ name: 'endast user_metadata', metadata: VALID_METADATA },
			{
				name: 'header OCH metadata utan serverrad',
				headers: { [SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION },
				metadata: VALID_METADATA
			}
		];

		for (const testCase of cases) {
			it(`${testCase.name} → 403 och inget leverantörsanrop`, async () => {
				mocks.hasChatAiConsent.mockResolvedValue(false);
				if (testCase.metadata) {
					client = authClient({ id: 'user-1', user_metadata: testCase.metadata });
					mocks.createClient.mockReturnValue(client);
				}

				const response = await callChat({ headers: testCase.headers });

				expect(response.status).toBe(403);
				expect(mocks.generateAIText).not.toHaveBeenCalled();
			});
		}

		it('saknad service-role stänger chatten i stället för att öppna den', async () => {
			mocks.createServiceClient.mockReturnValue(null);

			const response = await callChat();

			expect(response.status).toBe(500);
			expect(mocks.hasChatAiConsent).not.toHaveBeenCalled();
			expect(mocks.generateAIText).not.toHaveBeenCalled();
		});
	});

	it('blockerad request skriver inga meddelanden till persistensen', async () => {
		mocks.hasChatAiConsent.mockResolvedValue(false);

		const response = await callChat();

		expect(response.status).toBe(403);
		expect(client.spies.insert).not.toHaveBeenCalled();
		// Varken conversations eller messages rörs.
		expect(client.spies.from).not.toHaveBeenCalled();
	});

	it('samtycket prövas efter autentiseringen men före leverantören', () => {
		const source = readFileSync(new URL('./+server.ts', import.meta.url), 'utf8');
		const authIndex = source.indexOf('await authClient.auth.getUser()');
		const consentIndex = source.indexOf('hasChatAiConsent(consentServiceClient');
		const providerIndex = source.indexOf('await generateAIText(generationRequest)', consentIndex);

		expect(authIndex).toBeGreaterThan(-1);
		expect(consentIndex).toBeGreaterThan(authIndex);
		expect(providerIndex).toBeGreaterThan(consentIndex);
	});
});

describe('kris- och säkerhetslagret', () => {
	beforeEach(() => {
		mocks.createServiceClient.mockReset();
		mocks.hasChatAiConsent.mockReset();
		mocks.generateAIText.mockReset();
		mocks.createClient.mockReset();
		mocks.createClient.mockReturnValue(authClient({ id: 'user-1' }));
		mocks.createServiceClient.mockReturnValue({});
		mocks.generateAIText.mockResolvedValue({ text: 'svar' });
	});

	it('krissvar når användaren även utan serversamtycke', async () => {
		// Krisgrinden är deterministisk och lokal - den skickar ingenting till
		// någon leverantör. Ett saknat samtycke får aldrig tysta ett akut svar.
		mocks.hasChatAiConsent.mockResolvedValue(false);

		const response = await callChat({ message: 'Jag vill inte leva längre.' });
		const payload = (await response.json()) as { crisis?: boolean; reply?: string };

		expect(response.status).toBe(200);
		expect(payload.crisis).toBe(true);
		expect(payload.reply).toBeTruthy();
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('krisgrinden ligger kvar före samtyckeskontrollen i källan', () => {
		const source = readFileSync(new URL('./+server.ts', import.meta.url), 'utf8');
		const guardIndex = source.indexOf('_resolveDeterministicChatGuard(message)');
		const consentIndex = source.indexOf('hasChatAiConsent(consentServiceClient');

		expect(guardIndex).toBeGreaterThan(-1);
		expect(guardIndex).toBeLessThan(consentIndex);
	});
});

describe('scope-avgränsning', () => {
	it('chatten använder ett eget scope, inte dagbokens', async () => {
		const chatConsent = await import('$lib/server/chat-ai-consent');
		const diaryConsent = await import('$lib/server/diary-ai-consent');

		expect(chatConsent.CHAT_AI_CONSENT_SCOPE).toBe('chat_ai_support');
		expect(diaryConsent.DIARY_AI_CONSENT_SCOPE).toBe('diary_ai_reflection');
		expect(chatConsent.CHAT_AI_CONSENT_SCOPE).not.toBe(diaryConsent.DIARY_AI_CONSENT_SCOPE);
		expect(chatConsent.CHAT_AI_CONSENT_POLICY_VERSION).toBe('chat-ai-v1');
	});

	it('chatroute läser inte dagbokens consenthelper', () => {
		const source = readFileSync(new URL('./+server.ts', import.meta.url), 'utf8');

		expect(source).not.toContain('hasDiaryAiConsent');
	});

	it('migrationen vidgar scope-villkoret utan ny tabell', () => {
		const migration = readFileSync(
			new URL(
				'../../../../supabase/migrations/20260815064500_add_chat_ai_consent_scope.sql',
				import.meta.url
			),
			'utf8'
		);

		expect(migration).toContain('chat_ai_support');
		expect(migration).toContain('diary_ai_reflection');
		expect(migration).not.toMatch(/create table/i);
		expect(migration).not.toMatch(/drop table/i);
	});

	it('klienten skriver aldrig consenttabellen direkt', () => {
		const chatWindow = readFileSync(
			new URL('../../../lib/components/ChatWindow.svelte', import.meta.url),
			'utf8'
		);

		expect(chatWindow).not.toContain('user_ai_consents');
		expect(chatWindow).toContain("fetch('/api/consent/chat-ai'");
	});
});
