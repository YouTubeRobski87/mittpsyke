<script lang="ts">
	import type { SourceItem } from '$lib/seo-kit/content';

	type Props = {
		updatedAt?: string;
		sources?: SourceItem[];
		showEmergencyNote?: boolean;
		showSupportLinks?: boolean;
		contentLinkHref?: string;
	};

	let {
		updatedAt,
		sources = [],
		showEmergencyNote = false,
		showSupportLinks = false,
		contentLinkHref = '/sa-arbetar-vi-med-innehall'
	}: Props = $props();

	function formatDate(iso: string): string {
		const formatter = new Intl.DateTimeFormat('sv-SE', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});

		return formatter.format(new Date(`${iso}T00:00:00`));
	}
</script>

<section class="trust-block" aria-label="Om innehållet">
	{#if updatedAt}
		<p class="meta">Senast uppdaterad: {formatDate(updatedAt)}</p>
	{/if}

	{#if sources.length}
		<h2>Källor</h2>
		<ul>
			{#each sources as source}
				<li>
					<a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>
				</li>
			{/each}
		</ul>
	{/if}

	<p class="note">
		Innehållet är vägledande och skrivet för reflektion och ökad förståelse. Det ersätter inte vård,
		diagnos eller behandling.
	</p>

	{#if showEmergencyNote}
		<p class="note emergency">
			Vid akut fara, ring <a href="tel:112">112</a>. För vårdråd, kontakta
			<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>.
		</p>
	{/if}

	{#if showSupportLinks}
		<p class="note">
			Om du vill fortsätta i egen takt kan du <a href="/dagbok">skriva i dagboken</a> eller
			<a href="/ovningar">prova en övning</a>.
		</p>
	{/if}

	<p class="more">
		<a href={contentLinkHref}>Läs mer om hur vi arbetar med innehåll</a>
	</p>
</section>

<style>
	.trust-block {
		margin-top: clamp(2rem, 4vw, 3rem);
		padding: 1.1rem 0 0;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	.meta {
		margin: 0 0 0.55rem;
		font-size: 0.82rem;
		line-height: 1.5;
		color: rgba(0, 0, 0, 0.58);
	}

	h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	ul {
		margin: 0.6rem 0 0;
		padding-left: 1.1rem;
	}

	li + li {
		margin-top: 0.4rem;
	}

	li,
	.note,
	.more {
		font-size: 0.95rem;
		line-height: 1.65;
	}

	.note,
	.more {
		margin: 0.8rem 0 0;
	}

	a {
		color: inherit;
		text-decoration: underline;
		text-decoration-thickness: from-font;
		text-underline-offset: 0.14em;
	}

	.emergency {
		color: rgba(0, 0, 0, 0.74);
	}

	:global(.dark) .trust-block {
		border-top-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .meta {
		color: rgba(255, 255, 255, 0.56);
	}

	:global(.dark) .emergency {
		color: rgba(255, 255, 255, 0.76);
	}
</style>
