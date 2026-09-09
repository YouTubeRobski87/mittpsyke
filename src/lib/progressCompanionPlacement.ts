import { COMPANION_POSES, type CompanionId, type CompanionPose } from '$lib/companionPoseManifest';

/** Originalmåtten för Framstegs sjöscen. */
export const PROGRESS_SCENE_IMAGE_SIZE = { width: 1672, height: 941 } as const;

/**
 * Scenrutans mätta storlek. Geometrin nedan behöver ingenting mer: bilden är
 * densamma genom alla dygnsspann och renderas likadant i alla brytpunkter.
 */
export type ProgressSceneGeometryInput = {
	containerWidth: number;
	containerHeight: number;
};

type SceneGeometry = {
	renderedWidth: number;
	renderedHeight: number;
	offsetX: number;
	offsetY: number;
};

/**
 * object-fit: contain-geometrin för hero-bilden: hur mycket originalbilden
 * skalas och var den hamnar i containern.
 *
 * Speglar exakt vad CSS gör i routen - `object-fit: contain` med
 * `object-position: center`. Contain skalar efter den MINSTA kvoten, så hela
 * kompositionen ryms, och det som blir över fördelas lika på båda sidor.
 *
 * Just nu har scenrutan samma aspect-ratio som bilden (1672:941), så inget
 * utrymme blir över. Det är medvetet inget antagande här: räknas offset ut
 * ändå fortsätter stugans klickyta att ligga rätt även om rutan en dag får en
 * annan proportion.
 */
function getSceneGeometry({
	containerWidth,
	containerHeight
}: ProgressSceneGeometryInput): SceneGeometry | null {
	if (containerWidth <= 0 || containerHeight <= 0) return null;

	const scale = Math.min(
		containerWidth / PROGRESS_SCENE_IMAGE_SIZE.width,
		containerHeight / PROGRESS_SCENE_IMAGE_SIZE.height
	);
	const renderedWidth = PROGRESS_SCENE_IMAGE_SIZE.width * scale;
	const renderedHeight = PROGRESS_SCENE_IMAGE_SIZE.height * scale;

	return {
		renderedWidth,
		renderedHeight,
		// object-position: center - resten av rutan delas lika på båda sidor.
		offsetX: (containerWidth - renderedWidth) / 2,
		offsetY: (containerHeight - renderedHeight) / 2
	};
}

/**
 * Stugans yta i ORIGINALBILDENS koordinater (procent). Uppmätt mot sjöscenen: tak,
 * väggar och farstubro, utan att nå vattnet eller trädlinjen bakom.
 */
export const PROGRESS_CABIN_SOURCE_BOX = { x: 6.5, y: 28, width: 16, height: 19 } as const;

/** Minsta synliga motivyta respektive färdiga interaktiva träffyta. */
const MIN_CABIN_VISIBLE_SIZE = 24;
export const MIN_PROGRESS_CABIN_HIT_SIZE = 44;

export type ProgressCabinPlacement = { left: number; top: number; width: number; height: number };

/**
 * Stugans klickyta, översatt från originalbilden till den synliga hero-ytan med
 * samma scengeometri som bilden använder. Rutan klipps mot containern och blir
 * null när det som återstår är för litet för att träffa.
 */
export function getProgressCabinPlacement(
	input: ProgressSceneGeometryInput
): ProgressCabinPlacement | null {
	const geometry = getSceneGeometry(input);
	if (!geometry) return null;

	const { renderedWidth, renderedHeight, offsetX, offsetY } = geometry;
	const rawLeft = offsetX + renderedWidth * (PROGRESS_CABIN_SOURCE_BOX.x / 100);
	const rawTop = offsetY + renderedHeight * (PROGRESS_CABIN_SOURCE_BOX.y / 100);
	const left = Math.max(0, rawLeft);
	const top = Math.max(0, rawTop);
	const right = Math.min(
		input.containerWidth,
		rawLeft + renderedWidth * (PROGRESS_CABIN_SOURCE_BOX.width / 100)
	);
	const bottom = Math.min(
		input.containerHeight,
		rawTop + renderedHeight * (PROGRESS_CABIN_SOURCE_BOX.height / 100)
	);
	const visibleWidth = right - left;
	const visibleHeight = bottom - top;
	if (visibleWidth < MIN_CABIN_VISIBLE_SIZE || visibleHeight < MIN_CABIN_VISIBLE_SIZE) return null;

	// Motivet är lägre än 44 px på små skärmar. Förstora bara den osynliga
	// träffytan, centrerat kring stugan och alltid inom scenen.
	const width = Math.min(input.containerWidth, Math.max(visibleWidth, MIN_PROGRESS_CABIN_HIT_SIZE));
	const height = Math.min(input.containerHeight, Math.max(visibleHeight, MIN_PROGRESS_CABIN_HIT_SIZE));
	const hitLeft = Math.min(
		input.containerWidth - width,
		Math.max(0, left - (width - visibleWidth) / 2)
	);
	const hitTop = Math.min(
		input.containerHeight - height,
		Math.max(0, top - (height - visibleHeight) / 2)
	);

	return { left: hitLeft, top: hitTop, width, height };
}

