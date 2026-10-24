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
