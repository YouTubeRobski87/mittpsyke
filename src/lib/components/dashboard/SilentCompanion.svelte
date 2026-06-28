<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getProgressCompanionAnimal,
		getProgressCompanionArtId,
		getProgressCompanionDayState,
		getProgressCompanionDayStateLabel,
		type ProgressCompanionDayState,
		type ProgressCompanionSelection
	} from '$lib/progressCompanion';

	let {
		progressCompanion = null
	}: {
		progressCompanion?: ProgressCompanionSelection | string | null;
	} = $props();

	let dayState = $state<ProgressCompanionDayState>(getProgressCompanionDayState());
	const companion = $derived(getProgressCompanionAnimal(progressCompanion));
	const companionName = $derived(companion?.name ?? 'Din följeslagare');
	const companionArtId = $derived(getProgressCompanionArtId(companion?.id));
	const dayStateLabel = $derived(getProgressCompanionDayStateLabel(dayState));
	const stateText = $derived.by(() => {
		if (dayState === 'morning') return 'Den vaknar mjukt med dagen.';
		if (dayState === 'evening') return 'Den rör sig långsammare när kvällen landar.';
		if (dayState === 'night') return 'Den vilar här medan natten är stilla.';
		return 'Den håller platsen lugnt under dagen.';
	});
	const gardenLinkText = $derived(dayState === 'night' ? 'Se platsen den vilar i' : 'Se platsen den bor i');

	onMount(() => {
		dayState = getProgressCompanionDayState();
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
		<a href="/framsteg#growth-garden">{gardenLinkText}</a>
	</div>

	<div class="companion-scene" aria-hidden="true">
		<svg viewBox="0 0 220 176" focusable="false">
			<defs>
				<radialGradient id="companionGlow" cx="50%" cy="36%" r="62%">
					<stop offset="0%" stop-color="var(--companion-glow)" />
					<stop offset="100%" stop-color="transparent" />
				</radialGradient>
			</defs>
			<rect class="scene-bg" x="0" y="0" width="220" height="176" rx="18" />
			<circle class="time-mark" cx="172" cy="42" r="14" />
			<path class="night-arc" d="M169 29 C160 35 159 50 170 58 C160 59 151 51 151 41 C151 31 160 25 169 29 Z" />
			<ellipse class="ground" cx="110" cy="139" rx="74" ry="16" />
			<ellipse class="glow" cx="110" cy="86" rx="78" ry="66" fill="url(#companionGlow)" />

			<g class="companion-figure">
				<ellipse class="shadow" cx="110" cy="137" rx="42" ry="8" />
				{#if companionArtId === 'rabbit'}
					<path class="ear" d="M94 75 C86 50 89 29 100 24 C109 44 106 63 100 78 Z" />
					<path class="ear" d="M119 76 C121 51 132 34 143 32 C145 56 134 70 126 80 Z" />
				{:else if companionArtId === 'fox' || companionArtId === 'dino' || companionArtId === 'squirrel'}
					<path class="ear" d="M88 84 L97 60 L108 85 Z" />
					<path class="ear" d="M116 85 L132 62 L134 88 Z" />
				{:else}
					<circle class="ear" cx="91" cy="82" r="10" />
					<circle class="ear" cx="129" cy="82" r="10" />
				{/if}
				<ellipse class="body" cx="110" cy="112" rx="34" ry="32" />
				<ellipse class="belly" cx="110" cy="119" rx="18" ry="19" />
				<ellipse class="face" cx="110" cy="89" rx="28" ry="25" />
				<g class="open-eyes">
					<ellipse class="eye left-eye" cx="100" cy="88" rx="2.5" ry="3.2" />
					<ellipse class="eye right-eye" cx="120" cy="88" rx="2.5" ry="3.2" />
				</g>
				<g class="sleep-eyes">
					<path d="M95 88 C99 91 103 91 107 88" />
					<path d="M115 88 C119 91 123 91 127 88" />
				</g>
				<path class="mouth" d="M103 101 C107 104 113 104 117 101" />
			</g>
		</svg>
		<span class="companion-name">{companionName}</span>
	</div>
</article>

<style>
	.silent-companion {
		--companion-body: #9b735d;
		--companion-body-dark: #765443;
		--companion-belly: #d7baa0;
		--companion-face: #a67c64;
		--companion-line: rgba(42, 34, 30, 0.78);
		--companion-glow: rgba(238, 220, 174, 0.22);
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(12rem, 15rem);
		gap: 1.2rem;
		align-items: center;
		min-height: 13rem;
		padding: 1.35rem;
		border: 1px solid rgba(168, 130, 255, 0.16);
		border-radius: var(--mp-radius);
		background:
			radial-gradient(420px 180px at 100% 20%, rgba(238, 220, 174, 0.12), transparent 58%),
			linear-gradient(135deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02));
		backdrop-filter: blur(14px);
	}

	.silent-companion[data-state='morning'] {
		--companion-glow: rgba(248, 220, 177, 0.28);
		background:
			radial-gradient(420px 180px at 100% 16%, rgba(248, 220, 177, 0.14), transparent 58%),
			linear-gradient(135deg, rgba(110, 231, 168, 0.055), rgba(255, 255, 255, 0.025));
	}

	.silent-companion[data-state='evening'] {
		--companion-glow: rgba(188, 156, 210, 0.24);
		background:
			radial-gradient(420px 180px at 100% 18%, rgba(188, 156, 210, 0.14), transparent 58%),
			linear-gradient(135deg, rgba(168, 130, 255, 0.07), rgba(255, 255, 255, 0.02));
	}

	.silent-companion[data-state='night'] {
		--companion-glow: rgba(154, 174, 210, 0.18);
		background:
			radial-gradient(420px 180px at 100% 14%, rgba(154, 174, 210, 0.12), transparent 58%),
			linear-gradient(135deg, rgba(128, 145, 190, 0.055), rgba(255, 255, 255, 0.018));
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
		display: grid;
		gap: 0.55rem;
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
		font-size: 1.12rem;
		line-height: 1.3;
	}

	.companion-copy p {
		max-width: 40rem;
		color: var(--mp-text-dim);
		font-size: 0.92rem;
		line-height: 1.58;
	}

	.companion-copy .companion-note {
		color: color-mix(in srgb, var(--mp-text) 80%, var(--mp-text-dim) 20%);
	}

	.companion-copy a {
		justify-self: start;
		margin-top: 0.15rem;
		color: var(--mp-text);
		font-size: 0.86rem;
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.companion-scene {
		display: grid;
		gap: 0.45rem;
		justify-items: center;
	}

	.companion-scene svg {
		width: min(100%, 13.75rem);
		height: auto;
		display: block;
	}

	.scene-bg {
		fill: rgba(255, 255, 255, 0.035);
		stroke: rgba(255, 255, 255, 0.06);
	}

	.ground {
		fill: rgba(255, 255, 255, 0.06);
	}

	.glow {
		opacity: 0.9;
	}

	.time-mark {
		fill: rgba(238, 220, 174, 0.84);
	}

	.night-arc {
		fill: rgba(218, 228, 245, 0.84);
		opacity: 0;
	}

	.silent-companion[data-state='night'] .time-mark {
		opacity: 0;
	}

	.silent-companion[data-state='night'] .night-arc {
		opacity: 1;
	}

	.companion-figure {
		transform-box: fill-box;
		transform-origin: center bottom;
		animation: companion-breathe 7s ease-in-out infinite;
	}

	.silent-companion[data-state='evening'] .companion-figure {
		animation-duration: 11s;
	}

	.silent-companion[data-state='night'] .companion-figure {
		animation-duration: 12s;
	}

	.shadow {
		fill: rgba(0, 0, 0, 0.16);
	}

	.ear,
	.body {
		fill: var(--companion-body);
	}

	.belly {
		fill: var(--companion-belly);
	}

	.face {
		fill: var(--companion-face);
	}

	.eye {
		fill: var(--companion-line);
		transform-box: fill-box;
		transform-origin: center;
		animation: companion-blink 7.4s ease-in-out infinite;
	}

	.silent-companion[data-state='evening'] .eye {
		animation-duration: 11.5s;
	}

	.sleep-eyes {
		display: none;
	}

	.sleep-eyes path,
	.mouth {
		fill: none;
		stroke: var(--companion-line);
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2;
	}

	.silent-companion[data-state='night'] .open-eyes {
		display: none;
	}

	.silent-companion[data-state='night'] .sleep-eyes {
		display: block;
	}

	.companion-name {
		color: var(--mp-text-dim);
		font-size: 0.78rem;
	}

	@keyframes companion-breathe {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(2px);
		}
	}

	@keyframes companion-blink {
		0%,
		92%,
		100% {
			transform: scaleY(1);
		}
		95% {
			transform: scaleY(0.08);
		}
	}

	@media (max-width: 720px) {
		.silent-companion {
			grid-template-columns: 1fr;
			padding: 1.15rem;
		}

		.companion-scene {
			justify-items: start;
		}

		.companion-scene svg {
			width: min(100%, 12.5rem);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.companion-figure,
		.eye {
			animation: none;
		}
	}
</style>
