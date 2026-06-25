<script lang="ts">
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import MoodChart from '$lib/components/MoodChart.svelte';
	import ActivityHeatmap from '$lib/components/ActivityHeatmap.svelte';
	import { supabase } from '$lib/supabase';

	type MoodPoint = { date: string; mood: number };
	type StreakData = {
		currentStreak: number;
		longestStreak: number;
		totalEntries: number;
		lastEntryDaysAgo: number;
	};

	let moodData = $state<MoodPoint[]>([]);
	let heatmapData = $state<Record<string, number>>({});
	let streak = $state<StreakData | null>(null);
	let loading = $state(true);
	let error = $state('');

	const stats = $derived([
		{
			label: 'Aktiv streak',
			value: streak ? `${streak.currentStreak} dag${streak.currentStreak === 1 ? '' : 'ar'}` : '–',
			sub: streak ? `Längsta: ${streak.longestStreak} dagar` : '',
			points: streak
				? Array.from({ length: 7 }, (_, i) => Math.max(0, streak!.currentStreak - (6 - i)))
				: [0, 0, 0, 0, 0, 0, 0]
		},
		{
			label: 'Totalt antal inlägg',
			value: streak ? String(streak.totalEntries) : '–',
			sub: 'sedan du började',
			points: [2, 4, 6, 8, 10, 12, streak?.totalEntries ?? 0]
		},
		{
			label: 'Senaste inlägg',
			value:
				streak?.lastEntryDaysAgo === 0
					? 'Idag'
					: streak?.lastEntryDaysAgo === 1
						? 'Igår'
						: streak?.lastEntryDaysAgo != null
							? `${streak.lastEntryDaysAgo} d sedan`
							: '–',
			sub: '',
			points: [8, 6, 9, 5, 7, 4, streak?.lastEntryDaysAgo != null ? Math.max(1, 10 - streak.lastEntryDaysAgo) : 0]
		}
	]);

	async function fetchAll() {
		loading = true;
		error = '';
		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();
			if (!session) return;

			const token = session.access_token;
			const headers = { Authorization: `Bearer ${token}` };

			const [timelineRes, heatmapRes, streakRes] = await Promise.all([
				fetch('/api/diary/stats-timeline', { headers }),
				fetch('/api/diary/heatmap', { headers }),
				fetch('/api/diary/streak', { headers })
			]);

			if (timelineRes.ok) {
				const payload = (await timelineRes.json()) as { points?: MoodPoint[] };
				moodData = payload.points ?? [];
			}
			if (heatmapRes.ok) {
				const payload = (await heatmapRes.json()) as { data?: Record<string, number> };
				heatmapData = payload.data ?? {};
			}
			if (streakRes.ok) {
				streak = (await streakRes.json()) as StreakData;
			}
		} catch {
			error = 'Kunde inte ladda analysdata just nu.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void fetchAll();
	});
</script>

<div class="mp-dashboard">
	<div class="shell">
		<Sidebar active="analys" />

		<main class="main">
			<header class="page-header">
				<div>
					<div class="kicker">Statistik & mönster</div>
					<h1>Analys</h1>
					<p class="lead">Se hur ditt mående och din aktivitet förändras över tid.</p>
				</div>
			</header>

			{#if loading}
				<div class="loading-row">
					{#each [0, 1, 2] as _}
						<div class="skeleton-card"></div>
					{/each}
				</div>
			{:else if error}
				<div class="error-card">{error}</div>
			{:else}
				<section class="stats">
					{#each stats as s}
						<StatCard label={s.label} value={s.value} sub={s.sub} points={s.points} />
					{/each}
				</section>

				<section class="chart-card">
					<div class="section-title">Humörkurva</div>
					<MoodChart data={moodData} />
				</section>

				<section class="chart-card">
					<div class="section-title">Aktivitetskarta</div>
					<ActivityHeatmap data={heatmapData} />
				</section>
			{/if}
		</main>
	</div>
</div>

<style>
	.mp-dashboard {
		--mp-lila: #a882ff;
		--mp-lila-2: #7c5cff;
		--mp-card: rgba(255, 255, 255, 0.04);
		--mp-card-border: rgba(168, 130, 255, 0.14);
		--mp-text: #e8e6f0;
		--mp-text-dim: #9a98ad;
		--mp-radius: 18px;

		color: var(--mp-text);
		min-height: 100vh;
		padding: 28px;
		background:
			radial-gradient(1200px 600px at 80% -10%, rgba(124, 92, 255, 0.18), transparent 60%),
			radial-gradient(900px 500px at 10% 110%, rgba(168, 130, 255, 0.14), transparent 55%),
			linear-gradient(160deg, #0a0a14, #11101f 60%, #0d0b1a);
	}

	.shell {
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 248px 1fr;
		gap: 24px;
	}
	.main {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.page-header {
		background: var(--mp-card);
		border: 1px solid var(--mp-card-border);
		border-radius: var(--mp-radius);
		padding: 26px 28px;
		backdrop-filter: blur(14px);
	}
	.kicker {
		font-size: 0.76rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--mp-lila);
		margin-bottom: 4px;
	}
	.page-header h1 {
		font-size: 1.7rem;
		margin: 0 0 4px;
		font-weight: 700;
	}
	.lead {
		font-size: 0.88rem;
		color: var(--mp-text-dim);
		margin: 0;
	}

	.section-title {
		font-size: 0.78rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--mp-text-dim);
		margin-bottom: 16px;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 18px;
	}

	.chart-card {
		background: var(--mp-card);
		border: 1px solid var(--mp-card-border);
		border-radius: var(--mp-radius);
		padding: 24px;
		backdrop-filter: blur(14px);
	}

	.loading-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 18px;
	}
	.skeleton-card {
		height: 120px;
		border-radius: var(--mp-radius);
		background: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0.04),
			rgba(255, 255, 255, 0.08),
			rgba(255, 255, 255, 0.04)
		);
		background-size: 200% 100%;
		animation: shimmer 1.3s ease-in-out infinite;
	}
	@keyframes shimmer {
		from { background-position: 100% 0; }
		to { background-position: -100% 0; }
	}

	.error-card {
		background: var(--mp-card);
		border: 1px solid rgba(255, 100, 100, 0.2);
		border-radius: var(--mp-radius);
		padding: 20px;
		color: hsl(39 92% 82%);
		font-size: 0.9rem;
	}

	@media (max-width: 880px) {
		.shell { grid-template-columns: 1fr; }
		.stats { grid-template-columns: 1fr; }
		.loading-row { grid-template-columns: 1fr; }
	}
</style>
