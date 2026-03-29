<script lang="ts">
	import { supabase } from '$lib/supabase';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let isFollowing = $state(false);
	let followLoading = $state(false);

	$effect(() => {
		isFollowing = data.isFollowing;
	});

	async function getToken(): Promise<string | null> {
		const { data: { session } } = await supabase.auth.getSession();
		return session?.access_token ?? null;
	}

	async function toggleCategoryFollow() {
		if (!data.userId || followLoading) return;
		followLoading = true;
		const token = await getToken();
		if (!token) { followLoading = false; return; }
		const method = isFollowing ? 'DELETE' : 'POST';
		const res = await fetch('/api/forum/category-follows', {
			method,
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			body: JSON.stringify({ categoryId: data.category.id })
		});
		const json = await res.json();
		if (res.ok && json.success) isFollowing = json.following;
		followLoading = false;
	}

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
		return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
	}

	function authorLabel(thread: { is_anonymous: boolean; display_name: string | null }): string {
		if (thread.is_anonymous) return 'Anonym';
		return thread.display_name?.trim() || 'Namnlös';
	}

	const categoryLinks: Record<string, { label: string; href: string }[]> = {
		'angest-och-oro': [
			{ label: 'Guide om ångest', href: '/angest' },
			{ label: 'Andningsövningar mot ångest', href: '/andningsovningar-mot-angest' }
		],
		'nedstamdhet-och-tunga-dagar': [
			{ label: 'Guide om nedstämdhet och depression', href: '/depression' }
		],
		'stress-och-utmattning': [
			{ label: 'Guide om stress', href: '/stress' },
			{ label: 'Stöd vid stress', href: '/stod-vid-stress-online' }
		],
		'somn-och-nattankar': [
			{ label: 'Guide om sömnproblem', href: '/sovproblem' }
		],
		'relationer-och-ensamhet': [
			{ label: 'Guide om ensamhet', href: '/ensamhet' }
		],
		'sjalvkansla-och-sjalvkritik': [
			{ label: 'Guide om självkänsla', href: '/sjalvkansla' }
		],
		'trauma-och-svara-upplevelser': [
			{ label: 'Guide om trauma', href: '/trauma' },
			{ label: 'Stöd vid PTSD', href: '/stod-vid-ptsd-online' }
		]
	};

	const relatedLinks = $derived(categoryLinks[data.category.id] ?? []);
</script>

