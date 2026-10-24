import OpenAI from 'openai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Produktionsfelet efter omstarten: chatten svarade "Tjänsten är hårt
// belastad" utan att det var verifierat att något var belastat. OpenAI ger
// HTTP 429 även när kvoten eller faktureringen är slut, och den tidigare
// mappningen gjorde om varje 429 till "belastad" och loggade bara
// code: 'rate_limit'. Här körs routen för gäst och inloggad med syntetiska
// leverantörsfel - inga live-anrop, inga riktiga användardata.

const mockEnv = vi.hoisted(() => ({
	env: {} as Record<string, string | undefined>
}));

const mocks = vi.hoisted(() => ({
	generateAIText: vi.fn(),
	createServiceClient: vi.fn(),
	hasChatAiConsent: vi.fn(),
	createClient: vi.fn()
}));

vi.mock('$env/dynamic/private', () => mockEnv);
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_SUPABASE_URL: 'https://example.supabase.co', PUBLIC_SUPABASE_ANON_KEY: 'anon-key' }
}));
vi.mock('$lib/server/ai/text-generation', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/ai/text-generation')>();
	return { ...actual, generateAIText: mocks.generateAIText };
});
vi.mock('$lib/server/supabase-admin', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/supabase-admin')>();
	return { ...actual, createServiceClient: mocks.createServiceClient };
});
vi.mock('$lib/server/chat-ai-consent', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/chat-ai-consent')>();
	return { ...actual, hasChatAiConsent: mocks.hasChatAiConsent };
});
vi.mock('@supabase/supabase-js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@supabase/supabase-js')>();
	return { ...actual, createClient: mocks.createClient };
});

import { POST as chatPost } from './+server';
import { normalizeOpenAIError } from '$lib/server/ai/providers/openai-text-provider';
import { ANONYMOUS_CHAT_CONSENT_COOKIE, issueAnonymousChatConsentToken } from '$lib/server/anonymous-chat-consent';
import { SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';

const USER_TEXT = 'Jag vill bara skriva av mig';
const OVERLOADED = 'Tjänsten är hårt belastad just nu. Vänta en liten stund och försök igen.';
const PROVIDER_SECRET_TEXT = 'You exceeded your current quota, key sk-proj-hemlig';

function cookieJar(initial: Record<string, string> = {}) {
	const store = new Map(Object.entries(initial));
	return { get: (name: string) => store.get(name), set: () => {}, delete: (name: string) => store.delete(name) };
}

/** Minimal inloggad Supabase-klient: konversation, tom historik, sparade meddelanden. */
function authClient(user: { id: string } | null) {
	const ok = { error: null };
	const from = vi.fn((table: string) => {
		if (table === 'conversations') {
			return {
				insert: vi.fn(() => ({
					select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: 'conversation-1' }, error: null }) }))
				}))
			};
		}
		if (table === 'messages') {
			const history = { order: vi.fn(() => history), limit: vi.fn().mockResolvedValue({ data: [], error: null }) };
			return { insert: vi.fn().mockResolvedValue(ok), select: vi.fn(() => ({ eq: vi.fn(() => history) })) };
		}
		return {
			insert: vi.fn().mockResolvedValue(ok),
			upsert: vi.fn().mockResolvedValue(ok),
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
		auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: user ? null : new Error('invalid token') }) },
		from
	};
}

let address = 0;
type Who = 'gäst' | 'inloggad';

function callChat(who: Who, options: { cookies?: ReturnType<typeof cookieJar> } = {}) {
	address += 1;
	const cookies =
		options.cookies ??
		(who === 'gäst'
			? cookieJar({ [ANONYMOUS_CHAT_CONSENT_COOKIE]: issueAnonymousChatConsentToken().token })
			: cookieJar());
	return chatPost({
		request: new Request('http://localhost/api/chat', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION,
				...(who === 'inloggad' ? { authorization: 'Bearer access-token' } : {})
			},
			body: JSON.stringify({ message: USER_TEXT, category: 'G' })
		}),
		getClientAddress: () => `10.9.${Math.floor(address / 250)}.${(address % 250) + 1}`,
		cookies
	} as unknown as Parameters<typeof chatPost>[0]);
}

function sdkError(status: number, code: string) {
	// Samma form som OpenAI:s svarskropp: { error: { code, type, message } }.
	return OpenAI.APIError.generate(
		status,
		{ error: { code, type: code, message: PROVIDER_SECRET_TEXT } },
		PROVIDER_SECRET_TEXT,
		{}
	);
}

