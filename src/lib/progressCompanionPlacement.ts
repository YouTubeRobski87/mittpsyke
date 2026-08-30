import type { CompanionId } from './companionPoseManifest';
import type { ProgressSceneBand } from './progressScene';

/** Originalmåtten för alla fyra Framstegsscener. */
export const PROGRESS_SCENE_IMAGE_SIZE = { width: 1672, height: 941 } as const;
export const PROGRESS_COMPACT_BREAKPOINT = 640;

type ScenePoint = { x: number; y: number };
type SceneViewportPlacement = {
	/** Följeslagarens markpunkt i originalbildens koordinater (procent). */
	ground: ScenePoint;
	/** CSS object-position för samma originalbild. */
	imagePosition: ScenePoint;
	/** Basbredd i originalbildens pixlar. Djurets egen skala appliceras separat. */
	baseWidth: number;
	/** Visuellt dokumenterad markyta, för underhåll och QA. */
	safeZone: string;
};

export type ProgressScenePlacement = Record<'desktop' | 'mobile', SceneViewportPlacement>;

/**
 * Framstegs enda källa för var följeslagaren får stå.
 *
 * Punkterna hör till originalbilden, inte till den beskurna hero-containern.
 * Det gör att en punkt alltid följer samma markyta när object-fit: cover
 * beskär olika mycket på desktop och mobil.
 */
export const PROGRESS_SCENE_PLACEMENTS: Record<ProgressSceneBand, ProgressScenePlacement> = {
	morning: {
		desktop: {
			ground: { x: 90, y: 76 },
			imagePosition: { x: 50, y: 72 },
			baseWidth: 130,
			safeZone: 'Den fria gräs- och stenremsan längst ut på högra sluttningen, ovanför elden.'
		},
		mobile: {
			ground: { x: 86, y: 57 },
			imagePosition: { x: 74, y: 64 },
			baseWidth: 180,
			safeZone: 'Den högra strandremsan ovanför elden, avskild från personen och vattnet.'
		}
	},
	day: {
		desktop: {
			ground: { x: 90, y: 76 },
			imagePosition: { x: 50, y: 72 },
			baseWidth: 130,
			safeZone: 'Den fria gräs- och stenremsan längst ut på högra sluttningen, ovanför elden.'
		},
		mobile: {
			ground: { x: 86, y: 57 },
			imagePosition: { x: 74, y: 64 },
			baseWidth: 180,
			safeZone: 'Den högra strandremsan ovanför elden, avskild från personen och vattnet.'
		}
	},
	afternoon: {
		desktop: {
			ground: { x: 91, y: 74 },
			imagePosition: { x: 50, y: 72 },
			baseWidth: 130,
			safeZone: 'Den yttre högra grässlänten; avsiktligt bort från mannen och lägerelden.'
		},
		mobile: {
			ground: { x: 86, y: 57 },
			imagePosition: { x: 74, y: 64 },
			baseWidth: 180,
			safeZone: 'Den högra strandremsan ovanför elden, avskild från mannens siluett och vattnet.'
		}
	},
	evening: {
		desktop: {
			ground: { x: 90, y: 76 },
			imagePosition: { x: 50, y: 72 },
			baseWidth: 130,
			safeZone: 'Den fria gräs- och stenremsan längst ut på högra sluttningen, ovanför elden.'
		},
		mobile: {
			ground: { x: 86, y: 57 },
			imagePosition: { x: 74, y: 64 },
			baseWidth: 180,
			safeZone: 'Den högra strandremsan ovanför elden, avskild från personen och vattnet.'
		}
	}
};

/** Naturliga storleksskillnader utan att ändra djurets markpunkt. */
export const PROGRESS_COMPANION_SCALES: Record<CompanionId, number> = {
	fox: 0.74,
	bear: 0.85,
	wolf: 1.1,
	schafer: 0.72,
	australisk_shepherd: 0.72
};

export type ProgressPlacementInput = {
	scene: ProgressSceneBand;
	companionId: CompanionId;
	containerWidth: number;
	containerHeight: number;
	viewportWidth: number;
};

export type ProgressPlacement = {
	left: number;
	top: number;
	width: number;
	groundLeft: number;
	groundTop: number;
	imagePosition: string;
	viewport: 'desktop' | 'mobile';
};

/**
 * Översätter en punkt i originalbilden till den synliga object-fit: cover-ytan.
 * Bild och overlay har därmed samma koordinatsystem även när hero-rutan croppas.
 */
type SceneGeometry = {
	placement: SceneViewportPlacement;
	viewport: 'desktop' | 'mobile';
	scale: number;
	renderedWidth: number;
	renderedHeight: number;
	offsetX: number;
	offsetY: number;
};

