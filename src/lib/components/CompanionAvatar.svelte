<script lang="ts">
	import {
		getCompanionPortraitSrc,
		getProgressCompanionAnimal,
		getProgressCompanionArtId,
		type ProgressCompanionSelection
	} from '$lib/progressCompanion';

	type CompanionAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

	let {
		selection = null,
		size = 'md',
		label = null,
		decorative = false,
		animated = true,
		class: className = ''
	}: {
		selection?: ProgressCompanionSelection | string | null;
		size?: CompanionAvatarSize;
		label?: string | null;
		decorative?: boolean;
		animated?: boolean;
		class?: string;
	} = $props();

	const companion = $derived(getProgressCompanionAnimal(selection));
	const artId = $derived(getProgressCompanionArtId(companion?.id));
	const resolvedLabel = $derived(label ?? `${companion?.name ?? 'Din följeslagare'} är din följeslagare`);

	// Följeslagare med frilagt porträttfoto visas som foto, övriga som den
	// inbyggda SVG-figuren. Uppslaget ligger i progressCompanion så väljaren,
	// profilkortet och Översikt aldrig kan visa olika bild för samma val.
	const portraitSrc = $derived(getCompanionPortraitSrc(artId));

	// Om filen saknas eller inte kan laddas faller porträttet tillbaka på
	// SVG-figuren i stället för att lämna en trasig bildruta. Nollställs när
	// följeslagaren byts, annars skulle ett misslyckat foto blockera nästa.
	let failedPortrait = $state<string | null>(null);
	const showPortrait = $derived(Boolean(portraitSrc) && failedPortrait !== portraitSrc);

	const classes = $derived(
		`companion-avatar companion-avatar-${size} ${showPortrait ? 'companion-avatar-portrait' : ''} ${animated ? 'companion-avatar-animated' : ''} ${className}`
			.replace(/\s+/g, ' ')
			.trim()
	);
</script>

<span
	class={classes}
	data-companion={artId}
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : resolvedLabel}
	aria-hidden={decorative ? 'true' : undefined}
