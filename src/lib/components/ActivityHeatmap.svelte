<script lang="ts">
	interface HeatmapData {
		[date: string]: number;
	}

	type RhythmPoint = {
		index: number;
		label: string;
		count: number;
	};

	type ChartPoint = {
		x: number;
		y: number;
	};

	const WEEKS_TO_SHOW = 24;
	const DAY_MS = 24 * 60 * 60 * 1000;
	const svgWidth = 760;
	const svgHeight = 250;
	const chartPadding = {
		top: 28,
		right: 18,
		bottom: 42,
		left: 18
	};

	let {
		data = {},
		error = '',
		loading = false
	}: {
		data?: HeatmapData;
		error?: string;
		loading?: boolean;
	} = $props();

	let points = $state<RhythmPoint[]>([]);
	let chartPoints = $state<ChartPoint[]>([]);
	let linePath = $state('');
	let areaPath = $state('');
	let maxCount = $state(0);
	let labelPoints = $state<RhythmPoint[]>([]);

	function startOfWeek(date: Date) {
		const copy = new Date(date);
		const dayOffset = (copy.getDay() + 6) % 7;
		copy.setHours(0, 0, 0, 0);
		copy.setDate(copy.getDate() - dayOffset);
		return copy;
	}

	function addDays(date: Date, days: number) {
		const copy = new Date(date);
		copy.setDate(copy.getDate() + days);
		return copy;
	}

	function formatWeekLabel(date: Date) {
		return new Intl.DateTimeFormat('sv-SE', {
			day: 'numeric',
			month: 'short'
		}).format(date);
	}

	function buildWeeklyPoints(source: HeatmapData): RhythmPoint[] {
		const currentWeekStart = startOfWeek(new Date());
		const firstWeekStart = addDays(currentWeekStart, -(WEEKS_TO_SHOW - 1) * 7);
		const built = Array.from({ length: WEEKS_TO_SHOW }, (_, index) => {
			const weekStart = addDays(firstWeekStart, index * 7);
			return {
				index,
				label: formatWeekLabel(weekStart),
				count: 0
			};
		});

		for (const [dateStr, count] of Object.entries(source)) {
			if (!count) continue;

			const date = new Date(`${dateStr}T00:00:00`);
			if (Number.isNaN(date.getTime())) continue;

			const weekStart = startOfWeek(date);
			const weekIndex = Math.floor((weekStart.getTime() - firstWeekStart.getTime()) / (7 * DAY_MS));

			if (weekIndex < 0 || weekIndex >= built.length) continue;
			built[weekIndex].count += count;
		}

		return built;
	}

	function buildChartPoints(source: RhythmPoint[]) {
		const width = svgWidth - chartPadding.left - chartPadding.right;
		const height = svgHeight - chartPadding.top - chartPadding.bottom;
		const safeMax = Math.max(...source.map((point) => point.count), 0);

		const nextChartPoints = source.map((point, index) => {
			const x = chartPadding.left + (index / Math.max(source.length - 1, 1)) * width;
			const normalized = safeMax > 0 ? point.count / safeMax : 0;
			const y = chartPadding.top + height - normalized * height * 0.82;

			return { x, y };
		});

		return {
			maxCount: safeMax,
			chartPoints: nextChartPoints
		};
	}

	function buildLinePath(source: ChartPoint[]) {
		if (source.length === 0) return '';
		if (source.length === 1) return `M ${source[0].x} ${source[0].y}`;

		let path = `M ${source[0].x} ${source[0].y}`;

		for (let index = 1; index < source.length - 1; index += 1) {
			const current = source[index];
			const next = source[index + 1];
			const midpointX = (current.x + next.x) / 2;
			const midpointY = (current.y + next.y) / 2;
			path += ` Q ${current.x} ${current.y} ${midpointX} ${midpointY}`;
		}

		const lastPoint = source[source.length - 1];
		path += ` Q ${lastPoint.x} ${lastPoint.y} ${lastPoint.x} ${lastPoint.y}`;

		return path;
	}

	function buildAreaPath(source: ChartPoint[]) {
		if (source.length === 0) return '';

		const baselineY = svgHeight - chartPadding.bottom;
		const line = buildLinePath(source);
		const firstPoint = source[0];
		const lastPoint = source[source.length - 1];

		return `${line} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`;
	}

	function buildLabelPoints(source: RhythmPoint[]) {
		if (source.length <= 3) return source;
		const middleIndex = Math.floor((source.length - 1) / 2);
		return [source[0], source[middleIndex], source[source.length - 1]];
	}

	$effect(() => {
		points = buildWeeklyPoints(data);
		const nextChart = buildChartPoints(points);
		maxCount = nextChart.maxCount;
		chartPoints = nextChart.chartPoints;
		linePath = buildLinePath(chartPoints);
		areaPath = buildAreaPath(chartPoints);
		labelPoints = buildLabelPoints(points);
	});
