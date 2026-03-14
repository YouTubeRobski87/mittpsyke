<script lang="ts">
	import { onMount } from 'svelte';
	import { createBrowserClient } from '@supabase/ssr';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	interface HeatmapData {
		[date: string]: number;
	}

	let heatmapData: HeatmapData = {};
	let loading = true;
	let error = '';
	let weeks: Array<Array<{ date: string; count: number; dayName: string }>> = [];
	let heatmapWrapper: HTMLDivElement;

	const MONTHS = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'Maj',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Okt',
		'Nov',
		'Dec'
	];
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

	onMount(async () => {
		try {
			const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
			const { data: { session } } = await supabase.auth.getSession();
			const token = session?.access_token;

			const fetchHeaders: HeadersInit = token
				? { Authorization: `Bearer ${token}` }
				: {};

			const response = await fetch('/api/diary/heatmap', { headers: fetchHeaders });
			const json = await response.json();

			if (!response.ok) {
				error = json.error || 'Det gick inte att visa aktivitetskartan just nu.';
				return;
			}

			heatmapData = json.data || {};
			buildHeatmapGrid();
			// Scroll to the right (today) after data loads
			setTimeout(() => {
				if (heatmapWrapper) heatmapWrapper.scrollLeft = heatmapWrapper.scrollWidth;
			}, 50);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ett fel inträffade';
		} finally {
			loading = false;
		}
	});

	function buildHeatmapGrid() {
		const today = new Date();
		const startDate = new Date(today);
		startDate.setFullYear(startDate.getFullYear() - 1);

		const currentDate = new Date(startDate);
		while (currentDate.getDay() !== 1) {
			currentDate.setDate(currentDate.getDate() - 1);
		}

		weeks = [];
		let currentWeek: Array<{ date: string; count: number; dayName: string }> = [];

		while (currentDate <= today) {
			const dateStr = currentDate.toISOString().split('T')[0];
			const count = heatmapData[dateStr] || 0;
			const dayName = WEEKDAYS[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1];

			currentWeek.push({ date: dateStr, count, dayName });

			if (currentWeek.length === 7 || currentDate.getTime() === today.getTime()) {
				weeks.push(currentWeek);
				currentWeek = [];
			}

			currentDate.setDate(currentDate.getDate() + 1);
		}

		if (currentWeek.length > 0) {
			weeks.push(currentWeek);
		}
	}
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
								style="background-color: {getColor(day.count)}"
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
	.heatmap-container { width: 100%; padding: 1.5rem 0; }
	.loading, .error { padding: 2rem; text-align: center; color: #666; font-size: 0.95rem; }
	.error { color: #d32f2f; }
	.heatmap-wrapper { display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 1rem; }
	.weekdays-column { display: flex; flex-direction: column; justify-content: flex-start; gap: 0.35rem; padding-top: 1.5rem; min-width: 3rem; }
	.weekday-label { width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #666; font-weight: 500; }
	.heatmap-grid { display: flex; gap: 0.35rem; flex: 1; }
	.week { display: flex; flex-direction: column; gap: 0.35rem; }
	.day-cell { width: 2.5rem; height: 2.5rem; border-radius: 0.25rem; cursor: pointer; transition: all 0.2s ease; border: 1px solid rgba(0,0,0,0.05); }
	.day-cell:hover { transform: scale(1.15); box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10; }
	.legend { display: flex; align-items: center; gap: 0.75rem; margin-top: 1.5rem; font-size: 0.85rem; color: #666; }
	.legend-cells { display: flex; gap: 0.35rem; }
	.legend-cell { width: 1.5rem; height: 1.5rem; border-radius: 0.25rem; border: 1px solid rgba(0,0,0,0.05); }
	.legend-label { color: #999; font-size: 0.8rem; }
	@media (max-width: 640px) {
		.heatmap-wrapper { gap: 0.3rem; }
		.weekdays-column { gap: 0.25rem; }
		.week { gap: 0.25rem; }
		.day-cell { width: 1.8rem; height: 1.8rem; }
		.weekday-label { width: 1.8rem; height: 1.8rem; font-size: 0.65rem; }
		.legend-cell { width: 1.2rem; height: 1.2rem; }
	}
</style>
