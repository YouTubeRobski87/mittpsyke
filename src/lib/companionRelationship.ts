export type CompanionRelationshipStage = 0 | 1 | 2 | 3 | 4;

/** Var i scenen vännen står. Egna värden, skilda från följeslagarens
 *  COMPANION_SCENE_POSITIONS, så vännen aldrig kan hamna ovanpå djuret. */
export type FriendScenePositionId = 'shore-far' | 'shore-near' | 'shore-foreground';

export type FriendScenePosition = {
	id: FriendScenePositionId;
	/** Procent av scenens bredd/höjd, samma koordinatsystem som världseffekterna. */
	x: number;
	y: number;
	/** Andel av vänlagrets basbredd. */
	scale: number;
	opacity: number;
	/** Oskärpa i px - håller det avlägsna djuret bakom luftperspektivet. */
	blur: number;
};

export type FriendStageAsset = {
	src: string;
	position: FriendScenePosition;
	alt: '';
};

/** Ett vänpar. Nya par läggs till i FRIEND_PAIRINGS nedan - CompanionFriend
 *  behöver aldrig skrivas om för att stödja fler djur. */
export type FriendPairing = {
	companionId: string;
	friendId: string;
	assetsAvailable: boolean;
	stageAssets: Partial<Record<CompanionRelationshipStage, FriendStageAsset>>;
};

// Följeslagaren står vid x78/y82 (foreground-right i COMPANION_SCENE_POSITIONS).
// Vännens positioner håller sig därför till vänster om den, och trappas nedåt i
// bild så djuret läses som att det kommer närmare för varje steg.
//
// foreground-right används medvetet INTE för steg 4: det är exakt där
// följeslagaren står, och de två skulle överlappa. Steg 4 får i stället en egen
// främre position på samma strandlinje men tydligt åtskild i sidled.
//
// Värdena är kalibrerade mot de riktiga bilderna, inte mot en tom ruta.
export const FRIEND_SCENE_POSITIONS: Record<FriendScenePositionId, FriendScenePosition> = {
	// Bortre stranden, tvärs över vattnet.
	'shore-far': { id: 'shore-far', x: 53, y: 62, scale: 0.26, opacity: 0.5, blur: 0.6 },
	// Vattenbrynet på samma sida, en bit ner längs stranden.
	'shore-near': { id: 'shore-near', x: 52, y: 74, scale: 0.5, opacity: 0.88, blur: 0 },
	// Främre strandlinjen, samma djupled som följeslagaren men långt åt vänster.
	// Medvetet mindre och något svagare än följeslagaren så den förblir primär.
	'shore-foreground': { id: 'shore-foreground', x: 40, y: 81, scale: 0.56, opacity: 0.9, blur: 0 }
};

// Registret. Räven och rådjuret var det enda paret; räven är inte längre
// följeslagare, så registret är tomt tills björnen får en egen vän. Ett nytt
// par läggs till här - varken CompanionFriend eller sidorna behöver då röras.
// Positionerna ovan och rådjurets bilder i /images/world/friends ligger kvar.
const FRIEND_PAIRINGS: readonly FriendPairing[] = [];

export function getCompanionRelationshipStage(activeWeeks: number): CompanionRelationshipStage {
	if (activeWeeks >= 10) return 4;
	if (activeWeeks >= 6) return 3;
	if (activeWeeks >= 3) return 2;
	if (activeWeeks >= 1) return 1;
	return 0;
}

/** Vänparet för en följeslagare, eller null om den inte har något ännu. */
export function getFriendPairing(companionId: string | null | undefined): FriendPairing | null {
	if (!companionId) return null;
	return FRIEND_PAIRINGS.find((pairing) => pairing.companionId === companionId) ?? null;
}

/**
 * Bilden för ett givet steg, eller null om steget inte ska visa någon vän.
 * Returnerar null så länge parets assetsAvailable är false, så att en saknad
 * bildfil aldrig kan leda till en trasig bildlänk i produktion.
 */
export function getFriendStageAsset(
	companionId: string | null | undefined,
	stage: CompanionRelationshipStage
): FriendStageAsset | null {
	const pairing = getFriendPairing(companionId);
	if (!pairing || !pairing.assetsAvailable) return null;
	return pairing.stageAssets[stage] ?? null;
}
