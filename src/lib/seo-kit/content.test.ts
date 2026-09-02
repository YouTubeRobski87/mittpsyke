import { describe, expect, it } from 'vitest';
import {
	findInvalidContentDateOrder,
	getDisplayContentDates,
	guides,
	pillarLandingPages,
	type SeoLandingPage
} from './content';

describe('innehållsdatum', () => {
	it('does not invent a publication date when only an update date is known', () => {
		expect(getDisplayContentDates({ updatedAt: '2026-03-14' })).toEqual({
			publishedAt: undefined,
			updatedAt: '2026-03-14'
		});
	});

	it('flags updatedAt before publishedAt with a clear error', () => {
		expect(
			findInvalidContentDateOrder([
				{ title: 'Testguide', pillarSlug: 'angest', slug: 'test', publishedAt: '2026-03-21', updatedAt: '2026-03-14' }
			])
		).toEqual(['angest/test: updatedAt (2026-03-14) is earlier than publishedAt (2026-03-21)']);
	});

	it('has no guide or pillar page updated before publication', () => {
		const landingPages = Object.values(pillarLandingPages).filter(
			(page): page is SeoLandingPage => Boolean(page)
		);
		expect(findInvalidContentDateOrder([...guides, ...landingPages])).toEqual([]);
	});
});
