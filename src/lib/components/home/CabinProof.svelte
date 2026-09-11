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
	// Temavalen kommer från EVENING_THEMES - samma källa som den riktiga
	// incheckningen - så den publika proofen aldrig kan visa något annat än vad
	// användaren faktiskt möter. Inget här är klickbart, inget är märkt upp som
	// en kontroll, och inget är format som en knapp: alternativen läses som en
	// uppräkning. Vägen till den riktiga incheckningen ligger i Kvällsstugans
	// egen sektion på startsidan, inte inuti exemplet.
	import { EVENING_THEMES } from '$lib/evening-checkin';
	// Solnedgångsvarianten av landskapsscenen: samma plats som den inloggade
	// vyn visar, men med solen lågt över bergen, stugan tänd och en person vid
	// lägerelden. Den tomma dagvarianten ligger kvar i samma modul.
	import {
		PROGRESS_CABIN_LAKESIDE_SUNSET_SCENE_FALLBACK,
		PROGRESS_CABIN_LAKESIDE_SUNSET_SCENE_SRCSET,
		PROGRESS_COMPANION_BEAR_SITTING_IMAGE
	} from '$lib/progressCompanion';

	let {
		variant = 'section',
		priority = false
	}: { variant?: 'hero' | 'section'; priority?: boolean } = $props();
</script>

