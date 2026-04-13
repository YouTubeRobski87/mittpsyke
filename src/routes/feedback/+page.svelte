<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';

	type FeedbackForm = {
		experience: string;
		whatWorked: string;
		unclear: string;
		missing: string;
		useAgain: string;
		other: string;
	};

	type ValidationErrors = {
		experience?: string;
		useAgain?: string;
	};

	const experienceOptions = ['Väldigt bra', 'Bra', 'Okej', 'Inte så bra'];
	const useAgainOptions = ['Ja', 'Kanske', 'Nej'];

	function createInitialForm(): FeedbackForm {
		return {
			experience: '',
			whatWorked: '',
			unclear: '',
			missing: '',
			useAgain: '',
			other: ''
		};
	}

	let form = $state<FeedbackForm>(createInitialForm());
	let errors = $state<ValidationErrors>({});
	let isSubmitted = $state(false);

	function clearError(field: keyof ValidationErrors) {
		if (errors[field]) {
			errors = { ...errors, [field]: undefined };
		}
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		const nextErrors: ValidationErrors = {};

		if (!form.experience) {
			nextErrors.experience = 'Välj det alternativ som passar bäst.';
		}

		if (!form.useAgain) {
			nextErrors.useAgain = 'Välj om du skulle använda MittPsyke igen.';
		}

		errors = nextErrors;

		if (Object.keys(nextErrors).length > 0) {
			return;
		}

		isSubmitted = true;
		form = createInitialForm();
	}
</script>

<SEO canonical="https://www.mittpsyke.se/feedback" />

<svelte:head>
	<title>Feedback | MittPsyke</title>
	<meta
		name="description"
		content="Lämna lugn och enkel feedback om MittPsyke. Det hjälper oss att göra sidan tydligare, tryggare och mer hjälpsam."
	/>
</svelte:head>

