<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { ageRangeOptions, genderOptions } from '$lib/data/anonymous-stories';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let content = $state('');
	let ageRange = $state('');
	let gender = $state('');
	let emotionEmoji = $state('');
	let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let message = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		status = 'submitting';
		message = '';

		try {
			const response = await fetch('/api/stories/submit', {
				method: 'POST',
				body: new FormData(form)
			});
			const result = (await response.json().catch(() => null)) as { message?: string } | null;
			message = result?.message ?? 'Något gick fel. Försök gärna igen.';
			status = response.ok ? 'success' : 'error';

			if (response.ok) {
				content = '';
				ageRange = '';
				gender = '';
				emotionEmoji = '';
				form.reset();
			}
		} catch {
			status = 'error';
			message = 'Något gick fel. Försök gärna igen.';
		}
	}
</script>

<SEO canonical="https://www.mittpsyke.se/anonyma-berattelser/dela" />

<svelte:head>
	<title>Dela en anonym berättelse | MittPsyke</title>
	<meta
		name="description"
		content="Dela en anonym berättelse om psykisk hälsa hos MittPsyke. Berättelsen granskas innan eventuell publicering."
	/>
</svelte:head>

<main class="story-form-page mx-auto w-full px-5 py-10">
	<a class="back-link" href="/anonyma-berattelser">Till anonyma berättelser</a>
	<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Dela en anonym berättelse</h1>
	<p class="intro">
		Allt är helt anonymt. Vi sparar ingen IP, inget konto, ingen identifierare.
		Berättelsen läses av vår AI och därefter manuellt innan publicering.
	</p>

	<form class="story-form" method="POST" action="/api/stories/submit" onsubmit={handleSubmit}>
		<input type="hidden" name="story_loaded_at" value={data.loadedAt} />
		<input type="hidden" name="story_load_token" value={data.loadToken} />
		<label class="honeypot" aria-hidden="true">
			Företag
			<input name="company" tabindex="-1" autocomplete="off" />
		</label>

		<label>
			<span>Din berättelse</span>
			<textarea
				name="content"
				bind:value={content}
				minlength="50"
				maxlength="2000"
				rows="10"
				required
				placeholder="Skriv i din egen takt. Undvik namn på personer, skolor eller platser."
			></textarea>
		</label>
		<p class="counter" class:counter-warning={content.length > 0 && content.length < 50}>
			{content.length}/2000 tecken
		</p>

		<div class="optional-grid">
			<label>
				<span>Ålder, valfritt</span>
				<select name="age_range" bind:value={ageRange}>
					<option value="">Vill ej ange</option>
					{#each ageRangeOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Kön, valfritt</span>
				<select name="gender" bind:value={gender}>
					<option value="">Vill ej ange</option>
					{#each genderOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Känsloemoji, valfritt</span>
				<input
					name="emotion_emoji"
					bind:value={emotionEmoji}
					maxlength="8"
					placeholder="t.ex. 🌧️"
					inputmode="text"
				/>
			</label>
		</div>

		<p class="fine-print">
			MittPsyke är inte vård, diagnos, behandling, terapi eller akuthjälp. Vid akut fara:
			ring 112. För vårdråd: kontakta 1177.
		</p>

		<button type="submit" disabled={status === 'submitting'}>
			{status === 'submitting' ? 'Skickar...' : 'Skicka berättelse'}
		</button>

		{#if message}
			<p class:success={status === 'success'} class:error={status === 'error'}>{message}</p>
		{/if}
	</form>
</main>

<style>
	.story-form-page {
		max-width: 760px;
	}

	.back-link {
		display: inline-flex;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		opacity: 0.75;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.intro,
	.fine-print {
		color: var(--color-text-muted);
		line-height: 1.7;
	}

	.story-form {
		margin-top: 1.5rem;
		display: grid;
		gap: 1rem;
		padding: 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: 1rem;
		background: var(--color-surface);
		box-shadow: 0 18px 55px rgba(15, 23, 42, 0.08);
	}

	label {
		display: grid;
		gap: 0.45rem;
		font-weight: 650;
	}

	textarea,
	select,
	input {
		width: 100%;
		border: 1px solid var(--color-border);
		border-radius: 0.8rem;
		background: var(--color-bg);
		color: var(--color-text);
		padding: 0.8rem 0.9rem;
		font: inherit;
		font-weight: 500;
	}

	textarea {
		resize: vertical;
		line-height: 1.6;
	}

	textarea:focus,
	select:focus,
	input:focus {
		outline: 3px solid var(--color-focus);
		outline-offset: 2px;
	}

	.counter {
		margin-top: -0.5rem;
		color: var(--color-text-muted);
		font-size: 0.9rem;
		text-align: right;
	}

	.counter-warning {
		color: var(--color-warning);
	}

	.optional-grid {
		display: grid;
		gap: 1rem;
	}

	button {
		width: fit-content;
		border: 0;
		border-radius: 999px;
		background: var(--color-primary);
		color: white;
		padding: 0.85rem 1.25rem;
		font-weight: 750;
		cursor: pointer;
	}

	button:hover {
		background: var(--color-primary-hover);
	}

	button:disabled {
		cursor: wait;
		opacity: 0.7;
	}

	.success {
		color: var(--color-success);
		font-weight: 650;
	}

	.error {
		color: var(--color-danger);
		font-weight: 650;
	}

	.honeypot {
		position: absolute;
		left: -10000px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}

	@media (min-width: 720px) {
		.optional-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
