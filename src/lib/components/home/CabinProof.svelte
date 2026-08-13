<script lang="ts">
	// Publik proof-of-product för Kvällsstugan. Visar samma scen och samma steg 1
	// som den inloggade vyn, men helt statiskt: ingen auth, inget API, ingen
	// sparning. Det är en bild av produkten byggd av DOM i stället för en
	// skärmdump, så den skalar och följer temat.
	//
	// Temaknapparna kommer från EVENING_THEMES - samma källa som den riktiga
	// incheckningen - så den publika proofen aldrig kan visa något annat än vad
	// användaren faktiskt möter. Inget här är klickbart, och inget är märkt upp
	// som en kontroll: alternativen är en lista, inte knappar.
	import { EVENING_THEMES } from '$lib/evening-checkin';

	const CABIN_SRCSET = [
		'/images/scenes/cabin-interior-evening-v1-800.webp 800w',
		'/images/scenes/cabin-interior-evening-v1-1200.webp 1200w',
		'/images/scenes/cabin-interior-evening-v1.webp 1672w'
	].join(', ');

	let {
		variant = 'section',
		priority = false
	}: { variant?: 'hero' | 'section'; priority?: boolean } = $props();
</script>

<figure class={`cabin-proof cabin-proof--${variant}`}>
	<div class="cabin-proof-scene">
		<img
			srcset={CABIN_SRCSET}
			sizes="(max-width: 759px) calc(100vw - 2.5rem), 520px"
			src="/images/scenes/cabin-interior-evening-v1-1200.webp"
			alt="Inne i Kvällsstugan: en lampa lyser i en stuga och genom fönstret syns en sjö i skymningen."
			width="1672"
			height="941"
			loading={priority ? 'eager' : 'lazy'}
			fetchpriority={priority ? 'high' : undefined}
			decoding="async"
		/>
	</div>

	<div class="cabin-proof-card">
		<p class="cabin-proof-step">Steg 1 av 4</p>
		<p class="cabin-proof-question">Hur är det ikväll?</p>
		<ul class="cabin-proof-options">
			{#each EVENING_THEMES as theme}
				<li>{theme.label}</li>
			{/each}
		</ul>
		<span class="cabin-proof-primary" aria-hidden="true">Fortsätt</span>
	</div>

	<figcaption>Kvällsstugan, steg 1.</figcaption>
</figure>

<style>
	/* Färger och former är hämtade från EveningCheckinFlow och Kvällsstugans
	   scen, inte från startsidans blå palett - proofen ska se ut som produkten. */
	.cabin-proof {
		display: grid;
		gap: 0.9rem;
		margin: 0;
		font-family: var(--font-body);
	}

	.cabin-proof-scene {
		position: relative;
		overflow: hidden;
		border: 1px solid rgb(92 72 47 / 0.34);
		border-radius: 1.2rem;
		background: #17110e;
	}

	/* aspect-ratio + width/height på bilden håller höjden reserverad innan
	   bilden laddat, så proofen aldrig orsakar layout shift. */
	.cabin-proof-scene img {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 16 / 9;
		object-fit: cover;
	}

	.cabin-proof-card {
		padding: clamp(0.9rem, 3vw, 1.25rem);
		border: 1px solid rgb(237 222 194 / 0.28);
		border-radius: 1.2rem;
		background: linear-gradient(145deg, rgb(55 38 29 / 0.96), rgb(28 23 22 / 0.97));
		box-shadow: 0 18px 42px rgb(22 15 12 / 0.28);
		color: #f7f3eb;
	}

	.cabin-proof-step {
		margin: 0 0 0.75rem;
		color: rgb(235 223 200 / 0.72);
		font-size: 0.76rem;
		font-weight: 700;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}

	.cabin-proof-question {
		margin: 0 0 0.75rem;
		font-family: var(--font-heading);
		font-size: clamp(1.15rem, 2.6vw, 1.4rem);
		line-height: 1.18;
	}

	.cabin-proof-options {
		display: grid;
		gap: 0.45rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* Ser ut som alternativknapparna i den riktiga incheckningen, men är en
	   lista - inget här går att trycka på, och inget utger sig för att göra det. */
	.cabin-proof-options li {
		padding: 0.62rem 0.75rem;
		border: 1px solid rgb(238 225 202 / 0.24);
		border-radius: 0.8rem;
		background: rgb(255 255 255 / 0.06);
		font-size: 0.92rem;
		font-weight: 650;
		line-height: 1.3;
	}

	.cabin-proof-options li:first-child {
		border-color: rgb(245 200 120 / 0.6);
		background: rgb(245 200 120 / 0.13);
	}

	.cabin-proof-primary {
		display: inline-block;
		margin-top: 0.75rem;
		padding: 0.6rem 1rem;
		border-radius: 0.8rem;
		background: rgb(239 193 113 / 0.42);
		color: rgb(247 243 235 / 0.86);
		font-size: 0.9rem;
		font-weight: 650;
	}

	.cabin-proof figcaption {
		color: rgb(220 225 235 / 0.66);
		font-size: 0.78rem;
		line-height: 1.5;
	}

	/* Samma uppdelning som den riktiga Kvällsstugan gör på bred skärm: scenen
	   bredvid steget, inte ovanpå det. Under brytpunkten staplas de, vilket
	   håller 320 px fritt från överlägg och horisontell overflow. */
	@media (min-width: 760px) {
		.cabin-proof--section {
			grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
			align-items: start;
			gap: 1rem;
		}

		.cabin-proof--section figcaption {
			grid-column: 1 / -1;
			margin-top: -0.25rem;
		}
	}

	/* Hero-varianten står i en smalare kolumn bredvid rubriken, så den staplas
	   alltid: scenen får hela kolumnbredden i stället för att krympa till en
	   oläslig miniatyr bredvid steg-kortet. */
	.cabin-proof--hero {
		gap: 0.75rem;
	}
</style>
