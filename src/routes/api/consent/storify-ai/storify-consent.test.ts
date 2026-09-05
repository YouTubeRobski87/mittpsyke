// End-to-end genom HTTP-handlern för /api/consent/storify-ai.
//
// Bara två saker är mockade: auth (createTokenClient/locals.supabase) och
// databasen (createServiceClient → fejkklienten som modellerar tabellen med
// sina constraints). Consent-modulen och ai-consent-kärnan körs på riktigt, så
// testet bevisar hela kedjan route → storify-ai-consent → ai-consent → tabell
// utan att röra en produktionsanvändare.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakeConsentDb } from '$lib/server/__fixtures__/fake-consent-db';

const USER = '11111111-1111-4111-8111-111111111111';

const mocks = vi.hoisted(() => ({
	createServiceClient: vi.fn(),
	createTokenClient: vi.fn()
}));

vi.mock('$lib/server/supabase-admin', () => ({
	createServiceClient: mocks.createServiceClient,
	createTokenClient: mocks.createTokenClient
}));

import { DELETE, GET, POST } from './+server';

type Handler = typeof POST;

/** Inloggad begäran. `body` finns bara för att bevisa att den ignoreras. */
function authed(method: string, body?: string) {
	return {
		request: new Request('http://localhost/api/consent/storify-ai', {
			method,
			headers: { authorization: 'Bearer access-token' },
			...(body === undefined ? {} : { body, headers: { authorization: 'Bearer access-token', 'content-type': 'application/json' } })
		}),
		locals: { supabase: null }
	} as unknown as Parameters<Handler>[0];
}

/** Ingen Authorization-header och ingen session i locals. */
function anonymous(method: string) {
	return {
		request: new Request('http://localhost/api/consent/storify-ai', { method }),
		locals: {
			supabase: {
				auth: {
					getUser: vi
						.fn()
						.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } })
				}
			}
		}
	} as unknown as Parameters<Handler>[0];
}

let db: ReturnType<typeof createFakeConsentDb>;

beforeEach(() => {
	db = createFakeConsentDb([
		{
			user_id: USER,
			scope: 'chat_ai_support',
			status: 'granted',
			policy_version: 'chat-ai-v1',
			granted_at: '2026-09-01T10:00:00.000Z',
			revoked_at: null,
			updated_at: '2026-09-01T10:00:00.000Z'
		}
	]);
	mocks.createServiceClient.mockReset();
	mocks.createTokenClient.mockReset();
	mocks.createServiceClient.mockReturnValue(db.client);
	mocks.createTokenClient.mockReturnValue({
		auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: USER } }, error: null }) }
	});
});

describe('utan giltig auth', () => {
	it('nekar GET med 401', async () => {
		const response = await GET(anonymous('GET') as Parameters<typeof GET>[0]);
		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'Unauthorized.' });
	});

	it('nekar POST med 401 och skriver ingenting', async () => {
		const response = await POST(anonymous('POST'));
		expect(response.status).toBe(401);
		expect(db.find(USER, 'diary_ai_storify')).toBeNull();
	});

	it('nekar DELETE med 401', async () => {
		const response = await DELETE(anonymous('DELETE') as Parameters<typeof DELETE>[0]);
		expect(response.status).toBe(401);
	});

	it('nekar en påhittad bearer-token', async () => {
		mocks.createTokenClient.mockReturnValue({
			auth: {
				getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'bad jwt' } })
			}
		});

		const response = await POST(authed('POST'));
		expect(response.status).toBe(401);
		expect(db.find(USER, 'diary_ai_storify')).toBeNull();
	});
});

