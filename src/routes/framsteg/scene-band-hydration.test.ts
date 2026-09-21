import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	PROGRESS_COMPANION_SCENE_SOURCES,
	PROGRESS_SCENE_BANDS,
	PROGRESS_SCENE_CROSSFADE_MS,
	PROGRESS_SCENE_SOURCES,
	completeProgressSceneTransition,
	getProgressSceneBand,
	getProgressSceneLabel,
	prepareProgressSceneTransition,
	type ProgressSceneBand,
	type ProgressSceneTransitionState
} from '$lib/progressScene';

/**
 * Regression: scenens dygnsband räknades tidigare ut var för sig på servern
 * och på klienten. Hamnade de på varsin sida om en fasgräns blev resultatet
 * permanent fel: Svelte skriver aldrig om en bilds src/srcset under hydrering
 * (den antar att server och klient är överens), så data-time och etiketten
 * visade klientens band medan bilden satt kvar på serverns. Ingenting rättade
 * det heller i efterhand, eftersom övergångseffekten ser sceneBand ===
 * visibleBand och därför aldrig förbereder något byte.
 *
 * Servern väljer nu bandet och skickar det som initialSceneBand, precis som
 * med Balders initialSceneSpotId. Efter hydrering tar routens minutuppdatering
 * över på vanligt sätt.
 */

const ROOT = process.cwd();
const route = readFileSync(join(ROOT, 'src/routes/framsteg/+page.svelte'), 'utf8');
const loader = readFileSync(join(ROOT, 'src/routes/framsteg/+page.server.ts'), 'utf8');

/** Klockslag i Stockholm. Januari (CET) så omräkningen är entydig. */
function atStockholm(hour: number, minute: number): Date {
	return new Date(Date.UTC(2026, 0, 15, hour - 1, minute));
}

/** Samma starttillstånd som routen bygger av data.initialSceneBand. */
function stateFromServer(band: ProgressSceneBand): ProgressSceneTransitionState {
	return { visibleBand: band, pendingBand: null, outgoingBand: null };
}

describe('servern äger scenens startband', () => {
	it('räknar ut bandet i laddaren och skickar det i båda grenarna', () => {
		expect(loader).toContain("import { getProgressSceneBand } from '$lib/progressScene'");
		expect(loader).toContain('const initialSceneBand = getProgressSceneBand();');
		// Både gästgrenen och den inloggade grenen måste skicka det - annars
		// faller den ena tillbaka på klientens eget val igen.
		expect(loader.match(/^\t+initialSceneBand,$/gm) ?? []).toHaveLength(2);
	});

	it('låter klienten starta från serverns värde, inte från sin egen klocka', () => {
		expect(route).toContain('data.initialSceneBand ?? getProgressSceneBand()');
		expect(route).toContain('let sceneBand = $state<ProgressSceneBand>(initialSceneBand);');
		expect(route).toContain('visibleBand: initialSceneBand,');

		// Startvärdet får inte längre räknas ut två gånger i deklarationerna:
		// det var precis den dubbla uträkningen som kunde divergera.
		const declarations = route.slice(
			route.indexOf('const initialSceneBand ='),
			route.indexOf('let clearSceneTransitionTimer')
		);
		expect(declarations.match(/getProgressSceneBand\(\)/g) ?? []).toHaveLength(1);
	});
});

describe('startbandet och dess bild hör ihop', () => {
	it.each(PROGRESS_SCENE_BANDS)('gästens bild motsvarar bandet %s', (band) => {
		const sources = PROGRESS_SCENE_SOURCES[band];
		const suffix = band === 'afternoon' ? '' : `-${band}`;
		expect(sources.fallback).toBe(`/images/scenes/progress-lake-bear${suffix}-800.webp`);
		expect(sources.srcset.split(', ').every((entry) => entry.includes(`progress-lake-bear${suffix}`))).toBe(true);
	});

	it.each(PROGRESS_SCENE_BANDS)('den inloggades bild motsvarar bandet %s', (band) => {
		const sources = PROGRESS_COMPANION_SCENE_SOURCES[band];
		const suffix = band === 'afternoon' ? '' : `-${band}`;
		expect(sources.fallback).toBe(`/images/scenes/progress-lake${suffix}-800.webp`);
		expect(sources.srcset.split(', ').every((entry) => entry.includes(`progress-lake${suffix}`))).toBe(true);
		// Gäst och inloggad får aldrig samma bild: björnen är inbränd i gästens.
		expect(sources.fallback).not.toBe(PROGRESS_SCENE_SOURCES[band].fallback);
	});

	it('etiketten följer samma band som bilden', () => {
		const labels: Record<ProgressSceneBand, string> = {
			morning: 'Morgon',
			day: 'Dag',
			afternoon: 'Eftermiddag',
			evening: 'Kväll',
			night: 'Natt'
		};
		for (const band of PROGRESS_SCENE_BANDS) {
			expect(getProgressSceneLabel(band)).toBe(labels[band]);
		}
		// Mallen läser bild, data-time och etikett ur ETT värde, så de kan inte
		// glida isär.
		expect(route).toContain('data-time={sceneTransition.visibleBand}');
		expect(route).toContain('getProgressSceneLabel(sceneTransition.visibleBand)');
		expect(route).toContain('const visibleSceneSources = $derived(sceneSources[sceneTransition.visibleBand]);');
	});
});

