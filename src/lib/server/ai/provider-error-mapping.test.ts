import OpenAI from 'openai';
import { describe, expect, it } from 'vitest';
import { normalizeOpenAIError } from './providers/openai-text-provider';

// OpenAI svarar HTTP 429 både vid verklig hastighetsbegränsning och när
// kontots kvot eller fakturering tagit slut. SDK:t gör om båda till samma
// RateLimitError, så skillnaden finns bara i felets code/type. Felen nedan är
// SDK:ts egna klasser med syntetiska svar - inget anrop görs.

function sdkError(status: number, code: string, message = 'Råtext från leverantören som inte får läcka.') {
	// Samma form som OpenAI:s svarskropp: { error: { code, type, message } }.
	return OpenAI.APIError.generate(status, { error: { code, type: code, message } }, message, {});
}

describe('normalizeOpenAIError', () => {
	it('skiljer slut på kvot från verklig hastighetsbegränsning', () => {
		const quota = normalizeOpenAIError(sdkError(429, 'insufficient_quota'));
		const rateLimit = normalizeOpenAIError(sdkError(429, 'rate_limit_exceeded'));

		expect(quota).toMatchObject({ code: 'quota', providerStatus: 429, providerCode: 'insufficient_quota' });
		expect(rateLimit).toMatchObject({ code: 'rate_limit', providerStatus: 429, providerCode: 'rate_limit_exceeded' });
	});

	it('behåller status och felkod för övriga leverantörsfel så loggen visar orsaken', () => {
		expect(normalizeOpenAIError(sdkError(401, 'invalid_api_key'))).toMatchObject({
			code: 'provider',
			providerStatus: 401,
			providerCode: 'invalid_api_key'
		});
		expect(normalizeOpenAIError(sdkError(404, 'model_not_found'))).toMatchObject({
			code: 'provider',
			providerStatus: 404,
			providerCode: 'model_not_found'
		});
		expect(normalizeOpenAIError(sdkError(503, 'server_error'))).toMatchObject({
			code: 'provider',
			providerStatus: 503
		});
	});

	it('mappar timeout och nätverksfel utan påhittad status', () => {
		expect(normalizeOpenAIError(new OpenAI.APIConnectionTimeoutError())).toMatchObject({ code: 'timeout' });
		const network = normalizeOpenAIError(new OpenAI.APIConnectionError({ message: 'ECONNRESET' }));
		expect(network.code).toBe('provider');
		expect(network.providerStatus).toBeUndefined();
	});

	it('bär aldrig vidare leverantörens fritext eller misstänkta värden', () => {
		const error = normalizeOpenAIError(sdkError(429, 'insufficient_quota', 'Incorrect key sk-proj-abc123 för konto x'));
		expect(JSON.stringify({ ...error, message: error.message })).not.toMatch(/sk-proj|Incorrect key|konto x/);

		// Bara korta identifierare godtas som felkod, aldrig fri text.
		const odd = normalizeOpenAIError(sdkError(400, 'Bearer sk-hemlig nyckel här'));
		expect(odd.providerCode).toBeUndefined();
		expect(odd.providerStatus).toBe(400);
	});
});
