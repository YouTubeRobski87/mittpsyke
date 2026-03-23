<script lang="ts">
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import { tones } from '$lib/data/tones';
	import { voiceSamples } from '$lib/data/voiceSamples';
	import type { Component } from 'svelte';
	import { EmojiRobot, EmojiFaceYawning, EmojiFlagUk, EmojiArchive, EmojiCat, EmojiTornado, EmojiLedger, EmojiFaceGrimacing, EmojiFaceUnamused, EmojiWomanDetective, EmojiCrown, EmojiTopHat, EmojiWiltedFlower, EmojiPoo, EmojiEarth, EmojiFaceNerd, EmojiFaceExplodingHead, EmojiFaceUpsideDown, EmojiOwl, EmojiVideoGame, EmojiWomanMeditating, EmojiTheaterMasks, EmojiMicrophone, EmojiOpenBook, EmojiNewspaper, EmojiBrain, EmojiSatellite, EmojiMusicalNotes, EmojiDice } from '$lib/assets/emojis';
	import RequiredIndicator from '$lib/components/RequiredIndicator.svelte';

	const toneIconMap: Record<string, Component> = {
		'ai-robot': EmojiRobot,
		'bored': EmojiFaceYawning,
		'british': EmojiFlagUk,
		'bureaucratic': EmojiArchive,
		'cat-perspective': EmojiCat,
		'chaotic': EmojiTornado,
		'classic': EmojiLedger,
		'cringe': EmojiFaceGrimacing,
		'cynical': EmojiFaceUnamused,
		'detective': EmojiWomanDetective,
		'drama-queen': EmojiCrown,
		'formal': EmojiTopHat,
		'melodramatic': EmojiWiltedFlower,
		'meme': EmojiPoo,
		'nature-documentary': EmojiEarth,
		'nerd': EmojiFaceNerd,
		'overthinker': EmojiFaceExplodingHead,
		'passive-aggressive': EmojiFaceUpsideDown,
		'philosophical': EmojiOwl,
		'quest-log': EmojiVideoGame,
		'self-help': EmojiWomanMeditating,
		'shakespeare': EmojiTheaterMasks,
		'sportscaster': EmojiMicrophone,
		'storytelling': EmojiOpenBook,
		'tabloid': EmojiNewspaper,
		'therapist': EmojiBrain,
		'tinfoil-hat': EmojiSatellite,
		'troubadour': EmojiMusicalNotes
	};

	function getToneIcon(toneId: string): Component | undefined {
		return toneIconMap[toneId];
	}

	let hoveredTone = $state<string | null>(null);
	let previewText = $state<string | null>(null);

	// Shuffle tones on component init (Fisher-Yates)
	const shuffledTones = [...tones];
	for (let i = shuffledTones.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffledTones[i], shuffledTones[j]] = [shuffledTones[j], shuffledTones[i]];
	}

	function getRandomSample(toneId: string): string {
		const samples = voiceSamples[toneId];
		if (!samples || samples.length === 0) {
			const tone = tones.find((t) => t.id === toneId);
			return tone?.preview ?? '';
		}
		return samples[Math.floor(Math.random() * samples.length)];
	}

	function handleMouseEnter(toneId: string) {
		hoveredTone = toneId;
		previewText = getRandomSample(toneId);
	}

	function handleMouseLeave() {
		hoveredTone = null;
		previewText = null;
	}
</script>

