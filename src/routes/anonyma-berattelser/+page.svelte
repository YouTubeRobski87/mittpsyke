<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { getAgeRangeLabel, getGenderLabel } from '$lib/data/anonymous-stories';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const STORY_EXCERPT_LENGTH = 420;

	let expandedStoryIds = $state<Set<string>>(new Set());

	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.pageSize)));
	const jsonLdScript = $derived(
		JSON.stringify(data.jsonLd)
			.replace(/</g, '\\u003c')
			.replace(/\u2028/g, '\\u2028')
			.replace(/\u2029/g, '\\u2029')
	);

	function storyMeta(gender: string | null, ageRange: string | null) {
		return [getGenderLabel(gender), getAgeRangeLabel(ageRange)].filter(Boolean).join(', ');
	}

	function pageHref(page: number) {
		return page <= 1 ? '/anonyma-berattelser' : `/anonyma-berattelser?page=${page}`;
	}

	function publishedLabel(value: string | null | undefined) {
		if (!value) return 'Publicerad anonymt';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return 'Publicerad anonymt';

		return `Publicerad ${new Intl.DateTimeFormat('sv-SE', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(date)}`;
	}

	function storyExcerpt(value: string) {
		const normalized = value.replace(/\s+/g, ' ').trim();
		if (normalized.length <= STORY_EXCERPT_LENGTH) return normalized;

		const excerpt = normalized.slice(0, STORY_EXCERPT_LENGTH);
		const lastSpace = excerpt.lastIndexOf(' ');

		return `${excerpt.slice(0, lastSpace > 300 ? lastSpace : STORY_EXCERPT_LENGTH).trimEnd()}...`;
	}

	function hasLongContent(value: string) {
		return value.replace(/\s+/g, ' ').trim().length > STORY_EXCERPT_LENGTH;
	}

	function isStoryExpanded(id: string) {
		return expandedStoryIds.has(id);
	}

	function toggleStory(id: string) {
		const next = new Set(expandedStoryIds);

		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}

		expandedStoryIds = next;
	}
</script>

<SEO canonical="https://www.mittpsyke.se/anonyma-berattelser" />

<svelte:head>
	<title>Anonyma berättelser om psykisk hälsa | MittPsyke</title>
	<meta
		name="description"
		content="Läs anonyma berättelser om psykisk hälsa hos MittPsyke, eller dela din egen berättelse i lugn takt."
	/>
	{@html `<script type="application/ld+json">${jsonLdScript}<\/script>`}
</svelte:head>

<main class="stories-page mx-auto w-full px-5 py-10">
	<Breadcrumbs items={[{ label: 'Berättelser' }]} />

	<section class="stories-hero">
		<div>
			<p class="eyebrow">Anonyma berättelser</p>
			<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Berättelser från andra som känt något liknande</h1>
			<p>
				Här samlas anonyma berättelser om psykisk hälsa. De är inte råd eller vård, men
				kan vara ett lugnt sätt att känna igen sig och inte behöva bära allt ensam.
			</p>
		</div>
		<a class="cta" href="/anonyma-berattelser/dela">Dela din berättelse</a>
	</section>

	{#if data.schemaMissing}
		<p class="empty">Berättelser är inte aktiverade ännu.</p>
	{:else if data.stories.length === 0}
		<p class="empty">Det finns inga publicerade berättelser ännu.</p>
	{:else}
		<section class="story-grid" aria-label="Anonyma berättelser">
			{#each data.stories as story}
				<article class="story-card">
					<header class="story-card-header">
						<div>
							<p class="story-card-kicker">Anonym berättelse</p>
							<p class="story-card-theme">Oro, stress och att skriva av sig</p>
						</div>
						<p class="story-card-date">{publishedLabel(story.approved_at)}</p>
					</header>
					<div class="story-card-body">
						{#if story.emotion_emoji}
							<p class="emoji" aria-hidden="true">{story.emotion_emoji}</p>
						{/if}
						<p class="content">{isStoryExpanded(story.id) ? story.content : storyExcerpt(story.content)}</p>
						{#if hasLongContent(story.content)}
							<button class="read-more" type="button" onclick={() => toggleStory(story.id)}>
								{isStoryExpanded(story.id) ? 'Visa mindre' : 'Läs vidare'}
							</button>
						{/if}
					</div>
					{#if storyMeta(story.gender, story.age_range)}
						<p class="meta">{storyMeta(story.gender, story.age_range)}</p>
					{/if}
				</article>
			{/each}
		</section>

		{#if totalPages > 1}
			<nav class="pagination" aria-label="Sidnavigering">
				{#if data.page > 1}
					<a href={pageHref(data.page - 1)}>Föregående</a>
				{/if}
				<span>Sida {data.page} av {totalPages}</span>
				{#if data.page < totalPages}
					<a href={pageHref(data.page + 1)}>Nästa</a>
				{/if}
			</nav>
		{/if}
	{/if}
</main>

<style>
	.stories-page {
		max-width: 1040px;
	}

	.stories-hero {
		display: grid;
		gap: 1.25rem;
		align-items: end;
		margin-bottom: 1.5rem;
	}

	.eyebrow {
		margin-bottom: 0.35rem;
		color: var(--color-text-muted);
		font-size: 0.8rem;
		font-weight: 750;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.stories-hero p:not(.eyebrow),
	.empty {
		color: var(--color-text-muted);
		line-height: 1.7;
	}

	.cta {
		display: inline-flex;
		justify-content: center;
		width: fit-content;
		border-radius: 999px;
		background: var(--color-primary);
		color: white;
		padding: 0.85rem 1.1rem;
		font-weight: 750;
		text-decoration: none;
	}

	.cta:hover {
		background: var(--color-primary-hover);
	}

	.story-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	.story-card {
		border: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
		border-radius: 1.15rem;
		background: linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 96%, white), var(--color-surface));
		padding: 1.15rem;
		box-shadow: 0 22px 70px rgba(15, 23, 42, 0.1);
	}

	.story-card-header {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: flex-start;
		justify-content: space-between;
		border-bottom: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent);
		padding-bottom: 0.9rem;
	}

	.story-card-kicker {
		color: var(--color-text);
		font-size: 0.95rem;
		font-weight: 780;
	}

	.story-card-theme,
	.story-card-date {
		color: var(--color-text-muted);
		font-size: 0.86rem;
		line-height: 1.45;
	}

	.story-card-date {
		border: 1px solid color-mix(in srgb, var(--color-border) 58%, transparent);
		border-radius: 999px;
		padding: 0.35rem 0.65rem;
		background: color-mix(in srgb, var(--color-bg-soft) 72%, transparent);
	}

	.story-card-body {
		margin-top: 1rem;
	}

	.emoji {
		margin-bottom: 0.5rem;
		font-size: 1.6rem;
	}

	.content {
		white-space: pre-wrap;
		color: var(--color-text);
		line-height: 1.7;
	}

	.read-more {
		margin-top: 0.75rem;
		color: var(--color-text);
		font-size: 0.95rem;
		font-weight: 750;
		text-decoration: underline;
		text-underline-offset: 0.22em;
	}

	.read-more:hover {
		color: var(--color-primary);
	}

	.meta {
		margin-top: 1rem;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.pagination {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		justify-content: center;
		margin-top: 1.5rem;
		color: var(--color-text-muted);
	}

	.pagination a {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	@media (min-width: 760px) {
		.stories-hero {
			grid-template-columns: minmax(0, 1fr) auto;
		}

		.story-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
