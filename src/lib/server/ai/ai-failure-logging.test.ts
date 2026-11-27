import OpenAI from 'openai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { env } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined> }));
vi.mock('$env/dynamic/private', () => ({ env }));

import { normalizeOpenAIError } from './providers/openai-text-provider';
import { AITextGenerationError, classifyAIFailure } from './text-generation-contract';

// Syntetiska fel och texter. Inga nätverksanrop.
const SECRET_LIKE = 'sk-proj-syntetisk-hemlighet';
const USER_TEXT = 'Syntetisk känslig dagbokstext';

function sdkError(status: number, code: string) {
	return OpenAI.APIError.generate(status, { error: { code, type: code, message: `Fritext ${SECRET_LIKE}` } }, `Fritext ${SECRET_LIKE}`, {});
}

describe('classifyAIFailure skiljer konfigurationsfel från tillfälliga fel', () => {
	it.each([
		['otillåten modell', new AITextGenerationError('configuration', 'x', { providerCode: 'model_not_allowed' }), 'configuration'],
		['saknad nyckel', new AITextGenerationError('configuration', 'x'), 'configuration'],
		['ogiltig nyckel (401)', normalizeOpenAIError(sdkError(401, 'invalid_api_key')), 'configuration'],
		['avvecklad modell (404)', normalizeOpenAIError(sdkError(404, 'model_not_found')), 'configuration'],
		['parameter som modellen saknar stöd för', normalizeOpenAIError(sdkError(400, 'unsupported_parameter')), 'configuration'],
		['slut på kvot', normalizeOpenAIError(sdkError(429, 'insufficient_quota')), 'account'],
		['hastighetsbegränsning', normalizeOpenAIError(sdkError(429, 'rate_limit_exceeded')), 'transient'],
		['serverfel', normalizeOpenAIError(sdkError(503, 'server_error')), 'transient'],
		['timeout', normalizeOpenAIError(new OpenAI.APIConnectionTimeoutError()), 'transient'],
		['annat 400-fel', normalizeOpenAIError(sdkError(400, 'context_length_exceeded')), 'request'],
		['tomt svar', new AITextGenerationError('empty_response', 'x', { providerCode: 'length' }), 'response'],
		['nätverksfel utan status', normalizeOpenAIError(new OpenAI.APIConnectionError({ message: 'ECONNRESET' })), 'unknown']
	] as const)('%s', (_label, error, kind) => {
		expect(classifyAIFailure(error)).toBe(kind);
	});
});

