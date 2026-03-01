<script lang="ts">
	import { portals } from '$lib/data/portals';
</script>

<svelte:head>
	<title>MittPsyke - Tryggt stod for ditt psyke</title>
</svelte:head>

<main class="staging-look">
	<section class="hero-section" aria-label="Introduktion till MittPsyke">
		<div class="hero-content">
			<img src="/assets/MittPsykeLogo1.png" alt="MittPsyke logotyp" class="hero-logo" />
			<h1>Valkommen till MittPsyke</h1>
			<p>
				Hitta ratt stod for psykiskt maende pa ett enkelt och tryggt satt.
			</p>
			<a href="/om-mittpsyke" class="hero-cta">Las mer om MittPsyke</a>
		</div>
	</section>

	<section class="band band-olive">
		<div class="narrow intro-grid">
			<img
				src="/assets/home/intro.jpg"
				alt="Person i samtal"
				loading="lazy"
			/>
			<div>
				<h2>Ett tryggt rum online</h2>
				<p>
					MittPsyke ar byggt for att ge lugn, struktur och varsamt stod nar tankarna blir tunga.
				</p>
				<p>
					Du valjer sjalv tempo, fokus och vilken inriktning som passar din situation just nu.
				</p>
			</div>
		</div>
	</section>

	<section class="band band-brown">
		<div class="narrow support-grid">
			<div>
				<h2>Din vag till psykiskt stod</h2>
				<p>
					Varje portal ar specialiserad for att skapa ett mer traffsakert och tryggt samtal.
				</p>
				<ul>
					<li>stabilt stod for oro och angest</li>
					<li>varsam struktur vid nedstamdhet</li>
					<li>fokus pa trygghet och granssattning vid trauma</li>
				</ul>
				<p>
					Målet ar inte snabba svar, utan ett hallbart samtal dar du kan landa och ta nasta steg.
				</p>
			</div>
			<img
				src="/assets/home/support.jpg"
				alt="Reflektion och digitalt samtal"
				loading="lazy"
			/>
		</div>
	</section>

	<section class="band band-taupe">
		<div class="narrow">
			<h2 class="cards-title">Valj fokusomrade</h2>
			<div class="portal-cards">
				{#each portals as portal}
					<a class="portal-card" href={`/chat/${portal.key}`}>
						<span class="portal-icon">{portal.icon}</span>
						<h3>{portal.title}</h3>
						<p>{portal.description}</p>
						<span class="portal-link">Starta samtal</span>
					</a>
				{/each}
			</div>
		</div>
	</section>
</main>

<style>
	.staging-look {
		width: 100%;
		color: #f5f5f2;
	}

	.hero-section {
		min-height: 88vh;
		display: grid;
		place-items: center;
		padding: 2rem 1.25rem;
		background-image: linear-gradient(rgba(28, 28, 28, 0.52), rgba(23, 23, 23, 0.58)),
			url('/assets/home/25308540-alzheimer-disease-e1669787685700.jpg');
		background-size: cover;
		background-position: center;
	}

	.hero-content {
		width: min(560px, 100%);
		text-align: center;
		padding: 1.3rem 1.6rem 1.6rem;
		background: rgba(39, 45, 53, 0.56);
		border: 1px solid rgba(255, 255, 255, 0.18);
	}

	.hero-logo {
		display: block;
		width: min(220px, 60%);
		margin: 0 auto 1rem;
		opacity: 0.84;
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 3.9vw, 3.2rem);
		line-height: 1.08;
	}

	.hero-content p {
		margin: 0.95rem auto 0;
		max-width: 45ch;
		font-size: clamp(1rem, 1.7vw, 1.15rem);
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.9);
	}

	.hero-cta {
		display: inline-block;
		margin-top: 1.2rem;
		padding: 0.62rem 1rem;
		font-size: 0.85rem;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		background: #8ca36a;
		color: #182016;
		font-weight: 700;
		border-radius: 999px;
	}

	.band {
		padding: clamp(3rem, 8vw, 7rem) 1.25rem;
	}

	.band-olive {
		background: #7e8c5a;
	}

	.band-brown {
		background: #56453d;
	}

	.band-taupe {
		background: #78645a;
	}

	.narrow {
		width: min(760px, 100%);
		margin: 0 auto;
	}

	.intro-grid,
	.support-grid {
		display: grid;
		grid-template-columns: 1fr 1.2fr;
		gap: 1.6rem;
		align-items: center;
	}

	.intro-grid img,
	.support-grid img {
		width: 100%;
		height: clamp(220px, 30vw, 340px);
		object-fit: cover;
		border: 1px solid rgba(255, 255, 255, 0.25);
	}

	h2 {
		margin: 0;
		font-size: clamp(1.6rem, 3vw, 2.3rem);
		line-height: 1.15;
	}

	.band p {
		margin: 0.85rem 0 0;
		line-height: 1.7;
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.9);
	}

	ul {
		margin: 1rem 0 0;
		padding-left: 1.2rem;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.9);
	}

	.cards-title {
		margin-bottom: 1.2rem;
		text-align: center;
	}

	.portal-cards {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.9rem;
	}

	.portal-card {
		display: block;
		padding: 1rem;
		background: rgba(33, 29, 27, 0.46);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: inherit;
	}

	.portal-icon {
		display: inline-flex;
		width: 2rem;
		height: 2rem;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		margin-bottom: 0.55rem;
		background: rgba(255, 255, 255, 0.16);
		border-radius: 999px;
	}

	.portal-card h3 {
		margin: 0;
		font-size: 1.05rem;
	}

	.portal-card p {
		margin: 0.55rem 0 0;
		font-size: 0.94rem;
		line-height: 1.55;
	}

	.portal-link {
		display: inline-block;
		margin-top: 0.8rem;
		font-size: 0.76rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #d7e8b8;
	}

	@media (max-width: 900px) {
		.intro-grid,
		.support-grid {
			grid-template-columns: 1fr;
		}

		.portal-cards {
			grid-template-columns: 1fr;
		}

		.hero-content {
			padding: 1.1rem 1rem 1.2rem;
		}
	}
</style>


