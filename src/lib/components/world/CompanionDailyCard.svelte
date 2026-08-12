<script lang="ts">
	import type { CompanionDailyQuestion } from '$lib/companionDailyQuestion';

	// Kompakt svarskort under scenen. Kortet håller bara svarsalternativen -
	// själva frågan står i följeslagarens talbubbla i världen, så det här aldrig
	// läses som ett formulär. Ingen modal, ingen overlay: världen syns hela tiden.
	let {
		question,
		companionName = 'Din följeslagare',
		busy = false,
		onanswer,
		onskip
	}: {
		question: CompanionDailyQuestion;
		companionName?: string;
		busy?: boolean;
		onanswer: (answerId: string) => void;
		onskip: () => void;
	} = $props();
</script>

<section class="companion-daily" aria-label={`Fråga från ${companionName}`}>
	<p class="companion-daily-question">{question.text}</p>
	<div class="companion-daily-answers">
		{#each question.answers as answer (answer.id)}
			<button type="button" disabled={busy} onclick={() => onanswer(answer.id)}>
				{answer.label}
			</button>
		{/each}
	</div>
	<button class="companion-daily-skip" type="button" disabled={busy} onclick={onskip}>
		Hoppa över
	</button>
</section>

<style>
	.companion-daily {
		grid-area: daily;
		position: relative;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 0.75rem;
		min-width: 0;
		padding: clamp(0.75rem, 1.2vw, 1rem) clamp(0.85rem, 1.4vw, 1.15rem);
		border: 1px solid rgba(160, 188, 220, 0.18);
		border-radius: 16px;
		background: rgba(17, 27, 43, 0.88);
		box-shadow: 0 14px 36px rgba(69, 83, 61, 0.07);
	}

	/* Liten spets uppåt mot scenen ovanför. Den sitter i höjd med följeslagarens
	   plats i stugscenen (x ~35 %), så kortet läses som djurets replik och inte
	   som ett formulär från systemet. Rent dekorativ. */
	.companion-daily::before {
		content: '';
		position: absolute;
		top: -6px;
		left: 32%;
		width: 11px;
		height: 11px;
		border-top: 1px solid rgba(160, 188, 220, 0.18);
		border-left: 1px solid rgba(160, 188, 220, 0.18);
		background: rgba(17, 27, 43, 0.88);
		transform: rotate(45deg);
	}

	.companion-daily-question {
		flex: 1 1 12rem;
		min-width: 0;
		margin: 0;
		color: #f4f1e9;
		font-size: 0.98rem;
		line-height: 1.35;
	}

	/* Chippen får wrappa fritt. Inget minsta bredd-värde som kan tvinga fram
	   horisontell overflow på 320 px. */
	.companion-daily-answers {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		min-width: 0;
	}

	.companion-daily-answers button,
	.companion-daily-skip {
		min-height: 40px;
		max-width: 100%;
		padding: 0.42rem 0.85rem;
		border: 1px solid rgba(160, 188, 220, 0.24);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.06);
		color: #f4f1e9;
		font: inherit;
		font-size: 0.9rem;
		font-weight: 650;
		line-height: 1.25;
		overflow-wrap: anywhere;
		cursor: pointer;
		transition:
			background-color 0.16s ease,
			transform 0.16s ease;
	}

	.companion-daily-answers button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.12);
		transform: translateY(-1px);
	}

	/* Hoppa över ska vara lika lätt att välja som ett svar, men inte lika
	   framträdande - aldrig gömd, aldrig påträngande. */
	.companion-daily-skip {
		margin-left: auto;
		border-color: transparent;
		background: none;
		color: #c5cbd6;
		font-weight: 600;
	}

	.companion-daily-skip:hover:not(:disabled) {
		color: #f4f1e9;
	}

	.companion-daily-answers button:disabled,
	.companion-daily-skip:disabled {
		opacity: 0.6;
		cursor: default;
	}

	@media (max-width: 620px) {
		.companion-daily {
			gap: 0.55rem;
		}

		.companion-daily-question {
			flex-basis: 100%;
			font-size: 0.92rem;
		}

		.companion-daily-answers {
			flex-basis: 100%;
		}

		.companion-daily-answers button {
			flex: 1 1 auto;
			padding: 0.4rem 0.7rem;
			font-size: 0.85rem;
		}

		.companion-daily-skip {
			margin-left: 0;
			padding-left: 0;
			font-size: 0.85rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.companion-daily-answers button,
		.companion-daily-skip {
			transition: none;
			transform: none !important;
		}
	}
</style>
