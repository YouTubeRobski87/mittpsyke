import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CLAUDE_MODELS } from './models';

const mocks = vi.hoisted(() => ({ create: vi.fn(), stream: vi.fn(), client: vi.fn(), env: { ANTHROPIC_API_KEY: 'synthetic-test-key' } }));
vi.mock('$env/dynamic/private', () => ({ env: mocks.env }));
vi.mock('@anthropic-ai/sdk', () => {
	class APIError extends Error {}
	class Anthropic {
		static APIError = APIError;
		messages = { create: mocks.create, stream: mocks.stream };
		constructor(options: unknown) { mocks.client(options); }
	}
	return { default: Anthropic };
});
import { callClaude, streamClaudeText } from './anthropic';

const response = { content: [{ type: 'text', text: 'Svar' }], usage: { input_tokens: 2, output_tokens: 1 }, stop_reason: 'end_turn' };
const request = { label: 'synthetic-test', system: 'Test', prompt: 'Test', maxTokens: 2000 };
async function collect(model?: typeof CLAUDE_MODELS.deep | typeof CLAUDE_MODELS.fast, effort?: 'high') {
	const chunks = [];
	for await (const chunk of streamClaudeText({ ...request, model, effort, messages: [{ role: 'user', content: 'Test' }] })) chunks.push(chunk);
	return chunks;
}
beforeEach(() => {
	vi.restoreAllMocks();
	vi.clearAllMocks();
	vi.spyOn(console, 'log').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
	mocks.env.ANTHROPIC_API_KEY = 'synthetic-test-key';
	mocks.create.mockResolvedValue(response);
	mocks.stream.mockImplementation(() => ({
		async *[Symbol.asyncIterator]() {
			yield { type: 'content_block_delta', delta: { type: 'thinking_delta', thinking: 'hidden' } };
			yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Svar' } };
		},
		finalMessage: vi.fn().mockResolvedValue(response)
	}));
});

describe.each(['vanligt anrop', 'strömmande anrop'] as const)('Claude-kompatibilitet, %s', (mode) => {
	async function run(model?: typeof CLAUDE_MODELS.deep | typeof CLAUDE_MODELS.fast, effort?: 'high') {
		return mode === 'vanligt anrop' ? callClaude({ ...request, model, effort }) : collect(model, effort);
	}
	function sent() { return (mode === 'vanligt anrop' ? mocks.create : mocks.stream).mock.calls[0][0]; }
	it('behåller Opus som standard med adaptive thinking, tokentak och timeout', async () => {
		await run();
		expect(sent()).toMatchObject({ model: CLAUDE_MODELS.deep, max_tokens: 2000, system: 'Test', thinking: { type: 'adaptive' }, output_config: { effort: 'low' } });
		expect(mocks.client).toHaveBeenCalledWith({ apiKey: 'synthetic-test-key', timeout: 20_000 });
	});
	it('behåller uttrycklig effort för Opus', async () => {
		await run(CLAUDE_MODELS.deep, 'high');
		expect(sent().output_config).toEqual({ effort: 'high' });
	});
	it('utelämnar thinking och effort som Haiku inte stöder, även med uttrycklig effort', async () => {
		await run(CLAUDE_MODELS.fast, 'high');
		expect(sent().model).toBe(CLAUDE_MODELS.fast);
		expect(sent()).not.toHaveProperty('thinking');
		expect(sent()).not.toHaveProperty('output_config');
		expect(sent().max_tokens).toBe(2000);
	});
});
it('returnerar fortfarande null vid fel och vid refusal', async () => {
	mocks.create.mockRejectedValueOnce(new Error('synthetic failure'));
	await expect(callClaude(request)).resolves.toBeNull();
	mocks.create.mockResolvedValueOnce({ ...response, stop_reason: 'refusal' });
	await expect(callClaude(request)).resolves.toBeNull();
});
it('filtrerar fortfarande strömmad text och kastar vidare strömfel', async () => {
	await expect(collect()).resolves.toEqual(['Svar']);
	mocks.stream.mockImplementationOnce(() => ({ async *[Symbol.asyncIterator]() { throw new Error('synthetic stream failure'); } }));
	await expect(collect()).rejects.toThrow('synthetic stream failure');
});
it('behåller uttrycklig timeout och tokentak', async () => {
	await callClaude({ ...request, timeoutMs: 15_000, maxTokens: 4000 });
	expect(mocks.client).toHaveBeenCalledWith(expect.objectContaining({ timeout: 15_000 }));
	expect(mocks.create.mock.calls[0][0].max_tokens).toBe(4000);
});
