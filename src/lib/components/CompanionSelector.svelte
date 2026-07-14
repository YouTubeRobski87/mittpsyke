<script lang="ts">
	import CompanionAvatar from '$lib/components/CompanionAvatar.svelte';
	import {
		PROGRESS_COMPANION_ANIMALS,
		type ProgressCompanionSelection
	} from '$lib/progressCompanion';

	type CompanionId = 'fox' | 'bear';

	let {
		selection,
		saving = false,
		message = '',
		messageType = 'success',
		onselect
	}: {
		selection: ProgressCompanionSelection;
		saving?: boolean;
		message?: string;
		messageType?: 'success' | 'error';
		onselect: (id: CompanionId) => void;
	} = $props();

	const choices = PROGRESS_COMPANION_ANIMALS.filter(
		(companion): companion is (typeof PROGRESS_COMPANION_ANIMALS)[number] & { id: CompanionId } =>
			companion.id === 'fox' || companion.id === 'bear'
	);
</script>

<section class="companion-selector" aria-labelledby="companion-heading">
	<div class="companion-selector-heading">
		<h2 id="companion-heading">Välj följeslagare</h2>
		<p>Välj den som ska följa med dig på Mitt Hem och Framsteg.</p>
	</div>

	<div class="companion-choice-grid" role="radiogroup" aria-label="Välj följeslagare">
		{#each choices as companion}
			<button
				type="button"
				role="radio"
				class="companion-choice"
				class:companion-choice-active={selection.id === companion.id}
				onclick={() => onselect(companion.id)}
				aria-checked={selection.id === companion.id}
				disabled={saving}
			>
				<CompanionAvatar selection={{ id: companion.id }} size="lg" decorative animated={false} />
				<span class="companion-choice-copy">
					<strong>{companion.name}</strong>
					<small>{companion.temperament}</small>
				</span>
				{#if selection.id === companion.id}
					<span class="companion-active-badge">Vald</span>
				{/if}
			</button>
		{/each}
	</div>

	{#if message}
		<p class:success={messageType === 'success'} class:error={messageType === 'error'} class="feedback" aria-live="polite">
			{message}
		</p>
	{/if}
</section>

<style>
	.companion-selector {
		margin-bottom: 1rem;
		padding: 1rem;
		border: 1px solid hsl(var(--border));
		border-radius: 16px;
		background: hsl(var(--surface));
	}

	.companion-selector-heading h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1.05rem;
	}

	.companion-selector-heading p {
		margin: 0.3rem 0 0.75rem;
		color: hsl(var(--muted-foreground));
		font-family: var(--font-body);
		font-size: 0.86rem;
		line-height: 1.45;
	}

	.companion-choice-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
	}

	.companion-choice {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		min-width: 0;
		padding: 0.7rem;
		border: 1px solid hsl(var(--border));
		border-radius: 12px;
		background: hsl(var(--surface));
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.companion-choice:disabled { cursor: wait; }
	.companion-choice-active {
		border-color: hsl(var(--primary));
		box-shadow: inset 0 0 0 1px hsl(var(--primary) / 0.25);
		background: hsl(var(--surface-soft));
	}
	.companion-choice-copy { display: grid; min-width: 0; gap: 0.12rem; }
	.companion-choice strong { font-size: 0.9rem; }
	.companion-choice small { color: hsl(var(--muted-foreground)); font-size: 0.76rem; line-height: 1.25; }
	.companion-active-badge {
		flex: 0 0 auto;
		padding: 0.2rem 0.45rem;
		border-radius: 999px;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		font-family: var(--font-body);
		font-size: 0.72rem;
		font-weight: 650;
	}
	.feedback { margin: 0.65rem 0 0; font-family: var(--font-body); font-size: 0.86rem; }
	.feedback.success { color: hsl(var(--success-foreground)); }
	.feedback.error { color: hsl(var(--error-foreground)); }

	@media (max-width: 640px) {
		.companion-choice-grid { grid-template-columns: 1fr; }
	}
</style>
