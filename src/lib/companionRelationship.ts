export type CompanionRelationshipStage = 0 | 1 | 2 | 3 | 4;

/** Var i scenen vännen står. Egna värden, skilda från följeslagarens
 *  COMPANION_SCENE_POSITIONS, så vännen aldrig kan hamna ovanpå djuret. */
export type FriendScenePositionId = 'shore-far' | 'shore-near';

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

// Placeringarna är satta för att (1) hålla vännen till vänster om och ovanför
// följeslagaren, som står vid x78/y82, och (2) ge tydlig separation mellan
// stegen så att djuret läses som att det kommer närmare.
//
// Exakta värden behöver finjusteras visuellt när de riktiga bilderna finns -
// ett rådjurs tyngdpunkt och silhuett går inte att kalibrera mot en tom ruta.
const FRIEND_SCENE_POSITIONS: Record<FriendScenePositionId, FriendScenePosition> = {
	// Bortre stranden, tvärs över vattnet.
	'shore-far': { id: 'shore-far', x: 62, y: 62, scale: 0.26, opacity: 0.5, blur: 0.6 },
	// Vattenbrynet på samma sida, en bit ner längs stranden från följeslagaren.
	'shore-near': { id: 'shore-near', x: 52, y: 74, scale: 0.5, opacity: 0.88, blur: 0 }
};

const DEER_ASSET_BASE_PATH = '/images/world/friends';

// Steg 0 och 1 saknar medvetet bild: steg 0 är tomt, och steg 1 är enbart det
// diskreta naturtecknet som AmbientWorld redan renderar i ren CSS.
//
// Steg 4 använder samma närposition som steg 3 men en vilande pose. Den måste
// finnas här: utan den skulle en användare som når steg 4 se rådjuret
// försvinna, vilket vore precis den nedgradering systemet aldrig får göra.
const DEER_STAGE_ASSETS: Partial<Record<CompanionRelationshipStage, FriendStageAsset>> = {
	2: {
		src: `${DEER_ASSET_BASE_PATH}/deer-silhouette-far.webp`,
		position: FRIEND_SCENE_POSITIONS['shore-far'],
		alt: ''
	},
	3: {
		src: `${DEER_ASSET_BASE_PATH}/deer-standing-near.webp`,
		position: FRIEND_SCENE_POSITIONS['shore-near'],
		alt: ''
	},
	4: {
		src: `${DEER_ASSET_BASE_PATH}/deer-resting-near.webp`,
		position: FRIEND_SCENE_POSITIONS['shore-near'],
		alt: ''
	}
};

export const FOX_DEER_RELATIONSHIP = {
	companionId: 'fox',
	friendId: 'deer',
	// Inga rådjursbilder är tillagda ännu. Komponenten är därför säkert dold
	// för steg 2–4 tills licensierade, frilagda tillgångar finns på plats.
	// Se docs/COMPANION_FRIEND_ASSETS.md för exakt filspecifikation.
	assetsAvailable: false,
	stageAssets: DEER_STAGE_ASSETS
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

/**
 * Bilden för ett givet steg, eller null om steget inte ska visa någon vän.
 * Returnerar null så länge assetsAvailable är false, så att en saknad
 * feature-flagga aldrig kan leda till en trasig bildlänk i produktion.
 */
export function getFriendStageAsset(
	companionId: string | null | undefined,
	stage: CompanionRelationshipStage
): FriendStageAsset | null {
	if (!isFoxDeerRelationship(companionId)) return null;
	if (!FOX_DEER_RELATIONSHIP.assetsAvailable) return null;
	return FOX_DEER_RELATIONSHIP.stageAssets[stage] ?? null;
}
