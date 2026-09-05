import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv: Record<string, string | undefined> = {};
const insertCalls: Record<string, unknown>[] = [];
const equalityCalls: Array<[string, unknown]> = [];
let rateLimitCount = 0;
let serviceClientCalls = 0;

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));

vi.mock('openai', () => ({
	default: class {
		chat = {
			completions: {
				create: vi.fn().mockResolvedValue({
					choices: [{ message: { content: '{"action":"approve","reason":null}' } }]
				})
			}
		};
	}
}));

vi.mock('$lib/server/supabase-admin', () => ({
	createServiceClient: () => {
		serviceClientCalls += 1;
		return {
			from: () => ({
				select: () => {
					const query = {
						eq: (column: string, value: unknown) => {
							equalityCalls.push([column, value]);
							return query;
						},
						gte: () => Promise.resolve({ count: rateLimitCount, error: null })
					};
					return query;
				},
				insert: (payload: Record<string, unknown>) => {
					insertCalls.push(payload);
					return Promise.resolve({ error: null });
				}
			})
		};
	},
	isMissingTableError: () => false
}));

const { POST } = await import('./+server');
const { createStoryLoadToken, hashStoryIp } = await import('$lib/server/anonymous-stories');
const helperSource = readFileSync(
	join(process.cwd(), 'src/lib/server/anonymous-stories.ts'),
	'utf8'
);

const VALID_SALT = 'test-secret-story-rate-limit-salt-32-plus';

function validStoryForm() {
	const loadedAt = Date.now() - 4_000;
	const form = new FormData();
	form.set('content', 'En tillräckligt lång berättelse för att passera valideringen utan problem.');
	form.set('story_loaded_at', String(loadedAt));
	form.set('story_load_token', createStoryLoadToken(loadedAt));
	return form;
}

async function submit(form: FormData, clientIp = '203.0.113.42') {
	return POST({
		request: new Request('http://localhost/api/stories/submit', {
			method: 'POST',
			headers: { 'x-forwarded-for': `${clientIp}, 198.51.100.1` },
			body: form
		}),
		getClientAddress: () => '192.0.2.10'
	} as Parameters<typeof POST>[0]);
}

beforeEach(() => {
	insertCalls.length = 0;
	equalityCalls.length = 0;
	rateLimitCount = 0;
	serviceClientCalls = 0;
	for (const key of Object.keys(mockEnv)) delete mockEnv[key];
	mockEnv.STORY_RATE_LIMIT_SALT = VALID_SALT;
});

describe('inlämning av anonym berättelse', () => {
	it('använder och sparar samma hash för rate limiting utan att spara rå IP', async () => {
		const clientIp = '203.0.113.42';
		const response = await submit(validStoryForm(), clientIp);

		const expectedHash = hashStoryIp(clientIp);
		expect(response.status).toBe(200);
		expect(equalityCalls).toContainEqual(['ip_hash', expectedHash]);
		expect(insertCalls).toHaveLength(1);
		expect(insertCalls[0]).toMatchObject({ ip_hash: expectedHash });
		expect(insertCalls[0]).not.toHaveProperty('ip');
		expect(insertCalls[0]).not.toHaveProperty('raw_ip');
		expect(insertCalls[0]).not.toHaveProperty('ip_address');
		expect(Object.values(insertCalls[0])).not.toContain(clientIp);
	});

	it('skapar en deterministisk SHA-256-hash som inte innehåller den råa IP-adressen', () => {
		const clientIp = '203.0.113.99';
		const first = hashStoryIp(clientIp);
		const second = hashStoryIp(clientIp);
		expect(first).toBe(second);
		expect(first).toMatch(/^[a-f0-9]{64}$/);
		expect(first).not.toContain(clientIp);
	});

	it('skapar olika hash för samma IP när det dedikerade saltet ändras', () => {
		const clientIp = '203.0.113.99';
		const first = hashStoryIp(clientIp);
		mockEnv.STORY_RATE_LIMIT_SALT = 'another-secret-story-rate-limit-salt-32-plus';
		const second = hashStoryIp(clientIp);

		expect(second).not.toBe(first);
	});

	it.each([
		['saknat', undefined],
		['för kort', 'too-short']
	])('nekar submit med generiskt serverfel när saltet är %s', async (_label, salt) => {
		mockEnv.STORY_RATE_LIMIT_SALT = salt;
		const form = new FormData();
		form.set('content', 'En tillräckligt lång berättelse för att passera valideringen utan problem.');
		form.set('story_loaded_at', String(Date.now() - 4_000));
		form.set('story_load_token', 'invalid-without-using-a-secret');

		const response = await submit(form);

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ message: 'Berättelsen kunde inte tas emot just nu.' });
		expect(serviceClientCalls).toBe(0);
		expect(equalityCalls).toHaveLength(0);
		expect(insertCalls).toHaveLength(0);
		expect(() => hashStoryIp('203.0.113.99')).toThrow();
	});

	it('faller inte tillbaka till andra salt eller service-role-nycklar', async () => {
		delete mockEnv.STORY_RATE_LIMIT_SALT;
		mockEnv.IP_HASH_SALT = 'legacy-ip-hash-salt-that-is-long-enough';
		mockEnv.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key-that-is-long-enough';
		mockEnv.SERVICE_ROLE_KEY = 'legacy-service-key-that-is-long-enough';

		expect(() => hashStoryIp('203.0.113.99')).toThrow();
		expect(helperSource).not.toMatch(/env\.IP_HASH_SALT|env\.SUPABASE_SERVICE_ROLE_KEY|env\.SERVICE_ROLE_KEY/);
		expect(helperSource).not.toMatch(/FALLBACK_SALT|mittpsyke-local-anonymous-stories-salt/);
	});

	it('behåller gränsen tre bidrag under 24 timmar', async () => {
		rateLimitCount = 3;

		const response = await submit(validStoryForm());

		expect(response.status).toBe(429);
		expect(await response.json()).toEqual({
			message: 'Du kan skicka in högst tre berättelser per dygn. Försök gärna igen senare.'
		});
		expect(insertCalls).toHaveLength(0);
	});
});
