<script lang="ts">
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import {
		EmojiShortcake,
		EmojiHeadphones,
		EmojiPalette
	} from '$lib/assets/emojis';
	import { FIELD_LIMITS } from '$lib/validation';
	import { moodColors } from '$lib/data/moodColors';

	let mealInput = $state('');
	let soundtrackInput = $state('');

	function addMeal() {
		const value = mealInput.trim();
		if (!value || wizardStore.data.customMeals.includes(value)) {
			mealInput = '';
			return;
		}
		wizardStore.updateData('customMeals', [...wizardStore.data.customMeals, value]);
		mealInput = '';
	}

	function removeMeal(meal: string) {
		wizardStore.updateData(
			'customMeals',
			wizardStore.data.customMeals.filter((m) => m !== meal)
		);
	}

	function removeLastMeal() {
		const arr = wizardStore.data.customMeals;
		if (arr.length > 0) {
			wizardStore.updateData('customMeals', arr.slice(0, -1));
		}
	}

	function addSoundtrack() {
		const value = soundtrackInput.trim();
		if (!value || wizardStore.data.customSoundtracks.includes(value)) {
			soundtrackInput = '';
			return;
		}
		wizardStore.updateData('customSoundtracks', [...wizardStore.data.customSoundtracks, value]);
		soundtrackInput = '';
	}

	function removeSoundtrack(soundtrack: string) {
		wizardStore.updateData(
			'customSoundtracks',
			wizardStore.data.customSoundtracks.filter((s) => s !== soundtrack)
		);
	}

	function removeLastSoundtrack() {
		const arr = wizardStore.data.customSoundtracks;
		if (arr.length > 0) {
			wizardStore.updateData('customSoundtracks', arr.slice(0, -1));
		}
	}

	function handleKeydown(event: KeyboardEvent, action: () => void, removeLastAction?: () => void) {
		if (event.key === 'Enter') {
			event.preventDefault();
			action();
		} else if (event.key === 'Backspace' && removeLastAction) {
			const input = event.currentTarget as HTMLInputElement;
			if (input.value === '' || (input.selectionStart === 0 && input.selectionEnd === 0)) {
				event.preventDefault();
				removeLastAction();
			}
		}
	}

	function handleCommaInput(
		event: Event,
		inputSetter: (v: string) => void,
		action: () => void
	) {
		const input = event.currentTarget as HTMLInputElement;
		const value = input.value;
		if (value.includes(',')) {
			const parts = value.split(',');
			const beforeComma = parts[0];
			const afterComma = parts.slice(1).join(',').trimStart();

			// Must set input.value directly so Svelte's bind:value reads the correct value
			input.value = beforeComma;
			inputSetter(beforeComma);
			action();

			input.value = afterComma;
			inputSetter(afterComma);
		}
	}

	function focusInput(event: MouseEvent) {
		const container = event.currentTarget as HTMLElement;
		const input = container.querySelector('input');
		if (input) input.focus();
	}
</script>

