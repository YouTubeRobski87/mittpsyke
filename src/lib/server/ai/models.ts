// Central modellkonfiguration för alla Claude-anrop.
//
// Modell-ID:n låg tidigare hårdkodade på tolv ställen i koden, vilket gjorde att
// två av dem hann bli avvecklade utan att någon märkte det (se ai-lagrets
// felloggning). Lägg alltid till nya modeller här i stället.
//
// Använd alias utan datumsuffix ('claude-opus-5', inte 'claude-opus-5-2026...').
// Alias:en är kompletta som de är och pekar alltid på rätt version.

export const CLAUDE_MODELS = {
	/** Djupare resonemang, analys och längre texter. */
	deep: 'claude-opus-5',
	/** Korta, högfrekventa uppgifter där svarstid väger tyngre än djup. */
	fast: 'claude-haiku-4-5'
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];

// Pris per miljon tokens i USD, för kostnadsuppskattningen i usage-loggen.
// Uppdatera tillsammans med CLAUDE_MODELS.
const PRICE_PER_MTOK: Record<ClaudeModel, { input: number; output: number }> = {
	'claude-opus-5': { input: 5, output: 25 },
	'claude-haiku-4-5': { input: 1, output: 5 }
};

/**
 * Tolkar ett modellnamn från miljövariabel. Okända värden ignoreras med en
 * varning i stället för att skickas vidare — det är så de avvecklade
 * sonnet-4-pinningarna kunde ligga kvar och tyst falla tillbaka.
 */
export function resolveModel(value: string | undefined, fallback: ClaudeModel): ClaudeModel {
	const trimmed = value?.trim();
	if (!trimmed) return fallback;

	const known = Object.values(CLAUDE_MODELS).find((model) => model === trimmed);
	if (known) return known;

	console.warn(`[ai] Okänd modell "${trimmed}" i miljövariabel — använder ${fallback} i stället.`);
	return fallback;
}

export function estimateCostUsd(
	model: ClaudeModel,
	inputTokens: number,
	outputTokens: number
): number {
	const price = PRICE_PER_MTOK[model];
	if (!price) return 0;

	return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}
