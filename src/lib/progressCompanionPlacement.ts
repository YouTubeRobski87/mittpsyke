import {
	COMPANION_POSES,
	type CompanionId,
	type CompanionPose,
	type CompanionPoseDaypart
} from '$lib/companionPoseManifest';
import { getCompanionPoseDaypart, pickPersistedRotation } from '$lib/companionPoseState';
import { COMPANION } from '$lib/progressCompanion';

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
 * INGET djur. Följeslagaren, björnen Balder, ritas som ett eget lager ovanpå.
 *
 * Endast den primära följeslagaren renderas här. Visitor och Friend hör hemma
 * på gamla /dashboard och återinförs medvetet inte i den här vyn.
 *
 * Balder roterar mellan ett fåtal kuraterade PLATSER (PROGRESS_SCENE_SPOTS) -
 * pose plus uppmätt markpunkt och storlek. Han är ingen guide och inget som
 * uppträder: han är på platsen, och platsen får se olika ut.
 * ---------------------------------------------------------------------- */

/**
 * Motivets faktiska yta i en pose-PNG, uppmätt ur alfakanalen.
 *
 * Anledningen att det behövs: duken har genomskinliga marginaler runt motivet.
 * En gemensam `translate(-50%, -100%)` ankrar dukens nederkant, inte djurets
 * tassar - utan uppmätt yta svävar björnen eller sjunker genom marken.
 */
