import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));

import {
	OPENAI_TEXT_MODEL_CAPABILITIES,
	OpenAITextProvider,
	buildOpenAIChatParams,
	validateOpenAITextModel,
	type OpenAITextModelCapabilities
} from './providers/openai-text-provider';
import { AITextGenerationError, type AITextProviderRequest, type AITextRequest } from './text-generation-contract';
import { buildDiaryReflectionRequest } from './diary-reflection';
import { buildCheckinReflectionRequest } from './checkin-reflection';

// Alla texter är syntetiska. Inget nätverksanrop görs: klienten är en mock.

function providerRequest(request: AITextRequest, model = 'gpt-4o-mini', maxOutputTokens = 150): AITextProviderRequest {
	return { ...request, model, timeoutMs: 8_000, maxOutputTokens };
}

/**
 * Requestkroppen som adaptern skickade före etapp 2, återskapad ordagrant.
 * Jämförelsen sker på JSON-nivå eftersom SDK:t utelämnar odefinierade fält.
 */
function legacyBody(request: AITextProviderRequest) {
	const messages = [
		...(request.systemInstructions ?? []).filter(Boolean).map((content) => ({ role: 'system' as const, content })),
		...request.messages
	];
	return {
		model: request.model,
		messages,
		temperature: request.temperature,
		frequency_penalty: request.frequencyPenalty,
		presence_penalty: request.presencePenalty,
		...(request.outputFormat === 'json_object' ? { response_format: { type: 'json_object' as const } } : {}),
		max_completion_tokens: request.maxOutputTokens
	};
}

function sortedJson(value: unknown) {
	const parsed = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
	return JSON.stringify(Object.fromEntries(Object.entries(parsed).sort(([a], [b]) => a.localeCompare(b))));
}

const productRequests: Array<[string, AITextRequest]> = [
	['dagboksreflektion', buildDiaryReflectionRequest('Syntetisk testtext om en trött dag.')],
	['kvällsincheckning', buildCheckinReflectionRequest('Humör: 3 av 5\nEgna ord: Syntetisk testtext.')],
	[
		'stödchatt',
		{
			purpose: 'support-chat',
			systemInstructions: ['Syntetisk instruktion'],
			messages: [{ role: 'user', content: 'Syntetisk fråga' }],
			temperature: 0.75,
			frequencyPenalty: 0.3,
			presencePenalty: 0.2
		}
	],
	[
		'användarminne (JSON)',
		{
			purpose: 'user-memory',
			temperature: 0.2,
			outputFormat: 'json_object',
			systemInstructions: ['Syntetisk instruktion'],
			messages: [{ role: 'user', content: 'Syntetiskt underlag' }]
		}
	]
];

describe('OpenAI-modellernas kapacitetstabell', () => {
	it('innehåller bara modeller utan resonemang eller med verifierad standard none', () => {
		for (const [model, capabilities] of Object.entries(OPENAI_TEXT_MODEL_CAPABILITIES)) {
			expect(['none', 'default-none'], model).toContain(capabilities.reasoning);
		}
	});

	it('godkänner de modeller som används i dag, inklusive standarden', () => {
		for (const model of ['gpt-4o-mini', 'gpt-5.4', 'gpt-4o-mini-2024-07-18', 'gpt-5.4-2026-03-05']) {
			expect(validateOpenAITextModel(model).ok, model).toBe(true);
		}
	});

	it.each([
		['blanksteg i mitten', 'gpt 5.4', 'invalid_model_id'],
		['citattecken', '"gpt-5.4"', 'invalid_model_id'],
		['tomt', '', 'invalid_model_id'],
		['kontrolltecken', 'gpt-5.4\n', 'invalid_model_id'],
		['inklistrad nyckel', 'Bearer sk-syntetisk nyckel', 'invalid_model_id'],
		['okänd modell', 'gpt-9-imaginary', 'model_not_allowed'],
		['modell från en äldre rapport', 'gpt-5-mini', 'model_not_allowed'],
		['stavfel i versaler', 'GPT-5.4', 'model_not_allowed']
	])('stoppar %s', (_label, model, reason) => {
		expect(validateOpenAITextModel(model)).toEqual({ ok: false, reason });
	});
});

