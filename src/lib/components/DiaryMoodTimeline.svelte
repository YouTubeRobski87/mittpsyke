<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	type DiaryMoodEntry = {
		created_at: string | null;
		mood: string | null;
	};

	type DailyMoodPoint = {
		date: string;
		averageMood: number | null;
		entriesCount: number;
	};

	type RangeDays = 7 | 30 | 90;

	export let entries: DiaryMoodEntry[] = [];

	const RANGE_OPTIONS: RangeDays[] = [7, 30, 90];
	const EMPTY_STATE_PRIMARY = 'När du har sparat några inlägg börjar din graf att fyllas här.';
	const EMPTY_STATE_SECONDARY =
		'Fortsätt skriva några dagar till, så blir det lättare att se mönster över tid.';

	let selectedRange: RangeDays = 30;
	let chartCanvas: HTMLCanvasElement | null = null;
	let chart: any = null;
	let ChartClass: any = null;
	let dailyMoodData: DailyMoodPoint[] = [];
	let hasEnoughData = false;
	let supportiveLine = '';

	function parseMood(value: string | null): number | null {
		if (!value) return null;
		const numeric = Number(value);
		if (!Number.isFinite(numeric)) return null;
		if (numeric < 1 || numeric > 10) return null;
		return Math.round(numeric * 10) / 10;
	}

	function toDateKey(dateValue: string): string | null {
		const date = new Date(dateValue);
		if (Number.isNaN(date.getTime())) return null;

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function createDateRange(days: number): string[] {
		const result: string[] = [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (let offset = days - 1; offset >= 0; offset--) {
			const date = new Date(today);
			date.setDate(today.getDate() - offset);
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			result.push(`${year}-${month}-${day}`);
		}

		return result;
	}

	function buildDailyMoodData(source: DiaryMoodEntry[], rangeDays: RangeDays): DailyMoodPoint[] {
		const grouped = new Map<string, { moodSum: number; moodCount: number; entriesCount: number }>();

		for (const entry of source) {
			if (!entry.created_at) continue;
			const dateKey = toDateKey(entry.created_at);
			if (!dateKey) continue;

			const bucket = grouped.get(dateKey) ?? { moodSum: 0, moodCount: 0, entriesCount: 0 };
			bucket.entriesCount += 1;

			const mood = parseMood(entry.mood);
			if (mood !== null) {
				bucket.moodSum += mood;
				bucket.moodCount += 1;
			}

			grouped.set(dateKey, bucket);
		}

		return createDateRange(rangeDays).map((dateKey) => {
			const bucket = grouped.get(dateKey);
			if (!bucket) {
				return {
					date: dateKey,
					averageMood: null,
					entriesCount: 0
				};
			}

			return {
				date: dateKey,
				averageMood: bucket.moodCount > 0 ? Math.round((bucket.moodSum / bucket.moodCount) * 10) / 10 : null,
				entriesCount: bucket.entriesCount
			};
		});
	}

	function buildSupportiveLine(points: DailyMoodPoint[], range: RangeDays): string {
		const totalEntries = points.reduce((sum, point) => sum + point.entriesCount, 0);
		const periodLabel = `de senaste ${range} dagarna`;
		const moodValues = points
			.map((point) => point.averageMood)
			.filter((value): value is number => typeof value === 'number');

		if (totalEntries === 0) {
			return `När du har skrivit några gånger ${periodLabel} blir mönster lättare att se.`;
		}

		const entryWord = totalEntries === 1 ? 'gång' : 'gånger';
		if (moodValues.length >= 3) {
			const spread = Math.max(...moodValues) - Math.min(...moodValues);
			if (spread >= 2.5) {
				return `Du har skrivit ${totalEntries} ${entryWord} ${periodLabel}. Det har svängt en del, vilket är helt normalt.`;
			}
		}

		return `Du har skrivit ${totalEntries} ${entryWord} ${periodLabel}. Små förändringar över tid räknas också.`;
	}

	function toShortDateLabel(dateKey: string): string {
		const date = new Date(`${dateKey}T00:00:00`);
		if (Number.isNaN(date.getTime())) return dateKey;
		return date.toLocaleDateString('sv-SE', {
			month: 'short',
			day: 'numeric'
		});
	}

	function toLongDateLabel(dateKey: string): string {
		const date = new Date(`${dateKey}T00:00:00`);
		if (Number.isNaN(date.getTime())) return dateKey;
		return date.toLocaleDateString('sv-SE', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function readCssColor(variableName: string, fallback: string): string {
		if (typeof window === 'undefined') return fallback;
		const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
		return value || fallback;
	}

	function hexToRgba(hex: string, alpha: number): string {
		const normalized = hex.replace('#', '');
		if (![3, 6].includes(normalized.length)) return `rgba(15, 118, 110, ${alpha})`;
		const fullHex =
			normalized.length === 3
				? normalized
						.split('')
						.map((char) => `${char}${char}`)
						.join('')
				: normalized;

		const r = Number.parseInt(fullHex.slice(0, 2), 16);
		const g = Number.parseInt(fullHex.slice(2, 4), 16);
		const b = Number.parseInt(fullHex.slice(4, 6), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	function getAccentWithAlpha(alpha: number): string {
		const accent = readCssColor('--primary', '#0f766e');
		if (accent.startsWith('#')) return hexToRgba(accent, alpha);
		if (accent.startsWith('rgb(')) return accent.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
		return `rgba(15, 118, 110, ${alpha})`;
	}

	function destroyChart() {
		if (chart) {
			chart.destroy();
			chart = null;
		}
	}

	function buildChart() {
		if (!ChartClass || !chartCanvas || !hasEnoughData) {
			destroyChart();
			return;
		}

		const labels = dailyMoodData.map((point) => toShortDateLabel(point.date));
		const datasetValues = dailyMoodData.map((point) => point.averageMood);
		const tickColor = readCssColor('--muted-foreground', '#6b7280');
		const borderColor = readCssColor('--primary', '#0f766e');
		const gridColor = readCssColor('--border', '#d8dde1');

		const context = chartCanvas.getContext('2d');
		if (!context) return;

		const gradient = context.createLinearGradient(0, 0, 0, chartCanvas.height || 220);
		gradient.addColorStop(0, getAccentWithAlpha(0.18));
		gradient.addColorStop(1, getAccentWithAlpha(0.02));

		destroyChart();
		chart = new ChartClass(context, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						data: datasetValues,
						borderColor,
						backgroundColor: gradient,
						fill: true,
						tension: 0.34,
						spanGaps: false,
						borderWidth: 2,
						pointRadius: (ctx: any) => (ctx.raw === null ? 0 : 2),
						pointHoverRadius: (ctx: any) => (ctx.raw === null ? 0 : 3),
						pointBackgroundColor: borderColor,
						pointBorderWidth: 0
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'nearest',
					intersect: false
				},
				plugins: {
					legend: { display: false },
					tooltip: {
						displayColors: false,
						callbacks: {
							title: (items: any[]) => {
								const index = items[0]?.dataIndex ?? 0;
								return toLongDateLabel(dailyMoodData[index]?.date ?? '');
							},
							label: (context: any) => {
								const index = context.dataIndex ?? 0;
								const point = dailyMoodData[index];
								if (!point || point.averageMood === null) {
									return 'Inget humör sparat den dagen';
								}
								return `Genomsnittligt humör: ${point.averageMood.toFixed(1)}/10`;
							},
							afterLabel: (context: any) => {
								const index = context.dataIndex ?? 0;
								const point = dailyMoodData[index];
								if (!point) return '';
								const label = point.entriesCount === 1 ? 'inlägg' : 'inlägg';
								return `Antal inlägg: ${point.entriesCount} ${label}`;
							}
						}
					}
				},
				scales: {
					x: {
						grid: { display: false },
						ticks: {
							color: tickColor,
							maxRotation: 0,
							autoSkip: true,
							maxTicksLimit: selectedRange === 90 ? 8 : 10
						},
						border: { display: false }
					},
					y: {
						min: 1,
						max: 10,
						ticks: {
							stepSize: 1,
							color: tickColor,
							callback: (value: string | number) => {
								const numeric = Number(value);
								if (numeric === 2) return 'Tyngre';
								if (numeric === 5) return 'Mittemellan';
								if (numeric === 8) return 'Lättare';
								return '';
							}
						},
						grid: {
							color: gridColor,
							lineWidth: 0.55
						},
						border: { display: false }
					}
				}
			}
		});
	}

	$: dailyMoodData = buildDailyMoodData(entries, selectedRange);
	$: hasEnoughData = dailyMoodData.filter((point) => point.averageMood !== null).length >= 2;
	$: supportiveLine = buildSupportiveLine(dailyMoodData, selectedRange);
	$: buildChart();

	onMount(() => {
		let mounted = true;
		const onThemeChanged = () => buildChart();

		void (async () => {
			const chartJs = await import('chart.js/auto');
			if (!mounted) return;
			ChartClass = chartJs.Chart;
			buildChart();
			window.addEventListener('mittpsyke:theme-changed', onThemeChanged);
		})();

		return () => {
			mounted = false;
			window.removeEventListener('mittpsyke:theme-changed', onThemeChanged);
		};
	});

	onDestroy(() => {
		destroyChart();
	});
</script>

<section class="auth-panel mood-timeline-panel" aria-labelledby="mood-timeline-title">
	<div class="timeline-head">
		<div class="timeline-copy">
			<h2 id="mood-timeline-title">Ditt mående över tid</h2>
			<p>
				En enkel överblick över hur dina dagar har känts. Det behöver inte gå spikrakt för att räknas som
				framsteg.
			</p>
		</div>

		<div class="timeline-filter" role="group" aria-label="Välj tidsintervall">
			{#each RANGE_OPTIONS as range}
				<button
					type="button"
					class={`timeline-filter-button ${selectedRange === range ? 'active' : ''}`}
					onclick={() => (selectedRange = range)}
				>
					{range} dagar
				</button>
			{/each}
		</div>
	</div>

	{#if hasEnoughData}
		<div class="timeline-chart-shell">
			<canvas bind:this={chartCanvas} aria-label="Lugn linjegraf över humör över tid"></canvas>
		</div>
		<p class="timeline-note">Det här är en enkel överblick, inte en bedömning av dig.</p>
		<p class="timeline-supportive">{supportiveLine}</p>
	{:else}
		<div class="timeline-empty">
			<p>{EMPTY_STATE_PRIMARY}</p>
			<p>{EMPTY_STATE_SECONDARY}</p>
		</div>
		<p class="timeline-supportive">{supportiveLine}</p>
	{/if}
</section>

<style>
	.mood-timeline-panel {
		display: grid;
		gap: 1rem;
	}

	.timeline-head {
		display: grid;
		gap: 0.8rem;
	}

	.timeline-copy h2 {
		margin: 0;
		font-size: 1.12rem;
	}

	.timeline-copy p {
		margin: 0.45rem 0 0;
		font-size: 0.92rem;
		line-height: 1.65;
		color: hsl(var(--muted-foreground));
		max-width: 72ch;
	}

	.timeline-filter {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.timeline-filter-button {
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		color: hsl(var(--muted-foreground));
		border-radius: var(--radius-pill);
		padding: 0.35rem 0.72rem;
		font-size: 0.82rem;
		line-height: 1.2;
		cursor: pointer;
		transition: border-color 140ms ease, background-color 140ms ease, color 140ms ease;
	}

	.timeline-filter-button:hover {
		color: hsl(var(--foreground));
		border-color: hsl(var(--muted-foreground) / 0.5);
	}

	.timeline-filter-button.active {
		background: color-mix(in srgb, var(--theme-accent, var(--primary)) 12%, hsl(var(--surface)));
		border-color: color-mix(in srgb, var(--theme-accent, var(--primary)) 42%, hsl(var(--border)));
		color: hsl(var(--foreground));
	}

	.timeline-chart-shell {
		height: 240px;
		width: 100%;
	}

	.timeline-note {
		margin: 0;
		font-size: 0.84rem;
		color: hsl(var(--muted-foreground));
	}

	.timeline-supportive {
		margin: 0;
		font-size: 0.88rem;
		line-height: 1.55;
		color: hsl(var(--muted-foreground));
	}

	.timeline-empty {
		padding: 0.9rem 0.95rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
		display: grid;
		gap: 0.45rem;
	}

	.timeline-empty p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.6;
		color: hsl(var(--muted-foreground));
	}

	@media (min-width: 860px) {
		.timeline-head {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: start;
		}
	}

	@media (max-width: 640px) {
		.timeline-chart-shell {
			height: 210px;
		}
	}
</style>
