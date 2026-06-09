<script lang="ts">
	import { onMount } from 'svelte';

	// ── Chatt-scenen ──
	const userText = 'Jag vet inte riktigt varför jag känner så här...';
	const answerText =
		'Det är okej. Du behöver inte förklara allt perfekt. Vi tar det i din takt.';
	// ── Video-scenen ──
	const caption = 'Inloggad: privat dagbok.';

	const typeSpeed = 56;
	const answerDelay = 520;
	const holdChat = 2600;
	const crossfade = 560;
	const TICK = 900; // ms per "inspelad" sekund
	const REC_SECONDS = 5; // räknar 0:00 → 0:05
	const idleMs = 800;
	const holdVideo = 1900;

	type Scene = 'chat' | 'video';
	type Phase = 'idle' | 'recording' | 'saved';

	let scene = $state<Scene>('chat');
	let typedText = $state('');
	let answerVisible = $state(false);
	let isTyping = $state(false);
	let phase = $state<Phase>('idle');
	let seconds = $state(0);
	let prefersReducedMotion = $state(false);

	let timers: number[] = [];
	let cancelled = false;

	// Slumpad, tydligt illustrerad avatar — ingen riktig kamera, inget riktigt ansikte.
	// Gör det uppenbart att rutan är ett exempel och inte filmar betraktaren.
	type Avatar = {
		skin: string;
		hair: string;
		shirt: string;
		longHair: boolean;
		glasses: boolean;
	};

	const avatarSkins = ['#f3cba6', '#e7b78e', '#cf9468', '#a76b44', '#f7d9bb'];
	const avatarHairs = ['#2f2a26', '#4b3526', '#6b4a2a', '#b9b3ad', '#d98427', '#222a36'];
	const avatarShirts = ['#3a7bd5', '#5bb3a0', '#9f7aea', '#ef8a72', '#6b8cce'];

	function randomFrom<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	function randomAvatar(): Avatar {
		return {
			skin: randomFrom(avatarSkins),
			hair: randomFrom(avatarHairs),
			shirt: randomFrom(avatarShirts),
			longHair: Math.random() < 0.5,
			glasses: Math.random() < 0.4
		};
	}

	// Fast startvärde (undviker SSR/klient-mismatch); slumpas i onMount/playVideo
	let avatar = $state<Avatar>({
		skin: '#f3cba6',
		hair: '#2f2a26',
		shirt: '#3a7bd5',
		longHair: false,
		glasses: false
	});

	function clearTimers() {
		timers.forEach((t) => window.clearTimeout(t));
		timers = [];
	}

	function sleep(ms: number): Promise<void> {
		return new Promise((resolve) => {
			timers.push(window.setTimeout(resolve, ms));
		});
	}

	function formatTime(value: number): string {
		return `0:${String(value).padStart(2, '0')}`;
	}

	async function playChat() {
		typedText = '';
		answerVisible = false;
		isTyping = true;

		if (prefersReducedMotion) {
			typedText = userText;
			isTyping = false;
			answerVisible = true;
			return;
		}

		for (let i = 0; i <= userText.length; i++) {
			if (cancelled) return;
			typedText = userText.slice(0, i);
			await sleep(typeSpeed);
		}
		isTyping = false;
		await sleep(answerDelay);
		if (cancelled) return;
		answerVisible = true;
	}

	async function playVideo() {
		avatar = randomAvatar();
		phase = 'idle';
		seconds = 0;

		if (prefersReducedMotion) {
			phase = 'recording';
			seconds = 3;
			await sleep(holdVideo);
			if (cancelled) return;
			phase = 'saved';
			return;
		}

		await sleep(idleMs);
		if (cancelled) return;
		phase = 'recording';
		seconds = 0;
		for (let s = 1; s <= REC_SECONDS; s++) {
			await sleep(TICK);
			if (cancelled) return;
			seconds = s;
		}
		phase = 'saved';
	}

	async function loop() {
		while (!cancelled) {
			scene = 'chat';
			await sleep(crossfade);
			if (cancelled) return;
			await playChat();
			await sleep(holdChat);
			if (cancelled) return;

			scene = 'video';
			await sleep(crossfade);
			if (cancelled) return;
			await playVideo();
			await sleep(holdVideo);
		}
	}

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = mediaQuery.matches;

		function handleMotionPreference() {
			prefersReducedMotion = mediaQuery.matches;
		}
		mediaQuery.addEventListener('change', handleMotionPreference);

		void loop();

		return () => {
			cancelled = true;
			clearTimers();
			mediaQuery.removeEventListener('change', handleMotionPreference);
		};
	});
</script>

