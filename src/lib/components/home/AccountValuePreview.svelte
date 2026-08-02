<script lang="ts">
	import { trackHomeCtaClick } from '$lib/analytics';

	const themes = ['Sömn', 'Oro', 'Återhämtning'];

	function trackCta(cta: string, href: string) {
		trackHomeCtaClick({ section: 'account_value_preview', cta, href });
	}
</script>

<section id="utveckling-over-tid" class="account-preview" aria-labelledby="account-preview-title">
	<div class="account-preview-inner">
		<div class="account-preview-copy">
			<p class="account-preview-eyebrow">När du är redo</p>
			<h2 id="account-preview-title">Se hur ditt mående förändras över tid</h2>
			<p class="account-preview-intro">
				Skapa ett konto när du är redo. Då kan du spara det du skriver, upptäcka återkommande
				teman och se din utveckling vecka för vecka.
			</p>

			<div class="account-preview-actions">
				<a
					class="account-preview-primary"
					href="/register"
					onclick={() => trackCta('skapa_konto_spara_min_resa', '/register')}
				>
					Skapa konto och spara min resa
				</a>
				<a
					class="account-preview-secondary"
					href="/dagbok?action=new"
					onclick={() => trackCta('fortsatt_anonymt', '/dagbok?action=new')}
				>
					Fortsätt anonymt
				</a>
			</div>
			<p class="account-preview-reassurance">Du väljer själv vad som sparas och kan radera det när du vill.</p>
		</div>

		<figure class="preview-surface">
			<figcaption class="example-label">Exempelvy</figcaption>

			<div class="mood-card">
				<div class="card-heading">
					<div>
						<p class="card-kicker">Mående över tid</p>
						<h3>Din vecka i lugn takt</h3>
					</div>
					<div class="periods" aria-label="Exempelperiod: 7 dagar">
						<span class="period-active">7 dagar</span><span>30</span><span>90</span>
					</div>
				</div>

				<div class="chart" aria-hidden="true">
					<svg viewBox="0 0 330 132" preserveAspectRatio="none">
						<path class="chart-grid" d="M8 24H322M8 66H322M8 108H322" />
						<path class="chart-area" d="M8 84 C35 77, 54 88, 80 72 S126 56, 154 66 S201 85, 230 59 S278 52, 322 39 L322 120 L8 120 Z" />
						<path class="chart-line" d="M8 84 C35 77, 54 88, 80 72 S126 56, 154 66 S201 85, 230 59 S278 52, 322 39" />
						<circle cx="230" cy="59" r="4" class="chart-point" />
					</svg>
					<div class="chart-days"><span>Mån</span><span>Ons</span><span>Fre</span><span>Sön</span></div>
				</div>
				<p class="chart-note">Det här är en enkel överblick, inte en bedömning av dig.</p>
			</div>

			<div class="preview-details">
				<section class="themes-card" aria-labelledby="themes-title">
					<p class="card-kicker">I dina anteckningar</p>
					<h3 id="themes-title">Återkommande teman</h3>
					<ul>
						{#each themes as theme}
							<li>{theme}</li>
						{/each}
					</ul>
				</section>

				<section class="home-card" aria-labelledby="home-title">
					<img
						src="/images/home-companion-fox-awake.webp"
						alt="Illustration av den lugna naturmiljön och räven som håller platsen sällskap i Mitt Hem."
						width="1536"
						height="1024"
						loading="lazy"
						decoding="async"
					/>
					<div class="home-card-copy">
						<p class="card-kicker">Mitt Hem</p>
						<h3 id="home-title">En plats som finns kvar</h3>
						<p>Din följeslagare håller platsen sällskap tills du återvänder.</p>
					</div>
				</section>
			</div>
		</figure>
	</div>
</section>

<style>
	.account-preview {
		padding: clamp(2.8rem, 7vw, 5rem) 1.25rem;
		background: var(--home-section-bg-soft);
		color: var(--home-text-soft);
	}

	.account-preview-inner {
		width: min(1080px, 100%);
		margin: 0 auto;
		display: grid;
		gap: clamp(1.75rem, 4vw, 3.5rem);
		align-items: center;
	}

	.account-preview-eyebrow,
	.card-kicker {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--home-text-blue-muted-strong);
	}

	.account-preview-copy h2 {
		margin: 0.5rem 0 0;
		max-width: 13ch;
		font-size: clamp(1.8rem, 3.4vw, 2.55rem);
		line-height: 1.08;
		color: var(--home-text-strong);
	}

	.account-preview-intro {
		margin: 0.9rem 0 0;
		max-width: 47ch;
		font-size: 1rem;
		line-height: 1.7;
		color: var(--home-text-muted-strong);
	}

	.account-preview-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
		margin-top: 1.45rem;
	}

	.account-preview-primary,
	.account-preview-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.8rem;
		padding: 0.65rem 1.05rem;
		border-radius: var(--radius-pill);
		font-family: var(--font-heading);
		font-size: 0.92rem;
		font-weight: 650;
		text-decoration: none;
	}

	.account-preview-primary {
		background: var(--home-primary);
		color: var(--home-text-on-primary);
		box-shadow: 0 8px 22px var(--home-cta-shadow);
	}

	.account-preview-secondary {
		color: var(--home-link);
		text-decoration: underline;
		text-underline-offset: 0.22em;
	}

	.account-preview-primary:hover,
	.account-preview-primary:focus-visible {
		box-shadow: 0 10px 26px var(--home-cta-shadow-hover);
	}

	.account-preview-primary:focus-visible,
	.account-preview-secondary:focus-visible {
		outline: 2px solid var(--home-link);
		outline-offset: 3px;
	}

	.account-preview-reassurance {
		margin: 0.85rem 0 0;
		max-width: 50ch;
		font-size: 0.82rem;
		line-height: 1.55;
		color: var(--home-text-muted-faint);
	}

	.preview-surface {
		position: relative;
		min-width: 0;
		margin: 0;
		padding: clamp(1rem, 2.5vw, 1.4rem);
		border: 1px solid var(--home-card-border-soft);
		border-radius: clamp(1rem, 3vw, 1.5rem);
		background: linear-gradient(145deg, rgba(20, 34, 52, 0.98), rgba(8, 16, 29, 0.98));
		box-shadow: 0 18px 42px var(--home-card-shadow);
	}

	.example-label {
		display: inline-flex;
		margin-bottom: 1rem;
		padding: 0.28rem 0.65rem;
		border-radius: var(--radius-pill);
		background: var(--home-primary-soft);
		color: var(--home-primary-text);
		font-family: var(--font-heading);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.03em;
	}

	.mood-card,
	.themes-card,
	.home-card {
		border: 1px solid var(--home-card-border);
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.045);
	}

	.mood-card,
	.themes-card {
		padding: 1rem;
	}

	.card-heading {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: start;
	}

	.mood-card h3,
	.themes-card h3,
	.home-card h3 {
		margin: 0.28rem 0 0;
		font-family: var(--font-heading);
		font-size: clamp(0.98rem, 2.6vw, 1.08rem);
		line-height: 1.25;
		color: var(--home-text-strong);
	}

	.periods {
		display: flex;
		gap: 0.12rem;
		padding: 0.18rem;
		border-radius: var(--radius-pill);
		background: rgba(255, 255, 255, 0.06);
		color: var(--home-text-muted-faint);
		font-size: 0.68rem;
		white-space: nowrap;
	}

	.periods span { padding: 0.26rem 0.38rem; }
	.periods .period-active { border-radius: var(--radius-pill); background: rgba(var(--home-primary-rgb), 0.25); color: var(--home-text-strong); }

	.chart { margin-top: 0.8rem; }
	.chart svg { display: block; width: 100%; height: 8.2rem; overflow: visible; }
	.chart-grid { fill: none; stroke: rgba(220, 225, 235, 0.14); stroke-width: 1; }
	.chart-area { fill: rgba(var(--home-primary-rgb), 0.14); }
	.chart-line { fill: none; stroke: #7db4e8; stroke-width: 3; stroke-linecap: round; }
	.chart-point { fill: #d7e7ff; stroke: #3a7bd5; stroke-width: 3; }
	.chart-days { display: flex; justify-content: space-between; margin-top: 0.2rem; color: var(--home-text-muted-faint); font-size: 0.7rem; }
	.chart-note { margin: 0.75rem 0 0; color: var(--home-text-muted-faint); font-size: 0.78rem; line-height: 1.5; }

	.preview-details { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: 0.8rem; margin-top: 0.8rem; }
	.themes-card ul { display: flex; flex-wrap: wrap; gap: 0.42rem; margin: 0.8rem 0 0; padding: 0; list-style: none; }
	.themes-card li { padding: 0.35rem 0.58rem; border: 1px solid var(--home-card-border-soft); border-radius: var(--radius-pill); color: var(--home-card-text); font-size: 0.78rem; }

	.home-card { overflow: hidden; display: grid; grid-template-columns: 5.75rem minmax(0, 1fr); }
	.home-card img { width: 100%; height: 100%; min-height: 7.2rem; object-fit: cover; }
	.home-card-copy { padding: 0.78rem; }
	.home-card-copy p:last-child { margin: 0.42rem 0 0; color: var(--home-text-muted-faint); font-size: 0.76rem; line-height: 1.45; }

	@media (min-width: 900px) {
		.account-preview-inner { grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr); }
	}

	@media (max-width: 420px) {
		.account-preview { padding-inline: 1rem; }
		.account-preview-actions { display: grid; }
		.account-preview-primary, .account-preview-secondary { width: 100%; box-sizing: border-box; }
		.preview-details { grid-template-columns: 1fr; }
		.home-card { grid-template-columns: 5rem minmax(0, 1fr); }
	}

	:global(.dark) .account-preview { background: var(--home-dark-bg-soft); }
</style>
