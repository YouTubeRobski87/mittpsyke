<script lang="ts">
	import { browser } from '$app/environment';
	import { Pause, Play, X } from 'lucide-svelte';
	import { CALM_MUSIC_PLAYER_HREF } from '$lib/calm-music';
	import { calmMusic } from '$lib/calm-music-player.svelte';

	// Minispelaren visas bara efter att användaren själv startat musik och när
	// ingen fullspelare finns på sidan. Den reserverar sin egen yta på samma
	// sätt som cookiebannern: höjden mäts och exponeras som --calm-music-space,
	// som layouten lägger till som bottenutrymme, så inget innehåll täcks.
	const SPACE_VARIABLE = '--calm-music-space';

	let element = $state<HTMLElement | null>(null);

	$effect(() => {
		const node = element;
		if (!browser || !node) return;

		const measure = () => {
			const rect = node.getBoundingClientRect();
			document.documentElement.style.setProperty(
				SPACE_VARIABLE,
				`${Math.round(Math.max(0, window.innerHeight - rect.top))}px`
			);
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		window.addEventListener('resize', measure);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', measure);
			document.documentElement.style.removeProperty(SPACE_VARIABLE);
		};
	});
</script>

<aside bind:this={element} class="mini-player" aria-label="Musikspelare">
	<button
		type="button"
		class="mini-toggle"
		aria-label={calmMusic.isPlaying ? `Pausa ${calmMusic.track.title}` : `Spela ${calmMusic.track.title}`}
		onclick={() => calmMusic.toggle()}
	>
		{#if calmMusic.isPlaying}
			<Pause size={18} aria-hidden="true" />
		{:else}
			<Play size={18} aria-hidden="true" />
		{/if}
	</button>

	<a class="mini-info" href={CALM_MUSIC_PLAYER_HREF}>
		<span class="mini-status">
			{calmMusic.error ? 'Kan inte spelas' : calmMusic.isPlaying ? 'Spelas' : 'Pausad'}
			<span class="visually-hidden">– öppna musikspelaren</span>
		</span>
		<span class="mini-title">{calmMusic.track.title}</span>
	</a>

	<button
		type="button"
		class="mini-close"
		aria-label="Stäng musikspelaren och stoppa musiken"
		onclick={() => calmMusic.close()}
	>
		<X size={18} aria-hidden="true" />
	</button>
</aside>

<style>
	.mini-player {
		position: fixed;
		z-index: 40;
		left: 50%;
		bottom: calc(var(--cookie-banner-space, 0px) + 0.6rem + env(safe-area-inset-bottom, 0px));
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.4rem;
		width: min(24rem, calc(100vw - 1rem));
		padding: 0.35rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		box-shadow: 0 6px 20px var(--shadow-color);
	}

	@media (min-width: 768px) {
		.mini-player {
			left: auto;
			right: 1.25rem;
			transform: none;
		}
	}

	.mini-toggle,
	.mini-close {
		display: inline-flex;
		flex: 0 0 auto;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 999px;
		cursor: pointer;
	}

	.mini-toggle {
		border: 1px solid var(--primary);
		background: var(--primary);
		color: #fff;
	}

	.mini-close {
		border: 1px solid transparent;
		background: transparent;
		color: var(--color-text-muted);
	}

	.mini-close:hover {
		background: var(--primary-soft);
		color: var(--color-text);
	}

	.mini-info {
		display: flex;
		flex: 1 1 auto;
		flex-direction: column;
		justify-content: center;
		min-width: 0;
		min-height: 44px;
		padding: 0 0.35rem;
		border-radius: 10px;
		color: inherit;
		text-decoration: none;
	}

	.mini-info:hover .mini-title {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.mini-status {
		font-size: 0.78rem;
		color: var(--color-text-muted);
	}

	.mini-title {
		overflow: hidden;
		font-size: 0.95rem;
		font-weight: 600;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	:global(.dark) .mini-toggle {
		border-color: var(--primary-dark);
		background: var(--primary-dark);
		color: #0b1220;
	}

	:global(.dark) .mini-player {
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
	}
</style>
