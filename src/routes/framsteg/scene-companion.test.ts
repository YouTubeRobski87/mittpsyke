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
			// Alla spann utom eftermiddagen använder relights av samma par (scripts/scene-relight.py).
			const suffix = band === 'afternoon' ? '' : `-${band}`;
			expect(PROGRESS_SCENE_SOURCES[band].fallback).toContain(`progress-lake-bear${suffix}-800.webp`);
			expect(PROGRESS_COMPANION_SCENE_SOURCES[band].fallback).toContain(`progress-lake${suffix}-800.webp`);
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

	it('låter stugans fönsterljus vara ett osynligt lager, bara på kväll och natt', () => {
		// Eget dekorativt lager - aldrig en del av klickytan och aldrig klickbart.
		expect(scene).toContain('<span class="progress-cabin-light" aria-hidden="true"></span>');
		const light = route.slice(route.indexOf('.progress-cabin-light {'));
		expect(light).toContain('pointer-events: none;');
		expect(route).toContain(".companion-media[data-time='evening'] .progress-cabin-light,");
		expect(route).toContain(".companion-media[data-time='night'] .progress-cabin-light {");
		// Reduced motion: ingen variation, bara en statisk nivå.
		expect(route).toMatch(
			/@media \(prefers-reduced-motion: reduce\) \{\s*\.progress-cabin-light \{[\s\S]*?animation: none;/
		);
	});

	it('matar världen med dagboksdagar, aldrig med humör', () => {
		const world = route.slice(route.indexOf('const worldPresence = $derived('), route.indexOf('const worldStage ='));
		expect(world).toContain('activityDays: data.diaryActivityDays');
		expect(world).not.toContain('moodDates');
		expect(world).not.toContain('moodEntryCount');
		expect(world).not.toContain('loadedMoodSamples');
	});
	it('räknar aktiva dagar i "Vad det här bygger på" på samma dagboksdagar som världen', () => {
		expect(route).toContain('const heatmapData = $derived(');
		const source = route.slice(route.indexOf('const heatmapData = $derived('), route.indexOf('const historyActivity ='));
		expect(source).toContain('data.diaryActivityDays');
		expect(source).not.toContain('loadedHeatmapData');
		expect(route).toContain('buildHistoryActivity(heatmapData, moodSamples, selectedPeriod)');
	});

	it('låter sparade spår och sparat stadie finnas kvar i världen', () => {
		expect(route).toContain('unlocked: unlockedWorldMarks');
		expect(route).toContain('data.worldProgress?.stage ?? 0');
	});
});
