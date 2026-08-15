<script lang="ts">
	// "Ditt mående över tid" i den inloggade dagboken.
	//
	// Datan hämtas från samma serverkällor som Framsteg använder:
	//   /api/diary/stats-timeline  humörvärden, hela historiken
	//   /api/diary/heatmap         antal inlägg per dag
	// Tidigare läste sektionen propen `entries`, som bara är den paginerade
	// listan i dagboken (20 rader initialt). Alla tal över 30 eller 90 dagar
	// blev då tysta undertal. Beräkningen ligger i $lib/diary-progress.
	//
	// Ingen AI, ingen fritextanalys, ingen ny tabell.
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import RecentPeriodChart from '$lib/components/RecentPeriodChart.svelte';
	import { DIARY_ENTRIES_CHANGED_EVENT } from '$lib/diary-events';
	import { toMoodSamples, type MoodSample } from '$lib/progress-recent-period';
	import {
		buildDiaryProgressView,
		CHART_PENDING_COPY,
		DIARY_PERIOD_OPTIONS,
		type DiaryPeriodDays
	} from '$lib/diary-progress';

	type TimelinePayload = { data?: { date?: unknown; mood?: unknown }[] | null } | null;
	type HeatmapPayload = { data?: Record<string, number> | null } | null;

	const LOAD_ERROR_COPY = 'Kunde inte hämta din översikt just nu. Dina inlägg finns kvar.';

	let selectedPeriod = $state<DiaryPeriodDays>(30);
	let samples = $state<MoodSample[]>([]);
	let heatmapData = $state<Record<string, number> | null>(null);
	let loading = $state(true);
	let loadError = $state('');

	const overview = $derived(
		buildDiaryProgressView({ samples, heatmapData, period: selectedPeriod })
	);

	// Inga registreringar alls i perioden. Då visas bara en lugn rad, inte
	// nollställda nyckeltal och en tom kurvyta.
	const isEmptyPeriod = $derived(overview.entryDays === 0 && overview.moodDays === 0);

	async function loadOverview() {
		loading = true;
		loadError = '';

		try {
			const { data } = await supabase.auth.getSession();
			const token = data.session?.access_token;
			if (!token) {
				samples = [];
				heatmapData = null;
				return;
			}

			const headers = { Authorization: `Bearer ${token}` };
			const [timelineResponse, heatmapResponse] = await Promise.all([
				fetch('/api/diary/stats-timeline', { headers }),
				fetch('/api/diary/heatmap', { headers })
			]);

			const timelinePayload = (
				timelineResponse.ok ? await timelineResponse.json() : null
			) as TimelinePayload;
			const heatmapPayload = (
				heatmapResponse.ok ? await heatmapResponse.json() : null
			) as HeatmapPayload;

			samples = toMoodSamples(timelinePayload?.data ?? null);
			heatmapData = heatmapPayload?.data ?? null;

			// Bara ett verkligt fel om ingen av källorna gick fram. Går en av dem
			// igenom visas det den kan bära, utan felruta.
			if (!timelineResponse.ok && !heatmapResponse.ok) {
				loadError = LOAD_ERROR_COPY;
			}
		} catch {
			loadError = LOAD_ERROR_COPY;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadOverview();

		// Samma signal som resten av dagboken använder efter sparning eller
		// borttagning, och den skickas även från guidad incheckning.
		const handleChange = () => void loadOverview();
		window.addEventListener(DIARY_ENTRIES_CHANGED_EVENT, handleChange);
		return () => window.removeEventListener(DIARY_ENTRIES_CHANGED_EVENT, handleChange);
	});
</script>

<section class="auth-panel mood-timeline-panel" aria-labelledby="mood-timeline-title">
	<div class="timeline-copy">
		<h2 id="mood-timeline-title">Ditt mående över tid</h2>
		<p>En enkel överblick över de dagar du själv har registrerat.</p>
	</div>

	{#if loading}
		<p class="timeline-status">Hämtar din översikt.</p>
	{:else}
		{#if loadError}
			<p class="timeline-status timeline-status--error">{loadError}</p>
		{/if}

		<RecentPeriodChart
			points={overview.points}
			period={selectedPeriod}
			onSelectPeriod={(value) => (selectedPeriod = value as DiaryPeriodDays)}
			textAlternative={overview.textAlternative}
			hasChart={overview.hasChart && !isEmptyPeriod}
			fallbackText={CHART_PENDING_COPY}
			options={DIARY_PERIOD_OPTIONS}
		>
			{#snippet beforeChart()}
				{#if !isEmptyPeriod}
					<div class="stat-row">
						<div class="stat">
							<span class="stat-value">{overview.entryDays}</span>
							<span class="stat-label">
								{overview.entryDays === 1 ? 'dag med inlägg' : 'dagar med inlägg'}
							</span>
						</div>
						<div class="stat">
							<span class="stat-value">{overview.moodDays}</span>
							<span class="stat-label">
								{overview.moodDays === 1
									? 'dag med registrerat humör'
									: 'dagar med registrerat humör'}
							</span>
						</div>
					</div>

					<h3 class="chart-heading">Humör över perioden</h3>
				{/if}
			{/snippet}
		</RecentPeriodChart>

		<p class="timeline-summary" aria-live="polite">{overview.summary}</p>

		<!-- Trendraden visas bara när båda halvorna av perioden har tillräckligt
		     med humördagar. Annars står här ingenting alls. -->
		{#if overview.trend.text}
			<p class="timeline-trend">{overview.trend.text}</p>
		{/if}
	{/if}
</section>

<style>
	.mood-timeline-panel {
		display: grid;
		gap: 0.9rem;
		min-width: 0;
	}

	.timeline-copy h2 {
		margin: 0;
		font-size: 1.12rem;
	}

	.timeline-copy p {
		margin: 0.4rem 0 0;
		font-size: 0.92rem;
		line-height: 1.6;
		color: hsl(var(--muted-foreground));
		max-width: 62ch;
	}

	.timeline-status {
		margin: 0;
		font-size: 0.9rem;
		color: hsl(var(--muted-foreground));
	}

	.timeline-status--error {
		color: hsl(var(--foreground) / 0.8);
	}

	/* Två nyckeltal räcker för frågorna "hur ofta har jag skrivit" och "hur
	   många dagar har jag satt humör". auto-fit gör att de lägger sig under
	   varandra på 320 px utan en egen media query. */
	.stat-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
		gap: 0.6rem;
	}

	.stat {
		display: grid;
		gap: 0.15rem;
		padding: 0.75rem 0.85rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-input);
		background: hsl(var(--surface-soft));
	}

	.stat-value {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 650;
		line-height: 1.1;
		color: hsl(var(--foreground));
		/* Talen ska ligga i kolumn även när de har olika antal siffror. */
		font-variant-numeric: tabular-nums;
	}

	.stat-label {
		font-size: 0.84rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
	}

	.chart-heading {
		margin: 0.15rem 0 0;
		font-size: 0.92rem;
		font-weight: 600;
		color: hsl(var(--foreground) / 0.9);
	}

	.timeline-summary {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.6;
		color: hsl(var(--foreground) / 0.88);
	}

	.timeline-trend {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.6;
		color: hsl(var(--muted-foreground));
	}
</style>
