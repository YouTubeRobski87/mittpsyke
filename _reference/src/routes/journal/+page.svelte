<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { supabase } from '$lib/supabase/client';
	import { tones } from '$lib/data/tones';

	import DiaryCard from '$lib/components/DiaryCard.svelte';
	import LegalFooter from '$lib/components/LegalFooter.svelte';
	import IconArrowLeft from '$lib/assets/icons/IconArrowLeft.svelte';
	import type { Component } from 'svelte';
	import { EmojiRobot, EmojiFaceYawning, EmojiFlagUk, EmojiArchive, EmojiCat, EmojiTornado, EmojiLedger, EmojiFaceGrimacing, EmojiFaceUnamused, EmojiTopHat, EmojiHeartOnFire, EmojiFaceUpsideDown, EmojiOwl, EmojiVideoGame, EmojiWomanDetective, EmojiCrown, EmojiEarth, EmojiMicrophone, EmojiPoo, EmojiBrain, EmojiOpenBook, EmojiSatellite, EmojiWomanMeditating, EmojiNewspaper, EmojiMusicalNotes, EmojiTheaterMasks, EmojiFaceNerd, EmojiFaceExplodingHead, EmojiClipboard, EmojiFramedPicture, EmojiPrinter, EmojiEnvelopeArrow, EmojiEnvelopeEmail, EmojiCrossMark, EmojiTrash, EmojiFloppyDisk, EmojiCompass, EmojiRocket, EmojiSpeakingHead, EmojiPencil } from '$lib/assets/emojis';
	import UniqueEmoji from '$lib/components/UniqueEmoji.svelte';
	import { downloadAsImage } from '$lib/utils/imageDownload';
	import { downloadAsPdf } from '$lib/utils/pdfDownload';
	import PdfDocument from '$lib/components/PdfDocument.svelte';
	import { getApiUrl } from '$lib/config';

	interface Entry {
		id: string;
		user_id: string;
		created_at: string;
		generated_text: string;
		tone_id: string;
		entry_date: string;
		weekday: string | null;
		emojis: string[];
		mood_color: string | null;
		energy_level: number | null;
		sleep_quality: number | null;
		mood_level: number | null;
	}

	let isLoading = $state(true);
	let entries = $state<Entry[]>([]);
	let error = $state('');

	// Date filter from calendar navigation
	let filterDate = $state<string | null>(null);

	// Modal state
	let selectedEntry = $state<Entry | null>(null);
	let showDeleteConfirm = $state(false);
	let isDeleting = $state(false);
	let isCopying = $state(false);
	let isDownloading = $state(false);
	let isDownloadingPdf = $state(false);
	let isSendingEmail = $state(false);
	let showEmailModal = $state(false);
	let emailAddress = $state('');

	// Writing mode modal state
	let showModeModal = $state(false);

	const writingModes = [
		{ id: 'wizard', title: 'Steg-för-steg', icon: EmojiCompass, href: '/wizard' },
		{ id: 'quick', title: 'Snabbläge', icon: EmojiRocket, href: '/quick' },
		{ id: 'interview', title: 'AI-intervju', icon: EmojiSpeakingHead, href: '/interview' },
		{ id: 'editor', title: 'Skriv fritt', icon: EmojiPencil, href: '/editor' }
	];

	function closeModeModal() {
		showModeModal = false;
	}
	let emailError = $state('');
	let emailSent = $state(false);

	// Edit state
	let isEditing = $state(false);
	let editText = $state('');
	let isSavingEdit = $state(false);
	let editSaveError = $state('');

	// References for export
	let modalDiaryCardRef: DiaryCard = $state(null!);
	let pdfDocRef: PdfDocument = $state(null!);

	// Detect dark mode for image export
	let isDarkMode = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined') {
			isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

			const observer = new MutationObserver(() => {
				isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
			});
			observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

			return () => observer.disconnect();
		}
	});

	const toneIconMap: Record<string, Component> = {
		'ai-robot': EmojiRobot,
		'bored': EmojiFaceYawning,
		'british': EmojiFlagUk,
		'bureaucratic': EmojiArchive,
		'cat-perspective': EmojiCat,
		'chaotic': EmojiTornado,
		'classic': EmojiLedger,
		'cringe': EmojiFaceGrimacing,
		'cynical': EmojiFaceUnamused,
		'detective': EmojiWomanDetective,
		'drama-queen': EmojiCrown,
		'formal': EmojiTopHat,
		'melodramatic': EmojiHeartOnFire,
		'meme': EmojiPoo,
		'nature-documentary': EmojiEarth,
		'nerd': EmojiFaceNerd,
		'overthinker': EmojiFaceExplodingHead,
		'passive-aggressive': EmojiFaceUpsideDown,
		'philosophical': EmojiOwl,
		'quest-log': EmojiVideoGame,
		'self-help': EmojiWomanMeditating,
		'shakespeare': EmojiTheaterMasks,
		'sportscaster': EmojiMicrophone,
		'storytelling': EmojiOpenBook,
		'tabloid': EmojiNewspaper,
		'therapist': EmojiBrain,
		'tinfoil-hat': EmojiSatellite,
		'troubadour': EmojiMusicalNotes
	};

	const swedishMonths: Record<string, string> = {
		'01': 'Januari', '02': 'Februari', '03': 'Mars', '04': 'April',
		'05': 'Maj', '06': 'Juni', '07': 'Juli', '08': 'Augusti',
		'09': 'September', '10': 'Oktober', '11': 'November', '12': 'December'
	};

	const swedishWeekdays: Record<string, string> = {
		'0': 'Söndag', '1': 'Måndag', '2': 'Tisdag', '3': 'Onsdag',
		'4': 'Torsdag', '5': 'Fredag', '6': 'Lördag'
	};

	function formatEntryDate(dateStr: string, createdAt?: string): { weekday: string; date: string } {
		const d = new Date(dateStr + 'T00:00:00');
		const weekday = swedishWeekdays[String(d.getDay())] || '';
		const day = d.getDate();
		const month = swedishMonths[String(d.getMonth() + 1).padStart(2, '0')]?.toLowerCase() || '';
		const year = d.getFullYear();
		let dateText = `${day} ${month} ${year}`;
		if (createdAt) {
			const created = new Date(createdAt);
			const hours = created.getHours().toString().padStart(2, '0');
			const minutes = created.getMinutes().toString().padStart(2, '0');
			dateText += `, kl. ${hours}:${minutes}`;
		}
		return { weekday, date: dateText };
	}

	function getMonthKey(dateStr: string): string {
		const [year, month] = dateStr.split('-');
		return `${swedishMonths[month]} ${year}`;
	}

