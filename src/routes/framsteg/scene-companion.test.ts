import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PROGRESS_SCENE_BANDS, PROGRESS_SCENE_SOURCES } from '$lib/progressScene';
import {
	PROGRESS_COMPANION_GROUND_Y,
	PROGRESS_SCENE_IMAGE_SIZE,
	getProgressCompanionPlacement,
	getProgressScenePose,
	getProgressScenePoseId
} from '$lib/progressCompanionPlacement';
import type { CompanionId } from '$lib/companionPoseManifest';

/**
 * Regressionsskydd för Framstegs scen.
 *
 * Det som skyddas är en enda mening: Framsteg visar användarens valda
 * följeslagare, och ingen hårdkodad art finns i scenbakgrunden.
 *
 * Bakgrunden var tidigare `progress-lake-bear`, där en björn satt inbakad i
 * motivet. Den representerade companion för alla användare - även den som valt
 * schäfer. Testerna nedan faller om den bilden, den copyn eller ett hårdkodat
 * art-ID smyger tillbaka in i scenen.
 */

const route = readFileSync(join(process.cwd(), 'src/routes/framsteg/+page.svelte'), 'utf8');
const scene = route.slice(
	route.indexOf('class="companion-media"'),
	route.indexOf('class="framsteg-layout')
);

const SUPPORTED: readonly CompanionId[] = [
	'fox',
	'bear',
	'wolf',
	'schafer',
	'australisk_shepherd'
];

describe('Framstegs bakgrund innehåller ingen art', () => {
	it('använder den bear-free sjöscenen i alla dygnsspann', () => {
		for (const band of PROGRESS_SCENE_BANDS) {
			const { fallback, srcset } = PROGRESS_SCENE_SOURCES[band];
			expect(fallback).toBe('/images/scenes/progress-lake-800.webp');
			expect(srcset).toContain('/images/scenes/progress-lake.webp 1672w');
		}
	});

	it('refererar aldrig björnbilden igen', () => {
		for (const band of PROGRESS_SCENE_BANDS) {
			const { fallback, srcset } = PROGRESS_SCENE_SOURCES[band];
			expect(fallback).not.toContain('progress-lake-bear');
			expect(srcset).not.toContain('progress-lake-bear');
		}
		expect(route).not.toContain('progress-lake-bear');
	});

	it('har alla tre responsiva varianter på disk', () => {
		for (const band of PROGRESS_SCENE_BANDS) {
			const { fallback, srcset } = PROGRESS_SCENE_SOURCES[band];
			for (const entry of [...srcset.split(', ').map((e) => e.split(' ')[0]), fallback]) {
				expect(existsSync(join(process.cwd(), 'static', entry)), entry).toBe(true);
			}
		}
	});

	it('beskriver scenen utan att nämna någon art', () => {
		// Varken alt-texten eller scenens copy får anta att djuret är en björn.
		for (const forbidden of ['björn', 'Björn', 'räv i scenen']) {
			expect(scene).not.toContain(forbidden);
		}
		expect(route).toContain('alt="Du sitter vid sjön, med stugan och lägerelden i närheten."');
	});
});

describe('Framsteg visar användarens valda följeslagare', () => {
	it('läser arten ur progressCompanion i stället för att hårdkoda den', () => {
		expect(route).toContain('getWorldCompanionId(');
		expect(route).toContain('data.progressCompanion');
		// Räven är bara den utloggade förhandsvisningens art, inte allas.
		expect(route).toContain("data.isAnonymous ? { id: 'fox' } : data.progressCompanion");
	});

	it('renderar exakt en följeslagare i scenen', () => {
		expect(scene.match(/<CompanionPose/g) ?? []).toHaveLength(1);
	});

	it('renderar varken visitor eller friend på Framsteg', () => {
		expect(route).not.toContain('<CompanionVisitor');
		expect(route).not.toContain('<CompanionFriend');
		expect(route).not.toContain('CompanionVisitor.svelte');
		expect(route).not.toContain('CompanionFriend.svelte');
	});

	it('skickar den valda arten och dess pose vidare till komponenten', () => {
		expect(scene).toContain('companionId={sceneCompanionId}');
		expect(scene).toContain('basePose={scenePose}');
	});

	it.each(SUPPORTED)('%s får en egen pose som hör till arten', (companionId) => {
		const pose = getProgressScenePose(companionId);
		expect(pose, companionId).not.toBeNull();
		expect(pose?.companionId ?? 'fox').toBe(companionId);
		expect(pose?.role).toBe('base');
		expect(pose?.frames.length ?? 0).toBeGreaterThan(0);
	});

	it('ger olika arter olika bilder - ingen art faller tyst tillbaka på räven', () => {
		const sources = SUPPORTED.map((id) => getProgressScenePose(id)?.frames[0]?.src);
		expect(new Set(sources).size).toBe(SUPPORTED.length);
		for (const src of sources) expect(src).toBeTruthy();
	});

	it('pekar varje pose på en fil som finns', () => {
		for (const companionId of SUPPORTED) {
			const src = getProgressScenePose(companionId)?.frames[0]?.src ?? '';
			expect(existsSync(join(process.cwd(), 'static', src)), `${companionId}: ${src}`).toBe(true);
		}
	});

	it('föredrar en bortvänd sittpose så snart en sådan finns', () => {
		// Ingen art har en ännu. Testet dokumenterar regeln och faller om
		// urvalet skulle sluta leta efter dem.
		const selector = readFileSync(
			join(process.cwd(), 'src/lib/progressCompanionPlacement.ts'),
			'utf8'
		);
		expect(selector).toContain("pose.id.includes('sitting-away')");
		for (const companionId of SUPPORTED) {
			expect(typeof getProgressScenePoseId(companionId)).toBe('string');
		}
	});
});

