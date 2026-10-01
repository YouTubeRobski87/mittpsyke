import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const route = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

describe('Framsteg laddar komplett progressdata', () => {
	it('startar den samlade progressladdningen för inloggade besökare', () => {
		const onMountBlock = route.slice(
			route.indexOf('onMount(() => {'),
			route.indexOf('\n\t// Ytan mäts om', route.indexOf('onMount(() => {'))
		);

		expect(onMountBlock).toContain('void loadProgressData();');
		expect(onMountBlock).not.toContain('void loadMoodTimeline();');
	});

	it('den samlade laddningen hämtar även streak, milstolpar, heatmap och måendetidslinje', () => {
		const loader = route.slice(
			route.indexOf('async function loadProgressData()'),
			route.indexOf('async function loadMoodTimeline()')
		);

		expect(loader).toContain("fetch('/api/diary/streak'");
		expect(loader).toContain("fetch('/api/diary/milestones'");
		expect(loader).toContain("fetch('/api/diary/heatmap'");
		expect(loader).toContain("fetch('/api/diary/stats-timeline'");
		expect(loader).toContain('applyProgressPayload(payload);');
	});
});
