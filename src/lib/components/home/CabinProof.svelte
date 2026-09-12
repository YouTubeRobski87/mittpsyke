<script lang="ts">
	// Publik proof-of-product för Kvällsstugan. Steg 1 är detsamma som i den
	// inloggade vyn, men helt statiskt: ingen auth, inget API, ingen sparning.
	// Det är en bild av produkten byggd av DOM i stället för en skärmdump, så
	// den skalar och följer temat.
	//
	// Två varianter, medvetet åtskilda:
	//
	//   scene - landskapet utifrån, utan stegkort. Ligger i heron och bär
	//           stämning, inte bevis.
	//   card  - stegkortet plus bildtexten. Ligger i Kvällsstugans sektion,
	//           där interiörbilden redan är sektionens scen.
	//
	// Tidigare låg kortet som ett överlägg ovanpå hero-scenen och doldes med
	// display:none under 1120px, eftersom det annars täckte personen vid elden.
	// Följden var att varje telefon fick landskapet utan produkt-UI och utan
	// bildtext - alltså dekor. Uppdelningen tar bort både överlägget och
	// brytpunkten: scenen är fri i alla bredder, och kortet syns i alla
	// bredder på den plats där det hör hemma.
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
		PROGRESS_COMPANION_BEAR_BACK_SITTING_IMAGE
	} from '$lib/progressCompanion';

	let {
		variant = 'card',
		priority = false
	}: { variant?: 'scene' | 'card'; priority?: boolean } = $props();
</script>

{#if variant === 'scene'}
<figure class="cabin-proof cabin-proof--scene">
	<div class="cabin-proof-scene">
		<img
			class="cabin-proof-scene-image"
			srcset={PROGRESS_CABIN_LAKESIDE_SUNSET_SCENE_SRCSET}
			sizes="(max-width: 759px) calc(100vw - 2.5rem), (min-width: 900px) 60vw, 520px"
			src={PROGRESS_CABIN_LAKESIDE_SUNSET_SCENE_FALLBACK}
			alt="Platsen utifrån i solnedgången: en person och en björn sitter tillsammans vid en lägereld på stranden och blickar ut över sjön, stugan lyser i skogsbrynet och solen står lågt över bergen."
			width="1672"
			height="941"
			loading={priority ? 'eager' : 'lazy'}
			fetchpriority={priority ? 'high' : undefined}
			decoding="async"
		/>

		<!-- Björnen ligger som eget lager, samma princip som följeslagaren i
			 Framsteg: scenbilden är fri från djur, och den som ska synas ritas
			 ovanpå. Frilägget är MittPsykes egen björn (Balder), här i en
			 bakåtvänd sittpose som följer personens blick ut över sjön. -->
		<img
			class="cabin-proof-bear"
			src={PROGRESS_COMPANION_BEAR_BACK_SITTING_IMAGE}
			alt=""
			aria-hidden="true"
			width="768"
			height="512"
			loading="lazy"
			fetchpriority="low"
			decoding="async"
		/>
	</div>
</figure>
{:else}
<figure class="cabin-proof cabin-proof--card">
	<div class="cabin-proof-card">
		<!-- Etiketten står först i kortet, så "det här är ett exempel" läses före
			 frågan och alternativen i stället för efteråt. Här stod tidigare
			 "Steg 1 av 4" - samma stegräknare som i det riktiga flödet
			 (EveningCheckinFlow), vilket fick kortet att se ut som ett påbörjat
			 formulär man förväntades fortsätta i. -->
		<p class="cabin-proof-meta">
			<span class="cabin-proof-badge">Exempel</span>
			<span class="cabin-proof-step">Första frågan</span>
		</p>
		<p class="cabin-proof-question">Hur är det ikväll?</p>
		<ul class="cabin-proof-options">
			{#each EVENING_THEMES as theme}
				<li>{theme.label}</li>
			{/each}
		</ul>
	</div>

	<!-- Svarar på besökarens fråga "kan jag använda det här?" direkt vid kortet:
		 nej, det är ett exempel, och svaren ges i Kvällsstugan. Länken dit står
		 direkt efter i startsidans sektion, inte inuti exemplet. Ligger i samma
		 figure som kortet, så kopplingen är explicit i markupen och blir
		 figurens tillgängliga namn. -->
	<figcaption class="cabin-proof-caption">
		Här är det bara ett exempel. Du svarar i Kvällsstugan.
	</figcaption>
</figure>
{/if}

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

	/* Björnen sitter på samma markplan, direkt till vänster om personen och på
	   motsatt sida från elden. Måtten är i procent av scenrutan, så den lilla
	   gruppen håller ihop i alla bredder. Dämpningen tar ner friläggets ljus till
	   scenens kvällsljus. */
	.cabin-proof-bear {
		position: absolute;
		left: 43%;
		bottom: 10%;
		width: 28.5%;
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

</style>
