import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dashboardSource = readFileSync(join(process.cwd(), 'src/routes/dashboard/+page.svelte'), 'utf8');
const eveningSource = readFileSync(
	join(process.cwd(), 'src/routes/dashboard/kvallsstugan/+page.svelte'),
	'utf8'
);
const eveningServerSource = readFileSync(
	join(process.cwd(), 'src/routes/dashboard/kvallsstugan/+page.server.ts'),
	'utf8'
);
const heroClassIndex = dashboardSource.indexOf('class="companion-hero"');
const heroStartIndex = dashboardSource.lastIndexOf('<section', heroClassIndex);
const heroPanel = dashboardSource.slice(
	heroStartIndex,
	dashboardSource.indexOf('</section>', heroClassIndex)
);
const nowPanel = dashboardSource.slice(
	dashboardSource.indexOf('<section class="now-panel"'),
	dashboardSource.indexOf('</section>', dashboardSource.indexOf('<section class="now-panel"'))
);
const cabinLink = heroPanel.slice(
	heroPanel.lastIndexOf('<a', heroPanel.indexOf('class="cabin-entrance"')),
	heroPanel.indexOf('</a>', heroPanel.indexOf('class="cabin-entrance"'))
);
const progressLink = nowPanel.slice(
	nowPanel.lastIndexOf('<a', nowPanel.indexOf('class="now-cta"')),
	nowPanel.indexOf('</a>', nowPanel.indexOf('class="now-cta"'))
);
const explorePanel = dashboardSource.slice(
	dashboardSource.indexOf('<nav class="explore-panel"'),
	dashboardSource.indexOf('</nav>', dashboardSource.indexOf('<nav class="explore-panel"'))
);

describe('Mitt Hem som navigationsnav', () => {
	it('gör stugan till den enda direkta dashboardvägen till Kvällslugn', () => {
		expect(heroPanel).toMatch(
			/class="cabin-entrance"[\s\S]{0,160}?href="\/dashboard\/kvallsstugan"/
		);
		expect(heroPanel).toContain('Gå in i Kvällsstugan och öppna Kvällslugn');
		expect(dashboardSource.match(/href="\/dashboard\/kvallsstugan"/g) ?? []).toHaveLength(1);
		expect(explorePanel).not.toContain('href="/dashboard/kvallsstugan"');
		expect(explorePanel).not.toContain('<strong>Kvällslugn</strong>');
	});

	it('behåller stugscenen och en avgränsad, touchvänlig och fokuserbar hotspot', () => {
		expect(dashboardSource).toContain(
			"const DASHBOARD_HERO_IMAGE = '/images/scenes/dashboard-cabin-view-clean.webp'"
		);
		for (const asset of [
			'dashboard-cabin-view-clean-800.webp 800w',
			'dashboard-cabin-view-clean-1200.webp 1200w',
			'dashboard-cabin-view-clean.webp 1672w'
		]) {
			expect(dashboardSource).toContain(asset);
		}
		const cabinRule = dashboardSource.slice(
			dashboardSource.indexOf('.cabin-entrance {'),
			dashboardSource.indexOf('}', dashboardSource.indexOf('.cabin-entrance {'))
		);
		expect(cabinRule).toContain('left: 10%');
		expect(cabinRule).toContain('top: 16%');
		expect(cabinRule).toContain('width: 20%');
		expect(cabinRule).toContain('height: 58%');
		expect(cabinRule).toContain('min-width: 44px');
		expect(cabinRule).toContain('min-height: 44px');
		expect(dashboardSource).toContain('.cabin-entrance:focus-visible');
		expect(heroPanel).toContain('<CompanionPose');
		expect(heroPanel).toContain('<AmbientWorld');
	});

	it('har en enda innehållsnära dashboardväg till Framsteg', () => {
		expect(nowPanel).toContain('href="/framsteg"');
		expect(nowPanel).toContain('Se alla framsteg');
		expect(dashboardSource.match(/href="\/framsteg"/g) ?? []).toHaveLength(1);
		expect(explorePanel).not.toContain('href="/framsteg"');
		expect(explorePanel).not.toContain('<strong>Framsteg</strong>');
	});

	it('behåller Utforska vidare för destinationer som fyller andra syften', () => {
		for (const href of ['/guider', '/chat', '/blogg']) {
			expect(explorePanel).toContain(`href="${href}"`);
		}
	});

	it('använder vanliga länkar utan mellanroute eller ersatt browserhistorik', () => {
		for (const link of [cabinLink, progressLink]) {
			expect(link).not.toMatch(/onclick|on:click|goto\(|replaceState/);
		}
		expect(cabinLink).toContain('href="/dashboard/kvallsstugan"');
		expect(progressLink).toContain('href="/framsteg"');
		expect(eveningSource).toContain('<a class="evening-back" href="/dashboard">← Till Mitt Hem</a>');
	});

	it('behåller Kvällslugns auth-guard för både utloggade och anonyma användare', () => {
		expect(eveningServerSource).toContain('if (!user || user.is_anonymous)');
		expect(eveningServerSource).toContain("throw redirect(303, '/login')");
	});
});
