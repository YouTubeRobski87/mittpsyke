<script lang="ts">
	import { onMount } from 'svelte';
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { EmojiUserSilhouette, EmojiCompass, EmojiChart, EmojiCalendar, EmojiScale, EmojiMirror, EmojiCherries, EmojiCamera, EmojiSpeakingHead, EmojiPuzzlePiece, EmojiCheck } from '$lib/assets/emojis';
	import UniqueEmoji from '$lib/components/UniqueEmoji.svelte';
	import Step0Profile from './steps/Step0Profile.svelte';
	import Step1Emojis from './steps/Step1Emojis.svelte';
	import Step2Energy from './steps/Step2Energy.svelte';
	import Step3Activities from './steps/Step3Activities.svelte';
	import Step4WinsFrustrations from './steps/Step4WinsFrustrations.svelte';
	import Step5Reflection from './steps/Step5Reflection.svelte';
	import Step6FoodMusic from './steps/Step6FoodMusic.svelte';
	import Step7TimeCapsule from './steps/Step7TimeCapsule.svelte';
	import Step8Voice from './steps/Step8Voice.svelte';
	import Step9Addons from './steps/Step9Addons.svelte';
	import Step10Summary from './steps/Step10Summary.svelte';
	import LegalFooter from '$lib/components/LegalFooter.svelte';
	import IconArrowLeft from '$lib/assets/icons/IconArrowLeft.svelte';
	import IconArrowRight from '$lib/assets/icons/IconArrowRight.svelte';

	const optionalSteps = [0, 5, 6, 7, 9];

	onMount(async () => {
		// Load profile and skip Step 0 for logged-in users
		await wizardStore.initProfile();
		// Restore any saved draft progress
		await wizardStore.restoreDraft('wizard');
		// Fetch weather silently in the background (fails silently if denied or unavailable)
		wizardStore.initWeather();
	});

	let currentStep = $derived(wizardStore.currentStep);
	let isResultView = $derived(wizardStore.isResultView);

	// Access data reactively to trigger re-renders
	let data = $derived(wizardStore.data);

	// Button logic - compute validity based on current step and data
	let isCurrentStepOptional = $derived(optionalSteps.includes(currentStep));

	let isCurrentStepValid = $derived.by(() => {
		switch (currentStep) {
			case 0: // Profile - optional
				return true;
			case 1: // Date & Emojis - emojis required
				return data.emojis.length > 0;
			case 2: // Sleep & Energy - has defaults, always valid
				return true;
			case 3: // Where & What - locations and activities required
				return (
					(data.locations.length > 0 || data.customLocations.length > 0) &&
					(data.activities.length > 0 || data.customActivities.length > 0)
				);
			case 4: // Wins & Frustrations - at least one win required
				return data.wins.some((w) => w.trim() !== '');
			case 5: // Reflections - optional
				return true;
			case 6: // Food & Music - optional
				return true;
			case 7: // Time Capsule - optional
				return true;
			case 8: // AI Voice - has default, always valid
				return data.selectedTone.trim() !== '';
			case 9: // Add-ons - optional
				return true;
			case 10: // Summary - no next button needed
				return true;
			default:
				return true;
		}
	});

	let hasFilledOptionalFields = $derived.by(() => {
		switch (currentStep) {
			case 0: // Profile
				return (
					data.profile.name.trim() !== '' ||
					data.profile.birthday !== null ||
					data.profile.pronouns.trim() !== '' ||
					data.profile.hometown.trim() !== '' ||
					data.profile.family.length > 0 ||
					data.profile.pets.length > 0 ||
					data.profile.occupationType !== '' ||
					data.profile.occupationDetail.length > 0 ||
					data.profile.interests.length > 0
				);
			case 5: // Reflections
				return (
					data.almostHappened.trim() !== '' ||
					data.unnecessaryThing.trim() !== '' ||
					data.wouldRedo.trim() !== ''
				);
			case 6: // Food & Music
				return (
					data.meals.length > 0 ||
					data.customMeals.length > 0 ||
					data.soundtracks.length > 0 ||
					data.customSoundtracks.length > 0 ||
					data.moodColor !== ''
				);
			case 7: // Time Capsule
				return data.memoryFor10Years.trim() !== '';
			case 9: // Add-ons
				return data.includeHoroscope || data.includeOnThisDay || data.includeHomework;
			default:
				return false;
		}
	});

	// Determine button text and state
	let showNextButton = $derived(currentStep < wizardStore.totalSteps - 1); // Hide on summary (step 9)
	let nextButtonDisabled = $derived(!isCurrentStepOptional && !isCurrentStepValid);
	let nextButtonText = $derived.by(() => {
		if (!isCurrentStepOptional) {
			return 'Fortsätt';
		}
		// Optional step: show "Hoppa över" only if no fields filled, otherwise "Fortsätt"
		return hasFilledOptionalFields ? 'Fortsätt' : 'Hoppa över';
	});

	// Tooltip messages for disabled button per step
	let disabledTooltip = $derived.by(() => {
		switch (currentStep) {
			case 1:
				return 'Välj minst en emoji';
			case 3:
				return 'Lägg till minst en plats och en händelse';
			case 4:
				return 'Ange minst en bra sak från idag';
			case 8:
				return 'Välj en röst för att fortsätta';
			default:
				return 'Fyll i obligatoriska fält för att fortsätta';
		}
	});

	const stepTitles = [
		'Lite om dig',
		'Hur var din dag?',
		'Hur mådde du?',
		'Vad hände idag?',
		'Vinster & Motgångar',
		'Reflektioner',
		'Sinnesintryck',
		'Minnesvärt',
		'Välj en röst',
		'Tillägg',
		'Allt på plats'
	];
	const stepIcons = [
		EmojiUserSilhouette,
		EmojiCompass,
		EmojiChart,
		EmojiCalendar,
		EmojiScale,
		EmojiMirror,
		EmojiCherries,
		EmojiCamera,
		EmojiSpeakingHead,
		EmojiPuzzlePiece,
		EmojiCheck
	];

	function isOptional(step: number): boolean {
		return optionalSteps.includes(step);
	}

	// Scroll to top when step changes
	$effect(() => {
		currentStep; // Track the step
		window.scrollTo({ top: 0, behavior: 'instant' });
	});

	function getStepTitle(step: number): string {
		return stepTitles[step] || '';
	}
