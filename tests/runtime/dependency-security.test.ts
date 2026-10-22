import { runInNewContext } from 'node:vm';
import { parse, stringify, uneval } from 'devalue';
import { describe, expect, it } from 'vitest';

// Biblioteksregressioner med syntetiska data, inte bevis för hela produktflödet.
describe('devalue vid SvelteKits server-/klientgräns', () => {
	it('bevarar datum, tomma värden och delade referenser i siddata', () => {
		const entry = { id: 'synthetic-entry', createdAt: new Date('2026-10-22T12:00:00Z'), mood: 6 };
		const data = { entry, selectedEntry: entry, missing: undefined, summary: null };
		const restored: unknown = parse(stringify(data));

		expect(restored).toEqual(data);
		if (!restored || typeof restored !== 'object' || !('entry' in restored) || !('selectedEntry' in restored)) {
			throw new Error('Siddata måste bevaras som ett objekt.');
		}
		expect(restored.entry).toBe(restored.selectedEntry);
	});

	it('låter inte fri text avsluta ett serialiserat script-block', () => {
		const data = { text: '</script><script>syntetiskt()</script>', title: 'Återhämtning' };
		for (const serialized of [stringify(data), uneval(data)]) {
			expect(serialized).not.toContain('</script>');
			expect(serialized).not.toContain('<script>');
		}
		expect(parse(stringify(data))).toEqual(data);
	});

	it('serialiserar endast en buffers synliga bytes, inte omgivande minne', () => {
		const backing = Buffer.from('outside|visible|outside');
		const visible = backing.subarray(8, 15);
		const restored: unknown = parse(stringify(visible));

		if (!(restored instanceof Uint8Array)) throw new Error('En bytevy måste återställas.');
		expect(Array.from(restored)).toEqual(Array.from(Buffer.from('visible')));
		expect(restored.buffer.byteLength).toBe(visible.byteLength);
	});

	it('återanvänder upprepad text utan att expandera uneval-resultatet per kopia', () => {
		// Liten, avgränsad reproduktion av GHSA-mcm9-63f2-9j32, utan tidsassertion.
		const text = 'Syntetisk dagbokstext. '.repeat(32);
		const values = Array<string>(128).fill(text);
		const serialized = uneval(values);

		expect(serialized.length).toBeLessThan(text.length * 4);
		// Endast bibliotekets kod från ovanstående fasta testdata utvärderas.
		expect(runInNewContext(serialized)).toEqual(values);
	});
});
