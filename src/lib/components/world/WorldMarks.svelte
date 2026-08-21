<script lang="ts">
	// Renderar de små spår som vuxit fram i scenen över tid.
	//
	// Lagret ligger medvetet utanför AmbientWorld: den är aria-hidden och har
	// pointer-events: none, och spåren ska gå att röra vid och läsas upp. Formerna
	// är rena CSS-gradienter av samma slag som världens övriga lager, så inget nytt
	// bildmaterial laddas och scenen blir inte tyngre.
	//
	// Utan spår renderas ingenting alls, och utan JS-interaktion syns de ändå -
	// beröringen avslöjar bara en extra rad.
	import { createMotionAwareness } from '$lib/motionAwareness.svelte';
	import { getWorldMarkVariation, type WorldMark } from '$lib/world/worldStage';

	let {
		marks = [],
		visitSeed = null,
		class: className = ''
	}: {
		marks?: readonly WorldMark[];
		/** Ger besöket dess små förskjutningar. Null = spåren står exakt still. */
		visitSeed?: string | null;
		class?: string;
	} = $props();

	const motion = createMotionAwareness();
	let revealedId = $state<string | null>(null);

	const revealed = $derived(marks.find((mark) => mark.id === revealedId) ?? null);

	function markStyle(mark: WorldMark): string {
		const variation = getWorldMarkVariation(mark, visitSeed);
		return [
			`--x: ${variation.x}%`,
			`--y: ${variation.y}%`,
			`--w: ${mark.width}%`,
			`--h: ${mark.height}%`,
			`--depth: ${mark.depth}`,
			`--variation-opacity: ${variation.opacityScale}`
		].join('; ');
	}

	function toggle(mark: WorldMark) {
		revealedId = revealedId === mark.id ? null : mark.id;
	}
</script>

