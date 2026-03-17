<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { trackSignupCompleted, trackDiaryPageOpenedFromHoroscope } from '$lib/analytics';
	import Header from '$lib/components/Header.svelte';
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

<Header />

<div class="container mx-auto px-4 py-8">
	{#if loading}
		<div class="text-center text-neutral-500">Laddar...</div>
	{:else}
		{#if draftText}
			<section class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
				<h2 class="text-base font-semibold text-blue-900">Spara ditt första inlägg</h2>
				<p class="mt-2 text-sm text-blue-900/85">
					Läs igenom i lugn och ro. Du kan justera texten innan du sparar.
				</p>
				<textarea
					bind:value={draftText}
					rows={8}
					class="mt-3 w-full rounded-lg border border-blue-200 bg-white p-3 text-sm text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-300"
					placeholder="Skriv några ord..."
				></textarea>

				{#if draftError}
					<p class="mt-3 text-sm text-red-600">{draftError}</p>
				{/if}

				<button
					type="button"
					class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
					onclick={saveDraftToDiary}
					disabled={savingDraft || !draftText.trim()}
				>
					{savingDraft ? 'Sparar...' : 'Spara som första inlägg'}
				</button>

				<a
					href="/skriv"
					class="mt-3 inline-flex rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-100"
				>
					Fortsätt skriva senare
				</a>
			</section>
		{/if}

		{#if draftSuccess && !draftText}
			<section class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
				<h2 class="text-base font-semibold text-green-900">{draftSuccess}</h2>
				<p class="mt-2 text-sm text-green-900/80">Du kan fortsätta skriva i din dagbok när som helst.</p>
			</section>
		{/if}

		{#if loadError}
			<p class="mb-4 text-sm text-red-600">{loadError}</p>
		{/if}

		{#if entries.length === 0}
			<section class="rounded-lg border border-neutral-200 bg-white p-4">
				<h2 class="text-lg font-semibold">Din dagbok börjar här</h2>
				<p class="mt-2 text-sm text-neutral-600">Det räcker med några ord. Skriv i lugn och ro, i din egen takt.</p>
				<a
					href="/skriv"
					class="mt-4 inline-flex rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
				>
					Skriv första inlägget
				</a>
			</section>
		{:else}
			<div class="diary-entries space-y-4">
				{#each entries as entry (entry.id)}
					<article class="rounded-lg border border-neutral-200 bg-white p-4">
						<p class="text-xs text-neutral-500">{formatDate(entry.created_at)}</p>
						<p class="mt-2 whitespace-pre-wrap text-sm text-neutral-800">{entry.content}</p>
					</article>
				{/each}
			</div>
		{/if}
	{/if}
</div>
