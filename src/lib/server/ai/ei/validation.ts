import { z } from 'zod';
import {
	CONTENT_ZONES,
	CONTEXT_HANDLINGS,
	DECISION_LOG_SCHEMA_VERSION,
	EVALUATION_LOG_SCHEMA_VERSION,
	MEMORY_USES,
	RESPONSE_TYPES,
	SAFETY_OUTCOMES,
	UNCERTAINTY_HANDLINGS,
	type DecisionLog,
	type EvaluationLog,
	type RuntimeDecisionFacts
} from './contracts';
import { ACTIVE_EI_CONFIG, getPrincipleIds, type EIConfig } from './config';

// Validering och proveniens.
//
// Bärande idé: modellen får bara uttala sig om vad den valde att göra. Allt som
// runtime vet bättre — konfigurationens identitet och säkerhetsutfallet — sätts
// av runtime och kan inte ens uttryckas av modellen.

/**
 * Schema för modellens påstående. `.strict()` gör att ALLA okända fält avvisas:
 * dels runtime-ägda fält (eiConfigHash, safetyOutcome ...), dels de uttryckligen
 * förbjudna (confidence, answerQuality, empathy, reasoning, procentsatser).
 */
const modelDecisionClaimSchema = z
	.object({
		responseType: z.enum(RESPONSE_TYPES),
		contentZones: z.array(z.enum(CONTENT_ZONES)).min(1),
		contextHandling: z.enum(CONTEXT_HANDLINGS),
		uncertaintyHandling: z.enum(UNCERTAINTY_HANDLINGS),
		memoryUse: z.enum(MEMORY_USES),
		principlesApplied: z.array(z.string())
	})
	.strict();

/** Fält som aldrig får förekomma i en DecisionLog, oavsett var de kommer ifrån. */
export const FORBIDDEN_DECISION_LOG_FIELDS = [
	'confidence',
	'answerQuality',
	'empathy',
	'reasoning',
	'chainOfThought',
	'score',
	'percentage',
	'userMessage',
	'message',
	'text'
] as const;

export type DecisionLogValidation =
	| { valid: true; decisionLog: DecisionLog }
	| { valid: false; errors: string[] };

/**
 * Bygger en validerad DecisionLog av modellens påstående och runtimes fakta.
 *
 * Runtime vinner alltid. Om modellen försöker skicka med ett runtime-ägt fält
 * avvisas hela loggen i stället för att fältet tyst skrivs över — ett sådant
 * försök är i sig värt att upptäcka i shadow mode.
 */
export function buildDecisionLog(
	claim: unknown,
	runtime: RuntimeDecisionFacts,
	config: EIConfig = ACTIVE_EI_CONFIG
): DecisionLogValidation {
	const parsed = modelDecisionClaimSchema.safeParse(claim);
	if (!parsed.success) {
		return {
			valid: false,
			errors: parsed.error.issues.map(
				(issue) => `${issue.path.join('.') || '(rot)'}: ${issue.message}`
			)
		};
	}

	const errors: string[] = [];
	const claimed = parsed.data;

	// Princip-ID:n måste finnas i den konfiguration som faktiskt kördes.
	const knownPrincipleIds = getPrincipleIds(config);
	for (const principleId of claimed.principlesApplied) {
		if (!knownPrincipleIds.has(principleId)) {
			errors.push(`principlesApplied: okänt princip-ID "${principleId}" i ${config.eiConfigVersion}`);
		}
	}

	// Svarstyp och zoner måste vara tillåtna i just den här konfigurationen —
	// enumet är bredare än vad en enskild konfiguration behöver tillåta.
	if (!config.allowedResponseTypes.includes(claimed.responseType)) {
		errors.push(`responseType: "${claimed.responseType}" tillåts inte i ${config.eiConfigVersion}`);
	}
	for (const zone of claimed.contentZones) {
		if (!config.allowedContentZones.includes(zone)) {
			errors.push(`contentZones: zon "${zone}" tillåts inte i ${config.eiConfigVersion}`);
		}
	}

	// Minnesanvändning verifieras mot vad som faktiskt skickades, inte mot vad
	// modellen tror att den använde.
	const { conversationHistoryIncluded, authorizedMemoryIncluded } = runtime.contextActuallySent;
	if (claimed.memoryUse === 'authorized_persistent_memory' && !authorizedMemoryIncluded) {
		errors.push('memoryUse: påstår auktoriserat minne, men inget minne skickades med');
	}
	if (claimed.memoryUse === 'conversation_only' && !conversationHistoryIncluded) {
		errors.push('memoryUse: påstår samtalshistorik, men ingen historik skickades med');
	}
	if (claimed.contextHandling === 'used_authorized_memory' && !authorizedMemoryIncluded) {
		errors.push('contextHandling: påstår auktoriserat minne, men inget minne skickades med');
	}
	if (claimed.contextHandling === 'used_conversation_context' && !conversationHistoryIncluded) {
		errors.push('contextHandling: påstår samtalskontext, men ingen historik skickades med');
	}

	// Säkerhetslagret i api/chat/+server.ts granskar bara det aktuella
	// meddelandet och returnerar direkt vid utslag — innan kontext, minne och
	// prompt ens monteras. En logg som påstår både krisutfall och använd
	// historik beskriver därför något som inte kan ha hänt.
	const safetyStopped =
		runtime.safetyOutcome === 'crisis_guidance' || runtime.safetyOutcome === 'emergency_guidance';
	if (safetyStopped) {
		if (claimed.contextHandling !== 'used_current_message') {
			errors.push(
				`contextHandling: vid ${runtime.safetyOutcome} returnerar säkerhetslagret innan kontext monteras — bara "used_current_message" är möjligt`
			);
		}
		if (claimed.memoryUse !== 'none') {
			errors.push(
				`memoryUse: vid ${runtime.safetyOutcome} skickas inget minne till modellen — bara "none" är möjligt`
			);
		}
	}

	if (errors.length > 0) {
		return { valid: false, errors };
	}

	return {
		valid: true,
		decisionLog: {
			// Runtime-ägda fält sätts här och ingen annanstans.
			schemaVersion: DECISION_LOG_SCHEMA_VERSION,
			eiConfigVersion: runtime.eiConfigVersion,
			eiConfigHash: runtime.eiConfigHash,
			safetyOutcome: runtime.safetyOutcome,
			responseType: claimed.responseType,
			contentZones: claimed.contentZones,
			contextHandling: claimed.contextHandling,
			uncertaintyHandling: claimed.uncertaintyHandling,
			memoryUse: claimed.memoryUse,
			principlesApplied: claimed.principlesApplied
		}
	};
}

