import { describe, expect, it } from 'vitest';
import { GET } from './+server';

describe('robots.txt', () => {
	it('points to the apex sitemap', async () => {
		const response = GET();
		expect(await response.text()).toContain('Sitemap: https://mittpsyke.se/sitemap.xml');
	});
});
