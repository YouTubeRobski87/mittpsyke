import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { EMPTY_EVENING_INTERIOR_MEMORY } from '$lib/evening-interior-memory';

vi.mock('$lib/supabase', () => ({ supabase: { auth: { getSession: vi.fn() } } }));
const { default: Page } = await import('./+page.svelte');

describe('direkt in i Kvällstugan', () => {
	it('serverrenderar insidan och utgången utan att starta incheckningen', () => {
		const { body } = render(Page, { props: { data: {
			companionDaily: null,
			interiorMemory: EMPTY_EVENING_INTERIOR_MEMORY
		} } });
		expect(body).toContain('data-view="interior"');
		expect(body).toContain('cabin-interior-evening-resting-veranda-v1.webp');
		expect(body).toContain('Starta Kvällsincheckning');
		expect(body).toContain('href="/framsteg" aria-label="Gå ut till Framsteg">Gå ut</a>');
		expect(body).not.toContain('Laddar kvällsincheckningen');
		expect(body).not.toContain('Innan du börjar');
		expect(body).not.toContain('Steg 1 av 4');
	});
});