describe('server och klient i samma band', () => {
	it.each([
		['natt', 23, 30, 'night'],
		['dag', 12, 0, 'day'],
		['morgon', 7, 0, 'morning'],
		['eftermiddag', 18, 30, 'afternoon'],
		['kväll', 21, 0, 'evening']
	] as const)('%s: ingen övergång förbereds när klockan inte hunnit någonstans', (_namn, hour, minute, expected) => {
		const serverBand = getProgressSceneBand(atStockholm(hour, minute));
		expect(serverBand).toBe(expected);

		const state = stateFromServer(serverBand);
		const clientBand = getProgressSceneBand(atStockholm(hour, minute));
		const next = prepareProgressSceneTransition(state, clientBand);

		// Samma objekt tillbaka = ingen onödig crossfade direkt efter hydrering.
		expect(next).toBe(state);
		expect(next.visibleBand).toBe(expected);
		expect(next.pendingBand).toBeNull();
	});
});

describe('minutuppdateringen fungerar efter hydrering', () => {
	// Varje fasgräns: servern renderar minuten före, klienten vaknar minuten
	// efter. Det är exakt det läge som tidigare gav en permanent felaktig bild.
	it.each([
		['22:59 -> 23:00', 22, 59, 23, 0, 'evening', 'night'],
		['04:59 -> 05:00', 4, 59, 5, 0, 'night', 'morning'],
		['09:59 -> 10:00', 9, 59, 10, 0, 'morning', 'day'],
		['16:59 -> 17:00', 16, 59, 17, 0, 'day', 'afternoon'],
		['19:59 -> 20:00', 19, 59, 20, 0, 'afternoon', 'evening']
	] as const)(
		'%s byter band med ett vanligt crossfade',
		(_namn, fromHour, fromMinute, toHour, toMinute, fromBand, toBand) => {
			const serverBand = getProgressSceneBand(atStockholm(fromHour, fromMinute));
			const clientBand = getProgressSceneBand(atStockholm(toHour, toMinute));
			expect(serverBand).toBe(fromBand);
			expect(clientBand).toBe(toBand);

			// Klienten startar på serverns band - bilden i HTML:en stämmer.
			const hydrated = stateFromServer(serverBand);
			expect(hydrated.visibleBand).toBe(fromBand);

			// Minutuppdateringen ser det nya bandet och förbereder nästa bild.
			const prepared = prepareProgressSceneTransition(hydrated, clientBand);
			expect(prepared.pendingBand).toBe(toBand);
			// Den synliga bilden står kvar tills den nya har laddat.
			expect(prepared.visibleBand).toBe(fromBand);

			// När den väntande bilden laddat byts den in och den gamla ligger
			// kvar för överlappningen.
			const revealed = completeProgressSceneTransition(prepared, toBand);
			expect(revealed.visibleBand).toBe(toBand);
			expect(revealed.outgoingBand).toBe(fromBand);
			expect(revealed.pendingBand).toBeNull();
		}
	);

	it('behåller minutintervallet som driver bytet', () => {
		expect(route).toContain('sceneBand = getProgressSceneBand(now);');
		expect(route).toContain('window.setInterval(updateSceneTimeOfDay, 60 * 1000)');
		expect(route).toContain('prepareSceneTransition(sceneBand);');
	});
});

describe('det som inte fick ändras', () => {
	it('behåller sex sekunders crossfade och preload av nästa bild', () => {
		expect(PROGRESS_SCENE_CROSSFADE_MS).toBe(6_000);
		expect(route).toContain('companion-world-scene--preload');
		expect(route).toContain('onload={() => revealPreparedScene(pendingBand)}');
	});

	it('behåller reduced motion-undantaget för scenbytet', () => {
		expect(route).toContain('@media (prefers-reduced-motion: reduce)');
		expect(route).toContain('animation-duration: 1ms;');
	});

	it('behåller alla fem dygnsband och gäst/inloggad-uppdelningen', () => {
		expect(PROGRESS_SCENE_BANDS).toEqual(['morning', 'day', 'afternoon', 'evening', 'night']);
		expect(route).toContain(
			'data.isAnonymous ? PROGRESS_SCENE_SOURCES : PROGRESS_COMPANION_SCENE_SOURCES'
		);
	});
});
