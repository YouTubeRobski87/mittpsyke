<script lang="ts">
	import { onMount } from 'svelte';
	import type { ComprehensionAnswer } from '$lib/server/framsteg-comprehension';

	let { enabled = false }: { enabled?: boolean } = $props();

	const STORAGE_KEY = 'mittpsyke:framsteg-comprehension:v1';
	const answers: { value: ComprehensionAnswer; label: string }[] = [
		{ value: 'yes', label: 'Ja' },
		{ value: 'partial', label: 'Delvis' },
		{ value: 'no', label: 'Nej' }
	];

	let ready = $state(false);
	let clarity = $state<ComprehensionAnswer | null>(null);
	let submitting = $state(false);
	let submitted = $state(false);
	let error = $state('');

	onMount(() => {
		if (!enabled) return;
		try {
			ready = window.localStorage.getItem(STORAGE_KEY) !== 'answered';
		} catch {
			ready = true;
		}
	});

	function chooseClarity(answer: ComprehensionAnswer) {
		clarity = answer;
		error = '';
	}

	async function chooseWorldChange(worldChange: ComprehensionAnswer) {
		if (!clarity || submitting) return;
		submitting = true;
		error = '';

		try {
			const response = await fetch('/api/framsteg/comprehension', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ clarity, worldChange })
			});

			if (!response.ok) throw new Error('save_failed');

			try {
				window.localStorage.setItem(STORAGE_KEY, 'answered');
			} catch {
				// Serverns unika pseudonym hindrar ändå dubbla lagrade svar.
			}
			submitted = true;
		} catch {
			error = 'Det gick inte att spara svaret just nu. Försök gärna igen.';
		} finally {
			submitting = false;
		}
	}
</script>

{#if ready}
	<section class="comprehension-card" aria-labelledby="comprehension-heading" data-testid="framsteg-comprehension">
		{#if submitted}
			<div class="receipt" role="status" aria-live="polite">
				<h2 id="comprehension-heading">Tack för ditt svar</h2>
				<p>Det hjälper oss att göra Framsteg lättare att förstå.</p>
			</div>
		{:else}
			<div class="intro">
				<p class="eyebrow">Frivillig fråga</p>
				<h2 id="comprehension-heading">
					{clarity === null
						? 'Var det tydligt vad Framsteg visar?'
						: 'Förstod du vad världen förändras av?'}
				</h2>
			</div>

			<div class="answers" aria-label={clarity === null ? 'Svar på fråga 1' : 'Svar på fråga 2'}>
				{#each answers as answer}
					<button
						type="button"
						disabled={submitting}
						onclick={() =>
							clarity === null ? chooseClarity(answer.value) : chooseWorldChange(answer.value)}
					>
						{answer.label}
					</button>
				{/each}
			</div>

			{#if error}<p class="error" role="alert">{error}</p>{/if}
			<p class="privacy-copy">Vi använder svaret bara för att förstå om Framsteg är tydligt.</p>
		{/if}
	</section>
{/if}

<style>
	.comprehension-card {
		width: min(100%, 38rem);
		margin: 0 auto;
		padding: 1rem;
		border: 1px solid hsl(var(--muted-foreground) / 0.75);
		border-radius: 16px;
		background: hsl(var(--card) / 0.72);
		color: hsl(var(--foreground));
		box-shadow: 0 8px 22px hsl(var(--foreground) / 0.04);
	}

	.intro,
	.receipt {
		display: grid;
		gap: 0.35rem;
	}

	.eyebrow,
	h2,
	p {
		margin: 0;
	}

	.eyebrow,
	.privacy-copy {
		color: hsl(var(--muted-foreground));
		font-size: 0.82rem;
	}

	h2 {
		font-family: var(--font-heading);
		font-size: clamp(1rem, 0.94rem + 0.25vw, 1.15rem);
		line-height: 1.35;
	}

	.answers {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.5rem;
		margin-top: 0.85rem;
	}

	button {
		min-height: 44px;
		padding: 0.6rem 0.75rem;
		border: 1px solid hsl(var(--muted-foreground) / 0.75);
		border-radius: 12px;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font: inherit;
		font-weight: 650;
		cursor: pointer;
	}

	button:hover:not(:disabled) {
		border-color: hsl(var(--primary) / 0.65);
		background: hsl(var(--primary) / 0.07);
	}

	button:focus-visible {
		outline: 3px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	button:disabled {
		cursor: wait;
		opacity: 0.65;
	}

	.privacy-copy,
	.error {
		margin-top: 0.75rem;
		line-height: 1.45;
	}

	.error {
		color: hsl(var(--destructive));
		font-size: 0.88rem;
	}

	.receipt p {
		color: hsl(var(--muted-foreground));
		line-height: 1.5;
	}

	:global(.dark) .comprehension-card {
		background: hsl(var(--card) / 0.82);
		box-shadow: none;
	}

	@media (max-width: 340px) {
		.comprehension-card {
			padding: 0.85rem;
		}

		.answers {
			gap: 0.35rem;
		}

		button {
			padding-inline: 0.45rem;
		}
	}
</style>
