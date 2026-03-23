<script lang="ts">
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import type { Component } from 'svelte';
	import { EmojiFaceBagsUnderEyes, EmojiFaceTired, EmojiFaceSleepy, EmojiFaceYawning, EmojiFaceNeutral, EmojiFaceSlightlySmiling, EmojiFaceSmilingEyes, EmojiFaceSmilingHearts, EmojiFaceGrinningSweat, EmojiFaceStarStruck, EmojiFaceSleeping, EmojiFaceCrossedOutEyes, EmojiFaceWeary, EmojiFaceSmiling, EmojiFaceGrinningSmilingEyes, EmojiFacePartying, EmojiRocket, EmojiFaceCryingLoudly, EmojiFaceCrying, EmojiFaceFrowning, EmojiFaceSlightlyFrowning, EmojiFaceRelieved, EmojiFaceLol } from '$lib/assets/emojis';
	import RequiredIndicator from '$lib/components/RequiredIndicator.svelte';

	const sleepEmojis: Component[] = [
		EmojiFaceBagsUnderEyes,
		EmojiFaceTired,
		EmojiFaceSleepy,
		EmojiFaceYawning,
		EmojiFaceNeutral,
		EmojiFaceSlightlySmiling,
		EmojiFaceSmilingEyes,
		EmojiFaceSmilingHearts,
		EmojiFaceGrinningSweat,
		EmojiFaceStarStruck
	];

	const energyEmojis: Component[] = [
		EmojiFaceSleeping,
		EmojiFaceCrossedOutEyes,
		EmojiFaceWeary,
		EmojiFaceYawning,
		EmojiFaceNeutral,
		EmojiFaceSmiling,
		EmojiFaceGrinningSmilingEyes,
		EmojiFacePartying,
		EmojiFaceStarStruck,
		EmojiRocket
	];

	const moodEmojis: Component[] = [
		EmojiFaceCryingLoudly,
		EmojiFaceCrying,
		EmojiFaceFrowning,
		EmojiFaceSlightlyFrowning,
		EmojiFaceNeutral,
		EmojiFaceRelieved,
		EmojiFaceSmilingEyes,
		EmojiFaceSmilingHearts,
		EmojiFaceGrinningSweat,
		EmojiFaceLol
	];

	const sliders = [
		{
			key: 'sleepQuality' as const,
			label: 'Hur sov du inatt?',
			tooltip: 'Ange sömnkvalitet med handtaget',
			low: 'Inte alls',
			high: 'Utmärkt',
			emojis: sleepEmojis
		},
		{
			key: 'energyLevel' as const,
			label: 'Hur var dagens energinivå?',
			tooltip: 'Ange energinivå med handtaget',
			low: 'Omätbar',
			high: 'Maxad',
			emojis: energyEmojis
		},
		{
			key: 'mood' as const,
			label: 'Hur var ditt humör idag?',
			tooltip: 'Ange humör med handtaget',
			low: 'På botten',
			high: 'Strålande',
			emojis: moodEmojis
		}
	];

	function getEmojiComponent(emojis: Component[], value: number): Component {
		// value is 1-10, array is 0-indexed, round for smooth slider
		const index = Math.round(value) - 1;
		return emojis[Math.min(Math.max(index, 0), 9)];
	}
</script>

<div class="step-content">
	<p class="step-intro">Det finns inga rätt eller fel här. Bara hur det faktiskt kändes idag – i kroppen och i huvudet.</p>

	{#each sliders as slider}
		<div class="slider-group">
			<label class="slider-label" for={slider.key}>
				{slider.label}<RequiredIndicator tooltip={slider.tooltip} />
			</label>

			<div class="slider-emoji">
				{#key wizardStore.data[slider.key]}
					{@const EmojiComponent = getEmojiComponent(slider.emojis, wizardStore.data[slider.key])}
					<EmojiComponent size={32} />
				{/key}
			</div>

			<div class="slider-container">
				<span class="slider-bound">{slider.low}</span>
				<input
					type="range"
					id={slider.key}
					min="1"
					max="10"
					step="0.01"
					bind:value={wizardStore.data[slider.key]}
					class="slider"
				/>
				<span class="slider-bound">{slider.high}</span>
			</div>
		</div>
	{/each}
</div>

<style>
	.step-content {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
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

	.slider-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.slider-label {
		font-family: var(--font-primary);
		font-size: var(--text-md);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text);
	}

	.slider-emoji {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.slider-container {
		display: flex;
		align-items: center;
		gap: 0.875rem;
	}

	.slider-bound {
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		font-stretch: 105%;
		letter-spacing: var(--tracking-wider);
		color: var(--color-text-muted);
		min-width: 3.5rem;
		flex-shrink: 0;
	}

	.slider-bound:first-child {
		text-align: right;
	}

	.slider-bound:last-child {
		text-align: left;
	}

	.slider {
		flex: 1;
		-webkit-appearance: none;
		appearance: none;
		height: 3px;
		background: var(--color-border);
		border-radius: 2px;
		outline: none;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		background: var(--color-accent);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.slider:focus::-webkit-slider-thumb {
		box-shadow:
			0 0 0 3px var(--color-bg),
			0 0 0 5px color-mix(in srgb, var(--color-accent) 30%, transparent);
	}

	.slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		background: var(--color-accent);
		border: none;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
	}

	.slider::-moz-range-thumb:hover {
		transform: scale(1.1);
	}

	.slider::-moz-range-track {
		height: 3px;
		background: var(--color-border);
		border-radius: 2px;
	}

	@media (max-width: 560px) {
		.step-content {
			gap: 2rem;
		}

		.slider-group {
			gap: 0.5rem;
		}

		.slider-container {
			gap: 0.625rem;
		}

		.slider-bound {
			min-width: 2.75rem;
			font-size: 0.75rem;
		}

		.slider {
			height: 2px;
		}

		.slider::-webkit-slider-thumb {
			width: 14px;
			height: 14px;
		}

		.slider::-moz-range-thumb {
			width: 14px;
			height: 14px;
		}
	}
</style>
