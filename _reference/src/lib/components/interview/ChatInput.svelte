<script lang="ts">
	import { chatStore } from '$lib/stores/chat.svelte';
	import { LIMITS } from '$lib/validation/limits';

	interface Props {
		onSend: (message: string) => void;
		onExitChat: () => void | Promise<void>;
	}

	let { onSend, onExitChat }: Props = $props();

	let text = $state('');
	let textarea: HTMLTextAreaElement | undefined = $state();

	let charCount = $derived(text.length);
	let isOverLimit = $derived(charCount > LIMITS.CHAT_MESSAGE);
	let showCharCount = $derived(charCount > LIMITS.CHAT_MESSAGE * 0.8);
	let canSend = $derived(text.trim().length > 0 && !isOverLimit && !chatStore.isStreaming && !chatStore.isAtLimit);
	let canFinish = $derived(chatStore.hasMessages && !chatStore.isStreaming);
	let canExit = $derived(!chatStore.isStreaming);

	function resizeTextarea() {
		if (!textarea) return;
		textarea.style.height = 'auto';
		// Cap at ~4 lines (approx 6rem)
		textarea.style.height = Math.min(textarea.scrollHeight, 96) + 'px';
	}

	function handleInput() {
		resizeTextarea();
	}

	function send() {
		const trimmed = text.trim();
		if (!trimmed || isOverLimit || chatStore.isStreaming || chatStore.isAtLimit) return;
		onSend(trimmed);
		text = '';
		if (textarea) {
			textarea.style.height = 'auto';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	function handleFinish() {
		chatStore.finishInterview();
	}

	function handleExitChat() {
		if (!canExit) return;
		onExitChat();
	}
</script>

<div class="chat-input-wrapper">
	<div class="input-row">
		<textarea
			bind:this={textarea}
			bind:value={text}
			oninput={handleInput}
			onkeydown={handleKeydown}
			placeholder={chatStore.isAtLimit ? 'Samtalet har nått maxgränsen' : 'Skriv ett meddelande...'}
			rows="1"
			autofocus
			disabled={chatStore.isStreaming || chatStore.isAtLimit}
			maxlength={LIMITS.CHAT_MESSAGE + 50}
		></textarea>
		<button
			class="send-btn"
			onclick={send}
			disabled={!canSend}
			aria-label="Skicka meddelande"
		>
			<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
				<path
					d="M3.75 9h10.5m0 0L9.75 4.5M14.25 9l-4.5 4.5"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	</div>

	{#if showCharCount}
		<span class="char-count" class:char-over={isOverLimit}>
			{charCount}/{LIMITS.CHAT_MESSAGE}
		</span>
	{/if}

	{#if chatStore.isAtLimit}
		<p class="cap-hint cap-reached">Samtalet har nått maxgränsen. Tryck på knappen nedan för att skapa din dagbok.</p>
	{:else if chatStore.isNearLimit}
		<p class="cap-hint">Samtalet börjar närma sig slutet. Runda gärna av snart!</p>
	{/if}

	{#if chatStore.phase === 'chatting'}
		<div class="chat-actions">
			<button
				class="done-btn"
				class:done-btn-pulse={chatStore.isAtLimit}
				onclick={handleFinish}
				disabled={!canFinish}
			>
				Jag är klar — skapa dagbok
			</button>
			<button
				class="exit-chat-btn"
				onclick={handleExitChat}
				disabled={!canExit}
				aria-label="Avsluta chatten och börja om"
			>
				Avsluta chatten
			</button>
		</div>
	{/if}
</div>

<style>
	.chat-input-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.input-row {
		display: flex;
		align-items: stretch;
		gap: 0.25rem;
	}

	textarea {
		flex: 1;
		resize: none;
		padding: 0.75rem 0.875rem;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-elevated);
		color: var(--color-text);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-normal);
		overflow-y: auto;
		max-height: 80px;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	textarea::placeholder {
		color: var(--color-text-muted);
	}

	textarea:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px rgba(244, 63, 122, 0.1);
	}

	textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.send-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: auto;
		min-height: 0;
		align-self: stretch;
		flex-shrink: 0;
		border: none;
		border-radius: var(--radius-md);
		background: var(--color-accent);
		color: white;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			opacity 0.2s ease,
			transform 0.15s ease,
			box-shadow 0.2s ease;
	}

	.send-btn:hover:not(:disabled) {
		background: var(--color-accent-hover);
		box-shadow: 0 4px 12px rgba(244, 63, 122, 0.3);
	}

	.send-btn:active:not(:disabled) {
		transform: scale(0.95);
	}

	.send-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.char-count {
		font-family: var(--font-primary);
		font-size: var(--text-xxs, 0.625rem);
		color: var(--color-text-muted);
		text-align: right;
		margin-top: -0.25rem;
	}

	.char-over {
		color: var(--color-error);
		font-weight: var(--weight-medium);
	}

	.done-btn {
		width: 100%;
		padding: 1rem 1.25rem;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-elevated);
		color: var(--color-text);
		font-family: var(--font-primary);
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wider);
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease,
			transform 0.15s ease,
			box-shadow 0.2s ease;
	}

	.chat-actions {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.exit-chat-btn {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--color-text-muted);
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
	}

	.exit-chat-btn:hover:not(:disabled) {
		background: var(--color-neutral);
		color: var(--color-text);
		border-color: var(--color-text-muted);
	}

	.exit-chat-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.done-btn:hover:not(:disabled) {
		background: var(--color-accent);
		color: white;
		border-color: var(--color-accent);
		box-shadow: 0 4px 12px rgba(244, 63, 122, 0.2);
	}

	.done-btn:active:not(:disabled) {
		transform: scale(0.98);
	}

	.done-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.done-btn-pulse {
		background: var(--color-accent);
		color: white;
		border-color: var(--color-accent);
		animation: pulse 2s ease-in-out infinite;
	}

	.done-btn-pulse:hover:not(:disabled) {
		background: var(--color-accent-hover);
		border-color: var(--color-accent-hover);
	}

	@keyframes pulse {
		0%, 100% { box-shadow: 0 0 0 0 rgba(244, 63, 122, 0.4); }
		50% { box-shadow: 0 0 0 6px rgba(244, 63, 122, 0); }
	}

	.cap-hint {
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		text-align: center;
		margin: 0;
		line-height: var(--leading-relaxed);
	}

	.cap-reached {
		color: var(--color-accent);
		font-weight: var(--weight-medium);
	}
</style>
