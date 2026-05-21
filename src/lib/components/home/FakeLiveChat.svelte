<script lang="ts">
	import { onMount } from 'svelte';

	const userText = 'Jag vet inte riktigt varför jag känner så här...';
	const answerText =
		'Det är okej. Du behöver inte förklara allt perfekt. Vi tar det i din takt.';
	const typeSpeed = 56;
	const answerDelay = 520;
	const resetDelay = 3800;
	const restartDelay = 420;

	let typedText = $state('');
	let answerVisible = $state(false);
	let isTyping = $state(false);
	let prefersReducedMotion = $state(false);
	let timers = $state<number[]>([]);

	function clearTimers() {
		timers.forEach((timer) => window.clearTimeout(timer));
		timers = [];
	}

	function queue(callback: () => void, delay: number) {
		const timer = window.setTimeout(callback, delay);
		timers.push(timer);
	}

	function showStaticExample() {
		clearTimers();
		typedText = userText;
		answerVisible = true;
		isTyping = false;
	}

	function startLoop() {
		if (prefersReducedMotion) {
			showStaticExample();
			return;
		}

		clearTimers();
		typedText = '';
		answerVisible = false;
		isTyping = true;
		typeNextCharacter(0);
	}

	function typeNextCharacter(index: number) {
		if (prefersReducedMotion) {
			showStaticExample();
			return;
		}

		typedText = userText.slice(0, index);

		if (index >= userText.length) {
			isTyping = false;
			queue(() => {
				answerVisible = true;
				queue(() => {
					answerVisible = false;
					queue(startLoop, restartDelay);
				}, resetDelay);
			}, answerDelay);
			return;
		}

		queue(() => typeNextCharacter(index + 1), typeSpeed);
	}

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

		function handleMotionPreference() {
			prefersReducedMotion = mediaQuery.matches;
			if (prefersReducedMotion) {
				showStaticExample();
			} else {
				startLoop();
			}
		}

		handleMotionPreference();
		mediaQuery.addEventListener('change', handleMotionPreference);

		return () => {
			clearTimers();
			mediaQuery.removeEventListener('change', handleMotionPreference);
		};
	});
</script>

<aside class="fake-live-chat" aria-label="Exempel på hur det kan kännas att skriva i MittPsyke">
	<p class="sr-only">Exempel: {userText} Svar: {answerText}</p>

	<div class="chat-surface" aria-hidden="true">
		<div class="chat-header">
			<span class="status-dot"></span>
			<span>Exempel i chatten</span>
		</div>

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
</aside>

<style>
	.fake-live-chat {
		width: min(100%, 23rem);
		margin: clamp(1.35rem, 4vw, 2rem) auto 0;
	}

	.chat-surface {
		min-height: 16.25rem;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: var(--radius-card);
		background:
			radial-gradient(circle at 18% 12%, rgba(147, 197, 253, 0.18), transparent 34%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(7, 12, 21, 0.94));
		box-shadow: 0 18px 46px rgba(2, 6, 23, 0.28);
		backdrop-filter: blur(10px);
	}

	.chat-header {
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
		letter-spacing: 0;
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

	@media (max-width: 420px) {
		.chat-surface {
			min-height: 15.5rem;
		}

		.chat-log {
			padding: 0.82rem;
		}

		.bubble {
			max-width: 92%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.bubble-answer {
			transition: none;
			transform: none;
		}

		.cursor {
			animation: none;
		}
	}
</style>
