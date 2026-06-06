<script lang="ts">
	import { enhance } from '$app/forms';
	import SEO from '$lib/components/SEO.svelte';
	import { getAgeRangeLabel, getGenderLabel } from '$lib/data/anonymous-stories';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let pendingForm = $state<string | null>(null);

	const statusFilters = [
		{ value: 'all', label: 'Alla', href: '/admin/stories?status=all' },
		{ value: 'pending', label: 'Väntar', href: '/admin/stories' },
		{ value: 'approved', label: 'Publicerade', href: '/admin/stories?status=approved' },
		{ value: 'rejected', label: 'Nekade', href: '/admin/stories?status=rejected' }
	];

	function enhanceForm(id: string, action: string) {
		return ({ cancel }: { cancel: () => void }) => {
			if (
				action === 'delete' &&
				!confirm(
					'Är du säker på att du vill radera den här berättelsen? Detta går inte att ångra.'
				)
			) {
				cancel();
				return;
			}

			pendingForm = `${action}:${id}`;

			return async ({ update }: { update: () => Promise<void> }) => {
				await update();
				pendingForm = null;
			};
		};
	}

	function storyMeta(gender: string | null, ageRange: string | null) {
		return [getGenderLabel(gender), getAgeRangeLabel(ageRange)].filter(Boolean).join(', ');
	}

	function formatDate(value: string | null | undefined) {
		if (!value) return '-';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '-';

		return new Intl.DateTimeFormat('sv-SE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}

	function statusLabel(status: string) {
		if (status === 'approved') return 'Publicerad';
		if (status === 'rejected') return 'Nekad';
		if (status === 'deleted') return 'Raderad';
		return 'Väntar';
	}
</script>

<SEO canonical="https://www.mittpsyke.se/admin/stories" />

<svelte:head>
	<title>Anonyma berättelser | Admin | MittPsyke</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="admin-stories">
	<header class="hero">
		<div>
			<p class="eyebrow">MittPsyke Admin</p>
			<h1>Anonyma berättelser</h1>
			<p>Granska berättelser som väntar på manuell publicering.</p>
		</div>
		<a href="/admin">Till adminöversikt</a>
	</header>

	{#if data.schemaError}
		<p class="notice error">{data.schemaError}</p>
	{/if}

	{#if form?.error}
		<p class="notice error">{form.error}</p>
	{:else if form?.success}
		<p class="notice success">{form.success}</p>
	{/if}

	<nav class="status-filters" aria-label="Filtrera berättelser">
		{#each statusFilters as filter}
			<a
				class:active={data.statusFilter === filter.value}
				href={filter.href}
				aria-current={data.statusFilter === filter.value ? 'page' : undefined}
			>
				{filter.label}
			</a>
		{/each}
	</nav>

	{#if data.stories.length === 0 && !data.schemaError}
		<p class="notice">Det finns inga berättelser att granska just nu.</p>
	{:else}
		<section class="story-list" aria-label="Berättelser som väntar">
			{#each data.stories as story}
				<article class="story-card">
					<div class="story-head">
						<div>
							<p class="date">{formatDate(story.created_at)}</p>
							{#if storyMeta(story.gender, story.age_range) || story.emotion_emoji}
								<p class="meta">
									{[story.emotion_emoji, storyMeta(story.gender, story.age_range)].filter(Boolean).join(' · ')}
								</p>
							{/if}
						</div>
						<span class="status-badge">{statusLabel(story.status)}</span>
					</div>

					<p class="content">{story.content}</p>

					{#if story.ai_flag_reason}
						<p class="ai-flag"><strong>AI flaggade:</strong> {story.ai_flag_reason}</p>
					{/if}

					<div class="actions">
						{#if story.status !== 'approved'}
							<form method="POST" action="?/approve" use:enhance={enhanceForm(story.id, 'approve')}>
								<input type="hidden" name="id" value={story.id} />
								<button disabled={pendingForm === `approve:${story.id}`}>Godkänn</button>
							</form>
						{/if}
						{#if story.status !== 'rejected'}
							<form method="POST" action="?/reject" use:enhance={enhanceForm(story.id, 'reject')}>
								<input type="hidden" name="id" value={story.id} />
								<button class="secondary" disabled={pendingForm === `reject:${story.id}`}>Avvisa</button>
							</form>
						{/if}
						<form
							method="POST"
							action="?/delete"
							use:enhance={enhanceForm(story.id, 'delete')}
						>
							<input type="hidden" name="id" value={story.id} />
							<button class="danger-ghost" disabled={pendingForm === `delete:${story.id}`}>Radera</button>
						</form>
					</div>
				</article>
			{/each}
		</section>
	{/if}
</main>

<style>
	.admin-stories {
		width: min(1040px, calc(100% - 2rem));
		margin: 0 auto;
		padding: 2rem 0 4rem;
	}

	.hero {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: flex-end;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.hero p {
		color: var(--color-text-muted);
	}

	.eyebrow {
		margin-bottom: 0.25rem;
		font-size: 0.8rem;
		font-weight: 750;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.hero a {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.notice,
	.story-card {
		border: 1px solid var(--color-border);
		border-radius: 1rem;
		background: var(--color-surface);
		padding: 1rem;
	}

	.notice {
		color: var(--color-text-muted);
	}

	.notice.success {
		color: var(--color-success);
	}

	.notice.error {
		color: var(--color-danger);
	}

	.status-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0 0 1rem;
	}

	.status-filters a {
		border: 1px solid var(--color-border);
		border-radius: 999px;
		padding: 0.45rem 0.75rem;
		color: var(--color-text-muted);
		font-size: 0.9rem;
		font-weight: 700;
		text-decoration: none;
	}

	.status-filters a.active {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.story-list {
		display: grid;
		gap: 1rem;
	}

	.story-head {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		justify-content: space-between;
	}

	.date,
	.meta {
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.status-badge {
		border: 1px solid var(--color-border);
		border-radius: 999px;
		padding: 0.35rem 0.65rem;
		color: var(--color-text-muted);
		font-size: 0.85rem;
		font-weight: 750;
	}

	.content {
		margin-top: 1rem;
		white-space: pre-wrap;
		line-height: 1.7;
	}

	.ai-flag {
		margin-top: 1rem;
		border-left: 3px solid var(--color-warning);
		padding-left: 0.75rem;
		color: var(--color-text-muted);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	button {
		border: 0;
		border-radius: 999px;
		background: var(--color-primary);
		color: white;
		padding: 0.75rem 1rem;
		font-weight: 750;
		cursor: pointer;
	}

	button.secondary {
		background: var(--color-danger);
	}

	button.danger-ghost {
		border: 1px solid var(--color-danger);
		background: transparent;
		color: var(--color-danger);
	}

	button:disabled {
		cursor: wait;
		opacity: 0.7;
	}
</style>
