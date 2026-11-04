import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CLAUDE_MODELS } from './models';

const mocks = vi.hoisted(() => ({ create: vi.fn(), stream: vi.fn(), client: vi.fn(), env: { ANTHROPIC_API_KEY: 'synthetic-test-key' } }));
vi.mock('$env/dynamic/private', () => ({ env: mocks.env }));
vi.mock('@anthropic-ai/sdk', () => {
	class APIError extends Error {
		constructor(public status?: number, public error?: unknown, message?: string) {
			super(message);
		}
	}
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

describe('Claude-kapaciteter och säker felhantering (etapp 2)', () => {
	it('har en kapacitetsrad för varje registrerad modell', async () => {
		const { CLAUDE_MODEL_CAPABILITIES } = await import('./anthropic');
		expect(Object.keys(CLAUDE_MODEL_CAPABILITIES).sort()).toEqual(Object.values(CLAUDE_MODELS).sort());
	});

	it('skickar aldrig temperature, top_p eller top_k till Claude', async () => {
		for (const model of Object.values(CLAUDE_MODELS)) {
			mocks.create.mockClear();
			await callClaude({ ...request, model });
			const sent = mocks.create.mock.calls[0][0];
			for (const key of ['temperature', 'top_p', 'top_k', 'budget_tokens']) expect(sent).not.toHaveProperty(key);
		}
	});

	it('returnerar ett klippt svar som förut men loggar stoppskälet utan text', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		mocks.create.mockResolvedValueOnce({ ...response, content: [{ type: 'text', text: 'Syntetiskt halvt' }], stop_reason: 'max_tokens' });
		await expect(callClaude(request)).resolves.toBe('Syntetiskt halvt');
		expect(warn).toHaveBeenCalledWith('[ai:truncated]', { label: 'synthetic-test', model: CLAUDE_MODELS.deep, stopReason: 'max_tokens', hasText: true });
		expect(JSON.stringify(warn.mock.calls)).not.toContain('Syntetiskt halvt');
	});

	it('loggar inte stoppskäl för fullständiga svar', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await callClaude(request);
		expect(warn).not.toHaveBeenCalled();
	});

	it('loggar okända fel utan fritext och märker saknad nyckel som konfigurationsfel', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		mocks.create.mockRejectedValueOnce(new Error('Syntetisk fritext med sk-ant-hemlig'));
		await expect(callClaude(request)).resolves.toBeNull();
		expect(JSON.stringify(error.mock.calls)).not.toContain('sk-ant-hemlig');

		mocks.env.ANTHROPIC_API_KEY = '';
		await expect(callClaude(request)).resolves.toBeNull();
		expect(error).toHaveBeenCalledWith('[ai:config]', expect.objectContaining({ kind: 'configuration', providerCode: 'missing_api_key' }));
	});

	it('loggar strömfel utan fritext och kastar fortfarande vidare', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		mocks.stream.mockImplementationOnce(() => ({
			async *[Symbol.asyncIterator]() {
				throw new Error('Syntetisk timeout med användartext');
			}
		}));
		await expect(collect()).rejects.toThrow('Syntetisk timeout');
		expect(JSON.stringify(error.mock.calls)).not.toContain('användartext');
	});

	it('loggar trunkerade strömmar', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		mocks.stream.mockImplementationOnce(() => ({
			async *[Symbol.asyncIterator]() {
				yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Svar' } };
			},
			finalMessage: vi.fn().mockResolvedValue({ ...response, stop_reason: 'max_tokens' })
		}));
		await expect(collect()).resolves.toEqual(['Svar']);
		expect(warn).toHaveBeenCalledWith('[ai:truncated]', expect.objectContaining({ stopReason: 'max_tokens' }));
	});
});

it('loggar API-fel med status och feltyp men utan leverantörens fritext', async () => {
	const error = vi.spyOn(console, 'error').mockImplementation(() => {});
	const { default: Anthropic } = await import('@anthropic-ai/sdk');
	// Samma argumentordning som SDK:ts APIError: status, svarskropp, meddelande, headers.
	const apiError = new Anthropic.APIError(404, { error: { type: 'not_found_error' } }, 'Fritext sk-ant-hemlig', new Headers());
	mocks.create.mockRejectedValueOnce(apiError);
	await expect(callClaude(request)).resolves.toBeNull();
	expect(error).toHaveBeenCalledWith('[ai:config]', expect.objectContaining({ kind: 'configuration', providerStatus: 404, providerCode: 'not_found_error' }));
	expect(JSON.stringify(error.mock.calls)).not.toContain('sk-ant-hemlig');
});
