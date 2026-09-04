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

export class AITextGenerationError extends Error {
	constructor(
		public readonly code: 'configuration' | 'timeout' | 'rate_limit' | 'provider' | 'empty_response',
		message: string
	) {
		super(message);
		this.name = 'AITextGenerationError';
	}
}
