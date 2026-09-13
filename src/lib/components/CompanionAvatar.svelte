<script lang="ts">
	import { COMPANION, COMPANION_PORTRAIT_IMAGE } from '$lib/progressCompanion';

	type CompanionAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

	let {
		size = 'md',
		label = null,
		decorative = false,
		animated = true,
		class: className = ''
	}: {
		size?: CompanionAvatarSize;
		label?: string | null;
		decorative?: boolean;
		animated?: boolean;
		class?: string;
	} = $props();

	const resolvedLabel = $derived(label ?? `${COMPANION.name} är din följeslagare`);

	// Om porträttfotot inte kan laddas visas den inbyggda SVG-björnen i stället
	// för en trasig bildruta.
	let portraitFailed = $state(false);
	const showPortrait = $derived(!portraitFailed);

	const classes = $derived(
		`companion-avatar companion-avatar-${size} ${showPortrait ? 'companion-avatar-portrait' : ''} ${animated ? 'companion-avatar-animated' : ''} ${className}`
			.replace(/\s+/g, ' ')
			.trim()
	);
</script>

<span
	class={classes}
	data-companion={COMPANION.id}
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : resolvedLabel}
	aria-hidden={decorative ? 'true' : undefined}
>
	{#if showPortrait}
		<!-- alt="" - wrappern bär redan role="img" + aria-label, så bilden ska
			 inte annonseras en andra gång. -->
		<img
			class="companion-portrait-photo"
			src={COMPANION_PORTRAIT_IMAGE}
			alt=""
			loading="lazy"
			decoding="async"
			onerror={() => (portraitFailed = true)}
		/>
	{:else}
	<svg viewBox="0 0 96 96" focusable="false" aria-hidden="true">
		<circle class="avatar-sky" cx="48" cy="48" r="48" />
		<path class="avatar-ground" d="M8 74 C22 63 37 62 48 69 C61 77 77 72 88 62 L88 96 H8 Z" />

		<g class="companion-breath">
			<circle class="ear-round" cx="32" cy="37" r="10" />
			<circle class="ear-round" cx="64" cy="37" r="10" />
			<ellipse class="body" cx="48" cy="62" rx="27" ry="25" />
			<ellipse class="belly" cx="48" cy="68" rx="15" ry="14" />
			<ellipse class="face" cx="48" cy="43" rx="24" ry="22" />
			<ellipse class="muzzle" cx="48" cy="52" rx="12" ry="8" />

			<g class="eyes">
				<ellipse class="eye blink" cx="40" cy="42" rx="2.1" ry="2.8" />
				<ellipse class="eye blink" cx="56" cy="42" rx="2.1" ry="2.8" />
			</g>

			<path class="mouth" d="M42 52 C45 55 51 55 54 52" />
		</g>
	</svg>
	{/if}
</span>

<style>
	.companion-avatar {
		--companion-avatar-size: 2.15rem;
		--companion-sky-top: #f8efd7;
		--companion-sky-bottom: #dcead6;
		--companion-ground: #a7c894;
		--companion-body: #9b735d;
		--companion-body-dark: #765443;
		--companion-belly: #d7baa0;
		--companion-face: #a67c64;
		--companion-line: rgba(42, 34, 30, 0.8);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--companion-avatar-size);
		height: var(--companion-avatar-size);
		border-radius: 9999px;
		overflow: hidden;
		flex-shrink: 0;
		background: linear-gradient(180deg, var(--companion-sky-top), var(--companion-sky-bottom));
		box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.58);
		transition: transform 180ms ease, filter 180ms ease;
	}

	.companion-avatar-xs {
		--companion-avatar-size: 1.45rem;
	}

	.companion-avatar-sm {
		--companion-avatar-size: 1.85rem;
	}

	.companion-avatar-md {
		--companion-avatar-size: 2.15rem;
	}

	.companion-avatar-lg {
		--companion-avatar-size: 2.75rem;
	}

	.companion-avatar-xl {
		--companion-avatar-size: 3.25rem;
	}

	/* ── Fotoporträtt ──
	   Frilagda helkroppsfoton ligger fritt i stället för i den runda brickan.
	   En cirkel skulle antingen beskära huvudet (object-fit: cover) eller
	   krympa djuret till en prick mitt i tom yta (contain), och båda bryter
	   mot att porträtten ska vara lika stora och visa hela djuret. */
	.companion-avatar-portrait {
		/* Optisk kompensation: ett frilagt djur med transparent marginal ser
		   mindre ut än en fylld cirkel av samma mått. Faktorn är densamma för
		   fotoporträttet i alla storlekar. 2.75rem * 1.27 = 3.49rem. */
		width: calc(var(--companion-avatar-size) * 1.27);
		height: calc(var(--companion-avatar-size) * 1.27);
		border-radius: 0;
		background: none;
		box-shadow: none;
	}

	.companion-portrait-photo {
		width: 100%;
		height: 100%;
		/* contain visar hela djuret, bottenlinjen ger dem gemensam ståplats
		   så de inte svävar olika högt i sina rutor. */
		object-fit: contain;
		object-position: center bottom;
	}

	.companion-avatar:hover {
		transform: translateY(-1px) scale(1.025);
		filter: saturate(1.04) brightness(1.01);
	}


	svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	.avatar-sky {
		fill: transparent;
	}

	.avatar-ground {
		fill: var(--companion-ground);
		opacity: 0.82;
	}

	.companion-breath {
		transform-origin: 48px 58px;
	}

	.body,
	.ear-round,
	.face {
		fill: var(--companion-body);
	}

	.face {
		fill: var(--companion-face);
	}

	.belly,
	.muzzle {
		fill: var(--companion-belly);
	}


	.ear-round {
		opacity: 0.96;
	}

	.mouth {
		fill: none;
		stroke: var(--companion-line);
		stroke-width: 2.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}


	.eye {
		fill: #2f2a24;
		transform-origin: center;
	}

	.companion-avatar-animated .companion-breath {
		animation: companion-avatar-breathe 5.8s ease-in-out infinite;
	}

	.companion-avatar-animated .blink {
		animation: companion-avatar-blink 7.5s ease-in-out infinite;
	}

	.companion-avatar-animated .blink:nth-child(2) {
		animation-delay: 0.08s;
	}

	@keyframes companion-avatar-breathe {
		0%,
		100% {
			transform: translateY(0) scale(1);
		}
		50% {
			transform: translateY(0.65px) scale(1.012);
		}
	}

	@keyframes companion-avatar-blink {
		0%,
		92%,
		100% {
			transform: scaleY(1);
		}
		94%,
		96% {
			transform: scaleY(0.08);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.companion-avatar,
		.companion-avatar:hover,
		.companion-breath,
		.blink {
			animation: none !important;
			transition: none !important;
			transform: none !important;
		}
	}
</style>
