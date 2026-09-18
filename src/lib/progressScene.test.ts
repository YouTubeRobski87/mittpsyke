import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	PROGRESS_SCENE_BANDS,
	PROGRESS_COMPANION_SCENE_SOURCES,
	PROGRESS_SCENE_SOURCES,
	PROGRESS_SCENE_CROSSFADE_MS,
	clearProgressSceneOutgoing,
	completeProgressSceneTransition,
	getProgressSceneBand,
	getProgressSceneLabel,
	prepareProgressSceneTransition,
	type ProgressSceneBand
} from './progressScene';

/**
 * Bygger ett datum som motsvarar en viss klockslag i Stockholm. Testerna körs i
 * januari (CET, UTC+1) så omräkningen är entydig och oberoende av sommartid.
 */
function atStockholm(hour: number, minute: number): Date {
	return new Date(Date.UTC(2026, 0, 15, hour - 1, minute));
}

/** Varje spann utom eftermiddagen har en egen relight; eftermiddagen visar originalets solnedgång. */
function sceneBaseFor(band: ProgressSceneBand, base: string): string {
	return band === 'afternoon' ? base : `${base}-${band}`;
}

describe('getProgressSceneBand - tidsgränser', () => {
	it.each([
		['04:59', 4, 59, 'night'],
		['05:00', 5, 0, 'morning'],
		['09:59', 9, 59, 'morning'],
		['10:00', 10, 0, 'day'],
		['16:59', 16, 59, 'day'],
		['17:00', 17, 0, 'afternoon'],
		['19:59', 19, 59, 'afternoon'],
		['20:00', 20, 0, 'evening'],
		['22:59', 22, 59, 'evening'],
		['23:00', 23, 0, 'night'],
		['23:59', 23, 59, 'night'],
		['00:30', 0, 30, 'night']
	] as const)('%s ger %s', (_label, hour, minute, expected) => {
		expect(getProgressSceneBand(atStockholm(hour, minute))).toBe(expected);
	});

	it('täcker dygnets alla timmar utan lucka', () => {
		for (let hour = 0; hour < 24; hour += 1) {
			const band = getProgressSceneBand(atStockholm(hour, 30));
			expect(PROGRESS_SCENE_BANDS).toContain(band);
		}
	});

	it('faller tillbaka på dag när tiden inte går att läsa', () => {
		expect(getProgressSceneBand(new Date(Number.NaN))).toBe('day');
	});
});

describe('varje spann pekar på den responsiva sjöscenen', () => {
	it.each(PROGRESS_SCENE_BANDS)('%s har tre storlekar som finns på disk', (band) => {
		const { fallback, srcset } = PROGRESS_SCENE_SOURCES[band];

		const base = sceneBaseFor(band, '/images/scenes/progress-lake-bear');

		// Fallback ska vara den minsta varianten, inte fullbredd.
		expect(fallback).toBe(`${base}-800.webp`);

		const expected = [`${base}-800.webp 800w`, `${base}-1200.webp 1200w`, `${base}.webp 1672w`].join(
			', '
		);
		expect(srcset).toBe(expected);

		for (const entry of srcset.split(', ')) {
			const path = entry.split(' ')[0];
			expect(existsSync(join(process.cwd(), 'static', path))).toBe(true);
		}
		expect(existsSync(join(process.cwd(), 'static', fallback))).toBe(true);
	});

	it('använder aldrig den gamla stugscenen', () => {
		for (const band of PROGRESS_SCENE_BANDS) {
			const { srcset, fallback } = PROGRESS_SCENE_SOURCES[band];
			expect(fallback).not.toContain('progress-cabin-lakeside');
			expect(srcset).not.toContain('progress-cabin-lakeside');
		}
	});

	it('visar originalets solnedgång bara på eftermiddagen; varje annat spann har en egen bild', () => {
		const sunset = PROGRESS_SCENE_SOURCES.afternoon.srcset;
		expect(sunset).toContain('/images/scenes/progress-lake-bear.webp 1672w');
		const own = (['morning', 'day', 'evening', 'night'] as const).map(
			(band) => PROGRESS_SCENE_SOURCES[band].srcset
		);
		expect(new Set([sunset, ...own]).size).toBe(5);
		for (const band of ['morning', 'day', 'evening', 'night'] as const) {
			expect(PROGRESS_SCENE_SOURCES[band].srcset).toContain(`progress-lake-bear-${band}`);
		}
	});
});

