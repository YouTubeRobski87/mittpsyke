<script lang="ts">
	// Renderar de små spår som vuxit fram i scenen över tid.
	//
	// Lagret ligger medvetet utanför AmbientWorld: den är aria-hidden och har
	// pointer-events: none, och spåren ska gå att röra vid och läsas upp.
	// CSS och små SVG-former gör att inget separat bildmaterial behöver laddas.
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

	// Träffytorna ritas i ett eget lager under formerna. Där två ytor möts
	// vinner det minsta spåret, eftersom det är svårast att träffa - de stora
	// har ändå sin egen synliga form att trycka på. Ordningen påverkar inte
	// tangentbordet: lagret är aria-hidden och knapparna nedan står kvar i
	// samma ordning som förut.
	const hitOrder = $derived([...marks].sort((a, b) => b.width * b.height - a.width * a.height));
</script>

{#if marks.length > 0}
	<div class={`world-marks ${className}`.trim()} class:is-paused={motion.reducedMotion}>
		<!-- Osynliga beröringsytor, minst 44 × 44 px och centrerade över varje
			 spår. Bara för pekare och finger; knappen ovanför är den riktiga
			 kontrollen för tangentbord och skärmläsare. -->
		{#each hitOrder as mark (mark.id)}
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<span
				class="world-mark-hit"
				data-mark-hit={mark.id}
				style={markStyle(mark)}
				aria-hidden="true"
				onclick={() => toggle(mark)}
			></span>
		{/each}
		{#each marks as mark (mark.id)}
			<button
				type="button"
				class={`world-mark world-mark-${mark.id}`}
				data-mark={mark.id}
				data-path-presence={mark.pathPresence}
				class:is-invisible={mark.invisible}
				style={markStyle(mark)}
				aria-pressed={revealedId === mark.id}
				aria-label={mark.label}
				onclick={() => toggle(mark)}
			>
				<!-- Platsen tar form: föremål med egen siluett i stället för en
					 gradient, så att de går att se och känna igen över tid. -->
				{#if mark.id === 'jetty-posts' || mark.id === 'jetty'}
					<!-- Bryggan börjar på höger strand och löper snett ut i vattnet. -->
					<svg class="mark-shape" viewBox="0 0 100 52" preserveAspectRatio="none" aria-hidden="true">
						{#if mark.id === 'jetty'}
							<path class="mark-reflection" d="M14 26v8M45 26v7M32 37v7M58 36v6" />
							<path class="jetty-post" d="M14 17v10M45 13v14M32 29v9M58 26v11M50 41v7" />
							<path class="jetty-edge" d="M10 16 66 47 95 35 95 38 66 50 10 20Z" />
							<path class="jetty-deck" d="M10 16 36 8 95 35 66 47Z" />
							<path class="jetty-planks" d="M20 22 47 13M30 28 57 18M41 34 69 24M52 40 81 29" />
						{:else}
							<path class="mark-reflection" d="M14 26v8M34 35v8M45 25v7" />
							<path class="jetty-post" d="M14 14v13M34 24v12M45 12v14" />
							<path class="jetty-post jetty-post--short" d="M58 25v11" />
							<path class="jetty-beam" d="M14 18 45 15M34 28 58 29" />
						{/if}
					</svg>
				{:else if mark.id === 'rowboat'}
					<svg class="mark-shape" viewBox="0 0 42 14" preserveAspectRatio="none" aria-hidden="true">
						<path class="mark-reflection boat-reflection" d="M8 10.5Q21 13 35 10.5" />
						<path class="boat-hull" d="M1.5 3.6Q20 0 40.5 4.8Q37 8.3 33 10Q19 11.8 7 8.9Q3 6.2 1.5 3.6Z" />
						<path class="boat-rim" d="M2 3.6Q22 1 40 4.8Q20 7.7 2 3.6Z" />
						<path class="boat-thwart" d="M15 2.8l1 2.6M26 3l-1 2.9" />
					</svg>
				{:else if mark.id === 'woodpile'}
					<svg class="mark-shape" viewBox="0 0 32 18" preserveAspectRatio="none" aria-hidden="true">
						<path class="woodpile-back" d="M1 17V5.5L31 4.5V17Z" />
						{#each [[5, 14], [11, 14], [17, 14], [23, 14], [28, 14], [8, 9.5], [14, 9.5], [20, 9.5], [26, 9.5], [11, 5.5], [18, 5.5], [24, 5.5]] as [cx, cy]}
							<ellipse class="woodpile-log" cx={cx} cy={cy} rx="2.8" ry="2.2" />
						{/each}
					</svg>
				{:else if mark.id === 'jetty-light'}
					<svg class="mark-shape" viewBox="0 0 14 34" preserveAspectRatio="none" aria-hidden="true">
						<circle class="jetty-light-glow" cx="7" cy="7" r="6.5" />
						<path class="jetty-post" d="M7 9v24" />
						<rect class="jetty-light-lamp" x="5" y="5" width="4" height="4.6" rx="1" />
					</svg>
				{:else if mark.id === 'shore-reeds'}
					<svg class="mark-shape" viewBox="0 0 120 62" preserveAspectRatio="none" aria-hidden="true">
						<path class="reed-leaves" d="M6 56Q8 39 2 33Q12 35 15 52Q13 34 19 21Q19 42 23 57Q27 46 37 41Q34 51 26 58Z M39 57Q43 40 36 31Q46 36 48 54Q49 32 55 29Q53 39 57 54Q64 38 74 34Q66 45 61 57Z M81 53Q82 37 77 29Q86 34 89 52Q90 31 97 25Q93 42 96 52Q104 38 119 36Q108 43 104 52Z" />
						<path class="reed-stems" d="M16 56Q11 31 12 15M24 57Q22 37 26 26M49 56Q45 27 48 13M58 56Q59 34 63 24M89 52Q86 28 88 14M98 52Q101 28 105 20" />
						<path class="reed-heads" d="M12 16v-6M26 27l1-5M48 14v-7M64 24l1-5M88 15V9M105 21l2-5" />
					</svg>
				{:else if mark.id === 'bank-flowers'}
					<svg class="mark-shape" viewBox="0 0 128 58" preserveAspectRatio="none" aria-hidden="true">
						<path class="flower-leaves" d="M12 46Q7 38 2 37Q15 37 20 44Q19 37 24 33Q26 42 22 47Q34 37 43 39Q41 45 31 48Z M68 52Q58 42 51 43Q61 39 75 48Q70 38 76 35Q80 41 80 47Q86 39 96 39Q93 47 87 51Z M95 38Q92 30 86 29Q96 27 103 35Q103 27 108 22Q112 28 109 34Q119 27 125 30Q120 36 114 38Z" />
						<path class="reed-stems" d="M21 45Q19 35 16 29M28 45Q31 32 35 31M76 48Q71 36 66 34M78 47Q78 27 83 23M86 48Q88 39 94 34M105 36Q103 22 100 19M110 36Q114 27 117 24" />
						<path class="bank-blossoms" d="M12 27l4-2 4 2-1 4-5 1Z M31 29l5-3 3 3-2 4-5 1Z M62 32l4-2 5 2-2 5-5-1Z M79 22l4-4 4 3-1 5-6 1Z M91 32l4-3 4 2-2 5-5 1Z M96 18l4-3 5 2-1 5-6 1Z M114 23l3-4 4 3-1 4-5 1Z" />
					</svg>
				{/if}
			</button>
		{/each}

		<p class="world-mark-caption" role="status" aria-live="polite">
			{#if revealed}{revealed.revealText}{/if}
		</p>
	</div>
{/if}

<style>
	.world-marks {
		--reed-leaf: rgb(88 99 48);
		--reed-stem: rgb(127 139 72);
		--reed-head: rgb(92 65 43);
		--bank-leaf: rgb(103 113 50);
		--bank-flower: rgb(208 178 200);
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
		   Här skulle det blåsa upp själva formen, så måttet ligger i stället på
		   .world-mark-hit nedan - träffytan blir densamma, spåret behåller sin storlek. */
		min-width: 0;
		min-height: 0;
		opacity: calc(var(--mark-opacity, 0.4) * var(--variation-opacity, 1));
		pointer-events: auto;
		cursor: pointer;
		/* Formerna ligger ovanför alla beröringsytor, så den synliga formen
		   alltid träffar sitt eget spår - även där en granne har sin yta. */
		z-index: 2;
		/* Beröringsytan är större än formen, utan att formen växer. */
		outline-offset: 6px;
	}

	/* Spåren är avsiktligt små. Beröringsytan hålls ändå minst 44 px i båda
	   riktningarna, centrerad över formen, utan att formen växer. Den låg
	   tidigare som ::before på själva knappen, men då låg en senare knapps yta
	   ovanpå en tidigare knapps form: på 320 px gick Bryggan och Stenen knappt
	   att träffa, eftersom Lyktan och Stigen täckte dem. */
	.world-mark-hit {
		position: absolute;
		left: calc(var(--x, 0%) + var(--w, 2%) / 2);
		top: calc(var(--y, 0%) + var(--h, 2%) / 2);
		width: max(var(--w, 2%), 44px);
		height: max(var(--h, 2%), 44px);
		transform: translate(-50%, -50%);
		z-index: 1;
		pointer-events: auto;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
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

	/* ── Platsen tar form ──
	   Byggda föremål vid stugans strand. De är tydligare än övriga spår - de
	   ska synas vid en återkomst - men har scenens dova, väderbitna trätoner
	   och en lätt oskärpa så de sitter i målningen i stället för ovanpå den. */
	.world-mark-woodpile,
	.world-mark-jetty-posts,
	.world-mark-jetty,
	.world-mark-rowboat,
	.world-mark-jetty-light {
		--mark-opacity: 0.9;
		filter: blur(0.35px);
	}

	.mark-shape {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}

	.mark-shape path,
	.mark-shape rect {
		vector-effect: non-scaling-stroke;
	}

	/* Trätonerna följer dygnet via scenens data-time, så föremålen mörknar med
	   målningen i stället för att lysa upp i skymningen. */
	.world-marks {
		--wood-top: rgb(118 101 80);
		--wood-edge: rgb(62 52 41);
		--wood-post: rgb(58 48 38);
		--wood-beam: rgb(92 78 62);
		--hull: rgb(76 60 47);
		--hull-rim: rgb(118 100 80);
		--log-end: rgb(152 126 96);
		--log-stack: rgb(70 56 42);
		--lamp-glow: rgb(255 214 150 / 0.22);
	}
	:global([data-time='evening']) .world-marks {
		--reed-leaf: rgb(62 70 41);
		--reed-stem: rgb(110 109 67);
		--reed-head: rgb(78 56 39);
		--bank-leaf: rgb(79 83 42);
		--bank-flower: rgb(171 137 158);
		--wood-top: rgb(74 64 54);
		--wood-edge: rgb(38 33 28);
		--wood-post: rgb(34 29 24);
		--wood-beam: rgb(58 50 42);
		--hull: rgb(50 41 34);
		--hull-rim: rgb(80 69 58);
		--log-end: rgb(98 82 64);
		--log-stack: rgb(42 35 28);
		--lamp-glow: rgb(255 214 150 / 0.4);
	}
	:global([data-time='night']) .world-marks {
		--reed-leaf: rgb(37 53 49);
		--reed-stem: rgb(70 83 70);
		--reed-head: rgb(45 42 39);
		--bank-leaf: rgb(48 61 53);
		--bank-flower: rgb(107 112 141);
		--wood-top: rgb(65 71 80);
		--wood-edge: rgb(26 26 30);
		--wood-post: rgb(24 24 28);
		--wood-beam: rgb(42 42 46);
		--hull: rgb(36 40 47);
		--hull-rim: rgb(87 91 101);
		--log-end: rgb(70 66 62);
		--log-stack: rgb(30 28 28);
		--lamp-glow: rgb(255 214 150 / 0.48);
	}

	.world-mark-shore-reeds,
	.world-mark-bank-flowers {
		--mark-opacity: 0.88;
	}

	.reed-leaves { fill: var(--reed-leaf); }
	.flower-leaves { fill: var(--bank-leaf); }
	.bank-blossoms { fill: var(--bank-flower); }
	.reed-stems,
	.reed-heads {
		fill: none;
		stroke-linecap: round;
	}
	.reed-stems { stroke: var(--reed-stem); stroke-width: 1px; }
	.reed-heads { stroke: var(--reed-head); stroke-width: 2px; }

	.jetty-deck { fill: var(--wood-top); stroke: var(--wood-edge); stroke-width: 0.8px; }
	.jetty-edge { fill: var(--wood-edge); }
	.jetty-planks { fill: none; stroke: var(--wood-edge); stroke-opacity: 0.7; stroke-width: 0.8px; }
	.jetty-post { fill: none; stroke: var(--wood-post); stroke-width: 2px; stroke-linecap: round; }
	.jetty-post--short { stroke-width: 1.6px; }
	.jetty-beam { fill: none; stroke: var(--wood-beam); stroke-width: 1.6px; stroke-linecap: round; }
	/* Spegling i vattnet: samma former, svagare och mjukare. */
	.mark-reflection { fill: none; stroke: var(--wood-post); stroke-opacity: 0.28; stroke-width: 1.6px; stroke-linecap: round; }

	.boat-hull { fill: var(--hull); stroke: var(--wood-edge); stroke-width: 0.8px; }
	.boat-rim { fill: none; stroke: var(--hull-rim); stroke-width: 0.9px; }
	.boat-thwart { fill: none; stroke: var(--wood-edge); stroke-width: 0.9px; }
	.boat-reflection { stroke-opacity: 0.22; stroke-width: 2px; }

	.woodpile-back { fill: var(--log-stack); }
	.woodpile-log { fill: var(--log-end); stroke: var(--wood-edge); stroke-width: 0.7px; }

	.jetty-light-lamp { fill: rgb(255 222 160); stroke: var(--wood-post); stroke-width: 0.7px; }
	.jetty-light-glow { fill: var(--lamp-glow); }
	.world-mark-jetty-light { animation: markGlow 8.5s ease-in-out infinite; }

	.world-mark-shore-stone {
		--mark-opacity: 0.4;
		border-radius: 50% 46% 52% 48% / 62% 58% 42% 38%;
		background: linear-gradient(165deg, rgba(150, 150, 145, 0.62), rgba(96, 98, 96, 0.5));
		filter: blur(0.5px);
	}

	.world-mark-shore-path {
		--mark-opacity: 0.18;
		border-radius: 999px;
		background: linear-gradient(90deg, transparent, rgba(178, 160, 136, 0.42) 34%, rgba(168, 150, 128, 0.34) 66%, transparent);
		filter: blur(3px);
	}

	.world-mark-shore-path[data-path-presence='2'] {
		--mark-opacity: 0.26;
		filter: blur(2.5px);
	}

	.world-mark-shore-path[data-path-presence='3'] {
		--mark-opacity: 0.34;
		background: linear-gradient(90deg, transparent, rgba(188, 169, 144, 0.54) 30%, rgba(174, 155, 132, 0.48) 70%, transparent);
		filter: blur(2px);
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
