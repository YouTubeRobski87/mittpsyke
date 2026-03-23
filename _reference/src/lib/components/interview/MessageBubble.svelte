<script lang="ts">
	import type { ChatMessage } from '$lib/stores/chat.svelte';

	interface Props {
		message: ChatMessage;
	}

	let { message }: Props = $props();

	let isUser = $derived(message.role === 'user');

	function formatRelativeTime(timestamp: number): string {
		const seconds = Math.floor((Date.now() - timestamp) / 1000);
		if (seconds < 60) return 'just nu';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes} min sedan`;
		const hours = Math.floor(minutes / 60);
		return `${hours} tim sedan`;
	}

	let relativeTime = $state('');

	$effect(() => {
		const ts = message.timestamp;
		relativeTime = formatRelativeTime(ts);
		const interval = setInterval(() => {
			relativeTime = formatRelativeTime(ts);
		}, 30_000);
		return () => clearInterval(interval);
	});
</script>

<div class="bubble-row" class:bubble-row-user={isUser}>
	<div class="bubble" class:bubble-user={isUser} class:bubble-assistant={!isUser}>
		<p class="bubble-text">{message.content}</p>
	</div>
	<span class="bubble-time" class:bubble-time-user={isUser}>{relativeTime}</span>
</div>

<style>
	.bubble-row {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		animation: bubbleIn 0.25s ease-out both;
	}

	.bubble-row-user {
		align-items: flex-end;
	}

	.bubble {
		max-width: 80%;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		word-break: break-word;
	}

	.bubble-user {
		background: var(--color-accent);
		color: white;
		border-bottom-right-radius: 4px;
	}

	.bubble-assistant {
		background: var(--color-bg-elevated);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-bottom-left-radius: 4px;
	}

	.bubble-text {
		margin: 0;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-relaxed);
		white-space: pre-wrap;
	}

	.bubble-time {
		font-family: var(--font-primary);
		font-size: var(--text-xxs, 0.625rem);
		font-weight: var(--weight-regular);
		color: var(--color-text-muted);
		margin-top: 0.25rem;
		opacity: 0.7;
	}

	.bubble-time-user {
		text-align: right;
	}

	@keyframes bubbleIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
