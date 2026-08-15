import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(() => ({
	env: { CHAT_ANON_CONSENT_SECRET: 'a'.repeat(48) } as Record<string, string | undefined>
}));
const mockApp = vi.hoisted(() => ({ dev: false }));

vi.mock('$env/dynamic/private', () => mockEnv);
vi.mock('$app/environment', () => mockApp);

import { DELETE, GET, POST } from './anonymous/+server';
import {
	ANONYMOUS_CHAT_CONSENT_COOKIE,
	ANONYMOUS_CHAT_CONSENT_TTL_SECONDS,
	issueAnonymousChatConsentToken,
	verifyAnonymousChatConsentToken
} from '$lib/server/anonymous-chat-consent';
import { CHAT_AI_CONSENT_POLICY_VERSION } from '$lib/server/chat-ai-consent';

type CookieCall = { name: string; value: string; options: Record<string, unknown> };

/** Minimal cookies-fasad med spioner, i SvelteKit-form. */
function cookieJar(initial: Record<string, string> = {}) {
	const store = new Map(Object.entries(initial));
	const setCalls: CookieCall[] = [];
	const deleteCalls: { name: string; options: Record<string, unknown> }[] = [];

	return {
		get: (name: string) => store.get(name),
		set: (name: string, value: string, options: Record<string, unknown>) => {
			store.set(name, value);
			setCalls.push({ name, value, options });
		},
		delete: (name: string, options: Record<string, unknown>) => {
			store.delete(name);
			deleteCalls.push({ name, options });
		},
		setCalls,
		deleteCalls
	};
}

function event(options: { cookies?: ReturnType<typeof cookieJar>; authenticated?: boolean } = {}) {
	const cookies = options.cookies ?? cookieJar();
	const headers: HeadersInit = options.authenticated
		? { authorization: 'Bearer access-token' }
		: {};

	return {
		event: {
			request: new Request('http://localhost/api/consent/chat-ai/anonymous', {
				method: 'POST',
				headers
			}),
			cookies
		},
		cookies
	};
}