describe('buildOpenAIChatParams', () => {
	it.each(productRequests)('%s skickar samma request som före etapp 2 med gpt-4o-mini och gpt-5.4', (_label, request) => {
		for (const model of ['gpt-4o-mini', 'gpt-5.4']) {
			const current = providerRequest(request, model);
			expect(sortedJson(buildOpenAIChatParams(current))).toBe(sortedJson(legacyBody(current)));
		}
	});

	it('skickar aldrig max_tokens eller reasoning_effort för dagens modeller', () => {
		for (const [, request] of productRequests) {
			const params = buildOpenAIChatParams(providerRequest(request, 'gpt-5.4'));
			expect(params).not.toHaveProperty('max_tokens');
			expect(params).not.toHaveProperty('reasoning_effort');
		}
	});

	it('utelämnar sampling och penalties som en modell saknar stöd för', () => {
		const restricted: OpenAITextModelCapabilities = {
			reasoning: 'default-none',
			temperature: false,
			penalties: false,
			jsonObject: true
		};
		const params = buildOpenAIChatParams(providerRequest(productRequests[2][1], 'synthetic-model'), {
			ok: true,
			capabilities: restricted
		});
		expect(params).not.toHaveProperty('temperature');
		expect(params).not.toHaveProperty('frequency_penalty');
		expect(params).not.toHaveProperty('presence_penalty');
		expect(params.max_completion_tokens).toBe(150);
	});

	it('släpper aldrig JSON-läget tyst för en modell som saknar det', () => {
		const call = () =>
			buildOpenAIChatParams(providerRequest(productRequests[3][1], 'synthetic-model'), {
				ok: true,
				capabilities: { reasoning: 'none', temperature: true, penalties: true, jsonObject: false }
			});
		expect(call).toThrow(AITextGenerationError);
		expect(call).toThrow(expect.objectContaining({ code: 'configuration', providerCode: 'json_object_unsupported' }));
	});

	it('ger konfigurationsfel för en otillåten modell', () => {
		expect(() => buildOpenAIChatParams(providerRequest(productRequests[0][1], 'gpt-9-imaginary'))).toThrow(
			expect.objectContaining({ code: 'configuration', providerCode: 'model_not_allowed' })
		);
	});
});

describe('OpenAITextProvider med inspelade svar', () => {
	function providerWith(response: unknown) {
		const create = vi.fn().mockResolvedValue(response);
		return { create, provider: new OpenAITextProvider({ chat: { completions: { create } } } as never) };
	}
	const request = providerRequest(productRequests[0][1], 'gpt-5.4');

	it('anropar aldrig leverantören med en otillåten modell', async () => {
		const { create, provider } = providerWith({});
		await expect(provider.generate({ ...request, model: 'gpt-9-imaginary' })).rejects.toMatchObject({
			code: 'configuration',
			providerCode: 'model_not_allowed'
		});
		expect(create).not.toHaveBeenCalled();
	});

	it('returnerar ett klippt svar som förut men loggar trunkeringen utan innehåll', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { provider } = providerWith({ choices: [{ finish_reason: 'length', message: { content: 'Syntetiskt halvt svar' } }] });
		await expect(provider.generate(request)).resolves.toBe('Syntetiskt halvt svar');
		expect(warn).toHaveBeenCalledWith('[ai:truncated]', {
			purpose: 'diary-reflection',
			model: 'gpt-5.4',
			finishReason: 'length',
			hasText: true
		});
		expect(JSON.stringify(warn.mock.calls)).not.toContain('Syntetiskt halvt svar');
		warn.mockRestore();
	});

	it.each([
		['tomt svar vid tokentaket', { finish_reason: 'length', message: { content: '' } }, 'length'],
		['vägran', { finish_reason: 'stop', message: { content: null, refusal: 'Syntetisk vägran' } }, 'refusal'],
		['innehållsfilter', { finish_reason: 'content_filter', message: { content: null } }, 'content_filter'],
		['inga val alls', undefined, undefined]
	])('%s blir empty_response', async (_label, choice, providerCode) => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { provider } = providerWith({ choices: choice ? [choice] : [] });
		const error = await provider.generate(request).catch((caught: unknown) => caught);
		expect(error).toMatchObject({ code: 'empty_response', providerCode });
		vi.restoreAllMocks();
	});
});
