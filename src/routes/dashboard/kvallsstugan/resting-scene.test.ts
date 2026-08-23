import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const routePath = join(process.cwd(), 'src/routes/dashboard/kvallsstugan/+page.svelte');
const route = readFileSync(routePath, 'utf8');
const sceneDirectory = join(process.cwd(), 'static/images/scenes');
const restingSceneAssets = [
	'cabin-interior-evening-resting-v1-800.webp',
	'cabin-interior-evening-resting-v1-1200.webp',
	'cabin-interior-evening-resting-v1.webp'
];

describe('Kvällsstugans viloscen', () => {
	it('använder den lokala scenbild där personen vilar i soffan, i alla responsiva storlekar', () => {
		for (const asset of restingSceneAssets) {
			expect(existsSync(join(sceneDirectory, asset)), asset).toBe(true);
			expect(route).toContain(`/images/scenes/${asset}`);
		}
	});

	it('behåller följeslagarens befintliga, lokala placering och lugna beteende', () => {
		const companion = route.slice(
			route.indexOf('<CompanionPose'),
			route.indexOf('/>', route.indexOf('<CompanionPose')) + 2
		);

		expect(companion).toContain('class="evening-companion interior-companion"');
		expect(companion).toContain('behaviourProfile="quiet"');
		expect(companion).toContain('posePreference="calm"');
		expect(route).toContain('.evening-scene :global(.interior-companion)');
	});

	it('låter den inbakade personen skala med själva scenbilden', () => {
		expect(route).toContain('class="evening-scene-image"');
		expect(route).toContain('width: 100%; height: 100%; object-fit: cover;');
		expect(route).toContain('aspect-ratio: 16 / 9;');
	});

	it('använder den delade dygnsmodellen för det befintliga, lågmälda lampskenet', () => {
		expect(route).toContain("import { getEveningLampCssVariables } from '$lib/evening-lamp'");
		expect(route).toContain('style={getEveningLampCssVariables(dayState)}');
		expect(route).toContain('--cabin-lamp-glow-opacity');
	});
});
