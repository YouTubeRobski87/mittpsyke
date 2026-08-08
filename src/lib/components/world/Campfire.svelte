<script lang="ts">
	// Den här gruppen är en sammanhängande fotorealistisk tillgång i stället
	// för fristående CSS-former. Det låter person, eld, ved och markkontakt
	// dela samma ljus, perspektiv och skärpa i Framstegs sjöscen.
	let { class: className = '' }: { class?: string } = $props();
</script>

<div class={`campfire ${className}`.trim()} aria-hidden="true">
	<img src="/images/scenes/progress-campfire-farmer.webp" alt="" decoding="async" />
</div>

<style>
	.campfire {
		position: absolute;
		/* Gruppen är ankrad i sin jordyta. Den står framför strandkanten men
		   har fri luft till både textblocket och räven. */
		left: 65%;
		top: 87%;
		z-index: var(--scene-overlay, 5);
		width: clamp(148px, 13.5vw, 190px);
		transform: translate3d(-50%, -100%, 0);
		pointer-events: none;
	}

	.campfire img {
		display: block;
		width: 100%;
		height: auto;
		/* En liten dämpning gör att den varma elden stämmer med kvällsbilden,
		   utan ett separat glow- eller spotlighthack. */
		filter: brightness(0.88) saturate(0.82) sepia(0.08);
	}

	@media (min-width: 981px) {
		.campfire {
			left: 65%;
			top: 87%;
			width: clamp(160px, 13.5vw, 198px);
		}
	}

	@media (max-width: 640px) {
		.campfire {
			/* Håller gruppen innanför beskärningen på mobil. Kopian ritas efter
			   scenlagren och förblir därför läsbar om ytorna möts. */
			left: 68%;
			top: 83%;
			width: clamp(122px, 38vw, 142px);
		}
	}
</style>
