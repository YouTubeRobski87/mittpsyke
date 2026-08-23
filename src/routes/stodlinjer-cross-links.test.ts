import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ANGESTFORBUNDET_URL = 'https://www.stodlinjer.se/stodlinjer/angestforbundet/';
const JOURHAVANDE_MEDMANNISKA_URL =
	'https://www.stodlinjer.se/stodlinjer/jourhavande-medmanniska/';

const routes = [
	{ path: 'angest', url: ANGESTFORBUNDET_URL },
	{ path: 'ensamhet', url: JOURHAVANDE_MEDMANNISKA_URL },
	{ path: 'panikattack', url: ANGESTFORBUNDET_URL }
] as const;

function routeSource(path: string): string {
	return readFileSync(join(process.cwd(), 'src/routes', path, '+page.svelte'), 'utf8');
}

describe('Stödlinjer cross-links', () => {
	it.each(routes)('$path links to the verified Stödlinjer page', ({ path, url }) => {
		expect(routeSource(path)).toContain(`href="${url}"`);
	});

	it('uses www URLs without tracking parameters', () => {
		for (const { path } of routes) {
			const urls = [...routeSource(path).matchAll(/href="(https:\/\/(?:www\.)?stodlinjer\.se[^\"]*)"/g)].map(
				([, url]) => url
			);

			expect(urls).not.toHaveLength(0);
			for (const url of urls) {
				expect(url).toMatch(/^https:\/\/www\.stodlinjer\.se\//);
				expect(url).not.toMatch(/[?&]utm_/i);
			}
		}
	});
});
