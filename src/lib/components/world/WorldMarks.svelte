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
				class:is-invisible={mark.invisible}
				style={markStyle(mark)}
				aria-pressed={revealedId === mark.id}
				aria-label={mark.label}
				onclick={() => toggle(mark)}
			>
				<!-- Platsen tar form: föremål med egen siluett i stället för en
					 gradient, så att de går att se och känna igen över tid. -->
				{#if mark.id === 'jetty-posts' || mark.id === 'jetty'}
					<!-- Bryggan pekar ut från stranden mot betraktaren och blir
						 bredare närmast, samma perspektiv som målningen. -->
					<svg class="mark-shape" viewBox="0 0 100 52" preserveAspectRatio="none" aria-hidden="true">
						{#if mark.id === 'jetty'}
							<path class="mark-reflection" d="M44 31v9M63 42v8M91 35v8" />
							<path class="jetty-post" d="M44 25v7M63 41v6M91 34v6" />
							<path class="jetty-deck" d="M8 7 27 4.5 92 33.5 62 41.5Z" />
							<path class="jetty-planks" d="M21 12.2 34.5 8.4M34 18.6 50 13.8M47 25 66 19.2M58 32 80 25.4" />
						{:else}
							<path class="mark-reflection" d="M24 18v7M44 29v8M63 40v8" />
							<path class="jetty-post" d="M24 10v9M44 21v9" />
							<path class="jetty-post jetty-post--short" d="M63 34v7" />
							<path class="jetty-beam" d="M9 7.5 26 11.5" />
						{/if}
					</svg>
				{:else if mark.id === 'rowboat'}
					<svg class="mark-shape" viewBox="0 0 42 14" preserveAspectRatio="none" aria-hidden="true">
						<path class="mark-reflection boat-reflection" d="M8 10.5Q21 13 35 10.5" />
						<path class="boat-hull" d="M1.5 3.6Q21 2.2 40.5 3.6L35 10Q21 11.8 7 10Z" />
						<path class="boat-rim" d="M3 4.2Q21 3 39 4.2" />
						<path class="boat-thwart" d="M17 4.4v4.6M26 4.4v4.6" />
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
		--wood-top: rgb(52 52 56);
		--wood-edge: rgb(26 26 30);
		--wood-post: rgb(24 24 28);
		--wood-beam: rgb(42 42 46);
		--hull: rgb(36 35 38);
		--hull-rim: rgb(58 58 62);
		--log-end: rgb(70 66 62);
		--log-stack: rgb(30 28 28);
		--lamp-glow: rgb(255 214 150 / 0.48);
	}

	.jetty-deck { fill: var(--wood-top); stroke: var(--wood-edge); stroke-width: 0.8px; }
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
