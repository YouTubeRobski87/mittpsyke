import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/soro-articles', () => ({
	fetchSoroArticles: async () => ({ articles: [], loadError: false })
}));

import { load } from './+page.server';

describe('/sok', () => {
	it('ber sökmotorer att inte indexera interna sökresultat', async () => {
		const result = await load({
			fetch,
			setHeaders: () => {}
		} as unknown as Parameters<typeof load>[0]);

		expect(result).toMatchObject({ noindex: true });
	});
});
