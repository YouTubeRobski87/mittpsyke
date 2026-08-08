<script lang="ts">
	// Brasan på stranden och den stillsamma gestalten som sitter vid den.
	//
	// Eget lager i stället för en ny LivingWorldEffectKind, av samma skäl som
	// LeafLayer: elden och gestalten hör ihop, delar placering och har egen
	// dygnslogik. Ingenting i worldScene.ts behöver ändras.
	//
	// Opt-in via `enabled`. AmbientWorld används både i Mitt Hems hero och i
	// Framstegs banner, och en brasa hör i dagsläget bara hemma i den senare.
	//
	// Alla mått ligger som CSS-variabler i toppen av <style> - placeringen är det
	// som behöver justeras mot fotot, och den ska gå att nudga utan att läsa
	// resten av filen.
	import { createMotionAwareness } from '$lib/motionAwareness.svelte';
	import type { ProgressCompanionDayState } from '$lib/progressCompanion';

	let {
		timeOfDay = 'evening',
		enabled = false
	}: {
		timeOfDay?: ProgressCompanionDayState;
		enabled?: boolean;
	} = $props();

	const motion = createMotionAwareness();

	// Alltid tänd när lagret är på, men med olika styrka per dygnsdel.
	//
	// Inte av/på på kväll/natt: Framstegs scenfoto (progress-cabin-lakeside)
	// byts aldrig med klockan - det är samma skymningsbild dygnet runt och bara
	// CSS-graderingen ändras. Och "day" varar 10-17, så en kvällsspärr hade dolt
	// brasan halva dygnet i en scen som ändå ser ut som skymning.
	// Styrkan följer i stället graderingen: svagast när scenen är som ljusast.
	const intensity = $derived(
		timeOfDay === 'evening' ? 1 : timeOfDay === 'night' ? 0.9 : timeOfDay === 'morning' ? 0.5 : 0.42
	);
</script>

