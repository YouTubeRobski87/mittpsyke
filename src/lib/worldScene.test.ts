import { describe, expect, it } from 'vitest';
import {
	getGrowthLevel,
	getLivingWorldScene,
	growthWorldMask,
	normalizeGrowthLevel,
	type LivingWorldEffectKind,
	type WorldGrowthLevel
} from './worldScene';

// Effekttyper som ska finnas på ALLA nivåer (den lugna men kompletta basvärlden).
const PERSISTENT_BASE_KINDS: LivingWorldEffectKind[] = ['light', 'water', 'foliage', 'mist'];
// Sekundärt liv, tänds först på högre nivåer.
const SECONDARY_KINDS: LivingWorldEffectKind[] = ['drift', 'butterfly', 'bird'];

describe('getGrowthLevel', () => {
	it.each([
		[0, 0],
		[1, 1],
		[5, 1],
		[6, 2],
		[15, 2],
		[16, 3],
		[30, 3],
		[31, 4],
		[278, 4]
	])('ger nivå %i -> %i', (entries, expected) => {
		expect(getGrowthLevel(entries)).toBe(expected);
	});

	it('faller tillbaka till 0 för icke-numeriska/negativa värden', () => {
		for (const bad of [undefined, null, NaN, Infinity, -5, '10', {}]) {
			expect(getGrowthLevel(bad as unknown)).toBe(0);
		}
	});
});

describe('normalizeGrowthLevel', () => {
	it.each([
		[0, 0],
		[1, 1],
		[2, 2],
		[3, 3],
		[4, 4]
	])('behåller giltig nivå %i', (value, expected) => {
		expect(normalizeGrowthLevel(value)).toBe(expected);
	});

	it('klampar över 4 till 4 och under 0 till 0', () => {
		expect(normalizeGrowthLevel(9)).toBe(4);
		expect(normalizeGrowthLevel(-3)).toBe(0);
	});

	it('golvar decimaltal', () => {
		expect(normalizeGrowthLevel(2.9)).toBe(2);
	});

	it('faller tillbaka till 0 för okänt/saknat värde', () => {
		for (const bad of [undefined, null, NaN, Infinity, -Infinity, '3', {}, [], true]) {
			expect(normalizeGrowthLevel(bad as unknown)).toBe(0);
		}
	});
});

describe('growthWorldmask - sekundära lager per nivå', () => {
	it('nivå 0: inget sekundärt liv tänt', () => {
		const mask = growthWorldMask(0);
		expect(mask.level).toBe(0);
		expect(mask.features).toEqual({ drift: false, butterfly: false, bird: false });
	});

	it('nivå 1: fortfarande inget sekundärt liv (bara rikare växtlighet)', () => {
		expect(growthWorldMask(1).features).toEqual({ drift: false, butterfly: false, bird: false });
	});

	it('nivå 2: drift tänds', () => {
		expect(growthWorldMask(2).features).toEqual({ drift: true, butterfly: false, bird: false });
	});

	it('nivå 3: drift + fjäril tänds', () => {
		expect(growthWorldMask(3).features).toEqual({ drift: true, butterfly: true, bird: false });
	});

	it('nivå 4: allt sekundärt liv tänt', () => {
		expect(growthWorldMask(4).features).toEqual({ drift: true, butterfly: true, bird: true });
	});

	it('gaten är aldrig satt på de beständiga baslagren', () => {
		for (let level = 0 as WorldGrowthLevel; level <= 4; level = (level + 1) as WorldGrowthLevel) {
			const { features } = growthWorldMask(level);
			for (const kind of [...PERSISTENT_BASE_KINDS, 'leaf', 'cloud'] as LivingWorldEffectKind[]) {
				expect(features[kind]).toBeUndefined();
			}
		}
	});

	it('är monoton: ett tänt sekundärlager släcks aldrig på högre nivå', () => {
		for (const kind of SECONDARY_KINDS) {
			let seenOn = false;
			for (let level = 0 as WorldGrowthLevel; level <= 4; level = (level + 1) as WorldGrowthLevel) {
				const on = growthWorldMask(level).features[kind] === true;
				if (on) seenOn = true;
				if (seenOn) expect(growthWorldMask(level).features[kind]).toBe(true);
			}
		}
	});
});

