<section class="research-evidence" aria-label="Forskning och evidens">
	<h2>Forskning &amp; evidens</h2>
	<p>
		Forskning visar att digitalt stöd för psykisk hälsa kan ha positiva effekter, särskilt när
		information kombineras med aktiva delar som reflektion, övningar och stöd. MittPsyke är
		utformat i den riktningen – som ett lugnt komplement för stöd, struktur och egen reflektion.
	</p>
	<p class="research-source">Källa: Yeo et al., Journal of Medical Internet Research, 2024</p>
	<p class="research-note">MittPsyke ersätter inte vård, diagnos eller akut hjälp.</p>
</section>

<style>
	.research-evidence {
		max-width: 720px;
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(15, 23, 42, 0.1);
		background: rgba(248, 250, 252, 0.82);
		display: grid;
		gap: 0.65rem;
	}

	.research-evidence h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: clamp(1.1rem, 1.03rem + 0.4vw, 1.25rem);
		line-height: 1.25;
		letter-spacing: -0.015em;
		color: var(--primary);
	}

	.research-evidence p {
		margin: 0;
		font-family: var(--font-body);
		font-size: clamp(0.98rem, 0.94rem + 0.2vw, 1.02rem);
		line-height: 1.65;
	}

	.research-source {
		font-size: 0.92rem;
		opacity: 0.84;
	}

	.research-note {
		font-size: 0.9rem;
		opacity: 0.82;
	}

	@media (max-width: 640px) {
		.research-evidence {
			padding: 0.9rem;
			gap: 0.6rem;
		}
	}

	:global(.dark) .research-evidence {
		background: #1a1a1a;
		border-color: rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .research-evidence h2 {
		color: #86dfd6;
	}

	:global(.dark) .research-evidence p {
		color: rgba(255, 255, 255, 0.85);
	}
</style>
