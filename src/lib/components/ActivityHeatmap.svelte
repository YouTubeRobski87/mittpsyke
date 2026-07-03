<script lang="ts">
	interface HeatmapData {
		[date: string]: number;
	}

	type HeatmapCell = {
		date: string;
		count: number;
		label: string;
	};

	type HeatmapWeek = {
		index: number;
		days: HeatmapCell[];
	};

	const WEEKS_TO_SHOW = 24;
	const DAY_MS = 24 * 60 * 60 * 1000;

	let {
		data = {},
		error = '',
		loading = false
	}: {
		data?: HeatmapData;
		error?: string;
		loading?: boolean;
	} = $props();

	let weeks = $state<HeatmapWeek[]>([]);
	let heatmapWrapper = $state<HTMLDivElement | null>(null);

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

	function toDateKey(date: Date) {
		return date.toISOString().split('T')[0];
	}

	function getFirstWeekStart() {
		const currentWeekStart = startOfWeek(new Date());
		return addDays(currentWeekStart, -(WEEKS_TO_SHOW - 1) * 7);
	}

	function getColor(count: number) {
		if (count <= 0) return '#f3f6f4';
		if (count === 1) return '#d9f0bc';
		if (count === 2) return '#8fd06a';
		if (count === 3) return '#4ea14a';
		return '#1f6b34';
	}

	function getTooltip(date: string, count: number) {
		if (count === 0) return `${date}: Ingen aktivitet`;
		if (count === 1) return `${date}: 1 inlägg`;
		return `${date}: ${count} inlägg`;
	}

	function buildWeeks(source: HeatmapData): HeatmapWeek[] {
		const firstWeekStart = getFirstWeekStart();

		return Array.from({ length: WEEKS_TO_SHOW }, (_, weekIndex) => {
			const weekStart = addDays(firstWeekStart, weekIndex * 7);
			const days = Array.from({ length: 7 }, (_, dayIndex) => {
				const currentDate = addDays(weekStart, dayIndex);
				const dateKey = toDateKey(currentDate);
				const count = source[dateKey] ?? 0;

				return {
					date: dateKey,
					count,
					label: getTooltip(dateKey, count)
				};
			});

			return {
				index: weekIndex,
				days
			};
		});
	}

	function scrollToLatestWeek() {
		if (!heatmapWrapper) return;
		heatmapWrapper.scrollLeft = heatmapWrapper.scrollWidth;
	}

	const hasEntries = $derived.by(() =>
		weeks.some((week) => week.days.some((day) => day.count > 0))
	);

	$effect(() => {
		weeks = buildWeeks(data);
		queueMicrotask(scrollToLatestWeek);
	});
</script>

<div class="heatmap-container">
	{#if loading}
		<div class="loading">Laddar aktivitetskarta...</div>
	{:else if error}
		<div class="error">{error} Försök igen om en stund.</div>
	{:else if !hasEntries}
		<div class="heatmap-frame empty-state">
			<p class="empty-title">Din aktivitetskarta fylls på när du börjar skriva.</p>
			<p class="empty-copy">Varje dag du återvänder lägger till ett nytt avtryck, i lugn takt.</p>
		</div>
	{:else}
		<div class="heatmap-frame">
			<div class="heatmap-wrapper" bind:this={heatmapWrapper}>
				<div
					class="heatmap-grid"
					role="img"
					aria-label={`Aktivitetskarta över de senaste ${WEEKS_TO_SHOW} veckorna`}
				>
					{#each weeks as week}
						<div class="week" aria-hidden="true">
							{#each week.days as day}
								<div
									class="day-cell"
									style={`background-color: ${getColor(day.count)}`}
									title={day.label}
								></div>
							{/each}
						</div>
					{/each}
				</div>
			</div>

			<div class="legend" aria-hidden="true">
				<span class="legend-label">Mindre</span>
				<div class="legend-cells">
					<div class="legend-cell" style="background-color: #f3f6f4"></div>
					<div class="legend-cell" style="background-color: #d9f0bc"></div>
					<div class="legend-cell" style="background-color: #8fd06a"></div>
					<div class="legend-cell" style="background-color: #4ea14a"></div>
					<div class="legend-cell" style="background-color: #1f6b34"></div>
				</div>
				<span class="legend-label">Mer</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.heatmap-container {
		width: 100%;
		min-inline-size: 0;
		max-inline-size: 100%;
	}

	.loading,
	.error,
	.empty-state {
		min-block-size: 14rem;
		display: grid;
		place-items: center;
		padding: 1.5rem;
		text-align: center;
	}

	.loading {
		color: hsl(var(--muted-foreground));
	}

	.error {
		color: hsl(var(--error-foreground));
	}

	.heatmap-frame {
		border-radius: 1rem;
		padding: 1rem;
		min-inline-size: 0;
		max-inline-size: 100%;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0) 100%),
			#161d18;
		border: 1px solid rgba(255, 255, 255, 0.05);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
	}

	.heatmap-wrapper {
		width: 100%;
		min-inline-size: 0;
		max-inline-size: 100%;
		overflow-x: auto;
		overflow-y: hidden;
		padding-bottom: 0.75rem;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.52) rgba(255, 255, 255, 0.12);
	}

	.heatmap-wrapper::-webkit-scrollbar {
		height: 10px;
	}

	.heatmap-wrapper::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.12);
		border-radius: 999px;
	}

	.heatmap-wrapper::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.52);
		border-radius: 999px;
	}

	.heatmap-grid {
		display: flex;
		gap: 0.28rem;
		inline-size: max-content;
		max-inline-size: none;
	}

	.week {
		display: grid;
		gap: 0.28rem;
	}

	.day-cell {
		inline-size: clamp(1rem, 1.75vw, 1.6rem);
		aspect-ratio: 1;
		border-radius: 0.2rem;
		border: 1px solid rgba(0, 0, 0, 0.18);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
		flex-shrink: 0;
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		margin-top: 0.65rem;
		color: rgba(255, 255, 255, 0.78);
		font-size: 0.84rem;
	}

	.legend-cells {
		display: flex;
		gap: 0.28rem;
	}

	.legend-cell {
		inline-size: 1rem;
		aspect-ratio: 1;
		border-radius: 0.2rem;
		border: 1px solid rgba(0, 0, 0, 0.18);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
	}

	.legend-label {
		white-space: nowrap;
	}

	.empty-title,
	.empty-copy {
		margin: 0;
	}

	.empty-title {
		color: rgba(255, 255, 255, 0.94);
		font-size: 0.98rem;
		font-weight: 600;
	}

	.empty-copy {
		color: rgba(255, 255, 255, 0.68);
		font-size: 0.9rem;
		line-height: 1.55;
		max-width: 34rem;
	}

	@media (max-width: 640px) {
		.loading,
		.error,
		.empty-state {
			min-block-size: 9rem;
			padding: 1rem;
		}

		.heatmap-frame {
			padding: 0.8rem;
		}

		.day-cell {
			inline-size: 1rem;
		}

		.legend {
			font-size: 0.78rem;
			gap: 0.5rem;
		}

		.legend-cell {
			inline-size: 0.88rem;
		}
	}
</style>
