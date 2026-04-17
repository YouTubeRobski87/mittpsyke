import type { Guide, Pillar } from '$lib/seo-kit/content';

export const LEGACY_GUIDES_BASE_PATH = '/guider';
export const PUBLIC_GUIDES_BASE_PATH = '/guider';

export function getGuideIndexPath(): string {
	return LEGACY_GUIDES_BASE_PATH;
}

export function getGuidePillarPath(pillarSlug: Pillar['slug'] | string): string {
	return `${LEGACY_GUIDES_BASE_PATH}/${pillarSlug}`;
}

export function getGuideArticlePath(
	pillarSlug: Guide['pillarSlug'] | string,
	guideSlug: Guide['slug'] | string
): string {
	return `${getGuidePillarPath(pillarSlug)}/${guideSlug}`;
}

// Canonical guides base path.
