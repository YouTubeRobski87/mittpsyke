import { beforeEach, describe, expect, it, vi } from 'vitest';

// Sammanhängande regressionstest för återkallning av anonymt chattsamtycke.
//
// Befintliga tester täcker halvorna var för sig: consent-routen kontrollerar
// att cookies.delete anropas, och chattgrinden kontrollerar att en tom cookie
// ger 403. Ingen av dem kör den riktiga DELETE-handlern och /api/chat mot
// SAMMA cookie-jar, så en path- eller optionsmiss mellan grant och revoke hade
// gått igenom. Det här testet kopplar ihop dem.
//
// Sekvens: grant → chatt OK → revoke → chatt 403 → nytt grant → chatt OK.

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
vi.mock('$app/environment', () => ({ dev: false }));

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
	DELETE as consentDelete,
	GET as consentGet,
	POST as consentPost
} from '../consent/chat-ai/anonymous/+server';
import { ANONYMOUS_CHAT_CONSENT_COOKIE } from '$lib/server/anonymous-chat-consent';
import { SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';

const SAFE_MESSAGE = 'Jag har haft en tung vecka och skulle vilja prata om den.';

/**
 * Cookie-jar som beter sig som SvelteKits: set lagrar, delete tar bort, get
 * läser. Samma instans följer med genom hela sekvensen, precis som en
 * webbläsares cookiejar gör mellan requests.
 */
function browserJar() {
	const store = new Map<string, string>();
	return {
		get: (name: string) => store.get(name),
		set: (name: string, value: string) => store.set(name, value),
		delete: (name: string) => store.delete(name),
		raw: store
	};
}

let addressCounter = 0;

function consentEvent(jar: ReturnType<typeof browserJar>, method: string) {
	return {
		request: new Request('http://localhost/api/consent/chat-ai/anonymous', { method }),
		cookies: jar
	} as unknown as Parameters<typeof consentPost>[0];
}

function chatEvent(jar: ReturnType<typeof browserJar>) {
	addressCounter += 1;
	return {
		request: new Request('http://localhost/api/chat', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				// Den gamla headern skickas fortfarande av klienten. Den ska inte
				// påverka utfallet i något steg av sekvensen.
				[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
			},
			body: JSON.stringify({ message: SAFE_MESSAGE, category: 'A' })
		}),
		getClientAddress: () => `10.2.${Math.floor(addressCounter / 250)}.${(addressCounter % 250) + 1}`,
		cookies: jar
	} as unknown as Parameters<typeof chatPost>[0];
}