export type CompanionArtBounds = {
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
 * VIKTIGT: ytorna är mätta vid alfa > 16, inte alfa > 0. En nästan osynlig dis
 * runt motivet skulle annars räknas som kropp och göra djuret för litet och
 * svävande.
 *
 * En pose kan bara användas i scenen om den har en rad här OCH en plats i
 * PROGRESS_SCENE_SPOTS nedan.
 */
export const PROGRESS_POSE_ART_BOUNDS: Record<string, CompanionArtBounds> = {
	// bear-sitting.png. Sittande i halvprofil.
	'bear-sitting': { canvasWidth: 768, canvasHeight: 512, left: 151, top: 41, right: 601, bottom: 489 },
	// bear-sitting-back.png. Uppmätt alfabox: kroppen börjar 186 px in och
	// tassarna slutar 496 px ned, så markpunkten hamnar där björnen faktiskt
	// sitter och inte i canvasens tomma marginal.
	'bear-sitting-away': {
		canvasWidth: 768,
		canvasHeight: 512,
		left: 186,
		top: 19,
		right: 578,
		bottom: 496
	},
	// bear-standing.png. Stående på alla fyra.
	'bear-standing': { canvasWidth: 768, canvasHeight: 512, left: 250, top: 37, right: 672, bottom: 491 },
	// bear-sleeping.png. Hopkurad och liggande - låg och bred, därav den lilla
	// motivhöjden i platserna nedan.
	'bear-sleeping': { canvasWidth: 768, canvasHeight: 512, left: 140, top: 142, right: 702, bottom: 387 }
	// bear-stretching.png är medvetet inte med: motivet är en gäspning med vidöppet
	// gap. I scenens skala läses det som att björnen ryter eller uppträder, inte
	// som en lugn närvaro. Se docs-noteringen i PROGRESS_SCENE_SPOTS.
};

/**
 * Marklinjen på gräsbanken bredvid personen - den plats björnen har haft sedan
 * tidigare, och referenspunkten som de övriga platserna nedan är mätta mot.
 */
export const PROGRESS_COMPANION_GROUND_Y = 752;

/**
 * En kuraterad plats i Framstegsscenen: en pose PLUS var och hur stor den är.
 *
 * Poserna får alltså inte samma x/y/skala. Varje plats är uppmätt i
 * ORIGINALBILDENS koordinater (1672x941) och visuellt kontrollerad mot
 * sjöscenen i alla dygnsspann:
 *
 * - `groundX`/`groundY` är markpunkten: där tassarna ska landa.
 * - `motifHeight` är motivets synliga höjd på den punkten. Den följer scenens
 *   perspektiv: allt som står längre bort (lägre `groundY`) blir mindre.
 *   Skalan utgår från den ursprungliga platsen - 180 px hög sittande björn vid
 *   marklinjen 752 - och alla poser delar samma verkliga kroppsstorlek, så en
 *   liggande björn blir låg utan att bli en annan björn.
 *
 * Det här är inget nytt posesystem: poserna själva bor kvar i
 * companionPoseManifest.ts och rotationsregeln i companionPoseState.ts. Det
 * enda som är nytt här är scengeometrin, som bara Framsteg känner till.
 */
export type ProgressSceneSpot = {
	id: string;
	poseId: string;
	groundX: number;
	groundY: number;
	motifHeight: number;
	dayparts: readonly CompanionPoseDaypart[];
	weight: number;
	/**
	 * Den enda meningen som säger var Balder är just nu. Den bor tillsammans
	 * med platsen så att en ny plats aldrig kan läggas till utan sin text - och
	 * så att texten aldrig kan beskriva något annat än det bilden visar.
	 *
	 * Den konstaterar var han är. Den tolkar honom inte, tilltalar inte
	 * användaren och ber inte om något.
	 */
	presence: string;
};

/**
 * Balders kuraterade platser vid sjön.
 *
 * Ordningen spelar roll: den första platsen för en dagpart är den som
 * servern renderar (se getProgressInitialSceneSpot), så den ska vara ett
 * lugnt, alltid-rimligt grundläge.
 *
 * Vikterna är satta så att den bortvända posen finns kvar utan att dominera:
 * de två bortvända platserna delar ungefär en tredjedel av dagen och kvällen
 * mellan sig, resten är sida, stående och vila.
 */
const BEAR_NAME = COMPANION.name;

export const PROGRESS_SCENE_SPOTS: readonly ProgressSceneSpot[] = [
	{
		// Nere vid strandkanten, vänd mot sjön. Samma stilla ögonblick som förut,
		// men vid vattnet i stället för uppe på banken.
		id: 'strandkant-sittande-bortvand',
		poseId: 'bear-sitting-away',
		groundX: 1340,
		groundY: 706,
		motifHeight: 154,
		dayparts: ['day', 'evening'],
		weight: 1.2,
		presence: `${BEAR_NAME} har gått ner till vattenbrynet och sitter vänd mot sjön.`
	},
	{
		// Sittande i halvprofil på banken: han är med i samma stund som personen,
		// men vänder inte ryggen till.
		id: 'bank-sittande-sida',
		poseId: 'bear-sitting',
		groundX: 1300,
		groundY: 758,
		motifHeight: 172,
		dayparts: ['day', 'evening'],
		weight: 1.6,
		presence: `${BEAR_NAME} sitter en bit bort på stranden, vänd åt sidan.`
	},
	{
		// Stående nere vid vattenbrynet, med tassarna på de våta stenarna.
		id: 'strandkant-staende',
		poseId: 'bear-standing',
		groundX: 1330,
		groundY: 706,
		motifHeight: 147,
		dayparts: ['day', 'evening'],
		weight: 1.5,
		presence: `${BEAR_NAME} står nere vid vattenbrynet, stilla.`
	},
	{
		// Den ursprungliga platsen: sittande bredvid personen, vänd mot utsikten.
		id: 'bank-sittande-bortvand',
		poseId: 'bear-sitting-away',
		groundX: 1272,
		groundY: PROGRESS_COMPANION_GROUND_Y,
		motifHeight: 180,
		dayparts: ['day', 'evening'],
		weight: 1,
		presence: `Du och ${BEAR_NAME} sitter stilla vid stranden och blickar ut över sjön.`
	},
	{
		// Stående uppe på gräsbanken. Bara dagtid - på kvällen tar vilan över.
		id: 'bank-staende',
		poseId: 'bear-standing',
		groundX: 1288,
		groundY: 754,
		motifHeight: 168,
		dayparts: ['day'],
		weight: 1.2,
		presence: `${BEAR_NAME} står en bit bort på stranden och ser ut över sjön.`
	},
	{
		// Liggande och vilande intill elden.
		//
		// Endast 'night'. Poseordlistan och scenens dygnsband är förskjutna mot
		// varandra: poseordlistans 'evening' är 17-20, vilket scenen kallar
		// EFTERMIDDAG och renderar i fullt dagsljus (se
		// getProgressCompanionDayStateLabel och getProgressSceneBand). En
		// hopkurad, sovande björn i eftermiddagssol läser som fel tid på dygnet.
		// Poseordlistans 'night' är 20-05, alltså scenens kväll och natt - då
		// ligger han i skymning och eldsken, vilket är det enda läge bilden
		// faktiskt bär.
		id: 'bank-vilande',
		poseId: 'bear-sleeping',
		groundX: 1300,
		groundY: 768,
		motifHeight: 97,
		dayparts: ['night'],
		weight: 1.3,
		presence: `${BEAR_NAME} har lagt sig ned intill elden och vilar.`
	}
];

const PROGRESS_SPOT_STORAGE_KEY = `mittpsyke:progress-scene-spot:${COMPANION.id}:v1`;

/** Platserna som hör hemma i en viss dagpart. */
export function getProgressSceneSpots(daypart: CompanionPoseDaypart): ProgressSceneSpot[] {
	return PROGRESS_SCENE_SPOTS.filter((spot) => spot.dayparts.includes(daypart));
}

/**
 * Deterministiskt startläge för servergenererad HTML och klientens första
 * render - samma skäl och samma mönster som getCompanionInitialBasePose:
 * utan localStorage och Math.random måste SSR och hydrering landa på exakt
 * samma plats, annars hoppar Balder synligt när sidan blir interaktiv.
 *
 * VIKTIGT: klienten får INTE anropa den här på egen hand för sitt startvärde.
 * Funktionen är tidsberoende, och om servern och klienten hamnar i olika
 * dagpartier (dygnsgränsen passeras mellan render och hydrering) blir posen
 * och bilden olika. Svelte skriver medvetet aldrig om `src` under hydrering -
 * den antar att server och klient är överens - så bilden fastnar då på
 * serverns pose medan resten av vyn visar en annan. Servern väljer därför
 * platsen och skickar med dess id; se `initialSceneSpotId` i routens laddare.
 */
export function getProgressInitialSceneSpot(date = new Date()): ProgressSceneSpot {
	const daypart = getCompanionPoseDaypart(date);
	return getProgressSceneSpots(daypart)[0] ?? PROGRESS_SCENE_SPOTS[0];
}

/** Slår upp en plats på id, för startvärdet som servern skickat med. */
export function getProgressSceneSpotById(id: string | null | undefined): ProgressSceneSpot | null {
	if (!id) return null;
	return PROGRESS_SCENE_SPOTS.find((spot) => spot.id === id) ?? null;
}

/**
 * Det riktiga, viktade och ihågkomna valet. Använder samma rotationsregel som
 * basposen (pickPersistedRotation): platsen ligger kvar i 20-40 minuter innan
 * den får bytas, så scenen förändras i den takt en plats förändras - inte i
 * den takt en sida ritas om.
 */
export function getProgressSceneSpot(
	date = new Date(),
	storage: Storage | null = null
): ProgressSceneSpot {
	const daypart = getCompanionPoseDaypart(date);
	const candidates = getProgressSceneSpots(daypart);

	return pickPersistedRotation({
		candidates,
		fallback: candidates[0] ?? PROGRESS_SCENE_SPOTS[0],
		storageKey: PROGRESS_SPOT_STORAGE_KEY,
		now: date.getTime(),
		daypart,
		storage,
		resolveStored: (spotId) => candidates.find((spot) => spot.id === spotId) ?? null
	});
}

/** Poseobjektet ur manifestet för en plats, eller null om ID:t inte går att slå upp. */
export function getProgressScenePose(
	spot: ProgressSceneSpot,
	companionId: CompanionId = 'bear'
): CompanionPose | null {
	return (
		COMPANION_POSES.find((pose) => pose.id === spot.poseId && pose.companionId === companionId) ??
		null
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
	input: ProgressSceneGeometryInput & { spot: ProgressSceneSpot }
): ProgressCompanionPlacement | null {
	const geometry = getSceneGeometry(input);
	if (!geometry) return null;

	const spec = input.spot;
	const bounds = PROGRESS_POSE_ART_BOUNDS[spec.poseId];
	if (!bounds) return null;

	const motifWidth = bounds.right - bounds.left;
	const motifHeight = bounds.bottom - bounds.top;
	if (motifWidth <= 0 || motifHeight <= 0) return null;

	const { renderedWidth, renderedHeight, offsetX, offsetY } = geometry;
	const scaleX = renderedWidth / PROGRESS_SCENE_IMAGE_SIZE.width;
	const scaleY = renderedHeight / PROGRESS_SCENE_IMAGE_SIZE.height;

	// Markpunkten, översatt från originalbilden till den renderade ytan. Både x
	// och y kommer från platsen, så strandkanten och banken kan ha olika höjd.
	const groundX = offsetX + spec.groundX * scaleX;
	const groundY = offsetY + spec.groundY * scaleY;

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
	input: ProgressSceneGeometryInput & { spot: ProgressSceneSpot }
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
