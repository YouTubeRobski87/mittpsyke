<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { User } from '@supabase/supabase-js';
	import { supabase } from '$lib/supabase';
	import { loadDiaryEntries, type DiaryEntry } from '$lib/state/diary';
	import { getPortalByKey } from '$lib/data/portals';

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
		const candidateKeys = ['given_name', 'first_name', 'full_name', 'name'];

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

<main class="portal-page container">
	{#if loading}
		<p class="loading-copy">Laddar din portal...</p>
	{:else}
		<!-- Welcome Section -->
		<section class="panel welcome-panel">
			<p class="welcome-kicker">Min portal</p>
			<h1>Hej {firstName}</h1>
			<p class="welcome-subtitle">Hur k&auml;nns det idag? Du kan ta allt i din egen takt.</p>
		</section>

		<!-- Quick Actions Section -->
		<section class="section-block">
			<h2>Snabba val</h2>
			<div class="quick-actions">
				<a class="action action-primary" href="/dagbok">B&ouml;rja skriva</a>
				<a class="action action-secondary" href={continueChatHref}>
					Forts&auml;tt senaste samtal
					<span>{continuePortal ? continuePortal.title : 'Samtal'}</span>
				</a>
			</div>

			<div class="conversation-history">
				<h3>Senaste samtal</h3>
				{#if recentConversations.length === 0}
					<p class="conversation-empty">Inga tidigare samtal &auml;n.</p>
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
				<a href="/dagbok">&Ouml;ppna dagbok</a>
			</div>

			{#if reflectionPreview.length === 0}
				<div class="empty-state">
					<p>Du har inga sparade reflektioner &auml;nnu.</p>
					<p>N&auml;r du skriver f&ouml;rsta g&aring;ngen visas dina senaste anteckningar h&auml;r.</p>
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
			<h2>K&auml;nslo&ouml;versikt</h2>
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
			<p>Beh&ouml;ver du prata med n&aring;gon direkt?</p>
			<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">&Ouml;ppna St&ouml;dlinjer</a>
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
		border-radius: 14px;
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

	.welcome-kicker {
		margin: 0 0 0.35rem;
		font-size: 0.76rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		opacity: 0.65;
		font-family: var(--font-body);
	}

	h1,
	h2,
	h3 {
		font-family: var(--font-heading);
		color: #2f2a24;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.6rem, 4.3vw, 2.1rem);
		line-height: 1.2;
	}

	.welcome-subtitle {
		margin: 0.5rem 0 0;
		font-size: 0.98rem;
		line-height: 1.65;
		max-width: 46ch;
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
		border-radius: 14px;
		padding: 0.85rem 1rem;
		font-family: var(--font-heading);
		font-size: 0.95rem;
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
		border-radius: 14px;
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
		border-radius: 12px;
		padding: 0.85rem 0.9rem;
	}

	.reflection-card h3 {
		margin: 0;
		font-size: 0.95rem;
	}

	.reflection-card p {
		margin: 0.38rem 0 0;
		font-size: 0.9rem;
		line-height: 1.62;
		font-family: var(--font-body);
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
		border-radius: 12px;
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
		border-radius: 12px;
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
		border-radius: 999px;
		background: #e6e1d9;
		font-family: var(--font-heading);
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
		font-size: 0.92rem;
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
</style>
