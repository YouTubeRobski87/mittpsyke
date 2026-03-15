<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { User } from '@supabase/supabase-js';
	import { supabase } from '$lib/supabase';
	import { loadDiaryEntries, type DiaryEntry } from '$lib/state/diary';
	import { getPortalByKey } from '$lib/data/portals';
	import { THEMES, THEME_STORAGE_KEY, getCachedTheme, themeStyleVars } from '$lib/theme';
	import { getDailyPrompt } from '$lib/dailyPrompt';

	type RecentConversation = {
		id: string;
		category: string | null;
		created_at: string | null;
		title: string | null;
		displayTitle: string;
	};

	let loading = $state(true);
	let firstName = $state('du');
	let latestEntries = $state<DiaryEntry[]>([]);
	let recentConversations = $state<RecentConversation[]>([]);
	let lastChatCategory = $state('a');
	let lastConversationId = $state<string | null>(null);

	// Personalization state
	let profileTheme = $state(getCachedTheme());
	let weeklyGoalType = $state('diary_3_week');
	let dashboardWidget = $state('dagbok');
	let entriesThisWeek = $state(0);
	let daysSinceLastEntry = $state<number | null>(null);
	let dailyPrompt = $state(getDailyPrompt());


	const GOAL_OPTIONS = [
		{ value: 'diary_3_week',   label: 'Jag vill skriva i dagboken 3 gånger i veckan', target: 3 },
		{ value: 'mood_daily',     label: 'Jag vill checka in mitt humör varje dag',       target: 7 },
		{ value: 'write_when_needed', label: 'Jag vill skriva när tankarna blir mycket',   target: null },
		{ value: 'calm_moments',   label: 'Jag vill skapa en lugn stund för mig själv några gånger i veckan', target: 3 },
		{ value: 'none',           label: 'Inget mål just nu',                             target: null },
	];

	const WIDGET_OPTIONS = [
		{ value: 'dagbok', label: 'Dagboken' },
		{ value: 'mood',   label: 'Senaste humör' },
		{ value: 'guide',  label: 'Guider' },
		{ value: 'chat',   label: 'Chatten' },
	];

	const continueChatHref = $derived(
		lastConversationId
			? `/chat/${lastChatCategory}?id=${encodeURIComponent(lastConversationId)}`
			: `/chat/${lastChatCategory}`
	);
	const continuePortal = $derived(getPortalByKey(lastChatCategory));
	const reflectionPreview = $derived(latestEntries.slice(0, 5));
	const moodTrail = $derived(
		latestEntries.filter((entry) => Boolean(entry.mood)).slice(0, 5).map((entry) => entry.mood ?? '')
	);
	const dominantMood = $derived(getDominantMood(latestEntries));

	function extractFirstName(value: string | null | undefined) {
		const normalized = (value ?? '').trim();
		if (!normalized) return 'du';
		return normalized.split(/\s+/)[0];
	}

	function extractNameFromEmail(value: string | null | undefined) {
		const raw = (value ?? '').trim();
		if (!raw || !raw.includes('@')) return '';
		const localPart = raw.split('@')[0] ?? '';
		const readable = localPart.replace(/[._-]+/g, ' ').trim();
		return readable.length > 0 ? readable : '';
	}

	function pickUserName(user: User, displayNameFromProfile: string | null) {
		if (displayNameFromProfile?.trim()) {
			return displayNameFromProfile.trim();
		}

		const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
		const candidateKeys = ['display_name', 'given_name', 'first_name', 'full_name', 'name'];

		for (const key of candidateKeys) {
			const value = metadata[key];
			if (typeof value === 'string' && value.trim().length > 0) {
				return value.trim();
			}
		}

		const nameFromEmail = extractNameFromEmail(user.email);
		return nameFromEmail || 'du';
	}

	function formatTimestamp(value: string | null) {
		if (!value) return 'Okant tid';
		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) return 'Okant tid';

		return new Intl.DateTimeFormat('sv-SE', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(parsed);
	}

	function previewText(value: string, max = 120) {
		const text = value.trim();
		if (text.length <= max) return text;
		return `${text.slice(0, max - 1).trimEnd()}...`;
	}

	function conversationTitleFromText(value: string, max = 60) {
		const normalized = value.trim().replace(/\s+/g, ' ');
		if (!normalized) return 'Samtal';
		return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}...`;
	}

	function toRouteCategory(value: string | null | undefined) {
		const normalized = (value ?? '').trim().toLowerCase();
		if (normalized === 'b') return 'b';
		if (normalized === 'e') return 'e';
		return 'a';
	}

	function formatConversationCategory(value: string | null | undefined) {
		const portal = getPortalByKey(toRouteCategory(value));
		return portal ? portal.title : 'Samtal';
	}

	function formatDate(value: string | null) {
		if (!value) return 'Ok\u00e4nt datum';

		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return 'Ok\u00e4nt datum';

		const now = new Date();
		const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);

		if (diff < 1) return 'Idag';
		if (diff < 2) return 'Ig\u00e5r';
		if (diff < 7) return `${Math.floor(diff)} dagar sedan`;
		return d.toLocaleDateString('sv-SE');
	}

	function moodIcon(value: string) {
		const tone = value.toLowerCase();
		if (tone.includes('lugn') || tone.includes('hopp')) return 'o';
		if (tone.includes('orol') || tone.includes('stress')) return '~';
		if (tone.includes('nedst') || tone.includes('trott')) return '-';
		return '.';
	}

	function getDominantMood(entries: DiaryEntry[]) {
		const counts = new Map<string, number>();

		for (const entry of entries.slice(0, 12)) {
			if (!entry.mood) continue;
			counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);
		}

		let result = '';
		let topCount = 0;
		for (const [mood, count] of counts.entries()) {
			if (count > topCount) {
				result = mood;
				topCount = count;
			}
		}

		return result;
	}

	function supportLine() {
		if (dominantMood) return `Det vanligaste ordet i dina senaste reflektioner: ${dominantMood}.`;
		if (reflectionPreview.length > 0) return 'Du har redan borjat ge dig sjalv utrymme.';
		return 'Nar du vill kan du borja med nagra ord om hur dagen kanns.';
	}

	function calcStreak(entries: DiaryEntry[]): number {
		if (entries.length === 0) return 0;
		const days = new Set(
			entries
				.filter((e) => e.created_at)
				.map((e) => new Date(e.created_at!).toISOString().slice(0, 10))
		);
		let streak = 0;
		const today = new Date();
		for (let i = 0; i < 365; i++) {
			const d = new Date(today);
			d.setDate(today.getDate() - i);
			const key = d.toISOString().slice(0, 10);
			if (days.has(key)) {
				streak++;
			} else if (i > 0) {
				break;
			}
		}
		return streak;
	}

	const streak = $derived(calcStreak(latestEntries));

	const streakSubText = $derived(
		streak >= 7 ? 'fantastiskt — du tar hand om dig.' :
		streak >= 3 ? 'fint att du fortsätter ta hand om dig.' :
		'det behöver inte vara perfekt för att räknas.'
	);

	const NUDGE_TEXTS = [
		'Hur känns dagen just nu?',
		'Vill du skriva några rader för dig själv?',
		'Små steg räknas också.',
		'Du behöver inte göra mycket — bara börja där du är.',
		'En liten stund för dig själv kan räcka idag.',
		'Fint att du är här.',
		'I din takt, på ditt sätt.',
	];

	const welcomeSubtitle = $derived(
		daysSinceLastEntry !== null && daysSinceLastEntry >= 3
			? `Det är \${daysSinceLastEntry} dagar sedan senast — ingen stress, vi finns här när du vill. 💛`
			: NUDGE_TEXTS[new Date().getDay() % NUDGE_TEXTS.length]
	);

	const currentTheme = $derived(THEMES[profileTheme] ?? THEMES.neutral);
	const themeStyle = $derived(
		`--theme-accent: \${currentTheme.accent}; --theme-bg: \${currentTheme.bg};`
	);

	const currentGoal = $derived(GOAL_OPTIONS.find(g => g.value === weeklyGoalType) ?? GOAL_OPTIONS[0]);
	const goalTarget = $derived(currentGoal.target);
	const goalPct = $derived(goalTarget ? Math.min(100, Math.round((entriesThisWeek / goalTarget) * 100)) : 0);
	const goalLabel = $derived(
		!goalTarget ? null :
		entriesThisWeek >= goalTarget ? `${goalTarget} av ${goalTarget} — fint jobbat den här veckan! 🎉` :
		`${entriesThisWeek} av ${goalTarget} denna vecka`
	);
	const goalSubText = $derived(
		!goalTarget ? 'Skriv när det känns rätt — det finns inget krav här.' :
		entriesThisWeek === 0 ? 'Börja där du är idag. En kort stund räcker.' :
		entriesThisWeek >= goalTarget ? 'Du nådde ditt mål den här veckan — fint jobbat! 🌱' :
		entriesThisWeek === 1 ? 'Du är igång — små steg, i din takt.' :
		entriesThisWeek === 2 ? 'Det går framåt. Du tar hand om dig.' :
		'Steg för steg — du är på god väg.'
	);

	
	function greetingByTime(): string {
		const h = new Date().getHours();
		if (h < 5) return 'God natt';
		if (h < 10) return 'God morgon';
		if (h < 13) return 'Hej';
		if (h < 18) return 'God eftermiddag';
		return 'God kväll';
	}

	$effect(() => {
		let alive = true;

		async function initDashboard() {
			const {
				data: { session }
			} = await supabase.auth.getSession();

			if (!session) {
				goto('/login');
				return;
			}

			if (browser) {
				const storedCategory = window.localStorage.getItem('mittpsyke:last-chat-category');
				if (storedCategory && getPortalByKey(storedCategory)) {
					lastChatCategory = storedCategory;
				}

				const storedConversationId = window.localStorage.getItem('mittpsyke:last-conversation-id');
				lastConversationId = storedConversationId && storedConversationId.trim() ? storedConversationId : null;
			}

			const { data: profile } = await supabase
				.from('profiles')
				.select('display_name')
				.eq('id', session.user.id)
				.maybeSingle();

			const resolvedName = pickUserName(session.user, (profile?.display_name as string | null) ?? null);
			const nextEntries = await loadDiaryEntries(session.user.id);
			let nextConversations: RecentConversation[] = [];

			const { data: conversations, error: conversationsError } = await supabase
				.from('conversations')
				.select('id, category, created_at, title')
				.eq('user_id', session.user.id)
				.order('created_at', { ascending: false })
				.limit(5);

			if (conversationsError) {
				const missingTitleColumn =
					conversationsError.code === 'PGRST204' ||
					conversationsError.code === '42703' ||
					(conversationsError.message ?? '').toLowerCase().includes('title');

				if (missingTitleColumn) {
					const { data: fallbackConversations, error: fallbackError } = await supabase
						.from('conversations')
						.select('id, category, created_at')
						.eq('user_id', session.user.id)
						.order('created_at', { ascending: false })
						.limit(5);

					if (!fallbackError && fallbackConversations) {
						nextConversations = fallbackConversations.map((conversation) => ({
							id: conversation.id as string,
							category: (conversation.category as string | null) ?? null,
							created_at: (conversation.created_at as string | null) ?? null,
							title: null,
							displayTitle: 'Samtal'
						}));
					}
				} else {
					console.error('Failed to load recent conversations:', conversationsError);
				}
			} else if (conversations) {
				nextConversations = conversations.map((conversation) => {
					const title = typeof conversation.title === 'string' ? conversation.title.trim() : '';
					return {
						id: conversation.id as string,
						category: (conversation.category as string | null) ?? null,
						created_at: (conversation.created_at as string | null) ?? null,
						title: title || null,
						displayTitle: title || 'Samtal'
					};
				});
			}

			const missingTitleIds = nextConversations
				.filter((conversation) => conversation.displayTitle === 'Samtal')
				.map((conversation) => conversation.id);

			if (missingTitleIds.length > 0) {
				const { data: titleRows, error: titleRowsError } = await supabase
					.from('messages')
					.select('conversation_id, content, created_at')
					.in('conversation_id', missingTitleIds)
					.eq('role', 'user')
					.order('created_at', { ascending: true });

				if (!titleRowsError && titleRows) {
					const titleByConversation = new Map<string, string>();

					for (const row of titleRows) {
						const conversationId = row.conversation_id as string | null;
						const content = typeof row.content === 'string' ? row.content : '';
						if (!conversationId || titleByConversation.has(conversationId) || !content.trim()) continue;
						titleByConversation.set(conversationId, conversationTitleFromText(content));
					}

					nextConversations = nextConversations.map((conversation) => ({
						...conversation,
						displayTitle: titleByConversation.get(conversation.id) ?? conversation.displayTitle
					}));
				}
			}

			if (!alive) return;

			firstName = extractFirstName(resolvedName);

			// Load personalization preferences from user_metadata
			const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
			profileTheme = typeof meta.profile_theme === 'string' ? meta.profile_theme : 'neutral';
			if (browser) localStorage.setItem(THEME_STORAGE_KEY, profileTheme);
			weeklyGoalType = typeof meta.weekly_goal_type === 'string' ? meta.weekly_goal_type : 'diary_3_week';
			dashboardWidget = typeof meta.dashboard_widget === 'string' ? meta.dashboard_widget : 'dagbok';

			// Calculate entries this week
			const startOfWeek = new Date();
			startOfWeek.setHours(0, 0, 0, 0);
			startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7)); // Mon
			entriesThisWeek = nextEntries.filter(e => e.created_at && new Date(e.created_at) >= startOfWeek).length;

			// Days since last entry
			if (nextEntries.length > 0 && nextEntries[0].created_at) {
				const last = new Date(nextEntries[0].created_at);
				daysSinceLastEntry = Math.floor((Date.now() - last.getTime()) / 86400000);
			} else {
				daysSinceLastEntry = null;
			}

			latestEntries = nextEntries;
			recentConversations = nextConversations;
			loading = false;
		}

		void initDashboard();

		return () => {
			alive = false;
		};
	});
</script>

<svelte:head>
	<title>Min portal - MittPsyke</title>
</svelte:head>

<main class="portal-page container" style={themeStyle}>
	{#if loading}
		<p class="loading-copy">Laddar din portal. Det kan ta en liten stund.</p>
	{:else}
		<!-- Tab Navigation -->
		<nav class="dashboard-tabs" aria-label="Portalnavigering">
			<a href="/dashboard" class="tab active" aria-current="page">Min portal</a>
			<a href="/dashboard/installningar" class="tab">Kontoinställningar</a>
		</nav>

		<!-- Welcome Section -->
		<section class="panel welcome-panel" style="background: var(--theme-bg, rgba(15,118,110,0.07));">
			<p class="welcome-kicker">Min portal</p>
			<h1>{greetingByTime()}, {firstName}</h1>
			<p class="welcome-subtitle">{welcomeSubtitle}</p>
			{#if streak > 0}
				<div class="streak-badge">
					<span class="streak-flame">🔥</span>
					<span class="streak-text">
						{streak === 1 ? '1 dag i rad' : `${streak} dagar i rad`} — {streakSubText}
					</span>
				</div>
			{:else}
				<div class="streak-badge streak-start">
					<span class="streak-flame">✨</span>
					<span class="streak-text">Börja där du är idag — en kort rad kan räcka.</span>
				</div>
			{/if}
		</section>

		<!-- Dagens fråga -->
		<section class="panel prompt-panel">
			<p class="panel-kicker">Dagens fråga</p>
			<h2 class="prompt-question">{dailyPrompt}</h2>
			<p class="prompt-sub">Det räcker med några ord.</p>
			<a href="/dagbok?prefill={encodeURIComponent(dailyPrompt)}&from=prompt" class="prompt-cta">Svara</a>
			<a href="/checkin" class="checkin-link">Eller gör en snabb check-in →</a>
		</section>

		<!-- Goal Widget -->
		{#if weeklyGoalType !== 'none'}
		<section class="panel goal-panel">
			<p class="panel-kicker">Ditt mål</p>
			<p class="goal-label">{currentGoal.label}</p>
			{#if goalLabel}
				<div class="goal-progress">
					<div class="goal-bar-track">
						<div class="goal-bar-fill" style="width: {goalPct}%; background: var(--theme-accent, #0f766e);"></div>
					</div>
					<p class="goal-status">{goalLabel}</p>
				</div>
			{/if}
			<p class="goal-sub">{goalSubText}</p>
			<a href="/dagbok" class="goal-cta">Checka in nu</a>
		</section>
		{/if}

		<!-- Configurable Widget -->
		<section class="panel widget-panel">
			<p class="panel-kicker">Din widget</p>
			{#if dashboardWidget === 'mood'}
				<h3 class="widget-heading">Senaste humör</h3>
				{#if dominantMood}
					<p class="widget-body">Senast du checkade in kände du dig <em>{dominantMood}</em>.</p>
				{:else}
					<p class="widget-body">Inga humörinlägg än — börja med att checka in idag.</p>
				{/if}
				<a href="/dagbok" class="widget-cta">Ny incheckning</a>
			{:else if dashboardWidget === 'guide'}
				<h3 class="widget-heading">Utforska guider</h3>
				<p class="widget-body">Hitta en guide som passar det du bär på just nu.</p>
				<a href="/guider" class="widget-cta">Bläddra i guider</a>
			{:else if dashboardWidget === 'chat'}
				<h3 class="widget-heading">Behöver du prata av dig?</h3>
				<p class="widget-body">Du kan börja anonymt och i lugn takt.</p>
				<a href="/chatta" class="widget-cta">Öppna chatten</a>
			{:else}
				<h3 class="widget-heading">Dagboken väntar</h3>
				<p class="widget-body">Skriv av dig några rader och fånga det som känns viktigt idag.</p>
				<a href="/dagbok" class="widget-cta">Öppna dagboken</a>
			{/if}
		</section>

		<!-- Quick Actions Section -->
		<section class="section-block">
			<h2>Snabba val</h2>
			<div class="quick-actions">
				<a class="action action-primary" href="/dagbok">Börja skriva</a>
				<a class="action action-secondary" href={continueChatHref}>
					Fortsätt senaste samtal
					<span>{continuePortal ? continuePortal.title : 'Samtal'}</span>
				</a>
			</div>

			<div class="conversation-history">
				<h3>Senaste samtal</h3>
				{#if recentConversations.length === 0}
					<p class="conversation-empty">Inga tidigare samtal än. När du börjar skriva i chatten visas dina senaste samtal här.</p>
				{:else}
					{#each recentConversations as conversation (conversation.id)}
						<a class="conversation-card" href={`/chat/${toRouteCategory(conversation.category)}?id=${conversation.id}`}>
							<div class="conversation-title">{conversation.displayTitle}</div>
							<div class="conversation-meta">
								{formatConversationCategory(conversation.category)} &bull; {formatDate(conversation.created_at)}
							</div>
						</a>
					{/each}
				{/if}
			</div>
		</section>

		<!-- Reflections / History Preview Section -->
		<section class="section-block">
			<div class="section-header">
				<h2>Mina reflektioner</h2>
				<a href="/dagbok">Öppna dagbok</a>
			</div>

			{#if reflectionPreview.length === 0}
				<div class="empty-state">
					<p>Du har inga sparade reflektioner ännu.</p>
					<p>När du vill kan du börja med några rader i dagboken. Dina senaste anteckningar visas här när de finns.</p>
				</div>
			{:else}
				<ul class="reflection-list">
					{#each reflectionPreview as entry (entry.id)}
						<li class="reflection-card">
							<h3>{entry.mood ? entry.mood : 'Reflektion'}</h3>
							<p>{previewText(entry.content)}</p>
							<time>{formatTimestamp(entry.created_at)}</time>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<!-- Emotional Overview Section -->
		<section class="section-block">
			<h2>Känsloöversikt</h2>
			<div class="mood-panel">
				<div class="mood-indicators" aria-hidden="true">
					{#if moodTrail.length === 0}
						<span class="mood-dot muted">.</span>
						<span class="mood-dot muted">.</span>
						<span class="mood-dot muted">.</span>
					{:else}
						{#each moodTrail as mood}
							<span class="mood-dot">{moodIcon(mood)}</span>
						{/each}
					{/if}
				</div>
				<p>{supportLine()}</p>
			</div>
		</section>

		<!-- Support Bridge Section -->
		<section class="panel support-panel">
			<p>Behöver du prata med någon direkt?</p>
			<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Öppna Stödlinjer</a>
		</section>
	{/if}
</main>

<style>
	/* Page Layout */
	.portal-page {
		max-width: 840px;
		padding-top: 1.1rem;
		padding-bottom: 2.75rem;
		display: grid;
		gap: 1rem;
	}

	.loading-copy {
		font-family: var(--font-body);
		padding: 1.6rem 0;
		opacity: 0.7;
	}

	/* Shared Surface Styles */
	.panel,
	.section-block {
		border-radius: var(--radius-card);
		background: #f8f7f4;
		padding: 1.05rem;
	}

	.section-block {
		background: #fcfbf9;
	}

	/* Welcome Block */
	.welcome-panel {
		background: #f5f3ef;
	}

	/* Tab Navigation */
	.dashboard-tabs {
		display: flex;
		gap: 0.35rem;
		border-radius: var(--radius-card);
		background: #f5f3ef;
		padding: 0.3rem;
	}

	:global(.dark) .dashboard-tabs {
		background: rgba(255, 255, 255, 0.04);
	}

	.tab {
		flex: 1;
		text-align: center;
		padding: 0.55rem 0.8rem;
		border-radius: var(--radius-input);
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 0.9rem;
		letter-spacing: -0.01em;
		color: #2f2a24;
		opacity: 0.55;
		transition: background-color 160ms ease, opacity 160ms ease;
	}

	.tab:hover {
		opacity: 0.8;
	}

	.tab.active {
		background: rgba(255, 255, 255, 0.7);
		opacity: 1;
	}

	:global(.dark) .tab {
		color: #e8e4de;
	}

	:global(.dark) .tab.active {
		background: rgba(255, 255, 255, 0.08);
	}

	.welcome-kicker {
		margin: 0 0 0.35rem;
		font-size: 0.76rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: 0.65;
		font-family: var(--font-heading);
		font-weight: 500;
	}

	h1,
	h2,
	h3 {
		font-family: var(--font-heading);
		color: #2f2a24;
		letter-spacing: -0.02em;
	}

	h1 {
		margin: 0;
		font-weight: 850;
		font-size: clamp(1.6rem, 4.3vw, 2.1rem);
		line-height: 1.1;
	}

	h2 {
		font-weight: 700;
	}

	h3 {
		font-weight: 600;
	}

	.welcome-subtitle {
		margin: 0.5rem 0 0;
		font-family: var(--font-body);
		font-weight: 400;
		font-size: 0.98rem;
		line-height: 1.65;
		max-width: 46ch;
	}

	.streak-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.9rem;
		padding: 0.4rem 0.85rem;
		background: rgba(255, 120, 50, 0.12);
		border: 1px solid rgba(255, 120, 50, 0.3);
		border-radius: 999px;
		font-size: 0.88rem;
		font-weight: 500;
		color: var(--text-primary, #1a1a1a);
	}

	.streak-start {
		background: rgba(100, 180, 120, 0.12);
		border-color: rgba(100, 180, 120, 0.3);
	}

	.streak-flame {
		font-size: 1rem;
	}

	.streak-text {
		opacity: 0.85;
	}

	/* Section Headings */
	.section-block h2 {
		margin: 0 0 0.65rem;
		font-size: 1.03rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.6rem;
		margin-bottom: 0.65rem;
	}

	.section-header a {
		font-size: 0.82rem;
		font-family: var(--font-body);
		opacity: 0.7;
	}

	/* Quick Actions */
	.quick-actions {
		display: grid;
		gap: 0.65rem;
	}

	.action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-card);
		padding: 0.85rem 1rem;
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 0.95rem;
		letter-spacing: -0.01em;
		background: #efece7;
		color: #2e2a24;
		transition: background-color 160ms ease, opacity 160ms ease;
	}

	.action:hover {
		background: #e8e3db;
	}

	.action-primary {
		background: #e5f1ec;
	}

	.action-primary:hover {
		background: #dbe9e3;
	}

	.action-secondary {
		flex-direction: column;
		gap: 0.15rem;
	}

	.action-secondary span {
		font-family: var(--font-body);
		font-weight: 400;
		font-size: 0.79rem;
		opacity: 0.7;
	}

	.conversation-history {
		margin-top: 1rem;
	}

	.conversation-history h3 {
		margin: 0 0 0.6rem;
		font-size: 0.95rem;
	}

	.conversation-empty {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.88rem;
		opacity: 0.68;
	}

	.conversation-card {
		display: block;
		padding: 14px 16px;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.05);
		margin-bottom: 10px;
		background: rgba(255, 255, 255, 0.45);
		transition: background 0.2s ease;
	}

	:global(.dark) .conversation-card {
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.02);
	}

	.conversation-card:hover {
		background: rgba(0, 0, 0, 0.03);
	}

	:global(.dark) .conversation-card:hover {
		background: rgba(255, 255, 255, 0.04);
	}

	.conversation-title {
		font-family: var(--font-body);
		font-weight: 500;
		letter-spacing: -0.005em;
	}

	.conversation-meta {
		margin-top: 0.15rem;
		font-size: 0.85rem;
		opacity: 0.6;
		font-family: var(--font-body);
	}

	/* Reflection Cards */
	.reflection-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}

	.reflection-card {
		background: #f5f2ed;
		border-radius: var(--radius-input);
		padding: 0.85rem 0.9rem;
	}

	.reflection-card h3 {
		margin: 0;
		font-size: 0.95rem;
	}

	.reflection-card p {
		margin: 0.38rem 0 0;
		font-size: 0.9rem;
		line-height: 1.65;
		font-family: var(--font-body);
		font-weight: 400;
	}

	.reflection-card time {
		display: inline-block;
		margin-top: 0.5rem;
		font-size: 0.75rem;
		opacity: 0.65;
		font-family: var(--font-body);
	}

	.empty-state {
		background: #f5f2ed;
		border-radius: var(--radius-input);
		padding: 0.95rem;
	}

	.empty-state p {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.9rem;
		line-height: 1.6;
	}

	.empty-state p + p {
		margin-top: 0.28rem;
		opacity: 0.72;
	}

	/* Emotional Overview */
	.mood-panel {
		background: #f5f2ed;
		border-radius: var(--radius-input);
		padding: 0.9rem;
	}

	.mood-indicators {
		display: flex;
		gap: 0.45rem;
		margin-bottom: 0.55rem;
	}

	.mood-dot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.6rem;
		height: 1.6rem;
		border-radius: var(--radius-pill);
		background: #e6e1d9;
		font-family: var(--font-heading);
		font-weight: 600;
		font-size: 0.82rem;
		color: #4a453f;
	}

	.mood-dot.muted {
		opacity: 0.55;
	}

	.mood-panel p {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.9rem;
		line-height: 1.62;
	}

	/* Support Bridge */
	.support-panel {
		background: #f2f0ec;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.support-panel p {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.94rem;
	}

	.support-panel a {
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 0.92rem;
		letter-spacing: -0.005em;
		opacity: 0.82;
	}

	/* Tablet and Desktop Adjustments */
	@media (min-width: 740px) {
		.portal-page {
			gap: 1.2rem;
			padding-top: 1.5rem;
		}

		.panel,
		.section-block {
			padding: 1.35rem;
		}

		.quick-actions {
			grid-template-columns: 1fr 1fr;
		}
	}

	/* Dark mode */
	:global(.dark) .panel,
	:global(.dark) .section-block {
		background: #1a1a1a;
	}

	:global(.dark) .welcome-panel {
		background: #1e1d1b;
	}

	:global(.dark) h1,
	:global(.dark) h2,
	:global(.dark) h3 {
		color: #f0eeea;
	}

	:global(.dark) .action {
		background: rgba(255, 255, 255, 0.06);
		color: #e8e4de;
	}

	:global(.dark) .action:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .action-primary {
		background: rgba(134, 223, 214, 0.1);
		color: #b8ece6;
	}

	:global(.dark) .action-primary:hover {
		background: rgba(134, 223, 214, 0.16);
	}

	:global(.dark) .reflection-card {
		background: rgba(255, 255, 255, 0.04);
	}

	:global(.dark) .reflection-card h3 {
		color: #f0eeea;
	}

	:global(.dark) .reflection-card p {
		color: rgba(255, 255, 255, 0.75);
	}

	:global(.dark) .reflection-card time {
		color: rgba(255, 255, 255, 0.5);
	}

	:global(.dark) .empty-state {
		background: rgba(255, 255, 255, 0.04);
	}

	:global(.dark) .empty-state p {
		color: rgba(255, 255, 255, 0.75);
	}

	:global(.dark) .mood-panel {
		background: rgba(255, 255, 255, 0.04);
	}

	:global(.dark) .mood-panel p {
		color: rgba(255, 255, 255, 0.75);
	}

	:global(.dark) .mood-dot {
		background: rgba(255, 255, 255, 0.1);
		color: #d4d0ca;
	}

	:global(.dark) .support-panel {
		background: #1e1d1b;
	}

	:global(.dark) .support-panel p {
		color: rgba(255, 255, 255, 0.75);
	}

	:global(.dark) .support-panel a {
		color: #86dfd6;
	}

	/* Theme accent (applied inline on panels) */
	.goal-panel {
		background: #f8f7f4;
	}
	.widget-panel {
		background: #f8f7f4;
	}
	.panel-kicker {
		font-family: var(--font-body);
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		opacity: 0.5;
		margin: 0 0 0.35rem;
	}
	.goal-label {
		font-family: var(--font-body);
		font-size: 0.97rem;
		font-weight: 500;
		color: #2f2a24;
		margin: 0 0 0.75rem;
		line-height: 1.4;
	}
	:global(.dark) .goal-label {
		color: #e8e4de;
	}
	.goal-progress {
		margin-bottom: 0.5rem;
	}
	.goal-bar-track {
		height: 6px;
		border-radius: 99px;
		background: rgba(0,0,0,0.08);
		overflow: hidden;
		margin-bottom: 0.45rem;
	}
	:global(.dark) .goal-bar-track {
		background: rgba(255,255,255,0.1);
	}
	.goal-bar-fill {
		height: 100%;
		border-radius: 99px;
		transition: width 0.6s ease;
	}
	.goal-status {
		font-family: var(--font-body);
		font-size: 0.88rem;
		opacity: 0.75;
		margin: 0;
	}
	.goal-sub {
		font-family: var(--font-body);
		font-size: 0.88rem;
		opacity: 0.6;
		margin: 0.3rem 0 0.85rem;
	}
	.goal-cta,
	.widget-cta {
		display: inline-block;
		padding: 0.5rem 1.1rem;
		border-radius: var(--radius-input, 8px);
		background: var(--theme-accent, #0f766e);
		color: #fff;
		font-family: var(--font-body);
		font-size: 0.88rem;
		font-weight: 600;
		text-decoration: none;
		transition: opacity 0.15s;
	}
	.goal-cta:hover,
	.widget-cta:hover {
		opacity: 0.85;
	}
	.widget-heading {
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 700;
		color: #2f2a24;
		margin: 0 0 0.3rem;
	}
	:global(.dark) .widget-heading {
		color: #e8e4de;
	}
	.widget-body {
		font-family: var(--font-body);
		font-size: 0.92rem;
		opacity: 0.75;
		margin: 0 0 0.8rem;
		line-height: 1.5;
	}

	/* Theme accent (applied inline on panels) */
	.goal-panel {
		background: #f8f7f4;
	}
	.widget-panel {
		background: #f8f7f4;
	}
	.panel-kicker {
		font-family: var(--font-body);
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		opacity: 0.5;
		margin: 0 0 0.35rem;
	}
	.goal-label {
		font-family: var(--font-body);
		font-size: 0.97rem;
		font-weight: 500;
		color: #2f2a24;
		margin: 0 0 0.75rem;
		line-height: 1.4;
	}
	:global(.dark) .goal-label {
		color: #e8e4de;
	}
	.goal-progress {
		margin-bottom: 0.5rem;
	}
	.goal-bar-track {
		height: 6px;
		border-radius: 99px;
		background: rgba(0,0,0,0.08);
		overflow: hidden;
		margin-bottom: 0.45rem;
	}
	:global(.dark) .goal-bar-track {
		background: rgba(255,255,255,0.1);
	}
	.goal-bar-fill {
		height: 100%;
		border-radius: 99px;
		transition: width 0.6s ease;
	}
	.goal-status {
		font-family: var(--font-body);
		font-size: 0.88rem;
		opacity: 0.75;
		margin: 0;
	}
	.goal-sub {
		font-family: var(--font-body);
		font-size: 0.88rem;
		opacity: 0.6;
		margin: 0.3rem 0 0.85rem;
	}
	.goal-cta,
	.widget-cta {
		display: inline-block;
		padding: 0.5rem 1.1rem;
		border-radius: var(--radius-input, 8px);
		background: var(--theme-accent, #0f766e);
		color: #fff;
		font-family: var(--font-body);
		font-size: 0.88rem;
		font-weight: 600;
		text-decoration: none;
		transition: opacity 0.15s;
	}
	.goal-cta:hover,
	.widget-cta:hover {
		opacity: 0.85;
	}
	.widget-heading {
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 700;
		color: #2f2a24;
		margin: 0 0 0.3rem;
	}
	:global(.dark) .widget-heading {
		color: #e8e4de;
	}
	.widget-body {
		font-family: var(--font-body);
		font-size: 0.92rem;
		opacity: 0.75;
		margin: 0 0 0.8rem;
		line-height: 1.5;
	}
	.prompt-panel {
		background: var(--theme-bg, rgba(15,118,110,0.07));
		border-left: 3px solid var(--theme-accent, #0f766e);
	}
	.prompt-question {
		font-size: 1.15rem;
		font-weight: 500;
		line-height: 1.5;
		margin: 0.3rem 0 0.4rem;
		color: var(--theme-accent, #0f766e);
	}
	.prompt-sub {
		font-size: 0.85rem;
		opacity: 0.6;
		margin-bottom: 0.6rem;
	}
	.prompt-cta {
		display: inline-block;
		padding: 0.45rem 1.2rem;
		border-radius: 8px;
		background: var(--theme-accent, #0f766e);
		color: #fff;
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		transition: opacity 0.2s;
	}
	.prompt-cta:hover {
		opacity: 0.85;
	}
	.checkin-link {
		display: block;
		text-align: center;
		margin-top: 0.5rem;
		font-size: 0.85rem;
		color: #888;
		text-decoration: none;
	}
	.checkin-link:hover {
		color: #6b8f71;
	}
	@media (prefers-color-scheme: dark) {
		.prompt-question { color: #a7d8c8; }
	}
</style>