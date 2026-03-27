<script lang="ts">
	import { onMount } from 'svelte';
	import { THEMES, THEME_STORAGE_KEY, getCachedTheme } from '$lib/theme';
	import { browser } from '$app/environment';
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent,
		hasSensitiveConsent
	} from '$lib/consent';
	import { supabase } from '$lib/supabase';
	import { Trophy, TrendingUp, Lightbulb, Calendar, Heart } from 'lucide-svelte';

	interface StreakData {
		currentStreak: number;
		longestStreak: number;
		lastEntryDate: string | null;
		lastEntryDaysAgo: number;
	}

	interface Milestone {
		id: string;
		category: 'entries' | 'streak' | 'time' | 'quality';
		metric: 'totalEntries' | 'longestStreak' | 'daysSinceJoined' | 'maxWordsInEntry' | 'maxWordsInDay';
		threshold: number;
		text: string;
		achieved: boolean;
		emoji: string;
		current: number;
		remaining: number;
		progressPercent: number;
		unit: 'inlägg' | 'dagar' | 'ord';
	}

	interface MilestoneSection {
		id: 'entries' | 'streak' | 'time' | 'quality';
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

	interface PageData {
		streak: StreakData | null;
		milestones: MilestonesResponse | null;
		weeklyEntries: number;
		heatmapData?: Record<string, number>;
		heatmapError?: string;
		profileTheme?: keyof typeof THEMES | null;
	}

	// ── Theme ──

	let { data } = $props<{ data: PageData }>();
	let profileTheme = $state(
		data.profileTheme && THEMES[data.profileTheme] ? data.profileTheme : getCachedTheme()
	);
	const currentTheme = $derived(THEMES[profileTheme] ?? THEMES.neutral);
	const themeStyle = $derived(
		`--theme-accent: ${currentTheme.accent}; --theme-bg: ${currentTheme.bg};`
	);

	// ── Props + State ──
	let streakData: StreakData | null = $derived(data.streak ?? null);
	let milestonesData: MilestonesResponse | null = $derived(data.milestones ?? null);
	let weeklyEntries: number = $derived(data.weeklyEntries ?? 0);
	let heatmapData = $derived(data.heatmapData ?? {});
	let heatmapError = $derived(data.heatmapError ?? '');
	let insightsData = $state<InsightsResponse | null>(null);
	let insightsLoading = $state(false);
	let insightsError = $state('');
	let hasSensitiveDataConsent = $state(browser ? hasSensitiveConsent() : false);
	let insightsVisible = $state(false);
	let heatmapVisible = $state(false);
	let insightsCardEl = $state<HTMLElement | null>(null);
	let heatmapCardEl = $state<HTMLElement | null>(null);
	let loading = false;
	let error = $derived(
		data.streak === null && data.milestones === null
			? 'Kunde inte ladda data. Försök ladda om sidan.'
			: ''
	);
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
		if (!streakData) return 'Det finns inget som måste vara perfekt för att räknas.';
		if (streakData.currentStreak >= 7) return 'En vecka i rad — det visar att du prioriterar dig själv. Fint.';
		if (streakData.currentStreak >= 3) return 'Flera dagar i rad. Små steg som gör skillnad.';
		if (streakData.currentStreak >= 1) return 'Att du är här räcker. Börja där du är.';
		return 'Det finns inget som måste vara perfekt för att räknas.';
	});

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

	function maybeLoadInsights() {
		if (!hasSensitiveDataConsent || !insightsVisible || insightsLoading || insightsData) return;
		void loadInsights();
	}

	onMount(() => {
		hasSensitiveDataConsent = hasSensitiveConsent();
		if (data.profileTheme && browser) {
			localStorage.setItem(THEME_STORAGE_KEY, data.profileTheme);
		}

		if (typeof IntersectionObserver === 'undefined') {
			insightsVisible = true;
			heatmapVisible = true;
			maybeLoadInsights();
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

		return () => observer.disconnect();
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

		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (!session?.access_token) {
			insightsError = 'Du behöver vara inloggad för att se AI-insikter.';
			insightsData = null;
			insightsLoading = false;
			return;
		}

		try {
			const response = await fetch('/api/diary/insights', {
				headers: {
					Authorization: `Bearer ${session.access_token}`,
					[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
				}
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
				insightsLoading = false;
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
		grantSensitiveConsent();
		hasSensitiveDataConsent = true;
		maybeLoadInsights();
	}

	// ── Share feature ──
	let shareConfirm = $state('');
	let shareConfirmTimer: ReturnType<typeof setTimeout> | null = null;

	function buildShareUrl(): string {
		const params = new URLSearchParams();
		if (streakData?.currentStreak) params.set('streak', String(streakData.currentStreak));
		if (milestonesData?.totalEntries) params.set('total', String(milestonesData.totalEntries));
		if (weeklyEntries) params.set('weekly', String(weeklyEntries));
		return `https://www.mittpsyke.se/share?${params.toString()}`;
	}

	async function handleShare() {
		const url = buildShareUrl();
		const streakNum = streakData?.currentStreak ?? 0;
		const text =
			streakNum >= 1
				? `Jag har checkat in med mig själv ${streakNum} dagar i rad 🌱`
				: `Jag tar hand om mitt psyke med MittPsyke 🌱`;

		if (navigator.share) {
			try {
				await navigator.share({ title: 'Min resa på MittPsyke', text, url });
				return;
			} catch {
				// User cancelled — fall through to clipboard
			}
		}
		// Fallback: copy to clipboard
		try {
			await navigator.clipboard.writeText(`${text}\n\n${url}`);
			if (shareConfirmTimer) clearTimeout(shareConfirmTimer);
			shareConfirm = 'Länk kopierad! ✓';
			shareConfirmTimer = setTimeout(() => (shareConfirm = ''), 2800);
		} catch {
			shareConfirm = url;
		}
	}
</script>

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
					{#if streakData}
						<div class="overview-item">
							<div class="overview-number">{streakData.currentStreak}</div>
							<div class="overview-label">dagar i rad</div>
						</div>
						<div class="overview-item">
							<div class="overview-number">{streakData.longestStreak}</div>
							<div class="overview-label">längsta streak</div>
						</div>
					{/if}
					{#if milestonesData}
						<div class="overview-item">
							<div class="overview-number">{milestonesData.totalEntries}</div>
							<div class="overview-label">totalt inlägg</div>
						</div>
						<div class="overview-item">
							<div class="overview-number">{weeklyEntries}</div>
							<div class="overview-label">den här veckan</div>
						</div>
					{/if}
				</div>
				{#if streakData && streakData.lastEntryDaysAgo <= 1}
					<p class="overview-note">Fint att du fortsätter komma tillbaka.</p>
				{:else if streakData && streakData.lastEntryDaysAgo > 1}
					<p class="overview-note">Senaste inlägget var {streakData.lastEntryDaysAgo} dagar sedan. Det går bra att börja om.</p>
				{/if}
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

		<!-- ── Aktivitetskarta ── -->
		<section class="card heatmap-card" bind:this={heatmapCardEl}>
			<div class="card-header">
				<div class="icon-badge heat"><TrendingUp size={24} /></div>
				<h2>Din aktivitetskarta</h2>
			</div>
			<p class="heatmap-description">Varje ruta motsvarar en dag. Mörkare färg = fler inlägg.</p>
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

		<!-- ── Milstolpar ── -->
		{#if milestonesData}
			<section class="card milestones-card">
				<div class="card-header">
					<div class="icon-badge trophy"><Trophy size={24} /></div>
					<h2>Dina milstolpar</h2>
				</div>
				{#each milestonesData.sections as section}
					<div class="milestones-section">
						<h3 class="milestones-section-title">{section.title}</h3>
						<div class="milestones-grid">
							{#each section.milestones as milestone}
								<div class="milestone {milestone.achieved ? 'achieved' : 'locked'}">
									<div class="milestone-emoji">{milestone.emoji}</div>
									<div class="milestone-text">{milestone.text}</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
				{#if milestonesData.nextMilestone}
					<div class="next-milestone">
						<div class="next-header"><Calendar size={18} /><span>Nästa mål</span></div>
						<p>{milestonesData.nextMilestone.text}</p>
						<div class="progress-bar">
							<div
								class="progress-fill"
								style="width: {milestonesData.nextMilestone.progressPercent}%"
							></div>
						</div>
						<small>
							{milestonesData.nextMilestone.current} / {milestonesData.nextMilestone.threshold}
							{milestonesData.nextMilestone.unit}
							({milestonesData.nextMilestone.remaining} kvar)
						</small>
					</div>
				{:else}
					<div class="next-milestone">
						<div class="next-header"><Calendar size={18} /><span>Nästa mål</span></div>
						<p>Du har låst upp alla milstolpar just nu. Fantastiskt fint jobbat.</p>
					</div>
				{/if}
			</section>
		{/if}

		<!-- ── Tom state ── -->
		{#if !streakData || streakData.currentStreak === 0}
			<section class="card empty-state">
				<h2>Börja där du är</h2>
				<p>Inga framsteg visas ännu — och det är helt okej. När du börjar använda dagboken kan du följa din resa här.</p>
				<a href="/dagbok" class="auth-button primary">Skriv ett inlägg</a>
			</section>
		{/if}
			{/if}

			<section class="journey-header auth-panel">
				<h2>Din resa</h2>
				<p>Så har det gått, i din takt.</p>
				{#if streakData || milestonesData}
					<button class="share-btn" onclick={handleShare} aria-label="Dela din framstegssida">
						🌱 Dela min resa
					</button>
					{#if shareConfirm}
						<p class="share-confirm" role="status">{shareConfirm}</p>
					{/if}
				{/if}
			</section>
		</div>
	</div>
</main>

<style>
	.journey-container { display: grid; gap: 1rem; }
	.journey-header { text-align: center; margin: 0; }
	.journey-header h2 { font-size: 1.35rem; margin: 0; color: hsl(var(--foreground)); }
	.journey-header p { margin: 0.45rem 0 0; font-size: 1rem; color: hsl(var(--muted-foreground)); font-style: italic; }

	.share-btn {
		margin-top: 1rem;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.55rem 1.2rem;
		border-radius: 999px;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		font-size: 0.88rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 150ms ease, border-color 150ms ease;
	}
	.share-btn:hover { background: hsl(var(--surface-soft)); border-color: hsl(var(--muted-foreground) / 0.45); }

	.share-confirm {
		margin-top: 0.5rem;
		font-size: 0.82rem;
		color: hsl(var(--muted-foreground));
		animation: fadeIn 0.2s ease;
	}
	@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
	.loading-state, .error-state { text-align: center; padding: 2rem 1rem; font-size: 1.05rem; }
	.loading-state { color: hsl(var(--muted-foreground)); }
	.error-state small { display: block; margin-top: 0.5rem; opacity: 0.9; font-size: 0.9rem; }

	/* Cards base */
	.card {
		background: hsl(var(--surface));
		border-radius: var(--radius-card);
		padding: 2rem;
		margin: 0;
		border: 1px solid hsl(var(--border));
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
		transition: border-color 160ms ease, box-shadow 160ms ease;
	}
	.card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: hsl(var(--muted-foreground) / 0.45); }
	.card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.2rem; }
	.card-header h2 { font-size: 1.3rem; margin: 0; color: hsl(var(--foreground)); }
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
	.icon-badge.week { background: var(--theme-accent, #0f766e); }
	.icon-badge.reflect { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
	.icon-badge.trophy { background: linear-gradient(135deg, #ffd93d, #ffb347); }
	.icon-badge.heat { background: linear-gradient(135deg, #6bcf7f, #4caf50); }
	.icon-badge.insight { background: linear-gradient(135deg, #667eea, #764ba2); }

	/* Weekly summary */
	.summary-card { background: var(--theme-bg, hsl(var(--surface-soft))); }
	.summary-text { font-size: 1.1rem; color: hsl(var(--foreground)); line-height: 1.7; margin: 0 0 0.75rem 0; }
	.encouragement { font-size: 0.95rem; color: hsl(var(--muted-foreground)); font-style: italic; margin: 0; }

	/* Reflection */
	.reflection-card { border-left: 3px solid var(--theme-accent, #0f766e); }
	.reflection-prompt { font-size: 1.15rem; color: hsl(var(--foreground)); font-weight: 500; line-height: 1.6; margin: 0 0 0.75rem 0; }
	.reflection-hint { font-size: 0.9rem; color: hsl(var(--muted-foreground)); margin: 0; font-style: italic; }

	/* Overview */
	.overview-heading { font-size: 1.2rem; margin: 0 0 1.5rem 0; color: hsl(var(--foreground)); }
	.overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1.2rem; margin-bottom: 1rem; }
	.overview-item { text-align: center; padding: 1rem 0.5rem; border-radius: 0.5rem; background: var(--theme-bg, hsl(var(--surface-soft))); }
	.overview-number { font-size: 2.2rem; font-weight: 700; color: var(--theme-accent, #0f766e); }
	.overview-label { font-size: 0.85rem; color: hsl(var(--muted-foreground)); margin-top: 0.3rem; }
	.overview-note { font-size: 0.9rem; color: hsl(var(--muted-foreground)); text-align: center; font-style: italic; margin: 0.5rem 0 0 0; }

	/* Milestones */
	.milestones-section + .milestones-section { margin-top: 1.2rem; }
	.milestones-section-title {
		margin: 0 0 0.65rem;
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: 0.01em;
		color: hsl(var(--muted-foreground));
	}
	.milestones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
	.milestone { padding: 1rem; border-radius: 0.5rem; display: flex; align-items: center; gap: 1rem; background: hsl(var(--surface-muted)); border: 1px solid hsl(var(--border)); transition: all 0.2s ease; }
	.milestone.achieved { background: var(--theme-bg, hsl(var(--success-surface))); border-color: var(--theme-accent, hsl(var(--border))); }
	.milestone.locked { opacity: 0.62; filter: saturate(0.6); }
	.milestone:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
	.milestone-emoji { font-size: 2rem; }
	.milestone-text { font-size: 0.9rem; font-weight: 500; color: hsl(var(--foreground)); }
	.next-milestone { background: hsl(var(--surface-soft)); border: 1px solid hsl(var(--border)); padding: 1.5rem; border-radius: 0.5rem; margin-top: 1.5rem; }
	.next-header { display: flex; align-items: center; gap: 0.5rem; color: var(--theme-accent, #667eea); font-weight: 600; margin-bottom: 0.75rem; }
	.next-milestone p { font-size: 1rem; color: hsl(var(--foreground)); margin: 0.5rem 0 1rem 0; }
	.progress-bar { height: 0.5rem; background: hsl(var(--surface-muted)); border-radius: 0.25rem; overflow: hidden; margin-bottom: 0.5rem; }
	.progress-fill { height: 100%; background: var(--theme-accent, linear-gradient(90deg, #667eea, #764ba2)); border-radius: 0.25rem; transition: width 0.3s ease; }
	.next-milestone small { color: hsl(var(--muted-foreground)); display: block; }

	/* Heatmap */
	.heatmap-card { overflow-x: auto; }
	.heatmap-description { color: hsl(var(--muted-foreground)); font-size: 0.95rem; margin: 0 0 1.5rem 0; }

	/* Insights */
	.summary-box { margin-bottom: 1rem; padding: 1rem; border-radius: 0.5rem; background: hsl(var(--surface-muted)); border: 1px solid hsl(var(--border)); }
	.summary-box p { margin: 0; color: hsl(var(--foreground)); line-height: 1.6; }
	.insights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.2rem; }
	.insight-item { padding: 1.5rem; border-radius: 0.5rem; display: flex; align-items: center; gap: 1rem; border: 1px solid hsl(var(--border)); background: hsl(var(--surface-muted)); transition: all 0.2s ease; }
	.insight-item.best { background: var(--theme-bg, hsl(var(--surface-soft))); border-color: var(--theme-accent, hsl(var(--border))); }
	.insight-item.worst { background: hsl(var(--error-surface)); border-color: hsl(var(--error-foreground) / 0.24); }
	.insight-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
	.insight-content h3 { margin: 0 0 0.25rem 0; font-size: 0.9rem; color: hsl(var(--muted-foreground)); text-transform: uppercase; letter-spacing: 0.5px; }
	.day-name { margin: 0; font-size: 1.2rem; font-weight: 600; color: hsl(var(--foreground)); }
	.insight-content small { color: hsl(var(--muted-foreground)); font-size: 0.85rem; }
	.patterns-list { list-style: none; padding: 0; margin: 0; }
	.patterns-list li { display: flex; align-items: center; padding: 0.75rem; background: hsl(var(--surface-muted)); border-radius: 0.25rem; margin-bottom: 0.5rem; font-size: 0.95rem; }
	.pattern-text { color: hsl(var(--foreground)); font-weight: 500; }

	/* Empty state */
	.empty-state { text-align: center; padding: 3rem 2rem; background: var(--theme-bg, hsl(var(--surface-soft))); border: 1px dashed hsl(var(--border)); }
	.empty-state h2 { margin-top: 0; color: hsl(var(--foreground)); }
	.empty-state p { color: hsl(var(--muted-foreground)); margin: 1rem 0 1.5rem 0; line-height: 1.6; }
	.empty-state .auth-button { margin-top: 0.25rem; }

	@media (max-width: 640px) {
		.journey-header h2 { font-size: 1.2rem; }
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

