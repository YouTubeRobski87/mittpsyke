import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv: Record<string, string | undefined> = {};
const insertCalls: Record<string, unknown>[] = [];
const equalityCalls: Array<[string, unknown]> = [];

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
	createServiceClient: () => ({
		from: () => ({
			select: () => {
				const query = {
					eq: (column: string, value: unknown) => {
						equalityCalls.push([column, value]);
						return query;
					},
					gte: () => Promise.resolve({ count: 0, error: null })
				};
				return query;
			},
			insert: (payload: Record<string, unknown>) => {
				insertCalls.push(payload);
				return Promise.resolve({ error: null });
			}
		})
	}),
	isMissingTableError: () => false
}));

const { POST } = await import('./+server');
const { createStoryLoadToken, hashStoryIp } = await import('$lib/server/anonymous-stories');

beforeEach(() => {
	insertCalls.length = 0;
	equalityCalls.length = 0;
	for (const key of Object.keys(mockEnv)) delete mockEnv[key];
	mockEnv.STORY_RATE_LIMIT_SALT = 'test-secret-story-salt';
});

describe('inlämning av anonym berättelse', () => {
	it('använder och sparar samma hash för rate limiting utan att spara rå IP', async () => {
		const clientIp = '203.0.113.42';
		const loadedAt = Date.now() - 4_000;
		const form = new FormData();
		form.set('content', 'En tillräckligt lång berättelse för att passera valideringen utan problem.');
		form.set('story_loaded_at', String(loadedAt));
		form.set('story_load_token', createStoryLoadToken(loadedAt));

		const response = await POST({
			request: new Request('http://localhost/api/stories/submit', {
				method: 'POST',
				headers: { 'x-forwarded-for': `${clientIp}, 198.51.100.1` },
				body: form
			}),
			getClientAddress: () => '192.0.2.10'
		} as Parameters<typeof POST>[0]);

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
});
