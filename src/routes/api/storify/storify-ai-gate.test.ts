// Provider-gränsen för Storify. Testet bevisar att varken /generate eller /chat
// når Anthropic utan ett giltigt diary_ai_storify-samtycke.
//
// global.fetch är stubbad, så inget riktigt AI-anrop görs och ingen nyckel
// behöver finnas. Databasen är fejkklienten som modellerar tabellen med sina
// constraints. Ingen produktionsanvändare och ingen riktig text är inblandad -
// testtexten nedan är avsiktligt innehållslös.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakeConsentDb } from '$lib/server/__fixtures__/fake-consent-db';

const USER = '11111111-1111-4111-8111-111111111111';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const mocks = vi.hoisted(() => ({
	createServiceClient: vi.fn(),
	createTokenClient: vi.fn(),
	createClient: vi.fn()
}));

vi.mock('$lib/server/supabase-admin', () => ({
	createServiceClient: mocks.createServiceClient,
	createTokenClient: mocks.createTokenClient
}));

vi.mock('@supabase/supabase-js', () => ({
	createClient: mocks.createClient
}));

vi.mock('$env/dynamic/private', () => ({
	env: { STORIFY_API_KEY: 'test-key-not-a-real-secret' }
}));

vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
		PUBLIC_SUPABASE_ANON_KEY: 'anon-key'
	}
}));

import { POST as generatePOST } from './generate/+server';
import { POST as chatPOST } from './chat/+server';

let db: ReturnType<typeof createFakeConsentDb>;
let fetchSpy: ReturnType<typeof vi.fn>;

/** Ofarlig, innehållslös testtext. Inga personuppgifter. */
const HARMLESS_TRANSCRIPT = 'testinnehåll utan personuppgifter';

// De två routerna har olika RouteParams-typer, så eventet castas per anropsplats.
function requestEvent(body: unknown, withAuth = true) {
	return {
		request: new Request('http://localhost/api/storify/x', {
			method: 'POST',
			headers: withAuth
				? { authorization: 'Bearer access-token', 'content-type': 'application/json' }
				: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		})
	};
}

const generateRequest = (body: unknown, withAuth = true) =>
	requestEvent(body, withAuth) as unknown as Parameters<typeof generatePOST>[0];

const chatRequest = (body: unknown, withAuth = true) =>
	requestEvent(body, withAuth) as unknown as Parameters<typeof chatPOST>[0];

function anthropicCalls() {
	return fetchSpy.mock.calls.filter(([url]) => String(url).includes('api.anthropic.com'));
}

beforeEach(() => {
	db = createFakeConsentDb();

	fetchSpy = vi.fn().mockResolvedValue(
		new Response(
			JSON.stringify({ content: [{ type: 'text', text: 'stubbat svar' }] }),
			{ status: 200, headers: { 'content-type': 'application/json' } }
		)
	);
	vi.stubGlobal('fetch', fetchSpy);

	const auth = {
		auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER } }, error: null }) }
	};
	mocks.createServiceClient.mockReset().mockReturnValue(db.client);
	mocks.createTokenClient.mockReset().mockReturnValue(auth);
	mocks.createClient.mockReset().mockReturnValue(auth);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('/api/storify/generate når inte AI utan samtycke', () => {
	it('svarar 403 och anropar aldrig providern', async () => {
		const response = await generatePOST(
			generateRequest({ chatTranscript: HARMLESS_TRANSCRIPT, selectedTone: 'therapist' })
		);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: 'Samtycke krävs för AI-funktionen.' });
		expect(anthropicCalls()).toHaveLength(0);
	});

	it('svarar 401 utan token och anropar aldrig providern', async () => {
		const response = await generatePOST(
			generateRequest({ chatTranscript: HARMLESS_TRANSCRIPT }, false)
		);

		expect(response.status).toBe(401);
		expect(anthropicCalls()).toHaveLength(0);
	});

	it('når providern först när samtycket finns', async () => {
		await db.client
			.from('user_ai_consents')
			.upsert(
				{
					user_id: USER,
					scope: 'diary_ai_storify',
					status: 'granted',
					policy_version: 'diary-storify-v1',
					granted_at: new Date().toISOString(),
					revoked_at: null,
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'user_id,scope' }
			);

		const response = await generatePOST(
			generateRequest({ chatTranscript: HARMLESS_TRANSCRIPT, selectedTone: 'therapist' })
		);

		expect(response.status).toBe(200);
		expect(anthropicCalls()).toHaveLength(1);
		expect(anthropicCalls()[0][0]).toBe(ANTHROPIC_URL);
	});

	it('slutar nå providern igen efter återkallelse', async () => {
		const { revokeStorifyAiConsent, grantStorifyAiConsent } = await import(
			'$lib/server/storify-ai-consent'
		);
		await grantStorifyAiConsent(db.client, USER);
		await revokeStorifyAiConsent(db.client, USER);

		const response = await generatePOST(
			generateRequest({ chatTranscript: HARMLESS_TRANSCRIPT, selectedTone: 'therapist' })
		);

		expect(response.status).toBe(403);
		expect(anthropicCalls()).toHaveLength(0);
	});

	it('når inte providern när samtycket gäller ett annat scope', async () => {
		const { grantAiConsent } = await import('$lib/server/ai-consent');
		await grantAiConsent(db.client, USER, 'chat_ai_support', 'chat-ai-v1');

		const response = await generatePOST(
			generateRequest({ chatTranscript: HARMLESS_TRANSCRIPT, selectedTone: 'therapist' })
		);

		expect(response.status).toBe(403);
		expect(anthropicCalls()).toHaveLength(0);
	});

	it('når inte providern när consent-läsningen misslyckas', async () => {
		const { grantStorifyAiConsent } = await import('$lib/server/storify-ai-consent');
		await grantStorifyAiConsent(db.client, USER);
		db.failRead();

		const response = await generatePOST(
			generateRequest({ chatTranscript: HARMLESS_TRANSCRIPT, selectedTone: 'therapist' })
		);

		expect(response.status).toBe(403);
		expect(anthropicCalls()).toHaveLength(0);
	});
});

describe('/api/storify/chat når inte AI utan samtycke', () => {
	const messages = [{ role: 'user', content: HARMLESS_TRANSCRIPT }];

	it('svarar 403 och anropar aldrig providern', async () => {
		const response = await chatPOST(chatRequest({ messages }));

		expect(response.status).toBe(403);
		expect(anthropicCalls()).toHaveLength(0);
	});

	it('svarar 401 utan token och anropar aldrig providern', async () => {
		const response = await chatPOST(chatRequest({ messages }, false));

		expect(response.status).toBe(401);
		expect(anthropicCalls()).toHaveLength(0);
	});

	it('slutar nå providern igen efter återkallelse', async () => {
		const { grantStorifyAiConsent, revokeStorifyAiConsent } = await import(
			'$lib/server/storify-ai-consent'
		);
		await grantStorifyAiConsent(db.client, USER);
		await revokeStorifyAiConsent(db.client, USER);

		const response = await chatPOST(chatRequest({ messages }));

		expect(response.status).toBe(403);
		expect(anthropicCalls()).toHaveLength(0);
	});
});