<div class="step-content">
	<p class="step-intro">Vilken känsla ska dagboken ha? En dag kan låta på många sätt beroende på vem som berättar. Välj din favorit och se hur det låter<RequiredIndicator tooltip="Välj en röst" /></p>

	<div class="preview-container">
		{#if previewText}
			<div class="preview">
				<span class="preview-label">Förhandsvisning</span>
				<p class="preview-text">"{previewText}"</p>
			</div>
		{:else if wizardStore.data.selectedTone === 'surprise'}
			<div class="preview surprise-preview">
				<span class="preview-label">Överraskning väntar!</span>
				<p class="preview-text">Vi väljer en slumpmässig röst åt dig när din dagbok skapas. Det blir som att öppna en present!</p>
			</div>
		{:else if wizardStore.data.selectedTone}
			{@const selectedSample = getRandomSample(wizardStore.data.selectedTone)}
			<div class="preview">
				<span class="preview-label">Förhandsvisning</span>
				<p class="preview-text">"{selectedSample}"</p>
			</div>
		{:else}
			<div class="preview prompt-preview">
				<span class="preview-label">Välj en röst</span>
				<p class="preview-text">Välj en röst för att se ett exempel på hur din dagbok kommer att låta.</p>
			</div>
		{/if}
	</div>

	<div class="tone-grid">
		{#each shuffledTones as tone}
			{@const ToneIcon = getToneIcon(tone.id)}
			<button
				class="tone-card"
				class:selected={wizardStore.data.selectedTone === tone.id}
				onclick={() => wizardStore.updateData('selectedTone', wizardStore.data.selectedTone === tone.id ? '' : tone.id)}
				onmouseenter={() => handleMouseEnter(tone.id)}
				onmouseleave={handleMouseLeave}
			>
				<span class="tone-emoji">
					{#if ToneIcon}
						<ToneIcon size={36} />
					{:else}
						{tone.emoji}
					{/if}
				</span>
				<span class="tone-name">{tone.name}</span>
			</button>
		{/each}
		<button
			class="tone-card surprise-card"
			class:selected={wizardStore.data.selectedTone === 'surprise'}
			onclick={() => wizardStore.updateData('selectedTone', wizardStore.data.selectedTone === 'surprise' ? '' : 'surprise')}
		>
			<span class="tone-emoji">
				<EmojiDice size={36} />
			</span>
			<span class="tone-name">Överraska mig!</span>
		</button>
	</div>
</div>

<style>
	.step-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
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

	.tone-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.tone-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 0.5rem;
		background-color: var(--color-bg-elevated);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease,
			transform 0.1s ease;
	}

	.surprise-card {
		grid-column: 1 / -1;
		flex-direction: row;
		justify-content: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
	}

	.tone-card:hover {
		border-color: var(--color-accent);
		transform: translateY(-2px);
	}

	.tone-card.selected {
		border-color: var(--color-accent);
		background-color: color-mix(in srgb, var(--color-accent) 8%, transparent);
	}

	.tone-emoji {
		font-size: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tone-name {
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		font-stretch: 105%;
		letter-spacing: var(--tracking-normal);
		color: var(--color-text);
		text-align: center;
	}

	.preview-container {
		min-height: 5rem;
	}

	.preview {
		padding: 1rem 1.25rem;
		background-color: var(--color-bg-elevated);
		border: 2px dashed var(--color-border);
		border-radius: var(--radius-md);
		text-align: center;
	}

	.preview-label {
		display: block;
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		font-stretch: 110%;
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin-bottom: 0.5rem;
	}

	.preview-text {
		font-family: var(--font-primary);
		font-size: var(--text-base);
		font-weight: var(--weight-regular);
		font-stretch: 100%;
		letter-spacing: var(--tracking-wide);
		color: var(--color-text);
		line-height: var(--leading-relaxed);
	}

	.surprise-preview {
		background-color: color-mix(in srgb, var(--color-accent) 8%, var(--color-bg-elevated));
		border-color: var(--color-accent);
	}


	@media (min-width: 480px) {
		.tone-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media (max-width: 480px) {
		.preview {
			padding: 0.75rem 1rem;
		}

		.surprise-card {
			padding: 1rem;
		}
	}

	@media (max-width: 420px) {
		.tone-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 320px) {
		.preview {
			padding: 0.625rem 0.75rem;
		}

		.tone-card {
			padding: 0.75rem 0.375rem;
		}
	}
</style>
