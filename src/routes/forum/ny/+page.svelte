<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let title = $state((form as { title?: string } | null)?.title ?? '');
	let body = $state((form as { body?: string } | null)?.body ?? '');
	let selectedCategory = $state(
		(form as { categoryId?: string } | null)?.categoryId ?? data.preselectedCategory
	);
	let isAnonymous = $state((form as { isAnonymous?: boolean } | null)?.isAnonymous ?? false);
	let submitting = $state(false);

	const TITLE_MAX = 200;
	const BODY_MAX = 5000;
</script>

<svelte:head>
	<title>Nytt inlägg – Forum – MittPsyke</title>
</svelte:head>

<div class="new-post-page">
	<!-- Breadcrumb -->
	<nav class="breadcrumb" aria-label="Brödsmulor">
		<a href="/forum" class="breadcrumb__link">Forum</a>
		<span class="breadcrumb__sep" aria-hidden="true">›</span>
		{#if selectedCategory}
			<a href="/forum/{selectedCategory}" class="breadcrumb__link">
				{data.categories.find((c) => c.id === selectedCategory)?.name ?? 'Samtalsrum'}
			</a>
			<span class="breadcrumb__sep" aria-hidden="true">›</span>
		{/if}
		<span class="breadcrumb__current">Nytt inlägg</span>
	</nav>

	<header class="new-post-header">
		<h1 class="new-post-header__title">Skriv ett nytt inlägg</h1>
		<p class="new-post-header__sub">
			Dela vad du bär på, en tanke, en fråga eller en upplevelse. Det finns inget rätt eller fel
			sätt att skriva här.
		</p>
	</header>

	{#if form?.error}
		<div class="form-error" role="alert">
			{form.error}
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
		class="new-post-form"
	>
		<!-- Samtalsrum -->
		<div class="form-group">
			<label for="category" class="form-label">Samtalsrum</label>
			<select
				id="category"
				name="category"
				required
				bind:value={selectedCategory}
				class="form-select"
			>
				<option value="" disabled>Välj ett samtalsrum...</option>
				{#each data.categories as cat}
					<option value={cat.id}>{cat.icon} {cat.name}</option>
				{/each}
			</select>
		</div>

		<!-- Rubrik -->
		<div class="form-group">
			<label for="title" class="form-label">Rubrik</label>
			<input
				id="title"
				name="title"
				type="text"
				required
				minlength="3"
				maxlength={TITLE_MAX}
				bind:value={title}
				placeholder="Vad handlar ditt inlägg om?"
				class="form-input"
				autocomplete="off"
			/>
			<p class="form-hint">{title.length}/{TITLE_MAX} tecken</p>
		</div>

		<!-- Brödtext -->
		<div class="form-group">
			<label for="body" class="form-label">Ditt inlägg</label>
			<textarea
				id="body"
				name="body"
				required
				minlength="10"
				maxlength={BODY_MAX}
				bind:value={body}
				rows="7"
				placeholder="Skriv vad du vill dela. Det kan vara en känsla, en fråga eller en berättelse..."
				class="form-textarea"
			></textarea>
			<p class="form-hint">{body.length}/{BODY_MAX} tecken</p>
		</div>

		<!-- Anonym/namn -->
		<div class="form-group form-group--inline">
			<label class="toggle-label">
				<input
					type="checkbox"
					name="anonymous"
					bind:checked={isAnonymous}
					class="toggle-checkbox"
				/>
				<span class="toggle-text">Publicera anonymt</span>
			</label>
			<p class="form-hint toggle-hint">
				{#if isAnonymous}
					Ditt inlägg visas som <strong>Anonym</strong> för andra.
				{:else if data.displayName}
					Ditt inlägg visas med namnet <strong>{data.displayName}</strong>.
				{:else}
					Ditt inlägg visas utan namn. Sätt ett visningsnamn under <a href="/dashboard/installningar"
						>inställningar</a
					> om du vill.
				{/if}
			</p>
		</div>

		<!-- Ansvarsfriskrivning -->
		<p class="form-disclaimer">
			Forumet ersätter inte vård eller professionellt stöd. Vid akut kris – kontakta
			<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer.se</a>
			eller ring 112.
		</p>

		<div class="form-actions">
			<button type="submit" class="btn btn--primary" disabled={submitting}>
				{submitting ? 'Publicerar...' : 'Publicera inlägg'}
			</button>
			<a href={selectedCategory ? `/forum/${selectedCategory}` : '/forum'} class="btn btn--ghost">
				Avbryt
			</a>
		</div>
	</form>
</div>

<style>
	.new-post-page {
		max-width: 42rem;
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

	.breadcrumb__current {
		color: hsl(var(--foreground));
	}

	/* Header */
	.new-post-header {
		margin-bottom: 1.75rem;
	}

	.new-post-header__title {
		font-family: var(--font-heading);
		font-size: clamp(1.375rem, 3.5vw, 1.75rem);
		font-weight: 700;
		color: hsl(var(--foreground));
		margin-bottom: 0.5rem;
	}

	.new-post-header__sub {
		font-size: 0.9375rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.6;
		margin: 0;
	}

	/* Error */
	.form-error {
		background: hsl(var(--error-surface));
		color: hsl(var(--error-foreground));
		border-radius: var(--radius-input);
		padding: 0.75rem 1rem;
		font-size: 0.9rem;
		margin-bottom: 1.25rem;
	}

	/* Form */
	.new-post-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		background: hsl(var(--surface));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		padding: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-group--inline {
		gap: 0.5rem;
	}

	.form-label {
		font-size: 0.9rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.form-input,
	.form-select,
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
		-webkit-appearance: none;
	}

	.form-select {
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		padding-right: 2.25rem;
	}

	.form-textarea {
		resize: vertical;
		min-height: 8rem;
		line-height: 1.6;
	}

	.form-input:focus,
	.form-select:focus,
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

	/* Anonym-toggle */
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
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.toggle-hint {
		padding-left: 1.6875rem;
	}

	.toggle-hint a {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* Disclaimer */
	.form-disclaimer {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.55;
		margin: 0;
		padding-top: 0.25rem;
		border-top: 1px solid hsl(var(--border));
	}

	.form-disclaimer a {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* Actions */
	.form-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

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

	.btn--ghost {
		background: transparent;
		color: hsl(var(--muted-foreground));
		padding-left: 0.5rem;
		padding-right: 0.5rem;
	}

	.btn--ghost:hover {
		color: hsl(var(--foreground));
	}
</style>
