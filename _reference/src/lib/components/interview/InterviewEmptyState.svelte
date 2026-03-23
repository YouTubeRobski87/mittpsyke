<script lang="ts">
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import { accentStore } from '$lib/stores/accent.svelte';

	import {
		EmojiSpeechBalloon,
		EmojiRosePink,
		EmojiRoseBlue,
		EmojiRoseAmber,
		EmojiRoseLime,
		EmojiRoseRed
	} from '$lib/assets/emojis';

	interface Props {
		onSend: (message: string) => void;
	}

	let { onSend }: Props = $props();

	const roseMap = {
		pink: EmojiRosePink,
		blue: EmojiRoseBlue,
		amber: EmojiRoseAmber,
		lime: EmojiRoseLime,
		red: EmojiRoseRed
	} as const;

	let RoseIcon = $derived(roseMap[accentStore.current]);

	const starters = [
		{ label: 'Berätta vad jag borde skriva om!', message: 'Berätta vad jag borde skriva om!' },
		{
			label: 'Ställ en fråga jag inte väntar mig',
			message: 'Ställ en fråga jag inte väntar mig'
		},
		{
			label: 'Hjälp mig att komma ihåg den här dagen',
			message: 'Hjälp mig att komma ihåg den här dagen'
		},
		{
			label: 'Gräv fram något intressant ur min dag',
			message: 'Gräv fram något intressant ur min dag'
		}
	] as const;

	let firstName = $derived(wizardStore.data.profile.name.split(' ')[0]);
	let greeting = $derived(firstName ? `Hej där, ${firstName}!` : 'Hej där!');
</script>

<div class="empty-state">
	<div class="empty-greeting">
		<div class="greeting-icon">
			<EmojiSpeechBalloon size={96} />
		</div>
		<p class="greeting-text">{greeting}</p>
		<p class="greeting-sub">Stort eller smått, roligt eller tungt – allt är värt att skriva om. Var vill du börja?</p>
	</div>

	<div class="starter-grid">
		{#each starters as starter}
			<button class="starter-chip" onclick={() => onSend(starter.message)}>
				<span class="chip-icon">
					<RoseIcon size={20} />
				</span>
				<span class="chip-text">{starter.label}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		text-align: center;
		padding: 0;
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
	}

	.empty-greeting {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.greeting-icon {
		display: flex;
		justify-content: center;
		margin-bottom: 0.625rem;
	}

	.greeting-text {
		font-family: var(--font-primary);
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text);
		margin: 0;
		line-height: var(--leading-tight);
	}

	.greeting-sub {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
		margin: 0;
		line-height: var(--leading-normal);
	}

	.starter-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.625rem;
		width: 100%;
	}

	.chip-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		opacity: 0.9;
		transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.starter-chip:hover .chip-icon {
		opacity: 1;
	}

	.chip-text {
		flex: 1;
		min-width: 0;
	}

	.starter-chip {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: var(--color-bg-elevated);
		border: 2px solid transparent;
		border-radius: var(--radius-md);
		padding: 0.875rem 1rem;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-normal);
		color: var(--color-text);
		cursor: pointer;
		text-align: center;
		line-height: var(--leading-snug);
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}

	.starter-chip:hover {
		background: color-mix(in srgb, var(--color-accent) 12%, var(--color-bg-elevated));
		border-color: var(--color-accent);
	}

	.starter-chip:active {
		transform: scale(0.98);
	}

	@media (max-width: 640px) {
		.empty-state {
			gap: 0.5rem;
		}

		.greeting-text {
			font-size: var(--text-lg);
		}

		.greeting-sub {
			font-size: var(--text-xs);
		}

		.starter-chip {
			padding: 0.875rem 0.75rem;
			font-size: var(--text-xs);
		}

		.starter-grid {
			gap: 0.5rem;
		}
	}

	@media (max-height: 800px) {
		.empty-state {
			gap: 0.5rem;
		}

		.greeting-text {
			font-size: var(--text-lg);
		}

		.starter-chip {
			padding: 0.875rem 0.75rem;
		}

		.starter-grid {
			gap: 0.5rem;
		}
	}
</style>
