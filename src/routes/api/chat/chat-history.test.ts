import { beforeEach, describe, expect, it, vi } from 'vitest';

type StoredMessage = {
	id: string;
	conversation_id: string;
	user_id: string;
	role: 'user' | 'assistant';
	content: string;
	created_at: string;
};

const mocks = vi.hoisted(() => ({
	createClient: vi.fn(),
	createServiceClient: vi.fn(),
	hasChatAiConsent: vi.fn(),
	generateAIText: vi.fn(),
	loadUserMemories: vi.fn(),
	shouldRefreshUserMemories: vi.fn(),
	recordMeaningfulReflectionMilestones: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({
	env: {
		OPENAI_API_KEY: 'sk-test-key',
		SUPABASE_URL: 'https://example.supabase.co',
		SUPABASE_ANON_KEY: 'anon-key',
		SUPABASE_SERVICE_ROLE_KEY: 'service-key',
		CHAT_ANON_CONSENT_SECRET: 'a'.repeat(48)
	}
}));
vi.mock('$env/dynamic/public', () => ({ env: {} }));

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
vi.mock('$lib/server/supabase-admin', () => ({
	createServiceClient: mocks.createServiceClient
}));
vi.mock('$lib/server/chat-ai-consent', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/chat-ai-consent')>();
	return { ...actual, hasChatAiConsent: mocks.hasChatAiConsent };
});
vi.mock('$lib/server/ai/text-generation', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/ai/text-generation')>();
	return { ...actual, generateAIText: mocks.generateAIText };
});
vi.mock('$lib/server/user-memory', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/user-memory')>();
	return {
		...actual,
		loadUserMemories: mocks.loadUserMemories,
		shouldRefreshUserMemories: mocks.shouldRefreshUserMemories,
		refreshUserMemories: vi.fn()
	};
});
vi.mock('$lib/server/funnel-events', () => ({
	recordMeaningfulReflectionMilestones: mocks.recordMeaningfulReflectionMilestones
}));

import { POST } from './+server';
import {
	ANONYMOUS_CHAT_CONSENT_COOKIE,
	issueAnonymousChatConsentToken
} from '$lib/server/anonymous-chat-consent';
import { SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const CONVERSATION_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_USER_CONVERSATION_ID = '33333333-3333-4333-8333-333333333333';
const CURRENT_MESSAGE = 'Det här är mitt aktuella meddelande.';

function storedMessages(count: number, options: Partial<StoredMessage> = {}): StoredMessage[] {
	return Array.from({ length: count }, (_, index) => ({
		id: `message-${String(index + 1).padStart(3, '0')}`,
		conversation_id: CONVERSATION_ID,
		user_id: USER_ID,
		role: index % 2 === 0 ? 'user' : 'assistant',
		content: `historik-${String(index + 1).padStart(2, '0')}`,
		created_at: new Date(Date.UTC(2026, 0, 1, 12, index)).toISOString(),
		...options
	}));
}

function authenticatedClient(rows: StoredMessage[], options: { historyError?: { code?: string } } = {}) {
	const conversationFilters: Array<[string, unknown]> = [];
	const historyFilters: Array<[string, unknown]> = [];
	const historyOrders: Array<[string, { ascending: boolean }]> = [];
	const inserts: unknown[] = [];

	const historyQuery = {
		eq(column: string, value: unknown) {
			historyFilters.push([column, value]);
			return historyQuery;
		},
		order(column: string, settings: { ascending: boolean }) {
			historyOrders.push([column, settings]);
			return historyQuery;
		},
		async limit(limit: number) {
			if (options.historyError) return { data: null, error: options.historyError };
			const conversationId = historyFilters.find(([column]) => column === 'conversation_id')?.[1];
			const matching = rows.filter((row) => row.conversation_id === conversationId);
			const sorted = [...matching].sort((left, right) => {
				for (const [column, settings] of historyOrders) {
					const leftValue = String(left[column as keyof StoredMessage]);
					const rightValue = String(right[column as keyof StoredMessage]);
					const comparison = leftValue.localeCompare(rightValue);
					if (comparison !== 0) return settings.ascending ? comparison : -comparison;
				}
				return 0;
			});
			return {
				data: sorted.slice(0, limit).map(({ role, content }) => ({ role, content })),
				error: null
			};
		}
	};

	const from = vi.fn((table: string) => {
		if (table === 'conversations') {
			return {
				select: vi.fn(() => {
					const query = {
						eq(column: string, value: unknown) {
							conversationFilters.push([column, value]);
							return query;
						},
						async maybeSingle() {
							const requestedId = conversationFilters.find(([column]) => column === 'id')?.[1];
							const requestedUser = conversationFilters.find(([column]) => column === 'user_id')?.[1];
							const allowed = requestedId === CONVERSATION_ID && requestedUser === USER_ID;
							return {
								data: allowed
									? { id: CONVERSATION_ID, user_id: USER_ID, category: 'G' }
									: null,
								error: null
							};
						}
					};
					return query;
				})
			};
		}

		if (table === 'messages') {
			return {
				select: vi.fn(() => historyQuery),
				insert: vi.fn(async (value: unknown) => {
					inserts.push(value);
					return { error: null };
				})
			};
		}

		return {
			select: vi.fn(() => ({
				eq: vi.fn(() => ({
					order: vi.fn(() => ({ limit: vi.fn().mockResolvedValue({ data: [], error: null }) }))
				}))
			}))
		};
	});

	return {
		client: {
			auth: {
				getUser: vi.fn().mockResolvedValue({
					data: { user: { id: USER_ID, user_metadata: {}, created_at: '2025-01-01T00:00:00.000Z' } },
					error: null
				})
			},
			from
		},
		spies: { from, conversationFilters, historyFilters, historyOrders, inserts }
	};
}

function request(options: {
	authenticated?: boolean;
	contextMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
	conversationId?: string;
} = {}) {
	return new Request('http://localhost/api/chat', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION,
			...(options.authenticated === false ? {} : { authorization: 'Bearer access-token' })
		},
		body: JSON.stringify({
			message: CURRENT_MESSAGE,
			category: 'G',
			conversationId: options.conversationId ?? CONVERSATION_ID,
			contextMessages: options.contextMessages
		})
	});
}

