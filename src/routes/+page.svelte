<script lang="ts">
	import { portals } from '$lib/data/portals';
</script>

<svelte:head>
	<title>MittPsyke - Tryggt st&ouml;d f&ouml;r ditt psyke</title>
</svelte:head>

<main class="staging-look">
	<section class="hero-section" aria-label="Introduktion till MittPsyke">
		<div class="hero-content">
			<h1>V&auml;lkommen till MittPsyke</h1>
			<p>
				Hitta r&auml;tt st&ouml;d f&ouml;r psykiskt m&aring;ende p&aring; ett enkelt och tryggt s&auml;tt.
			</p>
			<a href="/om-mittpsyke" class="hero-cta">L&auml;s mer om MittPsyke</a>
		</div>
	</section>

	<section class="focus-section">
		<div class="narrow cards-narrow focus-content">
			<header class="focus-header">
				<h2>V&auml;lj fokusomr&aring;de</h2>
				<p>
					Du beh&ouml;ver inte f&ouml;rklara allt. V&auml;lj det som k&auml;nns n&auml;rmast just nu.
				</p>
			</header>
			<div class="focus-cards">
				{#each portals as portal}
					<a class="focus-card" href={`/chat/${portal.key}`}>
						<img
							class="focus-cover"
							src={portal.image}
							alt={`Bild for ${portal.title}`}
							loading="lazy"
						/>
						<div class="focus-body">
							<span class="focus-icon">{portal.icon}</span>
							<h3>{portal.title}</h3>
							<p>{portal.description}</p>
							<span class="focus-cta">B&ouml;rja skriva</span>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<section class="band band-olive">
		<div class="narrow intro-grid">
			<img src="/assets/home/Tryggplats.png" alt="Trygg plats" loading="lazy" />
			<div>
				<h2>Ett tryggt rum online</h2>
				<p>
					MittPsyke &auml;r byggt f&ouml;r att ge lugn, struktur och varsamt st&ouml;d n&auml;r tankarna blir tunga.
				</p>
				<p>
					Du v&auml;ljer sj&auml;lv tempo, fokus och vilken inriktning som passar din situation just nu.
				</p>
			</div>
		</div>
	</section>

	<section class="band band-brown">
		<div class="narrow support-grid">
			<div>
				<h2>Din v&auml;g till psykiskt st&ouml;d</h2>
				<p>
					Varje portal &auml;r specialiserad f&ouml;r att skapa ett mer tr&auml;ffs&auml;kert och tryggt samtal.
				</p>
				<ul>
					<li>stabilt st&ouml;d f&ouml;r oro och &aring;ngest</li>
					<li>varsam struktur vid nedst&auml;mdhet</li>
					<li>fokus p&aring; trygghet och gr&auml;nss&auml;ttning vid trauma</li>
				</ul>
				<p>
					M&aring;let &auml;r inte snabba svar, utan ett h&aring;llbart samtal d&auml;r du kan landa och ta n&auml;sta steg.
				</p>
			</div>
			<img src="/assets/home/Digitalastod.PNG" alt="Digitalt stöd" loading="lazy" />
		</div>
	</section>

</main>

<style>
	.staging-look {
		width: 100%;
		color: #f5f5f2;
	}

	.hero-section {
		min-height: 65vh;
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
		background: #6f92ae;
	}

	.band-brown {
		background: #56453d;
	}

	.narrow {
		width: min(760px, 100%);
		margin: 0 auto;
	}

	.cards-narrow {
		width: min(1080px, 100%);
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

	.focus-section {
		background: #f4f6f7;
		padding: clamp(3.8rem, 10vw, 6.8rem) 1.25rem;
	}

	.focus-content {
		color: #2c3338;
	}

	.focus-header {
		max-width: 62ch;
		margin: 0 auto 1.5rem;
		text-align: left;
	}

	.focus-header h2 {
		margin: 0;
		color: #263036;
		font-size: clamp(1.55rem, 3vw, 2.2rem);
	}

	.focus-header p {
		margin: 0.75rem 0 0;
		color: #54626b;
		line-height: 1.75;
		font-size: 1rem;
	}

	.focus-cards {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.95rem;
	}

	.focus-card {
		display: block;
		padding: 0.85rem;
		border-radius: 16px;
		background: #ffffff;
		border: 1px solid #e7ecef;
		color: #2c3338;
		transition: transform 180ms ease, background-color 180ms ease;
	}

	.focus-card:hover {
		transform: translateY(-2px);
		background: #fafcfc;
	}

	.focus-cover {
		display: block;
		width: 100%;
		height: clamp(150px, 28vw, 178px);
		object-fit: cover;
		border-radius: 12px;
		filter: saturate(0.88) contrast(0.96);
	}

	.focus-body {
		padding: 0.9rem 0.2rem 0.25rem;
	}

	.focus-icon {
		display: inline-flex;
		width: 2.05rem;
		height: 2.05rem;
		align-items: center;
		justify-content: center;
		font-size: 1.1rem;
		margin-bottom: 0.58rem;
		background: #edf1f2;
		border-radius: 999px;
	}

	.focus-card h3 {
		margin: 0;
		color: #273237;
		font-size: 1.1rem;
	}

	.focus-card p {
		margin: 0.6rem 0 0;
		font-size: 0.95rem;
		line-height: 1.7;
		color: #516069;
	}

	.focus-cta {
		display: inline-block;
		margin-top: 0.85rem;
		padding: 0.38rem 0.72rem;
		border-radius: 999px;
		background: #e7f1ee;
		color: #2e5850;
		font-size: 0.82rem;
		font-weight: 600;
	}

	@media (max-width: 900px) {
		.intro-grid,
		.support-grid {
			grid-template-columns: 1fr;
		}

		.hero-content {
			padding: 1.1rem 1rem 1.2rem;
		}
	}

	@media (min-width: 700px) {
		.focus-cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1.1rem;
		}

		.focus-header {
			margin-bottom: 1.8rem;
		}
	}

	@media (min-width: 1040px) {
		.focus-cards {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 1.25rem;
		}
	}
</style>
