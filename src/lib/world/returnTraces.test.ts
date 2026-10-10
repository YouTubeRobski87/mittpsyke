import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ProgressCompanionDayState, ProgressCompanionSeason } from '$lib/progressCompanion';
import {
	GATHERED_LEAF_COUNT,
	WORLD_RETURN_TRACES_SESSION_KEY,
	getGatheredLeaves,
	getWorldAbsenceBand,
	getWorldReturnTraces,
	resolveSessionWorldReturnTraces,
	type WorldAbsenceBand
} from './returnTraces';

const SEASONS: ProgressCompanionSeason[] = ['spring', 'summer', 'autumn', 'winter'];
const TIMES: ProgressCompanionDayState[] = ['morning', 'day', 'evening', 'night'];
const BANDS: WorldAbsenceBand[] = ['none', 'short', 'few-days', 'longer'];

function memoryStorage(initial: Record<string, string> = {}) {
	const values = new Map(Object.entries(initial));
	return {
		values,
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => {
			values.set(key, value);
		}
	};
}

describe('frånvaroband', () => {
	it('saknad eller ogiltig stämpel räknas aldrig som återkomst', () => {
		expect(getWorldAbsenceBand(null)).toBe('none');
		expect(getWorldAbsenceBand(undefined)).toBe('none');
		expect(getWorldAbsenceBand(-1)).toBe('none');
		expect(getWorldAbsenceBand(Number.NaN)).toBe('none');
		expect(getWorldAbsenceBand(Number.POSITIVE_INFINITY)).toBe('none');
	});

	it('delar in frånvaron i grova band', () => {
		expect(getWorldAbsenceBand(0)).toBe('short');
		expect(getWorldAbsenceBand(1)).toBe('short');
		expect(getWorldAbsenceBand(2)).toBe('few-days');
		expect(getWorldAbsenceBand(6)).toBe('few-days');
		expect(getWorldAbsenceBand(7)).toBe('longer');
		expect(getWorldAbsenceBand(400)).toBe('longer');
	});
});

describe('vilka tecken som får synas', () => {
	it('visar aldrig något utan en verklig frånvaro', () => {
		for (const season of SEASONS) {
			for (const timeOfDay of TIMES) {
				expect(getWorldReturnTraces({ absenceBand: 'none', season, timeOfDay })).toEqual([]);
				expect(getWorldReturnTraces({ absenceBand: 'short', season, timeOfDay })).toEqual([]);
			}
		}
	});

	it('samlade löv bara på hösten efter en längre frånvaro', () => {
		for (const band of BANDS) {
			for (const season of SEASONS) {
				for (const timeOfDay of TIMES) {
					const traces = getWorldReturnTraces({ absenceBand: band, season, timeOfDay });
					expect(traces.includes('gathered-leaves')).toBe(band === 'longer' && season === 'autumn');
				}
			}
		}
	});

	it('den stilla ringen bara morgon och kväll efter några dagar eller mer', () => {
		for (const band of BANDS) {
			for (const season of SEASONS) {
				for (const timeOfDay of TIMES) {
					const traces = getWorldReturnTraces({ absenceBand: band, season, timeOfDay });
					const expected =
						(band === 'few-days' || band === 'longer') &&
						(timeOfDay === 'morning' || timeOfDay === 'evening');
					expect(traces.includes('still-water-ring')).toBe(expected);
				}
			}
		}
	});

	it('högst två tecken', () => {
		for (const band of BANDS) {
			for (const season of SEASONS) {
				for (const timeOfDay of TIMES) {
					expect(getWorldReturnTraces({ absenceBand: band, season, timeOfDay }).length).toBeLessThanOrEqual(2);
				}
			}
		}
	});
});

describe('samlade löv', () => {
	it('är deterministiska för samma seed', () => {
		expect(getGatheredLeaves('seed-a')).toEqual(getGatheredLeaves('seed-a'));
		expect(getGatheredLeaves(null)).toEqual(getGatheredLeaves(null));
		expect(getGatheredLeaves('seed-a')).not.toEqual(getGatheredLeaves('seed-b'));
	});

	it('ligger framför stugans trappa, utanför textblocket, och är få och lågmälda', () => {
		const leaves = getGatheredLeaves('seed-a');
		expect(leaves).toHaveLength(GATHERED_LEAF_COUNT);
		for (const leaf of leaves) {
			expect(leaf.x).toBeGreaterThanOrEqual(10);
			expect(leaf.x).toBeLessThanOrEqual(21);
			expect(leaf.y).toBeGreaterThanOrEqual(43.5);
			expect(leaf.y).toBeLessThanOrEqual(47);
			expect(leaf.opacity).toBeLessThanOrEqual(0.62);
			expect(leaf.size).toBeLessThanOrEqual(11);
		}
	});
});