describe('följeslagarens bildankring', () => {
	const container = { containerWidth: 1120, containerHeight: 630 };

	it.each(SUPPORTED)('%s landar med motivets nederkant på markpunkten', (companionId) => {
		const placement = getProgressCompanionPlacement({ ...container, companionId });
		expect(placement, companionId).not.toBeNull();
		if (!placement) return;

		const scaleY = container.containerHeight / PROGRESS_SCENE_IMAGE_SIZE.height;
		const expectedGround = PROGRESS_COMPANION_GROUND_Y * scaleY;
		// Rutans nederkant sammanfaller med markpunkten först efter att dukens
		// tomma marginal räknats bort - det är hela poängen med alfaytorna.
		expect(placement.top + placement.height).toBeGreaterThan(expectedGround - 1);
		expect(placement.width).toBeGreaterThan(0);
		expect(placement.height).toBeGreaterThan(0);
	});

	it.each(SUPPORTED)('%s ligger inom scenen och överlappar inte människan', (companionId) => {
		const placement = getProgressCompanionPlacement({ ...container, companionId });
		if (!placement) throw new Error(`ingen placering för ${companionId}`);

		const scaleX = container.containerWidth / PROGRESS_SCENE_IMAGE_SIZE.width;
		// Människans rygg slutar vid x 1085 och muggen står till och med x 1155.
		expect(placement.left).toBeGreaterThan(1085 * scaleX);
		expect(placement.left + placement.width).toBeLessThanOrEqual(container.containerWidth);
		expect(placement.top).toBeGreaterThan(0);
	});

	it('följer bildens geometri och driver inte mellan brytpunkter', () => {
		// Samma punkt i originalbilden ska hamna på samma ANDEL av scenen oavsett
		// hur stor rutan är. Det är skillnaden mot en containerankrad placering.
		const widths = [375, 768, 1120, 1440, 1920];
		for (const companionId of SUPPORTED) {
			const ratios = widths.map((width) => {
				const placement = getProgressCompanionPlacement({
					containerWidth: width,
					containerHeight: (width * PROGRESS_SCENE_IMAGE_SIZE.height) /
						PROGRESS_SCENE_IMAGE_SIZE.width,
					companionId
				});
				if (!placement) throw new Error(`ingen placering för ${companionId} @ ${width}`);
				return {
					left: placement.left / width,
					width: placement.width / width
				};
			});

			for (const ratio of ratios) {
				expect(ratio.left).toBeCloseTo(ratios[0].left, 6);
				expect(ratio.width).toBeCloseTo(ratios[0].width, 6);
			}
		}
	});

	it('lämnar tillbaka null i stället för att gissa när scenen inte är uppmätt', () => {
		expect(
			getProgressCompanionPlacement({ containerWidth: 0, containerHeight: 0, companionId: 'fox' })
		).toBeNull();
	});

	it('mäter motivytorna vid synlig alfa, inte vid alfa > 0', () => {
		// Flera dukar har en nästan osynlig dis runt motivet. Vargens sträcker sig
		// 200 px under tassarna: mäts rutan vid alfa > 0 räknas disen som kropp,
		// och då hamnar djuret för högt och för litet. Det här testet faller om
		// någon skulle mäta om ytorna med fel tröskel.
		const source = readFileSync(
			join(process.cwd(), 'src/lib/progressCompanionPlacement.ts'),
			'utf8'
		);
		expect(source).toContain('alfa > 16');

		// Vargens yta måste ligga innanför duken med god marginal - annars är den
		// mätt på disen i stället för på djuret.
		const wolf = source.slice(source.indexOf("'wolf-standing': {"));
		expect(wolf).toContain('left: 495');
		expect(wolf).toContain('bottom: 823');
	});
});

describe('världslagren finns kvar runt följeslagaren', () => {
	it('behåller AmbientWorld, WorldMarks, vattenringarna och stuglänken', () => {
		expect(scene).toContain('<AmbientWorld');
		expect(scene).toContain('<WorldMarks');
		expect(scene).toContain('progress-ripple progress-ripple--one');
		expect(scene).toContain('progress-ripple progress-ripple--two');
		expect(scene).toContain('class="progress-cabin-link"');
	});

	it('visar hela kompositionen utan beskärning', () => {
		expect(route).toContain('aspect-ratio: 1672 / 941');
		expect(route).toContain('object-fit: contain');
		expect(route).toContain('object-position: center');
	});

	it('rör inte dashboardens companion-system', () => {
		const dashboard = readFileSync(
			join(process.cwd(), 'src/routes/dashboard/+page.svelte'),
			'utf8'
		);
		expect(dashboard).toContain('<CompanionPose');
		expect(dashboard).toContain('<CompanionVisitor');
		expect(dashboard).toContain('<CompanionFriend');
	});
});