/** Fullständigt DecisionLog-schema, för validering av redan lagrade loggar. */
export const decisionLogSchema = z
	.object({
		schemaVersion: z.string().min(1),
		eiConfigVersion: z.string().min(1),
		eiConfigHash: z.string().regex(/^[0-9a-f]{64}$/, 'ogiltig SHA-256-hash'),
		responseType: z.enum(RESPONSE_TYPES),
		contentZones: z.array(z.enum(CONTENT_ZONES)).min(1),
		contextHandling: z.enum(CONTEXT_HANDLINGS),
		uncertaintyHandling: z.enum(UNCERTAINTY_HANDLINGS),
		memoryUse: z.enum(MEMORY_USES),
		principlesApplied: z.array(z.string()),
		safetyOutcome: z.enum(SAFETY_OUTCOMES)
	})
	.strict();

export const evaluationLogSchema = z
	.object({
		schemaVersion: z.string().min(1),
		decisionLogId: z.string().min(1),
		evaluatorType: z.literal('human'),
		evaluatorId: z.string().min(1),
		evaluatedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'ogiltigt datum'),
		verdicts: z
			.object({
				contextCalibration: z.enum(['poor', 'acceptable', 'strong']).optional(),
				grounding: z.enum(['generic', 'partly_grounded', 'grounded']).optional(),
				uncertaintyCalibration: z.enum(['poor', 'acceptable', 'strong']).optional(),
				principleCompliance: z.enum(['failed', 'partial', 'passed']).optional()
			})
			.strict(),
		violatedPrinciples: z.array(z.string()),
		notes: z.string().optional()
	})
	.strict();

export function validateEvaluationLog(
	value: unknown,
	config: EIConfig = ACTIVE_EI_CONFIG
): { valid: true; evaluationLog: EvaluationLog } | { valid: false; errors: string[] } {
	const parsed = evaluationLogSchema.safeParse(value);
	if (!parsed.success) {
		return {
			valid: false,
			errors: parsed.error.issues.map(
				(issue) => `${issue.path.join('.') || '(rot)'}: ${issue.message}`
			)
		};
	}

	const knownPrincipleIds = getPrincipleIds(config);
	const errors = parsed.data.violatedPrinciples
		.filter((principleId) => !knownPrincipleIds.has(principleId))
		.map((principleId) => `violatedPrinciples: okänt princip-ID "${principleId}"`);

	if (errors.length > 0) return { valid: false, errors };

	return { valid: true, evaluationLog: parsed.data };
}

export { DECISION_LOG_SCHEMA_VERSION, EVALUATION_LOG_SCHEMA_VERSION };
