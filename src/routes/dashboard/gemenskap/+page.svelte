<script lang="ts">
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';
	import { supabase } from '$lib/supabase';
	import type {
		CreateCommunityCommentSuccessResponse,
		CreateCommunityUnshareSuccessResponse
	} from '$lib/types';

	const COMMENT_MAX_LENGTH = 280;
	const REPORT_REASONS = ['Olämpligt innehåll', 'Skadligt eller störande', 'Annat'] as const;
	type ReportReason = (typeof REPORT_REASONS)[number];
	type ReportContentType = 'post' | 'comment';

	type CommunityComment = {
		id: string;
		postId: string;
		body: string;
		created_at: string | null;
	};

	type CommunityPost = {
		id: string;
		content: string;
		mood: string | null;
		created_at: string | null;
		isOwnPost: boolean;
		diaryEntryId: string | null;
		comments: CommunityComment[];
	};

	let { data }: { data: { posts?: CommunityPost[] } } = $props();
	const initialPosts = $derived(data.posts ?? []);
	let posts = $state<CommunityPost[]>([]);
	let confirmingUnsharePostId = $state('');
	let unsharingPostId = $state('');
	let openCommentsByPostId = $state<Record<string, boolean>>({});
	let commentDraftByPostId = $state<Record<string, string>>({});
	let commentFeedbackByPostId = $state<
		Record<string, { message: string; type: 'success' | 'error' | 'info' }>
	>({});
	let commentingPostId = $state('');
	let openReportTargetKey = $state('');
	let reportReasonByTargetKey = $state<Record<string, ReportReason>>({});
	let reportFeedbackByTargetKey = $state<
		Record<string, { message: string; type: 'success' | 'error' | 'info' }>
	>({});
	let reportingTargetKey = $state('');
	let feedNotice = $state('');
	let feedNoticeType = $state<'success' | 'error' | 'info'>('info');

	$effect(() => {
		posts = [...initialPosts];
	});

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

	function isCommentsOpen(postId: string): boolean {
		return openCommentsByPostId[postId] === true;
	}

	function toggleComments(postId: string) {
		const nextIsOpen = !isCommentsOpen(postId);
		openCommentsByPostId = {
			...openCommentsByPostId,
			[postId]: nextIsOpen
		};
	}

	function getCommentDraft(postId: string): string {
		return commentDraftByPostId[postId] ?? '';
	}

	function updateCommentDraft(postId: string, value: string) {
		commentDraftByPostId = {
			...commentDraftByPostId,
			[postId]: value.slice(0, COMMENT_MAX_LENGTH)
		};
	}

	function setCommentFeedback(
		postId: string,
		message: string,
		type: 'success' | 'error' | 'info'
	) {
		commentFeedbackByPostId = {
			...commentFeedbackByPostId,
			[postId]: { message, type }
		};
	}

	function clearCommentFeedback(postId: string) {
		if (!commentFeedbackByPostId[postId]) return;
		const nextFeedback = { ...commentFeedbackByPostId };
		delete nextFeedback[postId];
		commentFeedbackByPostId = nextFeedback;
	}

	function commentCountLabel(count: number): string {
		if (count <= 0) return '';
		return count === 1 ? '1 svar' : `${count} svar`;
	}

	function reportTargetKey(contentType: ReportContentType, contentId: string): string {
		return `${contentType}:${contentId}`;
	}

	function openReportPanel(contentType: ReportContentType, contentId: string) {
		const key = reportTargetKey(contentType, contentId);
		openReportTargetKey = key;
		reportReasonByTargetKey = {
			...reportReasonByTargetKey,
			[key]: reportReasonByTargetKey[key] ?? REPORT_REASONS[0]
		};
	}

	function closeReportPanel(targetKey: string) {
		if (reportingTargetKey === targetKey) return;
		if (openReportTargetKey === targetKey) {
			openReportTargetKey = '';
		}
	}

	function getReportReason(targetKey: string): ReportReason {
		return reportReasonByTargetKey[targetKey] ?? REPORT_REASONS[0];
	}

	function updateReportReason(targetKey: string, value: string) {
		if (!REPORT_REASONS.includes(value as ReportReason)) return;
		reportReasonByTargetKey = {
			...reportReasonByTargetKey,
			[targetKey]: value as ReportReason
		};
	}

	function setReportFeedback(
		targetKey: string,
		message: string,
		type: 'success' | 'error' | 'info'
	) {
		reportFeedbackByTargetKey = {
			...reportFeedbackByTargetKey,
			[targetKey]: { message, type }
		};
	}

	async function submitReport(contentType: ReportContentType, contentId: string) {
		const targetKey = reportTargetKey(contentType, contentId);
		if (reportingTargetKey) return;

		const reason = getReportReason(targetKey);
		reportingTargetKey = targetKey;

		try {
			const response = await fetch('/api/community/report', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contentId,
					contentType,
					reason
				})
			});

			const payload = (await response.json().catch(() => null)) as
				| { success?: boolean; error?: string }
				| null;

			if (!response.ok || !payload || payload.success !== true) {
				setReportFeedback(
					targetKey,
					payload?.error ?? 'Kunde inte skicka rapporten just nu. Försök igen snart.',
					'error'
				);
				return;
			}

			setReportFeedback(targetKey, 'Tack — vi har tagit emot din rapport.', 'success');
			openReportTargetKey = '';
		} catch (error) {
			setReportFeedback(
				targetKey,
				error instanceof Error
					? error.message
					: 'Kunde inte skicka rapporten just nu. Försök igen snart.',
				'error'
			);
		} finally {
			reportingTargetKey = '';
		}
	}

	async function submitComment(post: CommunityPost) {
		if (post.isOwnPost || commentingPostId) return;

		const draft = getCommentDraft(post.id);
		const body = draft.trim();

		if (!body) {
			setCommentFeedback(post.id, 'Skriv gärna några ord innan du skickar.', 'info');
			return;
		}

		if (body.length > COMMENT_MAX_LENGTH) {
			setCommentFeedback(post.id, `Kommentaren får vara högst ${COMMENT_MAX_LENGTH} tecken.`, 'error');
			return;
		}

		commentingPostId = post.id;
		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();

			if (!session?.access_token) {
				setCommentFeedback(post.id, 'Logga in för att svara med omtanke.', 'error');
				return;
			}

			const response = await fetch('/api/community/comments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`
				},
				body: JSON.stringify({
					postId: post.id,
					body
				})
			});

			const payload = (await response.json().catch(() => null)) as
				| CreateCommunityCommentSuccessResponse
				| { success?: boolean; error?: string }
				| null;

			if (!response.ok || !payload || payload.success !== true) {
				const errorPayload = payload as { error?: string } | null;
				setCommentFeedback(
					post.id,
					errorPayload?.error ?? 'Kunde inte spara svaret just nu. Försök igen om en stund.',
					'error'
				);
				return;
			}

			const successPayload = payload as CreateCommunityCommentSuccessResponse;
			const nextComment: CommunityComment = {
				id: successPayload.comment.id,
				postId: successPayload.comment.post_id,
				body: successPayload.comment.body,
				created_at: successPayload.comment.created_at
			};

			posts = posts.map((item) =>
				item.id === post.id
					? { ...item, comments: [...item.comments, nextComment] }
					: item
			);

			commentDraftByPostId = {
				...commentDraftByPostId,
				[post.id]: ''
			};

			setCommentFeedback(post.id, 'Tack för att du skriver med omtanke.', 'success');
		} catch (error) {
			setCommentFeedback(
				post.id,
				error instanceof Error
					? error.message
					: 'Kunde inte spara svaret just nu. Försök igen om en stund.',
				'error'
			);
		} finally {
			commentingPostId = '';
		}
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

		{#if feedNotice}
			<p class="feed-notice {feedNoticeType}">{feedNotice}</p>
		{/if}

		{#if posts.length > 0}
			<section class="auth-panel feed-panel">
				<h2>Delningar i lugn takt</h2>
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
								<div class="post-meta-row">
									<p class="published">{formatPublishedAt(post.created_at)}</p>
									<button
										type="button"
										class="report-link"
										onclick={() => openReportPanel('post', post.id)}
									>
										Rapportera
									</button>
								</div>
								{#if openReportTargetKey === reportTargetKey('post', post.id)}
									<div class="report-panel" role="status">
										<label class="report-label" for={`report-post-${post.id}`}>Anledning</label>
										<select
											id={`report-post-${post.id}`}
											class="report-select"
											value={getReportReason(reportTargetKey('post', post.id))}
											onchange={(event) =>
												updateReportReason(
													reportTargetKey('post', post.id),
													(event.currentTarget as HTMLSelectElement).value
												)}
										>
											{#each REPORT_REASONS as reason}
												<option value={reason}>{reason}</option>
											{/each}
										</select>
										<div class="report-actions">
											<button
												type="button"
												class="report-submit"
												onclick={() => submitReport('post', post.id)}
												disabled={reportingTargetKey === reportTargetKey('post', post.id)}
											>
												{reportingTargetKey === reportTargetKey('post', post.id)
													? 'Skickar...'
													: 'Skicka'}
											</button>
											<button
												type="button"
												class="report-cancel"
												onclick={() => closeReportPanel(reportTargetKey('post', post.id))}
												disabled={reportingTargetKey === reportTargetKey('post', post.id)}
											>
												Avbryt
											</button>
										</div>
									</div>
								{/if}
								{#if reportFeedbackByTargetKey[reportTargetKey('post', post.id)]}
									<p class="report-feedback {reportFeedbackByTargetKey[reportTargetKey('post', post.id)].type}">
										{reportFeedbackByTargetKey[reportTargetKey('post', post.id)].message}
									</p>
								{/if}
								<div class="comment-toggle-row">
									<button
										type="button"
										class="comment-toggle-btn"
										onclick={() => {
											clearCommentFeedback(post.id);
											toggleComments(post.id);
										}}
									>
										{#if isCommentsOpen(post.id)}
											Dölj svar
										{:else if post.isOwnPost}
											Visa svar
										{:else}
											Svara med omtanke
										{/if}
										{#if commentCountLabel(post.comments.length)}
											<span class="comment-count">{commentCountLabel(post.comments.length)}</span>
										{/if}
									</button>
								</div>
								{#if isCommentsOpen(post.id)}
									<div class="comments-panel">
										{#if post.comments.length > 0}
											<ul class="comments-list">
												{#each post.comments as comment (comment.id)}
													<li class="comments-item">
														<p class="comment-author">Anonym medlem</p>
														<p class="comment-body">{comment.body}</p>
														<div class="comment-meta-row">
															<p class="comment-time">{formatPublishedAt(comment.created_at)}</p>
															<button
																type="button"
																class="report-link"
																onclick={() => openReportPanel('comment', comment.id)}
															>
																Rapportera
															</button>
														</div>
														{#if openReportTargetKey === reportTargetKey('comment', comment.id)}
															<div class="report-panel" role="status">
																<label class="report-label" for={`report-comment-${comment.id}`}>Anledning</label>
																<select
																	id={`report-comment-${comment.id}`}
																	class="report-select"
																	value={getReportReason(reportTargetKey('comment', comment.id))}
																	onchange={(event) =>
																		updateReportReason(
																			reportTargetKey('comment', comment.id),
																			(event.currentTarget as HTMLSelectElement).value
																		)}
																>
																	{#each REPORT_REASONS as reason}
																		<option value={reason}>{reason}</option>
																	{/each}
																</select>
																<div class="report-actions">
																	<button
																		type="button"
																		class="report-submit"
																		onclick={() => submitReport('comment', comment.id)}
																		disabled={reportingTargetKey === reportTargetKey('comment', comment.id)}
																	>
																		{reportingTargetKey === reportTargetKey('comment', comment.id)
																			? 'Skickar...'
																			: 'Skicka'}
																	</button>
																	<button
																		type="button"
																		class="report-cancel"
																		onclick={() => closeReportPanel(reportTargetKey('comment', comment.id))}
																		disabled={reportingTargetKey === reportTargetKey('comment', comment.id)}
																	>
																		Avbryt
																	</button>
																</div>
															</div>
														{/if}
														{#if reportFeedbackByTargetKey[reportTargetKey('comment', comment.id)]}
															<p class="report-feedback {reportFeedbackByTargetKey[reportTargetKey('comment', comment.id)].type}">
																{reportFeedbackByTargetKey[reportTargetKey('comment', comment.id)].message}
															</p>
														{/if}
													</li>
												{/each}
											</ul>
										{:else}
											<p class="comments-empty">Inga svar ännu.</p>
										{/if}

										{#if !post.isOwnPost}
											<div class="comment-form">
												<p class="comments-help">Skriv några lugna och vänliga ord. Ditt svar visas anonymt.</p>
												<textarea
													rows="3"
													maxlength={COMMENT_MAX_LENGTH}
													class="comment-input"
													placeholder="Skriv ett kort, vänligt svar..."
													aria-label="Skriv ett anonymt svar"
													value={getCommentDraft(post.id)}
													oninput={(event) =>
														updateCommentDraft(
															post.id,
															(event.currentTarget as HTMLTextAreaElement).value
														)}
												></textarea>
												<div class="comment-form-footer">
													<p class="comment-length">
														{getCommentDraft(post.id).length}/{COMMENT_MAX_LENGTH}
													</p>
													<button
														type="button"
														class="auth-button primary"
														disabled={commentingPostId === post.id}
														onclick={() => submitComment(post)}
													>
														{commentingPostId === post.id
															? 'Sparar...'
															: 'Svara med omtanke'}
													</button>
												</div>
												{#if commentFeedbackByPostId[post.id]}
													<p class="comment-feedback {commentFeedbackByPostId[post.id].type}">
														{commentFeedbackByPostId[post.id].message}
													</p>
												{/if}
											</div>
										{/if}
									</div>
								{/if}
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
					<p role="listitem">Mjuk rapportering av svar</p>
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

		.post-meta-row {
			margin-top: 0.45rem;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 0.45rem;
		}

		.published {
			margin: 0;
			font-size: 0.77rem;
			color: hsl(var(--muted-foreground));
		}

		.report-link {
			border: 0;
			background: transparent;
			padding: 0;
			font-size: 0.74rem;
			color: hsl(var(--muted-foreground));
			cursor: pointer;
			text-decoration: underline;
			text-underline-offset: 2px;
		}

		.report-link:hover {
			color: hsl(var(--foreground));
		}

		.report-panel {
			margin-top: 0.45rem;
			padding: 0.5rem 0.55rem;
			border: 1px solid hsl(var(--border));
			border-radius: var(--radius-input);
			background: hsl(var(--surface-soft));
			display: grid;
			gap: 0.42rem;
		}

		.report-label {
			font-size: 0.74rem;
			color: hsl(var(--muted-foreground));
		}

		.report-select {
			border: 1px solid hsl(var(--border));
			border-radius: var(--radius-input);
			background: hsl(var(--surface));
			color: hsl(var(--foreground));
			font: inherit;
			font-size: 0.82rem;
			padding: 0.4rem 0.5rem;
		}

		.report-actions {
			display: flex;
			justify-content: flex-end;
			gap: 0.45rem;
		}

		.report-submit,
		.report-cancel {
			border: 0;
			background: transparent;
			padding: 0;
			font-size: 0.74rem;
			color: hsl(var(--muted-foreground));
			cursor: pointer;
			text-decoration: underline;
			text-underline-offset: 2px;
		}

		.report-submit:hover,
		.report-cancel:hover {
			color: hsl(var(--foreground));
		}

		.report-feedback {
			margin: 0.4rem 0 0;
			font-size: 0.74rem;
		}

		.report-feedback.success {
			color: hsl(var(--success-foreground));
		}

		.report-feedback.error {
			color: hsl(var(--error-foreground));
		}

		.comment-toggle-row {
			margin-top: 0.65rem;
		}

		.comment-toggle-btn {
			border: 0;
			background: transparent;
			padding: 0;
			font-size: 0.82rem;
			color: hsl(var(--muted-foreground));
			text-decoration: underline;
			text-underline-offset: 2px;
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			gap: 0.4rem;
		}

		.comment-toggle-btn:hover {
			color: hsl(var(--foreground));
		}

		.comment-count {
			font-size: 0.76rem;
			color: hsl(var(--muted-foreground));
		}

		.comments-panel {
			margin-top: 0.6rem;
			padding: 0.7rem 0.75rem;
			border: 1px solid hsl(var(--border));
			border-radius: var(--radius-input);
			background: hsl(var(--surface-soft));
		}

		.comments-list {
			margin: 0;
			padding: 0;
			list-style: none;
			display: grid;
			gap: 0.55rem;
		}

		.comments-item {
			padding: 0.6rem 0.65rem;
			border: 1px solid hsl(var(--border));
			border-radius: var(--radius-input);
			background: hsl(var(--surface));
		}

		.comment-author {
			margin: 0;
			font-size: 0.74rem;
			color: hsl(var(--muted-foreground));
		}

		.comment-body {
			margin: 0.35rem 0 0;
			line-height: 1.6;
			white-space: pre-wrap;
		}

		.comment-time {
			margin: 0;
			font-size: 0.74rem;
			color: hsl(var(--muted-foreground));
		}

		.comment-meta-row {
			margin-top: 0.35rem;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 0.45rem;
		}

		.comments-empty {
			margin: 0;
			font-size: 0.84rem;
			color: hsl(var(--muted-foreground));
		}

		.comment-form {
			margin-top: 0.7rem;
			display: grid;
			gap: 0.45rem;
		}

		.comments-help {
			margin: 0;
			font-size: 0.82rem;
			color: hsl(var(--muted-foreground));
		}

		.comment-input {
			width: 100%;
			resize: vertical;
			min-height: 4.4rem;
			padding: 0.6rem 0.65rem;
			border-radius: var(--radius-input);
			border: 1px solid hsl(var(--border));
			background: hsl(var(--surface));
			color: hsl(var(--foreground));
			font: inherit;
			line-height: 1.55;
		}

		.comment-input:focus {
			outline: 2px solid hsl(var(--ring));
			outline-offset: 1px;
		}

		.comment-form-footer {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 0.6rem;
		}

		.comment-length {
			margin: 0;
			font-size: 0.74rem;
			color: hsl(var(--muted-foreground));
		}

		.comment-feedback {
			margin: 0;
			font-size: 0.8rem;
		}

		.comment-feedback.success {
			color: hsl(var(--success-foreground));
		}

		.comment-feedback.error {
			color: hsl(var(--error-foreground));
		}

		.comment-feedback.info {
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