describe('anonym revoke: hela sekvensen genom de riktiga endpointsen', () => {
	beforeEach(() => {
		mockEnv.env.CHAT_ANON_CONSENT_SECRET = 'a'.repeat(48);
		mocks.generateAIText.mockReset();
		mocks.createServiceClient.mockReset();
		mocks.hasChatAiConsent.mockReset();
		mocks.createClient.mockReset();
		mocks.generateAIText.mockResolvedValue({ text: 'Det låter tungt. Vill du berätta mer?' });
	});

	it('grant → chatt → revoke → 403 → nytt grant → chatt', async () => {
		const jar = browserJar();

		// A. Grant.
		const grant = await consentPost(consentEvent(jar, 'POST'));
		expect(grant.status).toBe(200);
		expect(jar.raw.has(ANONYMOUS_CHAT_CONSENT_COOKIE)).toBe(true);

		const statusAfterGrant = (await (await consentGet(consentEvent(jar, 'GET'))).json()) as {
			status?: string;
		};
		expect(statusAfterGrant.status).toBe('granted');

		// B. Chatten accepterar cookien.
		const before = await chatPost(chatEvent(jar));
		expect(before.status).toBe(200);
		expect(mocks.generateAIText).toHaveBeenCalledTimes(1);

		// C. Revoke genom den riktiga DELETE-handlern.
		const revoke = await consentDelete(consentEvent(jar, 'DELETE'));
		const revokeBody = (await revoke.json()) as { status?: string };
		expect(revoke.status).toBe(200);
		expect(revokeBody.status).toBe('revoked');

		// Cookien är faktiskt borta ur jaren, inte bara markerad.
		expect(jar.raw.has(ANONYMOUS_CHAT_CONSENT_COOKIE)).toBe(false);

		const statusAfterRevoke = (await (await consentGet(consentEvent(jar, 'GET'))).json()) as {
			status?: string;
		};
		expect(statusAfterRevoke.status).toBe('missing');

		// D-F. Nästa vanliga chattrequest blockeras, utan provideranrop.
		mocks.generateAIText.mockClear();
		const after = await chatPost(chatEvent(jar));
		const afterBody = (await after.json()) as { code?: string };

		expect(after.status).toBe(403);
		expect(afterBody.code).toBe('ANONYMOUS_CONSENT_REQUIRED');
		expect(mocks.generateAIText).not.toHaveBeenCalled();

		// Nytt uttryckligt godkännande krävs - och räcker.
		const regrant = await consentPost(consentEvent(jar, 'POST'));
		expect(regrant.status).toBe(200);

		const afterRegrant = await chatPost(chatEvent(jar));
		expect(afterRegrant.status).toBe(200);
		expect(mocks.generateAIText).toHaveBeenCalledTimes(1);
	});

	it('upprepad revoke är ofarlig och håller chatten stängd', async () => {
		const jar = browserJar();
		await consentPost(consentEvent(jar, 'POST'));

		await consentDelete(consentEvent(jar, 'DELETE'));
		const second = await consentDelete(consentEvent(jar, 'DELETE'));

		expect(second.status).toBe(200);
		mocks.generateAIText.mockClear();

		const chat = await chatPost(chatEvent(jar));
		expect(chat.status).toBe(403);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('revoke fungerar även om signeringsnyckeln försvunnit', async () => {
		const jar = browserJar();
		await consentPost(consentEvent(jar, 'POST'));

		// Nyckeln tas bort efter att samtycket getts, som vid en felaktig deploy.
		mockEnv.env.CHAT_ANON_CONSENT_SECRET = undefined;

		const revoke = await consentDelete(consentEvent(jar, 'DELETE'));

		expect(revoke.status).toBe(200);
		expect(jar.raw.has(ANONYMOUS_CHAT_CONSENT_COOKIE)).toBe(false);
	});

	it('grant och revoke använder samma cookie-namn och path', async () => {
		const setCalls: { name: string; options: Record<string, unknown> }[] = [];
		const deleteCalls: { name: string; options: Record<string, unknown> }[] = [];
		const jar = {
			get: () => undefined,
			set: (name: string, _value: string, options: Record<string, unknown>) =>
				setCalls.push({ name, options }),
			delete: (name: string, options: Record<string, unknown>) =>
				deleteCalls.push({ name, options })
		} as unknown as ReturnType<typeof browserJar>;

		await consentPost(consentEvent(jar, 'POST'));
		await consentDelete(consentEvent(jar, 'DELETE'));

		expect(setCalls[0].name).toBe(deleteCalls[0].name);
		expect(setCalls[0].options.path).toBe(deleteCalls[0].options.path);
		expect(setCalls[0].options.path).toBe('/');
		// httpOnly, sameSite och secure måste matcha, annars kan webbläsaren
		// behålla en cookie som servern tror är borttagen.
		for (const key of ['httpOnly', 'sameSite', 'secure'] as const) {
			expect(setCalls[0].options[key]).toBe(deleteCalls[0].options[key]);
		}
	});

	it('varken grant eller revoke läcker tokenvärdet i svaret', async () => {
		const jar = browserJar();

		const grantBody = await (await consentPost(consentEvent(jar, 'POST'))).text();
		const token = jar.raw.get(ANONYMOUS_CHAT_CONSENT_COOKIE) ?? '';
		const revokeBody = await (await consentDelete(consentEvent(jar, 'DELETE'))).text();

		expect(token.length).toBeGreaterThan(0);
		expect(grantBody).not.toContain(token);
		expect(revokeBody).not.toContain(token);
	});
});

describe('isolation vid återkallning', () => {
	beforeEach(() => {
		mockEnv.env.CHAT_ANON_CONSENT_SECRET = 'a'.repeat(48);
		mocks.generateAIText.mockReset();
		mocks.createServiceClient.mockReset();
		mocks.hasChatAiConsent.mockReset();
		mocks.createClient.mockReset();
		mocks.generateAIText.mockResolvedValue({ text: 'svar' });
		mocks.createServiceClient.mockReturnValue({});
	});

	it('anonym revoke rör aldrig user_ai_consents', async () => {
		const jar = browserJar();
		await consentPost(consentEvent(jar, 'POST'));
		await consentDelete(consentEvent(jar, 'DELETE'));

		expect(mocks.createServiceClient).not.toHaveBeenCalled();
		expect(mocks.hasChatAiConsent).not.toHaveBeenCalled();
	});

	it('en giltig anonym cookie auktoriserar inte en inloggad request', async () => {
		mocks.hasChatAiConsent.mockResolvedValue(false);
		mocks.createClient.mockReturnValue({
			auth: {
				getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
			},
			from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) }))
		});

		const jar = browserJar();
		await consentPost(consentEvent(jar, 'POST'));

		const event = chatEvent(jar);
		event.request.headers.set('authorization', 'Bearer access-token');
		const response = await chatPost({
			...event,
			request: new Request(event.request, {
				headers: new Headers([
					...event.request.headers,
					['authorization', 'Bearer access-token']
				])
			})
		} as unknown as Parameters<typeof chatPost>[0]);

		expect(response.status).toBe(403);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('inloggat DB-samtycke auktoriserar inte en gäst utan cookie', async () => {
		mocks.hasChatAiConsent.mockResolvedValue(true);

		const response = await chatPost(chatEvent(browserJar()));

		expect(response.status).toBe(403);
		expect(mocks.hasChatAiConsent).not.toHaveBeenCalled();
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});
});
