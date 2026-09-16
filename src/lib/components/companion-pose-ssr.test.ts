import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import CompanionPose from './CompanionPose.svelte';

// Regressionsskydd för hydration-glitchen på Mitt Hem: Balder saknades helt
// i servergenererad HTML eftersom localBasePose/localPosition startade som
// null och sattes först i onMount (som aldrig körs vid SSR). Han poppade
// därför in synligt en liten stund efter att sidan blivit interaktiv.
//
// getCompanionInitialBasePose/getCompanionInitialScenePosition
// (companionPoseState.ts) ger nu CompanionPose ett deterministiskt,
// dagpartskorrekt starttillstånd, så SSR:en aldrig är tom.

afterEach(() => {
	vi.useRealTimers();
});

// Samma fasta tidpunkter (UTC, explicit) som companionPoseState.test.ts -
// en sträng utan offset tolkas som körarens egen systemtid och gav tidigare
// ett separat, verkligt CI-only-fel (se companion-sitting-pose.test.ts).
const DAYPART_TIMES = {
	day: '2026-06-15T10:00:00Z', // 12:00 i Stockholm
	evening: '2026-06-15T17:00:00Z', // 19:00 i Stockholm
	night: '2026-06-15T00:00:00Z' // 02:00 i Stockholm
} as const;

function renderAtTime(iso: string) {
	vi.useFakeTimers();
	vi.setSystemTime(new Date(iso));
	try {
		return render(CompanionPose, {
			props: { class: 'hero-companion-pose', companionId: 'bear', scene: 'dashboard' }
		}).body;
	} finally {
		vi.useRealTimers();
	}
}

describe('CompanionPose SSR-render på Mitt Hem', () => {
	it.each(Object.entries(DAYPART_TIMES))(
		'servergenererad HTML innehåller en riktig Balder-bild (%s)',
		(_daypart, iso) => {
			const body = renderAtTime(iso);
			expect(body).toMatch(/<img[^>]*src="\/images\/avatars\/presets\/bear-[a-z-]+\.png"/);
		}
	);

	it('ingen tom/null companion-state i första render - positionen sätts också direkt', () => {
		const body = renderAtTime(DAYPART_TIMES.day);
		// positionStyle i CompanionPose.svelte är bara tom sträng när `position`
		// är null. Riktiga variabler betyder att localPosition inte är null.
		expect(body).toMatch(/--companion-x: [\d.]+%/);
		expect(body).toMatch(/--companion-scale: [\d.]+/);
	});

	it('natten ger den sovande posen redan i SSR, precis som klientens riktiga val skulle göra', () => {
		const body = renderAtTime(DAYPART_TIMES.night);
		expect(body).toContain('bear-sleeping.png');
	});

	it('ingen annan följeslagare än björnen introduceras av SSR-startvärdet', () => {
		for (const iso of Object.values(DAYPART_TIMES)) {
			const body = renderAtTime(iso);
			expect(body).not.toMatch(/fox|rav|räv/i);
		}
	});
});
