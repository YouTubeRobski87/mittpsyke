<script lang="ts">
	import {
		EDITORIAL_METHOD_HREF,
		EDITORIAL_METHOD_LABEL,
		EDITORIAL_REVIEW_STATUS,
		normalizeAuthorName
	} from '$lib/editorial';

	// Visar samma avsändare som sidans JSON-LD, plus granskningsstatusen.
	// Utan författare (t.ex. på ämnessidor) visas bara statusen. showStatus
	// stängs av där statusen redan står i sidans källblock, så att den inte
	// upprepas på samma sida.
	type Props = { author?: string; showStatus?: boolean };

	let { author, showStatus = true }: Props = $props();

	const displayAuthor = $derived(author ? normalizeAuthorName(author) : null);
</script>

<p class="editorial-byline" data-testid="editorial-byline">
	{#if displayAuthor}<span class="byline-author">Av {displayAuthor}</span>{/if}
	{#if showStatus}
		<span class="byline-status">{EDITORIAL_REVIEW_STATUS}.</span>
		<a class="byline-link" href={EDITORIAL_METHOD_HREF}>{EDITORIAL_METHOD_LABEL}</a>
	{/if}
</p>

<style>
	.editorial-byline {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem 0.5rem;
		margin: 0.7rem 0 0;
		font-size: 0.9rem;
		line-height: 1.5;
		color: hsl(var(--foreground) / 0.72);
	}

	.byline-author {
		font-weight: 600;
		color: hsl(var(--foreground) / 0.86);
	}

	.byline-link {
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}

	.byline-link:hover {
		text-decoration: none;
	}
</style>
