<script lang="ts">
	import { chatStore } from '$lib/stores/chat.svelte';
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import { tones } from '$lib/data/tones';
	import { voiceSamples } from '$lib/data/voiceSamples';
	import { getZodiacFromBirthday } from '$lib/utils/zodiac';
	import type { Component } from 'svelte';
	import IconArrowLeft from '$lib/assets/icons/IconArrowLeft.svelte';
	import {
		EmojiRobot,
		EmojiFaceYawning,
		EmojiFlagUk,
		EmojiArchive,
		EmojiCat,
		EmojiTornado,
		EmojiLedger,
		EmojiFaceGrimacing,
		EmojiFaceUnamused,
		EmojiWomanDetective,
		EmojiCrown,
		EmojiTopHat,
		EmojiWiltedFlower,
		EmojiPoo,
		EmojiEarth,
		EmojiFaceNerd,
		EmojiFaceExplodingHead,
		EmojiFaceUpsideDown,
		EmojiOwl,
		EmojiVideoGame,
		EmojiWomanMeditating,
		EmojiTheaterMasks,
		EmojiMicrophone,
		EmojiOpenBook,
		EmojiNewspaper,
		EmojiBrain,
		EmojiSatellite,
		EmojiMusicalNotes,
		EmojiDice,
		EmojiCrystalBall,
		EmojiLightBulb,
		EmojiMantelpieceClock,
		EmojiSeedling,
		EmojiZodiacAries,
		EmojiZodiacTaurus,
		EmojiZodiacGemini,
		EmojiZodiacCancer,
		EmojiZodiacLeo,
		EmojiZodiacVirgo,
		EmojiZodiacLibra,
		EmojiZodiacScorpio,
		EmojiZodiacSagittarius,
		EmojiZodiacCapricorn,
		EmojiZodiacAquarius,
		EmojiZodiacPisces
	} from '$lib/assets/emojis';

	interface Props {
		onGenerate: () => void;
	}

	let { onGenerate }: Props = $props();

	const toneIconMap: Record<string, Component> = {
		'ai-robot': EmojiRobot,
		bored: EmojiFaceYawning,
		british: EmojiFlagUk,
		bureaucratic: EmojiArchive,
		'cat-perspective': EmojiCat,
		chaotic: EmojiTornado,
		classic: EmojiLedger,
		cringe: EmojiFaceGrimacing,
		cynical: EmojiFaceUnamused,
		detective: EmojiWomanDetective,
		'drama-queen': EmojiCrown,
		formal: EmojiTopHat,
		melodramatic: EmojiWiltedFlower,
		meme: EmojiPoo,
		'nature-documentary': EmojiEarth,
		nerd: EmojiFaceNerd,
		overthinker: EmojiFaceExplodingHead,
		'passive-aggressive': EmojiFaceUpsideDown,
		philosophical: EmojiOwl,
		'quest-log': EmojiVideoGame,
		'self-help': EmojiWomanMeditating,
		shakespeare: EmojiTheaterMasks,
		sportscaster: EmojiMicrophone,
		storytelling: EmojiOpenBook,
		tabloid: EmojiNewspaper,
		therapist: EmojiBrain,
		'tinfoil-hat': EmojiSatellite,
		troubadour: EmojiMusicalNotes
	};

	const zodiacComponents: Record<string, Component> = {
		aries: EmojiZodiacAries,
		taurus: EmojiZodiacTaurus,
		gemini: EmojiZodiacGemini,
		cancer: EmojiZodiacCancer,
		leo: EmojiZodiacLeo,
		virgo: EmojiZodiacVirgo,
		libra: EmojiZodiacLibra,
		scorpio: EmojiZodiacScorpio,
		sagittarius: EmojiZodiacSagittarius,
		capricorn: EmojiZodiacCapricorn,
		aquarius: EmojiZodiacAquarius,
		pisces: EmojiZodiacPisces
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

	function selectTone(toneId: string) {
		chatStore.setSelectedTone(chatStore.selectedTone === toneId ? '' : toneId);
	}

	let hasBirthday = $derived(wizardStore.data.profile.birthday !== null);
	let zodiacSign = $derived(getZodiacFromBirthday(wizardStore.data.profile.birthday));
	let canGenerate = $derived(chatStore.selectedTone !== '');
</script>

<div class="tone-selection">
	<div class="tone-header">
		<button class="back-button" onclick={() => chatStore.backToInterview()}>
			<IconArrowLeft size={16} />
			Tillbaka
		</button>
		<h2 class="tone-title">Välj röst & tillägg</h2>
	</div>

	<!-- Voice preview -->
	<div class="preview-container">
		{#if previewText}
			<div class="preview">
				<span class="preview-label">Förhandsvisning</span>
				<p class="preview-text">"{previewText}"</p>
			</div>
		{:else if chatStore.selectedTone === 'surprise'}
			<div class="preview surprise-preview">
				<span class="preview-label">Överraskning väntar!</span>
				<p class="preview-text">Vi väljer en slumpmässig röst åt dig när din dagbok skapas. Det blir som att öppna en present!</p>
			</div>
		{:else if chatStore.selectedTone}
			{@const selectedSample = getRandomSample(chatStore.selectedTone)}
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

	<!-- Tone grid -->
	<div class="tone-grid">
		{#each shuffledTones as tone}
			{@const ToneIcon = getToneIcon(tone.id)}
			<button
				class="tone-card"
				class:selected={chatStore.selectedTone === tone.id}
				onclick={() => selectTone(tone.id)}
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
			class:selected={chatStore.selectedTone === 'surprise'}
			onclick={() => selectTone('surprise')}
		>
			<span class="tone-emoji">
				<EmojiDice size={36} />
			</span>
			<span class="tone-name">Överraska mig!</span>
		</button>
	</div>

	<!-- Addon toggles -->
	<div class="addons-section">
		<h3 class="addons-heading">Tillägg</h3>
		<div class="addons-list">
			<button
				class="addon-card"
				class:selected={chatStore.includeHoroscope}
				class:disabled={!hasBirthday}
				onclick={() => hasBirthday && chatStore.setAddon('horoscope', !chatStore.includeHoroscope)}
				disabled={!hasBirthday}
				type="button"
			>
				<div class="addon-icon">
					{#if zodiacSign}
						{@const ZodiacIcon = zodiacComponents[zodiacSign.id]}
						{#if ZodiacIcon}
							<ZodiacIcon size={36} />
						{:else}
							<EmojiCrystalBall size={36} />
						{/if}
					{:else}
						<EmojiCrystalBall size={36} />
					{/if}
				</div>
				<div class="addon-content">
					<span class="addon-title">Horoskop</span>
					<span class="addon-description">
						{#if hasBirthday && zodiacSign}
							Personligt horoskop för {zodiacSign.name}.
						{:else}
							Fyll i födelsedag i profilen för att aktivera.
						{/if}
					</span>
				</div>
				<div class="addon-toggle">
					<div class="toggle-track" class:active={chatStore.includeHoroscope && hasBirthday}>
						<div class="toggle-thumb"></div>
					</div>
				</div>
			</button>

			<button
				class="addon-card"
				class:selected={chatStore.includeOnThisDay}
				onclick={() => chatStore.setAddon('onThisDay', !chatStore.includeOnThisDay)}
				type="button"
			>
				<div class="addon-icon">
					<EmojiMantelpieceClock size={36} />
				</div>
				<div class="addon-content">
					<span class="addon-title">På denna dag...</span>
					<span class="addon-description">Historisk händelse på dagens datum.</span>
				</div>
				<div class="addon-toggle">
					<div class="toggle-track" class:active={chatStore.includeOnThisDay}>
						<div class="toggle-thumb"></div>
					</div>
				</div>
			</button>

			<button
				class="addon-card"
				class:selected={chatStore.includeHomework}
				onclick={() => chatStore.setAddon('homework', !chatStore.includeHomework)}
				type="button"
			>
				<div class="addon-icon">
					<EmojiLightBulb size={36} />
				</div>
				<div class="addon-content">
					<span class="addon-title">Hemläxa</span>
					<span class="addon-description">En personlig reflektion att ta med till imorgon.</span>
				</div>
				<div class="addon-toggle">
					<div class="toggle-track" class:active={chatStore.includeHomework}>
						<div class="toggle-thumb"></div>
					</div>
				</div>
			</button>

			<button
				class="addon-card"
				class:selected={chatStore.includeDailyChallenge}
				onclick={() => chatStore.setAddon('dailyChallenge', !chatStore.includeDailyChallenge)}
				type="button"
			>
				<div class="addon-icon">
					<EmojiSeedling size={36} />
				</div>
				<div class="addon-content">
					<span class="addon-title">Dagens utmaning</span>
					<span class="addon-description">Få en liten snäll utmaning att ta med dig till imorgon.</span>
				</div>
				<div class="addon-toggle">
					<div class="toggle-track" class:active={chatStore.includeDailyChallenge}>
						<div class="toggle-thumb"></div>
					</div>
				</div>
			</button>
		</div>
	</div>

	<!-- Generate button -->
	<button
		class="generate-button"
		disabled={!canGenerate}
		onclick={onGenerate}
	>
		Generera dagboksinlägg
	</button>
</div>

<style>
	.tone-selection {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		padding: 0.5rem 0;
	}

	.tone-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-text-muted);
		transition: color 0.15s ease;
		align-self: flex-start;
	}

	.back-button:hover {
		color: var(--color-text);
	}

	.tone-title {
		font-family: var(--font-primary);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		color: var(--color-text);
		margin: 0;
		text-align: center;
	}

	/* Preview */
	.preview-container {
		min-height: 3.5rem;
	}

	.preview {
		padding: 0.75rem 0.875rem;
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
		margin-bottom: 0.375rem;
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

	/* Tone grid */
	.tone-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}

	.tone-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.625rem 0.375rem;
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
		gap: 0.5rem;
		padding: 0.75rem 1rem;
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

	/* Addons */
	.addons-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.addons-heading {
		font-family: var(--font-primary);
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		color: var(--color-text);
		margin: 0;
	}

	.addons-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.addon-card {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.625rem;
		background-color: var(--color-bg-elevated);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: left;
		width: 100%;
	}

	.addon-card:hover:not(.disabled) {
		border-color: var(--color-accent);
	}

	.addon-card.selected {
		border-color: var(--color-accent);
		background-color: color-mix(in srgb, var(--color-accent) 5%, var(--color-bg-elevated));
	}

	.addon-card.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.addon-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.addon-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.addon-title {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		color: var(--color-text);
	}

	.addon-description {
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-relaxed);
		color: var(--color-text-muted);
	}

	.addon-toggle {
		flex-shrink: 0;
	}

	.toggle-track {
		width: 44px;
		height: 24px;
		background-color: var(--color-neutral);
		border-radius: 12px;
		position: relative;
		transition: background-color 0.2s ease;
	}

	.toggle-track.active {
		background-color: var(--color-accent);
	}

	.toggle-thumb {
		width: 20px;
		height: 20px;
		background-color: white;
		border-radius: 50%;
		position: absolute;
		top: 2px;
		left: 2px;
		transition: transform 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.toggle-track.active .toggle-thumb {
		transform: translateX(20px);
	}

	/* Generate button */
	.generate-button {
		width: 100%;
		padding: 0.75rem;
		background-color: var(--color-accent);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-family: var(--font-primary);
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		cursor: pointer;
		transition:
			opacity 0.15s ease,
			transform 0.1s ease;
	}

	.generate-button:hover:not(:disabled) {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.generate-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	@media (min-width: 480px) {
		.tone-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media (max-width: 480px) {
		.preview {
			padding: 0.625rem 0.75rem;
		}

		.surprise-card {
			padding: 0.625rem 0.75rem;
		}
	}

	@media (max-width: 420px) {
		.tone-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 320px) {
		.preview {
			padding: 0.5rem 0.625rem;
		}

		.tone-card {
			padding: 0.5rem 0.25rem;
		}

		.addon-card {
			padding: 0.5rem;
			gap: 0.375rem;
		}

		.addon-icon :global(svg) {
			width: 28px !important;
			height: 28px !important;
		}
	}
</style>
