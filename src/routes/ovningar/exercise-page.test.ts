import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getRelatedTools, tools } from '$lib/data/seo-architecture';

// Övningssidan ska låta stegen komma tidigt, avslutas lugnt med frivilliga nästa
// steg och aldrig sluta i en återvändsgränd (analysen av /ovningar 2026-11-02).

const page = readFileSync(new URL('./[tool]/+page.svelte', import.meta.url), 'utf8');
const markup = page.slice(page.indexOf('</script>'), page.indexOf('<style>'));

describe('relaterade övningar', () => {
	it('ger varje övning minst en annan övning att gå vidare till', () => {
		for (const tool of tools) {
			const related = getRelatedTools(tool);
			expect(related.length, tool.slug).toBeGreaterThan(0);
			expect(related.length, tool.slug).toBeLessThanOrEqual(4);
			expect(related.map((r) => r.slug), tool.slug).not.toContain(tool.slug);
			expect(new Set(related.map((r) => r.slug)).size, tool.slug).toBe(related.length);
		}
	});
});

describe('ordningen på övningssidan', () => {
	it('visar stegen och reflektionen före avslutningen, relaterade övningar och guiden', () => {
		const steps = markup.indexOf('class="step-list"');
		const reflections = markup.indexOf('class="reflect-list"');
		const closing = markup.indexOf('När du är klar');
		const related = markup.indexOf('Fler övningar i samma område');
		const guide = markup.indexOf('Guide i samma område');
		expect(steps).toBeGreaterThan(-1);
		expect(reflections).toBeGreaterThan(steps);
		expect(closing).toBeGreaterThan(reflections);
		expect(related).toBeGreaterThan(closing);
		expect(guide).toBeGreaterThan(related);
	});

	it('använder de gemensamma brödsmulorna och bara en BreadcrumbList', () => {
		expect(page).toContain("import Breadcrumbs from '$lib/components/Breadcrumbs.svelte'");
		expect(page).not.toContain('BreadcrumbSchema');
	});
});

describe('avslutningen', () => {
	it('länkar till Dagboken utan förifylld text', () => {
		expect(page).toContain("'/dagbok/checkin#skriv-sjalv'");
		expect(page).toContain("'/dagbok?action=new'");
		// Inga övningsdata eller fritext får följa med i länken.
		expect(markup).not.toMatch(/dagbok[^"'`]*(text|prompt|tool|slug)=/);
	});

	it('mäter bara fasta mål', () => {
		const targets = [...markup.matchAll(/trackNextStep\('([a-z_]+)'\)/g)].map((m) => m[1]);
		expect(new Set(targets)).toEqual(
			new Set(['diary', 'evening', 'overview', 'related_exercise', 'guide'])
		);
	});

	it('visar Kvällstugan bara för inloggade', () => {
		const ifStart = markup.indexOf('{#if isSignedIn}');
		const evening = markup.indexOf('/dashboard/kvallsstugan');
		const ifEnd = markup.indexOf('{/if}', ifStart);
		expect(ifStart).toBeGreaterThan(-1);
		expect(evening).toBeGreaterThan(ifStart);
		expect(evening).toBeLessThan(ifEnd);
	});
});