{#if marks.length > 0}
	<div class={`world-marks ${className}`.trim()} class:is-paused={motion.reducedMotion}>
		{#each marks as mark (mark.id)}
			<button
				type="button"
				class={`world-mark world-mark-${mark.id}`}
				class:is-invisible={mark.invisible}
				style={markStyle(mark)}
				aria-pressed={revealedId === mark.id}
				aria-label={mark.label}
				onclick={() => toggle(mark)}
			></button>
		{/each}

		<p class="world-mark-caption" role="status" aria-live="polite">
			{#if revealed}{revealed.revealText}{/if}
		</p>
	</div>
{/if}

<style>
	.world-marks {
		position: absolute;
		inset: 0;
		/* Ovanpå de rena bakgrundslagren, men under följeslagaren och scenens
		   copy. Sidan sätter --world-marks-z ur sin egen scenskala. */
		z-index: var(--world-marks-z, 2);
		overflow: hidden;
		contain: layout paint style;
		pointer-events: none;
	}

	.world-mark {
		position: absolute;
		left: var(--x, 0);
		top: var(--y, 0);
		width: var(--w, 2%);
		height: var(--h, 2%);
		padding: 0;
		border: 0;
		background: transparent;
		/* app.css sätter 44 px minsta träffyta på alla knappar vid pointer: coarse.
		   Här skulle det blåsa upp själva formen, så måttet flyttas till ::before
		   nedan i stället - träffytan blir densamma, spåret behåller sin storlek. */
		min-width: 0;
		min-height: 0;
		opacity: calc(var(--mark-opacity, 0.4) * var(--variation-opacity, 1));
		pointer-events: auto;
		cursor: pointer;
		/* Beröringsytan är större än formen, utan att formen växer. */
		outline-offset: 6px;
	}

	/* Spåren är avsiktligt små. Beröringsytan hålls ändå minst 44 px i båda
	   riktningarna, centrerad över formen, utan att formen växer. */
	.world-mark::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		width: max(100%, 44px);
		height: max(100%, 44px);
		transform: translate(-50%, -50%);
	}

	.world-mark:focus-visible {
		outline: 2px solid rgb(255 250 242 / 0.72);
		border-radius: 4px;
	}

	/* Motivet finns redan i scenen - knappen är bara ytan att röra vid. Den
	   behåller sin fokusram, så den går fortfarande att hitta med tangentbord. */
	.world-mark.is-invisible {
		background: none;
		opacity: 1;
		animation: none;
	}

	/* Spåren är alltid dovare än scenen omkring dem. Ingen av dem får läsa som
	   en markör, en knapp eller något som vill ha uppmärksamhet. */
	.world-mark-old-tree {
		--mark-opacity: 0.3;
		background:
			radial-gradient(ellipse at 32% 22%, rgba(58, 82, 56, 0.5), transparent 58%),
			radial-gradient(ellipse at 58% 44%, rgba(74, 100, 64, 0.36), transparent 56%),
			radial-gradient(ellipse at 20% 58%, rgba(52, 76, 52, 0.3), transparent 60%);
		filter: blur(3px);
		transform-origin: 20% 0%;
		animation: markSway 13s ease-in-out infinite;
	}

	/* Små varma ljus över den bortre delen av vattnet. Suddiga och glesa - de
	   ska läsas som atmosfär på avstånd, aldrig som markörer. */
	.world-mark-night-glow {
		--mark-opacity: 0.44;
		background:
			radial-gradient(circle at 14% 52%, rgba(255, 226, 170, 0.85) 0 1px, transparent 3px),
			radial-gradient(circle at 38% 28%, rgba(255, 232, 186, 0.7) 0 0.9px, transparent 2.6px),
			radial-gradient(circle at 57% 68%, rgba(255, 222, 166, 0.62) 0 0.8px, transparent 2.4px),
			radial-gradient(circle at 79% 40%, rgba(255, 236, 196, 0.6) 0 0.9px, transparent 2.6px);
		filter: blur(0.6px);
		animation: markTwinkle 11s ease-in-out infinite;
	}

	.world-mark-still-birds {
		--mark-opacity: 0.34;
		background:
			radial-gradient(ellipse at 22% 60%, rgba(41, 52, 48, 0.72) 0 12%, transparent 17%),
			radial-gradient(ellipse at 58% 44%, rgba(41, 52, 48, 0.6) 0 10%, transparent 15%),
			radial-gradient(ellipse at 84% 66%, rgba(41, 52, 48, 0.5) 0 9%, transparent 14%);
	}

	.world-mark-lantern {
		--mark-opacity: 0.62;
		background:
			radial-gradient(ellipse at 50% 30%, rgba(255, 214, 148, 0.9) 0 26%, transparent 46%),
			linear-gradient(180deg, transparent 46%, rgba(58, 62, 58, 0.62) 52%, rgba(58, 62, 58, 0.5) 100%);
		filter: blur(0.3px);
		animation: markGlow 7.5s ease-in-out infinite;
	}

	.world-mark-resting-seat {
		--mark-opacity: 0.36;
		background:
			linear-gradient(180deg, transparent 26%, rgba(84, 68, 52, 0.78) 30%, rgba(84, 68, 52, 0.72) 44%, transparent 48%),
			linear-gradient(90deg, transparent 14%, rgba(74, 60, 46, 0.6) 16%, transparent 22%),
			linear-gradient(90deg, transparent 78%, rgba(74, 60, 46, 0.6) 80%, transparent 86%);
		filter: blur(0.4px);
	}

	/* Några få ljusa punkter i gräset. Samma slag av småblommor som redan finns
	   i scenens förgrund, bara en aning fler. */
	.world-mark-first-bloom {
		--mark-opacity: 0.4;
		background:
			radial-gradient(circle at 18% 62%, rgba(246, 238, 214, 0.82) 0 1.1px, transparent 2.6px),
			radial-gradient(circle at 44% 34%, rgba(226, 214, 236, 0.7) 0 1px, transparent 2.4px),
			radial-gradient(circle at 68% 70%, rgba(246, 240, 220, 0.66) 0 1px, transparent 2.4px),
			radial-gradient(circle at 88% 44%, rgba(232, 222, 240, 0.6) 0 0.9px, transparent 2.2px);
		filter: blur(0.3px);
	}

	/* En ring av stenar runt elden. Låg, varm och dov - den ska läsas som mark
	   intill lågan, aldrig som ytterligare en ljuskälla. */
	.world-mark-hearth-stones {
		--mark-opacity: 0.34;
		background:
			radial-gradient(ellipse at 16% 66%, rgba(126, 120, 112, 0.7) 0 16%, transparent 22%),
			radial-gradient(ellipse at 40% 78%, rgba(146, 136, 124, 0.62) 0 14%, transparent 20%),
			radial-gradient(ellipse at 66% 68%, rgba(118, 112, 106, 0.66) 0 15%, transparent 21%),
			radial-gradient(ellipse at 88% 80%, rgba(138, 128, 118, 0.56) 0 13%, transparent 19%);
		filter: blur(0.9px);
	}

	.world-mark-mushrooms {
		--mark-opacity: 0.42;
		background:
			radial-gradient(ellipse at 24% 46%, rgba(196, 168, 140, 0.8) 0 30%, transparent 44%),
			radial-gradient(ellipse at 58% 62%, rgba(178, 150, 124, 0.7) 0 24%, transparent 38%),
			radial-gradient(ellipse at 82% 52%, rgba(188, 160, 132, 0.6) 0 20%, transparent 34%);
		filter: blur(0.4px);
	}

	.world-mark-shore-stone {
		--mark-opacity: 0.4;
		border-radius: 50% 46% 52% 48% / 62% 58% 42% 38%;
		background: linear-gradient(165deg, rgba(150, 150, 145, 0.62), rgba(96, 98, 96, 0.5));
		filter: blur(0.5px);
	}

	.world-mark-shore-path {
		--mark-opacity: 0.3;
		border-radius: 999px;
		background: linear-gradient(90deg, transparent, rgba(178, 160, 136, 0.5) 34%, rgba(168, 150, 128, 0.42) 66%, transparent);
		filter: blur(2.5px);
	}

	/* Rätt bakom copyn i scenen sitter redan text, så raden hamnar uppe till
	   vänster där ingenting annat ligger. */
	.world-mark-caption {
		position: absolute;
		left: clamp(1.25rem, 3.2vw, 2rem);
		top: clamp(1rem, 2.6vw, 1.6rem);
		max-width: min(22rem, 62%);
		margin: 0;
		color: rgb(250 246 238 / 0.9);
		font-size: 0.82rem;
		line-height: 1.4;
		text-shadow: 0 2px 12px rgb(0 0 0 / 0.5);
		pointer-events: none;
	}

	.world-mark-caption:empty {
		display: none;
	}

	@keyframes markSway {
		0%, 100% { transform: rotate(0deg); }
		52% { transform: rotate(0.5deg) translate3d(1px, -0.5px, 0); }
	}

	@keyframes markGlow {
		0%, 100% { opacity: calc(var(--mark-opacity, 0.6) * var(--variation-opacity, 1) * 0.86); }
		48% { opacity: calc(var(--mark-opacity, 0.6) * var(--variation-opacity, 1)); }
	}

	@keyframes markTwinkle {
		0%, 100% { opacity: calc(var(--mark-opacity, 0.5) * var(--variation-opacity, 1) * 0.72); }
		44% { opacity: calc(var(--mark-opacity, 0.5) * var(--variation-opacity, 1)); }
	}

	.is-paused .world-mark {
		animation: none !important;
	}

	@media (prefers-reduced-motion: reduce) {
		.world-mark {
			animation: none !important;
			transform: none !important;
		}
	}
</style>