</script>

<div class="rhythm-container">
	{#if loading}
		<div class="loading">Laddar grafen...</div>
	{:else if error}
		<div class="error">{error} Försök igen om en stund.</div>
	{:else if maxCount === 0}
		<div class="empty-state">
			<p class="empty-title">Din rytm syns här när du har börjat skriva.</p>
			<p class="empty-copy">Den får växa fram i lugn takt, utan att något behöver se ut på ett visst sätt.</p>
		</div>
	{:else}
		<div class="chart-panel">
			<svg class="rhythm-graphic" viewBox={`0 0 ${svgWidth} ${svgHeight}`} role="img" aria-label="Veckovis aktivitet över tid">
				<defs>
					<linearGradient id="rhythmAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stop-color="var(--rhythm-fill-top)" />
						<stop offset="100%" stop-color="var(--rhythm-fill-bottom)" />
					</linearGradient>
					<linearGradient id="rhythmLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="var(--rhythm-line-soft)" />
						<stop offset="100%" stop-color="var(--rhythm-line-strong)" />
					</linearGradient>
				</defs>

				<rect
					x={chartPadding.left}
					y={chartPadding.top - 8}
					width={svgWidth - chartPadding.left - chartPadding.right}
					height={svgHeight - chartPadding.top - chartPadding.bottom + 10}
					rx="24"
					class="chart-backdrop"
				/>

				<line x1={chartPadding.left} y1="86" x2={svgWidth - chartPadding.right} y2="86" class="guide-line" />
				<line x1={chartPadding.left} y1="142" x2={svgWidth - chartPadding.right} y2="142" class="guide-line" />
				<line
					x1={chartPadding.left}
					y1={svgHeight - chartPadding.bottom}
					x2={svgWidth - chartPadding.right}
					y2={svgHeight - chartPadding.bottom}
					class="base-line"
				/>

				{#if areaPath}
					<path d={areaPath} class="area-path" />
				{/if}

				{#if linePath}
					<path d={linePath} class="line-shadow" pathLength="1" />
					<path d={linePath} class="line-path" pathLength="1" />
				{/if}

				{#if chartPoints.length > 0}
					{@const lastPoint = chartPoints[chartPoints.length - 1]}
					<circle cx={lastPoint.x} cy={lastPoint.y} r="4.5" class="line-end-dot" />
				{/if}

				{#each labelPoints as point}
					{@const x = chartPadding.left + (point.index / Math.max(points.length - 1, 1)) * (svgWidth - chartPadding.left - chartPadding.right)}
					<text x={x} y={svgHeight - 12} text-anchor="middle" class="axis-label">{point.label}</text>
				{/each}
			</svg>
		</div>
		<p class="chart-note">Visar din aktivitet vecka för vecka, i din egen takt.</p>
	{/if}
</div>

<style>
	.rhythm-container {
		--rhythm-line-soft: color-mix(in srgb, var(--theme-accent, #0f766e) 52%, #8ba89c 48%);
		--rhythm-line-strong: color-mix(in srgb, var(--theme-accent, #0f766e) 74%, #6c877a 26%);
		--rhythm-fill-top: rgba(84, 122, 107, 0.18);
		--rhythm-fill-bottom: rgba(84, 122, 107, 0.02);
		width: 100%;
		padding: 0.4rem 0 0.2rem;
		min-block-size: clamp(18rem, 40vw, 24rem);
	}

	.loading,
	.error,
	.empty-state {
		min-block-size: 14rem;
		display: grid;
		place-items: center;
		padding: 2rem 1rem;
		text-align: center;
	}

	.loading,
	.empty-copy,
	.chart-note {
		color: hsl(var(--muted-foreground));
	}

	.error {
		color: hsl(var(--error-foreground));
	}

	.empty-state {
		gap: 0.45rem;
		align-content: center;
	}

	.empty-title,
	.empty-copy,
	.chart-note {
		margin: 0;
	}

	.empty-title {
		font-size: 0.98rem;
		font-weight: 550;
		color: hsl(var(--foreground));
	}

	.empty-copy {
		max-width: 36rem;
		font-size: 0.9rem;
		line-height: 1.65;
	}

	.chart-panel {
		border-radius: 1.15rem;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 100%),
			hsl(var(--surface-soft));
		border: 1px solid hsl(var(--border));
		overflow: hidden;
	}

	.rhythm-graphic {
		display: block;
		width: 100%;
		height: auto;
	}

	.chart-backdrop {
		fill: rgba(255, 255, 255, 0.16);
	}

	.guide-line,
	.base-line {
		fill: none;
		stroke-linecap: round;
	}

	.guide-line {
		stroke: rgba(84, 102, 96, 0.08);
		stroke-width: 1;
	}

	.base-line {
		stroke: rgba(84, 102, 96, 0.14);
		stroke-width: 1.2;
	}

	.area-path {
		fill: url(#rhythmAreaGradient);
		opacity: 0;
		animation: areaFade 520ms ease-out 90ms forwards;
	}

	.line-shadow,
	.line-path {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation: lineDraw 780ms ease-out forwards;
	}

	.line-shadow {
		stroke: rgba(63, 88, 76, 0.12);
		stroke-width: 8;
	}

	.line-path {
		stroke: url(#rhythmLineGradient);
		stroke-width: 3.2;
	}

	.line-end-dot {
		fill: color-mix(in srgb, var(--theme-accent, #0f766e) 72%, white 28%);
		stroke: rgba(255, 255, 255, 0.9);
		stroke-width: 2;
		opacity: 0;
		animation: dotFade 280ms ease-out 520ms forwards;
	}

	.axis-label {
		fill: hsl(var(--muted-foreground));
		font-family: var(--font-body);
		font-size: 0.8rem;
	}

	.chart-note {
		padding-top: 0.85rem;
		font-size: 0.84rem;
		line-height: 1.55;
	}

	@keyframes lineDraw {
		from {
			stroke-dashoffset: 1;
		}
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes areaFade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes dotFade {
		from {
			opacity: 0;
			transform: scale(0.9);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	:global(.dark) .rhythm-container {
		--rhythm-fill-top: rgba(105, 143, 126, 0.22);
		--rhythm-fill-bottom: rgba(105, 143, 126, 0.02);
	}

	:global(.dark) .chart-panel {
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%),
			hsl(var(--surface-soft));
	}

	:global(.dark) .chart-backdrop {
		fill: rgba(255, 255, 255, 0.03);
	}

	:global(.dark) .guide-line {
		stroke: rgba(219, 228, 223, 0.05);
	}

	:global(.dark) .base-line {
		stroke: rgba(219, 228, 223, 0.1);
	}

	:global(.dark) .line-shadow {
		stroke: rgba(0, 0, 0, 0.16);
	}

	:global(.dark) .line-end-dot {
		stroke: rgba(24, 32, 28, 0.92);
	}

	@media (prefers-reduced-motion: reduce) {
		.area-path,
		.line-shadow,
		.line-path,
		.line-end-dot {
			animation: none;
			opacity: 1;
			stroke-dashoffset: 0;
		}
	}

	@media (max-width: 640px) {
		.rhythm-container {
			min-block-size: 15rem;
		}

		.chart-note {
			font-size: 0.8rem;
		}

		.axis-label {
			font-size: 0.72rem;
		}
	}
</style>
