import type { Guide, Pillar } from '$lib/seo-kit/content';

export const LEGACY_GUIDES_BASE_PATH = '/guider-seo';
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

// Future migration note:
// When /guider is ready to replace /guider-seo, update the base path helpers here
// first and then review canonical tags, sitemap entries and redirects together.
