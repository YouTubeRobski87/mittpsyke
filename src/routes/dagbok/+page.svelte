<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';

	type JournalEntry = {
		content: string;
		created_at: string | null;
	};

	let loading = $state(true);
	let saving = $state(false);
	let note = $state('');
	let userId = $state('');
	let entries = $state<JournalEntry[]>([]);
	let error = $state('');

	$effect(() => {
		async function init() {
			const { data } = await supabase.auth.getSession();
			const session = data.session;

			if (!session) {
				goto('/login');
				return;
			}

			userId = session.user.id;
			await loadEntries(userId);
			loading = false;
		}

		init();
	});

	async function loadEntries(uid: string) {
		const { data, error: loadError } = await supabase
			.from('journal_entries')
			.select('content, created_at')
			.eq('user_id', uid)
			.order('created_at', { ascending: false });

		if (loadError) {
			error = 'Kunde inte hämta anteckningar just nu.';
			return;
		}

		entries = data ?? [];
	}

	async function saveEntry() {
		const content = note.trim();
		if (!content || saving || !userId) return;

		saving = true;
		error = '';

		const { error: insertError } = await supabase.from('journal_entries').insert([
			{
				user_id: userId,
				content
			}
		]);

		if (insertError) {
			error = 'Kunde inte spara anteckningen just nu.';
			saving = false;
			return;
		}

		note = '';
		await loadEntries(userId);
		saving = false;
	}

	function formatDateTime(value: string | null) {
		if (!value) return '';
		return new Date(value).toLocaleString('sv-SE', {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}
</script>

<svelte:head>
	<title>Dagbok – MittPsyke</title>
</svelte:head>

{#if loading}
	<div class="container py-16 text-center opacity-60">Laddar...</div>
{:else}
	<section class="container max-w-2xl py-12">
		<h1 class="text-3xl font-bold tracking-tight mb-3">Dagbok</h1>
		<p class="opacity-75 leading-relaxed mb-6">Detta är din privata plats att skriva fritt.</p>

		<div class="rounded-2xl border border-black/10 dark:border-white/10 bg-white/45 dark:bg-white/5 p-4 mb-7">
			<textarea
				bind:value={note}
				rows={6}
				placeholder="Skriv din anteckning här..."
				class="w-full resize-y rounded-xl border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 px-4 py-3 text-sm leading-relaxed outline-none focus:border-[var(--primary)] transition-colors"
			></textarea>
			<div class="mt-3 flex justify-end">
				<button
					type="button"
					onclick={saveEntry}
					disabled={saving || !note.trim()}
					class="px-5 py-2.5 rounded-xl border border-black/12 dark:border-white/12 bg-white/60 dark:bg-white/5 text-sm font-medium opacity-90 hover:opacity-100 disabled:opacity-45 transition-opacity"
				>
					{saving ? 'Sparar...' : 'Spara'}
				</button>
			</div>
			{#if error}
				<p class="mt-2 text-sm opacity-70">{error}</p>
			{/if}
		</div>

		<div class="space-y-3">
			{#if entries.length === 0}
				<p class="text-sm opacity-60">Inga anteckningar ännu.</p>
			{:else}
				{#each entries as entry, i (`${entry.created_at ?? 'no-date'}-${i}`)}
					<article class="rounded-2xl border border-black/10 dark:border-white/10 bg-white/45 dark:bg-white/5 p-4">
						<p class="text-xs opacity-60 mb-2">{formatDateTime(entry.created_at)}</p>
						<p class="text-sm leading-relaxed whitespace-pre-wrap opacity-85">{entry.content}</p>
					</article>
				{/each}
			{/if}
		</div>
		<p class="mt-4 text-xs opacity-50 text-center">Det du skriver här delas inte med någon.</p>
	</section>
{/if}
