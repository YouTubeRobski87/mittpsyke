<script lang="ts">
	import { chatStore } from '$lib/stores/chat.svelte';

	let showConfirm = $state(false);

	function handleNewConversation() {
		if (chatStore.hasMessages) {
			showConfirm = true;
		}
	}

	function confirmReset() {
		chatStore.reset();
		showConfirm = false;
	}

	function cancelReset() {
		showConfirm = false;
	}
</script>

<header class="interview-header">
	<h1 class="header-title">Intervjuläge</h1>

	{#if !chatStore.isEmpty}
		<button class="header-action" onclick={handleNewConversation}>
			Ny konversation
		</button>
	{/if}
</header>

{#if showConfirm}
	<div class="confirm-overlay" role="dialog" aria-modal="true">
		<div class="confirm-dialog">
			<p class="confirm-text">Vill du börja om? Ditt nuvarande samtal raderas.</p>
			<div class="confirm-actions">
				<button class="btn btn-secondary" onclick={cancelReset}>Avbryt</button>
				<button class="btn btn-primary" onclick={confirmReset}>Börja om</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.interview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		padding-top: calc(env(safe-area-inset-top, 0px) + 0.5rem);
		flex-shrink: 0;
		border-bottom: 1px solid var(--color-border);
	}

	.header-title {
		font-family: var(--font-primary);
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		color: var(--color-text);
		margin: 0;
	}

	.header-action {
		background: none;
		border: none;
		padding: 0;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-accent);
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	.header-action:hover {
		opacity: 0.8;
	}

	.confirm-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1.25rem;
	}

	.confirm-dialog {
		background: var(--color-bg-elevated);
		border-radius: var(--radius-md);
		padding: 1.5rem;
		max-width: 320px;
		width: 100%;
	}

	.confirm-text {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-relaxed);
		color: var(--color-text);
		margin: 0 0 1.25rem;
	}

	.confirm-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}
</style>
