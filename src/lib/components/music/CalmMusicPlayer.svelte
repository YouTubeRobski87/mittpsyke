<script lang="ts">
	import { Pause, Play, Repeat, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-svelte';
	import {
		CALM_MUSIC_TRACKS,
		describePlaybackTime,
		formatPlaybackTime
	} from '$lib/calm-music';
	import { calmMusic } from '$lib/calm-music-player.svelte';

	// Fullspelaren äger inget ljud. Den visar den globala spelarens tillstånd
	// och anropar dess metoder, så musiken lever vidare när sidan lämnas.
	$effect(() => calmMusic.registerFullPlayer());

	const hasDuration = $derived(Number.isFinite(calmMusic.duration) && calmMusic.duration > 0);
	const statusText = $derived(
		calmMusic.status === 'playing'
			? 'Spelas nu'
			: calmMusic.status === 'paused'
				? 'Pausad'
				: calmMusic.status === 'ended'
					? 'Spelat klart'
					: 'Redo att spela'
	);
	const volumePercent = $derived(Math.round(calmMusic.volume * 100));

	function trackStatus(id: string): string | null {
		if (id !== calmMusic.trackId) return null;
		if (calmMusic.status === 'playing') return 'Spelas nu';
		if (calmMusic.status === 'paused') return 'Pausad';
		return 'Vald';
	}

	function handleSeek(event: Event) {
		calmMusic.seek(Number((event.currentTarget as HTMLInputElement).value));
	}

	function handleVolume(event: Event) {
		calmMusic.setVolume(Number((event.currentTarget as HTMLInputElement).value) / 100);
	}
</script>

<section id="lugn-musik" class="calm-music" aria-labelledby="lugn-musik-rubrik">
	<div class="calm-music-intro">
		<h2 id="lugn-musik-rubrik">Lugn musik</h2>
		<p>
			Tre lugna spår att vila, andas eller skriva till. Inget startar förrän du själv trycker
			på spela, och musiken fortsätter om du går vidare till en annan sida här.
		</p>
	</div>

	<div class="calm-music-body">
		<ul class="track-list" aria-label="Välj låt">
			{#each CALM_MUSIC_TRACKS as track (track.id)}
				{@const status = trackStatus(track.id)}
				<li>
					<button
						type="button"
						class="track"
						class:is-current={status !== null}
						aria-current={status !== null ? 'true' : undefined}
						onclick={() => calmMusic.selectTrack(track.id, { play: true })}
					>
						<span class="track-title">{track.title}</span>
						<span class="track-summary">{track.summary}</span>
						{#if status}
							<span class="track-status">{status}</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>

		<div class="now-playing">
			<p class="now-label" aria-live="polite">
				<span class="now-status">{statusText}</span>
				<span class="now-title">{calmMusic.track.title}</span>
			</p>

			<div class="seek">
				<input
					type="range"
					min="0"
					max={hasDuration ? Math.floor(calmMusic.duration) : 0}
					step="1"
					value={Math.floor(calmMusic.currentTime)}
					disabled={!hasDuration}
					aria-label={`Spola i ${calmMusic.track.title}`}
					aria-valuetext={`${describePlaybackTime(calmMusic.currentTime)} av ${describePlaybackTime(calmMusic.duration)}`}
					oninput={handleSeek}
				/>
				<div class="times" aria-hidden="true">
					<span>{formatPlaybackTime(calmMusic.currentTime)}</span>
					<span>{formatPlaybackTime(calmMusic.duration)}</span>
				</div>
			</div>

			<div class="controls">
				<button type="button" class="icon-button" aria-label="Föregående låt" onclick={() => calmMusic.previous()}>
					<SkipBack size={20} aria-hidden="true" />
				</button>
				<button
					type="button"
					class="play-button"
					aria-label={calmMusic.isPlaying ? `Pausa ${calmMusic.track.title}` : `Spela ${calmMusic.track.title}`}
					onclick={() => calmMusic.toggle()}
				>
					{#if calmMusic.isPlaying}
						<Pause size={20} aria-hidden="true" />
						<span>Pausa</span>
					{:else}
						<Play size={20} aria-hidden="true" />
						<span>Spela</span>
					{/if}
				</button>
				<button type="button" class="icon-button" aria-label="Nästa låt" onclick={() => calmMusic.next()}>
					<SkipForward size={20} aria-hidden="true" />
				</button>
			</div>

			<div class="settings">
				<button
					type="button"
					class="repeat-button"
					aria-pressed={calmMusic.repeat}
					onclick={() => calmMusic.toggleRepeat()}
				>
					<Repeat size={18} aria-hidden="true" />
					<span>Upprepa låten: {calmMusic.repeat ? 'på' : 'av'}</span>
				</button>

				<label class="volume">
					{#if volumePercent === 0}
						<VolumeX size={18} aria-hidden="true" />
					{:else}
						<Volume2 size={18} aria-hidden="true" />
					{/if}
					<span class="volume-label">Volym</span>
					<input
						type="range"
						min="0"
						max="100"
						step="5"
						value={volumePercent}
						aria-valuetext={`${volumePercent} procent`}
						oninput={handleVolume}
					/>
				</label>
			</div>

			{#if calmMusic.error}
				<p class="error" role="status">{calmMusic.error}</p>
			{/if}

			<p class="note">
				Utan upprepning spelas låtarna i tur och ordning och stannar efter den sista.
			</p>
		</div>
	</div>
</section>

<style>
	.calm-music {
		margin-top: 2.2rem;
		padding: 1.25rem 1.15rem;
		border-radius: var(--radius-card);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		scroll-margin-top: calc(5.5rem + env(safe-area-inset-top, 0px));
	}

	.calm-music-intro h2 {
		margin: 0;
		font-size: 1.3rem;
	}

	.calm-music-intro p {
		margin: 0.55rem 0 0;
		max-width: 62ch;
		line-height: 1.6;
		color: var(--color-text-muted);
	}

	.calm-music-body {
		display: grid;
		gap: 1.1rem;
		margin-top: 1.1rem;
	}

	@media (min-width: 820px) {
		.calm-music-body {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
			align-items: start;
		}
	}

	.track-list {
		display: grid;
		gap: 0.55rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.track {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.15rem 0.75rem;
		width: 100%;
		padding: 0.8rem 0.9rem;
		border-radius: 12px;
		border: 1px solid var(--color-border);
		background: var(--color-bg);
		color: inherit;
		text-align: left;
		font: inherit;
		cursor: pointer;
		transition: border-color 160ms ease, background-color 160ms ease;
	}

	.track:hover {
		border-color: var(--primary-border-soft);
	}

	.track.is-current {
		border-color: var(--primary);
		border-width: 2px;
		padding: calc(0.8rem - 1px) calc(0.9rem - 1px);
		background: var(--primary-soft);
	}

	.track-title {
		font-weight: 600;
	}

	.track-summary {
		grid-column: 1;
		font-size: 0.92rem;
		color: var(--color-text-muted);
	}

	.track-status {
		grid-column: 2;
		grid-row: 1 / span 2;
		align-self: center;
		font-size: 0.82rem;
		font-weight: 600;
	}

	.now-playing {
		padding: 1rem;
		border-radius: 12px;
		background: var(--color-bg-soft);
		border: 1px solid var(--color-border);
	}

	.now-label {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		margin: 0;
	}

	.now-status {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.now-title {
		font-size: 1.15rem;
		font-weight: 600;
	}

	.seek {
		margin-top: 0.9rem;
	}

	input[type='range'] {
		width: 100%;
		min-height: 44px;
		accent-color: var(--primary);
		cursor: pointer;
	}

	input[type='range']:disabled {
		cursor: default;
		opacity: 0.55;
	}

	.times {
		display: flex;
		justify-content: space-between;
		margin-top: -0.35rem;
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted);
	}

	.controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-top: 0.7rem;
	}

	.icon-button,
	.play-button,
	.repeat-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		min-height: 44px;
		border-radius: 999px;
		font: inherit;
		cursor: pointer;
		transition: background-color 160ms ease, border-color 160ms ease;
	}

	.icon-button {
		width: 44px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: inherit;
	}

	.icon-button:hover {
		border-color: var(--primary-border-soft);
		background: var(--primary-soft);
	}

	.play-button {
		min-width: 7.5rem;
		padding: 0 1.2rem;
		border: 1px solid var(--primary);
		background: var(--primary);
		color: #fff;
		font-weight: 600;
	}

	.play-button:hover {
		background: var(--color-primary-hover);
	}

	.settings {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem 1rem;
		margin-top: 0.9rem;
	}

	.repeat-button {
		padding: 0 0.9rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: inherit;
		font-size: 0.92rem;
	}

	.repeat-button[aria-pressed='true'] {
		border-color: var(--primary);
		background: var(--primary-soft);
		font-weight: 600;
	}

	.volume {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1 1 12rem;
		max-width: 16rem;
		font-size: 0.92rem;
	}

	.error {
		margin: 0.9rem 0 0;
		padding: 0.7rem 0.8rem;
		border-radius: 10px;
		background: hsl(var(--error-surface));
		color: hsl(var(--error-foreground));
		font-size: 0.92rem;
		line-height: 1.5;
	}

	.note {
		margin: 0.8rem 0 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	:global(.dark) .track.is-current,
	:global(.dark) .play-button,
	:global(.dark) .repeat-button[aria-pressed='true'] {
		border-color: var(--primary-dark);
	}

	:global(.dark) .track.is-current,
	:global(.dark) .repeat-button[aria-pressed='true'] {
		background: var(--primary-dark-soft);
	}

	:global(.dark) .play-button {
		background: var(--primary-dark);
		color: #0b1220;
	}

	:global(.dark) input[type='range'] {
		accent-color: var(--primary-dark);
	}

	@media (max-width: 640px) {
		.calm-music {
			padding: 1.05rem 0.95rem;
		}

		.volume {
			max-width: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.track,
		.icon-button,
		.play-button,
		.repeat-button {
			transition: none;
		}
	}
</style>
