import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { EMPTY_EVENING_INTERIOR_MEMORY } from '$lib/evening-interior-memory';

vi.mock('$lib/supabase', () => ({ supabase: { auth: { getSession: vi.fn() } } }));
const { default: Page } = await import('./+page.svelte');

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
});