<aside class="hero-showcase" aria-label="Exempel på hur det kan vara att använda MittPsyke">
	<p class="sr-only">
		Exempel i chatten: {userText} Svar: {answerText}. Exempel på videodagbok: spela in en kort
		stund och spara den privat i dagboken när du är inloggad. {caption}
	</p>

	<div class="surface" aria-hidden="true">
		<div class="surface-header">
			<span class="status-dot"></span>
			<span>{scene === 'chat' ? 'Exempel i chatten' : 'Exempel: videodagbok'}</span>
		</div>

		<div class="stage">
			<!-- Chatt-scen -->
			<div class="scene scene-chat" class:active={scene === 'chat'}>
				<div class="chat-log">
					<div class="bubble bubble-user">
						<span>{typedText}</span>
						{#if isTyping}
							<span class="cursor"></span>
						{/if}
					</div>
					<div class="bubble bubble-answer" class:visible={answerVisible}>
						{answerText}
					</div>
				</div>
			</div>

			<!-- Video-scen -->
			<div class="scene scene-video" class:active={scene === 'video'}>
				<div class="viewport" class:recording={phase === 'recording'}>
					<svg
						class="avatar"
						viewBox="0 0 100 100"
						xmlns="http://www.w3.org/2000/svg"
						role="img"
						aria-hidden="true"
					>
						<!-- axlar -->
						<path d="M16 100 C16 76 33 67 50 67 C67 67 84 76 84 100 Z" fill={avatar.shirt} />
						<!-- hals -->
						<rect x="44" y="50" width="12" height="16" rx="5" fill={avatar.skin} />
						<!-- huvud -->
						<circle cx="50" cy="40" r="17" fill={avatar.skin} />
						<!-- hår (cap) -->
						<path d="M32 40 C32 23 68 23 68 40 C68 30 60 25 50 25 C40 25 32 30 32 40 Z" fill={avatar.hair} />
						{#if avatar.longHair}
							<!-- längre hår som ramar in ansiktet -->
							<rect x="31" y="38" width="6" height="22" rx="3" fill={avatar.hair} />
							<rect x="63" y="38" width="6" height="22" rx="3" fill={avatar.hair} />
						{/if}
						<!-- ögon -->
						<circle cx="43.5" cy="40" r="1.7" fill="#1f2937" />
						<circle cx="56.5" cy="40" r="1.7" fill="#1f2937" />
						<!-- mun -->
						<path
							d="M44 46.5 Q50 51 56 46.5"
							stroke="#1f2937"
							stroke-width="1.5"
							fill="none"
							stroke-linecap="round"
						/>
						{#if avatar.glasses}
							<g fill="none" stroke="#1f2937" stroke-width="1.4">
								<circle cx="43.5" cy="40" r="4.6" />
								<circle cx="56.5" cy="40" r="4.6" />
								<line x1="48.1" y1="40" x2="51.9" y2="40" />
							</g>
						{/if}
					</svg>

					{#if phase === 'recording'}
						<div class="rec-badge"><span class="rec-dot"></span> REC</div>
						<div class="timer">{formatTime(seconds)}</div>
					{:else if phase === 'saved'}
						<div class="saved-badge">Sparad ✓</div>
					{/if}
				</div>

				<p class="video-caption">{caption}</p>

				<div class="controls">
					<span class="rec-btn" class:active={phase === 'recording'}></span>
					<span class="controls-label">
						{#if phase === 'idle'}Tryck för att spela in{:else if phase === 'recording'}Spelar in…{:else}Privat i din dagbok{/if}
					</span>
				</div>
			</div>
		</div>
	</div>
</aside>

<style>
	.hero-showcase {
		width: min(100%, 23rem);
		margin: clamp(1.35rem, 4vw, 2rem) auto 0;
	}

	.surface {
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: var(--radius-card);
		background:
			radial-gradient(circle at 18% 12%, rgba(147, 197, 253, 0.18), transparent 34%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(7, 12, 21, 0.94));
		box-shadow: 0 18px 46px rgba(2, 6, 23, 0.28);
		backdrop-filter: blur(10px);
	}

	.surface-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.82rem 0.95rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		color: rgba(238, 241, 246, 0.7);
		font-family: var(--font-heading);
		font-size: 0.78rem;
		font-weight: 650;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.status-dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		background: #8fd8c7;
		box-shadow: 0 0 0 0.28rem rgba(143, 216, 199, 0.13);
	}

	/* Scenerna ligger ovanpå varandra i samma ruta och korsfadar */
	.stage {
		position: relative;
		min-height: 17rem;
	}

	.scene {
		position: absolute;
		inset: 0;
		opacity: 0;
		transform: translateX(-1.2rem);
		transition: opacity 520ms ease, transform 520ms ease;
		pointer-events: none;
	}

	.scene.active {
		opacity: 1;
		transform: translateX(0);
	}

	/* ── Chatt ── */
	.chat-log {
		display: grid;
		gap: 0.8rem;
		padding: 1rem;
	}

	.bubble {
		max-width: 88%;
		min-height: 3.55rem;
		padding: 0.78rem 0.86rem;
		border-radius: 14px;
		font-size: clamp(0.9rem, 2.7vw, 0.98rem);
		line-height: 1.52;
	}

	.bubble-user {
		justify-self: end;
		border-top-right-radius: 6px;
		background: rgba(58, 123, 213, 0.9);
		color: #ffffff;
	}

	.bubble-answer {
		justify-self: start;
		border: 1px solid rgba(255, 255, 255, 0.11);
		border-top-left-radius: 6px;
		background: rgba(255, 255, 255, 0.08);
		color: rgba(245, 245, 242, 0.9);
		opacity: 0;
		transform: translateY(0.25rem);
		transition: opacity 520ms ease, transform 520ms ease;
	}

	.bubble-answer.visible {
		opacity: 1;
		transform: translateY(0);
	}

	.cursor {
		display: inline-block;
		width: 0.08em;
		height: 1.1em;
		margin-left: 0.08rem;
		vertical-align: -0.16em;
		background: currentColor;
		animation: blink 900ms steps(2, start) infinite;
	}

	/* ── Video ── */
	.viewport {
		position: relative;
		height: 10rem;
		margin: 1rem 1rem 0;
		border-radius: 14px;
		overflow: hidden;
		background:
			radial-gradient(circle at 50% 120%, rgba(58, 123, 213, 0.22), transparent 60%),
			linear-gradient(180deg, rgba(30, 41, 59, 0.9), rgba(10, 16, 28, 0.96));
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.avatar {
		position: absolute;
		left: 50%;
		bottom: 0;
		width: 8.4rem;
		height: 8.4rem;
		transform: translateX(-50%);
		transform-origin: 50% 100%;
		animation: breathe 5.5s ease-in-out infinite;
	}

	.rec-badge {
		position: absolute;
		top: 0.6rem;
		left: 0.65rem;
		display: inline-flex;
		align-items: center;
		gap: 0.32rem;
		padding: 0.2rem 0.45rem;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.42);
		color: #fee2e2;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.08em;
	}

	.rec-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
		background: #ef4444;
		box-shadow: 0 0 0 0.18rem rgba(239, 68, 68, 0.25);
		animation: pulse 1.1s ease-in-out infinite;
	}

	.timer {
		position: absolute;
		top: 0.6rem;
		right: 0.65rem;
		padding: 0.2rem 0.45rem;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.42);
		color: rgba(255, 255, 255, 0.92);
		font-size: 0.7rem;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.04em;
	}

	.saved-badge {
		position: absolute;
		inset: auto 0 0.85rem 0;
		margin: 0 auto;
		width: fit-content;
		padding: 0.32rem 0.7rem;
		border-radius: 999px;
		background: rgba(143, 216, 199, 0.16);
		border: 1px solid rgba(143, 216, 199, 0.4);
		color: #c9f2e7;
		font-size: 0.78rem;
		font-weight: 600;
		animation: fade-up 420ms ease;
	}

	.video-caption {
		margin: 0.85rem 1rem 0;
		color: rgba(245, 245, 242, 0.84);
		font-size: clamp(0.9rem, 2.7vw, 0.98rem);
		line-height: 1.5;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.8rem 1rem 1rem;
	}

	.rec-btn {
		width: 1.4rem;
		height: 1.4rem;
		border-radius: 999px;
		background: #ef4444;
		box-shadow: 0 0 0 0.22rem rgba(239, 68, 68, 0.22);
		flex: none;
		transition: border-radius 220ms ease, transform 220ms ease;
	}

	.rec-btn.active {
		border-radius: 5px;
		transform: scale(0.82);
	}

	.controls-label {
		color: rgba(238, 241, 246, 0.66);
		font-size: 0.84rem;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	@keyframes pulse {
		50% {
			opacity: 0.35;
		}
	}

	@keyframes breathe {
		50% {
			transform: translateX(-50%) translateY(-0.3rem) scale(1.02);
		}
	}

	@keyframes fade-up {
		from {
			opacity: 0;
			transform: translateY(0.4rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 420px) {
		.stage {
			min-height: 16.75rem;
		}

		.viewport {
			height: 9.5rem;
		}

		.chat-log {
			padding: 0.82rem;
		}

		.bubble {
			max-width: 92%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.scene {
			transition: opacity 200ms ease;
			transform: none;
		}

		.scene.active {
			transform: none;
		}

		.bubble-answer,
		.avatar,
		.rec-dot,
		.saved-badge,
		.cursor,
		.rec-btn {
			transition: none;
			animation: none;
		}
	}
</style>