function getToneIcon(id: string): Component | undefined {
		return toneIconMap[id];
	}

	function getToneName(id: string): string {
		return tones.find((t) => t.id === id)?.name || id;
	}

	const filteredEntries = $derived(
		filterDate ? entries.filter((e) => e.entry_date === filterDate) : entries
	);

	const groupedEntries = $derived.by(() => {
		const groups: { month: string; entries: Entry[] }[] = [];
		let currentMonth = '';

		for (const entry of filteredEntries) {
			const month = getMonthKey(entry.entry_date);
			if (month !== currentMonth) {
				currentMonth = month;
				groups.push({ month, entries: [entry] });
			} else {
				groups[groups.length - 1].entries.push(entry);
			}
		}

		return groups;
	});

	function openEntry(entry: Entry) {
		selectedEntry = entry;
		showDeleteConfirm = false;
	}

	function closeModal() {
		selectedEntry = null;
		showDeleteConfirm = false;
		isEditing = false;
		editText = '';
		editSaveError = '';
	}

	let editTextareaEl: HTMLTextAreaElement = $state(null!);

	function autoResizeTextarea() {
		if (!editTextareaEl) return;
		editTextareaEl.style.height = 'auto';
		editTextareaEl.style.height = editTextareaEl.scrollHeight + 'px';
	}

	$effect(() => {
		if (isEditing && editTextareaEl) {
			autoResizeTextarea();
		}
	});

	function startEditing() {
		if (!selectedEntry) return;
		editText = selectedEntry.generated_text;
		isEditing = true;
		editSaveError = '';
	}

	function cancelEditing() {
		isEditing = false;
		editText = '';
		editSaveError = '';
	}

	async function saveEdit() {
		if (!selectedEntry || isSavingEdit) return;
		isSavingEdit = true;
		editSaveError = '';

		try {
			const { error: updateError } = await supabase
				.from('entries')
				.update({
					generated_text: editText,
					updated_at: new Date().toISOString()
				})
				.eq('id', selectedEntry.id);

			if (updateError) {
				editSaveError = 'Kunde inte spara ändringarna. Försök igen.';
				console.error('Update entry error:', updateError);
				return;
			}

			// Update local state
			const updatedText = editText;
			entries = entries.map((e) =>
				e.id === selectedEntry!.id ? { ...e, generated_text: updatedText } : e
			);
			selectedEntry = { ...selectedEntry, generated_text: updatedText };
			isEditing = false;
			editText = '';
		} catch (err) {
			editSaveError = 'Kunde inte ansluta till servern. Försök igen.';
			console.error('Update entry error:', err);
		} finally {
			isSavingEdit = false;
		}
	}

	async function copyToClipboard() {
		if (!selectedEntry || isCopying) return;
		isCopying = true;
		try {
			await navigator.clipboard.writeText(selectedEntry.generated_text);
		} catch (err) {
			console.error('Failed to copy:', err);
		} finally {
			setTimeout(() => { isCopying = false; }, 1500);
		}
	}

	async function deleteEntry() {
		if (!selectedEntry || isDeleting) return;
		isDeleting = true;

		try {
			const { error: deleteError } = await supabase
				.from('entries')
				.delete()
				.eq('id', selectedEntry.id);

			if (deleteError) {
				console.error('Delete error:', deleteError);
				return;
			}

			entries = entries.filter((e) => e.id !== selectedEntry!.id);
			closeModal();
		} catch (err) {
			console.error('Delete error:', err);
		} finally {
			isDeleting = false;
		}
	}

	async function downloadAsImageHandler() {
		const element = modalDiaryCardRef?.getDocumentElement();
		if (!element || isDownloading || !selectedEntry) return;
		isDownloading = true;

		const noExport = element.querySelector<HTMLElement>('[data-no-export]');
		if (noExport) noExport.style.display = 'none';

		try {
			const timeStr = selectedEntry.created_at ? `-${new Date(selectedEntry.created_at).getHours().toString().padStart(2, '0')}${new Date(selectedEntry.created_at).getMinutes().toString().padStart(2, '0')}` : '';
			const filename = `dagbok-${selectedEntry.entry_date || 'entry'}${timeStr}.png`;
			const exportWidth = Math.max(1200, Math.ceil(element.getBoundingClientRect().width));
			await downloadAsImage(element, filename, { width: exportWidth, scale: 2 });
		} catch (err) {
			console.error('Failed to download image:', err);
		} finally {
			if (noExport) noExport.style.display = '';
			isDownloading = false;
		}
	}

	async function downloadAsPdfHandler() {
		const element = pdfDocRef?.getElement();
		if (!element || isDownloadingPdf || !selectedEntry) return;
		isDownloadingPdf = true;

		try {
			const timeStr = selectedEntry.created_at ? `-${new Date(selectedEntry.created_at).getHours().toString().padStart(2, '0')}${new Date(selectedEntry.created_at).getMinutes().toString().padStart(2, '0')}` : '';
		await downloadAsPdf(element, `dagbok-${selectedEntry.entry_date || 'entry'}${timeStr}.pdf`);
		} catch (err) {
			console.error('Failed to download PDF:', err);
		} finally {
			isDownloadingPdf = false;
		}
	}

	function openEmailModal() {
		emailAddress = '';
		emailError = '';
		emailSent = false;
		showEmailModal = true;
	}

	function closeEmailModal() {
		showEmailModal = false;
		emailAddress = '';
		emailError = '';
	}

	async function sendEmail() {
		if (isSendingEmail || !emailAddress.trim() || !selectedEntry) return;
		isSendingEmail = true;
		emailError = '';

		try {
			const { weekday, date } = formatEntryDate(selectedEntry.entry_date, selectedEntry.created_at);
			const response = await fetch(getApiUrl('/api/email'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email: emailAddress.trim(),
					entry: selectedEntry.generated_text,
					date,
					weekday
				})
			});

			const result = await response.json();

			if (result.success) {
				emailSent = true;
				setTimeout(() => {
					closeEmailModal();
				}, 1500);
			} else {
				emailError = result.error || 'Kunde inte skicka e-post.';
			}
		} catch (err) {
			emailError = 'Kunde inte ansluta till servern. Försök igen.';
			console.error('Email error:', err);
		} finally {
			isSendingEmail = false;
		}
	}

	async function loadEntries() {
		const { data, error: fetchError } = await supabase
			.from('entries')
			.select('*')
			.order('entry_date', { ascending: false });

		if (fetchError) {
			error = 'Kunde inte ladda dagböcker.';
			console.error('Fetch entries error:', fetchError);
		} else {
			entries = data || [];
		}
		isLoading = false;
	}

	function clearDateFilter() {
		filterDate = null;
		// Remove query param from URL without navigation
		const url = new URL(window.location.href);
		url.searchParams.delete('date');
		window.history.replaceState({}, '', url.toString());
	}

	onMount(() => {
		// Read date filter from URL
		const dateParam = new URL(window.location.href).searchParams.get('date');
		if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
			filterDate = dateParam;
		}

		const checkAuth = () => {
			if (authStore.isLoading) {
				setTimeout(checkAuth, 50);
				return;
			}
			if (!authStore.isLoggedIn) {
				goto('/login');
				return;
			}
			loadEntries();
		};
		checkAuth();
	});
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && selectedEntry && closeModal()} />