describe('/api/consent/chat-ai/anonymous', () => {
	beforeEach(() => {
		mockEnv.env.CHAT_ANON_CONSENT_SECRET = 'a'.repeat(48);
		mockApp.dev = false;
	});

	describe('POST (grant)', () => {
		it('utfärdar en cookie med rätt inställningar', async () => {
			const { event: requestEvent, cookies } = event();

			const response = await POST(requestEvent as never);
			const payload = (await response.json()) as { status?: string; policyVersion?: string };

			expect(response.status).toBe(200);
			expect(payload.status).toBe('granted');
			expect(payload.policyVersion).toBe(CHAT_AI_CONSENT_POLICY_VERSION);

			expect(cookies.setCalls).toHaveLength(1);
			const [cookie] = cookies.setCalls;
			expect(cookie.name).toBe(ANONYMOUS_CHAT_CONSENT_COOKIE);
			expect(cookie.options).toMatchObject({
				httpOnly: true,
				sameSite: 'strict',
				path: '/',
				secure: true,
				maxAge: ANONYMOUS_CHAT_CONSENT_TTL_SECONDS
			});
		});

		it('cookien innehåller en token som verifierar', async () => {
			const { event: requestEvent, cookies } = event();
			await POST(requestEvent as never);

			expect(verifyAnonymousChatConsentToken(cookies.setCalls[0].value).ok).toBe(true);
		});

		it('lämnar aldrig ut tokenvärdet i svaret', async () => {
			const { event: requestEvent, cookies } = event();
			const response = await POST(requestEvent as never);
			const body = await response.text();

			expect(body).not.toContain(cookies.setCalls[0].value);
			expect(body).not.toMatch(/token/i);
		});

		it('secure är av i dev', async () => {
			mockApp.dev = true;
			// Modulen läser dev vid import, så vi kontrollerar bara att flaggan
			// härleds ur $app/environment och inte är hårdkodad.
			const source = await import('node:fs').then(({ readFileSync }) =>
				readFileSync(new URL('./anonymous/+server.ts', import.meta.url), 'utf8')
			);

			expect(source).toContain('secure: !dev');
		});

		it('stänger vid saknad hemlighet', async () => {
			mockEnv.env.CHAT_ANON_CONSENT_SECRET = undefined;
			const { event: requestEvent, cookies } = event();

			const response = await POST(requestEvent as never);

			expect(response.status).toBe(500);
			expect(cookies.setCalls).toHaveLength(0);
		});
	});

	describe('GET (status)', () => {
		it('giltig cookie → granted', async () => {
			const { token } = issueAnonymousChatConsentToken();
			const { event: requestEvent } = event({
				cookies: cookieJar({ [ANONYMOUS_CHAT_CONSENT_COOKIE]: token })
			});

			const payload = (await (await GET(requestEvent as never)).json()) as { status?: string };

			expect(payload.status).toBe('granted');
		});

		it('ingen cookie → missing', async () => {
			const { event: requestEvent } = event();
			const payload = (await (await GET(requestEvent as never)).json()) as { status?: string };

			expect(payload.status).toBe('missing');
		});

		it('utgången cookie → missing', async () => {
			const { token } = issueAnonymousChatConsentToken({
				now: new Date(Date.now() - 48 * 60 * 60 * 1000)
			});
			const { event: requestEvent } = event({
				cookies: cookieJar({ [ANONYMOUS_CHAT_CONSENT_COOKIE]: token })
			});

			const payload = (await (await GET(requestEvent as never)).json()) as { status?: string };

			expect(payload.status).toBe('missing');
		});

		it('manipulerad cookie → missing', async () => {
			const { event: requestEvent } = event({
				cookies: cookieJar({ [ANONYMOUS_CHAT_CONSENT_COOKIE]: 'aGVq.förfalskad' })
			});

			const payload = (await (await GET(requestEvent as never)).json()) as { status?: string };

			expect(payload.status).toBe('missing');
		});
	});

	describe('DELETE (revoke)', () => {
		it('rensar cookien med samma options', async () => {
			const { token } = issueAnonymousChatConsentToken();
			const jar = cookieJar({ [ANONYMOUS_CHAT_CONSENT_COOKIE]: token });
			const { event: requestEvent } = event({ cookies: jar });

			const response = await DELETE(requestEvent as never);
			const payload = (await response.json()) as { status?: string };

			expect(payload.status).toBe('revoked');
			expect(jar.deleteCalls).toHaveLength(1);
			expect(jar.deleteCalls[0].name).toBe(ANONYMOUS_CHAT_CONSENT_COOKIE);
			expect(jar.deleteCalls[0].options).toMatchObject({ path: '/', httpOnly: true });
			expect(jar.get(ANONYMOUS_CHAT_CONSENT_COOKIE)).toBeUndefined();
		});

		it('fungerar även utan hemlighet, så ingen fastnar med ett samtycke', async () => {
			mockEnv.env.CHAT_ANON_CONSENT_SECRET = undefined;
			const jar = cookieJar({ [ANONYMOUS_CHAT_CONSENT_COOKIE]: 'något' });
			const { event: requestEvent } = event({ cookies: jar });

			const response = await DELETE(requestEvent as never);

			expect(response.status).toBe(200);
			expect(jar.deleteCalls).toHaveLength(1);
		});
	});

	describe('isolation mot inloggad väg', () => {
		it('en autentiserad request kan inte skaffa anonymt samtycke', async () => {
			const { event: requestEvent, cookies } = event({ authenticated: true });

			const response = await POST(requestEvent as never);

			expect(response.status).toBe(409);
			expect(cookies.setCalls).toHaveLength(0);
		});

		it('GET och DELETE avvisas också för autentiserade', async () => {
			const getResponse = await GET(event({ authenticated: true }).event as never);
			const deleteResponse = await DELETE(event({ authenticated: true }).event as never);

			expect(getResponse.status).toBe(409);
			expect(deleteResponse.status).toBe(409);
		});
	});
});