export function getProgressCabinPlacementStyle(input: ProgressSceneGeometryInput): string {
	const cabin = getProgressCabinPlacement(input);
	if (!cabin) return '';

	return [
		`--progress-cabin-left: ${cabin.left}px`,
		`--progress-cabin-top: ${cabin.top}px`,
		`--progress-cabin-width: ${cabin.width}px`,
		`--progress-cabin-height: ${cabin.height}px`
	].join('; ');
}

/* -------------------------------------------------------------------------
 * Följeslagaren i Framstegsscenen
 *
 * Scenbilden innehåller platsen - sjö, berg, stuga, människa, lägereld - men
 * INGET djur. Användarens valda följeslagare ritas som ett eget lager ovanpå,
 * så att en schäfer visas för den som valt schäfer.
 *
 * Endast den primära följeslagaren renderas här. Visitor och Friend hör hemma
 * på Mitt Hem och återinförs medvetet inte i den här vyn.
 * ---------------------------------------------------------------------- */

/**
 * Motivets faktiska yta i en pose-PNG, uppmätt ur alfakanalen.
 *
 * Anledningen att det behövs: dukarna har vitt skilda genomskinliga marginaler
 * (0 % under schäferns tassar, 18 % under australisk shepherds vilopose) och
 * motivet fyller mellan 48 % och 100 % av duken. En gemensam
 * `translate(-50%, -100%)` ankrar dukens nederkant, inte djurets tassar - då
 * svävar vissa arter och andra sjunker genom marken.
 */
type CompanionArtBounds = {
	canvasWidth: number;
	canvasHeight: number;
	left: number;
	top: number;
	right: number;
	bottom: number;
};

/**
 * Uppmätta alfaytor per pose-ID. Värdena kommer ur PNG-filernas alfakanal och
 * ska mätas om ifall en pose byter bild.
 *
 * VIKTIGT: ytorna är mätta vid alfa > 16, inte alfa > 0. Flera dukar har en
 * nästan osynlig dis runt motivet - vargens sträcker sig 200 px under tassarna
 * och gör hennes råa alfaruta 338 px för hög. Mäts rutan vid alfa > 0 blir
 * djuret både för litet och svävande, eftersom disen räknas som kropp.
 *
 * Lägg till en rad här när en ny pose ska kunna användas i scenen - det är allt
 * som krävs, se getProgressScenePoseId nedan.
 */
const PROGRESS_POSE_ART_BOUNDS: Record<string, CompanionArtBounds> = {
	// fox-realistic-lake-sitting-gazing.png
	'evening-lake': { canvasWidth: 240, canvasHeight: 234, left: 79, top: 6, right: 227, bottom: 206 },
	// bear-sitting.png
	'bear-sitting': { canvasWidth: 768, canvasHeight: 512, left: 151, top: 41, right: 601, bottom: 489 },
	// wolf-standing-transparent.png
	'wolf-standing': {
		canvasWidth: 1536,
		canvasHeight: 1024,
		left: 495,
		top: 138,
		right: 1253,
		bottom: 823
	},
	// schafer-sitting.png
	'schafer-sitting': { canvasWidth: 512, canvasHeight: 512, left: 142, top: 21, right: 412, bottom: 467 },
	// australisk_shepherd-sitting.png
	'australisk-shepherd-sitting': {
		canvasWidth: 512,
		canvasHeight: 512,
		left: 129,
		top: 40,
		right: 475,
		bottom: 512
	}
};

/**
 * Den lugna pose varje art visar i scenen. Vald efter prioritetsordningen
 * bortvänd sittande > sittande vid sjön > lugnt sittande > stående profil.
 *
 * Ingen art har ännu en bortvänd pose; räven kommer närmast med sin sittande
 * sidoprofil mot vattnet. Vargen har bara stående och sovande, så den stående
 * profilen är dess bästa vakna alternativ.
 */
const PROGRESS_PREFERRED_SCENE_POSE: Record<CompanionId, string> = {
	fox: 'evening-lake',
	bear: 'bear-sitting',
	wolf: 'wolf-standing',
	schafer: 'schafer-sitting',
	australisk_shepherd: 'australisk-shepherd-sitting'
};

/**
 * Följeslagarens plats i ORIGINALBILDENS koordinater.
 *
 * `groundX` är markpunkten och `motifHeight` djurets synliga höjd, båda i
 * originalbildens pixlar. Människan sitter med marklinje vid y 742 och är 255 px
 * hög sittande; höjderna nedan är satta som andel av det måttet så storleks-
 * förhållandet blir verkligt (en räv är liten, en björn stor).
 *
 * `groundX` skiljer sig per art av ett konkret skäl: muggen i motivet står på
 * x 1105-1155. Breda djur ankras längre åt höger så att kroppen börjar först
 * efter muggen i stället för att täcka den.
 */