<div class="journal-page">
	<div class="journal-container">
		<div class="journal-header">
			<div class="header-icon"><UniqueEmoji><EmojiArchive size={72} /></UniqueEmoji></div>
			<h1 class="journal-title">Dagböcker</h1>
			<p class="journal-subtitle">Dina sparade dagboksanteckningar</p>
		</div>

		{#if filterDate}
			<div class="date-filter-bar">
				<span class="filter-text">Visar inlägg för {filterDate}</span>
				<button class="filter-clear" onclick={clearDateFilter}>Visa alla</button>
			</div>
		{/if}

		{#if isLoading}
			<div class="journal-loading">
				<span class="spinner"></span>
				<p>Laddar dagböcker...</p>
			</div>
		{:else if error}
			<div class="journal-error">{error}</div>
		{:else if entries.length === 0}
			<div class="journal-empty">
				<p class="empty-text">Du har inga sparade dagboksanteckningar ännu.</p>
				<button class="empty-link" onclick={() => showModeModal = true}>Skapa din första dagboksanteckning</button>
			</div>
		{:else}
			{#each groupedEntries as group}
				<div class="month-group">
					<h2 class="month-label">{group.month}</h2>
					<div class="entries-grid">
						{#each group.entries as entry}
							{@const { weekday, date } = formatEntryDate(entry.entry_date, entry.created_at)}
							{@const ToneIcon = getToneIcon(entry.tone_id)}
							<button class="entry-card" onclick={() => openEntry(entry)}>
								<div class="card-date">
									<span class="card-weekday">{weekday || entry.weekday || ''}</span>
									<span class="card-date-text">{date}</span>
								</div>
								<div class="card-tone">
									{#if ToneIcon}
										<span class="card-tone-icon"><UniqueEmoji><ToneIcon size={16} /></UniqueEmoji></span>
									{/if}
									<span class="card-tone-name">{getToneName(entry.tone_id)}</span>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/each}
		{/if}

		<footer class="journal-footer">
			<a href="/profile" class="btn btn-secondary"><IconArrowLeft size={16} /> Tillbaka</a>
		</footer>
	</div>
	<LegalFooter />
</div>

{#if showModeModal}
	<div class="mode-modal-overlay" onclick={closeModeModal} role="button" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && closeModeModal()}>
		<div class="mode-modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && closeModeModal()} role="dialog" aria-modal="true" aria-labelledby="mode-modal-title" tabindex="-1">
			<h2 id="mode-modal-title" class="mode-modal-title">Skriv en dagbok</h2>
			<p class="mode-modal-description">Välj hur du vill skriva dagens anteckning.</p>
			<div class="mode-grid">
				{#each writingModes as mode}
					<a href={mode.href} class="mode-card" onclick={closeModeModal}>
						<div class="mode-card-icon">
							<mode.icon size={36} />
						</div>
						<span class="mode-card-title">{mode.title}</span>
					</a>
				{/each}
			</div>
		</div>
	</div>
{/if}

{#if selectedEntry}
	{@const { weekday, date } = formatEntryDate(selectedEntry.entry_date, selectedEntry.created_at)}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="modal-overlay" onclick={closeModal} role="button" tabindex="-1">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Dagboksinlägg" tabindex="-1">
			<div class="modal-diary-card">
				{#if isEditing}
					<textarea class="edit-textarea" bind:value={editText} bind:this={editTextareaEl} oninput={autoResizeTextarea}></textarea>
					{#if editSaveError}
						<p class="edit-save-error">{editSaveError}</p>
					{/if}
				{:else}
					<DiaryCard
						bind:this={modalDiaryCardRef}
						weekday={weekday || selectedEntry.weekday || ''}
						date={date}
						emojis={selectedEntry.emojis || []}
						toneId={selectedEntry.tone_id}
						generatedText={selectedEntry.generated_text}
						editable={true}
						onEdit={startEditing}
						onClose={closeModal}
					/>
				{/if}
			</div>

			{#if isEditing}
				<div class="edit-actions">
					<button class="edit-btn edit-btn-cancel" onclick={cancelEditing} disabled={isSavingEdit}>
						<EmojiCrossMark size={18} />
						<span>Avbryt</span>
					</button>
					<button class="edit-btn edit-btn-save" onclick={saveEdit} disabled={isSavingEdit}>
						{#if isSavingEdit}
							<span class="spinner"></span>
							<span>Sparar...</span>
						{:else}
							<EmojiFloppyDisk size={18} />
							<span>Spara</span>
						{/if}
					</button>
				</div>
			{:else}
				<div class="modal-actions">
					<button class="modal-action-btn" onclick={downloadAsImageHandler} disabled={isDownloading}>
						{#if isDownloading}
							<span class="spinner"></span>
							<span>Sparar...</span>
						{:else}
							<EmojiFramedPicture size={18} />
							<span>Spara bild</span>
						{/if}
					</button>
					<button class="modal-action-btn" onclick={downloadAsPdfHandler} disabled={isDownloadingPdf}>
						{#if isDownloadingPdf}
							<span class="spinner"></span>
							<span>Skapar...</span>
						{:else}
							<EmojiPrinter size={18} />
							<span>Spara PDF</span>
						{/if}
					</button>
					<button class="modal-action-btn" onclick={copyToClipboard} disabled={isCopying}>
						{#if isCopying}
							<svg class="action-icon check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
								<polyline points="20 6 9 17 4 12"/>
							</svg>
							<span>Kopierat!</span>
						{:else}
							<EmojiClipboard size={18} />
							<span>Kopiera</span>
						{/if}
					</button>
					<button class="modal-action-btn" onclick={openEmailModal}>
						<EmojiEnvelopeArrow size={18} />
						<span>Maila</span>
					</button>
				</div>

				<div class="modal-delete-row">
					{#if showDeleteConfirm}
						<div class="delete-confirm">
							<span class="delete-confirm-text">Ta bort anteckningen?</span>
							<button class="delete-confirm-btn delete-yes" onclick={deleteEntry} disabled={isDeleting}>
								{#if isDeleting}
									<span class="spinner"></span>
								{:else}
									Ja, ta bort
								{/if}
							</button>
							<button class="delete-confirm-btn delete-no" onclick={() => showDeleteConfirm = false}>
								Avbryt
							</button>
						</div>
					{:else}
						<button class="modal-action-btn modal-delete-btn" onclick={() => showDeleteConfirm = true}>
							<EmojiTrash size={18} />
							<span>Ta bort</span>
						</button>
					{/if}
				</div>

			{/if}
		</div>
	</div>
{/if}

{#if showEmailModal}
	<div class="email-overlay" onclick={closeEmailModal} role="button" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && closeEmailModal()}>
		<div class="email-modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && closeEmailModal()} role="dialog" aria-modal="true" aria-labelledby="email-modal-title" tabindex="-1">
			<h2 id="email-modal-title" class="email-modal-title">Skicka som e-post</h2>
			<p class="email-modal-description">Ange en e-postadress så skickar vi dagboksinlägget dit.</p>

			<input
				type="email"
				class="email-modal-input"
				placeholder="din@email.se"
				bind:value={emailAddress}
				onkeydown={(e) => e.key === 'Enter' && sendEmail()}
				disabled={isSendingEmail || emailSent}
			/>

			{#if emailError}
				<p class="email-modal-error">{emailError}</p>
			{/if}

			<div class="email-modal-actions">
				<button class="email-modal-btn email-modal-btn-cancel" onclick={closeEmailModal} disabled={isSendingEmail}>
					Avbryt
				</button>
				<button class="email-modal-btn email-modal-btn-send" onclick={sendEmail} disabled={isSendingEmail || emailSent || !emailAddress.trim()}>
					{#if emailSent}
						<svg class="action-icon check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
							<polyline points="20 6 9 17 4 12"/>
						</svg>
						Skickat!
					{:else if isSendingEmail}
						<span class="spinner"></span>
						Skickar...
					{:else}
						<EmojiEnvelopeEmail size={22} />
						Skicka
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if selectedEntry}
	{@const { weekday: pdfWeekday, date: pdfDate } = formatEntryDate(selectedEntry.entry_date, selectedEntry.created_at)}
	<PdfDocument
		bind:this={pdfDocRef}
		weekday={pdfWeekday}
		date={pdfDate}
		emojis={selectedEntry.emojis || []}
		toneId={selectedEntry.tone_id}
		generatedText={selectedEntry.generated_text}
	/>
{/if}

<style>
	.date-filter-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 1rem;
		margin-bottom: 1rem;
		background: color-mix(in srgb, var(--color-accent) 8%, var(--color-bg-elevated));
		border: 1px solid color-mix(in srgb, var(--color-accent) 25%, var(--color-border));
		border-radius: var(--radius-md);
	}

	.filter-text {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text);
	}

	.filter-clear {
		padding: 0.25rem 0.625rem;
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--color-accent);
		background: none;
		border: 1px solid var(--color-accent);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.filter-clear:hover {
		background: var(--color-accent);
		color: white;
	}

	.journal-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		padding-top: 1rem;
	}

	.journal-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 700px;
	}

	.journal-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.8;
		margin-bottom: 0.75rem;
	}

	.journal-title {
		font-family: var(--font-primary);
		font-size: var(--text-3xl);
		font-weight: var(--weight-medium);
		font-stretch: 115%;
		letter-spacing: var(--tracking-tighter);
		line-height: var(--leading-tight);
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
	}

	.journal-subtitle {
		font-family: var(--font-primary);
		font-size: var(--text-base);
		color: var(--color-text-muted);
		font-weight: var(--weight-book);
		letter-spacing: var(--tracking-wide);
		margin: 0;
	}

	/* Loading & Empty States */

	.journal-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 3rem 0;
		color: var(--color-text-muted);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		letter-spacing: var(--tracking-wide);
	}

	.journal-loading p {
		margin: 0;
	}

	.journal-error {
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-accent) 10%, transparent);
		color: var(--color-accent);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		text-align: center;
	}

	.journal-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 3rem 0;
		text-align: center;
	}

	.empty-text {
		font-family: var(--font-primary);
		font-size: var(--text-base);
		color: var(--color-text-muted);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		margin: 0;
	}

	.empty-link {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-accent);
		text-decoration: none;
		letter-spacing: var(--tracking-wide);
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.empty-link:hover {
		text-decoration: underline;
	}

	/* Month Groups */

	.month-group {
		margin-bottom: 2rem;
	}

	.month-label {
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		font-stretch: 110%;
		letter-spacing: var(--tracking-widest);
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin: 0 0 0.75rem 0;
	}

	/* Entry Cards Grid */

	.entries-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.entry-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.875rem 1.25rem;
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
		text-align: left;
		font-family: var(--font-primary);
		color: var(--color-text);
	}

	.entry-card:hover {
		border-color: var(--color-accent);
		box-shadow: 0 2px 8px rgba(244, 63, 122, 0.08);
	}

	.card-date {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
	}

	.card-weekday {
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		line-height: var(--leading-snug);
		color: var(--color-text);
	}

	.card-date-text {
		font-size: var(--text-xs);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
	}

	.card-tone {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.card-tone-icon {
		display: flex;
		align-items: center;
	}

	.card-tone-name {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	/* Writing mode modal */

	.mode-modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.15s ease;
		padding: 1rem;
	}

	.mode-modal-content {
		background: var(--color-bg);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		width: 100%;
		max-width: 400px;
		animation: slideUp 0.2s ease;
	}

	.mode-modal-title {
		font-family: var(--font-primary);
		font-size: var(--text-xl);
		font-weight: var(--weight-medium);
		font-stretch: 110%;
		letter-spacing: var(--tracking-tight);
		color: var(--color-text);
		margin: 0 0 0.375rem 0;
		text-align: center;
	}

	.mode-modal-description {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-book);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
		margin: 0 0 1.25rem 0;
		text-align: center;
	}

	.mode-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.mode-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.625rem;
		padding: 1.25rem 1rem;
		background: var(--color-bg-elevated);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: inherit;
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.mode-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		text-decoration: none;
	}

	.mode-card:active {
		transform: scale(0.98);
	}

	.mode-card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mode-card-title {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		color: var(--color-text);
	}

	@keyframes slideUp {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	/* Entry modal */

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		z-index: 1000;
		padding: 2rem 1rem;
		overflow-y: auto;
		animation: fadeIn 0.15s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal-content {
		position: relative;
		width: 100%;
		max-width: 720px;
		background: var(--color-bg-elevated);
		border-radius: var(--radius-md);
		padding: 1.25rem;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.2s ease;
	}

	@keyframes slideUp {
		from { transform: translateY(10px); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}

	.modal-diary-card {
		margin-bottom: 1rem;
	}

	.modal-actions {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.75rem;
	}

	.modal-action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
		white-space: nowrap;
		background: var(--color-bg-elevated);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		box-shadow: inset 0 0 0 0px transparent;
	}

	.modal-action-btn:hover:not(:disabled):not(.modal-delete-btn) {
		border-color: var(--color-accent);
		box-shadow: inset 0 0 0 1px var(--color-accent);
	}

	.modal-action-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.modal-delete-row {
		margin-top: 0.75rem;
	}

	.modal-delete-btn {
		width: 100%;
		color: var(--color-accent);
		border: 2px solid var(--color-accent);
	}

	.modal-delete-btn:hover:not(:disabled) {
		background: var(--color-accent);
		color: white;
	}

	.action-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.action-icon.check {
		color: #22c55e;
	}

	/* Delete Confirmation */

	.delete-confirm {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.delete-confirm-text {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--color-accent);
		white-space: nowrap;
	}

	.delete-confirm-btn {
		padding: 0.5rem 0.875rem;
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-wide);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
		border: none;
	}

	.delete-yes {
		background: var(--color-accent);
		color: white;
	}

	.delete-yes:hover:not(:disabled) {
		background: var(--color-accent-hover);
	}

	.delete-yes:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.delete-no {
		background: transparent;
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
	}

	.delete-no:hover {
		background: var(--color-neutral);
	}

	/* Spinner */

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		opacity: 0.8;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Edit Mode */

	.edit-textarea {
		box-sizing: border-box;
		width: 100%;
		padding: 2rem;
		font-family: var(--font-primary);
		font-size: var(--text-base);
		font-weight: var(--weight-book);
		line-height: var(--leading-loose);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text);
		background-color: var(--color-bg-elevated);
		border: 2px solid var(--color-accent);
		border-radius: var(--radius-md);
		resize: none;
		outline: none;
		overflow: hidden;
		box-shadow: 0 0 0 3px rgba(244, 63, 122, 0.1);
	}

	.edit-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.edit-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.15s ease;
		border: none;
	}

	.edit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.edit-btn-cancel {
		background: transparent;
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
	}

	.edit-btn-cancel:hover:not(:disabled) {
		background: var(--color-neutral);
		color: var(--color-text);
	}

	.edit-btn-save {
		background: var(--color-accent);
		color: white;
	}

	.edit-btn-save:hover:not(:disabled) {
		background: var(--color-accent-hover);
	}

	.edit-save-error {
		margin: 0.75rem 0 0 0;
		padding: 0.75rem 1rem;
		background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
		border-radius: var(--radius-sm);
		color: var(--color-accent);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		text-align: center;
	}

	/* Email Modal */

	.email-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1100;
		padding: 1rem;
		animation: fadeIn 0.15s ease;
	}

	.email-modal {
		background: var(--color-bg-elevated);
		border-radius: var(--radius-md);
		padding: 1.5rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.2s ease;
	}

	.email-modal-title {
		font-family: var(--font-primary);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
	}

	.email-modal-description {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
		margin: 0 0 1rem 0;
		line-height: var(--leading-relaxed);
	}

	.email-modal-input {
		box-sizing: border-box;
		width: 100%;
		padding: 0.875rem 1rem;
		font-family: var(--font-primary);
		font-size: var(--text-base);
		font-weight: var(--weight-regular);
		color: var(--color-text);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		outline: none;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.email-modal-input:focus {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px rgba(244, 63, 122, 0.1);
	}

	.email-modal-input::placeholder {
		color: var(--color-text-muted);
	}

	.email-modal-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.email-modal-error {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		color: var(--color-error);
		margin: 0.75rem 0 0 0;
	}

	.email-modal-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.25rem;
	}

	.email-modal-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1rem;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.email-modal-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.email-modal-btn-cancel {
		background: transparent;
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
	}

	.email-modal-btn-cancel:hover:not(:disabled) {
		background: var(--color-neutral);
		color: var(--color-text);
	}

	.email-modal-btn-send {
		background: var(--color-accent);
		color: white;
		border: none;
	}

	.email-modal-btn-send:hover:not(:disabled) {
		background: var(--color-accent-hover);
	}

	/* Responsive */

	.journal-footer {
		display: flex;
		justify-content: flex-start;
		padding-top: 2.25rem;
		margin-top: auto;
	}

	@media (max-width: 640px) {
		.modal-actions {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 480px) {
		.modal-actions {
			grid-template-columns: 1fr;
		}

		.edit-textarea {
			padding: 1.25rem;
		}

		.edit-btn {
			padding: 0.875rem 1rem;
		}
	}

	@media (max-width: 600px) {
		.journal-page {
			padding: 1rem;
			padding-top: 0.5rem;
		}

		.modal-overlay {
			padding: 1rem 0.75rem;
		}
	}
</style>
