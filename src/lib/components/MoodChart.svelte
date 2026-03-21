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

	// Returnerar en färg baserad på humörnivå: grön (högt), gult (mitten), rött (lågt)
	function moodColor(value: number, alpha = 1): string {
		if (value >= 7) return `rgba(34, 197, 94, ${alpha})`;   // grön
		if (value >= 4) return `rgba(245, 158, 11, ${alpha})`;  // gul
		return `rgba(239, 68, 68, ${alpha})`;                   // röd
	}

	function buildChart() {
		if (!ChartClass || !canvasEl || data.length < 2) {
			destroyChart();
			return;
		}

		const labels = data.map((point) => toWeekdayLabel(point.date));
		const points = data.map((point) => point.mood);

		const tickColor = readCssColor('--muted-foreground', '#888');
		const gridColor = readCssColor('--border', 'rgba(0,0,0,0.07)');
		const isDark = document.documentElement.classList.contains('dark');

		const context = canvasEl.getContext('2d');
		if (!context) return;

		// Vertikal gradient: grön (topp/högt humör) → gul (mitten) → röd (botten/lågt)
		const chartHeight = canvasEl.height || 220;
		const areaGradient = context.createLinearGradient(0, 0, 0, chartHeight);
		areaGradient.addColorStop(0,    'rgba(34, 197, 94, 0.32)');
		areaGradient.addColorStop(0.45, 'rgba(245, 158, 11, 0.18)');
		areaGradient.addColorStop(1,    'rgba(239, 68, 68, 0.04)');

		destroyChart();
		chart = new ChartClass(context, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						data: points,
						// Linjesegment färgade efter genomsnittlig humörnivå
						segment: {
							borderColor: (ctx: any) => {
								const avg = (ctx.p0.parsed.y + ctx.p1.parsed.y) / 2;
								return moodColor(avg);
							}
						},
						backgroundColor: areaGradient,
						fill: true,
						tension: 0.45,
						cubicInterpolationMode: 'monotone' as const,
						borderWidth: 2.5,
						pointRadius: 5,
						pointHoverRadius: 7,
						// Punkter färgade efter humörnivå
						pointBackgroundColor: (ctx: any) => moodColor(ctx.parsed?.y ?? 5),
						pointBorderColor: isDark ? '#1e2428' : '#ffffff',
						pointBorderWidth: 2,
						pointHoverBorderWidth: 2.5
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: { duration: 500, easing: 'easeInOutQuart' as const },
				plugins: {
					legend: { display: false },
					tooltip: {
						backgroundColor: isDark ? '#1e2428' : '#ffffff',
						borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
						borderWidth: 1,
						titleColor: isDark ? '#f0f0f0' : '#1a1a1a',
						bodyColor: isDark ? '#ccc' : '#444',
						padding: 10,
						cornerRadius: 10,
						callbacks: {
							label: (item: any) => ` Humör: ${item.parsed.y}/10`
						}
					}
				},
				scales: {
					x: {
						grid: { display: false },
						ticks: {
							color: tickColor,
							maxRotation: 0,
							autoSkipPadding: 14,
							font: { size: 12 }
						},
						border: { display: false }
					},
					y: {
						min: 1,
						max: 10,
						ticks: {
							stepSize: 3,
							color: tickColor,
							font: { size: 11 },
							callback: (value: string | number) => {
								if (value === 1)  return '1 😔';
								if (value === 4)  return '4';
								if (value === 7)  return '7';
								if (value === 10) return '10 😊';
								return '';
							}
						},
						grid: {
							color: gridColor,
							lineWidth: 0.6
						},
						border: { display: false }
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
		height: 220px;
		width: 100%;
	}

	.mood-empty {
		margin: 0;
		font-size: 0.94rem;
		line-height: 1.6;
	}
</style>
