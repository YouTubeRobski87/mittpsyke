<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getProgressCompanionAnimal,
		getProgressCompanionArtId,
		getProgressCompanionDayState,
		getProgressCompanionDayStateImage,
		getProgressCompanionDayStateLabel,
		type ProgressCompanionDayState,
		type ProgressCompanionSelection
	} from '$lib/progressCompanion';
	import CompanionScene from '$lib/components/CompanionScene.svelte';
	import { getTimeOfDay, type TimeOfDay } from '$lib/utils/getTimeOfDay';

	let {
		progressCompanion = null
	}: {
		progressCompanion?: ProgressCompanionSelection | string | null;
	} = $props();

	let dayState = $state<ProgressCompanionDayState>(getProgressCompanionDayState());
	let timeOfDay = $state<TimeOfDay>(getTimeOfDay());

	const companion = $derived(getProgressCompanionAnimal(progressCompanion));
	const companionName = $derived(companion?.name ?? 'Din följeslagare');
	const companionArtId = $derived(getProgressCompanionArtId(companion?.id));
	const dayStateLabel = $derived(getProgressCompanionDayStateLabel(dayState));
	const dayStateImage = $derived(getProgressCompanionDayStateImage(dayState));
	const stateText = $derived.by(() => {
		if (dayState === 'morning') return 'Den vaknar mjukt med dagen.';
		if (dayState === 'evening') return 'Den rör sig långsammare när kvällen landar.';
		if (dayState === 'night') return 'Den vilar här medan natten är stilla.';
		return 'Den håller platsen lugnt under dagen.';
	});
	const restingPlaceLabel = $derived(
		dayState === 'night' ? 'Se platsen den vilar i' : 'Se platsen den bor i'
	);

	onMount(() => {
		dayState = getProgressCompanionDayState();
		timeOfDay = getTimeOfDay();
	});
</script>

<article
	class="silent-companion"
	data-state={dayState}
	data-companion={companionArtId}
	aria-labelledby="silent-companion-title"