{#if enabled}
	<div
		class="hearth"
		class:is-paused={!motion.isActive || motion.reducedMotion}
		data-time={timeOfDay}
		style={`--hearth-intensity: ${intensity}`}
		aria-hidden="true"
	>
		<!-- Ordning = ritordning: det breda skenet underst, sedan glöden vid
		     marken, lågan över den, och gestalten sist så den läses mot ljuset.
		     Elden ligger i en egen wrapper som bär dygnsstyrkan, så keyframes på
		     barnen kan animera opacity fritt utan att krocka med den. -->
		<span class="hearth-fire">
			<span class="hearth-glow"></span>
			<span class="hearth-embers"></span>
			<span class="hearth-flame"></span>
		</span>

		<span class="hearth-figure">
			<!-- Siluett, inte porträtt. Gestalten är ~13 px hög på desktop och ~8 px
			     på mobil, så detaljer bortom "sittande person med hatt" skulle ändå
			     inte läsas - de skulle bara göra formen rörig i stället för lugn. -->
			<svg class="hearth-figure-art" viewBox="0 0 26 34" role="presentation">
				<g fill="currentColor">
					<!-- hattbrätte och kulle: det som gör att formen läses som lantlig -->
					<ellipse cx="10.5" cy="7.4" rx="6" ry="1.7" />
					<path d="M7.4 7.1a3.2 3.2 0 0 1 6.2 0z" />
					<circle cx="10.5" cy="9.6" r="2.5" />
					<!-- överkropp, lätt framåtlutad mot elden -->
					<path
						d="M8.2 11.8c-1.7 1.2-2.4 3.6-2.5 6.2-.1 2.5.2 4.6.6 6.1h7.4c.5-2.2.7-4.6.4-7-.3-2.5-1.2-4.3-2.6-5.3z"
					/>
					<!-- ben, böjda framåt -->
					<path
						d="M12.4 22.6c2.6.2 4.9 1.1 6.7 2.7.7.6.9 1.4.4 2-.5.7-1.3.7-2.1.2-1.6-1-3.4-1.5-5.4-1.6z"
					/>
					<path
						d="M17.6 26.2c1.4.5 2.6 1.2 3.5 2.1.5.5.4 1.1-.2 1.4-.7.3-1.5.1-2.4-.5-.8-.6-1.5-1.2-2.1-1.9z"
					/>
					<!-- arm som vilar på knäet -->
					<path
						d="M11.6 13.6c1.9 1.6 3.4 3.6 4.6 5.9.4.8.2 1.5-.5 1.7-.7.2-1.3-.2-1.8-1-1-1.8-2.2-3.4-3.5-4.8z"
					/>
					<!-- stenen hon sitter på, så gestalten inte ser ut att sväva -->
					<ellipse cx="8.6" cy="25.6" rx="4.6" ry="1.9" />
				</g>
			</svg>
		</span>
	</div>
{/if}

<style>
	.hearth {
		/* Placering mot fotot, uppmätt i bilden och inte gissad.
		   Luminansen längs x 22-27 % har tre band: mörk bortre strand på y 26-44,
		   ljust solnedgångsvatten på y 50-70, och mörk främre strand på y 74-94.
		   x 34 % är fotots ljusaste solstrimma (lum 120-200) - elden får aldrig
		   hamna där, och räven bor på x 66-76 %.
		   Brasan står på den BORTRE stranden: y 44 % är vattenlinjen där.
		   Det är valt med flit. En liten, underordnad gestalt är bara
		   perspektivkorrekt på avstånd - på den främre stranden (y 75 %) hade en
		   trovärdig sittande person behövt bli ~150 px hög på en 256 px scen och
		   därmed tagit över bilden. Flyttas elden dit måste gestalten alltså växa
		   kraftigt, annars ser den ut som en dvärg på nära håll. */
		--hearth-x: 23%;
		--hearth-y: 44%;
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	/* Bär dygnsstyrkan för hela elden. Gestalten ligger medvetet utanför den, så
	   personen syns lika bra även när elden är nedtonad mitt på dagen. */
	.hearth-fire {
		position: absolute;
		inset: 0;
		opacity: var(--hearth-intensity, 1);
	}

	.hearth-glow,
	.hearth-embers,
	.hearth-flame,
	.hearth-figure {
		position: absolute;
		left: var(--hearth-x);
		pointer-events: none;
	}

	/* Det breda, mjuka skenet. Samma idiom som vattenglimten: varma toner, stor
	   blur, låg alpha, ingen vit kärna och ingen translation - bara andning.
	   .living-world har isolation: isolate, så screen blandar inte additivt mot
	   scenfotot utan komponeras med alpha. Det är avsiktligt här: en varm,
	   halvtransparent slöja över den mörka stranden värmer upp den utan att kunna
	   blåsa ut till en spotlight. */
	.hearth-glow {
		top: var(--hearth-y);
		width: clamp(28px, 3.7vw, 47px);
		height: clamp(16px, 2.2vw, 28px);
		border-radius: 50%;
		background: radial-gradient(
			ellipse at 50% 62%,
			rgba(255, 196, 118, 0.3) 0%,
			rgba(249, 172, 100, 0.19) 30%,
			rgba(226, 142, 88, 0.1) 54%,
			rgba(198, 126, 88, 0.04) 76%,
			transparent 100%
		);
		/* Blurren måste följa skenets storlek. Ett fast stort värde på ett så litet
		   element löser upp glöden helt i stället för att mjuka upp kanten. */
		filter: blur(clamp(4px, 0.75vw, 10px));
		mix-blend-mode: screen;
		transform: translate3d(-50%, -58%, 0);
		animation: hearthBreathe 9200ms ease-in-out infinite;
	}

	/* Glöden vid marken: mindre och något varmare, ger elden ett fotfäste så
	   skenet inte ser ut att sväva ovanför stranden. */
	.hearth-embers {
		top: var(--hearth-y);
		width: clamp(4px, 0.7vw, 9px);
		height: clamp(2px, 0.32vw, 4px);
		border-radius: 50%;
		background: radial-gradient(
			ellipse at 50% 55%,
			rgba(255, 184, 116, 0.52) 0%,
			rgba(232, 138, 74, 0.32) 45%,
			transparent 100%
		);
		filter: blur(clamp(1.5px, 0.28vw, 3.4px));
		transform: translate3d(-50%, -30%, 0);
		animation: hearthEmberPulse 6400ms ease-in-out infinite;
	}

	/* Lågan. Liten, mjuk och asymmetriskt rundad så den läses som eld snarare än
	   som en droppe. Flimret ligger på scaleY + opacity, aldrig på position -
	   en låga som flyttar sig i sidled ser tecknad ut. */
	.hearth-flame {
		top: var(--hearth-y);
		width: clamp(2.5px, 0.3vw, 4px);
		height: clamp(4px, 0.52vw, 7px);
		border-radius: 52% 48% 46% 54% / 68% 66% 34% 32%;
		background: linear-gradient(
			355deg,
			rgba(255, 148, 66, 0.62) 0%,
			rgba(255, 182, 104, 0.5) 42%,
			rgba(255, 214, 158, 0.3) 74%,
			rgba(255, 232, 198, 0.08) 100%
		);
		filter: blur(clamp(0.8px, 0.16vw, 1.9px));
		transform-origin: 50% 100%;
		transform: translate3d(-50%, -100%, 0);
		animation: hearthFlicker 4300ms ease-in-out infinite;
	}

	.hearth-figure {
		/* Sitter strax till vänster om elden och något längre fram, så gestalten
		   och lågan inte överlappar. */
		top: var(--hearth-y);
		margin-left: calc(-1 * clamp(4px, 0.75vw, 9px));
		width: clamp(6.5px, 0.85vw, 11px);
		height: clamp(8px, 1.05vw, 13px);
		/* Ankrad i botten, precis som CompanionFriend, så gestalten står kvar på
		   marken när scenen ändrar storlek. */
		transform: translate3d(-50%, -100%, 0);
		/* Mörk, sval siluettfärg med en aning värme från elden. Aldrig svart:
		   ren svart mot kvällsfotot ser ut som ett hål i bilden. */
		color: rgb(31 27 24);
		opacity: 0.42;
	}

	.hearth[data-time='night'] .hearth-figure {
		opacity: 0.36;
	}

	.hearth-figure-art {
		display: block;
		width: 100%;
		height: 100%;
		/* Mjukar upp kanten så siluetten inte blir en skarp vektorform mot fotots
		   korniga natur. Samma tanke som --friend-grade-far i CompanionFriend. */
		filter: blur(0.5px);
	}

	/* Andningen är opacitet och en knappt märkbar skalning. Ojämnt fördelade
	   keyframes så rytmen inte blir mekanisk; 0 % och 100 % identiska så loopen
	   inte hoppar. */
	@keyframes hearthBreathe {
		0%,
		100% {
			opacity: 0.74;
			transform: translate3d(-50%, -58%, 0) scale(0.985);
		}
		27% {
			opacity: 1;
			transform: translate3d(-50%, -58%, 0) scale(1.025);
		}
		52% {
			opacity: 0.86;
			transform: translate3d(-50%, -58%, 0) scale(1.005);
		}
		78% {
			opacity: 0.95;
			transform: translate3d(-50%, -58%, 0) scale(1.015);
		}
	}

	@keyframes hearthEmberPulse {
		0%,
		100% {
			opacity: 0.82;
		}
		31% {
			opacity: 1;
		}
		58% {
			opacity: 0.88;
		}
		81% {
			opacity: 0.96;
		}
	}

	@keyframes hearthFlicker {
		0%,
		100% {
			opacity: 0.8;
			transform: translate3d(-50%, -100%, 0) scaleY(0.96) scaleX(1);
		}
		19% {
			opacity: 1;
			transform: translate3d(-50%, -100%, 0) scaleY(1.06) scaleX(0.97);
		}
		37% {
			opacity: 0.87;
			transform: translate3d(-50%, -100%, 0) scaleY(0.99) scaleX(1.02);
		}
		61% {
			opacity: 0.97;
			transform: translate3d(-50%, -100%, 0) scaleY(1.04) scaleX(0.99);
		}
		83% {
			opacity: 0.85;
			transform: translate3d(-50%, -100%, 0) scaleY(0.97) scaleX(1.01);
		}
	}

	/* Dold flik: frys, precis som övriga världslager. */
	.hearth.is-paused :is(.hearth-glow, .hearth-embers, .hearth-flame) {
		animation-play-state: paused;
	}

	/* Framsteg har TRE beskärningar av samma foto, inte två:
	     - min-width 981px  -> object-position 50 % 50 %  (basvärdena ovan)
	     - 641-980px        -> 70 % 64 %                  (den här regeln)
	     - max-width 640px  -> 20 % 64 %                  (regeln under)
	   Mellanbandet är lätt att missa. Med basvärdet y 44 % landar brasan där på
	   källpunkt (184, 241) i stället för målet (184, 215), dvs 26 px för långt
	   ner - nere i det ljusa vattnet. Omräknat blir rätt värde y 33 %. */
	@media (min-width: 641px) and (max-width: 980px) {
		.hearth {
			--hearth-y: 33%;
		}
	}

	/* Mobilbeskärningen är en annan bild. object-position går till 20 % 64 %, och
	   eftersom scenen blir smalare syns fotots HELA höjd (källa sy0 sh450) mot
	   desktops mittband (sy136 sh179). Samma y-procent pekar alltså på helt olika
	   bildinnehåll.
	   Desktops brasa ligger på källpunkt (184, 215). Omräknat till mobilens
	   beskärning blir det x 24 %, y 48 % - uppmätt lum 20, dvs samma mörka bortre
	   strand. Utan den här overriden hade x23/y44 landat på lum 29, uppe i
	   trädlinjens kant, och y 52 % och nedåt är ljust vatten (lum 39-94).
	   Ändras object-position för mobil måste dessa två värden räknas om. */
	@media (max-width: 640px) {
		.hearth {
			--hearth-x: 24%;
			--hearth-y: 48%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		/* Elden får finnas kvar - den är stämning, inte rörelse - men allt
		   flimmer stannar i sitt mellanläge. */
		.hearth-glow,
		.hearth-embers,
		.hearth-flame {
			animation: none !important;
		}
	}
</style>
