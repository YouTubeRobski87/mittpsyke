import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import InBrief from '$lib/components/InBrief.svelte';
import { POSITIONING_TERM, positioningCopy } from '$lib/positioning-copy';

// Nyckelsidorna ska beskriva MittPsyke med samma ord, "kravlös digital dagbok",
// så att sökmotorer och AI-tjänster kan återge tjänsten korrekt. Avgränsningen
// (inte vård, 112, 90101 vid tankar på självmord, 1177, stodlinjer.se) ska alltid stå i samma ruta som beskrivningen.

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

const KEY_PAGES = [
	'./om-mittpsyke/+page.svelte',
	'./sa-fungerar-mittpsyke/+page.svelte',
	'./digital-dagbok-for-maende/+page.svelte',
	'./anonym-dagbok-online/+page.svelte',
	'./journalforing/+page.svelte'
] as const;

describe('gemensam positionering', () => {
	it('kärnmeningen använder begreppet och lovar inget om påminnelser', () => {
		expect(positioningCopy.core).toContain(POSITIONING_TERM);
		expect(positioningCopy.structuredData.toLowerCase()).toContain(POSITIONING_TERM);
		for (const text of Object.values(positioningCopy)) {
			expect(text.toLowerCase()).not.toMatch(/påminn/);
		}
	});

	it('avgränsningen nämner att det inte är vård, 112 och 90101', () => {
		expect(positioningCopy.boundary).toContain('inte vård eller akuthjälp');
		expect(positioningCopy.boundary).toContain('112');
		expect(positioningCopy.boundary).toContain('90101');
	});

	it('hänvisar bara till Självmordslinjen vid tankar på självmord', () => {
		expect(positioningCopy.boundary).toContain('Vid tankar på självmord, ring Mind Självmordslinjen på 90101');
		expect(positioningCopy.boundary).not.toMatch(/prata med någon/i);
		expect(positioningCopy.boundary).toContain('1177');
		expect(positioningCopy.boundary).toContain('stodlinjer.se');
	});

	it('"I korthet" renderar sidans text tillsammans med avgränsningen', () => {
		const { body } = render(InBrief, { props: { lead: 'Sidans egen text.' } });
		expect(body).toContain('aria-label="I korthet"');
		expect(body).toContain('Sidans egen text.');
		expect(body).toContain(positioningCopy.boundary);
	});

	it.each(KEY_PAGES)('%s har en "I korthet"-ruta med begreppet', (path) => {
		const source = read(path);
		expect(source).toMatch(/<InBrief[\s>]/);
		expect(source.includes(POSITIONING_TERM) || source.includes('positioningCopy.core')).toBe(true);
	});

	it('startsidans gästbeskrivning använder begreppet', () => {
		expect(read('./+page.server.ts')).toContain('En kravlös digital dagbok för ditt mående.');
	});

	it('den globala strukturerade datan använder samma beskrivning', () => {
		const layout = read('./+layout.svelte');
		expect(layout.match(/description: positioningCopy\.structuredData/g)).toHaveLength(2);
	});
});
