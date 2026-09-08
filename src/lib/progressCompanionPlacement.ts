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