async function callAuthenticated(rows: StoredMessage[], options: { historyError?: { code?: string } } = {}) {
	const auth = authenticatedClient(rows, options);
	mocks.createClient.mockReturnValue(auth.client);
	const response = await POST({
		request: request(),
		getClientAddress: () => '10.10.0.1'
	} as unknown as Parameters<typeof POST>[0]);
	return { response, auth };
}

function generatedMessages() {
	return mocks.generateAIText.mock.calls[0][0].messages as Array<{
		role: 'user' | 'assistant';
		content: string;
	}>;
}

describe('inloggad chatthistorik', () => {
	beforeEach(() => {
		mocks.createClient.mockReset();
		mocks.createServiceClient.mockReset();
		mocks.hasChatAiConsent.mockReset();
		mocks.generateAIText.mockReset();
		mocks.loadUserMemories.mockReset();
		mocks.shouldRefreshUserMemories.mockReset();
		mocks.recordMeaningfulReflectionMilestones.mockReset();

		mocks.createServiceClient.mockReturnValue({});
		mocks.hasChatAiConsent.mockResolvedValue(true);
		mocks.generateAIText.mockResolvedValue({ text: 'Ett lugnt testsvar.', model: 'test-model' });
		mocks.loadUserMemories.mockResolvedValue([]);
		mocks.shouldRefreshUserMemories.mockReturnValue(false);
		mocks.recordMeaningfulReflectionMilestones.mockResolvedValue(undefined);
	});

	it('behåller en kort historik i kronologisk ordning och lägger till aktuellt meddelande en gång', async () => {
		const { response } = await callAuthenticated(storedMessages(6));

		expect(response.status).toBe(200);
		expect(generatedMessages().map((message) => message.content)).toEqual([
			'historik-01',
			'historik-02',
			'historik-03',
			'historik-04',
			'historik-05',
			'historik-06',
			CURRENT_MESSAGE
		]);
		expect(generatedMessages().filter((message) => message.content === CURRENT_MESSAGE)).toHaveLength(1);
	});

	it('väljer endast de tio senaste av trettio meddelanden och skickar dem äldst först', async () => {
		const { response, auth } = await callAuthenticated(storedMessages(30));

		expect(response.status).toBe(200);
		expect(auth.spies.historyOrders).toEqual([
			['created_at', { ascending: false }],
			['id', { ascending: false }]
		]);
		expect(generatedMessages().map((message) => message.content)).toEqual([
			...Array.from({ length: 10 }, (_, index) => `historik-${index + 21}`),
			CURRENT_MESSAGE
		]);
		expect(generatedMessages().some((message) => message.content === 'historik-20')).toBe(false);
	});

	it('använder id som deterministisk skiljeregel vid samma tidsstämpel', async () => {
		const sameTimestamp = '2026-01-01T12:00:00.000Z';
		const rows = storedMessages(12).map((row) => ({ ...row, created_at: sameTimestamp }));

		await callAuthenticated(rows);

		expect(generatedMessages().map((message) => message.content)).toEqual([
			...Array.from({ length: 10 }, (_, index) => `historik-${String(index + 3).padStart(2, '0')}`),
			CURRENT_MESSAGE
		]);
		const history = generatedMessages().slice(0, -1);
		expect(new Set(history.map((message) => message.content)).size).toBe(10);
	});

	it('avgränsar konversationen till den autentiserade användaren och den begärda konversationen', async () => {
		const rows = [
			...storedMessages(4),
			...storedMessages(4, { conversation_id: 'conversation-2', content: 'ANNAN KONVERSATION' }),
			...storedMessages(4, { conversation_id: 'other-user-conversation', user_id: 'user-2', content: 'ANNAN ANVÄNDARE' })
		];
		const { response, auth } = await callAuthenticated(rows);

		expect(response.status).toBe(200);
		expect(auth.spies.conversationFilters).toEqual([
			['id', CONVERSATION_ID],
			['user_id', USER_ID]
		]);
		expect(auth.spies.historyFilters).toEqual([['conversation_id', CONVERSATION_ID]]);
		expect(generatedMessages().some((message) => message.content.startsWith('ANNAN'))).toBe(false);
	});

	it('avvisar en konversation som inte tillhör den autentiserade användaren före historikläsning', async () => {
		const auth = authenticatedClient(
			storedMessages(4, {
				conversation_id: OTHER_USER_CONVERSATION_ID,
				user_id: '44444444-4444-4444-8444-444444444444'
			})
		);
		mocks.createClient.mockReturnValue(auth.client);

		const response = await POST({
			request: request({ conversationId: OTHER_USER_CONVERSATION_ID }),
			getClientAddress: () => '10.10.0.6'
		} as unknown as Parameters<typeof POST>[0]);

		expect(response.status).toBe(403);
		expect(auth.spies.conversationFilters).toEqual([
			['id', OTHER_USER_CONVERSATION_ID],
			['user_id', USER_ID]
		]);
		expect(auth.spies.historyFilters).toEqual([]);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it('prioriterar befintlig klienthistorik men gör fortfarande den avgränsade databasläsningen', async () => {
		const auth = authenticatedClient(storedMessages(30));
		mocks.createClient.mockReturnValue(auth.client);
		const response = await POST({
			request: request({ contextMessages: [{ role: 'user', content: 'klienthistorik' }] }),
			getClientAddress: () => '10.10.0.2'
		} as unknown as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		expect(generatedMessages()).toEqual([
			{ role: 'user', content: 'klienthistorik' },
			{ role: 'user', content: CURRENT_MESSAGE }
		]);
		expect(auth.spies.historyFilters).toEqual([['conversation_id', CONVERSATION_ID]]);
	});

	it('stoppar före historikläsning när serversamtycke saknas', async () => {
		const auth = authenticatedClient(storedMessages(6));
		mocks.createClient.mockReturnValue(auth.client);
		mocks.hasChatAiConsent.mockResolvedValue(false);

		const response = await POST({
			request: request(),
			getClientAddress: () => '10.10.0.3'
		} as unknown as Parameters<typeof POST>[0]);

		expect(response.status).toBe(403);
		expect(auth.spies.from).not.toHaveBeenCalled();
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});

	it.each([
		['ett vanligt databasfel', 'XX000', 500],
		['ett RLS-fel', '42501', 403]
	] as const)('avbryter säkert vid %s och använder inte klienthistorik som reservkälla', async (_name, code, expectedStatus) => {
		const auth = authenticatedClient(storedMessages(6), { historyError: { code } });
		mocks.createClient.mockReturnValue(auth.client);
		const response = await POST({
			request: request({ contextMessages: [{ role: 'user', content: 'ska inte användas' }] }),
			getClientAddress: () => '10.10.0.4'
		} as unknown as Parameters<typeof POST>[0]);

		expect(response.status).toBe(expectedStatus);
		expect(mocks.generateAIText).not.toHaveBeenCalled();
	});
});

describe('anonym chatthistorik', () => {
	beforeEach(() => {
		mocks.createClient.mockReset();
		mocks.generateAIText.mockReset();
		mocks.generateAIText.mockResolvedValue({ text: 'Ett lugnt testsvar.', model: 'test-model' });
	});

	it('använder klienthistoriken utan databasläsning', async () => {
		const { token } = issueAnonymousChatConsentToken();
		const response = await POST({
			request: request({
				authenticated: false,
				conversationId: undefined,
				contextMessages: [
					{ role: 'user', content: 'anonym historik' },
					{ role: 'assistant', content: 'anonymt svar' }
				]
			}),
			cookies: {
				get: (name: string) => (name === ANONYMOUS_CHAT_CONSENT_COOKIE ? token : undefined)
			},
			getClientAddress: () => '10.10.0.5'
		} as unknown as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		expect(mocks.createClient).not.toHaveBeenCalled();
		expect(generatedMessages()).toEqual([
			{ role: 'user', content: 'anonym historik' },
			{ role: 'assistant', content: 'anonymt svar' },
			{ role: 'user', content: CURRENT_MESSAGE }
		]);
	});
});