describe('sessionens val', () => {
	const autumnEvening = { season: 'autumn', timeOfDay: 'evening' } as const;

	it('räknas fram en gång och hålls sedan stilla', () => {
		const storage = memoryStorage();
		const first = resolveSessionWorldReturnTraces(storage, { absenceBand: 'longer', ...autumnEvening });
		expect(first).toEqual(['gathered-leaves', 'still-water-ring']);

		// Andra monteringen i samma flik: förra besöket är nyss överskrivet och
		// dygnsdelen har skiftat, men tecknen hoppar inte.
		const second = resolveSessionWorldReturnTraces(storage, {
			absenceBand: 'short',
			season: 'autumn',
			timeOfDay: 'day'
		});
		expect(second).toEqual(first);
	});

	it('sparar ett tomt val så att en kort frånvaro förblir tom', () => {
		const storage = memoryStorage();
		expect(resolveSessionWorldReturnTraces(storage, { absenceBand: 'short', ...autumnEvening })).toEqual([]);
		expect(storage.values.get(WORLD_RETURN_TRACES_SESSION_KEY)).toBe('');
		expect(resolveSessionWorldReturnTraces(storage, { absenceBand: 'longer', ...autumnEvening })).toEqual([]);
	});

	it('sparar bara tecken-id:n, aldrig dygn eller tidsstämplar', () => {
		const storage = memoryStorage();
		resolveSessionWorldReturnTraces(storage, { absenceBand: 'longer', ...autumnEvening });
		expect([...storage.values.keys()]).toEqual([WORLD_RETURN_TRACES_SESSION_KEY]);
		expect(storage.values.get(WORLD_RETURN_TRACES_SESSION_KEY)).not.toMatch(/\d/);
	});

	it('ignorerar ett manipulerat sessionsvärde', () => {
		const storage = memoryStorage({ [WORLD_RETURN_TRACES_SESSION_KEY]: 'streak,badge' });
		expect(resolveSessionWorldReturnTraces(storage, { absenceBand: 'short', ...autumnEvening })).toEqual([]);
	});

	it('klarar sig utan lagring och med lagring som kastar', () => {
		expect(resolveSessionWorldReturnTraces(null, { absenceBand: 'longer', ...autumnEvening })).toEqual([
			'gathered-leaves',
			'still-water-ring'
		]);
		const throwing = {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('blocked');
			}
		};
		expect(resolveSessionWorldReturnTraces(throwing, { absenceBand: 'few-days', ...autumnEvening })).toEqual([
			'still-water-ring'
		]);
	});
});

describe('inga siffror, ingen skuld, ingen beständighet', () => {
	const moduleSource = readFileSync(join(process.cwd(), 'src/lib/world/returnTraces.ts'), 'utf8');
	const componentSource = readFileSync(
		join(process.cwd(), 'src/lib/components/world/WorldReturnTraces.svelte'),
		'utf8'
	);
	const route = readFileSync(join(process.cwd(), 'src/routes/framsteg/+page.svelte'), 'utf8');

	it('modulen använder ingen slump, ingen localStorage och inget känsligt underlag', () => {
		expect(moduleSource).not.toMatch(/Math\.random/);
		expect(moduleSource).not.toMatch(/localStorage/);
		expect(moduleSource).not.toMatch(/\b(mood|diary|chat|entryText|content)\b/i);
	});

	it('lagret är dekorativt: dolt för skärmläsare, utan pekare och utan text', () => {
		expect(componentSource).toContain('aria-hidden="true"');
		expect(componentSource).toContain('pointer-events: none');
		expect(componentSource).not.toMatch(/<button|onclick|role=|aria-live/);
		expect(componentSource).not.toMatch(/Math\.random/);
		const markup = componentSource.slice(componentSource.indexOf('</script>'), componentSource.indexOf('<style>'));
		const visibleText = markup.replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '').trim();
		expect(visibleText).toBe('');
	});

	it('rörliga tecken stängs av vid minskad rörelse, statiska ligger kvar', () => {
		const reduced = componentSource.slice(componentSource.indexOf('prefers-reduced-motion'));
		expect(reduced).toContain('animation: none');
		expect(reduced).not.toMatch(/display:\s*none|opacity:\s*0\b/);
		// Ringen återanvänder sidans ripple-lager, som redan stängs av helt.
		expect(route).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*?\.progress-ripple\s*\{[\s\S]*?animation: none/);
	});

	it('Framsteg visar ingen frånvarocopy eller räkning för tecknen', () => {
		// Sidan har äldre streak-kod längre ned; bara scenens markup granskas här.
		const scene = route.slice(route.indexOf('class="companion-media"'), route.indexOf('class="framsteg-layout'));
		expect(scene).toContain('<WorldReturnTraces');
		expect(scene).not.toMatch(/medan du var borta|du har varit borta|dagar sedan|streak/i);
		expect(scene).not.toMatch(/daysSinceLastVisit|absenceBand/);
	});
});
