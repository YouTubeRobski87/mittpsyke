export type CompanionRelationshipStage = 0 | 1 | 2 | 3 | 4;

export const FOX_DEER_RELATIONSHIP = {
	companionId: 'fox',
	friendId: 'deer',
	// Inga rådjursbilder är tillagda ännu. Komponenten är därför säkert dold
	// för steg 2–4 tills licensierade, frilagda tillgångar finns på plats.
	assetsAvailable: false
} as const;

export function getCompanionRelationshipStage(activeWeeks: number): CompanionRelationshipStage {
	if (activeWeeks >= 10) return 4;
	if (activeWeeks >= 6) return 3;
	if (activeWeeks >= 3) return 2;
	if (activeWeeks >= 1) return 1;
	return 0;
}

export function isFoxDeerRelationship(companionId: string | null | undefined) {
	return companionId === FOX_DEER_RELATIONSHIP.companionId;
}
