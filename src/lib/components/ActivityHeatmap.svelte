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

	type TooltipState = {
		index: number;
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
	let tooltip = $state<TooltipState | null>(null);

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
		return date.toLocaleDateString('sv-SE', {
			month: 'short'
		});
	}

	function getIsoWeekNumber(date: Date) {
		const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
		const dayNumber = (target.getUTCDay() + 6) % 7;
		target.setUTCDate(target.getUTCDate() - dayNumber + 3);

		const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
		const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7;
		firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3);

		return 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * DAY_MS));
	}

	function getWeekNumberForIndex(index: number) {
		const currentWeekStart = startOfWeek(new Date());
		const firstWeekStart = addDays(currentWeekStart, -(WEEKS_TO_SHOW - 1) * 7);
		return getIsoWeekNumber(addDays(firstWeekStart, index * 7));
	}

	function getFirstWeekStart() {
		const currentWeekStart = startOfWeek(new Date());
		return addDays(currentWeekStart, -(WEEKS_TO_SHOW - 1) * 7);
	}

	function buildWeeklyPoints(source: HeatmapData): RhythmPoint[] {
		const firstWeekStart = getFirstWeekStart();
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
		const yMin = safeMax > 0 ? -0.5 : 0;
		const valueRange = Math.max(safeMax - yMin, 1);

		const nextChartPoints = source.map((point, index) => {
			const x = chartPadding.left + (index / Math.max(source.length - 1, 1)) * width;
			const normalized = safeMax > 0 ? (point.count - yMin) / valueRange : 0;
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

		if (source.length === 2) {
			const [start, end] = source;
			const segmentWidth = (end.x - start.x) / 3;
			return `M ${start.x} ${start.y} C ${start.x + segmentWidth} ${start.y} ${end.x - segmentWidth} ${end.y} ${end.x} ${end.y}`;
		}

		const deltas = source.slice(0, -1).map((point, index) => {
			const next = source[index + 1];
			const dx = next.x - point.x;
			const dy = next.y - point.y;
			return {
				dx,
				slope: dx === 0 ? 0 : dy / dx
			};
		});

		const tangents = source.map((_, index) => {
			if (index === 0) return deltas[0]?.slope ?? 0;
			if (index === source.length - 1) return deltas[deltas.length - 1]?.slope ?? 0;

			const previous = deltas[index - 1];
			const current = deltas[index];
			if (!previous || !current) return 0;
			if (previous.slope === 0 || current.slope === 0) return 0;
			if (Math.sign(previous.slope) !== Math.sign(current.slope)) return 0;

			const weightA = 2 * current.dx + previous.dx;
			const weightB = current.dx + 2 * previous.dx;
			return (weightA + weightB) / (weightA / previous.slope + weightB / current.slope);
		});

		for (let index = 0; index < deltas.length; index += 1) {
			const delta = deltas[index];
			if (!delta || delta.slope === 0) {
				tangents[index] = 0;
				tangents[index + 1] = 0;
				continue;
			}

			const alpha = tangents[index] / delta.slope;
			const beta = tangents[index + 1] / delta.slope;
			const scale = Math.hypot(alpha, beta);

			if (scale > 3) {
				const adjusted = 3 / scale;
				tangents[index] = adjusted * alpha * delta.slope;
				tangents[index + 1] = adjusted * beta * delta.slope;
			}
		}

		let path = `M ${source[0].x} ${source[0].y}`;

		for (let index = 0; index < source.length - 1; index += 1) {
			const current = source[index];
			const next = source[index + 1];
			const deltaX = next.x - current.x;
			const controlOffset = deltaX / 3;
			const controlOneX = current.x + controlOffset;
			const controlOneY = current.y + tangents[index] * controlOffset;
			const controlTwoX = next.x - controlOffset;
			const controlTwoY = next.y - tangents[index + 1] * controlOffset;

			path += ` C ${controlOneX} ${controlOneY} ${controlTwoX} ${controlTwoY} ${next.x} ${next.y}`;
		}

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
		if (source.length === 0) return [];

		const firstWeekStart = getFirstWeekStart();
		const monthsWithData = Object.entries(data)
			.filter(([, count]) => Boolean(count))
			.map(([dateStr]) => {
				const date = new Date(`${dateStr}T00:00:00`);
				if (Number.isNaN(date.getTime())) return null;
				return {
					monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
					date
				};
			})
			.filter((value): value is { monthKey: string; date: Date } => value !== null);

		const latestDateByMonth = new Map<string, Date>();
		for (const entry of monthsWithData) {
			const existing = latestDateByMonth.get(entry.monthKey);
			if (!existing || entry.date.getTime() > existing.getTime()) {
				latestDateByMonth.set(entry.monthKey, entry.date);
			}
		}

		const lastThreeMonths = [...latestDateByMonth.entries()]
			.sort((left, right) => left[1].getTime() - right[1].getTime())
			.slice(-3);

		const labelsByIndex = new Map<number, RhythmPoint>();
		for (const [, date] of lastThreeMonths) {
			const weekStart = startOfWeek(date);
			const weekIndex = Math.floor((weekStart.getTime() - firstWeekStart.getTime()) / (7 * DAY_MS));
			if (weekIndex < 0 || weekIndex >= source.length) continue;

			labelsByIndex.set(weekIndex, {
				index: weekIndex,
				label: formatWeekLabel(date),
				count: source[weekIndex]?.count ?? 0
			});
		}

		return [...labelsByIndex.values()].sort((left, right) => left.index - right.index);
	}

	function handleMouseMove(event: MouseEvent) {
		const svg = event.currentTarget as SVGSVGElement | null;
		if (!svg || chartPoints.length === 0) {
			tooltip = null;
			return;
		}

		const bounds = svg.getBoundingClientRect();
		if (bounds.width === 0) return;

		const relativeX = ((event.clientX - bounds.left) / bounds.width) * svgWidth;
		let nearestIndex = 0;
		let nearestDistance = Number.POSITIVE_INFINITY;

		for (let index = 0; index < chartPoints.length; index += 1) {
			const distance = Math.abs(chartPoints[index].x - relativeX);
			if (distance < nearestDistance) {
				nearestDistance = distance;
				nearestIndex = index;
			}
		}

		const point = chartPoints[nearestIndex];
		tooltip = {
			index: nearestIndex,
			x: point.x,
			y: point.y
		};
	}

	function handleMouseLeave() {
		tooltip = null;
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
			<svg
				class="rhythm-graphic"
				viewBox={`0 0 ${svgWidth} ${svgHeight}`}
				role="img"
				aria-label="Veckovis aktivitet över tid"
				onmousemove={handleMouseMove}
				onmouseleave={handleMouseLeave}
			>
				<defs>
					<linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stop-color="var(--theme-accent, #436e8f)" stop-opacity="0.35" />
						<stop offset="100%" stop-color="var(--theme-accent, #436e8f)" stop-opacity="0" />
					</linearGradient>
					<linearGradient id="rhythmLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="var(--rhythm-line-soft)" />
						<stop offset="100%" stop-color="var(--rhythm-line-strong)" />
					</linearGradient>
				</defs>

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
					<circle cx={lastPoint.x} cy={lastPoint.y} r="8" class="line-end-glow" />
					<circle cx={lastPoint.x} cy={lastPoint.y} r="4.5" class="line-end-dot" />
				{/if}

				{#each labelPoints as point}
					{@const x = chartPadding.left + (point.index / Math.max(points.length - 1, 1)) * (svgWidth - chartPadding.left - chartPadding.right)}
					<text x={x} y={svgHeight - 12} text-anchor="middle" class="axis-label">{point.label}</text>
				{/each}
			</svg>
			{#if tooltip}
				<div
					class="chart-tooltip"
					style={`left:${(tooltip.x / svgWidth) * 100}%;top:${(tooltip.y / svgHeight) * 100}%;`}
				>
					Vecka {getWeekNumberForIndex(tooltip.index)} – {points[tooltip.index]?.count ?? 0} inlägg
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.rhythm-container {
		--rhythm-line-soft: color-mix(in srgb, var(--theme-accent, #436e8f) 52%, #8ba89c 48%);
		--rhythm-line-strong: color-mix(in srgb, var(--theme-accent, #436e8f) 74%, #6c877a 26%);
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
	.empty-copy {
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
	.empty-copy {
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
		position: relative;
		border-radius: 1.15rem;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 100%),
			hsl(var(--surface-soft));
		overflow: visible;
	}

	.rhythm-graphic {
		display: block;
		width: 100%;
		height: auto;
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
		fill: url(#areaGrad);
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
		animation: lineDraw 780ms ease-in-out forwards;
	}

	.line-shadow {
		stroke: rgba(63, 88, 76, 0.12);
		stroke-width: 8;
	}

	.line-path {
		stroke: url(#rhythmLineGradient);
		stroke-width: 3.2;
	}

	.line-end-glow {
		fill: none;
		stroke: color-mix(in srgb, var(--theme-accent, #436e8f) 70%, white 30%);
		stroke-width: 2;
		opacity: 0;
		transform-box: fill-box;
		transform-origin: center;
		animation:
			dotFade 280ms ease-out 520ms forwards,
			dotPulse 1800ms ease-in-out 800ms infinite;
	}

	.line-end-dot {
		fill: color-mix(in srgb, var(--theme-accent, #436e8f) 72%, white 28%);
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

	.chart-tooltip {
		position: absolute;
		z-index: 1;
		pointer-events: none;
		padding: 0.45rem 0.7rem;
		border-radius: 0.6rem;
		background: #1a1f1a;
		color: white;
		font-size: 0.78rem;
		font-weight: 500;
		line-height: 1.2;
		white-space: nowrap;
		box-shadow: 0 10px 24px rgba(11, 16, 11, 0.16);
		transform: translate(-50%, calc(-100% - 0.8rem));
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

	@keyframes dotPulse {
		0%,
		100% {
			opacity: 0.18;
			transform: scale(0.92);
		}
		50% {
			opacity: 0.45;
			transform: scale(1.18);
		}
	}

	:global(.dark) .chart-panel {
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%),
			hsl(var(--surface-soft));
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
		.line-end-glow,
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

		.axis-label {
			font-size: 0.72rem;
		}
	}
</style>