<svelte:head>
	<title>{data.category.name} – Samtalsrum | MittPsyke Forum</title>
	<meta name="description" content={data.category.description} />
	<link rel="canonical" href="https://www.mittpsyke.se/forum/{data.category.id}" />
	<meta property="og:title" content="{data.category.name} – Samtalsrum | MittPsyke Forum" />
	<meta property="og:description" content={data.category.description} />
	<meta property="og:url" content="https://www.mittpsyke.se/forum/{data.category.id}" />
	<meta property="og:type" content="website" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "CollectionPage",
				"name": data.category.name + " – Samtalsrum | MittPsyke Forum",
				"description": data.category.description,
				"url": "https://www.mittpsyke.se/forum/" + data.category.id,
				"isPartOf": { "@type": "WebSite", "name": "MittPsyke", "url": "https://www.mittpsyke.se" },
				"about": { "@type": "Thing", "name": data.category.name },
				"inLanguage": "sv-SE"
			},
			{
				"@type": "BreadcrumbList",
				"itemListElement": [
					{ "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://www.mittpsyke.se" },
					{ "@type": "ListItem", "position": 2, "name": "Forum", "item": "https://www.mittpsyke.se/forum" },
					{ "@type": "ListItem", "position": 3, "name": data.category.name, "item": "https://www.mittpsyke.se/forum/" + data.category.id }
				]
			}
		]
	})}<\/script>`}
</svelte:head>

<div class="room-page">
	<!-- Breadcrumb -->
	<nav class="breadcrumb" aria-label="Brödsmulor">
		<a href="/forum" class="breadcrumb__link">Forum</a>
		<span class="breadcrumb__sep" aria-hidden="true">›</span>
		<span class="breadcrumb__current">{data.category.name}</span>
	</nav>

	<!-- Rubriken för samtalsrummet -->
	<header class="room-header">
		<span class="room-header__icon" aria-hidden="true">{data.category.icon}</span>
		<div>
			<p class="room-header__label">Samtalsrum</p>
			<h1 class="room-header__title">{data.category.name}</h1>
			<p class="room-header__desc">{data.category.description}</p>
		</div>
	</header>

	<!-- Åtgärdsrad -->
	<div class="room-actions">
		{#if data.userId}
			<a href="/forum/ny?kategori={data.category.id}" class="btn btn--primary">
				Skriv nytt inlägg
			</a>
			<button
				class="action-btn"
				class:action-btn--following={isFollowing}
				onclick={toggleCategoryFollow}
				disabled={followLoading}
				title={isFollowing ? 'Sluta följa det här samtalsrummet' : 'Få notis när någon skapar ett nytt inlägg här'}
			>
				{followLoading ? '…' : isFollowing ? 'Följer rum' : 'Följ rum'}
			</button>
		{:else}
			<a href="/login?redirect=/forum/ny?kategori={data.category.id}" class="btn btn--secondary">
				Logga in för att skriva
			</a>
		{/if}
		<span class="room-actions__count">
			{data.threads.length === 0
				? 'Inga inlägg än'
				: data.threads.length === 1
					? '1 inlägg'
					: `${data.threads.length} inlägg`}
		</span>
	</div>

	<!-- Trådlista -->
	{#if data.threads.length === 0}
		<div class="room-empty">
			<p class="room-empty__text">
				Det finns inga inlägg här än. Var den första att dela något i det här samtalsrummet.
			</p>
			{#if !data.userId}
				<a href="/login" class="btn btn--secondary">Logga in och skriv</a>
			{/if}
		</div>
	{:else}
		<ol class="thread-list" role="list">
			{#each data.threads as thread (thread.id)}
				<li class="thread-item">
					<a href="/forum/thread/{thread.id}" class="thread-link">
						<div class="thread-link__main">
							<span class="thread-link__title">{thread.title}</span>
							<div class="thread-link__meta">
								<span class="thread-link__author">{authorLabel(thread)}</span>
								<span class="thread-link__sep" aria-hidden="true">·</span>
								<time datetime={thread.created_at} class="thread-link__time">
									{formatRelativeTime(thread.created_at)}
								</time>
							</div>
						</div>
						<div class="thread-link__aside">
							<span class="thread-link__replies">
								{thread.reply_count}
								{thread.reply_count === 1 ? 'svar' : 'svar'}
							</span>
							<span class="thread-link__arrow" aria-hidden="true">›</span>
						</div>
					</a>
				</li>
			{/each}
		</ol>
	{/if}

	{#if relatedLinks.length > 0}
		<aside class="related-reading" aria-label="Relaterat innehåll">
			<p>Läs mer:
				{#each relatedLinks as link, i}
					<a href={link.href}>{link.label}</a>{i < relatedLinks.length - 1 ? '\u00a0·\u00a0' : ''}
				{/each}
			</p>
		</aside>
	{/if}
</div>

<style>
	.room-page {
		max-width: 48rem;
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
	.room-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1.75rem;
	}

	.room-header__icon {
		font-size: 2rem;
		line-height: 1;
		margin-top: 0.125rem;
		flex-shrink: 0;
	}

	.room-header__label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin: 0 0 0.25rem;
	}

	.room-header__title {
		font-family: var(--font-heading);
		font-size: clamp(1.375rem, 3.5vw, 1.75rem);
		font-weight: 700;
		color: hsl(var(--foreground));
		margin: 0 0 0.5rem;
	}

	.room-header__desc {
		font-size: 0.9375rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.6;
		margin: 0;
		max-width: 38rem;
	}

	/* Actions */
	.room-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.room-actions__count {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	/* Följ-knapp */
	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.875rem;
		font-weight: 500;
		padding: 0.4rem 0.875rem;
		border-radius: var(--radius-pill);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-muted));
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: background 0.15s, color 0.15s, border-color 0.15s;
	}

	.action-btn:hover:not(:disabled) {
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
	}

	.action-btn--following {
		background: color-mix(in srgb, var(--primary) 12%, transparent);
		border-color: var(--primary);
		color: var(--primary);
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.9375rem;
		font-weight: 500;
		padding: 0.5rem 1.125rem;
		border-radius: var(--radius-pill);
		text-decoration: none;
		transition: opacity 0.15s, background 0.15s;
		cursor: pointer;
		border: none;
	}

	.btn--primary {
		background: var(--primary);
		color: #fff;
	}

	.btn--primary:hover {
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

	/* Tom lista */
	.room-empty {
		text-align: center;
		padding: 3rem 1.5rem;
		background: hsl(var(--surface));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.room-empty__text {
		font-size: 0.9375rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.6;
		margin: 0;
	}

	/* Trådlista */
	.thread-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		overflow: hidden;
	}

	.thread-item {
		border-bottom: 1px solid hsl(var(--border));
	}

	.thread-item:last-child {
		border-bottom: none;
	}

	.thread-link {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.875rem 1.125rem;
		text-decoration: none;
		color: inherit;
		background: hsl(var(--surface));
		transition: background 0.12s;
	}

	.thread-link:hover {
		background: hsl(var(--surface-muted));
	}

	.thread-link:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: -2px;
	}

	.thread-link__main {
		flex: 1;
		min-width: 0;
	}

	.thread-link__title {
		display: block;
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		margin-bottom: 0.25rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.thread-link__meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	.thread-link__sep {
		opacity: 0.4;
	}

	.thread-link__aside {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.thread-link__replies {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
	}

	.thread-link__arrow {
		color: hsl(var(--muted-foreground));
		opacity: 0.5;
		font-size: 1.125rem;
	}

	/* Kontextuell länkning */
	.related-reading {
		margin-top: 2rem;
		padding-top: 1.25rem;
		border-top: 1px solid hsl(var(--border));
		font-size: 0.875rem;
	}

	.related-reading p {
		margin: 0;
		color: hsl(var(--muted-foreground));
	}

	.related-reading a {
		color: var(--primary);
		text-decoration: none;
	}

	.related-reading a:hover {
		text-decoration: underline;
	}
</style>
