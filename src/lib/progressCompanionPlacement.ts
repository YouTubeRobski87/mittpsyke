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
			ground: { x: 81, y: 68 },
			imagePosition: { x: 60, y: 64 },
			baseWidth: 240,
			safeZone: 'Den fria högra sluttningen ovanför elden, utanför personen och mobilcopy.'
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
			ground: { x: 81, y: 69 },
			imagePosition: { x: 60, y: 64 },
			baseWidth: 240,
			safeZone: 'Den fria högra sluttningen ovanför elden, utanför personen och mobilcopy.'
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
			ground: { x: 81, y: 68 },
			imagePosition: { x: 60, y: 64 },
			baseWidth: 240,
			safeZone: 'Den fria högra sluttningen ovanför elden, utanför mannens siluett och mobilcopy.'
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
			ground: { x: 81, y: 68 },
			imagePosition: { x: 60, y: 64 },
			baseWidth: 240,
			safeZone: 'Den fria högra sluttningen ovanför elden, utanför personen och mobilcopy.'
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
export function getProgressCompanionPlacement({
	scene,
	companionId,
	containerWidth,
	containerHeight,
	viewportWidth
}: ProgressPlacementInput): ProgressPlacement | null {
	if (containerWidth <= 0 || containerHeight <= 0) return null;

	const viewport = viewportWidth <= PROGRESS_COMPACT_BREAKPOINT ? 'mobile' : 'desktop';
	const placement = PROGRESS_SCENE_PLACEMENTS[scene][viewport];
	const scale = Math.max(
		containerWidth / PROGRESS_SCENE_IMAGE_SIZE.width,
		containerHeight / PROGRESS_SCENE_IMAGE_SIZE.height
	);
	const renderedWidth = PROGRESS_SCENE_IMAGE_SIZE.width * scale;
	const renderedHeight = PROGRESS_SCENE_IMAGE_SIZE.height * scale;
	const offsetX = (containerWidth - renderedWidth) * (placement.imagePosition.x / 100);
	const offsetY = (containerHeight - renderedHeight) * (placement.imagePosition.y / 100);
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