<figure class={`cabin-proof cabin-proof--${variant}`}>
	<div class="cabin-proof-scene">
		<img
			class="cabin-proof-scene-image"
			srcset={PROGRESS_CABIN_LAKESIDE_SUNSET_SCENE_SRCSET}
			sizes="(max-width: 759px) calc(100vw - 2.5rem), (min-width: 900px) 60vw, 520px"
			src={PROGRESS_CABIN_LAKESIDE_SUNSET_SCENE_FALLBACK}
			alt="Platsen utifrån i solnedgången: en person sitter vid en lägereld på stranden, en björn vilar en bit bort, stugan lyser i skogsbrynet och solen står lågt över sjön och bergen."
			width="1672"
			height="941"
			loading={priority ? 'eager' : 'lazy'}
			fetchpriority={priority ? 'high' : undefined}
			decoding="async"
		/>

		<!-- Björnen ligger som eget lager, samma princip som följeslagaren i
			 Framsteg: scenbilden är fri från djur, och den som ska synas ritas
			 ovanpå. Frilägget är MittPsykes egen björn (Balder) ur
			 companion-presets, inget nytt bildmaterial. -->
		<img
			class="cabin-proof-bear"
			src={PROGRESS_COMPANION_BEAR_SITTING_IMAGE}
			alt=""
			aria-hidden="true"
			width="768"
			height="512"
			loading="lazy"
			fetchpriority="low"
			decoding="async"
		/>
	</div>

	<div class="cabin-proof-card">
		<!-- Etiketten står först i kortet, så "det här är ett exempel" läses före
			 frågan och alternativen i stället för efteråt. -->
		<p class="cabin-proof-meta">
			<span class="cabin-proof-badge">Exempel</span>
			<span class="cabin-proof-step">Steg 1 av 4</span>
		</p>
		<p class="cabin-proof-question">Hur är det ikväll?</p>
		<ul class="cabin-proof-options">
			{#each EVENING_THEMES as theme}
				<li>{theme.label}</li>
			{/each}
		</ul>
	</div>

	<!-- Säger vad kortet ovanför är och var man gör det på riktigt. Utan
		 bildtexten kan proofen läsas som dekor, och besökaren får aldrig veta
		 att det är produkten hen ser. -->
	<figcaption class="cabin-proof-caption">
		Så ser kvällsincheckningen ut. Du gör den i Kvällsstugan.
	</figcaption>
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

	.cabin-proof-caption {
		color: var(--home-text-muted, rgb(220 225 235 / 0.78));
		font-size: 0.82rem;
		line-height: 1.5;
	}

	/* I section-varianten ligger scen och kort i två kolumner. Bildtexten hör
	   till båda och läggs därför under hela bredden. */
	@media (min-width: 760px) {
		.cabin-proof--section .cabin-proof-caption {
			grid-column: 1 / -1;
		}
	}

	/* Under 1120px är stegkortet dolt i hero-varianten och bara landskapet syns.
	   Då finns ingen incheckning att sätta bildtext på. */
	@media (max-width: 1119.98px) {
		.cabin-proof--hero .cabin-proof-caption {
			display: none;
		}
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
	.cabin-proof-scene-image {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 16 / 9;
		object-fit: cover;
	}

	/* Björnen sitter på den närmaste stranden, till vänster om personen vid
	   elden och under stugan. Måtten är i procent av scenrutan, så lagret följer
	   bilden i alla bredder. Dämpningen tar ner studioljuset i frilägget till
	   scenens kvällsljus - utan den lyser björnen starkare än allt annat på
	   stranden. */
	.cabin-proof-bear {
		position: absolute;
		left: 29%;
		bottom: 4%;
		width: 14.5%;
		height: auto;
		aspect-ratio: auto;
		object-fit: contain;
		filter: brightness(0.74) saturate(0.86) contrast(1.02)
			drop-shadow(0 0.3rem 0.45rem rgb(28 18 10 / 0.5));
		pointer-events: none;
	}

	.cabin-proof-card {
		padding: clamp(0.9rem, 3vw, 1.25rem);
		border: 1px solid rgb(237 222 194 / 0.28);
		border-radius: 1.2rem;
		background: linear-gradient(145deg, rgb(55 38 29 / 0.96), rgb(28 23 22 / 0.97));
		box-shadow: 0 18px 42px rgb(22 15 12 / 0.28);
		color: #f7f3eb;
	}

	/* Etikett och stegräknare på samma rad: en rad i stället för tre textrader
	   som alla säger samma sak. */
	.cabin-proof-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin: 0 0 0.7rem;
	}

	/* Lyktans ton, inte en grå systemetikett - den ska kännas som kvällen den
	   hör till och ändå läsas först. */
	.cabin-proof-badge {
		padding: 0.16rem 0.5rem;
		border-radius: 999px;
		background: rgb(245 200 120 / 0.18);
		color: #f7dcae;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.09em;
		text-transform: uppercase;
	}

	.cabin-proof-step {
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
		gap: 0.3rem;
		margin: 0;
		padding: 0;
		list-style: none;
		color: rgb(247 243 235 / 0.9);
	}

	/* Alternativen visades tidigare som ramade rutor med den första markerad -
	   det läste som knappar med ett redan gjort val, alltså som ett formulär.
	   Nu är de en uppräkning av vad frågan erbjuder: ingen ram, ingen fylld
	   yta, inget markerat förval. Prickens ton håller kvällskänslan kvar. */
	.cabin-proof-options li {
		position: relative;
		padding-left: 0.95rem;
		font-size: 0.88rem;
		font-weight: 500;
		line-height: 1.45;
	}

	.cabin-proof-options li::before {
		content: '';
		position: absolute;
		top: 0.58em;
		left: 0;
		width: 0.3rem;
		height: 0.3rem;
		border-radius: 50%;
		background: rgb(245 200 120 / 0.78);
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
	   statiska stegkortet över natthimlen i scenens övre del. På mindre skärmar
	   visas bara platsen, så heron kan leda vidare utan ett extra långt kort.
	   Gränsen går vid 1120px: under den blir scenrutan så låg att kortet skulle
	   lägga sig över personen vid elden, och då är platsen viktigare än kortet -
	   samma val som redan gjordes under 900px. */
	@media (min-width: 1120px) {
		.cabin-proof--hero {
			display: block;
			position: relative;
			isolation: isolate;
		}

		/* 3:2 i stället för 5:4. Bilden är 16:9, så en högre ruta beskär i sidled -
		   vid 5:4 föll lägerelden utanför högerkanten. 3:2 håller kvar både
		   stugan till vänster och personen vid elden till höger. */
		.cabin-proof--hero .cabin-proof-scene {
			/* width: 100% behövs för att aspect-ratio ska räkna höjd ur bredd.
			   Utan den ärvde rutan hero-radens höjd och bredden räknades ur
			   höjden i stället - scenen blev då bredare än sin kolumn och sköt
			   ut lägerelden utanför viewporten mellan 900 och 1100 px. */
			width: 100%;
			aspect-ratio: 3 / 2;
			border-radius: 1.35rem;
		}

		/* Mörkningen ligger uppe vid kortet i stället för nere vid elden: den ska
		   ge kortet en lugn botten, inte dämpa scenens enda varma ljus. */
		.cabin-proof--hero .cabin-proof-scene::after {
			content: '';
			position: absolute;
			inset: 0;
			background: linear-gradient(180deg, rgb(28 18 12 / 0.5) 0%, rgb(28 18 12 / 0.16) 46%, transparent 72%);
			pointer-events: none;
		}

		.cabin-proof--hero .cabin-proof-scene-image {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
			aspect-ratio: auto;
			object-position: center;
		}

		/* Kortet ligger uppe till höger, över natthimlen. Nere till höger täckte
		   det personen och lägerelden - scenens enda liv - och det är den halvan
		   av bilden som ska synas. */
		.cabin-proof--hero .cabin-proof-card {
			position: absolute;
			z-index: 1;
			right: clamp(1rem, 2.5vw, 1.5rem);
			top: clamp(1rem, 2.5vw, 1.5rem);
			/* Bredden följer innehållet: den längsta raden är frågan, och
			   17rem lämnar den plus metaraden oavbrutna. Tidigare 24rem gav
			   ~160px tom yta till höger i kortet och tog en halv scen i
			   anspråk för text som bara använde vänsterhalvan. */
			width: min(38%, 17rem);
			padding: clamp(0.9rem, 1.7vw, 1.15rem);
			border-color: rgb(237 222 194 / 0.34);
			background: linear-gradient(145deg, rgb(55 38 29 / 0.88), rgb(28 23 22 / 0.92));
			backdrop-filter: blur(8px);
			box-shadow: 0 18px 42px rgb(12 8 6 / 0.36);
		}

		.cabin-proof--hero .cabin-proof-meta,
		.cabin-proof--hero .cabin-proof-question {
			margin-bottom: 0.55rem;
		}

		.cabin-proof--hero .cabin-proof-options li {
			font-size: 0.86rem;
		}

		/* Hero-varianten är display:block, så figurens gap gäller inte här. */
		.cabin-proof--hero .cabin-proof-caption {
			margin-top: 0.6rem;
		}
	}

	@media (max-width: 1119.98px) {
		.cabin-proof--hero .cabin-proof-card {
			display: none;
		}
	}

	/* Mellan 1120 och 1320px är scenrutan låg nog att ett kort i full storlek
	   skulle nå ner över personen vid elden. Kortet krymper i stället för att
	   försvinna: samma innehåll, mindre yta, och hela scenen syns. */
	@media (min-width: 1120px) and (max-width: 1319.98px) {
		.cabin-proof--hero .cabin-proof-card {
			width: min(42%, 15rem);
			padding: 0.8rem 0.85rem;
		}

		.cabin-proof--hero .cabin-proof-meta {
			margin-bottom: 0.4rem;
		}

		.cabin-proof--hero .cabin-proof-question {
			margin-bottom: 0.4rem;
			font-size: 1.02rem;
		}

		.cabin-proof--hero .cabin-proof-options {
			gap: 0.16rem;
		}

		.cabin-proof--hero .cabin-proof-options li {
			font-size: 0.78rem;
		}
	}
</style>
