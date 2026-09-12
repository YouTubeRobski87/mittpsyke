import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	PROGRESS_COMPANION_SCENE_SOURCES,
	PROGRESS_SCENE_BANDS,
	PROGRESS_SCENE_SOURCES
} from '$lib/progressScene';

const route = readFileSync(join(process.cwd(), 'src/routes/framsteg/+page.svelte'), 'utf8');
const scene = route.slice(
	route.indexOf('class="companion-media"'),
	route.indexOf('class="framsteg-layout')
);

describe('Framstegs scen och följeslagare', () => {
	it('använder björnscenen endast i den anonyma förhandsvisningen', () => {
		expect(route).toContain('data.isAnonymous ? PROGRESS_SCENE_SOURCES : PROGRESS_COMPANION_SCENE_SOURCES');
		for (const band of PROGRESS_SCENE_BANDS) {
			expect(PROGRESS_SCENE_SOURCES[band].fallback).toContain('progress-lake-bear-800.webp');
			expect(PROGRESS_COMPANION_SCENE_SOURCES[band].fallback).toContain('progress-lake-800.webp');
		}
	});

	it('har responsiva varianter för både förhandsvisningen och den inloggade scenen', () => {
		for (const sources of [PROGRESS_SCENE_SOURCES, PROGRESS_COMPANION_SCENE_SOURCES]) {
			for (const band of PROGRESS_SCENE_BANDS) {
				const { fallback, srcset } = sources[band];
				for (const entry of [...srcset.split(', ').map((item) => item.split(' ')[0]), fallback]) {
					expect(existsSync(join(process.cwd(), 'static', entry)), entry).toBe(true);
				}
			}
		}
	});

	it('renderar den inloggade användarens valda följeslagare utan visitor eller friend', () => {
		expect(scene).toContain('{#if !isAnonymous}');
		expect(scene.match(/<CompanionPose/g) ?? []).toHaveLength(1);
		expect(scene).toContain('companionId={sceneCompanionId}');
		expect(route).not.toContain('<CompanionVisitor');
		expect(route).not.toContain('<CompanionFriend');
	});

	it('behåller world-lager och stuglänk i båda lägena', () => {
		expect(scene).toContain('<AmbientWorld');
		expect(scene).toContain('<WorldMarks');
		expect(scene).toContain('progress-ripple progress-ripple--one');
		expect(scene).toContain('progress-ripple progress-ripple--two');
		expect(scene).toContain('class="progress-cabin-link"');
	});

	it('rör inte dashboardens globala companion-system', () => {
		const dashboard = readFileSync(join(process.cwd(), 'src/routes/dashboard/+page.svelte'), 'utf8');
		expect(dashboard).toContain('<CompanionPose');
		expect(dashboard).toContain('<CompanionVisitor');
		expect(dashboard).toContain('<CompanionFriend');
		expect(dashboard).toContain('<AmbientWorld');
	});
});
