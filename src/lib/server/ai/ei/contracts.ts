// Kontrakt för EI-v2. Rena typer och enumvärden — ingen logik, ingen I/O.
//
// DecisionLog beskriver OBSERVERBARA BESLUT: vad systemet valde att göra.
// Den beskriver aldrig kvalitet, säkerhet eller inre resonemang. Se
// docs/ai/ei-v2-contracts.md för varför gränsen går där.

/** Svarstyp — vilken sorts svar som gavs. */
export const RESPONSE_TYPES = [
	'open_invitation',
	'reflective',
	'clarifying',
	'grounding',
	'informational',
	'boundary_setting'
] as const;
export type ResponseType = (typeof RESPONSE_TYPES)[number];

/**
 * Innehållszon enligt sektion 4 i docs/ai/emotional-intelligence.md.
 * A = känsla och inre upplevelse, B = händelse och observerbart sakförhållande,
 * C = tolkning, generalisering eller slutsats. Zonerna är innehållstyper,
 * inte en skala — C är inte "värre" än A.
 */
export const CONTENT_ZONES = ['A', 'B', 'C'] as const;
export type ContentZone = (typeof CONTENT_ZONES)[number];

/** Vilken kontext svaret faktiskt byggde på. */
export const CONTEXT_HANDLINGS = [
	'insufficient_context',
	'used_current_message',
	'used_conversation_context',
	'used_authorized_memory'
] as const;
export type ContextHandling = (typeof CONTEXT_HANDLINGS)[number];

/** Hur osäkerhet hanterades. */
export const UNCERTAINTY_HANDLINGS = [
	'not_applicable',
	'state_uncertainty',
	'ask_for_more_context',
	'offer_multiple_interpretations',
	'avoid_inference'
] as const;
export type UncertaintyHandling = (typeof UNCERTAINTY_HANDLINGS)[number];

/** Vilket minne som användes. Verifieras mot faktiskt skickad kontext. */
export const MEMORY_USES = ['none', 'conversation_only', 'authorized_persistent_memory'] as const;
export type MemoryUse = (typeof MEMORY_USES)[number];

/**
 * Säkerhetsutfall. Sätts ALLTID av säkerhetslagret i api/chat/+server.ts,
 * aldrig av modellen. Se validation.ts.
 */
export const SAFETY_OUTCOMES = [
	'no_escalation',
	'supportive_check_in',
	'crisis_guidance',
	'emergency_guidance'
] as const;
export type SafetyOutcome = (typeof SAFETY_OUTCOMES)[number];

/**
 * Stabilt princip-ID. ID:t ändras aldrig i betydelse — en princip vars innehåll
 * ändras materiellt får ett nytt ID eller en versionerad definition, så att en
 * historisk DecisionLog fortsätter peka på det som faktiskt gällde då.
 */
export type PrincipleId = string;

/** En princip i en EIConfig. */
export type Principle = {
	id: PrincipleId;
	/** Mänskligt läsbart namn, samma som rubriken i källdokumentet. */
	name: string;
	/** Var principen är definierad, för spårbarhet. */
	source: 'conversation-philosophy' | 'emotional-intelligence';
};

/** Schemaversion för DecisionLog-formatet självt (inte för EIConfig). */
export const DECISION_LOG_SCHEMA_VERSION = '1.0.0';

/**
 * Det modellen får uttala sig om: vad den valde att göra. Runtime-ägda fält
 * (schemaVersion, eiConfigVersion, eiConfigHash, safetyOutcome) ingår medvetet
 * inte här — modellen ska inte ens kunna föreslå dem.
 */
export type ModelDecisionClaim = {
	responseType: ResponseType;
	contentZones: ContentZone[];
	contextHandling: ContextHandling;
	uncertaintyHandling: UncertaintyHandling;
	memoryUse: MemoryUse;
	principlesApplied: PrincipleId[];
};

/** Fakta som bara runtime känner till och därför alltid sätter själv. */
export type RuntimeDecisionFacts = {
	eiConfigVersion: string;
	eiConfigHash: string;
	/** Kommer från säkerhetslagret, inte från modellen. */
	safetyOutcome: SafetyOutcome;
	/** Vilken kontext som faktiskt skickades — memoryUse verifieras mot detta. */
	contextActuallySent: {
		conversationHistoryIncluded: boolean;
		authorizedMemoryIncluded: boolean;
	};
};

export type DecisionLog = {
	schemaVersion: string;
	eiConfigVersion: string;
	eiConfigHash: string;
	responseType: ResponseType;
	contentZones: ContentZone[];
	contextHandling: ContextHandling;
	uncertaintyHandling: UncertaintyHandling;
	memoryUse: MemoryUse;
	principlesApplied: PrincipleId[];
	safetyOutcome: SafetyOutcome;
};

export const EVALUATION_LOG_SCHEMA_VERSION = '1.0.0';

/**
 * Mänsklig bedömning av en körning. Medvetet separerad från DecisionLog:
 * DecisionLog säger vad systemet gjorde, EvaluationLog säger hur bra det var.
 * Att blanda dem skulle låta systemet betygsätta sig självt.
 */
export type EvaluationLog = {
	schemaVersion: string;
	decisionLogId: string;
	evaluatorType: 'human';
	evaluatorId: string;
	/** ISO 8601. */
	evaluatedAt: string;
	verdicts: {
		contextCalibration?: 'poor' | 'acceptable' | 'strong';
		grounding?: 'generic' | 'partly_grounded' | 'grounded';
		uncertaintyCalibration?: 'poor' | 'acceptable' | 'strong';
		principleCompliance?: 'failed' | 'partial' | 'passed';
	};
	violatedPrinciples: PrincipleId[];
	notes?: string;
};
