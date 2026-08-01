import { describe, expect, it } from 'vitest';
import { findBrokenSiteLinks } from './site-links';

describe('literal internal href links across all .svelte files', () => {
	it('has no href pointing at an unknown route', () => {
		const broken = findBrokenSiteLinks();

		expect(
			broken,
			broken.map((link) => `${link.sourceFile}: "${link.url}" ${link.reason}`).join('\n')
		).toEqual([]);
	});
});