describe('gemensam felloggning i textlagret', () => {
	let errorSpy: ReturnType<typeof vi.spyOn>;
	beforeEach(() => {
		for (const key of Object.keys(env)) delete env[key];
		vi.resetModules();
		errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});
	afterEach(() => errorSpy.mockRestore());

	// Efter resetModules måste felklasserna komma från samma modulinstans som
	// generatorn, annars känns de inte igen med instanceof.
	async function generator() {
		const provider = await import('./providers/openai-text-provider');
		return { ...(await import('./text-generation')), normalize: provider.normalizeOpenAIError };
	}

	const request = {
		purpose: 'diary-reflection' as const,
		messages: [{ role: 'user' as const, content: USER_TEXT }]
	};

	it('loggar ett leverantörsfel en gång, utan innehåll eller fritext', async () => {
		const { generateAIText, normalize } = await generator();
		const failing = { generate: vi.fn().mockRejectedValue(normalize(sdkError(503, 'server_error'))) };
		await expect(generateAIText(request, failing)).rejects.toMatchObject({ code: 'provider' });

		expect(errorSpy).toHaveBeenCalledWith('[ai:error]', {
			purpose: 'diary-reflection',
			model: 'gpt-4o-mini',
			kind: 'transient',
			code: 'provider',
			providerStatus: 503,
			providerCode: 'server_error'
		});
		const logged = JSON.stringify(errorSpy.mock.calls);
		expect(logged).not.toContain(USER_TEXT);
		expect(logged).not.toContain(SECRET_LIKE);
	});

	it.each([
		{ purpose: 'diary-narrative', confidential: true, modelEnv: 'OPENAI_DIARY_NARRATIVE_MODEL', timeoutMs: 20_000, tokens: 900 },
		{ purpose: 'support-chat', confidential: false, modelEnv: 'OPENAI_SUPPORT_CHAT_MODEL', timeoutMs: 25_000, tokens: 500 }
	] as const)('skyddar $purpose när DEBUG=true utan att logga innehåll', async ({
		purpose, confidential, modelEnv, timeoutMs, tokens
	}) => {
		env[modelEnv] = 'gpt-4o-mini-2024-07-18';
		const { generateAIText } = await generator();
		const citation = 'Syntetiskt stödspann';
		const sourceId = 'syntetisk-kalla-9';
		const resultText = 'Syntetiskt fullständigt modellsvar';
		const logs = (['log', 'debug', 'info', 'warn'] as const).map((method) =>
			vi.spyOn(console, method).mockImplementation(() => {})
		);
		env.OPENAI_API_KEY = SECRET_LIKE;
		vi.stubEnv('DEBUG', 'true');
		vi.stubEnv('OPENAI_BASE_URL', 'https://example.invalid/v1');
		vi.stubEnv('OPENAI_ORG_ID', 'synthetic-org');
		vi.stubEnv('OPENAI_PROJECT_ID', 'synthetic-project');
		const timeout = vi.spyOn(AbortSignal, 'timeout');
		const timeoutController = new AbortController();
		const transport = vi.fn()
			.mockResolvedValueOnce(new Response(JSON.stringify({
				choices: [{ message: { content: resultText }, finish_reason: 'length' }]
			})))
			.mockResolvedValueOnce(new Response(JSON.stringify({
				error: { code: sourceId, message: [USER_TEXT, citation, resultText, SECRET_LIKE].join(' ') }
			}), { status: 503 }))
			.mockResolvedValueOnce(new Response(JSON.stringify({
				error: { code: 'insufficient_quota', message: USER_TEXT }
			}), { status: 429 }))
			.mockResolvedValueOnce(new Response(JSON.stringify({
				error: { code: sourceId }
			}), { status: 429 }))
			.mockImplementationOnce(async (_url: string, { signal }: RequestInit) => {
				expect(signal).toBe(timeoutController.signal);
				timeoutController.abort();
				throw new Error([USER_TEXT, citation, resultText, SECRET_LIKE].join(' '));
			});
		vi.stubGlobal('fetch', transport);

		const confidentialRequest = {
			purpose,
			...(confidential ? { confidential: true as const } : {}),
			outputFormat: 'json_object' as const,
			messages: [{ role: 'user' as const, content: [USER_TEXT, citation, sourceId].join(' ') }]
		};
		try {
			expect(process.env.DEBUG).toBe('true');
			const success = await generateAIText(confidentialRequest);
			expect(success.text).toBe(resultText);
			await expect(generateAIText(confidentialRequest)).rejects.toMatchObject({ code: 'provider', providerStatus: 503 });
			await expect(generateAIText(confidentialRequest)).rejects.toMatchObject({ code: 'quota', providerStatus: 429 });
			await expect(generateAIText(confidentialRequest)).rejects.toMatchObject({ code: 'rate_limit', providerStatus: 429 });
			timeout.mockReturnValueOnce(timeoutController.signal);
			await expect(generateAIText(confidentialRequest)).rejects.toMatchObject({ code: 'timeout' });
			expect(timeout.mock.calls).toEqual(Array.from({ length: 5 }, () => [timeoutMs]));
			expect(transport).toHaveBeenCalledTimes(5);
			const [url, options] = transport.mock.calls[0];
			expect(url).toBe('https://example.invalid/v1/chat/completions');
			expect(options).toMatchObject({ method: 'POST', redirect: 'error' });
			expect(options.headers.get('Authorization')).toBe(`Bearer ${SECRET_LIKE}`);
			expect(options.headers.get('OpenAI-Organization')).toBe('synthetic-org');
			expect(options.headers.get('OpenAI-Project')).toBe('synthetic-project');
			expect(JSON.parse(options.body)).toMatchObject({
				model: 'gpt-4o-mini-2024-07-18',
				max_completion_tokens: tokens,
				response_format: { type: 'json_object' },
				messages: confidentialRequest.messages
			});
			const logged = JSON.stringify([...logs, errorSpy].flatMap((spy) => spy.mock.calls));
			expect(logged).toContain('[ai:truncated]');
			expect(logged).toContain('[ai:error]');
			for (const sensitive of [USER_TEXT, citation, sourceId, resultText, SECRET_LIKE]) {
				expect(logged).not.toContain(sensitive);
			}
		} finally {
			timeout.mockRestore();
			vi.unstubAllGlobals();
			vi.unstubAllEnvs();
			for (const spy of logs) spy.mockRestore();
		}
	});

	it('märker konfigurationsfel med eget prefix så att reservsvar inte döljer dem', async () => {
		const { generateAIText, AITextGenerationError: FreshError } = await generator();
		const failing = {
			generate: vi.fn().mockRejectedValue(
				new FreshError('configuration', 'x', { providerCode: 'model_not_allowed' })
			)
		};
		await expect(generateAIText(request, failing)).rejects.toMatchObject({ code: 'configuration' });
		expect(errorSpy).toHaveBeenCalledWith('[ai:config]', expect.objectContaining({ kind: 'configuration', purpose: 'diary-reflection' }));
	});

	it('loggar aldrig ett syntaktiskt ogiltigt modellvärde, som kan vara en nyckel', async () => {
		env.OPENAI_DIARY_REFLECTION_MODEL = `Bearer ${SECRET_LIKE}`;
		env.OPENAI_API_KEY = 'synthetic-test-key';
		const { generateAIText } = await generator();
		// Den riktiga OpenAI-adaptern används, men valideringen stoppar före anropet.
		await expect(generateAIText(request)).rejects.toMatchObject({
			code: 'configuration',
			providerCode: 'invalid_model_id'
		});
		expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(SECRET_LIKE);
		expect(errorSpy).toHaveBeenCalledWith('[ai:config]', expect.objectContaining({ model: null, providerCode: 'invalid_model_id' }));
	});

	it('loggar inte en kort nyckel som råkar se ut som ett giltigt modell-ID', async () => {
		const keyLike = 'sk-' + 'a1b2c3d4'.repeat(6);
		env.OPENAI_DIARY_REFLECTION_MODEL = keyLike;
		env.OPENAI_API_KEY = 'synthetic-test-key';
		const { generateAIText } = await generator();
		await expect(generateAIText(request)).rejects.toMatchObject({ code: 'configuration', providerCode: 'model_not_allowed' });
		expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(keyLike);
		expect(errorSpy).toHaveBeenCalledWith('[ai:config]', expect.objectContaining({ model: null, providerCode: 'model_not_allowed' }));
	});

	it('loggar saknad nyckel som konfigurationsfel', async () => {
		const { generateAIText } = await generator();
		await expect(generateAIText(request)).rejects.toMatchObject({ code: 'configuration' });
		expect(errorSpy).toHaveBeenCalledWith('[ai:config]', expect.objectContaining({ model: null, kind: 'configuration' }));
	});
});

