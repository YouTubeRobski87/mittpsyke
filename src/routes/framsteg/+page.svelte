<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount } from 'svelte';
	import { THEMES, THEME_STORAGE_KEY, getCachedTheme } from '$lib/theme';
	import { browser } from '$app/environment';
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import GrowthGarden from '$lib/components/GrowthGarden.svelte';
	import type { ProgressCompanionSelection } from '$lib/progressCompanion';
	import { trackMilestoneReachedOnce, trackStreakDayReachedOnce } from '$lib/analytics';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent,
		hasSensitiveConsent
	} from '$lib/consent';
	import { supabase } from '$lib/supabase';
	import { Leaf, TrendingUp, Lightbulb, Calendar, Heart } from 'lucide-svelte';

	interface StreakData {
		currentStreak: number;
		longestStreak: number;
		lastEntryDate: string | null;
		lastEntryDaysAgo: number;
	}

	interface Milestone {
		id: string;
		category: 'firstSteps' | 'diary' | 'consistency' | 'time' | 'writingDepth';
		metric:
			| 'totalEntries'
			| 'longestStreak'
			| 'daysSinceJoined'
			| 'maxWordsInEntry'
			| 'maxWordsInDay'
			| 'totalWords';
		threshold: number;
		title?: string;
		description?: string;
		text: string;
		achieved: boolean;
		emoji: string;
		current: number;
		remaining: number;
		progressPercent: number;
		unit: 'inlägg' | 'dagar' | 'ord';
	}

	interface MilestoneSection {
		id: 'firstSteps' | 'diary' | 'consistency' | 'time' | 'writingDepth';
		title: string;
		milestones: Milestone[];
	}

	interface MilestonesResponse {
		achieved: Milestone[];
		sections: MilestoneSection[];
		nextMilestone: Milestone | null;
		totalEntries: number;
	}

	interface InsightItem {
		type: string;
		title: string;
		description: string;
		icon: string;
	}

	interface InsightDay {
		day: string;
		average: number;
		count: number;
	}

	interface InsightsResponse {
		insights: InsightItem[];
		bestDay: InsightDay | null;
		worstDay: InsightDay | null;
		emotionDistribution: Record<string, number>;
		aiSummary: string | null;
	}

	interface HeatmapResponse {
		data?: Record<string, number>;
		error?: string;
		totalEntries?: number;
	}

	interface ProgressCachePayload {
		streak: StreakData | null;
		milestones: MilestonesResponse | null;
		heatmap: HeatmapResponse | null;
	}

	interface PageData {
		streak: StreakData | null;
		milestones: MilestonesResponse | null;
		weeklyEntries: number;
		entryCount: number;
		activeDays: number;
		growthScore: number;
		growthLevel: number;
		heatmapData?: Record<string, number>;
		heatmapError?: string;
		profileTheme?: keyof typeof THEMES | null;
		progressCompanion?: ProgressCompanionSelection | string | null;
	}

	// ── Theme ──

	let { data } = $props<{ data: PageData }>();
	let profileTheme = $state<keyof typeof THEMES>(getCachedTheme());
	const currentTheme = $derived(THEMES[profileTheme] ?? THEMES.neutral);
	const themeStyle = $derived(
		`--theme-accent: ${currentTheme.accent}; --theme-bg: ${currentTheme.bg};`
	);

	$effect(() => {
		const nextProfileTheme = data.profileTheme;
		if (nextProfileTheme && THEMES[nextProfileTheme]) {
			profileTheme = nextProfileTheme;
		}
	});

	// ── Props + State ──
	let streakData = $state<StreakData | null>({
		currentStreak: 0,
		longestStreak: 0,
		lastEntryDate: null,
		lastEntryDaysAgo: 0
	});
	let milestonesData = $state<MilestonesResponse | null>({
		achieved: [],
		sections: [],
		nextMilestone: null,
		totalEntries: 0
	});
	let weeklyEntries = $state(0);
	let entryCount = $state(0);
	let activeDays = $state(0);
	let growthScore = $state(0);
	let growthLevel = $state(0);
	let heatmapData = $state<Record<string, number>>({});
	let heatmapError = $state('');
	let progressLoading = $state(false);
	let progressLoaded = $state(false);
	let progressError = $state('');
	let insightsData = $state<InsightsResponse | null>(null);
	let insightsLoading = $state(false);
	let insightsError = $state('');
	let hasSensitiveDataConsent = $state(browser ? hasSensitiveConsent() : false);
	let insightsVisible = $state(false);
	let heatmapVisible = $state(false);
	let insightsCardEl = $state<HTMLElement | null>(null);
	let heatmapCardEl = $state<HTMLElement | null>(null);
	let loading = $derived(progressLoading && !progressLoaded);
	let error = $derived(progressError);
	let hasInsightsContent = $derived(
		Boolean(
			insightsData &&
				(insightsData.aiSummary ||
					insightsData.insights.length > 0 ||
					insightsData.bestDay ||
					insightsData.worstDay)
		)
	);

	// ── Weekly summary copy (no AI, just warm text) ──
	const weeklySummaryText = $derived.by(() => {
		if (weeklyEntries === 0) return 'Du har inte checkat in den här veckan än — och det är helt okej.';
		if (weeklyEntries === 1) return 'Du har checkat in en gång den här veckan. Det räcker fint.';
		if (weeklyEntries === 2) return 'Två incheckningar den här veckan — du tar hand om dig.';
		if (weeklyEntries <= 4) return `${weeklyEntries} incheckningar den här veckan. Du fortsätter komma tillbaka, i din takt.`;
		return `${weeklyEntries} incheckningar den här veckan — du har verkligen tagit dig tid för dig själv.`;
	});

	const weeklyEncouragement = $derived.by(() => {
		if (weeklyEntries >= 1) return 'Varje rad räknas, även när den är kort.';
		return 'Det finns inget som måste vara perfekt för att räknas.';
	});

	const latestEntryText = $derived.by(() => {
		if (!streakData?.lastEntryDate) return 'Inte ännu';
		if (streakData.lastEntryDaysAgo <= 0) return 'Idag';
		if (streakData.lastEntryDaysAgo === 1) return 'Igår';
		return `${streakData.lastEntryDaysAgo} dagar sedan`;
	});

	function softMilestoneTitle(milestone: Milestone) {
		if (!milestone.achieved) return 'Får växa fram senare';

		if (milestone.metric === 'longestStreak') return 'Du har återvänt hit';
		if (milestone.metric === 'daysSinceJoined') return 'Platsen finns kvar över tid';
		if (milestone.metric === 'maxWordsInEntry' || milestone.metric === 'maxWordsInDay') {
			return 'En tanke fick ta mer plats';
		}
		if (milestone.metric === 'totalWords') return 'Många ord har fått landa';
		if (milestone.metric === 'totalEntries' && milestone.threshold <= 10) return 'Ett varsamt avtryck';
		if (milestone.metric === 'totalEntries' && milestone.threshold < 100) return 'Fler stunder fick plats';
		return 'Din trädgård har vuxit lite till';
	}

	function softMilestoneDescription(milestone: Milestone) {
		if (!milestone.achieved) {
			return 'Det här får vila tills det blir en naturlig del av din plats.';
		}

		const source = milestone.description ?? milestone.text;
		const softened = source
			.replace(/^\d+\s+(inlägg|dagar i rad|dagar|ord)\.?\s*/i, '')
			.replace(/^Över\s+\d+\s+ord\s+i\s+ett\s+inlägg\.?\s*/i, '')
			.replace(/^\d+\s+ord\s+på\s+en\s+dag\.?\s*/i, '')
			.replace(/^\d+\s+skrivna\s+ord\.?\s*/i, '')
			.trim();

		return softened || 'Din trädgård har vuxit lite till.';
	}

	function nextMilestoneCopy(milestone: Milestone) {
		const softened = softMilestoneDescription({ ...milestone, achieved: true });
		return softened === milestone.text ? 'Din trädgård kan växa lite till när du återvänder.' : softened;
	}

	// ── Reflection prompts (rotate based on day) ──
	const reflections = [
		'Vad har hjälpt dig mest den senaste tiden?',
		'Finns det något du vill ta med dig in i nästa vecka?',
		'Vad har du gjort för dig själv idag?',
		'Finns det något du vill släppa taget om?',
		'Vad gör dig lugn just nu?',
		'Hur vill du att kommande vecka ska kännas?',
		'Vad är du tacksam för just nu?'
	];
	const todayReflection = reflections[new Date().getDay()];

	function getGrowthLevel(entryCountValue: number) {
		let level = 0;
		if (entryCountValue >= 1) level = 1;
		if (entryCountValue >= 6) level = 2;
		if (entryCountValue >= 16) level = 3;
		if (entryCountValue >= 31) level = 4;
		return level;
	}

	function startOfWeekKey() {
		const now = new Date();
		const dayOfWeek = now.getDay();
		const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
		const monday = new Date(now);
		monday.setDate(now.getDate() + mondayOffset);
		monday.setHours(0, 0, 0, 0);
		return monday.toISOString().split('T')[0];
	}

	function applyProgressPayload(payload: ProgressCachePayload) {
		streakData = payload.streak;
		milestonesData = payload.milestones;
		heatmapData = payload.heatmap?.data ?? {};
		heatmapError = payload.heatmap?.error ?? '';

		const weekStart = startOfWeekKey();
		weeklyEntries = Object.entries(heatmapData).reduce(
			(sum, [day, count]) => (day >= weekStart ? sum + count : sum),
			0
		);
		entryCount = milestonesData?.totalEntries ?? payload.heatmap?.totalEntries ?? 0;
		activeDays = Object.keys(heatmapData).length;
		growthScore = entryCount + activeDays * 3;
		growthLevel = getGrowthLevel(entryCount);
		progressLoaded = true;

		if (streakData?.currentStreak) {
			trackStreakDayReachedOnce(streakData.currentStreak);
		}
		for (const milestone of milestonesData?.achieved ?? []) {
			trackMilestoneReachedOnce(milestone.title ?? milestone.text);
		}
	}

	async function loadProgressData() {
		if (progressLoading || progressLoaded) return;

		progressLoading = true;
		progressError = '';

		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();

			if (!session?.access_token) {
				progressError = 'Du behöver vara inloggad för att se framsteg.';
				return;
			}

			const headers = { Authorization: `Bearer ${session.access_token}` };
			const [streakRes, milestonesRes, heatmapRes] = await Promise.all([
				fetch('/api/diary/streak', { headers }),
				fetch('/api/diary/milestones', { headers }),
				fetch('/api/diary/heatmap', { headers })
			]);

			const [streakPayload, milestonesPayload, heatmapPayload] = await Promise.all([
				streakRes.ok ? streakRes.json() : null,
				milestonesRes.ok ? milestonesRes.json() : null,
				heatmapRes.ok ? heatmapRes.json() : null
			]);

			const payload = {
				streak: streakPayload as StreakData | null,
				milestones: milestonesPayload as MilestonesResponse | null,
				heatmap: heatmapPayload as HeatmapResponse | null
			};
			applyProgressPayload(payload);
		} catch {
			progressError = 'Kunde inte ladda framsteg just nu.';
		} finally {
			progressLoading = false;
		}
	}

	function maybeLoadInsights() {
		if (
			!browser ||
			!hasSensitiveDataConsent ||
			!insightsVisible ||
			insightsLoading ||
			insightsData
		) {
			return;
		}

		void loadInsights();
	}

	onMount(() => {
		void loadProgressData();
		hasSensitiveDataConsent = hasSensitiveConsent();
		if (browser) {
			localStorage.setItem(THEME_STORAGE_KEY, profileTheme);
		}
		insightsVisible = true;
		heatmapVisible = true;
		maybeLoadInsights();

		if (typeof IntersectionObserver === 'undefined') {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;

					if (entry.target === insightsCardEl) {
						insightsVisible = true;
						maybeLoadInsights();
						observer.unobserve(entry.target);
					}

					if (entry.target === heatmapCardEl) {
						heatmapVisible = true;
						observer.unobserve(entry.target);
					}
				}
			},
			{ rootMargin: '180px 0px' }
		);

		if (insightsCardEl) observer.observe(insightsCardEl);
		if (heatmapCardEl) observer.observe(heatmapCardEl);

		return () => {
			observer.disconnect();
		};
	});

	$effect(() => {
		if (hasSensitiveDataConsent && insightsVisible) {
			maybeLoadInsights();
		}
	});

	async function loadInsights() {
		if (insightsLoading) return;

		insightsLoading = true;
		insightsError = '';

		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();

			if (!session?.access_token) {
				insightsError = 'Du behöver vara inloggad för att se AI-insikter.';
				insightsData = null;
				return;
			}

			const insightsFetchController = new AbortController();
			const insightsFetchTimeout = setTimeout(() => {
				insightsFetchController.abort();
			}, 12000);

			const response = await fetch('/api/diary/insights', {
				headers: {
					Authorization: `Bearer ${session.access_token}`,
					[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
				},
				signal: insightsFetchController.signal
			}).finally(() => {
				clearTimeout(insightsFetchTimeout);
			});

			const result = (await response.json().catch(() => null)) as
				| InsightsResponse
				| { error?: string }
				| null;

			if (!response.ok || !result || !('insights' in result)) {
				insightsError =
					result && 'error' in result && typeof result.error === 'string'
						? result.error
						: 'Kunde inte ladda AI-insikter just nu.';
				insightsData = null;
				return;
			}

			insightsData = result;
		} catch {
			insightsError = 'Kunde inte ladda AI-insikter just nu.';
			insightsData = null;
		} finally {
			insightsLoading = false;
		}
	}

	function acceptSensitiveDataConsent() {
		try {
			grantSensitiveConsent();
		} catch (error) {
			console.error('Could not persist sensitive consent in localStorage:', error);
		}
		hasSensitiveDataConsent = true;
		if (insightsVisible) {
			void loadInsights();
			return;
		}
		maybeLoadInsights();
	}

