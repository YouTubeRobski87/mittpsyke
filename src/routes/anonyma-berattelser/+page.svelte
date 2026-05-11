<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { getAgeRangeLabel, getGenderLabel } from '$lib/data/anonymous-stories';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.pageSize)));
	const jsonLdScript = $derived(JSON.stringify(data.jsonLd).replaceAll('<', '\\u003c'));

	function storyMeta(gender: string | null, ageRange: string | null) {
		return [getGenderLabel(gender), getAgeRangeLabel(ageRange)].filter(Boolean).join(', ');
	}

	function pageHref(page: number) {
		return page <= 1 ? '/anonyma-berattelser' : `/anonyma-berattelser?page=${page}`;
	}
</script>

<SEO canonical="https://www.mittpsyke.se/anonyma-berattelser" />

<svelte:head>
	<title>Anonyma berättelser om psykisk hälsa | MittPsyke</title>
	<meta
		name="description"
		content="Läs anonyma berättelser om psykisk hälsa hos MittPsyke, eller dela din egen berättelse i lugn takt."
	/>
	{@html `<script type="application/ld+json">${jsonLdScript}</script>`}
</svelte:head>

<main class="stories-page mx-auto w-full px-5 py-10">
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
					{#if story.emotion_emoji}
						<p class="emoji" aria-hidden="true">{story.emotion_emoji}</p>
					{/if}
					<p class="content">{story.content}</p>
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
		border: 1px solid var(--color-border);
		border-radius: 1rem;
		background: var(--color-surface);
		padding: 1rem;
		box-shadow: 0 18px 55px rgba(15, 23, 42, 0.08);
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
