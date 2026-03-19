<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	type MoodPoint = {
		date: string;
		mood: number;
	};

	type Props = {
		data: MoodPoint[];
	};

	let { data }: Props = $props();

	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let chart: any = null;
	let ChartClass: any = null;

	const EMPTY_STATE = 'Skriv i dagboken ett par dagar så visar vi ditt humörmönster här 🌱';

	function toWeekdayLabel(dateString: string): string {
		const date = new Date(`${dateString}T00:00:00.000Z`);
		if (Number.isNaN(date.getTime())) return dateString;
		const raw = new Intl.DateTimeFormat('sv-SE', { weekday: 'short' }).format(date).replace('.', '');
		return raw.charAt(0).toUpperCase() + raw.slice(1);
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
						.map((ch) => `${ch}${ch}`)
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
		if (!ChartClass || !canvasEl || data.length < 2) {
			destroyChart();
			return;
		}

		const labels = data.map((point) => toWeekdayLabel(point.date));
		const points = data.map((point) => point.mood);

		const borderColor = readCssColor('--primary', '#0f766e');
		const tickColor = readCssColor('--muted-foreground', 'hsl(240 5% 65%)');
		const gridColor = readCssColor('--border', 'hsl(220 10% 24%)');

		const context = canvasEl.getContext('2d');
		if (!context) return;
		const gradient = context.createLinearGradient(0, 0, 0, canvasEl.height || 180);
		gradient.addColorStop(0, getAccentWithAlpha(0.22));
		gradient.addColorStop(1, getAccentWithAlpha(0.03));

		destroyChart();
		chart = new ChartClass(context, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						data: points,
						borderColor,
						backgroundColor: gradient,
						fill: true,
						tension: 0.4,
						borderWidth: 2.2,
						pointRadius: 2.6,
						pointHoverRadius: 3.4,
						pointBackgroundColor: borderColor,
						pointBorderWidth: 0
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false }
				},
				scales: {
					x: {
						grid: { display: false },
						ticks: {
							color: tickColor,
							maxRotation: 0,
							autoSkipPadding: 14
						},
						border: {
							display: false
						}
					},
					y: {
						min: 1,
						max: 10,
						ticks: {
							stepSize: 1,
							color: tickColor,
							callback: (value: string | number) => String(value)
						},
						grid: {
							color: gridColor,
							lineWidth: 0.5
						},
						border: {
							display: false
						}
					}
				}
			}
		});
	}

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

	$effect(() => {
		data;
		buildChart();
	});
</script>

{#if data.length < 2}
	<p class="mood-empty auth-muted">{EMPTY_STATE}</p>
{:else}
	<div class="chart-shell">
		<canvas bind:this={canvasEl} aria-label="Linjediagram över humör senaste sju dagarna"></canvas>
	</div>
{/if}

<style>
	.chart-shell {
		height: 180px;
		width: 100%;
	}

	.mood-empty {
		margin: 0;
		font-size: 0.94rem;
		line-height: 1.6;
	}
</style>
