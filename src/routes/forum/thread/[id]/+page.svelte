<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { supabase } from '$lib/supabase';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// ─── State ───────────────────────────────────────────────────────────────

	// Svar
	let replyBody = $state('');
	let replyAnonymous = $state(false);
	let replySubmitting = $state(false);
	let replyError = $state('');

	// Lokalt svarslista (uppdateras optimistiskt)
	type ReplyRow = {
		id: string;
		thread_id: string;
		user_id: string | null;
		body: string;
		is_anonymous: boolean;
		display_name: string | null;
		created_at: string;
		updated_at: string;
	};
	let localReplies = $state<ReplyRow[]>([]);

	// Redigering av tråd
	let editingThread = $state(false);
	let editThreadTitle = $state('');
	let editThreadBody = $state('');
	let editThreadSaving = $state(false);
	let editThreadError = $state('');

	// Redigering av svar
	let editingReplyId = $state<string | null>(null);
	let editReplyBody = $state('');
	let editReplySaving = $state(false);
	let editReplyError = $state('');

	// Delete-felmeddelande
	let deleteError = $state('');

	// Följ tråd
	let isFollowing = $state(false);
	let followLoading = $state(false);

	$effect(() => {
		localReplies = data.replies;
		editThreadTitle = data.thread.title;
		editThreadBody = data.thread.body;
		isFollowing = data.isFollowing;
	});

	async function toggleFollow() {
		if (!data.userId || followLoading) return;
		followLoading = true;
		const token = await getToken();
		if (!token) { followLoading = false; return; }
		const method = isFollowing ? 'DELETE' : 'POST';
		const res = await fetch('/api/forum/follows', {
			method,
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			body: JSON.stringify({ threadId: data.thread.id })
		});
		const json = await res.json();
		if (res.ok && json.success) isFollowing = json.following;
		followLoading = false;
	}

	// Rapport-modal
	type ReportTarget = { threadId?: string; replyId?: string; label: string };
	let reportTarget = $state<ReportTarget | null>(null);
	let reportReason = $state('');
	let reportDetails = $state('');
	let reportSending = $state(false);
	let reportSent = $state(false);
	let reportError = $state('');

	// ─── Hjälpfunktioner ─────────────────────────────────────────────────────

	function formatRelativeTime(dateStr: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMins < 1) return 'just nu';
		if (diffMins < 60) return `${diffMins} min sedan`;
		if (diffHours < 24) return `${diffHours} tim sedan`;
		if (diffDays === 1) return 'igår';
		if (diffDays < 7) return `${diffDays} dagar sedan`;
		return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function authorLabel(item: { is_anonymous: boolean; display_name: string | null }): string {
		if (item.is_anonymous) return 'Anonym';
		return item.display_name?.trim() || 'Namnlös';
	}

	async function getToken(): Promise<string | null> {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		return session?.access_token ?? null;
	}

	// ─── Svara ───────────────────────────────────────────────────────────────

	async function submitReply() {
		const body = replyBody.trim();
		if (!body) return;
		if (body.length < 1 || body.length > 2000) {
			replyError = 'Svaret måste vara mellan 1 och 2000 tecken.';
			return;
		}

		replySubmitting = true;
		replyError = '';

		const token = await getToken();
		if (!token) {
			replyError = 'Du måste vara inloggad för att svara.';
			replySubmitting = false;
			return;
		}

		const res = await fetch('/api/forum/replies', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				threadId: data.thread.id,
				body,
				isAnonymous: replyAnonymous
			})
		});

		const json = await res.json();

		if (!res.ok || !json.success) {
			replyError = json.error ?? 'Kunde inte skicka svaret. Försök igen.';
			replySubmitting = false;
			return;
		}

		localReplies = [...localReplies, json.reply as ReplyRow];
		replyBody = '';
		replyAnonymous = false;
		replySubmitting = false;
	}

	// ─── Redigera tråd ───────────────────────────────────────────────────────

	async function saveEditThread() {
		const title = editThreadTitle.trim();
		const body = editThreadBody.trim();
		if (title.length < 3) {
			editThreadError = 'Rubriken måste vara minst 3 tecken.';
			return;
		}
		if (body.length < 10) {
			editThreadError = 'Texten måste vara minst 10 tecken.';
			return;
		}

		editThreadSaving = true;
		editThreadError = '';

		const token = await getToken();
		if (!token) {
			editThreadError = 'Du måste vara inloggad.';
			editThreadSaving = false;
			return;
		}

		const res = await fetch('/api/forum/threads', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ id: data.thread.id, title, body })
		});

		const json = await res.json();
		editThreadSaving = false;

		if (!res.ok || !json.success) {
			editThreadError = json.error ?? 'Kunde inte spara ändringen.';
			return;
		}

		data.thread.title = json.thread.title;
		data.thread.body = json.thread.body;
		editingThread = false;
	}

	// ─── Radera tråd ─────────────────────────────────────────────────────────

	async function deleteThread() {
		if (!confirm('Är du säker på att du vill radera det här inlägget? Det går inte att ångra.')) return;

		deleteError = '';
		const token = await getToken();
		if (!token) {
			deleteError = 'Du verkar inte vara inloggad just nu. Ladda om sidan och försök igen.';
			return;
		}

		const res = await fetch('/api/forum/threads', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ id: data.thread.id })
		});

		if (res.ok) {
			window.location.href = `/forum/${data.thread.category_id}`;
		} else {
			let msg = 'Kunde inte radera inlägget.';
			try {
				const json = await res.json();
				if (typeof json.error === 'string') msg = json.error;
			} catch { /* ignore */ }
			deleteError = msg;
		}
	}

	// ─── Redigera svar ───────────────────────────────────────────────────────

	function startEditReply(reply: ReplyRow) {
		editingReplyId = reply.id;
		editReplyBody = reply.body;
		editReplyError = '';
	}

	function cancelEditReply() {
		editingReplyId = null;
		editReplyBody = '';
		editReplyError = '';
	}

	async function saveEditReply(replyId: string) {
		const body = editReplyBody.trim();
		if (!body) {
			editReplyError = 'Svaret kan inte vara tomt.';
			return;
		}

		editReplySaving = true;
		editReplyError = '';

		const token = await getToken();
		if (!token) {
			editReplyError = 'Du måste vara inloggad.';
			editReplySaving = false;
			return;
		}

		const res = await fetch('/api/forum/replies', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ id: replyId, body })
		});

		const json = await res.json();
		editReplySaving = false;

		if (!res.ok || !json.success) {
			editReplyError = json.error ?? 'Kunde inte spara ändringen.';
			return;
		}

		localReplies = localReplies.map((r) =>
			r.id === replyId ? { ...r, body: json.reply.body, updated_at: json.reply.updated_at } : r
		);
		editingReplyId = null;
	}

	// ─── Radera svar ─────────────────────────────────────────────────────────

	async function deleteReply(replyId: string) {
		if (!confirm('Vill du radera det här svaret?')) return;

		const token = await getToken();
		if (!token) return;

		const res = await fetch('/api/forum/replies', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ id: replyId })
		});

		if (res.ok) {
			localReplies = localReplies.filter((r) => r.id !== replyId);
		}
	}

	// ─── Rapportera ──────────────────────────────────────────────────────────

	function openReport(target: ReportTarget) {
		reportTarget = target;
		reportReason = '';
		reportDetails = '';
		reportSent = false;
		reportError = '';
	}

	function closeReport() {
		reportTarget = null;
		reportReason = '';
		reportDetails = '';
		reportSent = false;
	}

	async function submitReport() {
		if (!reportReason || !reportTarget) return;

		reportSending = true;
		reportError = '';

		const payload: Record<string, string> = { reason: reportReason };
		if (reportTarget.threadId) payload.threadId = reportTarget.threadId;
		if (reportTarget.replyId) payload.replyId = reportTarget.replyId;

		const headers: Record<string, string> = { 'Content-Type': 'application/json' };
		const token = await getToken();
		if (token) headers['Authorization'] = `Bearer ${token}`;

		const res = await fetch('/api/forum/reports', {
			method: 'POST',
			headers,
			body: JSON.stringify(payload)
		});

		const json = await res.json();
		reportSending = false;

		if (!res.ok || !json.success) {
			reportError = json.error ?? 'Kunde inte skicka rapporten.';
			return;
		}

		reportSent = true;
	}

	const REPLY_MAX = 2000;