<main class="feedback-page">
	<div class="feedback-shell">
		<header class="feedback-intro">
			<h1>Hjälp oss förbättra MittPsyke</h1>
			<p>Feedback hjälper oss att göra sidan tydligare, tryggare och mer hjälpsam.</p>
		</header>

		<section class="feedback-card" aria-labelledby="feedback-form-title">
			{#if isSubmitted}
				<div class="success-state" role="status" aria-live="polite">
					<h2 id="feedback-form-title">Tack</h2>
					<p>Tack för att du hjälper oss förbättra MittPsyke.</p>
					<button type="button" class="secondary-button" onclick={() => (isSubmitted = false)}>
						Skicka mer feedback
					</button>
				</div>
			{:else}
				<form class="feedback-form" novalidate onsubmit={handleSubmit}>
					<div class="form-heading">
						<h2 id="feedback-form-title">Berätta gärna hur det kändes</h2>
						<p>Du kan svara kort. Några ord räcker.</p>
					</div>

					<fieldset class="field-group" aria-describedby={errors.experience ? 'experience-error' : undefined}>
						<legend>Hur upplevde du sidan?</legend>
						<div class="radio-group">
							{#each experienceOptions as option}
								<label class="radio-option">
									<input
										type="radio"
										name="experience"
										value={option}
										bind:group={form.experience}
										onchange={() => clearError('experience')}
									/>
									<span>{option}</span>
								</label>
							{/each}
						</div>
						{#if errors.experience}
							<p id="experience-error" class="field-error" role="alert">{errors.experience}</p>
						{/if}
					</fieldset>

					<div class="field-group">
						<label for="what-worked">Vad fungerade bra?</label>
						<textarea
							id="what-worked"
							name="whatWorked"
							rows="4"
							bind:value={form.whatWorked}
							placeholder="Det kan vara något som kändes tydligt, lugnt eller hjälpsamt."
						></textarea>
					</div>

					<div class="field-group">
						<label for="unclear">Vad var otydligt eller svårt?</label>
						<textarea
							id="unclear"
							name="unclear"
							rows="4"
							bind:value={form.unclear}
							placeholder="Berätta gärna om något som kändes rörigt eller svårt."
						></textarea>
					</div>

					<div class="field-group">
						<label for="missing">Vad saknar du?</label>
						<textarea
							id="missing"
							name="missing"
							rows="4"
							bind:value={form.missing}
							placeholder="Det kan vara en funktion, en förklaring eller ett stöd du hade velat hitta."
						></textarea>
					</div>

					<fieldset class="field-group" aria-describedby={errors.useAgain ? 'use-again-error' : undefined}>
						<legend>Skulle du använda MittPsyke igen?</legend>
						<div class="radio-group radio-group-compact">
							{#each useAgainOptions as option}
								<label class="radio-option">
									<input
										type="radio"
										name="useAgain"
										value={option}
										bind:group={form.useAgain}
										onchange={() => clearError('useAgain')}
									/>
									<span>{option}</span>
								</label>
							{/each}
						</div>
						{#if errors.useAgain}
							<p id="use-again-error" class="field-error" role="alert">{errors.useAgain}</p>
						{/if}
					</fieldset>

					<div class="field-group">
						<label for="other">Övrigt</label>
						<textarea
							id="other"
							name="other"
							rows="4"
							bind:value={form.other}
							placeholder="Något mer du vill skicka med."
						></textarea>
					</div>

					<p class="privacy-note">
						Skriv inte känsliga personuppgifter i formuläret. Din feedback används för att förbättra sidan och upplevelsen.
					</p>

					<button type="submit" class="submit-button">Skicka feedback</button>
				</form>
			{/if}
		</section>
	</div>
</main>

<style>
	.feedback-page {
		padding: clamp(2rem, 5vw, 3rem) 1rem clamp(3rem, 7vw, 4rem);
	}

	.feedback-shell {
		max-width: 720px;
		margin: 0 auto;
		display: grid;
		gap: 1.25rem;
	}

	.feedback-intro h1,
	.form-heading h2,
	.success-state h2 {
		margin: 0;
		font-family: var(--font-heading);
		letter-spacing: -0.02em;
	}

	.feedback-intro h1 {
		font-size: clamp(1.9rem, 1.55rem + 1.35vw, 2.4rem);
		font-weight: 800;
		line-height: 1.08;
	}

	.feedback-intro p,
	.form-heading p,
	.success-state p {
		margin: 0.75rem 0 0;
		font-size: clamp(1rem, 0.96rem + 0.25vw, 1.05rem);
		line-height: 1.7;
		opacity: 0.82;
	}

	.feedback-card {
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(15, 23, 42, 0.1);
		background: rgba(248, 250, 252, 0.82);
	}

	.feedback-form {
		display: grid;
		gap: 1rem;
	}

	.form-heading h2,
	.success-state h2 {
		font-size: 1.18rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.field-group {
		margin: 0;
		padding: 0;
		border: 0;
		display: grid;
		gap: 0.55rem;
	}

	.field-group label,
	.field-group legend {
		font-size: 0.98rem;
		font-weight: 600;
		line-height: 1.4;
	}

	textarea {
		width: 100%;
		min-height: 7rem;
		padding: 0.9rem 1rem;
		border-radius: var(--radius-input);
		border: 1px solid rgba(15, 23, 42, 0.12);
		background: #ffffff;
		font: inherit;
		line-height: 1.6;
		color: inherit;
		resize: vertical;
		outline: none;
		transition: border-color 160ms ease, box-shadow 160ms ease;
	}

	textarea::placeholder {
		color: rgba(15, 23, 42, 0.48);
	}

	textarea:focus-visible {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.16);
	}

	.radio-group {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.65rem;
	}

	.radio-group-compact {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.radio-option {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.8rem 0.9rem;
		border-radius: var(--radius-input);
		border: 1px solid rgba(15, 23, 42, 0.1);
		background: rgba(255, 255, 255, 0.9);
		cursor: pointer;
		transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
	}

	.radio-option:has(input:checked) {
		border-color: rgba(15, 118, 110, 0.35);
		background: rgba(226, 240, 236, 0.72);
	}

	.radio-option:has(input:focus-visible) {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.16);
	}

	.radio-option input {
		margin: 0;
		accent-color: var(--primary);
	}

	.field-error {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.55;
		color: #b42318;
	}

	.privacy-note {
		margin: 0;
		padding: 0.9rem 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(15, 118, 110, 0.14);
		background: rgba(226, 240, 236, 0.68);
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.submit-button,
	.secondary-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.9rem;
		padding: 0.8rem 1.15rem;
		border-radius: var(--radius-input);
		border: 1px solid transparent;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 160ms ease, box-shadow 160ms ease;
	}

	.submit-button {
		background: var(--primary);
		color: #ffffff;
	}

	.secondary-button {
		margin-top: 1rem;
		background: rgba(255, 255, 255, 0.9);
		border-color: rgba(15, 23, 42, 0.1);
	}

	.submit-button:hover,
	.secondary-button:hover {
		opacity: 0.92;
	}

	.submit-button:focus-visible,
	.secondary-button:focus-visible {
		outline: 2px solid rgba(15, 118, 110, 0.45);
		outline-offset: 3px;
	}

	@media (max-width: 640px) {
		.feedback-page {
			padding-inline: 0.9rem;
		}

		.feedback-card {
			padding: 0.95rem;
		}

		.radio-group,
		.radio-group-compact {
			grid-template-columns: 1fr;
		}

		textarea {
			min-height: 6.5rem;
		}
	}

	:global(.dark) .feedback-card {
		border-color: rgba(255, 255, 255, 0.08);
		background: rgba(18, 25, 31, 0.94);
	}

	:global(.dark) textarea,
	:global(.dark) .radio-option,
	:global(.dark) .secondary-button {
		background: rgba(255, 255, 255, 0.04);
		border-color: rgba(255, 255, 255, 0.12);
		color: #f8fafc;
	}

	:global(.dark) textarea::placeholder {
		color: rgba(248, 250, 252, 0.48);
	}

	:global(.dark) .radio-option:has(input:checked) {
		background: rgba(15, 118, 110, 0.18);
	}

	:global(.dark) .privacy-note {
		background: rgba(15, 118, 110, 0.14);
		border-color: rgba(134, 223, 214, 0.18);
	}

	:global(.dark) .field-error {
		color: #fda29b;
	}
</style>
