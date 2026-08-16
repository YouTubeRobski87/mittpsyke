<script lang="ts">
	// Publik proof-of-product för Kvällsstugan. Steg 1 är detsamma som i den
	// inloggade vyn, men helt statiskt: ingen auth, inget API, ingen sparning.
	// Det är en bild av produkten byggd av DOM i stället för en skärmdump, så
	// den skalar och följer temat.
	//
	// Scenen är medvetet platsen UTIFRÅN, inte Kvällsstugans interiör: startsidan
	// visar ankomsten, och interiörbilden är kvar i sin egen sektion längre ner
	// så samma motiv inte används två gånger på sidan.
	//
	// Temaknapparna kommer från EVENING_THEMES - samma källa som den riktiga
	// incheckningen - så den publika proofen aldrig kan visa något annat än vad
	// användaren faktiskt möter. Inget här är klickbart, och inget är märkt upp
	// som en kontroll: alternativen är en lista, inte knappar.
	import { EVENING_THEMES } from '$lib/evening-checkin';
	// Landskapsscenen delas med Framsteg via samma konstanter, så startsidan och
	// den inloggade vyn aldrig kan glida isär till två olika bilder av platsen.
	import {
		PROGRESS_CABIN_LAKESIDE_SCENE_FALLBACK,
		PROGRESS_CABIN_LAKESIDE_SCENE_SRCSET
	} from '$lib/progressCompanion';

	let {
		variant = 'section',
		priority = false
	}: { variant?: 'hero' | 'section'; priority?: boolean } = $props();
</script>

<figure class={`cabin-proof cabin-proof--${variant}`}>
	<div class="cabin-proof-scene">
		<img
			srcset={PROGRESS_CABIN_LAKESIDE_SCENE_SRCSET}
			sizes="(max-width: 759px) calc(100vw - 2.5rem), (min-width: 900px) 60vw, 520px"
			src={PROGRESS_CABIN_LAKESIDE_SCENE_FALLBACK}
			alt="Platsen utifrån: en stuga med lyktan tänd vid en spegelblank sjö, omgiven av granskog och berg."
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
		/* Grundtonen syns innan bilden laddat. Följer landskapsscenens mörkblå,
		   inte interiörens bruna, sedan hero bytte motiv. */
		background: #0d1727;
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

	/* Samma uppdelning som den riktiga Kvällsstugan gör på bred skärm: scenen
	   bredvid steget, inte ovanpå det. Under brytpunkten staplas de, vilket
	   håller 320 px fritt från överlägg och horisontell overflow. */
	@media (min-width: 760px) {
		.cabin-proof--section {
			grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
			align-items: start;
			gap: 1rem;
		}
	}

	/* Hero-varianten låter scenen bära hela proof-ytan. På desktop ligger det
	   statiska stegkortet förankrat i scenens nedre del. På mindre skärmar
	   visas bara platsen, så heron kan leda vidare utan ett extra långt kort. */
	@media (min-width: 900px) {
		.cabin-proof--hero {
			display: block;
			position: relative;
			isolation: isolate;
		}

		.cabin-proof--hero .cabin-proof-scene {
			min-height: 30rem;
			aspect-ratio: 5 / 4;
			border-radius: 1.35rem;
		}

		.cabin-proof--hero .cabin-proof-scene::after {
			content: '';
			position: absolute;
			inset: 0;
			background: linear-gradient(0deg, rgb(15 10 8 / 0.74) 0%, rgb(15 10 8 / 0.24) 42%, transparent 70%);
			pointer-events: none;
		}

		.cabin-proof--hero .cabin-proof-scene img {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
			aspect-ratio: auto;
			object-position: center;
		}

		.cabin-proof--hero .cabin-proof-card {
			position: absolute;
			z-index: 1;
			right: clamp(1rem, 2.5vw, 1.5rem);
			bottom: clamp(1rem, 2.5vw, 1.5rem);
			width: min(54%, 24rem);
			padding: clamp(0.9rem, 1.7vw, 1.15rem);
			border-color: rgb(237 222 194 / 0.34);
			background: linear-gradient(145deg, rgb(55 38 29 / 0.88), rgb(28 23 22 / 0.92));
			backdrop-filter: blur(8px);
			box-shadow: 0 18px 42px rgb(12 8 6 / 0.36);
		}

		.cabin-proof--hero .cabin-proof-step,
		.cabin-proof--hero .cabin-proof-question {
			margin-bottom: 0.55rem;
		}

		.cabin-proof--hero .cabin-proof-options {
			gap: 0.35rem;
		}

		.cabin-proof--hero .cabin-proof-options li {
			padding: 0.48rem 0.62rem;
			font-size: 0.86rem;
		}

		.cabin-proof--hero .cabin-proof-primary {
			margin-top: 0.6rem;
			padding: 0.5rem 0.85rem;
		}
	}

	@media (max-width: 899px) {
		.cabin-proof--hero .cabin-proof-card {
			display: none;
		}
	}
</style>
