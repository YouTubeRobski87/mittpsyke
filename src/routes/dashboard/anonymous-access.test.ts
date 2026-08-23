import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dashboardSource = readFileSync(join(process.cwd(), 'src/routes/dashboard/+page.svelte'), 'utf8');

describe('anonyma dashboardvägar', () => {
	it('reserverar en egen gridrad för kontoteasern i stället för att lägga den över scenen', () => {
		expect(dashboardSource).toContain('class:has-account-teaser={isAnonymous}');
		expect(dashboardSource).toContain('<div class="dashboard-account-teaser">');
		expect(dashboardSource).toContain('grid-area: teaser;');
		expect(dashboardSource).toContain("'teaser  teaser teaser'");
		expect(dashboardSource).not.toContain('hero-preview-note');
	});

	it('förklarar bara för anonyma användare att de skyddade vägarna kräver konto eller inloggning', () => {
		expect(dashboardSource).toContain("{#if isAnonymous}<small>Logga in för att använda</small>{/if}");
		expect(dashboardSource).toContain(
		"{#if isAnonymous}<span class=\"home-card-action-note\">Konto krävs för att spara</span>{/if}"
	);
		expect(dashboardSource).toContain("isAnonymous ? 'Kvällslugn – logga in för att använda'");
	});
});