describe('hela livscykeln genom routen', () => {
	it('kör GET → POST → GET → DELETE → GET med rätt svar i varje steg', async () => {
		const before = await GET(authed('GET') as Parameters<typeof GET>[0]);
		expect(before.status).toBe(200);
		expect(await before.json()).toEqual({
			status: 'missing',
			policyVersion: 'diary-storify-v1'
		});

		const grant = await POST(authed('POST'));
		expect(grant.status).toBe(200);
		expect(await grant.json()).toEqual({
			status: 'granted',
			policyVersion: 'diary-storify-v1'
		});

		const afterGrant = await GET(authed('GET') as Parameters<typeof GET>[0]);
		expect(await afterGrant.json()).toEqual({
			status: 'granted',
			policyVersion: 'diary-storify-v1'
		});

		const revoke = await DELETE(authed('DELETE') as Parameters<typeof DELETE>[0]);
		expect(revoke.status).toBe(200);
		expect(await revoke.json()).toEqual({
			status: 'revoked',
			policyVersion: 'diary-storify-v1'
		});

		// GET rapporterar ja/nej, inte radens status. En återkallad rad är inget
		// samtycke och ska därför läsas som "missing".
		const afterRevoke = await GET(authed('GET') as Parameters<typeof GET>[0]);
		expect(await afterRevoke.json()).toEqual({
			status: 'missing',
			policyVersion: 'diary-storify-v1'
		});
	});

	it('skriver raden med rätt scope, status, policyversion och tidsstämplar', async () => {
		await POST(authed('POST'));
		const granted = db.find(USER, 'diary_ai_storify')!;
		expect(granted.scope).toBe('diary_ai_storify');
		expect(granted.status).toBe('granted');
		expect(granted.policy_version).toBe('diary-storify-v1');
		expect(granted.revoked_at).toBeNull();

		await DELETE(authed('DELETE') as Parameters<typeof DELETE>[0]);
		const revoked = db.find(USER, 'diary_ai_storify')!;
		expect(revoked.status).toBe('revoked');
		expect(revoked.revoked_at).not.toBeNull();
		expect(revoked.granted_at).toBe(granted.granted_at);
	});

	it('lämnar övriga scopes orörda', async () => {
		const before = db.snapshotExcept('diary_ai_storify');
		await POST(authed('POST'));
		await DELETE(authed('DELETE') as Parameters<typeof DELETE>[0]);
		expect(db.snapshotExcept('diary_ai_storify')).toBe(before);
	});
});

describe('klienten kan inte styra servervärdena', () => {
	// Routen läser aldrig request-kroppen. Fälten nedan finns bara för att visa
	// att de inte har någon väg in i skrivningen.
	const forged = JSON.stringify({
		scope: 'chat_ai_support',
		policyVersion: 'forged-version',
		policy_version: 'forged-version',
		user_id: '99999999-9999-4999-8999-999999999999',
		status: 'granted'
	});

	it('ignorerar scope och policyVersion i bodyn vid grant', async () => {
		const response = await POST(authed('POST', forged));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			status: 'granted',
			policyVersion: 'diary-storify-v1'
		});

		const row = db.find(USER, 'diary_ai_storify')!;
		expect(row.scope).toBe('diary_ai_storify');
		expect(row.policy_version).toBe('diary-storify-v1');
		expect(row.user_id).toBe(USER);
		expect(db.find('99999999-9999-4999-8999-999999999999', 'diary_ai_storify')).toBeNull();
	});

	it('ignorerar bodyn vid revoke och rör inte det förfalskade scopet', async () => {
		await POST(authed('POST'));
		const chatBefore = { ...db.find(USER, 'chat_ai_support')! };

		await DELETE(authed('DELETE', forged) as Parameters<typeof DELETE>[0]);

		expect(db.find(USER, 'chat_ai_support')).toEqual(chatBefore);
		expect(db.find(USER, 'diary_ai_storify')!.status).toBe('revoked');
	});

	it('påverkas inte av trasig JSON i bodyn', async () => {
		const response = await POST(authed('POST', '{not valid json'));
		expect(response.status).toBe(200);
		expect(db.find(USER, 'diary_ai_storify')!.policy_version).toBe('diary-storify-v1');
	});
});

describe('failar stängt vid serverfel', () => {
	it('svarar 500 när service role-klienten saknas', async () => {
		mocks.createServiceClient.mockReturnValue(null);
		for (const handler of [GET, POST, DELETE]) {
			const response = await (handler as Handler)(authed('POST'));
			expect(response.status).toBe(500);
		}
	});

	it('påstår inte att ett samtycke sparats när skrivningen misslyckas', async () => {
		db.failWrite();
		const response = await POST(authed('POST'));
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: 'Kunde inte spara samtycket just nu.' });
		expect(db.find(USER, 'diary_ai_storify')).toBeNull();
	});

	it('påstår inte att en återkallelse lyckats när skrivningen misslyckas', async () => {
		await POST(authed('POST'));
		db.failWrite();
		const response = await DELETE(authed('DELETE') as Parameters<typeof DELETE>[0]);
		expect(response.status).toBe(500);
		expect(db.find(USER, 'diary_ai_storify')!.status).toBe('granted');
	});

	it('rapporterar inget samtycke när läsningen misslyckas', async () => {
		await POST(authed('POST'));
		db.failRead();
		const response = await GET(authed('GET') as Parameters<typeof GET>[0]);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			status: 'missing',
			policyVersion: 'diary-storify-v1'
		});
	});
});
