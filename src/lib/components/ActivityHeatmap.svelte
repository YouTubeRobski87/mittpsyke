<script lang="ts">
	import { onMount } from 'svelte';

	interface HeatmapData {
		[date: string]: number;
	}

	let heatmapData: HeatmapData = {};
	let loading = true;
	let error = '';
	let weeks: Array<Array<{ date: string; count: number; dayName: string }>> = [];

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

	// Bestäm färg baserat på antal inlägg
	function getColor(count: number): string {
		if (count === 0) return '#ebedf0'; // Grå
		if (count === 1) return '#c6e48b'; // Ljusgrön
		if (count === 2) return '#7bc96f'; // Medel grön
		if (count === 3) return '#239a3b'; // Mörkgrön
		return '#196127'; // Mörkast grön
	}

	// Hämta tooltiptext
	function getTooltip(date: string, count: number): string {
		if (count === 0) return `${date}: Ingen aktivitet`;
		if (count === 1) return `${date}: 1 inlägg`;
		return `${date}: ${count} inlägg`;
	}

	onMount(async () => {
		try {
			const response = await fetch('/api/diary/heatmap');
			const json = await response.json();

			if (!response.ok) {
				error = json.error || 'Kunde inte ladda heatmap';
				return;
			}

			heatmapData = json.data || {};

			// Skapa grid för heatmap
			buildHeatmapGrid();
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

		// Hitta första dagen i veckan (måndag)
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

			currentWeek.push({
				date: dateStr,
				count,
				dayName
			});

			// Om vi har en hel vecka (7 dagar) eller vi är på sista dagen
			if (currentWeek.length === 7 || currentDate.getTime() === today.getTime()) {
				weeks.push(currentWeek);
				currentWeek = [];
			}

			currentDate.setDate(currentDate.getDate() + 1);
		}

		// Om den sista veckan är ofullständig, lägg till den ändå
		if (currentWeek.length > 0) {
			weeks.push(currentWeek);
		}
	}
</script>

<div class="heatmap-container">
	{#if loading}
		<div class="loading">Laddar aktivitetskarta...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else}
		<div class="heatmap-wrapper">
			<!-- Veckodagar labels -->
			<div class="weekdays-column">
				{#each WEEKDAYS as day}
					<div class="weekday-label">{day}</div>
				{/each}
			</div>

			<!-- Heatmap grid -->
			<div class="heatmap-grid">
				{#each weeks as week}
					<div class="week">
						{#each week as day}
							<div
								class="day-cell"
								style="background-color: {getColor(day.count)}"
								title={getTooltip(day.date, day.count)}
							/>
						{/each}
					</div>
				{/each}
			</div>
		</div>

		<!-- Legend -->
		<div class="legend">
			<span class="legend-label">Mindre</span>
			<div class="legend-cells">
				<div class="legend-cell" style="background-color: #ebedf0" />
				<div class="legend-cell" style="background-color: #c6e48b" />
				<div class="legend-cell" style="background-color: #7bc96f" />
				<div class="legend-cell" style="background-color: #239a3b" />
				<div class="legend-cell" style="background-color: #196127" />
			</div>
			<span class="legend-label">Mer</span>
		</div>
	{/if}
</div>

<style>
	.heatmap-container {
		width: 100%;
		padding: 1.5rem 0;
	}

	.loading,
	.error {
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
		cursor: pointer;
		transition: all 0.2s ease;
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	.day-cell:hover {
		transform: scale(1.15);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		z-index: 10;
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

	/* Responsiv design */
	@media (max-width: 640px) {
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
