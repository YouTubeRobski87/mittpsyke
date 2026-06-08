<script lang="ts">
	import { dev } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';

	let {
		visible = false,
		title,
		text,
		onclose
	}: {
		visible?: boolean;
		title: string;
		text: string;
		onclose: () => void;
	} = $props();

	let dismissTimer: ReturnType<typeof setTimeout> | null = null;

	function clearDismissTimer() {
		if (!dismissTimer) return;
		clearTimeout(dismissTimer);
		dismissTimer = null;
	}

	$effect(() => {
		clearDismissTimer();
		if (visible) {
			dismissTimer = setTimeout(() => {
				onclose();
			}, 5200);
		}

		return clearDismissTimer;
	});

	onMount(() => {
		if (dev) console.debug('[milestone] toast mounted');
	});

	onDestroy(clearDismissTimer);
</script>

{#if visible}
	<div class="milestone-toast-wrap" aria-live="polite" aria-atomic="true">
		<section class="milestone-toast" role="status">
			<div class="milestone-mark" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none">
					<path d="M12 3.75v16.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
					<path d="M7.5 8.25c1.65-1.2 3.05-1.2 4.5 0s2.85 1.2 4.5 0v6c-1.65 1.2-3.05 1.2-4.5 0s-2.85-1.2-4.5 0v-6Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
				</svg>
			</div>
			<div class="milestone-copy">
				<p class="milestone-kicker">Milstolpe</p>
				<h2>{title}</h2>
				<p>{text}</p>
			</div>
			<button type="button" class="milestone-close" aria-label="Stäng milstolpe" onclick={onclose}>
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
				</svg>
			</button>
		</section>
	</div>
{/if}

<style>
	.milestone-toast-wrap {
		position: fixed;
		right: clamp(0.85rem, 3vw, 1.5rem);
		bottom: max(clamp(0.85rem, 3vw, 1.5rem), env(safe-area-inset-bottom));
		z-index: 9999;
		width: min(100% - 1.5rem, 360px);
		pointer-events: none;
	}

	.milestone-toast {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.85rem;
		align-items: start;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card, 18px);
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		box-shadow: 0 18px 44px rgba(15, 23, 42, 0.18);
		padding: 0.95rem;
		pointer-events: auto;
		animation: milestone-enter 180ms ease-out;
	}

	:global(.dark) .milestone-toast {
		background: rgba(18, 24, 38, 0.96);
		border-color: rgba(255, 255, 255, 0.14);
		box-shadow: 0 18px 44px rgba(0, 0, 0, 0.32);
	}

	.milestone-mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 999px;
		background: hsl(var(--surface-soft));
		color: var(--theme-accent, hsl(var(--primary)));
	}

	.milestone-mark svg,
	.milestone-close svg {
		width: 1rem;
		height: 1rem;
	}

	.milestone-copy {
		min-width: 0;
	}

	.milestone-kicker,
	.milestone-copy h2,
	.milestone-copy p {
		margin: 0;
	}

	.milestone-kicker {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.milestone-copy h2 {
		margin-top: 0.12rem;
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.25;
	}

	.milestone-copy p:not(.milestone-kicker) {
		margin-top: 0.22rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.9rem;
		line-height: 1.45;
	}

	.milestone-close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: 1px solid transparent;
		border-radius: 999px;
		background: transparent;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
	}

	.milestone-close:hover,
	.milestone-close:focus-visible {
		border-color: hsl(var(--border));
		color: hsl(var(--foreground));
		background: hsl(var(--surface-soft));
	}

	.milestone-close:focus-visible {
		outline: 2px solid var(--theme-accent, hsl(var(--primary)));
		outline-offset: 2px;
	}

	@keyframes milestone-enter {
		from {
			opacity: 0;
			transform: translateY(0.5rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 640px) {
		.milestone-toast-wrap {
			right: auto;
			left: 50%;
			bottom: max(0.75rem, env(safe-area-inset-bottom));
			transform: translateX(-50%);
			width: calc(100% - 1.5rem);
		}

		.milestone-toast {
			border-radius: var(--radius-input, 14px);
			padding: 0.85rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.milestone-toast {
			animation: none;
		}
	}
</style>
