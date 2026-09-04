import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dashboardSource = readFileSync(join(process.cwd(), 'src/routes/dashboard/+page.svelte'), 'utf8');
const explorePanel = dashboardSource.slice(
	dashboardSource.indexOf('<nav class="explore-panel"'),
	dashboardSource.indexOf('</nav>', dashboardSource.indexOf('<nav class="explore-panel"'))
);

describe('Mitt Hem som navigationsnav', () => {
	it('ger direkta vägar till Framsteg och Kvällslugn', () => {
		expect(explorePanel).toContain('href="/framsteg"');
		expect(explorePanel).toContain('href="/dashboard/kvallsstugan"');
		expect(explorePanel).toContain('<strong>Framsteg</strong>');
		expect(explorePanel).toContain('<strong>Kvällslugn</strong>');
	});

	it('behåller stugscenen och dess befintliga direkta entré', () => {
		expect(dashboardSource).toContain("const DASHBOARD_HERO_IMAGE = '/images/scenes/dashboard-cabin-close.webp'");
		expect(dashboardSource).toMatch(
			/class="cabin-entrance"[\s\S]{0,160}?href="\/dashboard\/kvallsstugan"/
		);
	});
});
