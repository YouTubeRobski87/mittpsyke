import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { EMPTY_EVENING_INTERIOR_MEMORY } from '$lib/evening-interior-memory';

vi.mock('$lib/supabase', () => ({ supabase: { auth: { getSession: vi.fn() } } }));
const { default: Page } = await import('./+page.svelte');
const pageSource = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

describe('direkt in i Kvällstugan', () => {
	it('serverrenderar insidan, utgången och incheckningsflödet direkt - ingen mellanlandning', () => {
		const { body } = render(Page, { props: { data: {
			companionDaily: null,
			interiorMemory: EMPTY_EVENING_INTERIOR_MEMORY
		} } });
		expect(body).toContain('data-view="interior"');
		expect(body).toContain('cabin-interior-evening-resting-veranda-v1.webp');
		expect(body).toContain('href="/framsteg" aria-label="Gå ut till Framsteg">Gå ut</a>');
		// Ingen knapp att klicka igenom - EveningCheckinFlow monteras direkt.
		expect(body).not.toContain('Starta Kvällsincheckning');
		// Konsentläget avgörs i onMount, som aldrig körs vid SSR. Att det syns
		// här är alltså den riktiga hydreringsövergången, inte en mellanlandning.
		expect(body).toContain('Laddar kvällsincheckningen');
	});

	it('håller bilden och introduktionen tillsammans och lägger incheckningen under', () => {
		const introStart = pageSource.indexOf('class="evening-intro-layout"');
		const flowStart = pageSource.indexOf('class="evening-flow-column"');
		const introMarkup = pageSource.slice(introStart, flowStart);

		expect(introMarkup).toContain('class="evening-scene"');
		expect(introMarkup).toContain('class="evening-reassurance"');
		expect(flowStart).toBeGreaterThan(introStart);
		expect(pageSource).toContain('width: min(100%, 58rem);');
		expect(pageSource).toMatch(
			/\.evening-intro-layout\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1\.45fr\) minmax\(20rem, 0\.85fr\)/
		);
		const eveningExperienceRule = pageSource.match(/\.evening-experience\s*\{([^}]*)\}/)?.[1];
		expect(eveningExperienceRule).toBeDefined();
		expect(eveningExperienceRule).not.toContain('grid-template-columns:');
	});
});