/**
 * object-fit: cover-geometrin för hero-bilden: hur mycket originalbilden skalas
 * och var den hamnar i containern. Enda stället där den räknas ut, så
 * följeslagarens markpunkt och stugans klickyta alltid delar koordinatsystem.
 */
function getSceneGeometry({
	scene,
	containerWidth,
	containerHeight,
	viewportWidth
}: Omit<ProgressPlacementInput, 'companionId'>): SceneGeometry | null {
	if (containerWidth <= 0 || containerHeight <= 0) return null;

	const viewport = viewportWidth <= PROGRESS_COMPACT_BREAKPOINT ? 'mobile' : 'desktop';
	const placement = PROGRESS_SCENE_PLACEMENTS[scene][viewport];
	const scale = Math.max(
		containerWidth / PROGRESS_SCENE_IMAGE_SIZE.width,
		containerHeight / PROGRESS_SCENE_IMAGE_SIZE.height
	);
	const renderedWidth = PROGRESS_SCENE_IMAGE_SIZE.width * scale;
	const renderedHeight = PROGRESS_SCENE_IMAGE_SIZE.height * scale;

	return {
		placement,
		viewport,
		scale,
		renderedWidth,
		renderedHeight,
		offsetX: (containerWidth - renderedWidth) * (placement.imagePosition.x / 100),
		offsetY: (containerHeight - renderedHeight) * (placement.imagePosition.y / 100)
	};
}

export function getProgressCompanionPlacement({
	scene,
	companionId,
	containerWidth,
	containerHeight,
	viewportWidth
}: ProgressPlacementInput): ProgressPlacement | null {
	const geometry = getSceneGeometry({ scene, containerWidth, containerHeight, viewportWidth });
	if (!geometry) return null;

	const { placement, viewport, scale, renderedWidth, renderedHeight, offsetX, offsetY } = geometry;
	const groundLeft = offsetX + renderedWidth * (placement.ground.x / 100);
	const groundTop = offsetY + renderedHeight * (placement.ground.y / 100);

	return {
		left: groundLeft,
		top: groundTop,
		width: placement.baseWidth * scale * PROGRESS_COMPANION_SCALES[companionId],
		groundLeft,
		groundTop,
		imagePosition: `${placement.imagePosition.x}% ${placement.imagePosition.y}%`,
		viewport
	};
}

/**
 * Stugans yta i ORIGINALBILDENS koordinater (procent). Alla fyra dygnsbilder
 * delar komposition, så en enda ruta räcker. Uppmätt mot källbilden: tak,
 * väggar och farstubro, utan att nå vattnet eller trädlinjen bakom.
 */
export const PROGRESS_CABIN_SOURCE_BOX = { x: 12.5, y: 44, width: 11, height: 12 } as const;

/** Under så här många pixlar är klickytan för liten för att vara meningsfull. */
const MIN_CABIN_HIT_SIZE = 24;

export type ProgressCabinPlacement = { left: number; top: number; width: number; height: number };

/**
 * Stugans klickyta, översatt från originalbilden till den synliga hero-ytan med
 * exakt samma cover-geometri som följeslagaren använder. Rutan klipps mot
 * containern, eftersom mobilens beskärning skär av stugans vänsterkant, och blir
 * null när det som återstår är för litet för att träffa.
 */
export function getProgressCabinPlacement(
	input: Omit<ProgressPlacementInput, 'companionId'>
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
	const width = right - left;
	const height = bottom - top;
	if (width < MIN_CABIN_HIT_SIZE || height < MIN_CABIN_HIT_SIZE) return null;

	return { left, top, width, height };
}

export function getProgressCabinPlacementStyle(
	input: Omit<ProgressPlacementInput, 'companionId'>
): string {
	const cabin = getProgressCabinPlacement(input);
	if (!cabin) return '';

	return [
		`--progress-cabin-left: ${cabin.left}px`,
		`--progress-cabin-top: ${cabin.top}px`,
		`--progress-cabin-width: ${cabin.width}px`,
		`--progress-cabin-height: ${cabin.height}px`
	].join('; ');
}

export function getProgressCompanionPlacementStyle(input: ProgressPlacementInput): string {
	const placement = getProgressCompanionPlacement(input);
	if (!placement) return '';

	return [
		`--progress-companion-left: ${placement.left}px`,
		`--progress-companion-top: ${placement.top}px`,
		`--progress-companion-width: ${placement.width}px`,
		`--progress-companion-ground-left: ${placement.groundLeft}px`,
		`--progress-companion-ground-top: ${placement.groundTop}px`,
		`--progress-scene-object-position: ${placement.imagePosition}`
	].join('; ');
}
