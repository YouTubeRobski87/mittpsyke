import { beforeEach, describe, expect, it, vi } from 'vitest';

// Gästgrinden i /api/chat. Inloggad väg (V3.2) täcks av chat-consent.test.ts;
// här bevakas att de två systemen aldrig auktoriserar varandra.

const mockEnv = vi.hoisted(() => ({
	env: {
		OPENAI_API_KEY: 'sk-test-key',
		SUPABASE_URL: 'https://example.supabase.co',
		SUPABASE_ANON_KEY: 'anon-key',
		CHAT_ANON_CONSENT_SECRET: 'a'.repeat(48)
	} as Record<string, string | undefined>
}));

const mocks = vi.hoisted(() => ({
	generateAIText: vi.fn(),
	createServiceClient: vi.fn(),
	hasChatAiConsent: vi.fn(),
	createClient: vi.fn()
}));

vi.mock('$env/dynamic/private', () => mockEnv);
vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
		PUBLIC_SUPABASE_ANON_KEY: 'anon-key'
	}
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
import {
	ANONYMOUS_CHAT_CONSENT_COOKIE,
	issueAnonymousChatConsentToken
} from '$lib/server/anonymous-chat-consent';
import { SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';

const SAFE_MESSAGE = 'Jag har haft en lite tung vecka och vill prata om det.';

function cookieJar(initial: Record<string, string> = {}) {
	const store = new Map(Object.entries(initial));
	return {
		get: (name: string) => store.get(name),
		set: () => {},
		delete: (name: string) => store.delete(name)
	};
}

let addressCounter = 0;

function callChat(
	options: {
		cookies?: ReturnType<typeof cookieJar>;
		headers?: HeadersInit;
		message?: string;
		authenticated?: boolean;
	} = {}
) {
	addressCounter += 1;
	const headers: HeadersInit = {
		'content-type': 'application/json',
		[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION,
		...(options.authenticated ? { authorization: 'Bearer access-token' } : {}),
		...options.headers
	};

	return chatPost({
		request: new Request('http://localhost/api/chat', {
			method: 'POST',
			headers,
			body: JSON.stringify({ message: options.message ?? SAFE_MESSAGE, category: 'A' })
		}),
		getClientAddress: () => `10.1.${Math.floor(addressCounter / 250)}.${(addressCounter % 250) + 1}`,
		cookies: options.cookies ?? cookieJar()
	} as unknown as Parameters<typeof chatPost>[0]);
}

function grantedCookie() {
	const { token } = issueAnonymousChatConsentToken();
	return cookieJar({ [ANONYMOUS_CHAT_CONSENT_COOKIE]: token });
}

describe('gästchatt: serververifierat samtycke', () => {
	beforeEach(() => {
		mockEnv.env.CHAT_ANON_CONSENT_SECRET = 'a'.repeat(48);
		mocks.generateAIText.mockReset();
		mocks.createServiceClient.mockReset();
		mocks.hasChatAiConsent.mockReset();
		mocks.createClient.mockReset();
		mocks.generateAIText.mockResolvedValue({ text: 'Det låter tungt. Vill du berätta mer?' });
	});

	it('giltig signerad cookie → leverantören anropas exakt en gång', async () => {
		const response = await callChat({ cookies: grantedCookie() });
		const payload = (await response.json()) as { mode?: string };

		expect(response.status).toBe(200);
		expect(payload.mode).toBe('guest');
		expect(mocks.generateAIText).toHaveBeenCalledTimes(1);
	});

	const blocked: { name: string; cookies: () => ReturnType<typeof cookieJar> }[] = [
		{ name: 'ingen cookie', cookies: () => cookieJar() },
		{
			name: 'manipulerad cookie',
			cookies: () => cookieJar({ [ANONYMOUS_CHAT_CONSENT_COOKIE]: 'aGVq.forfalskad' })
		},
		{
			name: 'utgången cookie',
			cookies: () =>
				cookieJar({
					[ANONYMOUS_CHAT_CONSENT_COOKIE]: issueAnonymousChatConsentToken({
						now: new Date(Date.now() - 48 * 60 * 60 * 1000)
					}).token
				})
		},
		{
			name: 'tom cookie',
			cookies: () => cookieJar({ [ANONYMOUS_CHAT_CONSENT_COOKIE]: '' })
		}
	];

	for (const testCase of blocked) {
		it(`${testCase.name} → 403 och inget leverantörsanrop`, async () => {
			const response = await callChat({ cookies: testCase.cookies() });
			const payload = (await response.json()) as { code?: string };

			expect(response.status).toBe(403);
			expect(payload.code).toBe('ANONYMOUS_CONSENT_REQUIRED');
			expect(mocks.generateAIText).not.toHaveBeenCalled();
		});
	}

	it('den gamla headern ensam auktoriserar inte gästchatt', async () => {
		const response = await callChat({
			cookies: cookieJar(),
			headers: { [SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION }
		});

		expect(response.status).toBe(403);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('återkallande: efter rensad cookie blockeras nästa request', async () => {
		const jar = grantedCookie();

		const before = await callChat({ cookies: jar });
		expect(before.status).toBe(200);
		expect(mocks.generateAIText).toHaveBeenCalledTimes(1);

		jar.delete(ANONYMOUS_CHAT_CONSENT_COOKIE);
		mocks.generateAIText.mockClear();

		const after = await callChat({ cookies: jar });

		expect(after.status).toBe(403);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('saknad hemlighet stänger gästchatten i stället för att öppna den', async () => {
		// Cookien utfärdas medan hemligheten finns, som i en deploy där nyckeln
		// försvinner efter att samtycket redan getts.
		const jar = grantedCookie();
		mockEnv.env.CHAT_ANON_CONSENT_SECRET = undefined;

		const response = await callChat({ cookies: jar });

		expect(response.status).toBe(500);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('krissvar levereras utan cookie och utan leverantörsanrop', async () => {
		const response = await callChat({
			cookies: cookieJar(),
			message: 'Jag vill inte leva längre.'
		});
		const payload = (await response.json()) as { crisis?: boolean; reply?: string };

		expect(response.status).toBe(200);
		expect(payload.crisis).toBe(true);
		expect(payload.reply).toBeTruthy();
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});
});

describe('isolation mellan anonymt och inloggat samtycke', () => {
	beforeEach(() => {
		mockEnv.env.CHAT_ANON_CONSENT_SECRET = 'a'.repeat(48);
		mocks.generateAIText.mockReset();
		mocks.createServiceClient.mockReset();
		mocks.hasChatAiConsent.mockReset();
		mocks.createClient.mockReset();
		mocks.generateAIText.mockResolvedValue({ text: 'svar' });
		mocks.createServiceClient.mockReturnValue({});
		mocks.createClient.mockReturnValue({
			auth: {
				getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
			},
			from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) }))
		});
	});

	it('A: anonym cookie auktoriserar inte en inloggad request', async () => {
		// Användaren har giltig anonym cookie men saknar chat_ai_support-rad.
		mocks.hasChatAiConsent.mockResolvedValue(false);

		const response = await callChat({ cookies: grantedCookie(), authenticated: true });

		expect(response.status).toBe(403);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('B: inloggad DB-consent auktoriserar inte en gästrequest', async () => {
		// Raden finns, men requesten saknar Authorization och cookie.
		mocks.hasChatAiConsent.mockResolvedValue(true);

		const response = await callChat({ cookies: cookieJar() });

		expect(response.status).toBe(403);
		expect(mocks.hasChatAiConsent).not.toHaveBeenCalled();
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('C: när båda finns väljs canonical state av autentiseringen, utan OR', async () => {
		mocks.hasChatAiConsent.mockResolvedValue(false);

		// Inloggad + anonym cookie → styrs av DB-raden, alltså blockerad.
		const authenticated = await callChat({ cookies: grantedCookie(), authenticated: true });
		expect(authenticated.status).toBe(403);

		// Samma cookie utan inloggning → styrs av cookien, alltså tillåten.
		mocks.generateAIText.mockClear();
		const guest = await callChat({ cookies: grantedCookie() });
		expect(guest.status).toBe(200);
		expect(mocks.generateAIText).toHaveBeenCalledTimes(1);
	});

	it('gästgrinden läser aldrig user_ai_consents', async () => {
		mocks.hasChatAiConsent.mockResolvedValue(true);

		await callChat({ cookies: grantedCookie() });

		expect(mocks.hasChatAiConsent).not.toHaveBeenCalled();
		expect(mocks.createServiceClient).not.toHaveBeenCalled();
	});

	it('källan har inga OR-villkor mellan de två systemen', async () => {
		const { readFileSync } = await import('node:fs');
		const source = readFileSync(new URL('./+server.ts', import.meta.url), 'utf8');

		expect(source).not.toMatch(/hasChatAiConsent[^\n]*\|\|[^\n]*hasValidAnonymousChatConsent/);
		expect(source).not.toMatch(/hasValidAnonymousChatConsent[^\n]*\|\|[^\n]*hasChatAiConsent/);
		// Anonym verifiering sker enbart i gästgrenen.
		const guestBranchIndex = source.indexOf('if (!token) {');
		const anonCheckIndex = source.indexOf('hasValidAnonymousChatConsent(');
		expect(anonCheckIndex).toBeGreaterThan(guestBranchIndex);
	});
});
