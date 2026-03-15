<script lang="ts">
	import { onMount } from 'svelte';
	import { THEMES, THEME_STORAGE_KEY, getThemeColors, getCachedTheme } from '$lib/theme';
	import { browser } from '$app/environment';
	import ActivityHeatmap from '$lib/components/ActivityHeatmap.svelte';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent,
		hasSensitiveConsent
	} from '$lib/consent';
	import { supabase } from '$lib/supabase';
	import { Flame, Trophy, TrendingUp, Lightbulb, Calendar, Heart, BookOpen } from 'lucide-svelte';

	interface StreakData {
		currentStreak: number;
		longestStreak: number;
		lastEntryDate: string | null;
		lastEntryDaysAgo: number;
	}

	interface Milestone {
		entries: number;
		text: string;
		achieved: boolean;
		emoji: string;
	}

	interface MilestonesResponse {
		achieved: Milestone[];
		nextMilestone: Milestone & { entriesNeeded: number };
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

	// ── Theme ──

	let profileTheme = $state(getCachedTheme());
	const currentTheme = $derived(THEMES[profileTheme] ?? THEMES.neutral);
	const themeStyle = $derived(
		`--theme-accent: ${currentTheme.accent}; --theme-bg: ${currentTheme.bg};`
	);

	// ── Props + State ──
	let { data } = $props();

	let streakData: StreakData | null = $derived(data.streak ?? null);
	let milestonesData: MilestonesResponse | null = $derived(data.milestones ?? null);
	let weeklyEntries: number = $derived(data.weeklyEntries ?? 0);
	let insightsData = $state<InsightsResponse | null>(null);
	let insightsLoading = $state(false);
	let insightsError = $state('');
	let hasSensitiveDataConsent = $state(false);
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

	onMount(async () => {
		hasSensitiveDataConsent = hasSensitiveConsent();
		if (hasSensitiveDataConsent) {
			void loadInsights();
		}
		// Load theme from user_metadata
		const { data: { session } } = await supabase.auth.getSession();
		if (session?.user?.user_metadata?.profile_theme) {
			profileTheme = session.user.user_metadata.profile_theme;
			if (browser) localStorage.setItem('mittpsyke:theme', profileTheme);
		}
	});

	async function loadInsights() {
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
		void loadInsights();
	}

	// ── Share feature ──
	let shareConfirm = $state('');
	let shareConfirmTimer: ReturnType<typeof setTimeout> | null = null;

	function buildShareUrl(): string {
		const params = new URLSearchParams();
		if (streakData?.currentStreak) params.set('streak', String(streakData.currentStreak));
		if (milestonesData?.totalEntries) params.set('total', String(milestonesData.totalEntries));
		if (weeklyEntries) params.set('weekly', String(weeklyEntries));
		return `https://mittpsyke.se/share?${params.toString()}`;
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

<div class="journey-container" style={themeStyle}>
	<div class="journey-header">
		<h1>Din resa</h1>
		<p>En lugn överblick — i din takt</p>
		{#if streakData || milestonesData}
			<button class="share-btn" onclick={handleShare} aria-label="Dela din framstegssida">
				🌱 Dela min resa
			</button>
			{#if shareConfirm}
				<p class="share-confirm" role="status">{shareConfirm}</p>
			{/if}
		{/if}
	</div>

	{#if loading}
		<div class="loading-state">Laddar din sida med framsteg...</div>
	{:else if error}
		<div class="error-state">
			<p>{error}</p>
			<small>Försök att ladda sidan igen</small>
		</div>
	{:else}

		<!-- ── Mjuk veckosammanfattning ── -->
		<section class="card summary-card">
			<div class="card-header">
				<div class="icon-badge week"><Heart size={24} /></div>
				<h2>Den här veckan</h2>
			</div>
			<p class="summary-text">{weeklySummaryText}</p>
			<p class="encouragement">{weeklyEncouragement}</p>
		</section>

		<!-- ── Enkel reflektion ── -->
		<section class="card reflection-card">
			<div class="card-header">
				<div class="icon-badge reflect"><BookOpen size={24} /></div>
				<h2>En liten reflektion</h2>
			</div>
			<p class="reflection-prompt">{todayReflection}</p>
			<p class="reflection-hint">Du behöver inte svara. Ibland räcker det att stanna upp en stund.</p>
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

		<!-- ── Milstolpar ── -->
		{#if milestonesData}
			<section class="card milestones-card">
				<div class="card-header">
					<div class="icon-badge trophy"><Trophy size={24} /></div>
					<h2>Dina milstolpar</h2>
				</div>
				<div class="milestones-grid">
					{#each milestonesData.achieved as milestone}
						<div class="milestone achieved">
							<div class="milestone-emoji">{milestone.emoji}</div>
							<div class="milestone-text">{milestone.text}</div>
						</div>
					{/each}
				</div>
				{#if milestonesData.nextMilestone}
					<div class="next-milestone">
						<div class="next-header"><Calendar size={18} /><span>Nästa mål</span></div>
						<p>{milestonesData.nextMilestone.text}</p>
						<div class="progress-bar">
							<div class="progress-fill" style="width: {Math.min(100, (milestonesData.totalEntries / milestonesData.nextMilestone.entries) * 100)}%"></div>
						</div>
						<small>{milestonesData.totalEntries} / {milestonesData.nextMilestone.entries} ({milestonesData.nextMilestone.entriesNeeded} kvar)</small>
					</div>
				{/if}
			</section>
		{/if}

		<!-- ── Aktivitetskarta ── -->
		<section class="card heatmap-card">
			<div class="card-header">
				<div class="icon-badge heat"><TrendingUp size={24} /></div>
				<h2>Din aktivitetskarta</h2>
			</div>
			<p class="heatmap-description">Varje ruta motsvarar en dag. Mörkare färg = fler inlägg.</p>
			<ActivityHeatmap />
		</section>

		<!-- ── AI-insikter ── -->
		<section class="card insights-card">
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

		<!-- ── Tom state ── -->
		{#if !streakData || streakData.currentStreak === 0}
			<section class="card empty-state">
				<h2>Börja där du är</h2>
				<p>Inga framsteg visas ännu — och det är helt okej. När du börjar använda dagboken kan du följa din resa här.</p>
				<a href="/dagbok" class="btn-primary">Skriv ett inlägg</a>
			</section>
		{/if}
	{/if}
</div>

<style>
	.journey-container { max-width: 840px; margin: 0 auto; padding: 2rem 1rem; }
	.journey-header { text-align: center; margin-bottom: 2.5rem; }
	.journey-header h1 { font-size: 2.2rem; margin-bottom: 0.4rem; color: #1a1a1a; }
	.journey-header p { font-size: 1.05rem; color: #888; font-style: italic; }

	.share-btn {
		margin-top: 1rem;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.55rem 1.2rem;
		border-radius: 999px;
		border: 1.5px solid rgba(107, 144, 113, 0.45);
		background: transparent;
		color: #4a7a55;
		font-size: 0.88rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.18s, border-color 0.18s;
	}
	.share-btn:hover { background: rgba(107, 144, 113, 0.1); border-color: rgba(107, 144, 113, 0.7); }

	.share-confirm {
		margin-top: 0.5rem;
		font-size: 0.82rem;
		color: #6b9080;
		animation: fadeIn 0.2s ease;
	}
	@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
	.loading-state, .error-state { text-align: center; padding: 3rem 2rem; color: #666; font-size: 1.05rem; }
	.error-state { color: #d32f2f; background: #ffebee; border-radius: 0.5rem; padding: 2rem; }
	.error-state small { display: block; margin-top: 0.5rem; color: #c62828; font-size: 0.9rem; }

	/* Cards base */
	.card { background: white; border-radius: 0.75rem; padding: 2rem; margin-bottom: 1.2rem; border: 1px solid #eee; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: all 0.3s ease; }
	.card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #ddd; }
	.card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.2rem; }
	.card-header h2 { font-size: 1.3rem; margin: 0; color: #1a1a1a; }
	.icon-badge { width: 2.8rem; height: 2.8rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }

	/* Badge colors */
	.icon-badge.week { background: var(--theme-accent, #0f766e); }
	.icon-badge.reflect { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
	.icon-badge.trophy { background: linear-gradient(135deg, #ffd93d, #ffb347); }
	.icon-badge.heat { background: linear-gradient(135deg, #6bcf7f, #4caf50); }
	.icon-badge.insight { background: linear-gradient(135deg, #667eea, #764ba2); }

	/* Weekly summary */
	.summary-card { background: var(--theme-bg, rgba(15,118,110,0.07)); border-color: transparent; }
	.summary-text { font-size: 1.1rem; color: #1a1a1a; line-height: 1.7; margin: 0 0 0.75rem 0; }
	.encouragement { font-size: 0.95rem; color: #666; font-style: italic; margin: 0; }

	/* Reflection */
	.reflection-card { border-left: 3px solid var(--theme-accent, #0f766e); }
	.reflection-prompt { font-size: 1.15rem; color: #1a1a1a; font-weight: 500; line-height: 1.6; margin: 0 0 0.75rem 0; }
	.reflection-hint { font-size: 0.9rem; color: #999; margin: 0; font-style: italic; }

	/* Overview */
	.overview-heading { font-size: 1.2rem; margin: 0 0 1.5rem 0; color: #1a1a1a; }
	.overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1.2rem; margin-bottom: 1rem; }
	.overview-item { text-align: center; padding: 1rem 0.5rem; border-radius: 0.5rem; background: var(--theme-bg, rgba(15,118,110,0.07)); }
	.overview-number { font-size: 2.2rem; font-weight: 700; color: var(--theme-accent, #0f766e); }
	.overview-label { font-size: 0.85rem; color: #888; margin-top: 0.3rem; }
	.overview-note { font-size: 0.9rem; color: #888; text-align: center; font-style: italic; margin: 0.5rem 0 0 0; }

	/* Milestones */
	.milestones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.2rem; }
	.milestone { padding: 1rem; border-radius: 0.5rem; display: flex; align-items: center; gap: 1rem; background: #f5f5f5; border: 1px solid #eee; transition: all 0.2s ease; }
	.milestone.achieved { background: linear-gradient(135deg, rgba(76,175,80,0.1), rgba(129,199,132,0.1)); border-color: #4caf50; }
	.milestone:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
	.milestone-emoji { font-size: 2rem; }
	.milestone-text { font-size: 0.9rem; font-weight: 500; color: #1a1a1a; }
	.next-milestone { background: linear-gradient(135deg, rgba(102,126,234,0.05), rgba(118,75,162,0.05)); border: 1px solid rgba(102,126,234,0.3); padding: 1.5rem; border-radius: 0.5rem; margin-top: 1.5rem; }
	.next-header { display: flex; align-items: center; gap: 0.5rem; color: var(--theme-accent, #667eea); font-weight: 600; margin-bottom: 0.75rem; }
	.next-milestone p { font-size: 1rem; color: #1a1a1a; margin: 0.5rem 0 1rem 0; }
	.progress-bar { height: 0.5rem; background: #eee; border-radius: 0.25rem; overflow: hidden; margin-bottom: 0.5rem; }
	.progress-fill { height: 100%; background: var(--theme-accent, linear-gradient(90deg, #667eea, #764ba2)); border-radius: 0.25rem; transition: width 0.3s ease; }
	.next-milestone small { color: #999; display: block; }

	/* Heatmap */
	.heatmap-card { overflow-x: auto; }
	.heatmap-description { color: #666; font-size: 0.95rem; margin: 0 0 1.5rem 0; }

	/* Insights */
	.summary-box { margin-bottom: 1rem; padding: 1rem; border-radius: 0.5rem; background: #f9f9f9; border: 1px solid #eee; }
	.summary-box p { margin: 0; color: #1a1a1a; line-height: 1.6; }
	.insights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.2rem; }
	.insight-item { padding: 1.5rem; border-radius: 0.5rem; display: flex; align-items: center; gap: 1rem; border: 1px solid #eee; transition: all 0.2s ease; }
	.insight-item.best { background: linear-gradient(135deg, rgba(76,175,80,0.1), rgba(129,199,132,0.1)); border-color: #4caf50; }
	.insight-item.worst { background: linear-gradient(135deg, rgba(255,107,107,0.1), rgba(255,142,114,0.1)); border-color: #ff6b6b; }
	.insight-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
	.insight-content h3 { margin: 0 0 0.25rem 0; font-size: 0.9rem; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
	.day-name { margin: 0; font-size: 1.2rem; font-weight: 600; color: #1a1a1a; }
	.insight-content small { color: #999; font-size: 0.85rem; }
	.patterns-list { list-style: none; padding: 0; margin: 0; }
	.patterns-list li { display: flex; align-items: center; padding: 0.75rem; background: #f9f9f9; border-radius: 0.25rem; margin-bottom: 0.5rem; font-size: 0.95rem; }
	.pattern-text { color: #1a1a1a; font-weight: 500; }

	/* Empty state */
	.empty-state { text-align: center; padding: 3rem 2rem; background: var(--theme-bg, rgba(76,175,80,0.05)); border: 2px dashed var(--theme-accent, #4caf50); }
	.empty-state h2 { margin-top: 0; color: var(--theme-accent, #2e7d32); }
	.empty-state p { color: #555; margin: 1rem 0 1.5rem 0; line-height: 1.6; }
	.btn-primary { display: inline-block; padding: 0.75rem 1.5rem; background: var(--theme-accent, #4caf50); color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 600; transition: all 0.2s ease; }
	.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }

	/* ── Dark mode ── */
	@media (prefers-color-scheme: dark) {
		.journey-header h1, .card-header h2, .summary-text, .reflection-prompt,
		.overview-heading, .milestone-text, .next-milestone p, .summary-box p,
		.day-name, .pattern-text { color: rgba(255,255,255,0.9); }

		.encouragement, .loading-state, .heatmap-description,
		.overview-label, .overview-note, .journey-header p,
		.reflection-hint, .next-milestone small, .insight-content h3,
		.insight-content small { color: rgba(255,255,255,0.55); }

		.share-btn {
			color: rgba(168, 200, 130, 0.85);
			border-color: rgba(168, 200, 130, 0.3);
		}
		.share-btn:hover { background: rgba(168, 200, 130, 0.08); border-color: rgba(168, 200, 130, 0.5); }
		.share-confirm { color: #a8c882; }

		.empty-state p { color: rgba(255,255,255,0.65); }

		.card { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
		.card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.12); }

		.summary-card { background: var(--theme-bg, rgba(15,118,110,0.15)); }
		.milestone { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
		.milestone.achieved { background: rgba(76,175,80,0.15); border-color: rgba(76,175,80,0.4); }
		.summary-box { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); }
		.patterns-list li { background: rgba(255,255,255,0.05); }
		.next-milestone { background: rgba(102,126,234,0.1); border-color: rgba(102,126,234,0.3); }
		.progress-bar { background: rgba(255,255,255,0.1); }
		.error-state { background: rgba(211,47,47,0.15); color: #ff8a80; }
		.error-state small { color: #ff5252; }
		.empty-state { background: var(--theme-bg, rgba(76,175,80,0.1)); border-color: var(--theme-accent, #4caf50); }
	}

	@media (max-width: 640px) {
		.journey-container { padding: 1rem; }
		.journey-header h1 { font-size: 1.8rem; }
		.card { padding: 1.5rem; margin-bottom: 1.2rem; }
		.card-header { flex-direction: column; align-items: flex-start; }
		.milestones-grid { grid-template-columns: 1fr; }
		.insights-grid { grid-template-columns: 1fr; }
		.overview-grid { grid-template-columns: repeat(2, 1fr); }
		.overview-number { font-size: 1.8rem; }
		.icon-badge { width: 2.3rem; height: 2.3rem; }
	}
</style>