>
	<div class="companion-copy">
		<p class="companion-kicker">{dayStateLabel}</p>
		<h2 id="silent-companion-title">Den tysta följeslagaren</h2>
		<p>{stateText}</p>
		<p class="companion-note">Den finns kvar här när du återvänder.</p>
		<div class="companion-actions">
			<a class="place-link" href="/framsteg#growth-garden">
				{restingPlaceLabel}
			</a>
		</div>
	</div>

	<div id="companion-resting-place" class="companion-scene" aria-label={`${companionName} vilar vid sjön`}>
		{#if dayStateImage}
			<img
				class="day-state-image"
				src={dayStateImage}
				alt={`${companionName} på sin lugna plats`}
				loading="lazy"
				decoding="async"
			/>
			{#if dayState === 'day'}
				<img
					class="passing-butterfly"
					src="/images/companion-butterfly.png"
					alt=""
					aria-hidden="true"
					loading="lazy"
					decoding="async"
				/>
			{/if}
		{:else}
		<svg viewBox="0 0 720 420" role="img" focusable="false">
			<title>{companionName} vilar vid en stilla sjö under månen</title>
			<defs>
				<linearGradient id="nightSky" x1="0" x2="0" y1="0" y2="1">
					<stop offset="0%" stop-color="#0c1930" />
					<stop offset="54%" stop-color="#13223a" />
					<stop offset="100%" stop-color="#0a121f" />
				</linearGradient>
				<linearGradient id="lakeGlow" x1="0" x2="0" y1="0" y2="1">
					<stop offset="0%" stop-color="#263b5d" />
					<stop offset="58%" stop-color="#122237" />
					<stop offset="100%" stop-color="#09101d" />
				</linearGradient>
				<radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stop-color="#f3ead4" />
					<stop offset="62%" stop-color="#d8d0bd" />
					<stop offset="100%" stop-color="#aeb7c7" />
				</radialGradient>
				<radialGradient id="quietGlow" cx="42%" cy="50%" r="64%">
					<stop offset="0%" stop-color="rgba(238, 211, 157, 0.34)" />
					<stop offset="100%" stop-color="rgba(238, 211, 157, 0)" />
				</radialGradient>
				<filter id="softBlur">
					<feGaussianBlur stdDeviation="7" />
				</filter>
			</defs>

			<rect width="720" height="420" rx="24" fill="url(#nightSky)" />
			<g class="camera-plane">
				<g class="stars" opacity="0.72">
					<circle cx="166" cy="42" r="1.2" />
					<circle cx="242" cy="72" r="0.9" />
					<circle cx="326" cy="34" r="1.5" />
					<circle cx="456" cy="62" r="1.1" />
					<circle cx="586" cy="38" r="1.3" />
					<circle cx="648" cy="86" r="0.9" />
					<circle cx="520" cy="118" r="1" />
					<circle cx="382" cy="104" r="0.8" />
					<circle cx="292" cy="128" r="1.2" />
					<circle cx="610" cy="148" r="1.1" />
				</g>

				<g class="moon">
					<circle cx="485" cy="96" r="18" fill="rgba(255,255,255,0.16)" filter="url(#softBlur)" />
					<circle cx="485" cy="96" r="14" fill="url(#moonGlow)" />
					<circle cx="480" cy="92" r="3" fill="rgba(120, 132, 152, 0.28)" />
					<circle cx="491" cy="101" r="2.2" fill="rgba(120, 132, 152, 0.24)" />
				</g>

				<path class="back-mountain" d="M0 235 C86 179 152 202 226 172 C307 138 384 184 466 154 C558 121 635 162 720 132 L720 420 L0 420 Z" />
				<path class="front-mountain" d="M0 252 C92 216 157 224 240 202 C342 176 411 217 503 191 C588 166 648 186 720 160 L720 420 L0 420 Z" />

				<g class="tree">
					<path class="tree-trunk" d="M112 80 C102 136 105 224 84 325 C105 337 135 338 156 324 C138 229 142 142 128 80 Z" />
					<path class="tree-trunk-dark" d="M116 89 C114 153 122 225 104 318" />
					<path class="branch branch-a" d="M122 132 C87 103 51 96 18 112" />
					<path class="branch branch-b" d="M122 154 C171 126 205 101 246 93" />
					<path class="branch branch-c" d="M126 113 C154 78 184 56 232 43" />
					<g class="canopy">
						<ellipse cx="54" cy="78" rx="82" ry="60" />
						<ellipse cx="136" cy="54" rx="98" ry="62" />
						<ellipse cx="226" cy="78" rx="76" ry="56" />
						<ellipse cx="130" cy="106" rx="114" ry="60" />
					</g>
					<g class="leaves">
						<path d="M79 145 q9 -7 18 0 q-9 9 -18 0" />
						<path d="M197 124 q8 -6 16 0 q-8 8 -16 0" />
						<path d="M246 91 q7 -5 14 0 q-7 7 -14 0" />
					</g>
				</g>

				<path class="shoreline" d="M0 281 C118 258 196 265 295 279 C407 295 522 277 720 246 L720 420 L0 420 Z" />
				<path class="lake" d="M158 257 C260 246 332 266 412 264 C515 261 600 230 720 224 L720 350 C585 333 486 342 390 332 C296 322 226 329 130 312 Z" />
				<path class="moon-reflection" d="M475 123 C458 166 461 214 443 260 C469 252 494 251 518 256 C500 212 501 166 489 124 Z" />
				<path class="far-shore" d="M232 259 C328 247 433 254 538 236 C610 224 671 220 720 216" />

				<g class="mist">
					<path d="M258 224 C332 208 385 223 452 209 C504 198 556 205 615 194" />
					<path d="M170 246 C241 231 286 240 348 229 C401 220 459 225 522 216" />
				</g>

				{#if companionArtId === 'bear'}
					<g class="photo-resting-companion" aria-hidden="true">
						<image
							class="photo-resting-image"
							href="/images/resting-bear-photo-fill.png"
							x="10"
							y="82"
							width="310"
							height="303"
							preserveAspectRatio="xMidYMid slice"
						/>
					</g>
				{:else}
					<g class="resting-companion" aria-hidden="true">
						<ellipse class="companion-shadow" cx="154" cy="330" rx="48" ry="10" />
						<circle class="ear left-ear" cx="121" cy="265" r="12" />
						<circle class="ear right-ear" cx="163" cy="260" r="13" />
						<g class="breathing-body">
							<ellipse class="body" cx="154" cy="304" rx="45" ry="44" />
							<ellipse class="belly" cx="156" cy="314" rx="25" ry="28" />
							<ellipse class="head" cx="143" cy="269" rx="32" ry="29" />
							<path class="sleep-eye" d="M127 265 C132 268 137 268 142 265" />
							<path class="sleep-eye" d="M150 265 C155 268 160 268 165 265" />
							<path class="mouth" d="M137 282 C143 287 151 287 157 282" />
						</g>
						<path class="arm" d="M119 301 C103 310 97 326 108 335" />
						<path class="arm" d="M185 301 C200 311 204 327 193 336" />
					</g>
				{/if}

				<g class="fireflies">
					<circle cx="214" cy="302" r="2.1" />
					<circle cx="232" cy="278" r="1.7" />
					<circle cx="184" cy="292" r="1.5" />
					<circle cx="262" cy="316" r="1.6" />
				</g>

				<g class="foreground">
					<path d="M0 330 C93 309 156 324 232 302 C333 273 445 300 720 268 L720 420 L0 420 Z" />
					<path class="grass" d="M26 334 q8 -25 18 0 M58 338 q9 -30 18 0 M204 329 q8 -27 17 0 M248 322 q8 -23 14 0 M314 315 q9 -28 17 0" />
				</g>
			</g>
		</svg>

		<CompanionScene {timeOfDay} />
		{/if}
	</div>
</article>

<style>
	.silent-companion {
		--companion-body: #9b735d;
		--companion-body-dark: #765443;
		--companion-belly: #d7baa0;
		--companion-face: #a67c64;
		--companion-line: rgba(42, 34, 30, 0.82);
		display: grid;
		grid-template-columns: minmax(15rem, 0.74fr) minmax(0, 1.26fr);
		gap: 1.2rem;
		align-items: stretch;
		min-height: 17rem;
		padding: 1.15rem;
		overflow: hidden;
		border: 1px solid rgba(168, 130, 255, 0.14);
		border-radius: var(--mp-radius);
		background:
			radial-gradient(520px 260px at 100% 14%, rgba(154, 174, 210, 0.12), transparent 58%),
			linear-gradient(135deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.018));
		backdrop-filter: blur(14px);
	}

	.silent-companion[data-companion='fox'] {
		--companion-body: #c87948;
		--companion-body-dark: #9c5838;
		--companion-belly: #f2d8bf;
		--companion-face: #d68a55;
	}

	.silent-companion[data-companion='owl'] {
		--companion-body: #8b745f;
		--companion-body-dark: #635040;
		--companion-belly: #d9c7aa;
		--companion-face: #9d856d;
	}

	.silent-companion[data-companion='rabbit'] {
		--companion-body: #c9b9ad;
		--companion-body-dark: #9d8b80;
		--companion-belly: #efe4d8;
		--companion-face: #d2c3b7;
	}

	.silent-companion[data-companion='squirrel'] {
		--companion-body: #b8754e;
		--companion-body-dark: #895538;
		--companion-belly: #e9c7ac;
		--companion-face: #c7865c;
	}

	.silent-companion[data-companion='turtle'],
	.silent-companion[data-companion='dino'] {
		--companion-body: #87986f;
		--companion-body-dark: #5f704f;
		--companion-belly: #cbd6b1;
		--companion-face: #91a075;
	}

	.companion-copy {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.58rem;
		padding: 0.45rem 0.25rem 0.45rem 0.25rem;
		min-width: 0;
	}

	.companion-kicker,
	.companion-copy h2,
	.companion-copy p {
		margin: 0;
	}

	.companion-kicker {
		color: var(--mp-lila);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.companion-copy h2 {
		color: var(--mp-text);
		font-size: clamp(1.08rem, 1.5vw, 1.34rem);
		line-height: 1.25;
	}

	.companion-copy p {
		max-width: 34rem;
		color: var(--mp-text-dim);
		font-size: 0.92rem;
		line-height: 1.58;
	}

	.companion-copy .companion-note {
		color: color-mix(in srgb, var(--mp-text) 80%, var(--mp-text-dim) 20%);
	}

	.companion-actions {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		flex-wrap: wrap;
		margin-top: 0.25rem;
	}

	.place-link {
		border-radius: 999px;
		display: inline-flex;
		padding: 0.68rem 1rem;
		background: rgba(255, 255, 255, 0.06);
		color: var(--mp-text);
		border: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
		font-size: 0.92rem;
		text-decoration: none;
		white-space: nowrap;
		transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
	}

	.place-link:hover {
		background: rgba(255, 255, 255, 0.095);
		border-color: rgba(255, 255, 255, 0.18);
		transform: translateY(-1px);
	}

	.place-link:focus-visible {
		outline: 2px solid rgba(238, 211, 157, 0.62);
		outline-offset: 3px;
	}

	.companion-scene {
		position: relative;
		min-height: 14.5rem;
		border-radius: 16px;
		overflow: hidden;
		background: #0c1627;
		/* Behåller bara en diskret kantlinje – ingen mörk botten-fade över björnen */
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.07);
	}

	.companion-scene svg {
		width: 100%;
		height: 100%;
		min-height: 14.5rem;
		display: block;
	}

	.day-state-image {
		display: block;
		width: 100%;
		height: 100%;
		min-height: 14.5rem;
		object-fit: cover;
		object-position: left center;
	}

	.passing-butterfly {
		position: absolute;
		left: 34%;
		top: 43%;
		z-index: 2;
		width: clamp(1.45rem, 3vw, 2.35rem);
		height: auto;
		pointer-events: none;
		opacity: 0;
		transform: translate3d(0, 0, 0);
		filter: drop-shadow(0 0.1rem 0.12rem rgba(35, 24, 12, 0.18));
		image-rendering: auto;
		animation: butterfly-pass 18s ease-in-out 2s infinite;
	}

	.camera-plane {
		transform-box: fill-box;
		transform-origin: 43% 65%;
		transform: translateX(18px) translateY(0) scale(1.035);
	}

	.stars circle {
		fill: #f5f0db;
		animation: star-breathe 8s ease-in-out infinite;
	}

	.moon {
		opacity: 0.9;
	}

	.back-mountain {
		fill: rgba(22, 38, 63, 0.9);
	}

	.front-mountain {
		fill: rgba(13, 28, 48, 0.88);
	}

	.tree-trunk {
		fill: #1e1714;
	}

	.tree-trunk-dark,
	.branch {
		fill: none;
		stroke: #120e0c;
		stroke-width: 12;
		stroke-linecap: round;
	}

	.tree-trunk-dark {
		stroke-width: 5;
		opacity: 0.65;
	}

	.branch-b,
	.branch-c {
		stroke-width: 8;
	}

	.canopy {
		fill: rgba(4, 13, 20, 0.93);
		animation: canopy-drift 15s ease-in-out infinite;
		transform-origin: 120px 74px;
	}

	.leaves {
		fill: rgba(99, 128, 92, 0.52);
		animation: leaf-listen 12s ease-in-out infinite;
	}

	.shoreline {
		fill: rgba(10, 20, 32, 0.96);
	}

	.lake {
		fill: url(#lakeGlow);
		opacity: 0.94;
	}

	.moon-reflection {
		fill: rgba(229, 228, 211, 0.09);
		filter: url(#softBlur);
		animation: water-breathe 11s ease-in-out infinite;
	}

	.far-shore {
		fill: none;
		stroke: rgba(212, 220, 225, 0.12);
		stroke-width: 2;
	}

	.mist path {
		fill: none;
		stroke: rgba(224, 230, 229, 0.14);
		stroke-width: 10;
		stroke-linecap: round;
		filter: url(#softBlur);
		animation: mist-drift 18s ease-in-out infinite;
	}

	.resting-companion {
		opacity: 0.18;
		transform-box: fill-box;
		transform-origin: center bottom;
		animation: companion-presence 8s ease 1s both;
	}

	.photo-resting-companion {
		opacity: 0;
		pointer-events: none;
		transform-box: fill-box;
		transform-origin: 28% 88%;
		filter:
			drop-shadow(0 18px 22px rgba(1, 6, 10, 0.34)) saturate(0.9) contrast(1.08)
			brightness(0.86);
		animation: photo-companion-arrive 1.1s ease-out both;
	}

	.photo-resting-image {
		opacity: 0.9;
		transform-box: fill-box;
		transform-origin: 31% 86%;
		animation: photo-companion-breathe 22s ease-in-out 1.3s infinite;
	}

	.companion-shadow {
		fill: rgba(0, 0, 0, 0.28);
	}

	.ear,
	.body,
	.head {
		fill: var(--companion-body);
	}

	.head {
		fill: var(--companion-face);
	}

	.left-ear {
		transform-box: fill-box;
		transform-origin: 70% 75%;
		animation: ear-listen 16s ease-in-out infinite;
	}

	.right-ear {
		fill: var(--companion-body-dark);
	}

	.belly {
		fill: var(--companion-belly);
		opacity: 0.82;
	}

	.breathing-body {
		transform-box: fill-box;
		transform-origin: center bottom;
		animation: companion-breathe 13s ease-in-out infinite;
	}

	.sleep-eye,
	.mouth,
	.arm {
		fill: none;
		stroke: var(--companion-line);
		stroke-width: 3;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.arm {
		stroke: var(--companion-body-dark);
		stroke-width: 8;
		opacity: 0.64;
	}

	.fireflies circle {
		fill: #efd17a;
		filter: url(#softBlur);
		animation: firefly-drift 10s ease-in-out infinite;
	}

	.fireflies circle:nth-child(2) {
		animation-delay: -3s;
	}

	.fireflies circle:nth-child(3) {
		animation-delay: -6s;
	}

	.fireflies circle:nth-child(4) {
		animation-delay: -8s;
	}

	.foreground path:first-child {
		fill: url(#quietGlow);
		opacity: 0.76;
	}

	.grass {
		fill: none;
		stroke: rgba(176, 166, 103, 0.28);
		stroke-width: 2;
		stroke-linecap: round;
	}

	@keyframes companion-breathe {
		0%,
		100% {
			transform: translateY(0) scaleY(1);
		}
		50% {
			transform: translateY(1px) scaleY(1.018);
		}
	}

	@keyframes photo-companion-arrive {
		from {
			opacity: 0;
			transform: translate3d(-8px, 8px, 0) scale(0.985);
		}
		to {
			opacity: 1;
			transform: translate3d(0, 0, 0) scale(1);
		}
	}

	@keyframes photo-companion-breathe {
		0%,
		100% {
			transform: translate3d(0, 0, 0) scale(1);
		}
		46% {
			transform: translate3d(0.5px, -0.7px, 0) scale(1.004);
		}
		64% {
			transform: translate3d(0.1px, -0.3px, 0) scale(1.002);
		}
	}

	@keyframes ear-listen {
		0%,
		82%,
		100% {
			transform: rotate(0deg);
		}
		85% {
			transform: rotate(-6deg);
		}
		88% {
			transform: rotate(2deg);
		}
	}

	@keyframes firefly-drift {
		0%,
		100% {
			opacity: 0.12;
			transform: translate(0, 0);
		}
		45% {
			opacity: 0.85;
			transform: translate(10px, -8px);
		}
		70% {
			opacity: 0.42;
			transform: translate(-6px, -16px);
		}
	}

	@keyframes mist-drift {
		0%,
		100% {
			transform: translateX(0);
			opacity: 0.75;
		}
		50% {
			transform: translateX(18px);
			opacity: 0.48;
		}
	}

	@keyframes canopy-drift {
		0%,
		100% {
			transform: translateX(0) rotate(0deg);
		}
		50% {
			transform: translateX(2px) rotate(0.6deg);
		}
	}

	@keyframes leaf-listen {
		0%,
		100% {
			transform: translateY(0);
			opacity: 0.48;
		}
		50% {
			transform: translateY(2px);
			opacity: 0.66;
		}
	}

	@keyframes water-breathe {
		0%,
		100% {
			opacity: 0.075;
			transform: scaleX(0.96);
		}
		50% {
			opacity: 0.14;
			transform: scaleX(1.04);
		}
	}

	@keyframes star-breathe {
		0%,
		100% {
			opacity: 0.45;
		}
		52% {
			opacity: 0.95;
		}
	}

	@keyframes companion-presence {
		from {
			opacity: 0.055;
		}
		to {
			opacity: 0.18;
		}
	}

	@keyframes butterfly-pass {
		0%,
		18%,
		100% {
			opacity: 0;
			transform: translate3d(0, 0, 0) scale(0.84) rotate(-4deg);
		}
		24% {
			opacity: 0.92;
		}
		46% {
			opacity: 0.98;
			transform: translate3d(3.2rem, -0.9rem, 0) scale(0.96) rotate(5deg);
		}
		72% {
			opacity: 0.78;
			transform: translate3d(6.8rem, 0.25rem, 0) scale(0.88) rotate(-2deg);
		}
		86% {
			opacity: 0;
			transform: translate3d(8.4rem, -0.45rem, 0) scale(0.8) rotate(4deg);
		}
	}

	@media (max-width: 900px) {
		.silent-companion {
			grid-template-columns: 1fr;
			min-height: auto;
		}

		.companion-copy {
			padding: 0.2rem 0.15rem 0;
		}

		.companion-scene,
		.companion-scene svg,
		.day-state-image {
			min-height: 17rem;
		}
	}

	@media (max-width: 560px) {
		.silent-companion {
			padding: 0.85rem;
		}

		.companion-scene,
		.companion-scene svg,
		.day-state-image {
			min-height: 14rem;
		}

		.place-link {
			white-space: normal;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.place-link {
			transition: none;
		}

		.canopy,
		.leaves,
		.mist path,
		.fireflies circle,
		.photo-resting-companion,
		.photo-resting-image,
		.breathing-body,
		.left-ear,
		.moon-reflection,
		.stars circle,
		.resting-companion,
		.passing-butterfly {
			animation: none;
		}

		.passing-butterfly {
			display: none;
		}

		.photo-resting-companion {
			opacity: 1;
			transform: none;
		}

		.photo-resting-image {
			transform: none;
		}
	}
</style>
