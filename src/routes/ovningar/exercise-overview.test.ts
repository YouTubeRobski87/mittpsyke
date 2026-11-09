import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	exerciseNeeds,
	formatToolMinutes,
	getToolsByNeed,
	tools
} from '$lib/data/seo-architecture';

// Översikten på /ovningar visar övningarna efter behov, med längd och om man
// skriver, så att den som mår dåligt hittar något utan att läsa allt. På mobil
// ska en övning synas innan länkarna till SEO-sidorna (analysen 2026-11-02).

const page = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');
const markup = page.slice(page.indexOf('</script>'), page.indexOf('<style>'));

describe('behovsgrupperna', () => {
	it('är de fem som Robban godkände, i den ordningen', () => {
		expect(exerciseNeeds.map((need) => need.title)).toEqual([
			'Just nu, när det känns mycket',
			'När tankarna snurrar',
			'När du vill skriva',
			'Inför natten',
			'Relationer och riktning'
		]);
	});

	it('visar varje övning exakt en gång och lämnar ingen grupp tom', () => {
		const groups = getToolsByNeed();
		expect(groups).toHaveLength(exerciseNeeds.length);
		const shown = groups.flatMap((group) => group.tools.map((tool) => tool.slug));
		expect(shown.sort()).toEqual(tools.map((tool) => tool.slug).sort());
	});

	it('har bara korta övningar utan skrivande under "Just nu"', () => {
		const justNow = getToolsByNeed().find((group) => group.id === 'just-nu');
		for (const tool of justNow?.tools ?? []) {
			expect(tool.involvesWriting, tool.slug).not.toBe(true);
			expect(tool.minutes?.max ?? tool.minutes?.min ?? 0, tool.slug).toBeLessThanOrEqual(10);
		}
	});
});

describe('längden på korten', () => {
	it('har giltiga minuter för varje övning som anger en längd', () => {
		for (const tool of tools) {
			if (!tool.minutes) continue;
			expect(tool.minutes.min, tool.slug).toBeGreaterThan(0);
			if (tool.minutes.max !== undefined) {
				expect(tool.minutes.max, tool.slug).toBeGreaterThan(tool.minutes.min);
			}
		}
	});

	it('skrivs som kort text utan prestationskrav', () => {
		const bySlug = Object.fromEntries(tools.map((tool) => [tool.slug, formatToolMinutes(tool)]));
		expect(bySlug['grounding-5-4-3-2-1']).toBe('2 min');
		expect(bySlug['body-scan']).toBe('10–15 min');
		expect(bySlug['mala-i-varlden']).toBe('I din egen takt');
	});
});

describe('ordningen på översikten', () => {
	it('visar övningarna före länkarna till SEO-sidorna', () => {
		const firstGroup = markup.indexOf('{#each groups as group');
		const seoLinks = markup.indexOf('class="links-block"');
		expect(firstGroup).toBeGreaterThan(-1);
		expect(seoLinks).toBeGreaterThan(firstGroup);
	});

	it('har inga etiketter som ser ut som filter', () => {
		expect(markup).not.toContain('pillarLabelBySlug');
		expect(page).not.toMatch(/\.meta \{[^}]*border-radius: 999px/);
	});
});

describe('exponeringssidan', () => {
	it('leder direkt till Trygghetscirkeln i stället för tillbaka till översikten', () => {
		const exposure = readFileSync(
			new URL('../exponering-ovningar-mot-angest/+page.svelte', import.meta.url),
			'utf8'
		);
		expect(exposure).toContain('class="cta-button" href="/ovningar/trygghetscirkel-exponering"');
		expect(exposure).not.toContain('class="cta-button" href="/ovningar"');
	});
});

describe('ordningen inom en grupp', () => {
	it('visar de kortaste övningarna först och de utan längd sist', () => {
		for (const group of getToolsByNeed()) {
			const keys = group.tools.map((tool) => tool.minutes?.min ?? Number.POSITIVE_INFINITY);
			expect(keys, group.id).toEqual([...keys].sort((a, b) => a - b));
		}
		const justNow = getToolsByNeed().find((group) => group.id === 'just-nu');
		expect(justNow?.tools.at(-1)?.slug).toBe('mala-i-varlden');
	});
});
