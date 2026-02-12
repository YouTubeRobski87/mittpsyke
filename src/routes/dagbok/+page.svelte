<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';

	type JournalEntry = {
		id: string;
		content: string;
		created_at: string | null;
		tags: string[];
		mood: string | null;
	};

	type UpdateDiarySuccessResponse = {
		success: true;
		diary: {
			id: string;
			text: string;
			mood: string | null;
			tags: string[] | null;
			created_at: string;
		};
	};

	type UpdateDiaryErrorResponse = {
		success: false;
		error: string;
	};

	type DeleteDiarySuccessResponse = {
		success: true;
	};

	type DeleteDiaryErrorResponse = {
		success: false;
		error: string;
	};

	const moods = ['Lugn', 'Orolig', 'Nedstämd', 'Hoppfull', 'Trött', 'Tacksam', 'Arg', 'Stressad'];

	let loading = $state(true);
	let saving = $state(false);
	let exportingPdf = $state(false);
	let note = $state('');
	let tagsInput = $state('');
	let selectedMood = $state('');
	let editingEntryId = $state<string | null>(null);
	let editableText = $state('');
	let editableMood = $state('');
	let editableTags = $state('');
	let updatingEntry = $state(false);
	let deletingEntryId = $state<string | null>(null);
	let updateError = $state('');
	let deleteError = $state('');
	let userId = $state('');
	let entries = $state<JournalEntry[]>([]);
	let error = $state('');
	let reminderOptIn = $state(false);
	let reminderSaving = $state(false);
	let reminderError = $state('');
	let reminderNextAt = $state<string | null>(null);

	$effect(() => {
		async function init() {
			const { data } = await supabase.auth.getSession();
			const session = data.session;

			if (!session) {
				goto('/login');
				return;
			}

			userId = session.user.id;

			const metadata = (session.user.user_metadata ?? {}) as Record<string, unknown>;
			reminderOptIn = Boolean(metadata.journal_reminder_opt_in);
			reminderNextAt =
				typeof metadata.journal_reminder_next_at === 'string'
					? metadata.journal_reminder_next_at
					: null;

			applyPrefillFromUrl();
			await loadEntries(userId);
			loading = false;
		}

		init();
	});

	function applyPrefillFromUrl() {
		if (typeof window === 'undefined') return;

		const url = new URL(window.location.href);
		const prefill = url.searchParams.get('prefill');
		if (!prefill) return;

		note = prefill;
		url.searchParams.delete('prefill');
		window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
	}

	function parseTags(input: string) {
		return Array.from(
			new Set(
				input
					.split(',')
					.map((tag) => tag.trim())
					.filter(Boolean)
			)
		);
	}

	function normalizeTags(value: unknown) {
		if (Array.isArray(value)) {
			return value
				.map((item) => (typeof item === 'string' ? item.trim() : ''))
				.filter(Boolean);
		}

		if (typeof value === 'string') {
			return value
				.split(',')
				.map((item) => item.trim())
				.filter(Boolean);
		}

		return [];
	}

	async function loadEntries(uid: string) {
		const { data, error: loadError } = await supabase
			.from('diary')
			.select('id, text, created_at, tags, mood')
			.eq('user_id', uid)
			.order('created_at', { ascending: false });

		const diaryTableMissing =
			loadError?.code === 'PGRST205' ||
			loadError?.code === '42P01' ||
			(loadError?.message ?? '').includes("Could not find the table 'public.diary'");

		if (diaryTableMissing) {
			const { data: legacyData, error: legacyLoadError } = await supabase
				.from('journal_entries')
				.select('id, content, created_at, tags, mood')
				.eq('user_id', uid)
				.order('created_at', { ascending: false });

			if (legacyLoadError) {
				const legacyTableMissing =
					legacyLoadError.code === 'PGRST205' ||
					legacyLoadError.code === '42P01' ||
					(legacyLoadError.message ?? '').includes(
						"Could not find the table 'public.journal_entries'"
					);
				if (legacyTableMissing) {
					error = 'Databastabell saknas. Be administratören köra supabase/diary.sql i Supabase.';
					return;
				}
				error = 'Kunde inte hämta anteckningar just nu.';
				return;
			}

			entries = (legacyData ?? []).map((entry) => ({
				id: typeof entry.id === 'string' ? entry.id : '',
				content: typeof entry.content === 'string' ? entry.content : '',
				created_at: typeof entry.created_at === 'string' ? entry.created_at : null,
				tags: normalizeTags(entry.tags),
				mood: typeof entry.mood === 'string' ? entry.mood : null
			}));
			return;
		}

		if (loadError) {
			error = 'Kunde inte hämta anteckningar just nu.';
			return;
		}

		entries = (data ?? []).map((entry) => ({
			id: typeof entry.id === 'string' ? entry.id : '',
			content: typeof entry.text === 'string' ? entry.text : '',
			created_at: typeof entry.created_at === 'string' ? entry.created_at : null,
			tags: normalizeTags(entry.tags),
			mood: typeof entry.mood === 'string' ? entry.mood : null
		}));
	}

	function startEditing(entry: JournalEntry) {
		editingEntryId = entry.id;
		editableText = entry.content;
		editableMood = entry.mood ?? '';
		editableTags = entry.tags.join(', ');
		updateError = '';
		deleteError = '';
	}

	function cancelEditing() {
		editingEntryId = null;
		editableText = '';
		editableMood = '';
		editableTags = '';
		updateError = '';
	}

	async function deleteEntry(entryId: string) {
		if (!entryId || deletingEntryId) return;
		deleteError = '';
		if (typeof window !== 'undefined') {
			const confirmed = window.confirm('Är du säker på att du vill radera detta inlägg?');
			if (!confirmed) return;
		}

		deletingEntryId = entryId;

		const {
			data: { session },
			error: sessionError
		} = await supabase.auth.getSession();

		if (sessionError || !session?.user || !session.access_token) {
			deleteError = 'Du behöver vara inloggad för att radera anteckningar.';
			deletingEntryId = null;
			return;
		}

		const response = await fetch('/api/diary/delete', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${session.access_token}`
			},
			body: JSON.stringify({ id: entryId })
		});

		const result = (await response.json().catch(() => null)) as
			| DeleteDiarySuccessResponse
			| DeleteDiaryErrorResponse
			| null;

		if (!response.ok || !result || !result.success) {
			deleteError = result && 'error' in result ? result.error : 'Kunde inte radera anteckningen just nu.';
			deletingEntryId = null;
			return;
		}

		entries = entries.filter((entry) => entry.id !== entryId);
		if (editingEntryId === entryId) {
			cancelEditing();
		}
		deletingEntryId = null;
	}

	async function saveEditedEntry() {
		const entryId = editingEntryId;
		const content = editableText.trim();

		if (!entryId || !content || updatingEntry) return;

		updatingEntry = true;
		updateError = '';

		const {
			data: { session },
			error: sessionError
		} = await supabase.auth.getSession();

		if (sessionError || !session?.user || !session.access_token) {
			updateError = 'Du behöver vara inloggad för att uppdatera anteckningar.';
			updatingEntry = false;
			return;
		}

		const parsedTags = parseTags(editableTags);

		const response = await fetch('/api/diary/update', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${session.access_token}`
			},
			body: JSON.stringify({
				id: entryId,
				text: content,
				mood: editableMood || null,
				tags: parsedTags.length > 0 ? parsedTags : null
			})
		});

		const result = (await response.json().catch(() => null)) as
			| UpdateDiarySuccessResponse
			| UpdateDiaryErrorResponse
			| null;

		if (!response.ok || !result || !result.success) {
			updateError =
				result && 'error' in result ? result.error : 'Kunde inte uppdatera anteckningen just nu.';
			updatingEntry = false;
			return;
		}

		entries = entries.map((entry) =>
			entry.id === result.diary.id
				? {
						...entry,
						content: result.diary.text,
						mood: result.diary.mood,
						tags: normalizeTags(result.diary.tags),
						created_at:
							typeof result.diary.created_at === 'string'
								? result.diary.created_at
								: entry.created_at
					}
				: entry
		);

		updatingEntry = false;
		cancelEditing();
	}

	async function saveEntry() {
		const content = note.trim();
		if (!content || saving) return;

		saving = true;
		error = '';

		const {
			data: { session },
			error: sessionError
		} = await supabase.auth.getSession();

		if (sessionError || !session?.user || !session.access_token) {
			console.error('Session missing', sessionError);
			error = 'Du behöver vara inloggad för att spara anteckningar.';
			saving = false;
			return;
		}

		const parsedTags = parseTags(tagsInput);

		const response = await fetch('/api/diary/create', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${session.access_token}`
			},
			body: JSON.stringify({
				text: content,
				mood: selectedMood || null,
				tags: parsedTags.length > 0 ? parsedTags : null
			})
		});

		if (!response.ok) {
			const result = (await response.json().catch(() => null)) as
				| { error?: string; success?: false }
				| null;
			error = result?.error || 'Kunde inte spara anteckningen just nu.';
			saving = false;
			return;
		}

		note = '';
		tagsInput = '';
		selectedMood = '';
		userId = session.user.id;
		await loadEntries(session.user.id);
		saving = false;
	}

	function getNextReminderAtIso() {
		const next = new Date();
		next.setDate(next.getDate() + 1);
		next.setHours(18, 0, 0, 0);
		return next.toISOString();
	}

	async function updateReminderPreference() {
		if (!userId || reminderSaving) return;

		const previousOptIn = reminderOptIn;
		const nextReminderAt = reminderOptIn ? getNextReminderAtIso() : null;

		reminderSaving = true;
		reminderError = '';

		const { error: updateError } = await supabase.auth.updateUser({
			data: {
				journal_reminder_opt_in: reminderOptIn,
				journal_reminder_next_at: nextReminderAt,
				journal_reminder_channel: reminderOptIn ? 'email' : null
			}
		});

		if (updateError) {
			reminderError = 'Kunde inte uppdatera påminnelsevalet just nu.';
			reminderOptIn = !previousOptIn;
			reminderSaving = false;
			return;
		}

		reminderNextAt = nextReminderAt;
		reminderSaving = false;
	}

	async function exportAsPdf() {
		if (exportingPdf || entries.length === 0) return;

		exportingPdf = true;
		error = '';

		try {
			const { jsPDF } = await import('jspdf');
			const doc = new jsPDF({ unit: 'pt', format: 'a4' });

			const marginX = 44;
			const contentWidth = doc.internal.pageSize.getWidth() - marginX * 2;
			const pageBottom = doc.internal.pageSize.getHeight() - 44;
			let y = 52;

			const ensureSpace = (needed: number) => {
				if (y + needed <= pageBottom) return;
				doc.addPage();
				y = 52;
			};

			doc.setFont('helvetica', 'bold');
			doc.setFontSize(16);
			doc.text('MittPsyke - Dagbok', marginX, y);
			y += 22;

			doc.setFont('helvetica', 'normal');
			doc.setFontSize(10);
			doc.text(`Exporterad: ${new Date().toLocaleString('sv-SE')}`, marginX, y);
			y += 24;

			for (const entry of entries) {
				const dateText = formatDateTime(entry.created_at) || 'Utan datum';
				const moodText = entry.mood ? `Känsla: ${entry.mood}` : '';
				const tagsText = entry.tags.length > 0 ? `Taggar: ${entry.tags.join(', ')}` : '';
				const contentLines = doc.splitTextToSize(entry.content || '', contentWidth);

				let estimatedHeight = 34 + contentLines.length * 14;
				if (moodText) estimatedHeight += 14;
				if (tagsText) estimatedHeight += 14;

				ensureSpace(estimatedHeight);

				doc.setFont('helvetica', 'bold');
				doc.setFontSize(11);
				doc.text(dateText, marginX, y);
				y += 16;

				doc.setFont('helvetica', 'normal');
				doc.setFontSize(10);
				if (moodText) {
					doc.text(moodText, marginX, y);
					y += 14;
				}

				if (tagsText) {
					doc.text(tagsText, marginX, y);
					y += 14;
				}

				doc.setFontSize(11);
				doc.text(contentLines, marginX, y);
				y += contentLines.length * 14 + 10;

				doc.setDrawColor(220);
				doc.line(marginX, y, marginX + contentWidth, y);
				y += 14;
			}

			doc.save('mittpsyke-dagbok.pdf');
		} catch {
			error = 'Kunde inte exportera PDF just nu.';
		} finally {
			exportingPdf = false;
		}
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
	<title>Dagbok - MittPsyke</title>
</svelte:head>

{#if loading}
	<div class="container py-16 text-center opacity-60">Laddar...</div>
{:else}
	<section class="container max-w-2xl py-12">
		<div class="flex flex-wrap items-center justify-between gap-3 mb-3">
			<h1 class="text-3xl font-bold tracking-tight">Dagbok</h1>
			<button
				type="button"
				onclick={exportAsPdf}
				disabled={exportingPdf || entries.length === 0}
				class="px-4 py-2 rounded-xl border border-black/12 dark:border-white/12 bg-white/60 dark:bg-white/5 text-sm opacity-85 hover:opacity-100 disabled:opacity-45 transition-opacity"
			>
				{exportingPdf ? 'Exporterar...' : 'Exportera som PDF'}
			</button>
		</div>

		<p class="opacity-75 leading-relaxed mb-6">Detta är din privata plats att skriva fritt.</p>

		<div class="rounded-2xl border border-black/10 dark:border-white/10 bg-white/45 dark:bg-white/5 p-4 mb-7">
			<textarea
				bind:value={note}
				rows={6}
				placeholder="Skriv din anteckning här..."
				class="w-full resize-y rounded-xl border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 px-4 py-3 text-sm leading-relaxed outline-none focus:border-[var(--primary)] transition-colors"
			></textarea>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
				<div>
					<label class="block text-xs opacity-65 mb-1" for="mood">Känsla (valfritt)</label>
					<div class="relative">
						<select
							id="mood"
							name="mood"
							bind:value={selectedMood}
							class="w-full appearance-none rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 pr-10 text-sm text-slate-100 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
						>
							<option value="" class="bg-slate-800 text-slate-100">Välj känsla</option>
							{#each moods as mood}
								<option value={mood} class="bg-slate-800 text-slate-100">{mood}</option>
							{/each}
						</select>
						<svg
							aria-hidden="true"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
						>
							<path
								fill-rule="evenodd"
								d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
				</div>

				<div>
					<label class="block text-xs opacity-65 mb-1" for="tags">Taggar (valfritt)</label>
					<input
						id="tags"
						type="text"
						bind:value={tagsInput}
						placeholder="t.ex. sömn, oro, lättnad"
						class="w-full rounded-xl border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)] transition-colors"
					/>
				</div>
			</div>

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
				{#each entries as entry (entry.id)}
					<article class="rounded-2xl border border-black/10 dark:border-white/10 bg-white/45 dark:bg-white/5 p-4">
						{#if editingEntryId === entry.id}
							<p class="text-xs opacity-60 mb-2">{formatDateTime(entry.created_at)}</p>
							<textarea
								bind:value={editableText}
								rows={5}
								class="w-full resize-y rounded-xl border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 px-4 py-3 text-sm leading-relaxed outline-none focus:border-[var(--primary)] transition-colors"
							></textarea>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
								<div>
									<label class="block text-xs opacity-65 mb-1" for={`edit-mood-${entry.id}`}>
										Känsla (valfritt)
									</label>
									<div class="relative">
										<select
											id={`edit-mood-${entry.id}`}
											bind:value={editableMood}
											class="w-full appearance-none rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 pr-10 text-sm text-slate-100 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
										>
											<option value="" class="bg-slate-800 text-slate-100">Välj känsla</option>
											{#each moods as mood}
												<option value={mood} class="bg-slate-800 text-slate-100">{mood}</option>
											{/each}
										</select>
										<svg
											aria-hidden="true"
											viewBox="0 0 20 20"
											fill="currentColor"
											class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
										>
											<path
												fill-rule="evenodd"
												d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
												clip-rule="evenodd"
											/>
										</svg>
									</div>
								</div>

								<div>
									<label class="block text-xs opacity-65 mb-1" for={`edit-tags-${entry.id}`}>
										Taggar (valfritt)
									</label>
									<input
										id={`edit-tags-${entry.id}`}
										type="text"
										bind:value={editableTags}
										placeholder="t.ex. sömn, oro, lättnad"
										class="w-full rounded-xl border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)] transition-colors"
									/>
								</div>
							</div>

							<div class="mt-3 flex justify-end gap-2">
								<button
									type="button"
									onclick={cancelEditing}
									disabled={updatingEntry}
									class="px-4 py-2 rounded-xl border border-black/12 dark:border-white/12 bg-white/50 dark:bg-white/5 text-sm opacity-85 hover:opacity-100 disabled:opacity-45 transition-opacity"
								>
									Avbryt
								</button>
								<button
									type="button"
									onclick={saveEditedEntry}
									disabled={updatingEntry || !editableText.trim()}
									class="px-4 py-2 rounded-xl border border-black/12 dark:border-white/12 bg-white/60 dark:bg-white/5 text-sm font-medium opacity-90 hover:opacity-100 disabled:opacity-45 transition-opacity"
								>
									{updatingEntry ? 'Sparar...' : 'Spara ändringar'}
								</button>
							</div>
							{#if updateError}
								<p class="mt-2 text-sm opacity-70">{updateError}</p>
							{/if}
						{:else}
							<div class="mb-2 flex items-start justify-between gap-3">
								<p class="text-xs opacity-60">{formatDateTime(entry.created_at)}</p>
								<div class="flex items-center gap-2">
									<button
										type="button"
										onclick={() => startEditing(entry)}
										disabled={deletingEntryId === entry.id}
										class="text-xs px-2.5 py-1 rounded-lg border border-black/12 dark:border-white/12 bg-white/50 dark:bg-white/5 opacity-85 hover:opacity-100 disabled:opacity-45 transition-opacity"
									>
										Redigera
									</button>
									<button
										type="button"
										onclick={() => deleteEntry(entry.id)}
										disabled={deletingEntryId === entry.id}
										class="text-xs px-2.5 py-1 rounded-lg border border-red-700/40 bg-red-900/20 text-red-100 opacity-90 hover:opacity-100 disabled:opacity-45 transition-opacity"
									>
										{deletingEntryId === entry.id ? 'Raderar...' : 'Radera'}
									</button>
								</div>
							</div>
							{#if entry.mood || entry.tags.length > 0}
								<p class="text-xs opacity-65 mb-2">
									{#if entry.mood}<span>Känsla: {entry.mood}</span>{/if}
									{#if entry.tags.length > 0}
										{#if entry.mood}<span class="mx-1">·</span>{/if}
										<span>Taggar: {entry.tags.join(', ')}</span>
									{/if}
								</p>
							{/if}
							<p class="text-sm leading-relaxed whitespace-pre-wrap opacity-85">{entry.content}</p>
						{/if}
					</article>
				{/each}
			{/if}
			{#if deleteError}
				<p class="text-sm opacity-70">{deleteError}</p>
			{/if}
		</div>

		<div class="mt-6 rounded-xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 p-3">
			<label class="flex items-start gap-2 text-sm opacity-80">
				<input
					type="checkbox"
					bind:checked={reminderOptIn}
					onchange={updateReminderPreference}
					class="mt-0.5 h-4 w-4 rounded border-black/20 dark:border-white/20"
				/>
				<span>Skicka påminnelse om att skriva dagbok</span>
			</label>
			<p class="mt-2 text-xs opacity-60">
				Valet sparas i din profil så att påminnelser kan hanteras via e-post eller notifiering.
			</p>
			{#if reminderOptIn && reminderNextAt}
				<p class="mt-1 text-xs opacity-60">Nästa möjliga påminnelse: {formatDateTime(reminderNextAt)}</p>
			{/if}
			{#if reminderSaving}
				<p class="mt-1 text-xs opacity-60">Sparar påminnelseval...</p>
			{/if}
			{#if reminderError}
				<p class="mt-1 text-xs opacity-70">{reminderError}</p>
			{/if}
		</div>

		<p class="mt-4 text-xs opacity-50 text-center">Det du skriver här delas inte med någon.</p>
	</section>
{/if}