<div class="step-content">
	<p class="step-intro">Vad åt du? Vad lyssnade du på? Det är de små detaljerna som gör att man minns hur dagen faktiskt kändes.</p>

	<div class="field-group">
		<span class="field-label">
			<span class="label-emoji"><EmojiShortcake size={23} /></span>
			Vad har du ätit idag?
		</span>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="tag-input" role="group" onclick={focusInput} onkeydown={(e) => e.key === 'Enter' && focusInput(e as unknown as MouseEvent)}>
			{#each wizardStore.data.customMeals as meal}
				<span class="tag">
					{meal}
					<button class="tag-remove" onclick={() => removeMeal(meal)}>×</button>
				</span>
			{/each}
			<input
				type="text"
				placeholder={wizardStore.data.customMeals.length === 0 ? 'Brunch på hotellet, fika med farmor, fem koppar kaffe...' : ''}
				bind:value={mealInput}
				onkeydown={(e) => handleKeydown(e, addMeal, removeLastMeal)}
				oninput={(e) => handleCommaInput(e, (v) => mealInput = v, addMeal)}
				onblur={addMeal}
				maxlength={FIELD_LIMITS.customMeals}
			/>
		</div>
	</div>

	<div class="field-group">
		<span class="field-label">
			<span class="label-emoji"><EmojiHeadphones size={23} /></span>
			Vad var dagens soundtrack?
		</span>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="tag-input" role="group" onclick={focusInput} onkeydown={(e) => e.key === 'Enter' && focusInput(e as unknown as MouseEvent)}>
			{#each wizardStore.data.customSoundtracks as soundtrack}
				<span class="tag">
					{soundtrack}
					<button class="tag-remove" onclick={() => removeSoundtrack(soundtrack)}>×</button>
				</span>
			{/each}
			<input
				type="text"
				placeholder={wizardStore.data.customSoundtracks.length === 0 ? 'Samma låt på repeat, regnet, grannarnas renovering...' : ''}
				bind:value={soundtrackInput}
				onkeydown={(e) => handleKeydown(e, addSoundtrack, removeLastSoundtrack)}
				oninput={(e) => handleCommaInput(e, (v) => soundtrackInput = v, addSoundtrack)}
				onblur={addSoundtrack}
				maxlength={FIELD_LIMITS.customSoundtracks}
			/>
		</div>
	</div>

	<div class="field-group">
		<span class="field-label">
			<span class="label-emoji"><EmojiPalette size={23} /></span>
			Om idag var en färg...
		</span>
		<p class="field-description">Välj den färg som bäst speglar känslan av din dag.</p>
		<div class="color-swatches">
			{#each moodColors as color}
				<button
					type="button"
					class="color-swatch"
					class:selected={wizardStore.data.moodColor === color.id}
					style="--swatch-color: var({color.cssVar})"
					aria-label={color.name}
					onclick={() => wizardStore.updateData('moodColor', wizardStore.data.moodColor === color.id ? '' : color.id)}
				>
					<span class="swatch-inner"></span>
				</button>
			{/each}
		</div>
		{#if wizardStore.data.moodColor}
			{@const selectedColor = moodColors.find(c => c.id === wizardStore.data.moodColor)}
			{#if selectedColor}
				<p class="selected-color-keywords">
					{#each selectedColor.keywords as keyword}
						<span class="keyword-tag">#{keyword}</span>
					{/each}
				</p>
			{/if}
		{:else}
			<p class="color-hint">Klicka på en färg för att se dess betydelse</p>
		{/if}
	</div>
</div>

<style>
	.step-content {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
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
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field-label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
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

	.field-description {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		font-weight: var(--weight-light);
		letter-spacing: var(--tracking-wide);
	}

	.tag-input {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
		min-height: 2.75rem;
		padding: 0.375rem 0.625rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background-color: var(--color-bg-elevated);
		cursor: text;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.tag-input:focus-within {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
	}

	.tag-input input {
		flex: 1;
		min-width: 60px;
		height: 1.75rem;
		padding: 0 0.25rem;
		border: none;
		background: transparent;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		color: var(--color-text);
	}

	.tag-input input:focus {
		border: none;
		outline: none;
		box-shadow: none;
	}

	.tag-input input::placeholder {
		color: var(--color-text-muted);
		font-weight: var(--weight-light);
		letter-spacing: var(--tracking-wider);
		opacity: 0.6;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		padding: 0.12rem 0.5rem;
		background-color: var(--color-accent);
		border-radius: 0.325rem;
		color: white;
		white-space: nowrap;
	}

	.tag-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 0.875rem;
		height: 0.875rem;
		font-size: 0.875rem;
		line-height: 1;
		background: none;
		border: none;
		color: white;
		cursor: pointer;
		opacity: 0.8;
		transition: opacity 0.15s ease;
	}

	.tag-remove:hover {
		opacity: 1;
	}

	.color-swatches {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: clamp(0.25rem, 1vw, 0.5rem);
	}

	.color-swatch {
		position: relative;
		aspect-ratio: 1;
		padding: clamp(2px, 0.5vw, 4px);
		border: none;
		border-radius: 4px;
		background-color: var(--color-bg-elevated);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.color-swatch:hover {
		transform: scale(1.1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
	}

	.color-swatch.selected {
		box-shadow: 0 0 0 2px var(--swatch-color), 0 1px 3px rgba(0, 0, 0, 0.15);
	}

	.swatch-inner {
		display: block;
		width: 100%;
		height: 100%;
		border-radius: 2px;
		background-color: var(--swatch-color);
	}

	.selected-color-keywords,
	.color-hint {
		margin: 0.25rem 0 0;
		font-size: var(--text-sm);
		font-weight: var(--weight-light);
		color: var(--color-text-muted);
		letter-spacing: var(--tracking-wide);
	}

	.selected-color-keywords {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.keyword-tag {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.color-hint {
		opacity: 0.7;
		font-style: italic;
	}

	@media (max-width: 479px) {
		.color-swatch {
			padding: 4px;
			border-radius: 5px;
		}

		.swatch-inner {
			border-radius: 3px;
		}
	}

	@media (max-width: 479px) {
		.tag-input {
			padding: 0.375rem 0.5rem;
		}

		.tag-input input {
			min-width: 50px;
		}
	}

	@media (max-width: 320px) {
		.tag-input input {
			min-width: 40px;
		}
	}

	@media (min-width: 480px) {
		.color-swatches {
			grid-template-columns: repeat(8, 1fr);
		}

		.color-swatch {
			min-width: 2.75rem;
			min-height: 2.75rem;
		}
	}

	@media (min-width: 640px) {
		.color-swatches {
			grid-template-columns: repeat(16, 1fr);
		}

		.color-swatch {
			min-width: 0;
			min-height: 0;
		}
	}
</style>
