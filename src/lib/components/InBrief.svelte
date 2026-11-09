<script lang="ts">
	import { positioningCopy } from '$lib/positioning-copy';

	// "I korthet": en kort, citerbar sammanfattning under sidans rubrik. Texten
	// (lead) är sidans egen, avgränsningen kommer alltid från positioningCopy så
	// att den aldrig kan utelämnas eller formuleras om på en enskild sida.
	let { lead, extra }: { lead: string; extra?: string } = $props();
</script>

<aside class="in-brief" aria-label="I korthet">
	<h2 class="in-brief-title">I korthet</h2>
	<p>{lead}</p>
	{#if extra}
		<p>{extra}</p>
	{/if}
	<p class="in-brief-boundary">{positioningCopy.boundary}</p>
</aside>

<style>
	.in-brief {
		max-width: 720px;
		min-width: 0;
		padding: 1rem 1.15rem;
		border-left: 3px solid color-mix(in srgb, var(--primary, currentColor) 40%, transparent);
		border-radius: 0.5rem;
		background: color-mix(in srgb, var(--primary, currentColor) 6%, transparent);
		display: grid;
		gap: 0.5rem;
	}

	.in-brief-title {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: 0;
	}

	.in-brief p {
		margin: 0;
		font-size: 1rem;
		line-height: 1.6;
		overflow-wrap: break-word;
	}

	.in-brief-boundary {
		font-size: 0.92rem;
		opacity: 0.85;
	}
</style>