</script>

<main class="wizard" class:result-view={isResultView}>
	{#if isResultView}
		<!-- No header in result view - cleaner presentation -->
	{:else}
		<header class="wizard-header">
			<div class="step-indicator">
				{#if stepIcons[currentStep]}
					{@const StepIcon = stepIcons[currentStep]}
					<div class="step-icon"><UniqueEmoji><StepIcon size={72} /></UniqueEmoji></div>
				{/if}
				<h1 class="step-title">
					<span class="step-title-text">
						{getStepTitle(currentStep)}
						{#if isOptional(currentStep)}
							<span class="optional-badge">Valfritt</span>
						{/if}
					</span>
				</h1>
			</div>
		</header>
	{/if}

	<div class="wizard-content">
		{#if currentStep === 0}
			<Step0Profile />
		{:else if currentStep === 1}
			<Step1Emojis />
		{:else if currentStep === 2}
			<Step2Energy />
		{:else if currentStep === 3}
			<Step3Activities />
		{:else if currentStep === 4}
			<Step4WinsFrustrations />
		{:else if currentStep === 5}
			<Step5Reflection />
		{:else if currentStep === 6}
			<Step6FoodMusic />
		{:else if currentStep === 7}
			<Step7TimeCapsule />
		{:else if currentStep === 8}
			<Step8Voice />
		{:else if currentStep === 9}
			<Step9Addons />
		{:else if currentStep === 10}
			<Step10Summary />
		{/if}
	</div>

	{#if !isResultView}
		<footer class="wizard-footer">
			{#if currentStep > 0 && !(authStore.isLoggedIn && currentStep === 1)}
				<button class="btn btn-secondary" onclick={() => wizardStore.prevStep()}>
					<IconArrowLeft size={16} /> Tillbaka
				</button>
			{:else}
				<a href="/" class="btn btn-secondary"><IconArrowLeft size={16} /> Tillbaka</a>
			{/if}

			{#if showNextButton}
				<div class="next-btn-wrapper" class:disabled={nextButtonDisabled}>
					<button
						class="btn btn-primary"
						class:btn-disabled={nextButtonDisabled}
						onclick={() => {
							// Use setTimeout to allow blur handlers to complete and update state first
							setTimeout(() => {
								if (wizardStore.isStepValid(currentStep)) {
									wizardStore.nextStep();
								}
							}, 0);
						}}
						aria-disabled={nextButtonDisabled}
					>
						{nextButtonText} <IconArrowRight size={16} />
					</button>
					{#if nextButtonDisabled}
						<span class="disabled-tooltip">{disabledTooltip}</span>
					{/if}
				</div>
			{:else}
				<div></div>
			{/if}
		</footer>
		<LegalFooter />
	{/if}
</main>

<style>
	.wizard {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		max-width: 720px;
		margin: 0 auto;
		padding: 1.75rem 1.25rem;
	}

	.wizard-header {
		margin-bottom: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

.step-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		text-align: center;
	}


	.wizard.result-view {
		padding: 1.25rem 1.25rem 2rem;
	}

.step-title {
		font-family: var(--font-primary);
		font-size: var(--text-3xl);
		font-weight: var(--weight-medium);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		line-height: var(--leading-snug);
		margin-top: 0;
	}

	.step-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.8;
	}

	.step-title-text {
		position: relative;
	}

	.optional-badge {
		position: absolute;
		left: 100%;
		top: 50%;
		transform: translateY(-50%);
		margin-left: 0.75rem;
		white-space: nowrap;
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		font-stretch: 110%;
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--color-text-muted);
		background-color: var(--color-neutral);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.wizard-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.wizard-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 2.25rem;
		margin-top: auto;
	}

	@media (max-width: 600px) {
		.wizard {
			padding: calc(env(safe-area-inset-top, 0px) + 1.25rem) 1rem 1.25rem;
		}

		.wizard.result-view {
			padding: calc(env(safe-area-inset-top, 0px) + 1rem) 1rem 1.5rem;
		}

		.step-title {
			font-size: var(--text-xl);
		}

		.optional-badge {
			position: static;
			transform: none;
			margin-left: 0;
			margin-top: 0.25rem;
		}

		.step-title-text {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0.25rem;
		}

	}

	@media (max-width: 480px) {
		.wizard-footer {
			flex-direction: column;
			gap: 0.75rem;
		}

		.wizard-footer > .btn,
		.wizard-footer > a.btn {
			width: 100%;
			align-self: stretch;
		}

		.wizard-footer .btn {
			width: 100%;
		}
	}

	.next-btn-wrapper {
		position: relative;
	}

	.disabled-tooltip {
		position: absolute;
		bottom: calc(100% + 10px);
		left: 50%;
		transform: translateX(-50%);
		padding: 0.5rem 0.75rem;
		background-color: var(--color-bg-elevated);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-snug);
		white-space: nowrap;
		border-radius: var(--radius-sm);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		opacity: 0;
		visibility: hidden;
		transition: opacity 0.15s ease 0.1s, visibility 0.15s ease 0.1s;
		pointer-events: none;
		z-index: 100;
	}

	.disabled-tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 6px solid transparent;
		border-top-color: var(--color-border);
	}

	.disabled-tooltip::before {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-top: -1px;
		border: 5px solid transparent;
		border-top-color: var(--color-bg-elevated);
		z-index: 1;
	}

	.next-btn-wrapper.disabled:hover .disabled-tooltip {
		opacity: 1;
		visibility: visible;
	}

	/* Touch devices: show on tap/active */
	@media (hover: none) {
		.next-btn-wrapper.disabled:active .disabled-tooltip {
			opacity: 1;
			visibility: visible;
		}
	}

	@media (max-width: 480px) {
		.next-btn-wrapper {
			width: 100%;
		}

		.disabled-tooltip {
			white-space: normal;
			text-align: center;
			max-width: 200px;
		}
	}
</style>
