<script lang="ts">
	// Vännen i scenen (första paret: räv → rådjur).
	//
	// Renderar ingenting alls om något av följande gäller:
	//   - följeslagaren inte har en vän definierad
	//   - steget är under 2 (steg 1 är bara AmbientWorlds naturtecken)
	//   - FOX_DEER_RELATIONSHIP.assetsAvailable är false
	//   - bilden inte går att ladda
	//
	// Den sista punkten är viktig: en saknad fil får aldrig ge en trasig
	// bildikon i scenen, så <img> hålls osynlig tills den faktiskt laddat och
	// tas bort helt vid fel.
	import { getFriendStageAsset, type CompanionRelationshipStage } from '$lib/companionRelationship';
	import { createMotionAwareness } from '$lib/motionAwareness.svelte';

	let {
		stage = 0,
		companionId = 'fox',
		class: className = ''
	}: {
		stage?: CompanionRelationshipStage;
		companionId?: string;
		class?: string;
	} = $props();

	const motion = createMotionAwareness();

	let hasLoaded = $state(false);
	let hasFailed = $state(false);

	const asset = $derived(getFriendStageAsset(companionId, stage));

	// Nollställ laddningstillståndet när bilden byts (t.ex. vid stegbyte), så
	// ett tidigare fel inte döljer en ny, fungerande bild.
	$effect(() => {
		void asset?.src;
		hasLoaded = false;
		hasFailed = false;
	});

	const positionStyle = $derived(
		asset
			? [
					`--friend-x: ${asset.position.x}%`,
					`--friend-y: ${asset.position.y}%`,
					`--friend-scale: ${asset.position.scale}`,
					`--friend-opacity: ${asset.position.opacity}`,
					`--friend-blur: ${asset.position.blur}px`
				].join('; ')
			: ''
	);
</script>