describe('Framstegs fullständiga dygnsscener', () => {
	it('förbereder nästa responsiva asset innan den synliga scenen byts och kortar bytet vid reduced motion', () => {
		const route = readFileSync(join(process.cwd(), 'src/routes/framsteg/+page.svelte'), 'utf8');

		expect(route).toContain('prepareProgressSceneTransition');
		expect(route).toContain('onload={() => revealPreparedScene(pendingBand)}');
		expect(route).toContain('@media (prefers-reduced-motion: reduce)');
		expect(route).toContain('animation-duration: 1ms;');
	});

	it('visar björnen som enda följeslagare i Framstegs scen', () => {
		const route = readFileSync(join(process.cwd(), 'src/routes/framsteg/+page.svelte'), 'utf8');

		expect(route).toContain('<CompanionPose');
		expect(route).toContain('getProgressCompanionPlacementStyle');
		expect(route).toContain('COMPANION.id');
		expect(route).not.toContain('data.progressCompanion');
		expect(route).toContain('data.isAnonymous ? PROGRESS_SCENE_SOURCES : PROGRESS_COMPANION_SCENE_SOURCES');
		expect(route).not.toContain('<CompanionVisitor');
		expect(route).not.toContain('<CompanionFriend');
	});

	it('håller den artneutrala bilden för inloggade följeslagare på disk', () => {
		for (const band of PROGRESS_SCENE_BANDS) {
			const { fallback, srcset } = PROGRESS_COMPANION_SCENE_SOURCES[band];
			const base = sceneBaseFor(band, '/images/scenes/progress-lake');
			expect(fallback).toBe(`${base}-800.webp`);
			expect(srcset).toContain(`${base}.webp 1672w`);
		}
	});

	it('visar hela 1672:941-kompositionen utan beskärning och anger responsiva visningsbredder', () => {
		const route = readFileSync(join(process.cwd(), 'src/routes/framsteg/+page.svelte'), 'utf8');

		expect(route).toContain('aspect-ratio: 1672 / 941');
		expect(route).toContain('object-fit: contain');
		expect(route).toContain('object-position: center');
		expect(route).toContain('(max-width: 640px) calc(100vw - 28px)');
		expect(route).toContain('(max-width: 980px) calc(100vw - 44px)');
		expect(route).toContain('1120px');
	});

	it('renderar ingen äldre separat person- eller eldgrupp ovanpå scenbilden', () => {
		const route = readFileSync(join(process.cwd(), 'src/routes/framsteg/+page.svelte'), 'utf8');

		// Sjöscenen innehåller redan människan, björnen, elden och deras markkontakt.
		// Campfire är en separat frilagd grupp och får därför inte monteras i just
		// Framsteg-heron, oavsett vilket dygnsspann som väljs.
		expect(route).not.toContain("import Campfire from '$lib/components/world/Campfire.svelte'");
		expect(route).not.toContain('<Campfire');
	});

	it('behåller den levande världen och progressionsunderlaget', () => {
		const route = readFileSync(join(process.cwd(), 'src/routes/framsteg/+page.svelte'), 'utf8');

		expect(route).toContain('<AmbientWorld');
		expect(route).toContain('<WorldMarks');
		expect(route).toContain('getWorldMarks(worldPresence');
		expect(route).toContain('getGardenGrowthPoints(entryCount');
		expect(route).toContain('getWorldGrowthLevel(worldStage)');
		expect(route).toContain("fetch('/api/diary/stats-timeline'");
	});

	it('låter ingen URL-parameter styra vilket dygnsspann som visas', () => {
		const route = readFileSync(join(process.cwd(), 'src/routes/framsteg/+page.svelte'), 'utf8');

		// Spannet kommer bara från klockan. Den tillfälliga ?scene=-genvägen för
		// okulär granskning är borta och får inte återinföras.
		expect(route).not.toContain('parseProgressSceneOverride');
		expect(route).not.toContain("searchParams.get('scene')");
		expect(route).toContain('prepareSceneTransition(sceneBand)');
	});

});

describe('etikett och alt', () => {
	it.each([
		['morning', 'Morgon'],
		['day', 'Dag'],
		['afternoon', 'Eftermiddag'],
		['evening', 'Kväll'],
		['night', 'Natt']
	] as const)('%s får etiketten %s', (band, label) => {
		expect(getProgressSceneLabel(band as ProgressSceneBand)).toBe(label);
	});

	it('bild och etikett följer rätt spann vid varje timme', () => {
		for (let hour = 0; hour < 24; hour += 1) {
			const band = getProgressSceneBand(atStockholm(hour, 15));
			const base = sceneBaseFor(band, 'progress-lake-bear');
			expect(PROGRESS_SCENE_SOURCES[band].srcset).toContain(`${base}-800.webp`);
			expect(getProgressSceneLabel(band)).toBe(
				{ morning: 'Morgon', day: 'Dag', afternoon: 'Eftermiddag', evening: 'Kväll', night: 'Natt' }[
					band
				]
			);
		}
	});
});

describe('Framstegs mjuka scenbyte', () => {
	it('behåller den synliga scenen medan nästa asset förbereds', () => {
		const state = prepareProgressSceneTransition(
			{ visibleBand: 'afternoon', pendingBand: null, outgoingBand: null },
			'evening'
		);

		expect(state).toEqual({ visibleBand: 'afternoon', pendingBand: 'evening', outgoingBand: null });
	});

	it('byter först när den väntande bilden har laddat och behåller den gamla för crossfade', () => {
		const pending = prepareProgressSceneTransition(
			{ visibleBand: 'afternoon', pendingBand: null, outgoingBand: null },
			'evening'
		);
		const transitioned = completeProgressSceneTransition(pending, 'evening');

		expect(transitioned).toEqual({ visibleBand: 'evening', pendingBand: null, outgoingBand: 'afternoon' });
		expect(clearProgressSceneOutgoing(transitioned)).toEqual({
			visibleBand: 'evening',
			pendingBand: null,
			outgoingBand: null
		});
	});

	it('ignorerar en gammal bild som blir klar efter att ett senare byte förberetts', () => {
		const state = completeProgressSceneTransition(
			{ visibleBand: 'day', pendingBand: 'afternoon', outgoingBand: null },
			'evening'
		);
		expect(state).toEqual({ visibleBand: 'day', pendingBand: 'afternoon', outgoingBand: null });
	});

	it('har en lugn men begränsad överlappningstid', () => {
		// Natt- och kvällsbilden skiljer sig kraftigt i ljus - bytet ska vara en
		// lugn övergång på några sekunder, aldrig ett hopp och aldrig en halv minut.
		expect(PROGRESS_SCENE_CROSSFADE_MS).toBeGreaterThanOrEqual(5_000);
		expect(PROGRESS_SCENE_CROSSFADE_MS).toBeLessThanOrEqual(8_000);
	});
});
