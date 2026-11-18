<script lang="ts">
	// Lugn humörkurva för "Din senaste tid". En enda linje, dämpade punkter och
	// inga färgkodade nivåer - färg används aldrig för att förmedla värde.
	//
	// Axeletiketterna ligger som HTML utanför SVG:en. SVG-text skalas med
	// viewBox och blir oläslig på 320 px, medan HTML-text behåller sin storlek.
	import type { Snippet } from 'svelte';
	import ProgressPeriodPicker from './ProgressPeriodPicker.svelte';
	import {
		buildChartGeometry,
		PERIOD_OPTIONS,
		type ChartPoint,
		type PeriodDays
	} from '$lib/progress-recent-period';

	let {
		points,
		period,
		onSelectPeriod,
		textAlternative,
		hasChart,
		fallbackText,
		labelledBy,
		selectedPointKey,
		onSelectPoint,
		beforeChart,
		// Dagboken visar 7/30/90, Framsteg 30/90/180. Utan den här propen skulle
		// dagbokens periodval kräva att PERIOD_OPTIONS ändras, vilket hade lagt
		// till en knapp på Framsteg också.
		options = PERIOD_OPTIONS
	}: {
		points: ChartPoint[];
		period: PeriodDays;
		onSelectPeriod: (value: PeriodDays) => void;
		textAlternative: string;
		hasChart: boolean;
		fallbackText: string;
		labelledBy?: string;
		/** Vald punkt visas även som en textpanel utanför grafen. */
		selectedPointKey?: string | null;
		onSelectPoint?: (point: ChartPoint) => void;
		options?: { value: PeriodDays; label: string }[];
		/** Valfritt innehåll mellan periodvalet och kurvan, t.ex. nyckeltal. */
		beforeChart?: Snippet;
	} = $props();

	// Förhållandet 2.4:1 håller kurvan läsbar både i den breda desktopkolumnen
	// och när plotytan krymper till ett par hundra pixlar på mobil.
	const VIEW_WIDTH = 480;
	const VIEW_HEIGHT = 200;
	const PADDING_X = 12;
	const PADDING_Y = 16;

	const geometry = $derived(
		buildChartGeometry(points, {
			width: VIEW_WIDTH,
			height: VIEW_HEIGHT,
			paddingX: PADDING_X,
			paddingY: PADDING_Y
		})
	);

	// Stödlinjer vid 10, 5.5 och 1 på humörskalan.
	const gridLines = [PADDING_Y, VIEW_HEIGHT / 2, VIEW_HEIGHT - PADDING_Y];

	// Med många punkter blir varje etikett oläslig. Första, mitten och sista
	// räcker för att placera kurvan i tiden.
	const axisLabels = $derived.by(() => {
		if (points.length === 0) return [];
		if (points.length <= 3) return points.map((point) => point.label);
		const middle = points[Math.floor((points.length - 1) / 2)];
		return [points[0].label, middle.label, points[points.length - 1].label];
	});

	function selectPoint(point: ChartPoint) {
		onSelectPoint?.(point);
	}

	function handlePointKeydown(event: KeyboardEvent, point: ChartPoint) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		selectPoint(point);
	}
</script>

<div class="recent-chart">
	{#if options.length > 0}
		<ProgressPeriodPicker {period} onSelect={onSelectPeriod} {options} />
	{/if}

	{@render beforeChart?.()}

	{#if hasChart && points.length > 0}
		<div class="chart-plot">
			<!-- Ordet döljs på små skärmar för att ge plotytan bredd. Hela skalan
				 står i textalternativet och i sektionens ingress. -->
			<div class="y-labels" aria-hidden="true">
				<span>10<span class="label-word"> ljusare</span></span>
				<span>1<span class="label-word"> tungt</span></span>
			</div>
			<svg
				class="chart-svg"
				viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
				role="img"
				aria-labelledby={labelledBy}
				aria-label={labelledBy ? undefined : textAlternative}
			>
				{#each gridLines as y}
					<line class="grid-line" x1={PADDING_X} y1={y} x2={VIEW_WIDTH - PADDING_X} y2={y} />
				{/each}
				{#if geometry.line}
					<polyline class="mood-line" points={geometry.line} />
				{/if}
				{#each geometry.points as point}
					<circle
						class="mood-dot"
						class:is-selected={selectedPointKey === point.key}
						cx={point.x}
						cy={point.y}
						r={selectedPointKey === point.key ? 6 : 4}
						role="button"
						tabindex="0"
						aria-label={`Visa detaljer för ${point.fullLabel}, ${point.value} av 10`}
						onclick={() => selectPoint(point)}
						onkeydown={(event) => handlePointKeydown(event, point)}
					/>
				{/each}
			</svg>
			<div class="x-labels" aria-hidden="true">
				{#each axisLabels as label}
					<span>{label}</span>
				{/each}
			</div>
		</div>
		<!-- Textalternativ: samma information som kurvan, utan färg eller form. -->
		<p class="sr-only">{textAlternative}</p>
	{:else}
		<p class="chart-fallback">{fallbackText}</p>
	{/if}
</div>

<style>
	.recent-chart {
		display: grid;
		gap: 0.85rem;
		min-width: 0;
	}

	/* Två kolumner: y-etiketter och plotyta. X-etiketterna ligger i rad två
	   under plotytan, så de följer grafens bredd utan hårdkodad marginal. */
	.chart-plot {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		column-gap: 0.6rem;
		row-gap: 0.35rem;
		align-items: stretch;
		min-width: 0;
	}

	.y-labels {
		grid-column: 1;
		grid-row: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding-block: 0.35rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.75rem;
		line-height: 1.2;
		white-space: nowrap;
	}

	.chart-svg {
		grid-column: 2;
		grid-row: 1;
		display: block;
		width: 100%;
		height: auto;
		min-width: 0;
		overflow: visible;
	}

	.grid-line {
		stroke: hsl(var(--border));
		stroke-width: 1;
	}

	.mood-line {
		fill: none;
		stroke: var(--theme-accent, #557c68);
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.mood-dot {
		fill: var(--theme-accent, #557c68);
		stroke: hsl(var(--background));
		stroke-width: 1.5;
		cursor: pointer;
	}

	.mood-dot.is-selected {
		stroke: hsl(var(--foreground));
		stroke-width: 2;
	}

	.mood-dot:focus-visible {
		outline: none;
		stroke: hsl(var(--foreground));
		stroke-width: 3;
	}

	.x-labels {
		grid-column: 2;
		grid-row: 2;
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		padding-inline: 0.15rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.75rem;
	}

	.chart-fallback {
		margin: 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (max-width: 520px) {
		.y-labels {
			font-size: 0.7rem;
		}

		.label-word {
			display: none;
		}

		.x-labels {
			font-size: 0.7rem;
		}
	}
</style>
