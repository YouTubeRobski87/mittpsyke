<script lang="ts">
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import { FIELD_LIMITS } from '$lib/validation';

	const memoryLimit = FIELD_LIMITS.memoryFor10Years;
	const messageLimit = FIELD_LIMITS.messageToFutureSelf;

	let memoryRemaining = $derived(memoryLimit - (wizardStore.data.memoryFor10Years?.length || 0));
	let messageRemaining = $derived(messageLimit - (wizardStore.data.messageToFutureSelf?.length || 0));
</script>

<div class="step-content">
	<p class="step-intro">Vissa saker känns små just nu, men kan betyda allt om tio år. Skriv ner något du vill minnas – och kanske ett ord till den du kommer att vara.</p>
	<div class="field-group">
		<label class="field-label" for="memory">Vad vill du minnas från idag - om några år?</label>
		<div class="textarea-wrapper">
			<textarea
				id="memory"
				placeholder="Ett litet ögonblick som vid första anblick inte verkade vara så mycket för världen, men som verkligen var det..."
				bind:value={wizardStore.data.memoryFor10Years}
				rows="3"
				maxlength={memoryLimit}
			></textarea>
			{#if memoryRemaining <= 100}
				<span class="char-count" class:warning={memoryRemaining <= 50}>{memoryRemaining}</span>
			{/if}
		</div>
	</div>
	<div class="field-group">
		<label class="field-label" for="future-message">Ett meddelande till ditt framtida jag, från dig själv</label>
		<div class="textarea-wrapper">
			<textarea
				id="future-message"
				placeholder="Hej framtida jag! Försök att skratta åt den där jobbiga händelsen från idag istället för att fortfarande grubbla över den..."
				bind:value={wizardStore.data.messageToFutureSelf}
				rows="3"
				maxlength={messageLimit}
			></textarea>
			{#if messageRemaining <= 100}
				<span class="char-count" class:warning={messageRemaining <= 50}>{messageRemaining}</span>
			{/if}
		</div>
	</div>
</div>

<style>
	.step-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.step-intro {
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-relaxed);
		margin-top: 0;
	}

	.field-group {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.field-label {
		font-family: var(--font-primary);
		font-size: var(--text-md);
		font-weight: var(--weight-medium);
		font-stretch: 105%;
		letter-spacing: var(--tracking-normal);
		line-height: var(--leading-snug);
		color: var(--color-text);
		text-align: center;
	}

	textarea {
		width: 100%;
		padding: 1rem 1.25rem;
		font-family: var(--font-primary);
		font-size: var(--text-base);
		font-weight: var(--weight-regular);
		font-stretch: 100%;
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-relaxed);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background-color: var(--color-bg-elevated);
		outline: none;
		resize: none;
		min-height: 8rem;
		transition: border-color 0.15s ease;
	}

	textarea:focus {
		border-color: var(--color-accent);
	}

	textarea::placeholder {
		color: var(--color-text-muted);
		font-weight: var(--weight-light);
		letter-spacing: var(--tracking-wider);
	}

	.textarea-wrapper {
		position: relative;
		width: 100%;
	}

	.char-count {
		position: absolute;
		right: 0.75rem;
		bottom: 0.75rem;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		pointer-events: none;
	}

	.char-count.warning {
		color: var(--color-error, #dc2626);
	}

	@media (max-width: 480px) {
		textarea {
			padding: 0.75rem 1rem;
			min-height: 6rem;
		}

		.char-count {
			right: 0.5rem;
			bottom: 0.5rem;
		}
	}
</style>
