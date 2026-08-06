export type AIActionKind = 'create' | 'update' | 'delete' | 'publish' | 'share';

export type AIActionProposal<TPayload> = Readonly<{
	kind: AIActionKind;
	payload: TPayload;
	summary: string;
	status: 'proposed';
	requiresUserApproval: true;
}>;

export type AIActionValidation<TPayload> =
	| Readonly<{ valid: true; proposal: AIActionProposal<TPayload> }>
	| Readonly<{ valid: false; reason: string }>;

export function proposeAIAction<TPayload>(
	kind: AIActionKind,
	payload: TPayload,
	summary: string
): AIActionProposal<TPayload> {
	return Object.freeze({ kind, payload, summary, status: 'proposed' as const, requiresUserApproval: true as const });
}

export function validateAIAction<TPayload>(
	proposal: AIActionProposal<TPayload>,
	validate: (payload: TPayload) => boolean
): AIActionValidation<TPayload> {
	if (!validate(proposal.payload)) return { valid: false, reason: 'Ogiltigt åtgärdsunderlag.' };
	return { valid: true, proposal };
}

/**
 * Returnerar endast ett godkänt underlag. Den utför aldrig en sidoeffekt;
 * anropsstället måste göra åtgärden separat efter uttryckligt användargodkännande.
 */
export function approveAIAction<TPayload>(
	validation: AIActionValidation<TPayload>,
	userApproval: boolean
): TPayload | null {
	if (!validation.valid || userApproval !== true) return null;
	return validation.proposal.payload;
}
