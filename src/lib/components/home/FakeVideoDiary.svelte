<script lang="ts">
	import { onMount } from 'svelte';

	const caption = 'Vissa dagar är det lättare att prata än att skriva.';

	type Phase = 'idle' | 'recording' | 'saved';

	let phase = $state<Phase>('idle');
	let seconds = $state(0);
	let isVisible = $state(false);
	let prefersReducedMotion = $state(false);
	let cardEl = $state<HTMLElement | null>(null);
	let timers: number[] = [];

	const TICK = 900; // ms per "inspelad" sekund
	const REC_SECONDS = 5; // räknar 0:00 → 0:05
	const SAVED_MS = 1700;
	const IDLE_MS = 900;

	function clearTimers() {
		timers.forEach((t) => window.clearTimeout(t));
		timers = [];
	}

	function queue(callback: () => void, delay: number) {
		timers.push(window.setTimeout(callback, delay));
	}

	// Statisk bild när användaren föredrar reducerad rörelse
	function showStatic() {
		clearTimers();
		phase = 'recording';
		seconds = 3;
	}

	function startLoop() {
		if (prefersReducedMotion) {
			showStatic();
			return;
		}
		clearTimers();
		phase = 'idle';
		seconds = 0;
		queue(beginRecording, IDLE_MS);
	}

	function beginRecording() {
		phase = 'recording';
		seconds = 0;
		tick();
	}

	function tick() {
		if (seconds >= REC_SECONDS) {
			phase = 'saved';
			queue(startLoop, SAVED_MS);
			return;
		}
		queue(() => {
			seconds += 1;
			tick();
		}, TICK);
	}

	function formatTime(value: number): string {
		return `0:${String(value).padStart(2, '0')}`;
	}

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = mediaQuery.matches;

		// Kortet glider in och demoloopen startar först när det syns
		let observer: IntersectionObserver | null = null;
		if (cardEl) {
			observer = new IntersectionObserver(
				(entries) => {
					if (entries.some((entry) => entry.isIntersecting)) {
						isVisible = true;
						startLoop();
						observer?.disconnect();
					}
				},
				{ threshold: 0.3 }
			);
			observer.observe(cardEl);
		} else {
			isVisible = true;
			startLoop();
		}

		function handleMotionPreference() {
			prefersReducedMotion = mediaQuery.matches;
			startLoop();
		}
		mediaQuery.addEventListener('change', handleMotionPreference);

		return () => {
			clearTimers();
			observer?.disconnect();
			mediaQuery.removeEventListener('change', handleMotionPreference);
		};
	});
</script>

<aside
	class="fake-video"
	class:is-visible={isVisible}
	bind:this={cardEl}
	aria-label="Exempel på hur det kan vara att spela in en video i dagboken"
>
	<p class="sr-only">Exempel: spela in en kort video i dagboken. {caption}</p>

	<div class="video-surface" aria-hidden="true">
		<div class="video-header">
			<span class="status-dot"></span>
			<span>Exempel: videodagbok</span>
		</div>

		<div class="viewport" class:recording={phase === 'recording'}>
			<div class="silhouette"></div>

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
				{#if phase === 'idle'}Tryck för att spela in{:else if phase === 'recording'}Spelar in…{:else}Sparat i din dagbok{/if}
			</span>
		</div>
	</div>
</aside>

<style>
	.fake-video {
		width: min(100%, 23rem);
		margin: clamp(1.35rem, 4vw, 2rem) auto 0;
		opacity: 0;
		transform: translateX(-2.5rem);
		transition: opacity 620ms ease, transform 620ms ease;
	}

	.fake-video.is-visible {
		opacity: 1;
		transform: translateX(0);
	}

	.video-surface {
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: var(--radius-card);
		background:
			radial-gradient(circle at 18% 12%, rgba(147, 197, 253, 0.18), transparent 34%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(7, 12, 21, 0.94));
		box-shadow: 0 18px 46px rgba(2, 6, 23, 0.28);
		backdrop-filter: blur(10px);
	}

	.video-header {
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

	.viewport {
		position: relative;
		height: 10.5rem;
		margin: 1rem 1rem 0;
		border-radius: 14px;
		overflow: hidden;
		background:
			radial-gradient(circle at 50% 120%, rgba(58, 123, 213, 0.22), transparent 60%),
			linear-gradient(180deg, rgba(30, 41, 59, 0.9), rgba(10, 16, 28, 0.96));
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	/* Mjuk, abstrakt siluett (huvud + axlar) — ingen riktig person */
	.silhouette {
		position: absolute;
		left: 50%;
		bottom: -2.6rem;
		width: 7.5rem;
		height: 9rem;
		transform: translateX(-50%);
		background:
			radial-gradient(circle at 50% 22%, rgba(226, 232, 240, 0.32) 0 18%, transparent 19%),
			radial-gradient(ellipse 60% 55% at 50% 100%, rgba(226, 232, 240, 0.26) 0 60%, transparent 62%);
		filter: blur(1px);
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
		padding: 0.85rem 1rem 1.05rem;
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
		.viewport {
			height: 9.5rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.fake-video {
			transition: none;
			transform: none;
			opacity: 1;
		}

		.silhouette,
		.rec-dot,
		.saved-badge {
			animation: none;
		}

		.rec-btn {
			transition: none;
		}
	}
</style>
