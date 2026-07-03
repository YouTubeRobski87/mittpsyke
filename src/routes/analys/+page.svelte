<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import MoodChart from '$lib/components/MoodChart.svelte';
	import ActivityHeatmap from '$lib/components/ActivityHeatmap.svelte';
	import DiaryNarrativeInsights, {
		type DiaryNarrativeInsightViewModel
	} from '$lib/components/DiaryNarrativeInsights.svelte';
	import { supabase } from '$lib/supabase';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent,
		hasSensitiveConsent
	} from '$lib/consent';

	type MoodPoint = { date: string; mood: number };
	type TimelinePoint = { date: string; mood: string | number };
	type StreakData = {
		currentStreak: number;
		longestStreak: number;
		lastEntryDaysAgo: number;
	};
	type InsightsResponse = {
		narrative?: DiaryNarrativeInsightViewModel;
	};

	let moodData = $state<MoodPoint[]>([]);
	let heatmapData = $state<Record<string, number>>({});
	let totalEntries = $state(0);
	let streak = $state<StreakData | null>(null);
	let narrative = $state<DiaryNarrativeInsightViewModel | null>(null);
	let loading = $state(true);
	let error = $state('');
	let hasConsent = $state(browser ? hasSensitiveConsent() : false);

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
			value: totalEntries > 0 ? String(totalEntries) : '–',
			sub: 'sedan du började',
			points: [2, 4, 6, 8, 10, 12, totalEntries]
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

	function parseMood(value: string | number): number | null {
		if (typeof value === 'number' && Number.isFinite(value)) return value;
		const parsed = Number.parseFloat(String(value).replace(',', '.'));
		return Number.isFinite(parsed) ? parsed : null;
	}

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
			const insightHeaders = {
				...headers,
				[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
			};

			const [insightsRes, timelineRes, heatmapRes, streakRes] = await Promise.all([
				hasConsent ? fetch('/api/diary/insights', { headers: insightHeaders }) : Promise.resolve(null),
				fetch('/api/diary/stats-timeline', { headers }),
				fetch('/api/diary/heatmap', { headers }),
				fetch('/api/diary/streak', { headers })
			]);

			if (insightsRes?.ok) {
				const payload = (await insightsRes.json()) as InsightsResponse;
				narrative = payload.narrative ?? null;
			} else if (insightsRes && insightsRes.status !== 403) {
				const payload = (await insightsRes.json().catch(() => ({}))) as { error?: string };
				error = payload.error ?? 'Kunde inte ladda AI-analysen just nu.';
			}

			if (timelineRes.ok) {
				const payload = (await timelineRes.json()) as { data?: TimelinePoint[]; points?: TimelinePoint[] };
				moodData = (payload.data ?? payload.points ?? [])
					.map((point) => {
						const mood = parseMood(point.mood);
						return mood === null ? null : { date: point.date, mood };
					})
					.filter((point): point is MoodPoint => point !== null);
			}
			if (heatmapRes.ok) {
				const payload = (await heatmapRes.json()) as { data?: Record<string, number>; totalEntries?: number };
				heatmapData = payload.data ?? {};
				totalEntries = payload.totalEntries ?? Object.values(payload.data ?? {}).reduce((a, b) => a + b, 0);
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

	function acceptConsent() {
		grantSensitiveConsent();
		hasConsent = true;
		void fetchAll();
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
					<div class="kicker">AI-läst dagbok</div>
					<h1>Analys</h1>
					<p class="lead">En lugn genomgång av det som återkommer, förändras och växer fram i dina reflektioner.</p>
				</div>
			</header>

			{#if loading}
				<div class="loading-grid">
					{#each [0, 1, 2] as _}
						<div class="skeleton-card"></div>
					{/each}
				</div>
			{:else if !hasConsent}
				<section class="consent-card">
					<h2>AI-analys kräver ditt samtycke</h2>
					<p>För att kunna läsa dina dagboksrader och leta efter mönster behöver MittPsyke använda den känsliga informationen i din dagbok för just den här analysen.</p>
					<button class="btn btn-primary" onclick={acceptConsent}>Jag godkänner – visa analys</button>
				</section>
			{:else if error}
				<div class="error-card">{error}</div>
			{:else}
				<DiaryNarrativeInsights {narrative} />

				<section class="stats-section" aria-labelledby="statistics-title">
					<div class="section-heading">
						<div class="section-title" id="statistics-title">Statistik</div>
						<p>De gamla mätpunkterna finns kvar här, som stöd under AI-analysen.</p>
					</div>

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
				</section>
			{/if}
		</main>
	</div>
</div>

<style>
	.mp-dashboard {
		--mp-lila: #6f9f70;
		--mp-lila-2: #2f6f46;
		--mp-card: rgba(255, 255, 252, 0.84);
		--mp-card-border: rgba(104, 132, 92, 0.16);
		--mp-text: #20251f;
		--mp-text-dim: #687163;
		--mp-radius: 24px;
		--mp-surface: #fbfaf5;
		--mp-shadow: 0 18px 50px rgba(58, 75, 48, 0.09);
		--mp-shadow-soft: 0 8px 26px rgba(58, 75, 48, 0.07);

		color: var(--mp-text);
		min-height: 100vh;
		padding: 34px;
		background:
			radial-gradient(900px 520px at 84% -10%, rgba(222, 238, 206, 0.84), transparent 62%),
			radial-gradient(760px 460px at 8% 110%, rgba(247, 226, 190, 0.46), transparent 58%),
			linear-gradient(160deg, var(--mp-surface), #f7f4ec 58%, #eef4e8);
	}

	.shell {
		max-width: 1400px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: minmax(232px, 250px) minmax(0, 1fr);
		gap: clamp(30px, 2.6vw, 36px);
	}

	.main {
		display: flex;
		flex-direction: column;
		gap: 28px;
	}

	.page-header,
	.consent-card,
	.chart-card,
	.error-card {
		background: var(--mp-card);
		border: 1px solid var(--mp-card-border);
		border-radius: var(--mp-radius);
		box-shadow: var(--mp-shadow-soft);
		backdrop-filter: blur(18px);
	}

	.page-header {
		padding: 30px 32px;
	}

	.kicker,
	.section-title {
		font-size: 0.78rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--mp-lila-2);
		font-weight: 800;
	}

	.kicker {
		margin-bottom: 8px;
	}

	.page-header h1 {
		font-size: clamp(2rem, 3vw, 2.7rem);
		line-height: 1.05;
		margin: 0 0 10px;
		font-weight: 800;
	}

	.lead,
	.section-heading p {
		font-size: 0.98rem;
		color: var(--mp-text-dim);
		line-height: 1.65;
		margin: 0;
	}

	.consent-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
		padding: clamp(1.5rem, 4vw, 2.5rem);
	}

	.consent-card h2 {
		margin: 0;
		font-size: 1.35rem;
	}

	.consent-card p {
		margin: 0;
		max-width: 48rem;
		color: var(--mp-text-dim);
		line-height: 1.7;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: 999px;
		padding: 0.8rem 1.2rem;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.btn-primary {
		background: linear-gradient(135deg, var(--mp-lila-2), #72a76d);
		color: #fff;
		box-shadow: 0 10px 24px rgba(47, 111, 70, 0.18);
	}

	.stats-section {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-top: 8px;
	}

	.section-heading {
		display: grid;
		gap: 6px;
		padding: 0 4px;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
	}

	.chart-card {
		padding: 26px;
	}

	.loading-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 18px;
	}

	.skeleton-card {
		height: 180px;
		border-radius: var(--mp-radius);
		background: linear-gradient(90deg, rgba(222, 232, 213, 0.5), rgba(255, 255, 255, 0.78), rgba(222, 232, 213, 0.5));
		background-size: 200% 100%;
		animation: shimmer 1.3s ease-in-out infinite;
	}

	@keyframes shimmer {
		from { background-position: 100% 0; }
		to { background-position: -100% 0; }
	}

	.error-card {
		padding: 20px;
		color: #8a5f17;
		font-size: 0.9rem;
	}

	.mp-dashboard :global(.mp-sidebar),
	.mp-dashboard :global(.stat) {
		background: rgba(255, 255, 252, 0.74);
		border-color: var(--mp-card-border);
		box-shadow: var(--mp-shadow-soft);
		backdrop-filter: blur(18px);
	}

	.mp-dashboard :global(.stat) {
		border-radius: var(--mp-radius);
	}

	@media (max-width: 880px) {
		.mp-dashboard {
			padding: 18px;
		}

		.shell,
		.stats,
		.loading-grid {
			grid-template-columns: 1fr;
		}

		.main {
			gap: 24px;
		}

		.page-header {
			padding: 26px;
		}
	}
</style>
