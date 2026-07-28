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
// Exakta värden behöver finjusteras visuellt när de riktiga bilderna finns -
// ett rådjurs tyngdpunkt och silhuett går inte att kalibrera mot en tom ruta.
const FRIEND_SCENE_POSITIONS: Record<FriendScenePositionId, FriendScenePosition> = {
	// Bortre stranden, tvärs över vattnet.
	'shore-far': { id: 'shore-far', x: 62, y: 62, scale: 0.26, opacity: 0.5, blur: 0.6 },
	// Vattenbrynet på samma sida, en bit ner längs stranden.
	'shore-near': { id: 'shore-near', x: 52, y: 74, scale: 0.5, opacity: 0.88, blur: 0 },
	// Främre strandlinjen, samma djupled som följeslagaren men långt åt vänster.
	// Medvetet mindre och något svagare än följeslagaren så räven förblir primär.
	'shore-foreground': { id: 'shore-foreground', x: 40, y: 81, scale: 0.56, opacity: 0.9, blur: 0 }
};

const FRIENDS_ASSET_BASE_PATH = '/images/world/friends';

// Steg 0 och 1 saknar medvetet bild: steg 0 är tomt, och steg 1 är enbart det
// diskreta naturtecknet som AmbientWorld redan renderar i ren CSS.
//
// Steg 4 måste ha en egen post. Utan den skulle en användare som når steg 4 se
// rådjuret försvinna, vilket vore precis den nedgradering systemet aldrig får
// göra.
const DEER_STAGE_ASSETS: Partial<Record<CompanionRelationshipStage, FriendStageAsset>> = {
	2: {
		src: `${FRIENDS_ASSET_BASE_PATH}/deer-silhouette-far.webp`,
		position: FRIEND_SCENE_POSITIONS['shore-far'],
		alt: ''
	},
	3: {
		src: `${FRIENDS_ASSET_BASE_PATH}/deer-standing-near.webp`,
		position: FRIEND_SCENE_POSITIONS['shore-near'],
		alt: ''
	},
	4: {
		src: `${FRIENDS_ASSET_BASE_PATH}/deer-resting-near.webp`,
		position: FRIEND_SCENE_POSITIONS['shore-foreground'],
		alt: ''
	}
};

export const FOX_DEER_RELATIONSHIP: FriendPairing = {
	companionId: 'fox',
	friendId: 'deer',
	// Inga rådjursbilder är tillagda ännu. Komponenten är därför säkert dold
	// för steg 2-4 tills licensierade, frilagda tillgångar finns på plats.
	// Se docs/COMPANION_FRIEND_ASSETS.md för exakt filspecifikation.
	assetsAvailable: false,
	stageAssets: DEER_STAGE_ASSETS
};

// Registret. Lägg till björn -> ekorre här när de assetsen finns; varken
// CompanionFriend eller sidorna behöver då röras.
const FRIEND_PAIRINGS: readonly FriendPairing[] = [FOX_DEER_RELATIONSHIP];

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

export function isFoxDeerRelationship(companionId: string | null | undefined) {
	return companionId === FOX_DEER_RELATIONSHIP.companionId;
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
