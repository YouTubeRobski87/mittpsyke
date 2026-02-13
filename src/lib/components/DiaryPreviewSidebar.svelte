<script lang="ts">
	import type { DiaryEntry } from '$lib/state/diary';

	let {
		entries = [],
		loading = false,
		error = ''
	}: {
		entries?: DiaryEntry[];
		loading?: boolean;
		error?: string;
	} = $props();

	function truncateContent(text: string, maxLength = 120) {
		const normalized = text.trim();
		if (normalized.length <= maxLength) return normalized;
		return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
	}

	function formatCreatedDate(createdAt: string | null) {
		if (!createdAt) return 'Okänt datum';

		const parsed = new Date(createdAt);
		if (Number.isNaN(parsed.getTime())) return 'Okänt datum';

		return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(parsed);
	}

	const previewEntries = $derived(entries.slice(0, 3));
</script>

<aside class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40 text-slate-100">
	<h2 class="text-lg font-semibold mb-3">Din dagbok</h2>

	{#if loading}
		<p class="text-sm text-slate-300/85">Laddar senaste inlägg...</p>
	{:else if error}
		<p class="text-sm text-rose-300">{error}</p>
	{:else if previewEntries.length === 0}
		<p class="text-sm text-slate-300/85">Du har inga sparade inlägg ännu.</p>
	{:else}
		<ul class="space-y-3">
			{#each previewEntries as entry (entry.id)}
				<li class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
					<p class="text-sm leading-relaxed text-slate-100">{truncateContent(entry.content, 120)}</p>
					<div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300/90">
						<span>{entry.mood ? `Känsla: ${entry.mood}` : 'Känsla: Ej vald'}</span>
						<span>{formatCreatedDate(entry.created_at)}</span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}

	<a
		href="/dagbok"
		class="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-600/70 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700/40 transition-colors"
	>
		Öppna hela dagboken
	</a>
</aside>
