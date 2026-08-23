<script lang="ts">
	import { page } from '$app/state';
	import SEO from '$lib/components/SEO.svelte';
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { trackForumReplyCreated } from '$lib/analytics';
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
		commentsLoaded: boolean;
	};

	let {
		data
	}: {
		data: {
			items?: CommunityPost[];
			currentPage?: number;
			totalPages?: number;
			totalItems?: number;
			hasPreviousPage?: boolean;
			hasNextPage?: boolean;
		};
	} = $props();
	const initialPosts = $derived(data.items ?? []);
	const currentPage = $derived(data.currentPage ?? 1);
	const totalPages = $derived(data.totalPages ?? 1);
	const totalItems = $derived(data.totalItems ?? initialPosts.length);
	const hasPreviousPage = $derived(data.hasPreviousPage ?? false);
	const hasNextPage = $derived(data.hasNextPage ?? false);
	let posts = $state<CommunityPost[]>([]);
	let confirmingUnsharePostId = $state('');
	let unsharingPostId = $state('');
	let openCommentsByPostId = $state<Record<string, boolean>>({});
	let commentsLoadingByPostId = $state<Record<string, boolean>>({});
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
	let latestActivityLabel = $derived(posts.length > 0 ? formatPublishedAt(posts[0]?.created_at ?? null) : '');

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

	// Stable variant (0–4) from post id — same post always gets same accent.
	// Variant 0 = no accent (baseline), 1–4 = muted top-border colour.
	function postVariant(id: string): 0 | 1 | 2 | 3 | 4 {
		let h = 5381;
		for (let i = 0; i < id.length; i++) {
			h = (((h << 5) + h) ^ id.charCodeAt(i)) >>> 0;
		}
		return (h % 5) as 0 | 1 | 2 | 3 | 4;
	}

	function formatMoodLabel(value: string | null): string {
		if (!value) return '';
		const mood = Number(value);
		if (Number.isFinite(mood) && mood >= 1 && mood <= 10) {
			return `Humör ${Math.round(mood)}/10`;
		}
		return '';
	}

	function pageHref(pageNumber: number): string {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(pageNumber));
		return `?${params.toString()}`;
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

	async function loadCommentsForPost(postId: string) {
		if (commentsLoadingByPostId[postId]) return;

		commentsLoadingByPostId = {
			...commentsLoadingByPostId,
			[postId]: true
		};

		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();

			if (!session?.access_token) {
				setCommentFeedback(postId, 'Logga in för att läsa svar.', 'error');
				return;
			}

			const response = await fetch(`/api/community/comments?postId=${encodeURIComponent(postId)}`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${session.access_token}`
				}
			});

			const payload = (await response.json().catch(() => null)) as
				| {
						success?: boolean;
						error?: string;
						comments?: Array<{ id: string; post_id: string; body: string; created_at: string | null }>;
				  }
				| null;

			if (!response.ok || !payload || payload.success !== true || !Array.isArray(payload.comments)) {
				setCommentFeedback(
					postId,
					payload?.error ?? 'Kunde inte läsa svar just nu. Försök igen om en stund.',
					'error'
				);
				return;
			}

			const nextComments: CommunityComment[] = payload.comments
				.map((comment) => ({
					id: comment.id,
					postId: comment.post_id,
					body: comment.body,
					created_at: comment.created_at
				}))
				.filter((comment) => comment.id && comment.postId && comment.body);

			posts = posts.map((post) =>
				post.id === postId ? { ...post, comments: nextComments, commentsLoaded: true } : post
			);
		} catch (error) {
			setCommentFeedback(
				postId,
				error instanceof Error
					? error.message
					: 'Kunde inte läsa svar just nu. Försök igen om en stund.',
				'error'
			);
		} finally {
			commentsLoadingByPostId = {
				...commentsLoadingByPostId,
				[postId]: false
			};
		}
	}

	async function toggleComments(postId: string) {
		const nextIsOpen = !isCommentsOpen(postId);
		openCommentsByPostId = {
			...openCommentsByPostId,
			[postId]: nextIsOpen
		};

		if (!nextIsOpen) return;

		const post = posts.find((item) => item.id === postId);
		if (!post || post.commentsLoaded) return;

		await loadCommentsForPost(postId);
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
					? { ...item, comments: [...item.comments, nextComment], commentsLoaded: true }
					: item
			);

			commentDraftByPostId = {
				...commentDraftByPostId,
				[post.id]: ''
			};

			trackForumReplyCreated();
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
				setFeedNotice('Logga in för att ta bort inlägget.', 'error');
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
					setFeedNotice('Inlägget är redan borttaget från Gemenskap.', 'info');
					confirmingUnsharePostId = '';
					return;
				}
				if (response.status === 404) {
					posts = posts.filter((item) => item.id !== post.id);
					setFeedNotice('Inlägget finns inte längre i Gemenskap.', 'info');
					confirmingUnsharePostId = '';
					return;
				}
				setFeedNotice(errorPayload?.error ?? 'Kunde inte ta bort inlägget just nu.', 'error');
				return;
			}

			if (!payload.success) {
				setFeedNotice('Kunde inte ta bort inlägget just nu.', 'error');
				return;
			}

			posts = posts.filter((item) => item.id !== post.id);
			setFeedNotice('Inlägget har tagits bort från Gemenskap.', 'success');
			confirmingUnsharePostId = '';
		} catch (error) {
			setFeedNotice(
				error instanceof Error ? error.message : 'Kunde inte ta bort inlägget just nu.',
				'error'
			);
		} finally {
			unsharingPostId = '';
		}
	}
</script>

<SEO canonical="https://mittpsyke.se/dashboard/gemenskap" />

<main class="auth-page">
	<PortalSubnav
		active="gemenskap"
		title="Du är inte ensam"
		description="En lugn plats där du kan skriva anonymt, känna igen dig i andra och ge eller få mjuk bekräftelse."
	/>

	<div class="auth-shell community-page">
		<section class="auth-panel auth-panel-accent info-panel" aria-label="Viktig information">
			<h2>Innan du skriver i Gemenskapen</h2>
			<p>
				Skriv anonymt och undvik namn, personnummer, adresser eller andra uppgifter som kan
				identifiera dig eller någon annan.
			</p>
			<p>Gemenskapen är ett stöd mellan människor, inte vård eller akut hjälp.</p>
			<p>
				Vid akut fara: ring 112. För sjukvårdsrådgivning kan du kontakta 1177. Fler stödvägar
				finns på
				<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">stodlinjer.se</a>.
			</p>
		</section>

		{#if feedNotice}
			<p class="feed-notice {feedNoticeType}">{feedNotice}</p>
		{/if}

		{#if posts.length > 0}
			<section class="auth-panel feed-panel">
				<h2>Senaste från Gemenskapen</h2>
				<p class="feed-intro">
					{totalItems} anonyma inlägg i Gemenskapen. Senaste aktivitet: {latestActivityLabel}.
				</p>
				<div class="community-feed">
					{#each posts as post (post.id)}
						<article id={`post-${post.id}`} class="community-post post-variant-{postVariant(post.id)}">
							<div class="community-post-head">
								<UserAvatar seed={post.id} name="Anonym röst" size="sm" decorative />
								<div class="community-post-title">
									<p class="voice">Anonym röst</p>
									{#if formatMoodLabel(post.mood)}
										<p class="mood-tag">{formatMoodLabel(post.mood)}</p>
									{/if}
								</div>
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
											void toggleComments(post.id);
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
										{#if commentsLoadingByPostId[post.id]}
											<p class="comments-empty">Laddar svar...</p>
										{:else if post.comments.length > 0}
											<ul class="comments-list">
												{#each post.comments as comment (comment.id)}
													<li class="comments-item">
														<div class="comment-head">
															<UserAvatar seed={comment.id} name="Anonym medlem" size="xs" decorative />
															<p class="comment-author">Anonym medlem</p>
														</div>
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
										<p class="own-post-label">Ditt inlägg</p>
									<button
										type="button"
										class="post-action-btn"
										onclick={() => openUnshareConfirmation(post.id)}
									>
										Ta bort från Gemenskap
									</button>
								</div>

								{#if confirmingUnsharePostId === post.id}
									<div class="post-confirmation" role="status">
										<h3>Ta bort från Gemenskap?</h3>
										<p>
											Det här tar bort inlägget från Gemenskap.
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
												{unsharingPostId === post.id ? 'Tar bort...' : 'Ta bort'}
											</button>
										</div>
									</div>
								{/if}
							{/if}
						</article>
					{/each}
				</div>
				{#if totalPages > 1}
					<nav class="pagination" aria-label="Paginering för Gemenskapen">
						{#if hasPreviousPage}
							<a class="pagination-link" href={pageHref(currentPage - 1)}>Föregående</a>
						{:else}
							<span class="pagination-link disabled" aria-disabled="true">Föregående</span>
						{/if}
						<span class="pagination-status">Sida {currentPage} av {totalPages}</span>
						{#if hasNextPage}
							<a class="pagination-link" href={pageHref(currentPage + 1)}>Nästa</a>
						{:else}
							<span class="pagination-link disabled" aria-disabled="true">Nästa</span>
						{/if}
					</nav>
				{/if}
			</section>
		{:else}
			<section class="auth-panel empty-panel">
				<h2>Här kommer inlägg i Gemenskapen att visas</h2>
				<p>
					Här samlas anonyma tankar i lugn takt när Gemenskapen fylls på.
				</p>
			</section>
		{/if}

		{#if posts.length === 0}
			<section class="auth-panel future-panel">
				<h2>Kommer i nästa steg</h2>
				<div class="future-list" role="list">
					<p role="listitem">Anonyma inlägg i lugn takt</p>
					<p role="listitem">Mjuka stödreaktioner</p>
					<p role="listitem">Mjuk rapportering av svar</p>
					<p role="listitem">Rapportera innehåll</p>
				</div>
			</section>
			<section class="auth-panel sample-panel">
				<h2>Exempel från Gemenskapen</h2>
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

	.feed-intro {
		margin: 0.45rem 0 0;
		font-size: 0.85rem;
		color: hsl(var(--muted-foreground));
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

	.pagination {
		margin-top: 0.9rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.55rem;
	}

	.pagination-link,
	.pagination-status {
		font-size: 0.83rem;
		color: hsl(var(--muted-foreground));
	}

	.pagination-link {
		padding: 0.42rem 0.65rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-input);
		background: hsl(var(--surface));
		text-decoration: none;
	}

	.pagination-link:hover {
		color: hsl(var(--foreground));
		border-color: hsl(var(--muted-foreground) / 0.45);
	}

	.pagination-link.disabled {
		opacity: 0.45;
		pointer-events: none;
	}

	.community-post {
		padding: 0.78rem 0.82rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-muted));
	}

	/* Variant 0: no accent — baseline, intentionally unchanged */

	/* Variants 1–4: muted top-border replaces the standard top border.
	   Low saturation + opacity so they stay calm in both light and dark mode. */
	.post-variant-1 { border-top: 2px solid hsl(215 38% 68% / 0.6); }
	.post-variant-2 { border-top: 2px solid hsl(158 32% 62% / 0.6); }
	.post-variant-3 { border-top: 2px solid hsl(36 42% 65% / 0.6); }
	.post-variant-4 { border-top: 2px solid hsl(278 22% 66% / 0.55); }

	.community-post-head {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}

	.community-post-title {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.38rem;
		min-width: 0;
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

		.comment-head {
			display: flex;
			align-items: center;
			gap: 0.4rem;
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

	@media (max-width: 760px) {
		:global(.auth-page:has(.community-page)) {
			padding-inline: 0.55rem;
		}

		:global(.auth-page:has(.community-page) .auth-shell) {
			gap: 0.6rem;
		}

		:global(.auth-page:has(.community-page) .auth-hero p) {
			display: none;
		}

		:global(.auth-page:has(.community-page) .auth-subnav) {
			gap: 0.2rem;
			padding: 0.2rem;
			overflow-x: auto;
			flex-wrap: nowrap;
		}

		:global(.auth-page:has(.community-page) .auth-subnav-link) {
			flex: 0 0 auto;
			min-width: 5.8rem;
			padding: 0.42rem 0.55rem;
			font-size: 0.8rem;
		}

		.community-page {
			gap: 0.6rem;
			padding-top: 0;
		}

		.info-panel,
		.feed-panel,
		.empty-panel,
		.future-panel,
		.sample-panel {
			padding: 0.75rem;
		}

		.info-panel ul {
			margin-top: 0.45rem;
			gap: 0.28rem;
		}

		.info-panel li:nth-child(2),
		.info-panel li:nth-child(3),
		.feed-intro,
		.empty-panel p,
		.future-panel,
		.sample-panel,
		.comments-help {
			display: none;
		}

		.community-feed {
			margin-top: 0.55rem;
			gap: 0.5rem;
		}

		.community-post {
			padding: 0.68rem;
		}

		.content {
			margin-top: 0.35rem;
			line-height: 1.5;
		}

		.post-meta-row,
		.comment-meta-row,
		.comment-toggle-row {
			margin-top: 0.4rem;
		}

		.comments-panel {
			margin-top: 0.5rem;
			padding: 0.6rem;
		}

		.comments-item {
			padding: 0.55rem;
		}

		.comment-form {
			margin-top: 0.55rem;
		}

		.comment-input {
			min-height: 3.6rem;
			padding: 0.55rem;
		}

		.comment-form-footer {
			align-items: stretch;
		}

		.comment-form-footer .auth-button,
		.post-confirmation-actions .auth-button {
			width: 100%;
		}

		.post-confirmation {
			padding: 0.6rem;
		}
	}
</style>