{#if asset && !hasFailed}
	<figure
		class={`companion-friend ${className}`.trim()}
		class:is-loaded={hasLoaded}
		class:is-paused={!motion.isActive || motion.reducedMotion}
		data-stage={stage}
		data-position={asset.position.id}
		style={positionStyle}
		aria-hidden="true"
	>
		<img
			class="companion-friend-image"
			src={asset.src}
			alt={asset.alt}
			decoding="async"
			loading="lazy"
			onload={() => (hasLoaded = true)}
			onerror={() => (hasFailed = true)}
		/>
	</figure>
{/if}

<style>
	.companion-friend {
		position: absolute;
		left: var(--friend-x, 60%);
		top: var(--friend-y, 70%);
		/* Basbredden sätts per scen av sidan (se .hero-companion-friend nedan)
		   och skalas sedan ner av positionens djup. */
		width: calc(var(--friend-base-width, 26%) * var(--friend-scale, 1));
		aspect-ratio: 1;
		margin: 0;
		/* Ankras vid hovarna, precis som följeslagaren, så djuret står på marken
		   i stället för att sväva när scenen ändrar storlek. */
		transform: translate3d(-50%, -100%, 0);
		transform-origin: 50% 100%;
		/* Alltid under huvudföljeslagaren. Vännen får aldrig konkurrera visuellt
		   med djuret användaren valt.
		   Ett steg under --scene-ambient, inte på samma nivå: i Mitt Hems hero
		   får posen z-index calc(--companion-z + 1), och med räven på
		   --companion-z: 1 hamnade den på 2 - exakt samma som vännen. Vid lika
		   z-index avgör DOM-ordningen, och eftersom CompanionFriend renderas
		   efter CompanionPose hade rådjuret ritats ovanpå räven vid överlapp.
		   --scene-background är 0, så 1 ligger fortfarande över scenfotot. */
		z-index: calc(var(--scene-ambient, 2) - 1);
		pointer-events: none;
		/* Osynlig tills bilden laddat - hindrar både trasig ikon och att en
		   halvladdad bild blinkar till i scenen. */
		opacity: 0;
		transition: opacity 1200ms ease;
	}

	.companion-friend.is-loaded {
		opacity: var(--friend-opacity, 0.8);
	}

	/* Dold flik eller reduced motion: en stilla variant. Bilden syns fortfarande
	   i sitt slutläge - den tonas bara inte in, och eventuella framtida
	   inaktivitetsrörelser fryses i stället för att fortsätta i bakgrunden.
	   Använder befintlig motionAwareness, inga egna timers. */
	.companion-friend.is-paused,
	.companion-friend.is-paused .companion-friend-image {
		transition: none;
		animation-play-state: paused;
	}

	.companion-friend-image {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		/* Hovarna ligger i botten av canvasen (se assetspecifikationen), så
		   bilden förankras nedåt. */
		object-position: center bottom;
		/* Samma färggradering som följeslagaren, plus luftperspektiv-oskärpa
		   för den bortre positionen. Grundvärdet är identiskt med
		   CompanionPose --companion-grade för dag. */
		filter: var(--friend-grade, saturate(0.78) contrast(0.9) brightness(0.96) sepia(0.08))
			blur(var(--friend-blur, 0));
	}

	/* Steg 2: siluetten på andra sidan vattnet ska läsas som form, inte som ett
	   detaljerat djur - mörkare, plattare och mjukare än närbilderna. */
	.companion-friend[data-position='shore-far'] .companion-friend-image {
		filter: var(--friend-grade-far, saturate(0.42) contrast(0.82) brightness(0.72) sepia(0.12))
			blur(var(--friend-blur, 0.6px));
	}

	/* Skymning och natt.
	   Bilderna är exporterade i neutralt dagsljus, så kvälls- och nattkänslan
	   måste läggas på här. Utan detta behöll rådjuret dagsgraderingen medan
	   scenen och räven mörknade, och djuret lyste ut ur bilden.
	   Värdena speglar CompanionPose --companion-grade för respektive tid, med
	   ett snäpp lägre ljushet så vännen förblir mindre framträdande än räven.
	   Graderingen ärvs från scenens data-time; Mitt Hems hero sätter inget
	   data-time och håller därför både räv och rådjur i dagsläge. */
	:global(.companion-media[data-time='evening']) .companion-friend {
		--friend-grade: saturate(0.68) contrast(0.88) brightness(0.86) sepia(0.18)
			hue-rotate(-6deg);
		--friend-grade-far: saturate(0.38) contrast(0.8) brightness(0.66) sepia(0.2)
			hue-rotate(-6deg);
	}

	:global(.companion-media[data-time='night']) .companion-friend {
		--friend-grade: saturate(0.55) contrast(0.84) brightness(0.7) sepia(0.14)
			hue-rotate(5deg);
		--friend-grade-far: saturate(0.32) contrast(0.78) brightness(0.55) sepia(0.14)
			hue-rotate(5deg);
	}

	/* Basbredden är kalibrerad per scen mot hur stor följeslagaren faktiskt
	   renderas där, inte mot scenens bredd. Räven är stor i Mitt Hems hero men
	   liten och tillbakadragen i Framstegs banner, så samma procenttal ger helt
	   olika maktförhållande mellan djuren. Framsteg behöver därför ett mycket
	   lägre tal för att räven ska förbli den primära följeslagaren: med 22 %
	   blev rådjuret 2,5-3 ggr rävens höjd och upp till 6,6 ggr dess yta. */
	.companion-friend:global(.hero-companion-friend) {
		--friend-base-width: 30%;
	}

	.companion-friend:global(.progress-companion-friend) {
		--friend-base-width: 7%;
	}

	@media (max-width: 620px) {
		.companion-friend:global(.hero-companion-friend) {
			--friend-base-width: 38%;
		}

		.companion-friend:global(.progress-companion-friend) {
			--friend-base-width: 12%;
		}
	}

	/* 320-375 px: scenen är så smal att den bortre siluetten annars krymper
	   till en oläslig prick. Basbredden höjs, men djuret hålls fortfarande
	   mindre än följeslagaren. */
	@media (max-width: 380px) {
		.companion-friend:global(.hero-companion-friend) {
			--friend-base-width: 44%;
		}

		.companion-friend:global(.progress-companion-friend) {
			--friend-base-width: 14%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.companion-friend {
			transition: none;
		}
	}
</style>