describe('growthWorldMask - foliage-opacitet (primär tillväxtsignal)', () => {
	it('växer monotont med nivån och är aldrig 0 på nivå 0', () => {
		const scales = ([0, 1, 2, 3, 4] as WorldGrowthLevel[]).map(
			(l) => growthWorldMask(l).foliageOpacityScale
		);
		expect(scales[0]).toBeGreaterThan(0);
		for (let i = 1; i < scales.length; i++) {
			expect(scales[i]).toBeGreaterThan(scales[i - 1]);
		}
	});

	it('nivå 4 förstärker den beständiga växtligheten med skalan 1.4', () => {
		expect(growthWorldMask(4).foliageOpacityScale).toBe(1.4);
	});

	it('okänt/saknat värde ger nivå 0-skala (säker fallback)', () => {
		expect(growthWorldMask(undefined).foliageOpacityScale).toBe(
			growthWorldMask(0).foliageOpacityScale
		);
		expect(growthWorldMask('nonsense' as unknown).level).toBe(0);
	});
});

describe('getLivingWorldScene - växtnivå styr scenen', () => {
	// Fast årstid + dygn så att bara växtnivån varierar mellan fallen.
	const fixed = { season: 'summer', timeOfDay: 'day' } as const;

	function enabledPersistentKinds(growthLevel: number) {
		const scene = getLivingWorldScene({ ...fixed, growthLevel });
		return new Set(
			scene.effects.filter((e) => scene.features[e.kind]).map((e) => e.kind)
		);
	}

	it('nivå 0 ser komplett ut: alla beständiga baslager finns', () => {
		const kinds = enabledPersistentKinds(0);
		for (const kind of PERSISTENT_BASE_KINDS) {
			expect(kinds.has(kind)).toBe(true);
		}
		// Men inget sekundärt liv.
		expect(kinds.has('drift')).toBe(false);
	});

	it('drift finns på nivå 4 men inte på nivå 1 (sekundär signal)', () => {
		expect(enabledPersistentKinds(1).has('drift')).toBe(false);
		expect(enabledPersistentKinds(4).has('drift')).toBe(true);
	});

	it('nivå 4 ger de avsedda slutopaciteterna för beständig vegetation', () => {
		const scene = getLivingWorldScene({ ...fixed, growthLevel: 4 });
		const opacity = (id: string) => scene.effects.find((effect) => effect.id === id)?.opacity;

		expect(opacity('grass-left')).toBeCloseTo(0.42);
		expect(opacity('grass-bank')).toBeCloseTo(0.364);
		expect(opacity('canopy-right')).toBeCloseTo(0.308);
	});

	it('säsong och dygn påverkas inte av växtnivån', () => {
		const low = getLivingWorldScene({ ...fixed, growthLevel: 0 });
		const high = getLivingWorldScene({ ...fixed, growthLevel: 4 });
		expect(low.season).toBe(high.season);
		expect(low.timeOfDay).toBe(high.timeOfDay);
		expect(low.season).toBe('summer');
		expect(low.timeOfDay).toBe('day');
	});

	it('växtnivån kan inte tvinga fram ett djur som säsongen stänger av', () => {
		// Fågel kräver dagsljus och ej vinter. På nivå 4 men vinter ska den vara av.
		const winter = getLivingWorldScene({ season: 'winter', timeOfDay: 'day', growthLevel: 4 });
		const birdEvent = winter.events.find((e) => e.kind === 'bird');
		expect(birdEvent?.enabled).toBe(false);
		// Fjäril kräver vår/sommar. På nivå 4 men höst ska den vara av.
		const autumn = getLivingWorldScene({ season: 'autumn', timeOfDay: 'day', growthLevel: 4 });
		const butterflyEvent = autumn.events.find((e) => e.kind === 'butterfly');
		expect(butterflyEvent?.enabled).toBe(false);
	});

	it('höstlövet förblir årstidsstyrt, oberoende av växtnivå', () => {
		const autumnLow = getLivingWorldScene({ season: 'autumn', timeOfDay: 'day', growthLevel: 0 });
		const leaf = autumnLow.events.find((e) => e.kind === 'leaf');
		expect(leaf?.enabled).toBe(true);
	});

	it('saknad växtnivå faller tillbaka till nivå 0 (inget sekundärt liv)', () => {
		const scene = getLivingWorldScene({ ...fixed });
		expect(scene.features.drift).toBe(false);
		expect(scene.features.butterfly).toBe(false);
		expect(scene.features.bird).toBe(false);
	});

	it('explicit features vinner över växtnivåns gate', () => {
		const scene = getLivingWorldScene({ ...fixed, growthLevel: 0, features: { drift: true } });
		expect(scene.features.drift).toBe(true);
	});

	it('moln förblir pausade oavsett växtnivå', () => {
		for (const growthLevel of [0, 4]) {
			expect(getLivingWorldScene({ ...fixed, growthLevel }).features.cloud).toBe(false);
		}
	});
});
