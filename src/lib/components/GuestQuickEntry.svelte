<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import {
		trackDiaryGuestEntryStarted,
		trackDiaryGuestEntrySaved
	} from '$lib/analytics';

	const STORAGE_KEY = 'mittpsyke_guest_entry';
	const AUTOSAVE_INTERVAL_MS = 3000;

	let entry = $state('');
	let saveStatus = $state<'idle' | 'saved'>('idle');
	let containerEl = $state<HTMLElement | null>(null);
	let textareaEl = $state<HTMLTextAreaElement | null>(null);
	let lastSavedValue = '';
	let saveTimer: ReturnType<typeof setInterval> | null = null;
	let hasStartedTracking = false;

	function persistIfDirty() {
		if (!browser) return;
		if (entry === lastSavedValue) return;

		try {
			if (entry.trim().length === 0) {
				window.localStorage.removeItem(STORAGE_KEY);
			} else {
				window.localStorage.setItem(STORAGE_KEY, entry);
				trackDiaryGuestEntrySaved(entry.length);
			}
			lastSavedValue = entry;
			saveStatus = 'saved';
		} catch {
			// Privatläge eller full kvot — failar tyst, vi visar bara ingen "sparat"-status.
		}
	}

	function handleInput() {
		if (!hasStartedTracking && entry.trim().length > 0) {
			hasStartedTracking = true;
			trackDiaryGuestEntryStarted();
		}
		if (saveStatus === 'saved') {
			saveStatus = 'idle';
		}
	}

	onMount(() => {
		if (!browser) return;

		// Ladda eventuell befintlig text
		try {
			const stored = window.localStorage.getItem(STORAGE_KEY);
			if (stored) {
				entry = stored;
				lastSavedValue = stored;
				saveStatus = 'saved';
			}
		} catch {
			// Ignorera storage-fel
		}

		// Auto-scroll till komponenten efter kort fördröjning
		const scrollTimer = setTimeout(() => {
			containerEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			textareaEl?.focus({ preventScroll: true });
		}, 100);

		// Auto-save var 3:e sekund
		saveTimer = setInterval(persistIfDirty, AUTOSAVE_INTERVAL_MS);

		return () => clearTimeout(scrollTimer);
	});

	onDestroy(() => {
		if (saveTimer) clearInterval(saveTimer);
		// Sista sparet innan unmount
		persistIfDirty();
	});

	const charCount = $derived(entry.length);
</script>

<svelte:window on:beforeunload={persistIfDirty} />

<section
	id="guest-entry"
	class="guest-entry"
	bind:this={containerEl}
	aria-label="Snabbantecknings-yta"
>
	<div class="guest-entry-card">
		<header class="guest-entry-header">
			<h2>Skriv av dig direkt</h2>
			<p class="meta">
				Sparas lokalt på din enhet. Inget skickas till någon server.
				{#if saveStatus === 'saved' && entry.length > 0}
					<span class="status-pill" aria-live="polite">Sparat</span>
				{/if}
			</p>
		</header>

		<textarea
			bind:this={textareaEl}
			bind:value={entry}
			oninput={handleInput}
			placeholder="Vad snurrar det i huvudet just nu?"
			rows="8"
			aria-label="Din snabbanteckning"
		></textarea>

		<footer class="guest-entry-footer">
			<span class="char-count" aria-hidden="true">{charCount} tecken</span>
			<div class="actions">
				<a class="primary-action" href="/register?fromDiary=true">Spara och skapa konto</a>
				<button type="button" class="secondary-action" onclick={persistIfDirty}>
					Fortsätt skriva
				</button>
			</div>
		</footer>
	</div>
</section>

<style>
	.guest-entry {
		max-width: 1080px;
		margin: 1.25rem auto 0;
		padding: 0 1.25rem;
		scroll-margin-top: 1rem;
	}

	.guest-entry-card {
		border-radius: 24px;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		padding: clamp(1.2rem, 3vw, 1.8rem);
		display: grid;
		gap: 1rem;
		box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
	}

	.guest-entry-header {
		display: grid;
		gap: 0.35rem;
	}

	h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1.25rem;
		letter-spacing: -0.02em;
	}

	.meta {
		margin: 0;
		font-size: 0.88rem;
		color: hsl(var(--muted-foreground));
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.15rem 0.55rem;
		border-radius: var(--radius-pill);
		background: rgba(20, 184, 166, 0.16);
		color: hsl(var(--foreground));
		font-size: 0.75rem;
		font-weight: 600;
	}

	textarea {
		width: 100%;
		min-height: 180px;
		resize: vertical;
		border-radius: var(--radius-input, 14px);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
		padding: 0.85rem 0.95rem;
		font-family: var(--font-body);
		font-size: 1rem;
		line-height: 1.6;
		color: hsl(var(--foreground));
		box-sizing: border-box;
	}

	textarea:focus {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.guest-entry-footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.char-count {
		font-size: 0.82rem;
		color: hsl(var(--muted-foreground));
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.primary-action,
	.secondary-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.7rem 1.15rem;
		min-height: 2.7rem;
		border-radius: var(--radius-pill);
		font-family: var(--font-heading);
		font-weight: 600;
		font-size: 0.95rem;
		text-decoration: none;
		cursor: pointer;
		transition: transform 150ms ease;
	}

	.primary-action {
		background: var(--theme-accent, var(--primary));
		color: #fff;
		border: 1px solid var(--theme-accent, var(--primary));
		box-shadow: 0 12px 24px rgba(15, 118, 110, 0.18);
	}

	.secondary-action {
		background: hsl(var(--surface-soft));
		color: hsl(var(--foreground));
		border: 1px solid hsl(var(--border));
	}

	.primary-action:hover,
	.secondary-action:hover {
		transform: translateY(-1px);
	}

	@media (max-width: 640px) {
		.guest-entry {
			padding: 0 0.75rem;
			margin-top: 0.85rem;
		}

		.guest-entry-card {
			padding: 1rem;
			border-radius: var(--radius-input, 14px);
		}

		.guest-entry-footer {
			flex-direction: column;
			align-items: stretch;
		}

		.actions {
			display: grid;
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.primary-action,
		.secondary-action {
			width: 100%;
		}
	}
</style>
