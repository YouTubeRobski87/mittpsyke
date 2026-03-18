<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { trackSignupCompleted, trackDiaryPageOpenedFromHoroscope } from '$lib/analytics';
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';
	import { supabase } from '$lib/supabase';
	import { loadDiaryEntries, type DiaryEntry } from '$lib/state/diary';

	let entries: DiaryEntry[] = [];
	let loading = true;
	let loadError = '';
	let draftText = '';
	let draftError = '';
	let draftSuccess = '';
	let savingDraft = false;

	function parseStoredDraft(value: string | null): string {
		if (!value) return '';

		try {
			const parsed = JSON.parse(value);
			if (typeof parsed === 'string') return parsed.trim();
			if (parsed && typeof parsed === 'object' && typeof parsed.content === 'string') {
				return parsed.content.trim();
			}
		} catch {
			return value.trim();
		}

		return value.trim();
	}

	function formatDate(value: string | null): string {
		if (!value) return 'Okänt datum';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return 'Okänt datum';
		return date.toLocaleDateString('sv-SE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	async function loadEntries(options: { force?: boolean } = {}) {
		const { data } = await supabase.auth.getSession();
		const userId = data.session?.user?.id;
		if (!userId) {
			entries = [];
			return;
		}

		entries = await loadDiaryEntries(userId, options);
	}

	async function saveDraftToDiary() {
		if (!draftText.trim() || savingDraft) return;
		draftError = '';
		draftSuccess = '';
		savingDraft = true;

		try {
			const { data } = await supabase.auth.getSession();
			const session = data.session;

			if (!session?.access_token) {
				draftError = 'Logga in eller skapa konto för att spara i dagboken.';
				return;
			}

			const response = await fetch('/api/diary/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`
				},
				body: JSON.stringify({ text: draftText.trim() })
			});

			const payload = await response.json().catch(() => null);
			if (!response.ok) {
				draftError = payload?.error || 'Kunde inte spara inlägget just nu.';
				return;
			}

			if (typeof window !== 'undefined') {
				localStorage.removeItem('mittpsyke_temp_entry');

				const url = new URL(window.location.href);
				if (url.searchParams.has('prefill')) {
					url.searchParams.delete('prefill');
					const query = url.searchParams.toString();
					window.history.replaceState({}, '', `${url.pathname}${query ? `?${query}` : ''}${url.hash}`);
				}
			}

			draftText = '';
			draftSuccess = 'Ditt första inlägg är sparat';
			await loadEntries({ force: true });
		} catch (error) {
			draftError = error instanceof Error ? error.message : 'Kunde inte spara inlägget just nu.';
		} finally {
			savingDraft = false;
		}
	}

	onMount(async () => {
		// Track signup completion if coming from welcome flow
		if ($page.url.searchParams.get('welcome') === 'true') {
			trackSignupCompleted();
		}
		
		// Track diary page opened from horoscope source
		if ($page.url.searchParams.get('from') === 'horoscope') {
			trackDiaryPageOpenedFromHoroscope();
		}

		const prefill = $page.url.searchParams.get('prefill')?.trim();
		if (prefill) {
			draftText = prefill;
		} else if (typeof window !== 'undefined') {
			draftText = parseStoredDraft(localStorage.getItem('mittpsyke_temp_entry'));
		}

		try {
			await loadEntries();
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Kunde inte ladda dagboken just nu.';
		} finally {
			loading = false;
		}
	});
</script>

<main class="auth-page">
	<PortalSubnav
		active="dagbok"
		title="Din dagbok"
		description="Skriv i lugn och ro, i din egen takt. Det räcker med några ord."
	/>

	<div class="auth-shell">
		{#if loading}
			<section class="auth-panel">
				<p class="auth-muted">Laddar...</p>
			</section>
		{:else}
			{#if draftText}
				<section class="auth-panel auth-panel-accent">
					<h2 class="text-base font-semibold">Spara ditt första inlägg</h2>
					<p class="mt-2 text-sm auth-muted">
						Läs igenom i lugn och ro. Du kan justera texten innan du sparar.
					</p>
					<textarea
						bind:value={draftText}
						rows={8}
						class="diary-input"
						placeholder="Skriv några ord..."
					></textarea>

					{#if draftError}
						<p class="mt-3 text-sm error-copy">{draftError}</p>
					{/if}

					<div class="actions-row">
						<button
							type="button"
							class="auth-button primary"
							onclick={saveDraftToDiary}
							disabled={savingDraft || !draftText.trim()}
						>
							{savingDraft ? 'Sparar...' : 'Spara som första inlägg'}
						</button>

						<a href="/skriv" class="auth-button">
							Fortsätt skriva senare
						</a>
					</div>
				</section>
			{/if}

			{#if draftSuccess && !draftText}
				<section class="auth-panel auth-panel-success">
					<h2 class="text-base font-semibold">{draftSuccess}</h2>
					<p class="mt-2 text-sm">Du kan fortsätta skriva i din dagbok när som helst.</p>
				</section>
			{/if}

			{#if loadError}
				<section class="auth-panel auth-panel-error">
					<p class="text-sm">{loadError}</p>
				</section>
			{/if}

			{#if entries.length === 0}
				<section class="auth-panel">
					<h2 class="text-lg font-semibold">Din dagbok börjar här</h2>
					<p class="mt-2 text-sm auth-muted">Det räcker med några ord. Skriv i lugn och ro, i din egen takt.</p>
					<a href="/skriv" class="auth-button mt-4">
						Skriv första inlägget
					</a>
				</section>
			{:else}
				<div class="diary-entries">
					{#each entries as entry (entry.id)}
						<article class="auth-panel diary-entry">
							<p class="text-xs auth-muted">{formatDate(entry.created_at)}</p>
							<p class="mt-2 whitespace-pre-wrap text-sm">{entry.content}</p>
						</article>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</main>

<style>
	.diary-input {
		width: 100%;
		margin-top: 0.8rem;
		padding: 0.75rem 0.85rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		resize: vertical;
	}

	.diary-input:focus {
		border-color: var(--primary, #0f766e);
		outline: none;
	}

	.diary-input::placeholder {
		color: hsl(var(--muted-foreground));
	}

	.actions-row {
		margin-top: 0.95rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.error-copy {
		color: hsl(var(--error-foreground));
	}

	.diary-entries {
		display: grid;
		gap: 0.75rem;
	}

	.diary-entry {
		transition: border-color 160ms ease, box-shadow 160ms ease;
	}

	.diary-entry:hover {
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
	}

	:global(.dark) .diary-entry:hover {
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.24);
	}
</style>