</script>

<SEO canonical={`https://www.mittpsyke.se/forum/thread/${data.thread.id}`} />

<svelte:head>
	<title>{data.thread.title} – {data.category.name} | MittPsyke Forum</title>
	<meta name="description" content={data.description} />
	<meta property="og:title" content="{data.thread.title} – {data.category.name} | MittPsyke Forum" />
	<meta property="og:description" content={data.description} />
	<meta property="og:url" content="https://www.mittpsyke.se/forum/thread/{data.thread.id}" />
	<meta property="og:type" content="article" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "DiscussionForumPosting",
		"headline": data.thread.title,
		"text": data.description,
		"datePublished": data.thread.created_at,
		"dateModified": data.thread.updated_at,
		"author": {
			"@type": "Person",
			"name": data.thread.is_anonymous ? "Anonym" : (data.thread.display_name ?? "Okänd")
		},
		"url": "https://www.mittpsyke.se/forum/thread/" + data.thread.id,
		"isPartOf": {
			"@type": "CollectionPage",
			"name": data.category.name,
			"url": "https://www.mittpsyke.se/forum/" + data.category.id
		}
	})}<\/script>`}
</svelte:head>

<!-- Rapport-modal -->
{#if reportTarget}
	<div
		class="modal-backdrop"
		role="dialog"
		aria-modal="true"
		aria-label="Rapportera innehåll"
		onclick={(e) => { if (e.target === e.currentTarget) closeReport(); }}
		onkeydown={(e) => { if (e.key === 'Escape') closeReport(); }}
		tabindex="-1"
	>
		<div class="modal">
			{#if reportSent}
				<p class="modal__sent">Tack – din rapport har tagits emot.</p>
				<button class="btn btn--secondary" onclick={closeReport}>Stäng</button>
			{:else}
				<h2 class="modal__title">Rapportera innehåll</h2>
				<p class="modal__sub">Välj orsak nedan. Din rapport behandlas diskret.</p>

				{#if reportError}
					<p class="modal__error">{reportError}</p>
				{/if}

				<fieldset class="report-reasons">
					<legend class="sr-only">Rapportorsak</legend>
					{#each [
						{ value: 'offensive', label: 'Olämpligt innehåll' },
						{ value: 'crisis', label: 'Skadligt innehåll' },
						{ value: 'spam', label: 'Spam' }
					] as opt}
						<label class="report-reason-option">
							<input
								type="radio"
								name="report-reason"
								value={opt.value}
								bind:group={reportReason}
							/>
							{opt.label}
						</label>
					{/each}
				</fieldset>

				<div class="modal__actions">
					<button
						class="btn btn--primary"
						disabled={!reportReason || reportSending}
						onclick={submitReport}
					>
						{reportSending ? 'Skickar...' : 'Skicka rapport'}
					</button>
					<button class="btn btn--ghost" onclick={closeReport}>Avbryt</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<div class="thread-page">
	<!-- Breadcrumb -->
	<nav class="breadcrumb" aria-label="Brödsmulor">
		<a href="/forum" class="breadcrumb__link">Forum</a>
		<span class="breadcrumb__sep" aria-hidden="true">›</span>
		<a href="/forum/{data.category.id}" class="breadcrumb__link">
			{data.category.icon} {data.category.name}
		</a>
	</nav>

	<!-- Originalinlägg -->
	<article class="thread-post">
		{#if editingThread}
			<!-- Redigeringsläge för tråden -->
			<div class="edit-form">
				{#if editThreadError}
					<p class="edit-form__error">{editThreadError}</p>
				{/if}
				<input
					type="text"
					bind:value={editThreadTitle}
					maxlength="200"
					class="form-input"
					aria-label="Rubrik"
				/>
				<textarea
					bind:value={editThreadBody}
					rows="7"
					class="form-textarea"
					aria-label="Inläggstext"
				></textarea>
				<div class="edit-form__actions">
					<button class="btn btn--primary btn--sm" disabled={editThreadSaving} onclick={saveEditThread}>
						{editThreadSaving ? 'Sparar...' : 'Spara'}
					</button>
					<button class="btn btn--ghost btn--sm" onclick={() => { editingThread = false; editThreadError = ''; }}>
						Avbryt
					</button>
				</div>
			</div>
		{:else}
			<h1 class="thread-post__title">{data.thread.title}</h1>
			<div class="thread-post__meta">
				<span class="post-author">{authorLabel(data.thread)}</span>
				<span class="post-sep" aria-hidden="true">·</span>
				<time datetime={data.thread.created_at}>
					{formatRelativeTime(data.thread.created_at)}
				</time>
				{#if data.thread.created_at !== data.thread.updated_at}
					<span class="post-edited">(redigerat)</span>
				{/if}
			</div>
			<div class="thread-post__body">
				{#each data.thread.body.split('\n') as paragraph}
					{#if paragraph.trim()}
						<p>{paragraph}</p>
					{/if}
				{/each}
			</div>
			{#if deleteError}
			<p class="delete-error" role="alert">{deleteError}</p>
		{/if}
		<div class="thread-post__actions">
				{#if data.userId}
					<button
						class="action-btn"
						class:action-btn--following={isFollowing}
						onclick={toggleFollow}
						disabled={followLoading}
						title={isFollowing ? 'Sluta följa denna tråd' : 'Få notis när någon svarar'}
					>
						{followLoading ? '…' : isFollowing ? 'Följer' : 'Följ tråd'}
					</button>
				{/if}
				{#if data.userId && data.thread.user_id === data.userId}
					<button
						class="action-btn action-btn--edit"
						onclick={() => { editingThread = true; editThreadTitle = data.thread.title; editThreadBody = data.thread.body; }}
					>
						Redigera
					</button>
					<button class="action-btn action-btn--delete" onclick={deleteThread}>Radera</button>
				{/if}
				<button
					class="action-btn action-btn--report"
					aria-label="Rapportera inlägget"
					onclick={() => openReport({ threadId: data.thread.id, label: 'inlägget' })}
				>
					<svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2a1 1 0 0 1 1-1h8.586A1 1 0 0 1 13.293 2.707L10.414 5.586 13.293 8.464A1 1 0 0 1 12.586 10H4v4a1 1 0 0 1-2 0V3z"/></svg>
					Rapportera
				</button>
			</div>
		{/if}
	</article>

	<!-- Svar -->
	<section class="replies-section" aria-label="Svar">
		<h2 class="replies-heading">
			{localReplies.length === 0
				? 'Inga svar än'
				: localReplies.length === 1
					? '1 svar'
					: `${localReplies.length} svar`}
		</h2>

		{#if localReplies.length > 0}
			<ol class="replies-list" role="list">
				{#each localReplies as reply (reply.id)}
					<li class="reply-item">
						{#if editingReplyId === reply.id}
							<div class="edit-form">
								{#if editReplyError}
									<p class="edit-form__error">{editReplyError}</p>
								{/if}
								<textarea
									bind:value={editReplyBody}
									rows="4"
									maxlength={REPLY_MAX}
									class="form-textarea"
									aria-label="Svarstext"
								></textarea>
								<div class="edit-form__actions">
									<button
										class="btn btn--primary btn--sm"
										disabled={editReplySaving}
										onclick={() => saveEditReply(reply.id)}
									>
										{editReplySaving ? 'Sparar...' : 'Spara'}
									</button>
									<button class="btn btn--ghost btn--sm" onclick={cancelEditReply}>Avbryt</button>
								</div>
							</div>
						{:else}
							<div class="reply-meta">
								<span class="post-author">{authorLabel(reply)}</span>
								<span class="post-sep" aria-hidden="true">·</span>
								<time datetime={reply.created_at}>{formatRelativeTime(reply.created_at)}</time>
								{#if reply.updated_at !== reply.created_at}
									<span class="post-edited">(redigerat)</span>
								{/if}
							</div>
							<div class="reply-body">
								{#each reply.body.split('\n') as paragraph}
									{#if paragraph.trim()}
										<p>{paragraph}</p>
									{/if}
								{/each}
							</div>
							<div class="reply-actions">
								{#if data.userId && reply.user_id === data.userId}
									<button
										class="action-btn action-btn--edit"
										onclick={() => startEditReply(reply)}
									>
										Redigera
									</button>
									<button
										class="action-btn action-btn--delete"
										onclick={() => deleteReply(reply.id)}
									>
										Radera
									</button>
								{/if}
								<button
									class="action-btn action-btn--report"
									aria-label="Rapportera svaret"
									onclick={() => openReport({ replyId: reply.id, label: 'svaret' })}
								>
									<svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2a1 1 0 0 1 1-1h8.586A1 1 0 0 1 13.293 2.707L10.414 5.586 13.293 8.464A1 1 0 0 1 12.586 10H4v4a1 1 0 0 1-2 0V3z"/></svg>
									Rapportera
								</button>
							</div>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}
	</section>

	<!-- Svarsformulär -->
	{#if data.userId}
		<section class="reply-form-section" aria-label="Skriv ett svar">
			<h2 class="reply-form-heading">Skriv ett svar</h2>
			{#if replyError}
				<p class="reply-form-error" role="alert">{replyError}</p>
			{/if}
			<div class="reply-form">
				<textarea
					bind:value={replyBody}
					rows="4"
					maxlength={REPLY_MAX}
					placeholder="Dela en tanke, ett ord av igenkänning eller ett varsamt svar..."
					class="form-textarea"
					aria-label="Ditt svar"
				></textarea>
				<p class="form-hint">{replyBody.length}/{REPLY_MAX}</p>
				<label class="toggle-label">
					<input type="checkbox" bind:checked={replyAnonymous} class="toggle-checkbox" />
					<span class="toggle-text">Svara anonymt</span>
				</label>
				<p class="form-disclaimer">
					Forumet ersätter inte vård. Vid akut kris – ring 112 eller kontakta
					<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer"
						>Stödlinjer.se</a
					>.
				</p>
				<button
					class="btn btn--primary"
					disabled={replySubmitting || replyBody.trim().length === 0}
					onclick={submitReply}
				>
					{replySubmitting ? 'Skickar...' : 'Skicka svar'}
				</button>
			</div>
		</section>
	{:else}
		<div class="reply-login-prompt">
			<p>
				<a href="/login?redirect=/forum/thread/{data.thread.id}" class="login-link"
					>Logga in</a
				> för att svara i det här samtalsrummet.
			</p>
		</div>
	{/if}
</div>

<style>
	.thread-page {
		max-width: 44rem;
		margin: 0 auto;
		padding: 2rem 1.25rem 4rem;
	}

	/* Breadcrumb */
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.breadcrumb__link {
		color: var(--primary);
		text-decoration: none;
	}

	.breadcrumb__link:hover {
		text-decoration: underline;
	}

	.breadcrumb__sep {
		opacity: 0.5;
	}

	/* Originalinlägg */
	.thread-post {
		background: hsl(var(--surface));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		padding: 1.375rem 1.5rem;
		margin-bottom: 2rem;
	}

	.thread-post__title {
		font-family: var(--font-heading);
		font-size: clamp(1.25rem, 3.5vw, 1.625rem);
		font-weight: 700;
		color: hsl(var(--foreground));
		line-height: 1.3;
		margin-bottom: 0.625rem;
	}

	.thread-post__meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.thread-post__body {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		margin-bottom: 1.125rem;
	}

	.thread-post__body p,
	.reply-body p {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.7;
		color: hsl(var(--foreground));
	}

	.thread-post__actions,
	.reply-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	/* Gemensamma postelement */
	.post-author {
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.post-sep {
		opacity: 0.4;
	}

	.post-edited {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		opacity: 0.7;
	}

	.delete-error {
		font-size: 0.875rem;
		color: hsl(var(--error-foreground));
		background: hsl(var(--error-surface));
		border-radius: var(--radius-input);
		padding: 0.5rem 0.75rem;
		margin-bottom: 0.5rem;
	}

	/* Action-knappar */
	.action-btn {
		font-size: 0.8rem;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-pill);
		border: 1px solid transparent;
		background: transparent;
		cursor: pointer;
		transition: background 0.12s, color 0.12s;
		color: hsl(var(--muted-foreground));
	}

	.action-btn--following {
		color: hsl(var(--primary, 160 60% 35%));
		border-color: currentColor;
		opacity: 0.85;
	}

	.action-btn:hover {
		background: hsl(var(--surface-muted));
		color: hsl(var(--foreground));
	}

	.action-btn--delete:hover {
		background: hsl(var(--error-surface));
		color: hsl(var(--error-foreground));
		border-color: hsl(var(--error-foreground) / 0.2);
	}

	.action-btn--report {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		opacity: 0.65;
	}

	/* Svar */
	.replies-section {
		margin-bottom: 2rem;
	}

	.replies-heading {
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 1rem;
	}

	.replies-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.reply-item {
		background: hsl(var(--surface));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		padding: 1rem 1.25rem;
	}

	.reply-meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}

	.reply-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.625rem;
	}

	/* Redigera-formulär */
	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.edit-form__error {
		font-size: 0.875rem;
		color: hsl(var(--error-foreground));
		margin: 0;
	}

	.edit-form__actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	/* Svarsformulär */
	.reply-form-section {
		background: hsl(var(--surface));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		padding: 1.375rem 1.5rem;
	}

	.reply-form-heading {
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 0.875rem;
	}

	.reply-form-error {
		font-size: 0.875rem;
		color: hsl(var(--error-foreground));
		background: hsl(var(--error-surface));
		border-radius: var(--radius-input);
		padding: 0.5rem 0.75rem;
		margin-bottom: 0.75rem;
	}

	.reply-form {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.reply-login-prompt {
		background: hsl(var(--surface));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		padding: 1.25rem 1.5rem;
		text-align: center;
		font-size: 0.9375rem;
		color: hsl(var(--muted-foreground));
	}

	.login-link {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.modal {
		background: hsl(var(--surface));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		padding: 1.5rem;
		max-width: 26rem;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.modal__title {
		font-family: var(--font-heading);
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.modal__sub {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.modal__sent {
		font-size: 0.9375rem;
		color: hsl(var(--success-foreground));
		margin: 0;
	}

	.modal__error {
		font-size: 0.875rem;
		color: hsl(var(--error-foreground));
		margin: 0;
	}

	.modal__actions {
		display: flex;
		gap: 0.625rem;
		align-items: center;
	}

	/* Rapport-alternativ */
	.report-reasons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border: none;
		padding: 0;
		margin: 0;
	}

	.report-reason-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: hsl(var(--foreground));
		cursor: pointer;
	}

	.report-reason-option input {
		accent-color: var(--primary);
		cursor: pointer;
	}

	/* Gemensamma formulärelement */
	.form-input,
	.form-textarea {
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-input);
		padding: 0.5625rem 0.75rem;
		font-size: 0.9375rem;
		color: hsl(var(--foreground));
		font-family: var(--font-body);
		width: 100%;
		transition: border-color 0.15s;
	}

	.form-textarea {
		resize: vertical;
		min-height: 6rem;
		line-height: 1.6;
	}

	.form-input:focus,
	.form-textarea:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
	}

	.form-hint {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		cursor: pointer;
	}

	.toggle-checkbox {
		width: 1.0625rem;
		height: 1.0625rem;
		flex-shrink: 0;
		accent-color: var(--primary);
		cursor: pointer;
	}

	.toggle-text {
		font-size: 0.9rem;
		color: hsl(var(--foreground));
	}

	.form-disclaimer {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.55;
		margin: 0;
		border-top: 1px solid hsl(var(--border));
		padding-top: 0.5rem;
	}

	.form-disclaimer a {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* Knappar */
	.btn {
		display: inline-flex;
		align-items: center;
		font-size: 0.9375rem;
		font-weight: 500;
		padding: 0.5rem 1.25rem;
		border-radius: var(--radius-pill);
		text-decoration: none;
		transition: opacity 0.15s, background 0.15s;
		cursor: pointer;
		border: none;
		line-height: 1.5;
	}

	.btn--sm {
		font-size: 0.875rem;
		padding: 0.375rem 0.875rem;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn--primary {
		background: var(--primary);
		color: #fff;
	}

	.btn--primary:hover:not(:disabled) {
		opacity: 0.88;
	}

	.btn--secondary {
		background: hsl(var(--surface-muted));
		border: 1px solid hsl(var(--border));
		color: hsl(var(--foreground));
	}

	.btn--secondary:hover {
		background: hsl(var(--surface));
	}

	.btn--ghost {
		background: transparent;
		color: hsl(var(--muted-foreground));
		padding-left: 0.5rem;
		padding-right: 0.5rem;
	}

	.btn--ghost:hover {
		color: hsl(var(--foreground));
	}

	/* Hjälpmedel */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
