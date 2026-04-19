<section class="safety-strip" aria-label="Trygghetsinformation">
	<ul class="safety-list">
		<li class="safety-item">
			<p class="safety-label">Inte vård</p>
			<p class="safety-copy">Stöd för reflektion i vardagen, inte vård, diagnos eller akuthjälp.</p>
		</li>
		<li class="safety-item">
			<a class="safety-item-link" href="/skriv">
				<p class="safety-label">Börja anonymt</p>
				<p class="safety-copy">Du kan skriva direkt utan konto och komma igång i din egen takt.</p>
			</a>
		</li>
		<li class="safety-item">
			<a class="safety-item-link" href="/integritet">
				<p class="safety-label">Integritet</p>
				<p class="safety-copy">
					Läs hur data hanteras innan du börjar. Med konto kan du begära export och radering.
				</p>
			</a>
		</li>
		<li class="safety-item">
			<p class="safety-label">Vid akut läge</p>
			<p class="safety-copy">
				<a href="tel:112">Ring 112</a>, kontakta
				<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>
				eller se
				<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">stödlinjer</a>.
			</p>
		</li>
	</ul>
</section>

<style>
	.safety-strip {
		margin-top: 1rem;
		padding: 0.85rem 0.95rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: var(--radius-card);
		backdrop-filter: blur(2px);
	}

	.safety-list {
		list-style: none;
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.7rem;
		margin: 0;
		padding: 0;
	}

	.safety-item {
		margin: 0;
		padding: 0;
	}

	.safety-item-link {
		display: block;
		color: inherit;
		text-decoration: none;
	}

	.safety-label {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.01em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.7);
	}

	.safety-copy {
		margin: 0.25rem 0 0;
		font-family: var(--font-body);
		font-size: 0.94rem;
		line-height: 1.55;
		color: rgba(255, 255, 255, 0.92);
	}

	.safety-copy a {
		color: #d7e7ff;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	@media (min-width: 680px) {
		.safety-list {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.9rem;
		}
	}
</style>
