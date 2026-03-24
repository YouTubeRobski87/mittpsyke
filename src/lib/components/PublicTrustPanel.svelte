<script lang="ts">
	type TrustSource = {
		label: string;
		href: string;
	};

	type Props = {
		updatedDate: string;
		sources?: TrustSource[];
	};

	let { updatedDate, sources = [] }: Props = $props();
</script>

<section class="trust-panel" aria-label="Trygg information och källor">
	<p class="updated-date">Senast uppdaterad: {updatedDate}</p>
	<p class="trust-copy">
		MittPsyke är en lugn första ingång för reflektion och stöd i egen takt. Innehållet ersätter
		inte vård, diagnos eller behandling.
	</p>
	<p class="trust-copy">
		Vid akut fara, ring <a href="tel:112">112</a>. För vårdråd, kontakta
		<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>. För vidare
		stöd finns
		<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">stodlinjer.se</a>.
	</p>

	{#if sources.length}
		<h2>Källor</h2>
		<ul>
			{#each sources as source}
				<li>
					<a href={source.href} target="_blank" rel="noopener noreferrer">{source.label}</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.trust-panel {
		margin-top: clamp(2rem, 4vw, 3rem);
		padding-top: 1.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	.updated-date {
		margin: 0 0 0.8rem;
		font-size: 0.8rem;
		line-height: 1.5;
		color: rgba(0, 0, 0, 0.58);
	}

	h2 {
		margin: 1rem 0 0.45rem;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.trust-copy,
	li {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.7;
	}

	.trust-copy + .trust-copy {
		margin-top: 0.65rem;
	}

	ul {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
	}

	a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	:global(.dark) .trust-panel {
		border-top-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .updated-date {
		color: rgba(255, 255, 255, 0.56);
	}
</style>
