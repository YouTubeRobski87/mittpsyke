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
		/* Alltid under huvudföljeslagaren (--scene-companion). Vännen får aldrig
		   konkurrera visuellt med djuret användaren valt. */
		z-index: var(--scene-ambient, 2);
		pointer-events: none;
		/* Osynlig tills bilden laddat - hindrar både trasig ikon och att en
		   halvladdad bild blinkar till i scenen. */
		opacity: 0;
		transition: opacity 1200ms ease;
	}

	.companion-friend.is-loaded {
		opacity: var(--friend-opacity, 0.8);
	}

	/* Reduced motion: bilden ska fortfarande synas, men utan intoning. */
	.companion-friend.is-paused {
		transition: none;
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
		   för den bortre positionen. */
		filter: saturate(0.78) contrast(0.9) brightness(0.96) sepia(0.08)
			blur(var(--friend-blur, 0));
	}

	/* Steg 2: siluetten på andra sidan vattnet ska läsas som form, inte som ett
	   detaljerat djur - mörkare, plattare och mjukare än närbilderna. */
	.companion-friend[data-position='shore-far'] .companion-friend-image {
		filter: saturate(0.42) contrast(0.82) brightness(0.72) sepia(0.12)
			blur(var(--friend-blur, 0.6px));
	}

	.companion-friend:global(.hero-companion-friend) {
		--friend-base-width: 30%;
	}

	.companion-friend:global(.progress-companion-friend) {
		--friend-base-width: 22%;
	}

	@media (max-width: 620px) {
		.companion-friend:global(.hero-companion-friend) {
			--friend-base-width: 38%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.companion-friend {
			transition: none;
		}
	}
</style>
