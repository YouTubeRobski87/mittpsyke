<script lang="ts">
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import type { Component } from 'svelte';
	import {
	EmojiWarning,
	EmojiExclamationQuestion,
	EmojiRedo
} from '$lib/assets/emojis';
	import { FIELD_LIMITS } from '$lib/validation';

	const fields: {
		key: 'almostHappened' | 'unnecessaryThing' | 'wouldRedo';
		label: string;
		placeholder: string;
		icon: Component;
		limit: number;
	}[] = [
		{
			key: 'almostHappened',
			label: 'Något som var nära på att hända idag',
			placeholder: 'Råkade nästan sms:a fel person, köpte nästan något onödigt...',
			icon: EmojiWarning,
			limit: FIELD_LIMITS.almostHappened
		},
		{
			key: 'unnecessaryThing',
			label: 'Varför gjorde du ens det här?',
			placeholder: 'Scrollade på TikTok i 2 timmar, köpte energidryck nummer 3...',
			icon: EmojiExclamationQuestion,
			limit: FIELD_LIMITS.unnecessaryThing
		},
		{
			key: 'wouldRedo',
			label: 'Vad skulle du vilja göra om idag om du fick chansen?',
			placeholder: 'Stressat mindre, stannat kvar lite längre, eller gått tidigare...',
			icon: EmojiRedo,
			limit: FIELD_LIMITS.wouldRedo
		}
	];
</script>

<div class="step-content">
	<p class="step-intro">Dagens nästan-händelser, onödiga val och önskade omtag. Det som snurrar i huvudet efteråt, även fast dagen är slut.</p>

	{#each fields as field}
		{@const value = wizardStore.data[field.key] || ''}
		{@const remaining = field.limit - value.length}
		<div class="field-group">
			<label class="field-label" for={field.key}>
				<span class="label-emoji"><field.icon size={23} /></span>
				{field.label}
			</label>
			<div class="textarea-wrapper">
				<textarea
					id={field.key}
					placeholder={field.placeholder}
					bind:value={wizardStore.data[field.key]}
					rows="2"
					maxlength={field.limit}
				></textarea>
				{#if remaining <= 50}
					<span class="char-count" class:warning={remaining <= 20}>{remaining}</span>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.step-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.step-intro {
		text-align: center;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-light);
		letter-spacing: var(--tracking-wider);
		color: var(--color-text-muted);
		margin-top: 0;
		margin-bottom: 0.5rem;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.field-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-primary);
		font-size: var(--text-base);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text);
	}

	.label-emoji {
		display: flex;
		align-items: center;
	}

	textarea {
		width: 100%;
		padding: 0.875rem 1rem;
		font-family: var(--font-primary);
		font-size: var(--text-base);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-relaxed);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background-color: var(--color-bg-elevated);
		outline: none;
		resize: none;
		min-height: 4rem;
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
	}

	.char-count {
		position: absolute;
		right: 0.75rem;
		bottom: 0.5rem;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		pointer-events: none;
	}

	.char-count.warning {
		color: var(--color-error, #dc2626);
	}

	@media (max-width: 480px) {
		textarea {
			padding: 0.75rem;
			min-height: 3.5rem;
		}

		.char-count {
			right: 0.5rem;
			bottom: 0.375rem;
		}
	}
</style>