export const PROGRESS_COMPANION_GROUND_Y = 752;

type ProgressSceneCompanionSpec = { groundX: number; motifHeight: number };

const PROGRESS_SCENE_COMPANIONS: Record<CompanionId, ProgressSceneCompanionSpec> = {
	// 105 px är rävens anatomiskt korrekta mått mot människans sitthöjd, men på
	// 375 px blir motivet ~20 px högt och läses som en fläck intill muggen i
	// stället för som en följeslagare. 115 px räcker för att den ska gå att
	// uppfatta, och vänsterkanten hamnar fortfarande på 1172 - klar av muggen.
	fox: { groundX: 1215, motifHeight: 115 },
	bear: { groundX: 1272, motifHeight: 180 },
	wolf: { groundX: 1265, motifHeight: 135 },
	schafer: { groundX: 1215, motifHeight: 145 },
	australisk_shepherd: { groundX: 1220, motifHeight: 130 }
};

/**
 * Pose-ID:t som arten visar i scenen. En bortvänd sittpose vinner så fort en
 * sådan finns i manifestet OCH har en uppmätt alfayta ovan - då byts posen in
 * utan att något annat behöver ändras.
 */
export function getProgressScenePoseId(companionId: CompanionId): string {
	const away = COMPANION_POSES.find(
		(pose) =>
			(pose.companionId ?? 'fox') === companionId &&
			pose.role === 'base' &&
			pose.id.includes('sitting-away') &&
			PROGRESS_POSE_ART_BOUNDS[pose.id] !== undefined
	);

	return away?.id ?? PROGRESS_PREFERRED_SCENE_POSE[companionId];
}

/** Poseobjektet ur manifestet, eller null om ID:t inte går att slå upp. */
export function getProgressScenePose(companionId: CompanionId): CompanionPose | null {
	const poseId = getProgressScenePoseId(companionId);
	return (
		COMPANION_POSES.find(
			(pose) => pose.id === poseId && (pose.companionId ?? 'fox') === companionId
		) ?? null
	);
}

export type ProgressCompanionPlacement = {
	left: number;
	top: number;
	width: number;
	height: number;
};

/**
 * Följeslagarens ruta i den synliga scenytan.
 *
 * Räknar ut elementets storlek baklänges från hur stort MOTIVET ska bli, och
 * förskjuter sedan rutan så att motivets nederkant landar exakt på markpunkten
 * och dess mittlinje på `groundX`. Eftersom rutan får dukens proportion fyller
 * `object-fit: contain` den helt, och den uppmätta alfaytan hamnar därmed på
 * den plats geometrin räknat fram.
 *
 * Allt sker i bildens koordinatsystem via samma contain-geometri som scenbilden
 * och stuglänken använder. Placeringen kan därför inte driva när scenrutan
 * ändrar storlek - den följer motivet i stället för containern.
 */
export function getProgressCompanionPlacement(
	input: ProgressSceneGeometryInput & { companionId: CompanionId }
): ProgressCompanionPlacement | null {
	const geometry = getSceneGeometry(input);
	if (!geometry) return null;

	const spec = PROGRESS_SCENE_COMPANIONS[input.companionId];
	const bounds = PROGRESS_POSE_ART_BOUNDS[getProgressScenePoseId(input.companionId)];
	if (!spec || !bounds) return null;

	const motifWidth = bounds.right - bounds.left;
	const motifHeight = bounds.bottom - bounds.top;
	if (motifWidth <= 0 || motifHeight <= 0) return null;

	const { renderedWidth, renderedHeight, offsetX, offsetY } = geometry;
	const scaleX = renderedWidth / PROGRESS_SCENE_IMAGE_SIZE.width;
	const scaleY = renderedHeight / PROGRESS_SCENE_IMAGE_SIZE.height;

	// Markpunkten, översatt från originalbilden till den renderade ytan.
	const groundX = offsetX + spec.groundX * scaleX;
	const groundY = offsetY + PROGRESS_COMPANION_GROUND_Y * scaleY;

	// Elementet är större än motivet i exakt den mån duken har tomma marginaler.
	const height = (spec.motifHeight * scaleY * bounds.canvasHeight) / motifHeight;
	const width = (height * bounds.canvasWidth) / bounds.canvasHeight;

	return {
		left: groundX - (width * (bounds.left + bounds.right)) / (2 * bounds.canvasWidth),
		top: groundY - (height * bounds.bottom) / bounds.canvasHeight,
		width,
		height
	};
}

export function getProgressCompanionPlacementStyle(
	input: ProgressSceneGeometryInput & { companionId: CompanionId }
): string {
	const placement = getProgressCompanionPlacement(input);
	if (!placement) return '';

	return [
		`--progress-companion-left: ${placement.left}px`,
		`--progress-companion-top: ${placement.top}px`,
		`--progress-companion-width: ${placement.width}px`,
		`--progress-companion-height: ${placement.height}px`
	].join('; ');
}
