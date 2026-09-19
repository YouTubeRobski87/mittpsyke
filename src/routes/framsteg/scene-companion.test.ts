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

	it('graderar följeslagaren efter scenens ljus på kväll och natt', () => {
		// CompanionPose.svelte har egna dygnsgrader, men routens egen regel för
		// .companion-pose-image är mer specifik och vinner. Utan raderna nedan
		// blir Balder dagsljusbelyst i en mörk scen - en ljus fläck, tydligast
		// med den ljusa bear-sleeping.png som är den enda nattposen. Vid natt är
		// dessutom .progress-scene-tone opacity 0, så inget annat lager mörkar
		// honom.
		for (const band of ['evening', 'night']) {
			expect(route).toContain(
				`.companion-media[data-time='${band}'] :global(.progress-companion-pose) {`
			);
		}

		// Graderingen skrivs som variabel, inte som filter: annars krävs en
		// specificitetsstrid mot regeln som sätter filter på bilden.
		const grades = route.slice(route.indexOf(".companion-media[data-time='evening'] :global(.progress-companion-pose) {"));
		expect(grades.slice(0, 400)).toContain('--companion-grade:');

		// Kvällen ska vara mörkare än grundgraderingen, och natten mörkast.
		const brightnessFor = (selector: string) => {
			const rule = route.slice(route.indexOf(selector));
			return Number(rule.slice(0, 600).match(/brightness\(([\d.]+)\)/)?.[1]);
		};
		const day = brightnessFor('.companion-media :global(.progress-companion-pose) {');
		const evening = brightnessFor(".companion-media[data-time='evening'] :global(.progress-companion-pose) {");
		const night = brightnessFor(".companion-media[data-time='night'] :global(.progress-companion-pose) {");
		expect(evening).toBeLessThan(day);
		expect(night).toBeLessThan(evening);
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
