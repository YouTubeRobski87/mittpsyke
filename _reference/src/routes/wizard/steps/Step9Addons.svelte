<script lang="ts">
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import { getZodiacFromBirthday } from '$lib/utils/zodiac';
	import {
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
	import type { Component } from 'svelte';

	// Check if birthday is set
	let hasBirthday = $derived(wizardStore.data.profile.birthday !== null);
	let zodiacSign = $derived(getZodiacFromBirthday(wizardStore.data.profile.birthday));

	// Map zodiac ID to component
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

	function toggleHoroscope() {
		if (hasBirthday) {
			wizardStore.updateData('includeHoroscope', !wizardStore.data.includeHoroscope);
		}
	}

	function toggleOnThisDay() {
		wizardStore.updateData('includeOnThisDay', !wizardStore.data.includeOnThisDay);
	}

	function toggleHomework() {
		wizardStore.updateData('includeHomework', !wizardStore.data.includeHomework);
	}

	function toggleDailyChallenge() {
		wizardStore.updateData('includeDailyChallenge', !wizardStore.data.includeDailyChallenge);
	}
</script>

<div class="step-content">
	<p class="step-intro">
		Vill du krydda din dagbok med lite extra? Välj vilka tillägg du vill ha med.
	</p>

	<div class="addons-list">
		<button
			class="addon-card"
			class:selected={wizardStore.data.includeHoroscope}
			class:disabled={!hasBirthday}
			onclick={toggleHoroscope}
			disabled={!hasBirthday}
			type="button"
		>
			<div class="addon-icon">
				{#if zodiacSign}
					{@const ZodiacIcon = zodiacComponents[zodiacSign.id]}
					{#if ZodiacIcon}
						<ZodiacIcon size={40} />
					{:else}
						<EmojiCrystalBall size={40} />
					{/if}
				{:else}
					<EmojiCrystalBall size={40} />
				{/if}
			</div>
			<div class="addon-content">
				<h3 class="addon-title">Horoskop</h3>
				<p class="addon-description">
					{#if hasBirthday && zodiacSign}
						Lägg till ett personligt horoskop för {zodiacSign.name} i slutet av din dagbok.
					{:else}
						Fyll i din födelsedag i profilen för att aktivera horoskop.
					{/if}
				</p>
			</div>
			<div class="addon-toggle">
				<div class="toggle-track" class:active={wizardStore.data.includeHoroscope && hasBirthday}>
					<div class="toggle-thumb"></div>
				</div>
			</div>
		</button>

		<button
			class="addon-card"
			class:selected={wizardStore.data.includeOnThisDay}
			onclick={toggleOnThisDay}
			type="button"
		>
			<div class="addon-icon">
				<EmojiMantelpieceClock size={40} />
			</div>
			<div class="addon-content">
				<h3 class="addon-title">På denna dag...</h3>
				<p class="addon-description">
					Lägg till en historisk händelse som inträffade på dagens datum.
				</p>
			</div>
			<div class="addon-toggle">
				<div class="toggle-track" class:active={wizardStore.data.includeOnThisDay}>
					<div class="toggle-thumb"></div>
				</div>
			</div>
		</button>

		<button
			class="addon-card"
			class:selected={wizardStore.data.includeHomework}
			onclick={toggleHomework}
			type="button"
		>
			<div class="addon-icon">
				<EmojiLightBulb size={40} />
			</div>
			<div class="addon-content">
				<h3 class="addon-title">Hemläxa</h3>
				<p class="addon-description">
					Få en personlig reflektion eller utmaning att ta med dig till imorgon.
				</p>
			</div>
			<div class="addon-toggle">
				<div class="toggle-track" class:active={wizardStore.data.includeHomework}>
					<div class="toggle-thumb"></div>
				</div>
			</div>
		</button>

		<button
			class="addon-card"
			class:selected={wizardStore.data.includeDailyChallenge}
			onclick={toggleDailyChallenge}
			type="button"
		>
			<div class="addon-icon">
				<EmojiSeedling size={40} />
			</div>
			<div class="addon-content">
				<h3 class="addon-title">Dagens utmaning</h3>
				<p class="addon-description">
					Få en liten snäll utmaning att ta med dig till imorgon.
				</p>
			</div>
			<div class="addon-toggle">
				<div class="toggle-track" class:active={wizardStore.data.includeDailyChallenge}>
					<div class="toggle-thumb"></div>
				</div>
			</div>
		</button>
	</div>

	{#if !hasBirthday}
		<p class="hint-text">
			Tips: Gå tillbaka till "Lite om dig" och fyll i din födelsedag för att låsa upp
			horoskopalternativet.
		</p>
	{/if}
</div>

<style>
	.step-content {
		display: flex;
		flex-direction: column;
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

	.addons-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.addon-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem;
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
	}

	.addon-title {
		font-family: var(--font-primary);
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		color: var(--color-text);
		margin: 0 0 0.25rem 0;
	}

	.addon-description {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-relaxed);
		color: var(--color-text-muted);
		margin: 0;
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

	.hint-text {
		text-align: center;
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
		margin: 0;
		padding: 0 1rem;
	}

	@media (max-width: 480px) {
		.addon-card {
			padding: 1rem;
			gap: 0.75rem;
		}

		.hint-text {
			padding: 0 0.5rem;
		}
	}

	@media (max-width: 320px) {
		.addon-card {
			padding: 0.75rem;
			gap: 0.5rem;
		}

		.addon-icon :global(svg) {
			width: 32px !important;
			height: 32px !important;
		}
	}
</style>