/** Samma kedja som produktionen: leverantörens fel normaliseras av adaptern. */
function providerFails(error: unknown) {
	mocks.generateAIText.mockRejectedValue(normalizeOpenAIError(error));
}

let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	mockEnv.env = {
		OPENAI_API_KEY: 'sk-test-key',
		SUPABASE_URL: 'https://example.supabase.co',
		SUPABASE_ANON_KEY: 'anon-key',
		SUPABASE_SERVICE_ROLE_KEY: 'service-key',
		CHAT_ANON_CONSENT_SECRET: 'a'.repeat(48)
	};
	for (const mock of Object.values(mocks)) mock.mockReset();
	mocks.createClient.mockReturnValue(authClient({ id: 'user-1' }));
	mocks.createServiceClient.mockReturnValue({});
	mocks.hasChatAiConsent.mockResolvedValue(true);
	mocks.generateAIText.mockResolvedValue({ text: 'Skriv gärna, jag finns här.' });
	logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	logSpy.mockRestore();
});

function loggedText() {
	return JSON.stringify(logSpy.mock.calls);
}

for (const who of ['gäst', 'inloggad'] as const) {
	describe(`/api/chat leverantörsfel – ${who}`, () => {
		it('lyckat svar → 200 med svaret', async () => {
			const response = await callChat(who);
			expect(response.status).toBe(200);
			expect((await response.json()).reply).toBe('Skriv gärna, jag finns här.');
			expect(mocks.generateAIText).toHaveBeenCalledTimes(1);
		});

		it('slut på kvot (429 insufficient_quota) → 503 utan påstådd överbelastning', async () => {
			providerFails(sdkError(429, 'insufficient_quota'));
			const response = await callChat(who);
			const body = await response.json();

			expect(response.status).toBe(503);
			expect(body.error).not.toBe(OVERLOADED);
			expect(body.error).toBe('Chatten är tillfälligt otillgänglig. Försök gärna igen senare.');
			expect(JSON.stringify(body)).not.toMatch(/quota|openai|sk-/i);
			expect(mocks.generateAIText).toHaveBeenCalledTimes(1);
		});

		it('verklig hastighetsbegränsning (429 rate_limit_exceeded) → 503 och belastningstexten', async () => {
			providerFails(sdkError(429, 'rate_limit_exceeded'));
			const response = await callChat(who);
			expect(response.status).toBe(503);
			expect((await response.json()).error).toBe(OVERLOADED);
		});

		it('ogiltig nyckel (401), leverantörsavbrott (503) och nätverksfel → 500, aldrig belastningstexten', async () => {
			for (const error of [
				sdkError(401, 'invalid_api_key'),
				sdkError(503, 'server_error'),
				new OpenAI.APIConnectionError({ message: 'ECONNRESET' })
			]) {
				providerFails(error);
				const response = await callChat(who);
				const body = await response.json();
				expect(response.status).toBe(500);
				expect(body.error).not.toBe(OVERLOADED);
				expect(JSON.stringify(body)).not.toMatch(/invalid_api_key|server_error|ECONNRESET|sk-/);
			}
		});

		it('timeout → 504', async () => {
			providerFails(new OpenAI.APIConnectionTimeoutError());
			expect((await callChat(who)).status).toBe(504);
		});

		it('loggar leverantörens status och felkod men aldrig meddelandet eller råtext', async () => {
			providerFails(sdkError(429, 'insufficient_quota'));
			await callChat(who);
			const logs = loggedText();

			expect(logs).toContain('"providerStatus":429');
			expect(logs).toContain('"providerCode":"insufficient_quota"');
			expect(logs).not.toContain(USER_TEXT);
			expect(logs).not.toMatch(/sk-proj|You exceeded/);
		});

		it('saknad OPENAI_API_KEY → 500 och inget leverantörsanrop', async () => {
			mockEnv.env.OPENAI_API_KEY = '';
			const response = await callChat(who);
			expect(response.status).toBe(500);
			expect(mocks.generateAIText).not.toHaveBeenCalled();
		});
	});
}

describe('/api/chat sessions- och samtyckesfel stoppas före leverantören', () => {
	it('ogiltig session → 401', async () => {
		mocks.createClient.mockReturnValue(authClient(null));
		expect((await callChat('inloggad')).status).toBe(401);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('inloggad utan samtycke → 403', async () => {
		mocks.hasChatAiConsent.mockResolvedValue(false);
		expect((await callChat('inloggad')).status).toBe(403);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('gäst utan samtycke → 403', async () => {
		expect((await callChat('gäst', { cookies: cookieJar() })).status).toBe(403);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});
});
