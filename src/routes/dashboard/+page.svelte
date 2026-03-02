<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { User } from '@supabase/supabase-js';
	import { supabase } from '$lib/supabase';
	import { loadDiaryEntries, type DiaryEntry } from '$lib/state/diary';
	import { getPortalByKey } from '$lib/data/portals';

	let loading = $state(true);
	let firstName = $state('du');
	let latestEntries = $state<DiaryEntry[]>([]);
	let lastChatCategory = $state('a');

	const continueChatHref = $derived(`/chat/${lastChatCategory}`);
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
			}

			const { data: profile } = await supabase
				.from('profiles')
				.select('display_name')
				.eq('id', session.user.id)
				.maybeSingle();

			const resolvedName = pickUserName(session.user, (profile?.display_name as string | null) ?? null);
			const nextEntries = await loadDiaryEntries(session.user.id);

			if (!alive) return;

			firstName = extractFirstName(resolvedName);
			latestEntries = nextEntries;
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
