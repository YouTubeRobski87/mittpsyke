<script lang="ts">
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';
	import { supabase } from '$lib/supabase';
	import type { CreateCommunityUnshareSuccessResponse } from '$lib/types';

	type CommunityPost = {
		id: string;
		content: string;
		mood: string | null;
		created_at: string | null;
		isOwnPost: boolean;
		diaryEntryId: string | null;
	};

	let { data }: { data: { posts?: CommunityPost[] } } = $props();
	let posts = $state<CommunityPost[]>([...(data.posts ?? [])]);
	let confirmingUnsharePostId = $state('');
	let unsharingPostId = $state('');
	let feedNotice = $state('');
	let feedNoticeType = $state<'success' | 'error' | 'info'>('info');

	function formatPublishedAt(value: string | null): string {
		if (!value) return 'Nyligen';

		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return 'Nyligen';

		const diffMs = Date.now() - date.getTime();
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

		if (diffMinutes < 1) return 'Nyss';
		if (diffMinutes < 60) return `för ${diffMinutes} minuter sedan`;
		if (diffHours < 24) return `för ${diffHours} timmar sedan`;

		return date.toLocaleDateString('sv-SE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatMoodLabel(value: string | null): string {
		if (!value) return '';
		const mood = Number(value);
		if (Number.isFinite(mood) && mood >= 1 && mood <= 10) {
			return `Humör ${Math.round(mood)}/10`;
		}
		return '';
	}

	function setFeedNotice(message: string, type: 'success' | 'error' | 'info') {
		feedNotice = message;
		feedNoticeType = type;
	}

	function openUnshareConfirmation(postId: string) {
		confirmingUnsharePostId = postId;
		feedNotice = '';
	}

	function closeUnshareConfirmation() {
		if (unsharingPostId) return;
		confirmingUnsharePostId = '';
	}

	async function unsharePost(post: CommunityPost) {
		if (!post.isOwnPost || !post.diaryEntryId || unsharingPostId) return;

		unsharingPostId = post.id;
		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();

			if (!session?.access_token) {
				setFeedNotice('Logga in för att ta bort delningen.', 'error');
				return;
			}

			const response = await fetch('/api/community/unshare', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`
				},
				body: JSON.stringify({ diaryEntryId: post.diaryEntryId })
			});

			const payload = (await response.json().catch(() => null)) as
				| CreateCommunityUnshareSuccessResponse
				| { success?: boolean; error?: string; alreadyUnshared?: boolean }
				| null;

			if (!response.ok || !payload) {
				const errorPayload = payload as { error?: string; alreadyUnshared?: boolean } | null;
				if (response.status === 409 && errorPayload?.alreadyUnshared) {
					posts = posts.filter((item) => item.id !== post.id);
					setFeedNotice('Delningen är redan borttagen från Gemenskap.', 'info');
					confirmingUnsharePostId = '';
					return;
				}
				if (response.status === 404) {
					posts = posts.filter((item) => item.id !== post.id);
					setFeedNotice('Delningen finns inte längre i Gemenskap.', 'info');
					confirmingUnsharePostId = '';
					return;
				}
				setFeedNotice(errorPayload?.error ?? 'Kunde inte ta bort delningen just nu.', 'error');
				return;
			}

			if (!payload.success) {
				setFeedNotice('Kunde inte ta bort delningen just nu.', 'error');
				return;
			}

			posts = posts.filter((item) => item.id !== post.id);
			setFeedNotice('Delningen har tagits bort från Gemenskap.', 'success');
			confirmingUnsharePostId = '';
		} catch (error) {
			setFeedNotice(
				error instanceof Error ? error.message : 'Kunde inte ta bort delningen just nu.',
				'error'
			);
		} finally {
			unsharingPostId = '';
		}
	}
</script>

<main class="auth-page">
	<PortalSubnav
		active="gemenskap"
		title="Du är inte ensam"
		description="En lugn plats där du kan dela tankar anonymt, känna igen dig i andra och ge eller få mjuk bekräftelse."
	/>

	<div class="auth-shell community-page">
		<section class="auth-panel auth-panel-accent info-panel" aria-label="Viktig information">
			<h2>Innan du delar</h2>
			<ul>
				<li>Det du delar här ska vara anonymt.</li>
				<li>Skriv inte ut namn, personnummer, adresser eller andra personuppgifter.</li>
				<li>Gemenskapen är ett stöd mellan människor, inte vård eller akut hjälp.</li>
				<li>
					Vid akut fara: ring 112 eller kontakta 1177. Vidare stöd finns på
					<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">stodlinjer.se</a>.
				</li>
			</ul>
		</section>

		{#if posts.length > 0}
			<section class="auth-panel feed-panel">
				<h2>Delningar i lugn takt</h2>
				{#if feedNotice}
					<p class="feed-notice {feedNoticeType}">{feedNotice}</p>
				{/if}
				<div class="community-feed">
					{#each posts as post (post.id)}
						<article class="community-post">
							<div class="community-post-head">
								<p class="voice">Anonym röst</p>
								{#if formatMoodLabel(post.mood)}
									<p class="mood-tag">{formatMoodLabel(post.mood)}</p>
								{/if}
							</div>
							<p class="content">{post.content}</p>
							<p class="published">{formatPublishedAt(post.created_at)}</p>
							{#if post.isOwnPost}
								<div class="post-actions">
									<p class="own-post-label">Din delning</p>
									<button
										type="button"
										class="post-action-btn"
										onclick={() => openUnshareConfirmation(post.id)}
									>
										Ta bort delning
									</button>
								</div>

								{#if confirmingUnsharePostId === post.id}
									<div class="post-confirmation" role="status">
										<h3>Ta bort delning?</h3>
										<p>
											Det här tar bort den anonyma versionen från Gemenskap.
											Ditt privata dagboksinlägg finns kvar i Dagbok.
										</p>
										<div class="post-confirmation-actions">
											<button
												type="button"
												class="auth-button"
												onclick={closeUnshareConfirmation}
												disabled={unsharingPostId === post.id}
											>
												Avbryt
											</button>
											<button
												type="button"
												class="auth-button primary"
												onclick={() => unsharePost(post)}
												disabled={unsharingPostId === post.id}
											>
												{unsharingPostId === post.id ? 'Tar bort...' : 'Ta bort delning'}
											</button>
										</div>
									</div>
								{/if}
							{/if}
						</article>
					{/each}
				</div>
			</section>
		{:else}
			<section class="auth-panel empty-panel">
				<h2>Här kommer gemenskapens inlägg att visas</h2>
				<p>
					Här kan anonyma delningar från användare samlas i lugn takt. Du kommer senare kunna dela en
					egen tanke eller välja att dela ett dagboksinlägg anonymt.
				</p>

				<div class="empty-actions">
					<a href="/dagbok" class="auth-button primary">Dela en tanke</a>
					<a href="/dagbok" class="auth-button">Öppna dagboken</a>
				</div>
			</section>
		{/if}

		<section class="auth-panel future-panel">
			<h2>Kommer i nästa steg</h2>
			<div class="future-list" role="list">
				<p role="listitem">Dela anonymt från dagboken</p>
				<p role="listitem">Mjuka stödreaktioner</p>
				<p role="listitem">Korta anonyma svar</p>
				<p role="listitem">Rapportera innehåll</p>
			</div>
		</section>

		{#if posts.length === 0}
			<section class="auth-panel sample-panel">
				<h2>Exempel från gemenskapen</h2>
				<div class="sample-list">
					<article class="sample-card">
						<p class="sample-label">Anonym röst</p>
						<p>“Idag känns allt lite tyngre än vanligt, men jag försöker ta en stund i taget.”</p>
					</article>
					<article class="sample-card">
						<p class="sample-label">Anonym röst</p>
						<p>“Jag vet inte riktigt vad jag känner, men det hjälpte att bara skriva ner något.”</p>
					</article>
				</div>
			</section>
		{/if}
	</div>
</main>

<style>
	.community-page {
		padding-top: 0.2rem;
		gap: 0.9rem;
	}

	.info-panel h2,
	.empty-panel h2,
	.future-panel h2,
	.sample-panel h2 {
		margin: 0;
		font-size: 1.03rem;
	}

	.info-panel ul {
		margin: 0.7rem 0 0;
		padding-left: 1rem;
		display: grid;
		gap: 0.4rem;
	}

	.info-panel li {
		color: hsl(var(--foreground));
	}

	.info-panel a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.feed-panel h2 {
		margin: 0;
		font-size: 1.03rem;
	}

	.feed-notice {
		margin: 0.7rem 0 0;
		padding: 0.65rem 0.75rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
		font-size: 0.86rem;
	}

	.feed-notice.success {
		color: hsl(var(--success-foreground));
	}

	.feed-notice.error {
		color: hsl(var(--error-foreground));
	}

	.feed-notice.info {
		color: hsl(var(--muted-foreground));
	}

	.community-feed {
		margin-top: 0.75rem;
		display: grid;
		gap: 0.65rem;
	}

	.community-post {
		padding: 0.78rem 0.82rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-muted));
	}

	.community-post-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem;
	}

	.voice {
		margin: 0;
		font-size: 0.81rem;
		color: hsl(var(--muted-foreground));
	}

	.mood-tag {
		margin: 0;
		padding: 0.2rem 0.45rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-pill);
		background: hsl(var(--surface));
		font-size: 0.72rem;
		color: hsl(var(--muted-foreground));
	}

	.content {
		margin: 0.45rem 0 0;
		white-space: pre-wrap;
		line-height: 1.6;
		color: hsl(var(--foreground));
	}

	.published {
		margin: 0.45rem 0 0;
		font-size: 0.77rem;
		color: hsl(var(--muted-foreground));
	}

	.post-actions {
		margin-top: 0.65rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem 0.65rem;
	}

	.own-post-label {
		margin: 0;
		font-size: 0.77rem;
		color: hsl(var(--muted-foreground));
	}

	.post-action-btn {
		border: 0;
		background: transparent;
		padding: 0;
		font-size: 0.8rem;
		color: hsl(var(--muted-foreground));
		text-decoration: underline;
		text-underline-offset: 2px;
		cursor: pointer;
	}

	.post-action-btn:hover {
		color: hsl(var(--foreground));
	}

	.post-confirmation {
		margin-top: 0.65rem;
		padding: 0.7rem 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-input);
		background: hsl(var(--surface-soft));
	}

	.post-confirmation h3 {
		margin: 0;
		font-size: 0.92rem;
	}

	.post-confirmation p {
		margin: 0.45rem 0 0;
		font-size: 0.84rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.55;
	}

	.post-confirmation-actions {
		margin-top: 0.7rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.empty-panel p {
		margin: 0.55rem 0 0;
		color: hsl(var(--muted-foreground));
		max-width: 66ch;
	}

	.empty-actions {
		margin-top: 1rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.future-list {
		margin-top: 0.75rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
		gap: 0.55rem;
	}

	.future-list p {
		margin: 0;
		padding: 0.65rem 0.7rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-input);
		background: hsl(var(--surface-soft));
		color: hsl(var(--foreground));
		font-size: 0.9rem;
	}

	.sample-list {
		margin-top: 0.75rem;
		display: grid;
		gap: 0.6rem;
	}

	.sample-card {
		padding: 0.75rem 0.8rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-muted));
	}

	.sample-card p {
		margin: 0;
	}

	.sample-label {
		font-size: 0.8rem;
		color: hsl(var(--muted-foreground));
	}

	.sample-card p:last-child {
		margin-top: 0.35rem;
		color: hsl(var(--foreground));
		line-height: 1.6;
	}
</style>
