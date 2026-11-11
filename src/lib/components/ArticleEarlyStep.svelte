<script lang="ts">
	import type { EarlyNextStep } from '$lib/article-next-step';

	let { step }: { step: EarlyNextStep } = $props();
</script>

<!-- En kort, lugn rad en bit in i artikeln. Ingen popup och inget som
     skymmer texten, bara en väg vidare för den som vill. -->
<aside class="article-early-step" aria-label="Ett litet nästa steg">
	<p>{step.text}</p>
	<a href={step.href}>{step.label}</a>
</aside>

<style>
	.article-early-step {
		display: grid;
		gap: 0.45rem;
		margin: 0.4rem 0;
		padding: 0.85rem 1rem;
		border-left: 3px solid #60a5fa;
		border-radius: 0 var(--radius-input) var(--radius-input) 0;
		background: rgba(96, 165, 250, 0.08);
	}

	.article-early-step p {
		margin: 0;
		font-size: clamp(0.98rem, 0.95rem + 0.25vw, 1.04rem);
		line-height: 1.6;
	}

	.article-early-step a {
		justify-self: start;
		color: #2563eb;
		font-family: var(--font-heading);
		font-weight: 700;
		text-decoration: underline;
		text-decoration-thickness: 1.5px;
		text-underline-offset: 3px;
	}

	:global(.dark) .article-early-step a {
		color: #93c5fd;
	}
</style>
