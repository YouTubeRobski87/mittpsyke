<script lang="ts">
	// Sektion C på startsidan: utveckling över tid. Tidigare låg här en stor
	// mockup av Mitt hem med webbläsarram, sidebar och avatar. Den konkurrerade
	// med produktstegen längre upp och sa mest att gränssnittet finns — inte vad
	// användaren faktiskt får ut över tid. Nu visas i stället de fyra löftena
	// direkt, med en enkel och tydligt märkt exempelvy.

	const overTimePoints = [
		{
			title: 'Vecka för vecka',
			text: 'Ditt mående ritas upp över tid, så att du inte behöver minnas hur det var själv.'
		},
		{
			title: 'Återkommande teman',
			text: 'Ord och ämnen som dyker upp ofta lyfts fram som observationer, inte som slutsatser.'
		},
		{
			title: 'Gå tillbaka när du vill',
			text: 'Det du har skrivit finns kvar. En dag som var svår eller ovanligt bra går alltid att läsa igen.'
		}
	];

	// Illustrativa staplar. Ingen användardata, inga påhittade siffror i text.
	const exampleWeeks = [
		{ label: 'v. 1', height: 38 },
		{ label: 'v. 2', height: 52 },
		{ label: 'v. 3', height: 44 },
		{ label: 'v. 4', height: 66 },
		{ label: 'v. 5', height: 58 },
		{ label: 'v. 6', height: 72 }
	];
</script>

<section id="utveckling-over-tid" class="over-time" aria-labelledby="over-time-title">
	<div class="over-time-inner">
		<div class="over-time-copy">
			<p class="over-time-label">Med tiden</p>
			<h2 id="over-time-title">Det blir tydligare med tiden</h2>
			<p class="over-time-intro">
				En enskild dag säger lite. Flera veckors anteckningar säger mer. När du har ett konto samlas
				det du skriver på ett ställe, så att du kan gå tillbaka och se hur det faktiskt har varit.
			</p>
			<ul class="over-time-points">
				{#each overTimePoints as point}
					<li>
						<h3>{point.title}</h3>
						<p>{point.text}</p>
					</li>
				{/each}
			</ul>
			<div class="over-time-actions">
				<a class="over-time-link over-time-link-primary" href="/register">Skapa konto</a>
				<a class="over-time-link" href="/login">Logga in</a>
			</div>
		</div>

		<figure class="over-time-example">
			<figcaption>Exempelvy — inte riktiga uppgifter</figcaption>
			<div class="example-chart" aria-hidden="true">
				{#each exampleWeeks as week}
					<span class="example-bar-wrap">
						<span class="example-bar" style="height: {week.height}%"></span>
						<small>{week.label}</small>
					</span>
				{/each}
			</div>
			<p class="example-note">Din egen bild växer fram ur det du skriver.</p>
		</figure>
	</div>
</section>

<style>
	.over-time {
		padding: clamp(2.4rem, 6vw, 3.8rem) 1.25rem;
		background: var(--home-section-bg-soft);
		color: var(--home-text-soft);
	}

	.over-time-inner {
		/* Samma bredd som .cards-narrow på startsidan. Den klassen är scopad till
		   +page.svelte och kan därför inte återanvändas här. */
		width: min(1080px, 100%);
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr;
		gap: clamp(1.4rem, 4vw, 2.5rem);
		align-items: start;
	}

	.over-time-label {
		margin: 0 0 0.45rem;
		font-family: var(--font-heading);
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--home-text-blue-muted-strong);
	}

	.over-time-copy h2 {
		margin: 0;
		color: var(--home-text-strong);
		font-size: clamp(1.5rem, 3vw, 2.1rem);
		line-height: 1.1;
	}

	.over-time-intro {
		margin: 0.8rem 0 0;
		max-width: 46ch;
		font-size: 0.96rem;
		line-height: 1.7;
		color: var(--home-text-muted-strong);
	}

	.over-time-points {
		margin: 1.25rem 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.9rem;
	}

	.over-time-points li {
		padding-left: 1rem;
		border-left: 2px solid rgba(var(--home-primary-rgb), 0.55);
	}

	.over-time-points h3 {
		margin: 0;
		color: var(--home-text-strong);
		font-size: 1rem;
	}

	.over-time-points p {
		margin: 0.4rem 0 0;
		max-width: 44ch;
		color: var(--home-text-muted-body);
		font-size: 0.93rem;
		line-height: 1.6;
	}

	.over-time-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.9rem;
		margin-top: 1.4rem;
	}

	.over-time-link {
		display: inline-flex;
		align-items: center;
		font-family: var(--font-heading);
		font-size: 0.9rem;
		font-weight: 650;
		color: var(--home-link);
		text-underline-offset: 3px;
	}

	.over-time-link-primary {
		padding: 0.6rem 1.1rem;
		border-radius: var(--radius-pill);
		background: var(--home-primary);
		color: var(--home-text-on-primary);
	}

	.over-time-link-primary:hover,
	.over-time-link-primary:focus-visible {
		box-shadow: 0 8px 22px var(--home-cta-shadow-hover);
	}

	.over-time-example {
		margin: 0;
		padding: clamp(0.9rem, 2.5vw, 1.3rem);
		border: 1px solid var(--home-card-border-soft);
		border-radius: clamp(1rem, 3vw, 1.5rem);
		background: linear-gradient(145deg, rgba(20, 34, 52, 0.98), rgba(8, 16, 29, 0.98));
	}

	.over-time-example figcaption {
		display: inline-flex;
		padding: 0.28rem 0.65rem;
		border-radius: var(--radius-pill);
		background: var(--home-primary-soft);
		color: var(--home-primary-text);
		font-family: var(--font-heading);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.03em;
	}

	.example-chart {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		align-items: end;
		gap: 0.45rem;
		height: 8.5rem;
		margin-top: 1rem;
	}

	.example-bar-wrap {
		display: grid;
		align-content: end;
		justify-items: center;
		gap: 0.4rem;
		height: 100%;
		min-width: 0;
	}

	.example-bar {
		width: 100%;
		max-width: 2.2rem;
		border-radius: 6px 6px 2px 2px;
		background: linear-gradient(180deg, rgba(var(--home-primary-rgb), 0.85), rgba(var(--home-primary-rgb), 0.35));
	}

	.example-bar-wrap small {
		font-size: 0.7rem;
		color: var(--home-text-muted-faint);
	}

	.example-note {
		margin: 0.9rem 0 0;
		font-size: 0.82rem;
		line-height: 1.55;
		color: var(--home-text-muted-faint);
	}

	@media (min-width: 900px) {
		.over-time-inner {
			grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
			align-items: center;
		}
	}

	@media (max-width: 420px) {
		.over-time {
			padding-inline: 1rem;
		}

		.example-chart {
			height: 7rem;
			gap: 0.3rem;
		}
	}

	:global(.dark) .over-time {
		background: var(--home-dark-bg-soft);
	}
</style>
