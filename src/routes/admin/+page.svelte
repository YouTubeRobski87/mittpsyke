<script lang="ts">
	import { supabase } from '$lib/supabase';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Report = PageData['reports'][number];
	let reports = $state<Report[]>(data.reports);
	let deletingId = $state<string | null>(null);
	let errors = $state<Record<string, string>>({});

	async function getToken(): Promise<string | null> {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		return session?.access_token ?? null;
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('sv-SE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function truncate(text: string, max = 200): string {
		return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
	}

	async function deleteReport(report: Report) {
		if (
			!confirm(
				`Radera ${report.thread_id ? 'tråden' : 'svaret'} och arkivera rapporten? Det går inte att ångra.`
			)
		)
			return;

		deletingId = report.id;
		errors = { ...errors, [report.id]: '' };

		const token = await getToken();
		if (!token) {
			errors = { ...errors, [report.id]: 'Inte inloggad.' };
			deletingId = null;
			return;
		}

		const res = await fetch('/api/admin/delete-report', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				reportId: report.id,
				threadId: report.thread_id ?? undefined,
				replyId: report.reply_id ?? undefined
			})
		});

		const json = await res.json();
		deletingId = null;

		if (!res.ok || !json.success) {
			errors = { ...errors, [report.id]: json.error ?? 'Kunde inte utföra åtgärden.' };
			return;
		}

		reports = reports.filter((r) => r.id !== report.id);
	}
</script>

<svelte:head>
	<title>Admin – Rapporter | MittPsyke</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="admin-page">
	<header class="admin-header">
		<h1 class="admin-title">Rapporter</h1>
		<p class="admin-sub">
			{reports.length === 0
				? 'Inga olösta rapporter.'
				: `${reports.length} olöst${reports.length === 1 ? '' : 'a'} rapport${reports.length === 1 ? '' : 'er'}`}
		</p>
	</header>

	{#if reports.length === 0}
		<div class="empty-state">
			<p>Inga rapporter att hantera just nu.</p>
		</div>
	{:else}
		<ol class="report-list" role="list">
			{#each reports as report (report.id)}
				<li class="report-card">
					<div class="report-meta">
						<span class="reason-badge">{report.reason}</span>
						<span class="report-type">{report.thread_id ? 'Tråd' : 'Svar'}</span>
						<time class="report-date" datetime={report.created_at}>
							{formatDate(report.created_at)}
						</time>
					</div>

					{#if report.thread}
						<h2 class="content-title">
							<a
								href="/forum/thread/{report.thread.id}"
								target="_blank"
								rel="noopener noreferrer"
							>{report.thread.title}</a>
						</h2>
						<p class="content-body">{truncate(report.thread.body)}</p>
						{#if report.thread.deleted_at}
							<p class="already-deleted">Tråden är redan raderad.</p>
						{/if}
					{:else if report.reply}
						<p class="content-body">{truncate(report.reply.body)}</p>
						<a
							class="reply-link"
							href="/forum/thread/{report.reply.thread_id}"
							target="_blank"
							rel="noopener noreferrer"
						>Visa tråden →</a>
						{#if report.reply.deleted_at}
							<p class="already-deleted">Svaret är redan raderat.</p>
						{/if}
					{/if}

					{#if report.details}
						<p class="report-details">"{report.details}"</p>
					{/if}

					{#if errors[report.id]}
						<p class="report-error" role="alert">{errors[report.id]}</p>
					{/if}

					<div class="report-actions">
						<button
							class="btn-delete"
							disabled={deletingId === report.id}
							onclick={() => deleteReport(report)}
						>
							{deletingId === report.id ? 'Raderar…' : 'Radera inlägg'}
						</button>
					</div>
				</li>
			{/each}
		</ol>
	{/if}
</div>

<style>
	.admin-page {
		max-width: 52rem;
		margin: 0 auto;
		padding: 2.5rem 1.25rem 5rem;
	}

	.admin-header {
		margin-bottom: 2rem;
		border-bottom: 1px solid hsl(var(--border));
		padding-bottom: 1.25rem;
	}

	.admin-title {
		font-family: var(--font-heading);
		font-size: clamp(1.5rem, 3.5vw, 2rem);
		font-weight: 700;
		color: hsl(var(--foreground));
		margin: 0 0 0.25rem;
	}

	.admin-sub {
		margin: 0;
		font-size: 0.9rem;
		color: hsl(var(--muted-foreground));
	}

	.empty-state {
		padding: 3rem 1rem;
		text-align: center;
		color: hsl(var(--muted-foreground));
		font-size: 0.95rem;
	}

	.report-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.report-card {
		background: hsl(var(--surface));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		padding: 1.25rem 1.375rem;
	}

	.report-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
	}

	.reason-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.2rem 0.6rem;
		border-radius: var(--radius-pill);
		background: hsl(var(--error-surface, 0 80% 95%));
		color: hsl(var(--error-foreground, 0 60% 35%));
		font-family: var(--font-heading);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.03em;
	}

	.report-type {
		font-size: 0.8rem;
		color: hsl(var(--muted-foreground));
		background: hsl(var(--surface-muted));
		padding: 0.2rem 0.55rem;
		border-radius: var(--radius-pill);
	}

	.report-date {
		margin-left: auto;
		font-size: 0.8rem;
		color: hsl(var(--muted-foreground));
	}

	.content-title {
		font-family: var(--font-heading);
		font-size: 1.05rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		margin: 0 0 0.4rem;
		line-height: 1.3;
	}

	.content-title a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.content-title a:hover {
		opacity: 0.75;
	}

	.content-body {
		margin: 0 0 0.5rem;
		font-size: 0.9375rem;
		line-height: 1.65;
		color: hsl(var(--foreground));
		white-space: pre-wrap;
	}

	.reply-link {
		display: inline-block;
		font-size: 0.83rem;
		color: hsl(var(--primary));
		margin-bottom: 0.5rem;
	}

	.already-deleted {
		margin: 0.25rem 0 0.5rem;
		font-size: 0.83rem;
		color: hsl(var(--muted-foreground));
		font-style: italic;
	}

	.report-details {
		margin: 0.4rem 0 0.5rem;
		font-size: 0.875rem;
		font-style: italic;
		color: hsl(var(--muted-foreground));
		border-left: 2px solid hsl(var(--border));
		padding-left: 0.75rem;
	}

	.report-error {
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
		color: hsl(var(--error-foreground, 0 60% 35%));
	}

	.report-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
		padding-top: 0.875rem;
		border-top: 1px solid hsl(var(--border));
	}

	.btn-delete {
		font-size: 0.83rem;
		padding: 0.3rem 0.75rem;
		border-radius: var(--radius-pill);
		border: 1px solid hsl(var(--error-foreground, 0 60% 35%) / 0.35);
		background: hsl(var(--error-surface, 0 80% 95%));
		color: hsl(var(--error-foreground, 0 60% 35%));
		cursor: pointer;
		font-family: var(--font-heading);
		font-weight: 600;
		transition: background 0.12s, border-color 0.12s;
	}

	.btn-delete:hover:not(:disabled) {
		background: hsl(var(--error-foreground, 0 60% 35%) / 0.12);
		border-color: hsl(var(--error-foreground, 0 60% 35%) / 0.6);
	}

	.btn-delete:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
</style>
