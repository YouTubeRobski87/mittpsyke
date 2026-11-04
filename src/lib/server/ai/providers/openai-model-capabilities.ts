// Ren data och validering utan SDK- eller miljöberoenden, så att
// konfigurationslagret kan granska modellval utan att ladda OpenAI-klienten.

/**
 * Granskade parameteregenskaper per OpenAI-modell. Bara modeller som finns här
 * får anropas. Ett okänt ID ger ett konfigurationsfel i stället för att skickas
 * vidare med parametrar som modellen kanske inte stöder.
 *
 * reasoning:
 * - 'none': modellen saknar resonemang (t.ex. gpt-4o-mini).
 * - 'default-none': resonemangsmodell vars dokumenterade standard är
 *   reasoning effort 'none'. Fältet skickas inte, så requesten är identisk
 *   med tidigare och resonemangstokens tär inte på de korta tokenbudgetarna.
 *
 * Modeller med annan standard (t.ex. 'medium') får inte läggas till här utan
 * att adaptern först lär sig skicka reasoning_effort och att tokenbudgetarna
 * granskas. OpenAI anger att temperature, top_p och logprobs ska tas bort när
 * reasoning effort inte är 'none'.
 *
 * Kontrollerat mot OpenAI:s modell- och avvecklingssidor 2026-11-04, se
 * docs/ai/AI-modelljamforelse-2026.md.
 */
export type OpenAITextModelCapabilities = {
	reasoning: 'none' | 'default-none';
	temperature: boolean;
	penalties: boolean;
	jsonObject: boolean;
};

const GPT_4O_MINI: OpenAITextModelCapabilities = {
	reasoning: 'none',
	temperature: true,
	penalties: true,
	jsonObject: true
};

// Penalties är inte dokumenterade för GPT-5.4 men skickas redan i drift.
// De behålls för att inte ändra befintligt beteende.
const GPT_5_4: OpenAITextModelCapabilities = {
	reasoning: 'default-none',
	temperature: true,
	penalties: true,
	jsonObject: true
};

export const OPENAI_TEXT_MODEL_CAPABILITIES: Readonly<Record<string, OpenAITextModelCapabilities>> = {
	'gpt-4o-mini': GPT_4O_MINI,
	'gpt-4o-mini-2024-07-18': GPT_4O_MINI,
	'gpt-5.4': GPT_5_4,
	'gpt-5.4-2026-03-05': GPT_5_4
};

// Modell-ID:n är korta identifierare. Allt annat (blanksteg, citattecken,
// kontrolltecken) är ett felinklistrat värde, inte en modell.
const MODEL_ID_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,99}$/i;

export type OpenAIModelValidation =
	| { ok: true; capabilities: OpenAITextModelCapabilities }
	| { ok: false; reason: 'invalid_model_id' | 'model_not_allowed' };

/** Avgör om ett modell-ID får användas, utan nätverksanrop. */
export function validateOpenAITextModel(model: string): OpenAIModelValidation {
	if (!MODEL_ID_PATTERN.test(model)) return { ok: false, reason: 'invalid_model_id' };
	const capabilities = OPENAI_TEXT_MODEL_CAPABILITIES[model];
	return capabilities ? { ok: true, capabilities } : { ok: false, reason: 'model_not_allowed' };
}
