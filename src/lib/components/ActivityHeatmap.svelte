<script lang="ts">
	interface HeatmapData {
		[date: string]: number;
	}

	type HeatmapCell = {
		date: string;
		count: number;
		dayName: string;
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

	let weeks: HeatmapCell[][] = [];
	let heatmapWrapper: HTMLDivElement | null = null;
	let scrolledToToday = false;

	const WEEKDAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

	function getColor(count: number): string {
		if (count === 0) return '#ebedf0';
		if (count === 1) return '#c6e48b';
		if (count === 2) return '#7bc96f';
		if (count === 3) return '#239a3b';
		return '#196127';
	}

	function getTooltip(date: string, count: number): string {
		if (count === 0) return `${date}: Ingen aktivitet`;
		if (count === 1) return `${date}: 1 inlägg`;
		return `${date}: ${count} inlägg`;
	}

	function buildHeatmapGrid(source: HeatmapData): HeatmapCell[][] {
		const today = new Date();
		const startDate = new Date(today);
		startDate.setFullYear(startDate.getFullYear() - 1);

		const currentDate = new Date(startDate);
		while (currentDate.getDay() !== 1) {
			currentDate.setDate(currentDate.getDate() - 1);
		}

		const builtWeeks: HeatmapCell[][] = [];
		let currentWeek: HeatmapCell[] = [];

		while (currentDate <= today) {
			const dateStr = currentDate.toISOString().split('T')[0];
			const count = source[dateStr] || 0;
			const dayName = WEEKDAYS[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1];

			currentWeek.push({ date: dateStr, count, dayName });

			if (currentWeek.length === 7 || currentDate.toDateString() === today.toDateString()) {
				builtWeeks.push(currentWeek);
				currentWeek = [];
			}

			currentDate.setDate(currentDate.getDate() + 1);
		}

		if (currentWeek.length > 0) {
			builtWeeks.push(currentWeek);
		}

		return builtWeeks;
	}

	$effect(() => {
		weeks = buildHeatmapGrid(data);
		scrolledToToday = false;
	});

	$effect(() => {
		if (loading || error || !heatmapWrapper || weeks.length === 0 || scrolledToToday) return;

		requestAnimationFrame(() => {
			if (!heatmapWrapper) return;
			heatmapWrapper.scrollLeft = heatmapWrapper.scrollWidth;
			scrolledToToday = true;
		});
	});
</script>

<div class="heatmap-container">
	{#if loading}
		<div class="loading">Laddar aktivitetskarta...</div>
	{:else if error}
		<div class="error">{error} Försök igen om en stund.</div>
	{:else}
		<div class="heatmap-wrapper" bind:this={heatmapWrapper}>
			<div class="weekdays-column">
				{#each WEEKDAYS as day}
					<div class="weekday-label">{day}</div>
				{/each}
			</div>
			<div class="heatmap-grid">
				{#each weeks as week}
					<div class="week">
						{#each week as day}
							<div
								class="day-cell"
								style={`background-color: ${getColor(day.count)}`}
								title={getTooltip(day.date, day.count)}
							></div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
		<div class="legend">
			<span class="legend-label">Mindre</span>
			<div class="legend-cells">
				<div class="legend-cell" style="background-color: #ebedf0"></div>
				<div class="legend-cell" style="background-color: #c6e48b"></div>
				<div class="legend-cell" style="background-color: #7bc96f"></div>
				<div class="legend-cell" style="background-color: #239a3b"></div>
				<div class="legend-cell" style="background-color: #196127"></div>
			</div>
			<span class="legend-label">Mer</span>
		</div>
	{/if}
</div>

<style>
	.heatmap-container {
		width: 100%;
		padding: 1.5rem 0;
		min-block-size: clamp(18rem, 40vw, 24rem);
	}

	.loading,
	.error {
		min-block-size: 14rem;
		display: grid;
		place-items: center;
		padding: 2rem;
		text-align: center;
		color: #666;
		font-size: 0.95rem;
	}

	.error {
		color: #d32f2f;
	}

	.heatmap-wrapper {
		display: flex;
		gap: 0.75rem;
		overflow-x: auto;
		padding-bottom: 1rem;
		overflow-anchor: none;
	}

	.weekdays-column {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		gap: 0.35rem;
		padding-top: 1.5rem;
		min-width: 3rem;
	}

	.weekday-label {
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		color: #666;
		font-weight: 500;
	}

	.heatmap-grid {
		display: flex;
		gap: 0.35rem;
		flex: 1;
	}

	.week {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.day-cell {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.25rem;
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1.5rem;
		font-size: 0.85rem;
		color: #666;
	}

	.legend-cells {
		display: flex;
		gap: 0.35rem;
	}

	.legend-cell {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.25rem;
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	.legend-label {
		color: #999;
		font-size: 0.8rem;
	}

	@media (max-width: 640px) {
		.heatmap-container {
			min-block-size: 15rem;
		}

		.heatmap-wrapper {
			gap: 0.3rem;
		}

		.weekdays-column {
			gap: 0.25rem;
		}

		.week {
			gap: 0.25rem;
		}

		.day-cell {
			width: 1.8rem;
			height: 1.8rem;
		}

		.weekday-label {
			width: 1.8rem;
			height: 1.8rem;
			font-size: 0.65rem;
		}

		.legend-cell {
			width: 1.2rem;
			height: 1.2rem;
		}
	}
</style>
