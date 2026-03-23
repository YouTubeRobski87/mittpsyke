<script lang="ts">
	import type { ChatMessage } from '$lib/stores/chat.svelte';
	import MessageBubble from './MessageBubble.svelte';

	interface Props {
		messages: ChatMessage[];
	}

	let { messages }: Props = $props();

	let container: HTMLDivElement | undefined = $state();
	let isNearBottom = $state(true);

	function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
		if (container) {
			container.scrollTo({ top: container.scrollHeight, behavior });
		}
	}

	function handleScroll() {
		if (!container) return;
		const threshold = 80;
		const { scrollTop, scrollHeight, clientHeight } = container;
		isNearBottom = scrollHeight - scrollTop - clientHeight < threshold;
	}

	// Auto-scroll when new messages arrive (only if already near bottom)
	$effect(() => {
		const _len = messages.length;
		if (isNearBottom) {
			// Use tick-like delay to let DOM update first
			requestAnimationFrame(() => scrollToBottom());
		}
	});

	// Scroll to bottom immediately on mount
	$effect(() => {
		if (container) {
			scrollToBottom('instant');
		}
	});
</script>

<div class="message-list" bind:this={container} onscroll={handleScroll}>
	<div class="message-list-inner">
		{#each messages as message (message.id)}
			<MessageBubble {message} />
		{/each}
	</div>

	{#if !isNearBottom}
		<button class="scroll-to-bottom" onclick={() => scrollToBottom()} aria-label="Scrolla till botten">
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
				<path d="M8 3v10m0 0l-4-4m4 4l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>
	{/if}
</div>

<style>
	.message-list {
		flex: 1;
		overflow-y: auto;
		position: relative;
	}

	.message-list-inner {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0;
		min-height: 100%;
		justify-content: flex-end;
	}

	.scroll-to-bottom {
		position: sticky;
		bottom: 0.5rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		color: var(--color-text-muted);
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}

	.scroll-to-bottom:hover {
		background: var(--color-neutral);
		color: var(--color-text);
	}
</style>