>
	{#if showPortrait}
		<!-- alt="" - wrappern bär redan role="img" + aria-label, så bilden ska
			 inte annonseras en andra gång. -->
		<img
			class="companion-portrait-photo"
			src={portraitSrc}
			alt=""
			loading="lazy"
			decoding="async"
			onerror={() => (failedPortrait = portraitSrc)}
		/>
	{:else}
	<svg viewBox="0 0 96 96" focusable="false" aria-hidden="true">
		<circle class="avatar-sky" cx="48" cy="48" r="48" />
		<path class="avatar-ground" d="M8 74 C22 63 37 62 48 69 C61 77 77 72 88 62 L88 96 H8 Z" />

		<g class="companion-breath">
			{#if artId === 'fox'}
				<path class="tail" d="M31 63 C12 60 13 35 34 32 C31 45 36 56 50 61 C42 67 35 67 31 63 Z" />
				<path class="tail-tip" d="M21 42 C15 49 18 58 29 62 C27 52 25 47 21 42 Z" />
				<path class="ear" d="M31 38 L38 18 L47 40 Z" />
				<path class="ear" d="M52 40 L62 18 L66 43 Z" />
				<ellipse class="body" cx="50" cy="61" rx="24" ry="24" />
				<ellipse class="belly" cx="51" cy="67" rx="13" ry="14" />
				<ellipse class="face" cx="49" cy="42" rx="23" ry="21" />
				<path class="muzzle" d="M34 49 C40 42 58 42 64 49 C59 58 39 58 34 49 Z" />
			{:else if artId === 'wolf'}
				<path class="wolf-tail" d="M31 66 C13 64 12 43 29 35 C27 49 36 56 48 61 C43 68 36 70 31 66 Z" />
				<path class="ear wolf-ear" d="M30 39 L37 16 L47 40 Z" />
				<path class="ear wolf-ear" d="M51 40 L62 16 L67 43 Z" />
				<ellipse class="body" cx="50" cy="62" rx="25" ry="23" />
				<ellipse class="belly" cx="51" cy="68" rx="13" ry="13" />
				<ellipse class="face" cx="49" cy="43" rx="23" ry="20" />
				<path class="muzzle wolf-muzzle" d="M33 49 C39 43 59 43 66 50 C61 59 39 59 33 49 Z" />
			{:else if artId === 'owl'}
				<path class="ear" d="M29 36 L36 17 L48 35 Z" />
				<path class="ear" d="M49 35 L62 17 L67 37 Z" />
				<ellipse class="body" cx="48" cy="56" rx="27" ry="31" />
				<path class="wing" d="M25 54 C17 66 22 77 35 82" />
				<path class="wing" d="M71 54 C79 66 74 77 61 82" />
				<circle class="eye-ring" cx="39" cy="42" r="11" />
				<circle class="eye-ring" cx="57" cy="42" r="11" />
				<path class="beak" d="M48 47 L42 57 H54 Z" />
			{:else if artId === 'rabbit'}
				<path class="ear rabbit-ear" d="M36 37 C26 15 28 2 42 5 C49 20 47 31 41 42 Z" />
				<path class="ear rabbit-ear" d="M54 39 C57 16 66 6 77 12 C75 31 66 40 59 44 Z" />
				<ellipse class="body" cx="48" cy="63" rx="25" ry="23" />
				<ellipse class="belly" cx="48" cy="69" rx="13" ry="13" />
				<ellipse class="face" cx="48" cy="43" rx="22" ry="20" />
				<circle class="tail-dot" cx="27" cy="64" r="7" />
			{:else if artId === 'squirrel'}
				<path class="tail squirrel-tail" d="M32 68 C6 57 13 25 39 25 C31 38 36 50 54 55 C42 58 36 62 32 68 Z" />
				<path class="ear" d="M34 38 L40 20 L49 40 Z" />
				<path class="ear" d="M54 40 L63 22 L67 42 Z" />
				<ellipse class="body" cx="51" cy="62" rx="24" ry="24" />
				<ellipse class="belly" cx="52" cy="68" rx="13" ry="14" />
				<ellipse class="face" cx="50" cy="42" rx="22" ry="20" />
			{:else if artId === 'turtle'}
				<ellipse class="shell" cx="43" cy="61" rx="30" ry="23" />
				<path class="shell-line" d="M21 61 H65 M43 39 V82 M29 47 C38 54 50 54 58 47" />
				<circle class="face" cx="70" cy="55" r="14" />
				<path class="leg" d="M23 76 C17 82 10 81 8 75" />
				<path class="leg" d="M52 82 C59 88 68 86 70 78" />
			{:else if artId === 'dino'}
				<path class="tail" d="M29 65 C14 66 8 55 14 45 C22 53 31 57 41 58 Z" />
				<path class="spikes" d="M36 36 L41 25 L47 37 L53 25 L58 38 L64 29 L67 43" />
				<ellipse class="body" cx="47" cy="63" rx="27" ry="23" />
				<ellipse class="belly" cx="47" cy="69" rx="14" ry="13" />
				<ellipse class="face" cx="58" cy="43" rx="20" ry="18" />
			{:else}
				<circle class="ear-round" cx="32" cy="37" r="10" />
				<circle class="ear-round" cx="64" cy="37" r="10" />
				<ellipse class="body" cx="48" cy="62" rx="27" ry="25" />
				<ellipse class="belly" cx="48" cy="68" rx="15" ry="14" />
				<ellipse class="face" cx="48" cy="43" rx="24" ry="22" />
				<ellipse class="muzzle" cx="48" cy="52" rx="12" ry="8" />
			{/if}

			<g class="eyes">
				<ellipse class="eye blink" cx={artId === 'turtle' ? 73 : artId === 'dino' ? 52 : 40} cy={artId === 'turtle' ? 52 : artId === 'dino' ? 40 : 42} rx="2.1" ry="2.8" />
				<ellipse class="eye blink" cx={artId === 'turtle' ? 81 : artId === 'dino' ? 64 : 56} cy={artId === 'turtle' ? 52 : artId === 'dino' ? 40 : 42} rx="2.1" ry="2.8" />
			</g>

			{#if artId !== 'owl'}
				<path class="mouth" d={artId === 'turtle' ? 'M72 61 C75 64 80 64 83 61' : artId === 'dino' ? 'M55 49 C59 52 64 52 67 49' : 'M42 52 C45 55 51 55 54 52'} />
			{/if}
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
		   ALLA fotoporträtt, så räv, björn, schäfer och aussie hamnar på exakt
		   samma storlek. 2.75rem * 1.27 = 3.49rem, alltså samma yta som
		   hundarna hade i väljaren innan uppslaget flyttades hit. */
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

	.companion-avatar[data-companion='fox'] {
		--companion-sky-top: #fff1d5;
		--companion-sky-bottom: #d9ead0;
		--companion-ground: #9fc48e;
		--companion-body: #c87948;
		--companion-body-dark: #9c5838;
		--companion-belly: #f2d8bf;
		--companion-face: #d68a55;
	}

	.companion-avatar[data-companion='wolf'] {
		--companion-sky-top: #e8edf0;
		--companion-sky-bottom: #cbd9d4;
		--companion-ground: #8fae98;
		--companion-body: #7d8584;
		--companion-body-dark: #586362;
		--companion-belly: #e4ddd1;
		--companion-face: #99a09e;
	}

	.companion-avatar[data-companion='owl'] {
		--companion-sky-top: #ece8d9;
		--companion-sky-bottom: #cbdccf;
		--companion-ground: #93ad83;
		--companion-body: #8b745f;
		--companion-body-dark: #635040;
		--companion-belly: #d9c7aa;
		--companion-face: #9d856d;
	}

	.companion-avatar[data-companion='rabbit'] {
		--companion-sky-top: #f7efe8;
		--companion-sky-bottom: #dce8de;
		--companion-ground: #a9c59a;
		--companion-body: #c9b9ad;
		--companion-body-dark: #9d8b80;
		--companion-belly: #efe4d8;
		--companion-face: #d2c3b7;
	}

	.companion-avatar[data-companion='squirrel'] {
		--companion-sky-top: #f7e5cf;
		--companion-sky-bottom: #d7e7cd;
		--companion-ground: #9fbd82;
		--companion-body: #b8754e;
		--companion-body-dark: #895538;
		--companion-belly: #e9c7ac;
		--companion-face: #c7865c;
	}

	.companion-avatar[data-companion='turtle'],
	.companion-avatar[data-companion='dino'] {
		--companion-sky-top: #edf0d8;
		--companion-sky-bottom: #d6e7d3;
		--companion-ground: #93b684;
		--companion-body: #87986f;
		--companion-body-dark: #5f704f;
		--companion-belly: #cbd6b1;
		--companion-face: #91a075;
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
	.shell,
	.ear,
	.ear-round,
	.tail,
	.tail-dot,
	.face {
		fill: var(--companion-body);
	}

	.face {
		fill: var(--companion-face);
	}

	.belly,
	.muzzle,
	.eye-ring {
		fill: var(--companion-belly);
	}

	.tail,
	.wolf-tail,
	.squirrel-tail {
		fill: var(--companion-body-dark);
	}

	.tail-tip {
		fill: var(--companion-belly);
	}

	.wolf-ear { fill: var(--companion-body-dark); }
	.wolf-muzzle { fill: var(--companion-belly); }

	.rabbit-ear,
	.ear-round {
		opacity: 0.96;
	}

	.wing,
	.shell-line,
	.leg,
	.mouth {
		fill: none;
		stroke: var(--companion-line);
		stroke-width: 2.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.wing,
	.shell-line,
	.leg {
		opacity: 0.45;
	}

	.spikes {
		fill: none;
		stroke: var(--companion-body-dark);
		stroke-width: 4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.beak {
		fill: #cf9d45;
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