describe('granskning av modellval vid uppstart', () => {
	beforeEach(() => {
		for (const key of Object.keys(env)) delete env[key];
		vi.resetModules();
	});

	it('hittar inga problem med standardvalet eller dagens driftmodell', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		env.OPENAI_CHAT_MODEL = 'gpt-5.4';
		const { reportModelConfigurationProblems } = await import('./text-generation-provider');
		expect(reportModelConfigurationProblems()).toBe(0);
		expect(errorSpy).not.toHaveBeenCalled();
		errorSpy.mockRestore();
	});

	it('rapporterar varje syfte med otillåten modell en gång vid laddning', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		env.OPENAI_USER_MEMORY_MODEL = 'gpt-9-imaginary';
		await import('./text-generation-provider');
		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(errorSpy).toHaveBeenCalledWith('[ai:config]', {
			purpose: 'user-memory',
			model: null,
			kind: 'configuration',
			providerCode: 'model_not_allowed'
		});
		errorSpy.mockRestore();
	});

	it('påverkar inte vilken modell som är konfigurerad för andra syften', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		env.OPENAI_CHAT_MODEL = 'gpt-5.4';
		env.OPENAI_USER_MEMORY_MODEL = 'gpt-9-imaginary';
		const { getConfiguredAIModelConfiguration } = await import('./text-generation-provider');
		expect(getConfiguredAIModelConfiguration('support-chat').model).toBe('gpt-5.4');
		// Konfigurationen visar fortfarande värdet; stoppet sker vid anropet.
		expect(getConfiguredAIModelConfiguration('user-memory').model).toBe('gpt-9-imaginary');
		vi.restoreAllMocks();
	});
});
