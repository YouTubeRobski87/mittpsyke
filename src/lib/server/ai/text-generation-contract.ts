/** Provider-neutral contract owned by the MittPsyke AI product layer. */
export type AITextPurpose =
	| 'support-chat'
	| 'diary-reflection'
	| 'checkin-reflection'
	| 'diary-narrative'
	| 'user-memory';

export type AIMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

export type AITextRequest = {
	purpose: AITextPurpose;
	messages: readonly AIMessage[];
	systemInstructions?: readonly string[];
	temperature?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
	outputFormat?: 'text' | 'json_object';
};

export type AITextResponse = {
	text: string;
	model: string;
};

export type AIModelConfiguration = {
	model: string;
	timeoutMs: number;
	maxOutputTokens: number;
};

export type AITextProviderRequest = AITextRequest & AIModelConfiguration;

export interface AITextProvider {
	generate(request: AITextProviderRequest): Promise<string>;
}

/**
 * Leverantörens HTTP-status och korta felkod (t.ex. 'insufficient_quota'),
 * enbart för serverloggen. Aldrig fritext, nycklar eller innehåll.
 */
export type AIProviderDiagnostics = {
	providerStatus?: number;
	providerCode?: string;
};

export class AITextGenerationError extends Error {
	public readonly providerStatus?: number;
	public readonly providerCode?: string;

	constructor(
		// 'quota': leverantörens kvot eller fakturering är slut. Skiljs från
		// 'rate_limit' eftersom båda kommer som HTTP 429 men bara det ena går
		// över av att vänta en stund.
		public readonly code: 'configuration' | 'timeout' | 'rate_limit' | 'quota' | 'provider' | 'empty_response',
		message: string,
		diagnostics: AIProviderDiagnostics = {}
	) {
		super(message);
		this.name = 'AITextGenerationError';
		this.providerStatus = diagnostics.providerStatus;
		this.providerCode = diagnostics.providerCode;
	}
}

/**
 * Grov felkategori för loggar och larm. Skiljer fel som en administratör
 * måste åtgärda ('configuration', 'account') från fel som brukar gå över av
 * sig själva ('transient'). Felkoden på AITextGenerationError är oförändrad;
 * kategorin härleds från den och från leverantörens status och felkod.
 */
export type AIFailureKind = 'configuration' | 'account' | 'transient' | 'response' | 'request' | 'unknown';

// Leverantörskoder som betyder att requesten aldrig kan lyckas med nuvarande
// inställningar, oavsett hur många gånger den skickas.
const CONFIGURATION_PROVIDER_CODES = new Set([
	'invalid_model_id',
	'model_not_allowed',
	'json_object_unsupported',
	'model_not_found',
	'unsupported_parameter',
	'unsupported_value',
	'invalid_api_key'
]);

export function classifyAIFailure(error: AITextGenerationError): AIFailureKind {
	if (error.code === 'configuration') return 'configuration';
	if (error.code === 'quota') return 'account';
	if (error.code === 'timeout' || error.code === 'rate_limit') return 'transient';
	if (error.code === 'empty_response') return 'response';
	if (error.providerCode && CONFIGURATION_PROVIDER_CODES.has(error.providerCode)) return 'configuration';
	const status = error.providerStatus;
	if (status === 401 || status === 403 || status === 404) return 'configuration';
	if (status === 408 || status === 409 || status === 429 || (status !== undefined && status >= 500)) return 'transient';
	if (status !== undefined && status >= 400) return 'request';
	// Utan HTTP-status går nätverksfel inte att skilja från andra oväntade fel.
	return 'unknown';
}
