import { describe, expect, it } from 'vitest';
import { GET } from './+server';
import { positioningCopy } from '$lib/positioning-copy';

describe('llms.txt', () => {
	it('beskriver MittPsyke med samma ord och avgränsning som sajten', async () => {
		const text = await GET().text();
		expect(text).toContain(positioningCopy.core);
		expect(text).toContain(positioningCopy.boundary);
		expect(text).not.toMatch(/påminn/i);
	});

	it('länkar till nyckelsidorna på apex-domänen', async () => {
		const text = await GET().text();
		for (const path of ['/om-mittpsyke', '/sa-fungerar-mittpsyke', '/integritet', '/ansvarsfull-ai']) {
			expect(text).toContain(`https://mittpsyke.se${path}`);
		}
	});
});
