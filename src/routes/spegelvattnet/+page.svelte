<script lang="ts">
	import { onMount } from 'svelte';
	import SEO from '$lib/components/SEO.svelte';
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';

	type Reflection = {
		id: string;
		week_start: string;
		words: string[] | unknown;
		quoted_sentence: string | null;
		movement: string | null;
		open_question: string | null;
		status: 'ready' | 'paused' | 'opened' | 'expired';
		paused_reason: string | null;
	};

	type PageData = {
		reflection: Reflection | null;
	};

	let { data } = $props<{ data: PageData }>();
	const reflection = $derived(data.reflection);
	const words = $derived(
		Array.isArray(reflection?.words)
			? reflection.words.filter((word: unknown): word is string => typeof word === 'string')
			: []
	);
	const openQuestion = $derived(reflection?.open_question || 'Vad vill du ta med dig från veckan som varit?');
	const diaryHref = $derived(
		`/dagbok/checkin?prefill=${encodeURIComponent(`${openQuestion}\n\n`)}#skriv-sjalv`
	);
	const weekLabel = $derived(reflection ? formatWeekLabel(reflection.week_start) : '');

	function formatWeekLabel(weekStart: string) {
		const date = new Date(`${weekStart}T00:00:00Z`);
		const weekNumber = getIsoWeek(date);
		return `Vecka ${weekNumber}, ${date.getUTCFullYear()}`;
	}

	function getIsoWeek(date: Date) {
		const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
		const dayNumber = target.getUTCDay() || 7;
		target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
		const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
		return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	}

	onMount(() => {
		if (reflection?.status === 'ready') {
			void fetch(`/api/spegelvattnet/${reflection.id}/open`, { method: 'POST' });
		}
	});
</script>

<SEO canonical="https://www.mittpsyke.se/spegelvattnet" />

<main class="auth-page spegel-page">
	<PortalSubnav
		active="dashboard"
		title="Spegelvattnet"
		description="En stilla veckospegling av det du själv har skrivit."
	/>

	<div class="auth-shell">
		{#if !reflection}
			<section class="spegel-shell spegel-empty">
				<p class="spegel-kicker">Spegelvattnet</p>
				<h2>Spegelvattnet är stilla.</h2>
				<p>Det fylls på när du skrivit lite mer.</p>
				<a href="/dashboard" class="auth-button">Till Min portal</a>
			</section>
		{:else if reflection.status === 'paused'}
			<section class="spegel-shell spegel-empty">
				<p class="spegel-kicker">Spegelvattnet</p>
				<h2>Spegelvattnet är stilla den här veckan.</h2>
				<p>
					Om något känns tungt, finns Stödlinjer alltid där: stodlinjer.se. Vid akut fara, ring 112.
				</p>
				<a href="https://stodlinjer.se" class="auth-button" rel="noreferrer">Öppna stödlinjer</a>
			</section>
		{:else}
			<article class="spegel-shell">
				<header class="spegel-head">
					<p class="spegel-kicker">Spegelvattnet</p>
					<h2>{weekLabel}</h2>
				</header>

				{#if words.length > 0}
					<section class="spegel-section">
						<h3>Ord du återkommit till</h3>
						<p class="word-line">{words.join(' · ')}</p>
					</section>
				{/if}

				{#if reflection.quoted_sentence}
					<section class="spegel-section">
						<h3>En mening från dig</h3>
						<blockquote>{reflection.quoted_sentence}</blockquote>
					</section>
				{/if}

				{#if reflection.movement}
					<section class="spegel-section">
						<h3>Något har rört sig</h3>
						<p>{reflection.movement}</p>
					</section>
				{/if}

				<section class="spegel-section">
					<h3>En fråga att ta med</h3>
					<p class="open-question">{openQuestion}</p>
				</section>

				<div class="spegel-actions">
					<a href={diaryHref} class="auth-button primary">Skriv om det här</a>
					<a href="/dashboard" class="auth-button">Stäng</a>
				</div>
			</article>
		{/if}
	</div>
</main>

<style>
	.spegel-page {
		background:
			radial-gradient(circle at 50% 0%, rgba(96, 165, 250, 0.13), transparent 34%),
			hsl(var(--background));
	}

	.spegel-shell {
		max-width: 48rem;
		margin: 0 auto;
		padding: clamp(1.5rem, 5vw, 4rem);
		border: 1px solid rgba(148, 163, 184, 0.22);
		border-radius: var(--radius-card);
		background: linear-gradient(180deg, hsl(222 34% 14%), hsl(224 32% 10%));
		color: hsl(210 40% 96%);
		box-shadow: 0 20px 44px rgba(15, 23, 42, 0.18);
	}

	.spegel-head {
		margin-bottom: clamp(2rem, 6vw, 4rem);
	}

	.spegel-kicker {
		margin: 0;
		font-size: 0.78rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: hsl(214 32% 84% / 0.68);
	}

	.spegel-head h2,
	.spegel-empty h2 {
		margin: 0.55rem 0 0;
		font-size: clamp(1.35rem, 1.1rem + 1vw, 2rem);
	}

	.spegel-section {
		padding-block: clamp(1.35rem, 4vw, 2.35rem);
		border-top: 1px solid rgba(226, 232, 240, 0.14);
	}

	.spegel-section h3 {
		margin: 0 0 1rem;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: hsl(214 32% 84% / 0.68);
	}

	.spegel-section p,
	.spegel-empty p {
		margin: 0;
		font-size: 1.05rem;
		line-height: 1.8;
		color: hsl(210 40% 94% / 0.9);
	}

	.word-line {
		font-size: clamp(1.2rem, 1rem + 1vw, 1.75rem) !important;
		line-height: 1.6 !important;
	}

	blockquote {
		margin: 0;
		padding: 0 0 0 1rem;
		border-left: 2px solid rgba(191, 219, 254, 0.45);
		font-size: clamp(1.3rem, 1.05rem + 1vw, 1.9rem);
		line-height: 1.65;
		color: hsl(210 40% 98%);
	}

	.open-question {
		font-size: clamp(1.2rem, 1rem + 0.8vw, 1.65rem) !important;
	}

	.spegel-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(226, 232, 240, 0.14);
	}

	.spegel-empty {
		display: grid;
		gap: 1rem;
	}

	.spegel-shell .auth-button:not(.primary) {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(226, 232, 240, 0.16);
		color: hsl(210 40% 96%);
	}

	@media (max-width: 640px) {
		.spegel-shell {
			border-radius: var(--radius-input);
		}

		.spegel-actions .auth-button {
			width: 100%;
		}
	}
</style>