</script>

<SEO canonical="https://www.mittpsyke.se/framsteg" />

<main class="auth-page" style={themeStyle}>
	<PortalSubnav
		active="framsteg"
		title="Framsteg"
		description="En lugn överblick över din resa, i din egen takt."
	/>

	<div class="auth-shell">
		<div class="journey-container">
			{#if loading}
				<section class="auth-panel loading-state">Laddar din sida med framsteg...</section>
			{:else if error}
				<section class="auth-panel auth-panel-error error-state">
					<p>{error}</p>
					<small>Försök att ladda sidan igen</small>
				</section>
			{:else}

		<GrowthGarden
			growthScore={growthScore}
			growthLevel={growthLevel}
			entryCount={entryCount}
			activeDays={activeDays}
			lastEntryDaysAgo={streakData?.lastEntryDaysAgo ?? null}
			progressCompanion={data.progressCompanion ?? null}
		/>

		<!-- ── Aktivitetskarta ── -->
		<section class="card heatmap-card" bind:this={heatmapCardEl}>
			<div class="card-header">
				<div class="icon-badge heat"><TrendingUp size={24} /></div>
				<h2>Din aktivitetskarta</h2>
			</div>
			<p class="heatmap-description">Varje ruta motsvarar en dag. Mörkare färg betyder fler inlägg.</p>
			{#if heatmapVisible}
				{#await import('$lib/components/ActivityHeatmap.svelte')}
					<div class="card-placeholder card-placeholder--heatmap" aria-hidden="true"></div>
				{:then module}
					<module.default data={heatmapData} error={heatmapError} />
				{:catch}
					<p class="heatmap-description">Aktivitetskartan kunde inte laddas just nu.</p>
				{/await}
			{:else}
				<div class="card-placeholder card-placeholder--heatmap" aria-hidden="true"></div>
			{/if}
		</section>

		<!-- ── AI-insikter ── -->
		<section class="card insights-card" bind:this={insightsCardEl}>
			<div class="card-header">
				<div class="icon-badge insight"><Lightbulb size={24} /></div>
				<h2>Dina AI-insikter</h2>
			</div>

			{#if !hasSensitiveDataConsent}
				<ConsentGate
					title="Samtycke innan AI-insikter"
					dataLabel="Din dagbok och dina mönster"
					serviceLabel="AI- och tredjepartstjänster"
					onAccept={acceptSensitiveDataConsent}
				/>
			{:else if !insightsVisible}
				<div class="card-placeholder card-placeholder--insights" aria-hidden="true"></div>
			{:else if insightsLoading}
				<p class="heatmap-description">Laddar AI-insikter...</p>
			{:else if insightsError}
				<p class="heatmap-description">{insightsError}</p>
			{:else if hasInsightsContent && insightsData}
				{#if insightsData.aiSummary}
					<div class="summary-box">
						<p>{insightsData.aiSummary}</p>
					</div>
				{/if}

				{#if insightsData.bestDay || insightsData.worstDay}
					<div class="insights-grid">
						{#if insightsData.bestDay}
							<div class="insight-item best">
								<div class="insight-content">
									<h3>Mår bäst på</h3>
									<p class="day-name">{insightsData.bestDay.day}</p>
									<small>Genomsnitt: {insightsData.bestDay.average}/10</small>
								</div>
							</div>
						{/if}
						{#if insightsData.worstDay}
							<div class="insight-item worst">
								<div class="insight-content">
									<h3>Svårare på</h3>
									<p class="day-name">{insightsData.worstDay.day}</p>
									<small>Genomsnitt: {insightsData.worstDay.average}/10</small>
								</div>
							</div>
						{/if}
					</div>
				{/if}

				{#if insightsData.insights.length > 0}
					<ul class="patterns-list">
						{#each insightsData.insights as insight}
							<li>
								<span class="pattern-text">{insight.title}: {insight.description}</span>
							</li>
						{/each}
					</ul>
				{/if}
			{:else}
				<p class="heatmap-description">Det finns inte tillräckligt med data för AI-insikter ännu.</p>
			{/if}
		</section>

		<!-- ── Lugn dataöverblick ── -->
		{#if streakData || milestonesData}
			<section class="card overview-card">
				<h2 class="overview-heading">Lugn överblick</h2>
				<div class="overview-grid">
					{#if milestonesData}
						<div class="overview-item">
							<div class="overview-number">{milestonesData.totalEntries}</div>
							<div class="overview-label">Texter skrivna</div>
						</div>
					{/if}
					<div class="overview-item">
						<div class="overview-number">{activeDays}</div>
						<div class="overview-label">Dagar med avtryck</div>
					</div>
					{#if streakData}
						<div class="overview-item">
							<div class="overview-number overview-number--text">{latestEntryText}</div>
							<div class="overview-label">Senaste gången du skrev</div>
						</div>
					{/if}
				</div>
			</section>
		{/if}

		<!-- ── Mjuk veckosammanfattning ── -->
		<section class="card summary-card">
			<div class="card-header">
				<div class="icon-badge week"><Heart size={24} /></div>
				<h2>Den här veckan</h2>
			</div>
			<p class="summary-text">{weeklySummaryText}</p>
			<p class="encouragement">{weeklyEncouragement}</p>
		</section>

		<!-- ── Milstolpar ── -->
		{#if milestonesData}
			<section class="card milestones-card">
				<div class="card-header">
					<div class="icon-badge milestone-leaf"><Leaf size={24} /></div>
					<div>
						<h2>Små tecken på omsorg</h2>
						<p class="card-intro">Små tecken på att du har återvänt, reflekterat och gett dig själv plats över tid.</p>
					</div>
				</div>
				{#each milestonesData.sections as section}
					<div class="milestones-section">
						<h3 class="milestones-section-title">{section.title}</h3>
						<div class="milestones-grid">
							{#each section.milestones as milestone}
								<div class="milestone {milestone.achieved ? 'achieved' : 'locked'}">
									<div class="milestone-mark" aria-hidden="true"></div>
									<div class="milestone-copy">
										<h4>{softMilestoneTitle(milestone)}</h4>
										<p>{softMilestoneDescription(milestone)}</p>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
				{#if milestonesData.nextMilestone}
					<div class="next-milestone">
						<div class="next-header"><Calendar size={18} /><span>Det som långsamt kan växa fram</span></div>
						<h3>Din trädgård har plats för mer ljus.</h3>
						<p>{nextMilestoneCopy(milestonesData.nextMilestone)}</p>
						<small>Ingen brådska. Den här platsen växer när du återvänder.</small>
					</div>
				{:else}
					<div class="next-milestone">
						<div class="next-header"><Calendar size={18} /><span>Det som långsamt kan växa fram</span></div>
						<p>Det finns inget mer du behöver jaga. Fortsätt återvända när det hjälper dig.</p>
					</div>
				{/if}
			</section>
		{/if}

		<!-- ── Tom state ── -->
		{#if entryCount === 0}
			<section class="card empty-state">
				<h2>Börja där du är</h2>
				<p>Du behöver inte ha kommit någonstans för att börja se mönster. Skriv en rad idag, så får platsen sitt första lilla ljus.</p>
				<a href="/dagbok/checkin" class="auth-button primary">Skriv en rad</a>
			</section>
		{/if}
			{/if}
		</div>
	</div>
</main>

<style>
	.journey-container { display: grid; gap: 1rem; }

	.loading-state, .error-state { text-align: center; padding: 2rem 1rem; font-size: 1.05rem; }
	.loading-state { color: hsl(var(--muted-foreground)); }
	.error-state small { display: block; margin-top: 0.5rem; opacity: 0.9; font-size: 0.9rem; }

	/* Cards base */
	.card {
		background: hsl(var(--surface));
		border-radius: var(--radius-card);
		padding: 2rem;
		margin: 0;
		border: 1px solid var(--color-dashboard-border);
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
		transition: border-color 160ms ease, box-shadow 160ms ease;
	}
	.card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: color-mix(in srgb, var(--color-dashboard-border) 76%, var(--primary) 24%); }
	.card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.2rem; }
	.card-header h2 { font-size: 1.3rem; margin: 0; color: hsl(var(--foreground)); }
	.card-intro {
		max-width: 42rem;
		margin: 0.35rem 0 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.95rem;
		line-height: 1.6;
	}
	.icon-badge { width: 2.8rem; height: 2.8rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
	.insights-card,
	.heatmap-card { min-height: 22rem; }
	.card-placeholder {
		border-radius: 0.75rem;
		background:
			linear-gradient(90deg, hsl(var(--surface-muted)) 25%, hsl(var(--surface-soft)) 50%, hsl(var(--surface-muted)) 75%);
		background-size: 200% 100%;
		animation: cardPlaceholderShimmer 1.6s ease-in-out infinite;
	}
	.card-placeholder--insights { min-height: 11rem; }
	.card-placeholder--heatmap { min-height: 18rem; }

	@keyframes cardPlaceholderShimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	/* Badge colors */
	.icon-badge.week { background: var(--theme-accent, #436e8f); }
	.icon-badge.milestone-leaf { background: linear-gradient(135deg, #7ea47c, #557c68); }
	.icon-badge.heat { background: linear-gradient(135deg, #6bcf7f, #4caf50); }
	.icon-badge.insight { background: linear-gradient(135deg, #667eea, #764ba2); }

	/* Weekly summary */
	.summary-card { background: var(--theme-bg, hsl(var(--surface-soft))); }
	.summary-text { font-size: 1.1rem; color: hsl(var(--foreground)); line-height: 1.7; margin: 0 0 0.75rem 0; }
	.encouragement { font-size: 0.95rem; color: hsl(var(--muted-foreground)); font-style: italic; margin: 0; }

	/* Overview */
	.overview-heading { font-size: 1.2rem; margin: 0 0 1.5rem 0; color: hsl(var(--foreground)); }
	.overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1.2rem; margin-bottom: 1rem; }
	.overview-item { text-align: center; padding: 1rem 0.5rem; border-radius: 0.5rem; background: var(--theme-bg, hsl(var(--surface-soft))); }
	.overview-number { font-size: 2.2rem; font-weight: 700; color: var(--theme-accent, #436e8f); }
	.overview-number--text { font-size: 1.25rem; line-height: 1.2; }
	.overview-label { font-size: 0.85rem; color: hsl(var(--muted-foreground)); margin-top: 0.3rem; }

	/* Milestones */
	.milestones-section + .milestones-section { margin-top: 1.2rem; }
	.milestones-section-title {
		margin: 0 0 0.65rem;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0;
		color: hsl(var(--foreground));
	}
	.milestones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 1rem; }
	.milestone { min-height: 8.75rem; padding: 1rem; border-radius: 0.5rem; display: flex; align-items: flex-start; gap: 1rem; background: hsl(var(--surface-muted)); border: 1px solid var(--color-dashboard-border); transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease; }
	.milestone.achieved { background: var(--theme-bg, hsl(var(--success-surface))); border-color: var(--color-dashboard-border); }
	.milestone.locked { opacity: 0.78; }
	.milestone:hover { border-color: color-mix(in srgb, var(--color-dashboard-border) 72%, var(--theme-accent, #557c68) 28%); box-shadow: 0 3px 10px rgba(0,0,0,0.06); }
	.milestone-mark {
		width: 1.65rem;
		height: 1.65rem;
		border-radius: 999px;
		flex: 0 0 auto;
		margin-top: 0.1rem;
		background:
			radial-gradient(circle at 35% 35%, rgba(255,255,255,0.55), transparent 38%),
			linear-gradient(135deg, #b8c9a7, #6f8f73);
		box-shadow: inset 0 -2px 5px rgba(38, 62, 42, 0.18);
	}
	.milestone-copy h4 { margin: 0 0 0.35rem; color: hsl(var(--foreground)); font-size: 0.98rem; font-weight: 650; }
	.milestone-copy p { margin: 0; color: hsl(var(--muted-foreground)); font-size: 0.86rem; line-height: 1.5; }
	.next-milestone { background: hsl(var(--surface-soft)); border: 1px solid var(--color-dashboard-border); padding: 1.5rem; border-radius: 0.5rem; margin-top: 1.5rem; }
	.next-header { display: flex; align-items: center; gap: 0.5rem; color: var(--theme-accent, #557c68); font-weight: 600; margin-bottom: 0.75rem; }
	.next-milestone h3 { margin: 0 0 0.45rem; color: hsl(var(--foreground)); font-size: 1.05rem; }
	.next-milestone p { font-size: 1rem; color: hsl(var(--muted-foreground)); margin: 0.5rem 0 0.75rem 0; line-height: 1.6; }
	.next-milestone small { color: hsl(var(--muted-foreground)); display: block; line-height: 1.5; }

	/* Heatmap */
	.heatmap-card { overflow-x: auto; }
	.heatmap-description { color: hsl(var(--muted-foreground)); font-size: 0.95rem; margin: 0 0 1.5rem 0; }

	/* Insights */
	.summary-box { margin-bottom: 1rem; padding: 1rem; border-radius: 0.5rem; background: hsl(var(--surface-muted)); border: 1px solid var(--color-dashboard-border); }
	.summary-box p { margin: 0; color: hsl(var(--foreground)); line-height: 1.6; }
	.insights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.2rem; }
	.insight-item { padding: 1.5rem; border-radius: 0.5rem; display: flex; align-items: center; gap: 1rem; border: 1px solid var(--color-dashboard-border); background: hsl(var(--surface-muted)); transition: all 0.2s ease; }
	.insight-item.best { background: var(--theme-bg, hsl(var(--surface-soft))); border-color: var(--color-dashboard-border); }
	.insight-item.worst { background: hsl(var(--error-surface)); border-color: hsl(var(--error-foreground) / 0.24); }
	.insight-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
	.insight-content h3 { margin: 0 0 0.25rem 0; font-size: 0.9rem; color: hsl(var(--muted-foreground)); text-transform: uppercase; letter-spacing: 0.5px; }
	.day-name { margin: 0; font-size: 1.2rem; font-weight: 600; color: hsl(var(--foreground)); }
	.insight-content small { color: hsl(var(--muted-foreground)); font-size: 0.85rem; }
	.patterns-list { list-style: none; padding: 0; margin: 0; }
	.patterns-list li { display: flex; align-items: center; padding: 0.75rem; background: hsl(var(--surface-muted)); border-radius: 0.25rem; margin-bottom: 0.5rem; font-size: 0.95rem; }
	.pattern-text { color: hsl(var(--foreground)); font-weight: 500; }

	/* Empty state */
	.empty-state { text-align: center; padding: 3rem 2rem; background: var(--theme-bg, hsl(var(--surface-soft))); border: 1px dashed var(--color-dashboard-border); }
	.empty-state h2 { margin-top: 0; color: hsl(var(--foreground)); }
	.empty-state p { color: hsl(var(--muted-foreground)); margin: 1rem 0 1.5rem 0; line-height: 1.6; }
	.empty-state .auth-button { margin-top: 0.25rem; }

	@media (max-width: 640px) {
		.card { padding: 1.5rem; }
		.card-header { flex-direction: column; align-items: flex-start; }
		.insights-card,
		.heatmap-card { min-height: 18rem; }
		.card-placeholder--heatmap { min-height: 14rem; }
		.milestones-grid { grid-template-columns: 1fr; }
		.insights-grid { grid-template-columns: 1fr; }
		.overview-grid { grid-template-columns: repeat(2, 1fr); }
		.overview-number { font-size: 1.8rem; }
		.icon-badge { width: 2.3rem; height: 2.3rem; }
	}
</style>


