<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { supabase } from '$lib/supabase/client';
	import { getApiUrl } from '$lib/config';
	import { isSeparatorParagraph } from '$lib/utils/paragraphs';
	import { downloadAsImage } from '$lib/utils/imageDownload';
	import { downloadAsPdf } from '$lib/utils/pdfDownload';
	import resultMessages from '$lib/data/resultMessages.json';
	import DiaryCard from '$lib/components/DiaryCard.svelte';
	import PdfDocument from '$lib/components/PdfDocument.svelte';
	import LegalFooter from '$lib/components/LegalFooter.svelte';

	import {
		EmojiRosePink, EmojiFramedPicture, EmojiPrinter,
		EmojiClipboard, EmojiEnvelopeArrow, EmojiEnvelopeEmail, EmojiFloppyDisk, EmojiPencil, EmojiCrossMark,
		EmojiFountainPen
	} from '$lib/assets/emojis';
	import UniqueEmoji from '$lib/components/UniqueEmoji.svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import TextAlign from '@tiptap/extension-text-align';
	import Underline from '@tiptap/extension-underline';
	import undoSvg from '$lib/assets/svg/undo.svg?raw';
	import redoSvg from '$lib/assets/svg/redo.svg?raw';
	import boldSvg from '$lib/assets/svg/bold.svg?raw';
	import italicSvg from '$lib/assets/svg/italic.svg?raw';
	import underlineSvg from '$lib/assets/svg/underline.svg?raw';
	import h1Svg from '$lib/assets/svg/h1.svg?raw';
	import h2Svg from '$lib/assets/svg/h2.svg?raw';
	import h3Svg from '$lib/assets/svg/h3.svg?raw';
	import listUnorderedSvg from '$lib/assets/svg/listUnordered.svg?raw';
	import listOrderedSvg from '$lib/assets/svg/listOrdered.svg?raw';
	import alignLeftSvg from '$lib/assets/svg/alignLeft.svg?raw';
	import alignCenterSvg from '$lib/assets/svg/alignCenter.svg?raw';
	import alignRightSvg from '$lib/assets/svg/alignRight.svg?raw';
	import horizontalRuleSvg from '$lib/assets/svg/horizontalRule.svg?raw';
	import aiSparklesSvg from '$lib/assets/svg/aiSparkles.svg?raw';

	// Date initialization
	const weekdays = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
	const months = [
		'januari', 'februari', 'mars', 'april', 'maj', 'juni',
		'juli', 'augusti', 'september', 'oktober', 'november', 'december'
	];

	// Tiptap editor
	let editor: Editor | null = $state(null);
	let editorElement: HTMLDivElement = $state(null!);

	// Track editor content for form validity
	let hasEditorContent = $state(false);

	// Toolbar reactive state (Svelte 5 doesn't detect changes on same object reference)
	let canUndo = $state(false);
	let canRedo = $state(false);
	let isBold = $state(false);
	let isItalic = $state(false);
	let isUnderline = $state(false);
	let isH1 = $state(false);
	let isH2 = $state(false);
	let isH3 = $state(false);
	let isBulletList = $state(false);
	let isOrderedList = $state(false);
	let alignLeft = $state(true);
	let alignCenter = $state(false);
	let alignRight = $state(false);

	onMount(async () => {
		await wizardStore.initProfile();

		// Mark as editor mode
		wizardStore.updateData('editorMode', true);
		wizardStore.updateData('quickMode', false);
		wizardStore.updateData('chatMode', false);

		// Try to restore a saved draft
		await wizardStore.restoreDraft('editor');

		const now = new Date();
		const weekday = weekdays[now.getDay()];
		const date = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
		wizardStore.updateData('weekday', weekday);
		wizardStore.updateData('date', date);
		wizardStore.updateData('dateISO', now.toISOString().split('T')[0]);

		// Disable addons
		wizardStore.updateData('includeHomework', false);
		wizardStore.updateData('includeHoroscope', false);
		wizardStore.updateData('includeOnThisDay', false);

		// Initialize Tiptap
		editor = new Editor({
			element: editorElement,
			autofocus: 'start',
			extensions: [
				StarterKit,
				Underline,
				Placeholder.configure({
					placeholder: 'Skriv fritt om din dag — tankar, händelser, känslor. AI:n förfinar det du skriver till ett dagboksinlägg.'
				}),
				TextAlign.configure({
					types: ['heading', 'paragraph'],
					defaultAlignment: 'left'
				})
			],
			content: (wizardStore.data.freeText || '').replace(/\s*style="[^"]*text-align:\s*[^"]*"/gi, ''),
			onUpdate: ({ editor: e }) => {
				const html = e.getHTML();
				wizardStore.updateData('freeText', html);
				hasEditorContent = !e.isEmpty;
			},
			onTransaction: ({ editor: e }) => {
				// Update all toolbar reactive state
				canUndo = e.can().chain().focus().undo().run();
				canRedo = e.can().chain().focus().redo().run();
				isBold = e.isActive('bold');
				isItalic = e.isActive('italic');
				isUnderline = e.isActive('underline');
				isH1 = e.isActive('heading', { level: 1 });
				isH2 = e.isActive('heading', { level: 2 });
				isH3 = e.isActive('heading', { level: 3 });
				isBulletList = e.isActive('bulletList');
				isOrderedList = e.isActive('orderedList');
				alignCenter = e.isActive({ textAlign: 'center' });
				alignRight = e.isActive({ textAlign: 'right' });
				alignLeft = !alignCenter && !alignRight;
			}
		});

		hasEditorContent = !editor.isEmpty;
	});

	onDestroy(() => {
		editor?.destroy();
	});

	// Refine state
	let isRefining = $state(false);

	// Entry state
	let generatedEntry = $state('');
	let error = $state('');

	// Result view state
	let diaryCardRef: DiaryCard = $state(null!);
	let pdfDocRef: PdfDocument = $state(null!);
	let isDownloading = $state(false);
	let isDownloadingPdf = $state(false);
	let isCopying = $state(false);
	let isSendingEmail = $state(false);
	let showEmailModal = $state(false);
	let emailAddress = $state('');
	let emailError = $state('');
	let emailSent = $state(false);
	let isSavingEntry = $state(false);
	let entrySaved = $state(false);
	let entrySaveError = $state('');
	let resultMessage = $state({ title: '', subtitle: '' });

	// Confirm restart state
	let showRestartConfirm = $state(false);

	// Edit state
	let isEditing = $state(false);
	let editText = $state('');
	let editTextareaEl: HTMLTextAreaElement = $state(null!);

	function autoResizeTextarea() {
		if (!editTextareaEl) return;
		editTextareaEl.style.height = 'auto';
		editTextareaEl.style.height = editTextareaEl.scrollHeight + 'px';
	}

	function startEditing() {
		editText = generatedEntry;
		isEditing = true;
	}

	$effect(() => {
		if (isEditing && editTextareaEl) {
			autoResizeTextarea();
		}
	});

	function cancelEditing() {
		isEditing = false;
		editText = '';
	}

	function saveEdit() {
		generatedEntry = editText;
		isEditing = false;
		editText = '';
	}

	function stripSeparatorLines(entry: string): string {
		return entry.split('\n').filter((line) => !isSeparatorParagraph(line)).join('\n').replace(/\n{3,}/g, '\n\n').trim();
	}

	function selectRandomMessage() {
		const randomIndex = Math.floor(Math.random() * resultMessages.length);
		resultMessage = resultMessages[randomIndex];
	}

	// Dark mode detection
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

	async function handleRefine() {
		if (!editor || isRefining) return;
		isRefining = true;
		error = '';

		try {
			const response = await fetch(getApiUrl('/api/generate'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(wizardStore.data)
			});
			const result = await response.json();
			if (result.success) {
				const refined = stripSeparatorLines(result.entry);
				editor.commands.setContent(refined);
				wizardStore.updateData('freeText', editor.getHTML());
				hasEditorContent = !editor.isEmpty;
			} else {
				error = result.error || 'Något gick fel vid förfiningen.';
			}
		} catch (err) {
			error = 'Kunde inte ansluta till servern. Försök igen.';
			console.error('Refine error:', err);
		} finally {
			isRefining = false;
		}
	}

	function handleCreateEntry() {
		if (!editor) return;
		const text = editor.getText();
		if (!text.trim()) return;
		generatedEntry = text;
		selectRandomMessage();
		void wizardStore.clearDraft('editor');
	}

	function handleStartOver() {
		if (!showRestartConfirm) {
			showRestartConfirm = true;
			return;
		}
		showRestartConfirm = false;
		wizardStore.fullReset();
		generatedEntry = '';
		error = '';
		goto('/');
	}

	async function downloadAsImageHandler() {
		const element = diaryCardRef?.getDocumentElement();
		if (!element || isDownloading) return;
		isDownloading = true;
		try {
			const filename = `dagbok-${wizardStore.data.date?.replace(/[\s,]+/g, '-').replace(/:/g, '').replace(/-+/g, '-') || 'entry'}.png`;
			const exportWidth = Math.max(1200, Math.ceil(element.getBoundingClientRect().width));
			await downloadAsImage(element, filename, { width: exportWidth, scale: 2 });
		} catch (err) {
			console.error('Failed to download image:', err);
		} finally {
			isDownloading = false;
		}
	}

	async function downloadAsPdfHandler() {
		const element = pdfDocRef?.getElement();
		if (!element || isDownloadingPdf) return;
		isDownloadingPdf = true;
		try {
			const filename = `dagbok-${wizardStore.data.date?.replace(/[\s,]+/g, '-').replace(/:/g, '').replace(/-+/g, '-') || 'entry'}.pdf`;
			await downloadAsPdf(element, filename);
		} catch (err) {
			console.error('Failed to download PDF:', err);
		} finally {
			isDownloadingPdf = false;
		}
	}

	async function copyToClipboard() {
		if (isCopying) return;
		isCopying = true;
		try {
			await navigator.clipboard.writeText(generatedEntry);
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
		} finally {
			setTimeout(() => { isCopying = false; }, 1500);
		}
	}

	function openEmailModal() {
		emailAddress = ''; emailError = ''; emailSent = false; showEmailModal = true;
	}

	function closeEmailModal() {
		showEmailModal = false; emailAddress = ''; emailError = '';
	}

	async function sendEmail() {
		if (isSendingEmail || !emailAddress.trim()) return;
		isSendingEmail = true;
		emailError = '';
		try {
			const response = await fetch(getApiUrl('/api/email'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: emailAddress.trim(),
					entry: generatedEntry,
					date: wizardStore.data.date,
					weekday: wizardStore.data.weekday
				})
			});
			const result = await response.json();
			if (result.success) {
				emailSent = true;
				setTimeout(() => closeEmailModal(), 1500);
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

	async function saveEntryToJournal() {
		if (!authStore.user || !generatedEntry.trim() || isSavingEntry) return;
		isSavingEntry = true;
		entrySaveError = '';
		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) { entrySaveError = 'Din session har gått ut. Logga in igen.'; return; }
			const payload = {
				user_id: authStore.user.id,
				generated_text: generatedEntry,
				tone_id: 'editor',
				entry_date: wizardStore.data.dateISO,
				weekday: wizardStore.data.weekday,
				emojis: [],
				mood_color: null,
				energy_level: null,
				sleep_quality: null,
				mood_level: null
			};
			const { error: insertError } = await supabase.from('entries').insert(payload);
			if (insertError) {
				entrySaveError = 'Kunde inte spara inlägget. Försök igen.';
				console.error('Save entry error:', JSON.stringify(insertError, null, 2));
			} else {
				entrySaved = true;
			}
		} catch (err) {
			entrySaveError = 'Kunde inte ansluta till servern. Försök igen.';
			console.error('Save entry error:', err);
		} finally {
			isSavingEntry = false;
		}
	}
</script>

<main class="editor-page" class:result-view={!!generatedEntry}>
	{#if generatedEntry}
		<!-- Result view -->
		<div class="result-view-content">
			<div class="result-intro">
				<div class="result-icon">
					<EmojiRosePink size={48} />
				</div>
				<h1 class="result-title">{resultMessage.title}</h1>
				<p class="result-subtitle">{resultMessage.subtitle}</p>
			</div>

			<div class="document-wrapper">
				{#if isEditing}
					<textarea class="edit-textarea" bind:value={editText} bind:this={editTextareaEl} oninput={autoResizeTextarea}></textarea>
				{:else}
					<DiaryCard
						bind:this={diaryCardRef}
						weekday={wizardStore.data.weekday}
						date={wizardStore.data.date}
						emojis={[]}
						toneId="classic"
						generatedText={generatedEntry}
						birthday={wizardStore.data.profile.birthday ?? undefined}
						editable={true}
						onEdit={startEditing}
					/>
				{/if}
			</div>

			{#if isEditing}
				<div class="edit-actions">
					<button class="edit-btn edit-btn-cancel" onclick={cancelEditing}>
						<EmojiCrossMark size={18} />
						<span>Avbryt</span>
					</button>
					<button class="edit-btn edit-btn-save" onclick={saveEdit}>
						<EmojiFloppyDisk size={18} />
						<span>Spara</span>
					</button>
				</div>
			{/if}

			{#if authStore.isLoggedIn}
				<div class="journal-save-container">
					<button class="action-btn journal-save-btn" onclick={saveEntryToJournal} disabled={isSavingEntry || entrySaved}>
						{#if isSavingEntry}
							<span class="spinner"></span>
							<span>Sparar...</span>
						{:else if entrySaved}
							<svg class="action-icon check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
								<polyline points="20 6 9 17 4 12"/>
							</svg>
							<span>Sparat dagbok!</span>
						{:else}
							<EmojiFloppyDisk size={22} />
							<span>Spara dagbok</span>
						{/if}
					</button>
					{#if entrySaveError}
						<p class="journal-save-error">{entrySaveError}</p>
					{/if}
				</div>
			{/if}

			<div class="actions-container">
				<div class="result-actions">
					<button class="action-btn" onclick={downloadAsImageHandler} disabled={isDownloading}>
						{#if isDownloading}
							<span class="spinner"></span><span>Sparar...</span>
						{:else}
							<EmojiFramedPicture size={22} /><span>Spara bild</span>
						{/if}
					</button>
					<button class="action-btn" onclick={downloadAsPdfHandler} disabled={isDownloadingPdf}>
						{#if isDownloadingPdf}
							<span class="spinner"></span><span>Skapar...</span>
						{:else}
							<EmojiPrinter size={22} /><span>Spara PDF</span>
						{/if}
					</button>
					<button class="action-btn" onclick={copyToClipboard} disabled={isCopying}>
						{#if isCopying}
							<svg class="action-icon check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
								<polyline points="20 6 9 17 4 12"/>
							</svg>
							<span>Kopierat!</span>
						{:else}
							<EmojiClipboard size={22} /><span>Kopiera</span>
						{/if}
					</button>
					<button class="action-btn" onclick={openEmailModal}>
						<EmojiEnvelopeArrow size={22} /><span>Maila</span>
					</button>
				</div>
				{#if showRestartConfirm}
					<div class="restart-confirm">
						<span class="restart-confirm-text">Vill du börja om? Allt genererat innehåll försvinner.</span>
						<div class="restart-confirm-actions">
							<button class="restart-confirm-btn restart-yes" onclick={handleStartOver}>
								Ja, börja om
							</button>
							<button class="restart-confirm-btn restart-no" onclick={() => showRestartConfirm = false}>
								Avbryt
							</button>
						</div>
					</div>
				{:else}
					<button class="action-btn restart-btn" onclick={handleStartOver}>
						Börja om från början...
					</button>
				{/if}
			</div>

			{#if showEmailModal}
				<div class="modal-overlay" onclick={closeEmailModal} role="button" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && closeEmailModal()}>
					<div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && closeEmailModal()} role="dialog" aria-modal="true" aria-labelledby="email-modal-title" tabindex="-1">
						<h2 id="email-modal-title" class="modal-title">Skicka som e-post</h2>
						<p class="modal-description">Ange en e-postadress så skickar vi dagboksinlägget dit.</p>
						<input type="email" class="modal-input" placeholder="din@email.se" bind:value={emailAddress} onkeydown={(e) => e.key === 'Enter' && sendEmail()} disabled={isSendingEmail || emailSent} />
						{#if emailError}
							<p class="modal-error">{emailError}</p>
						{/if}
						<div class="modal-actions">
							<button class="modal-btn modal-btn-cancel" onclick={closeEmailModal} disabled={isSendingEmail}>Avbryt</button>
							<button class="modal-btn modal-btn-send" onclick={sendEmail} disabled={isSendingEmail || emailSent || !emailAddress.trim()}>
								{#if emailSent}
									<svg class="action-icon check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
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
		</div>

		<PdfDocument
			bind:this={pdfDocRef}
			weekday={wizardStore.data.weekday}
			date={wizardStore.data.date}
			emojis={[]}
			toneId="classic"
			generatedText={generatedEntry}
			birthday={wizardStore.data.profile.birthday || ''}
		/>
	{:else}
		<!-- Editor form -->
		<header class="editor-header">
			<div class="step-indicator">
				<div class="step-icon"><UniqueEmoji><EmojiPencil size={72} /></UniqueEmoji></div>
				<h1 class="step-title">Skriv fritt</h1>
			</div>
		</header>

		<div class="editor-form">
			<p class="step-intro">Skriv fritt och låt AI förfina din text.</p>

			<!-- Date display -->
			<p class="date-display">{wizardStore.data.weekday} {wizardStore.data.date}</p>

			<!-- Toolbar -->
			{#if editor}
				<div class="editor-toolbar">
					<button
						class="toolbar-btn"
						onclick={() => editor?.chain().focus().undo().run()}
						disabled={!canUndo}
						title="Ångra"
					>
						<span class="toolbar-icon">{@html undoSvg}</span>
					</button>
					<button
						class="toolbar-btn"
						onclick={() => editor?.chain().focus().redo().run()}
						disabled={!canRedo}
						title="Gör om"
					>
						<span class="toolbar-icon">{@html redoSvg}</span>
					</button>
					<span class="toolbar-separator"></span>
					<button
						class="toolbar-btn"
						class:active={isBold}
						onclick={() => editor?.chain().focus().toggleBold().run()}
						title="Fetstil"
					>
						<span class="toolbar-icon">{@html boldSvg}</span>
					</button>
					<button
						class="toolbar-btn"
						class:active={isItalic}
						onclick={() => editor?.chain().focus().toggleItalic().run()}
						title="Kursiv"
					>
						<span class="toolbar-icon">{@html italicSvg}</span>
					</button>
					<button
						class="toolbar-btn"
						class:active={isUnderline}
						onclick={() => editor?.chain().focus().toggleUnderline().run()}
						title="Understrykning"
					>
						<span class="toolbar-icon">{@html underlineSvg}</span>
					</button>
					<span class="toolbar-separator"></span>
					<button
						class="toolbar-btn"
						class:active={isH1}
						onclick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
						title="Huvudrubrik"
					>
						<span class="toolbar-icon">{@html h1Svg}</span>
					</button>
					<button
						class="toolbar-btn"
						class:active={isH2}
						onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
						title="Rubrik"
					>
						<span class="toolbar-icon">{@html h2Svg}</span>
					</button>
					<button
						class="toolbar-btn"
						class:active={isH3}
						onclick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
						title="Underrubrik"
					>
						<span class="toolbar-icon">{@html h3Svg}</span>
					</button>
					<span class="toolbar-separator"></span>
					<button
						class="toolbar-btn"
						class:active={isBulletList}
						onclick={() => editor?.chain().focus().toggleBulletList().run()}
						title="Punktlista"
					>
						<span class="toolbar-icon">{@html listUnorderedSvg}</span>
					</button>
					<button
						class="toolbar-btn"
						class:active={isOrderedList}
						onclick={() => editor?.chain().focus().toggleOrderedList().run()}
						title="Numrerad lista"
					>
						<span class="toolbar-icon">{@html listOrderedSvg}</span>
					</button>
					<span class="toolbar-separator"></span>
					<button
						class="toolbar-btn"
						class:active={alignLeft}
						onclick={() => editor?.chain().focus().setTextAlign('left').run()}
						title="Vänsterjustera"
					>
						<span class="toolbar-icon">{@html alignLeftSvg}</span>
					</button>
					<button
						class="toolbar-btn"
						class:active={alignCenter}
						onclick={() => editor?.chain().focus().setTextAlign('center').run()}
						title="Centrera"
					>
						<span class="toolbar-icon">{@html alignCenterSvg}</span>
					</button>
					<button
						class="toolbar-btn"
						class:active={alignRight}
						onclick={() => editor?.chain().focus().setTextAlign('right').run()}
						title="Högerjustera"
					>
						<span class="toolbar-icon">{@html alignRightSvg}</span>
					</button>
					<span class="toolbar-separator"></span>
					<button
						class="toolbar-btn"
						onclick={() => editor?.chain().focus().setHorizontalRule().run()}
						title="Horisontell linje"
					>
						<span class="toolbar-icon">{@html horizontalRuleSvg}</span>
					</button>
					<span class="toolbar-separator"></span>
					<button
						class="toolbar-btn toolbar-btn-ai"
						onclick={handleRefine}
						disabled={isRefining || !hasEditorContent}
						title="Förfina med AI"
					>
						{#if isRefining}
							<span class="toolbar-spinner"></span>
						{:else}
							<span class="toolbar-icon">{@html aiSparklesSvg}</span>
						{/if}
					</button>
				</div>
			{/if}

			<!-- Tiptap editor -->
			<div class="tiptap-wrapper" bind:this={editorElement}></div>

			<!-- Create entry -->
			<section class="form-section">
				{#if error}
					<div class="error-message">{error}</div>
				{/if}
				<button class="generate-btn" onclick={handleCreateEntry} disabled={!hasEditorContent}>
					<span class="generate-icon"><EmojiPencil size={28} /></span>
					Skriv anteckning
				</button>
			</section>
		</div>

		<LegalFooter />
	{/if}
</main>

<style>
	/* ==========================================================================
	   Layout
	   ========================================================================== */

	.editor-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 720px;
		margin: 0 auto;
		padding: 1.75rem 1.25rem;
	}

	.editor-page.result-view {
		padding: 1.25rem 1.25rem 2rem;
	}

	/* ==========================================================================
	   Header
	   ========================================================================== */

	.editor-header {
		margin-bottom: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.step-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		text-align: center;
	}

	.step-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.8;
	}

	.step-title {
		font-family: var(--font-primary);
		font-size: var(--text-3xl);
		font-weight: var(--weight-medium);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		line-height: var(--leading-snug);
		margin-top: 0;
	}

	.step-intro {
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-relaxed);
		margin-top: 0;
	}

	.date-display {
		text-align: center;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
		margin: 0;
	}

	/* ==========================================================================
	   Form
	   ========================================================================== */

	.editor-form {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	/* ==========================================================================
	   Toolbar
	   ========================================================================== */

	.editor-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-bottom: none;
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
	}

	.toolbar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: var(--color-text-muted);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.toolbar-btn:hover {
		background: var(--color-neutral);
		color: var(--color-text);
	}

	.toolbar-btn.active {
		background: color-mix(in srgb, var(--color-accent) 15%, transparent);
		color: var(--color-accent);
	}

	.toolbar-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.toolbar-btn:disabled:hover {
		background: transparent;
		color: var(--color-text-muted);
	}

	.toolbar-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
	}

	.toolbar-icon :global(svg) {
		width: 16px;
		height: 16px;
	}

	.toolbar-separator {
		width: 1px;
		height: 1.25rem;
		background: var(--color-border);
		margin: 0 0.125rem;
	}

	.toolbar-btn-ai {
		color: var(--color-accent);
	}

	.toolbar-btn-ai:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-accent) 15%, transparent);
		color: var(--color-accent);
	}

	.toolbar-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		border-top-color: var(--color-accent);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	/* ==========================================================================
	   Tiptap Editor
	   ========================================================================== */

	.tiptap-wrapper {
		min-height: 300px;
	}

	.tiptap-wrapper :global(.tiptap) {
		min-height: 300px;
		padding: 0.875rem 1rem;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-relaxed);
		color: var(--color-text);
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: 0 0 var(--radius-sm) var(--radius-sm);
		outline: none;
		text-align: left;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.tiptap-wrapper :global(.tiptap:focus) {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
	}

	.tiptap-wrapper :global(.tiptap p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		color: var(--color-text-muted);
		font-weight: var(--weight-light);
		letter-spacing: var(--tracking-wider);
		float: left;
		height: 0;
		pointer-events: none;
	}

	.tiptap-wrapper :global(.tiptap em),
	.tiptap-wrapper :global(.tiptap i) {
		font-style: italic;
		font-weight: inherit;
		letter-spacing: inherit;
	}

	.tiptap-wrapper :global(.tiptap p) {
		margin: 0 0 0.5rem 0;
	}

	.tiptap-wrapper :global(.tiptap h1) {
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		margin: 1.25rem 0 0.5rem 0;
	}

	.tiptap-wrapper :global(.tiptap h2) {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		margin: 1rem 0 0.5rem 0;
	}

	.tiptap-wrapper :global(.tiptap h3) {
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		margin: 0.75rem 0 0.375rem 0;
	}

	.tiptap-wrapper :global(.tiptap > :first-child) {
		margin-top: 0;
	}

	.tiptap-wrapper :global(.tiptap ul),
	.tiptap-wrapper :global(.tiptap ol) {
		padding-left: 1.25rem;
		margin: 0.25rem 0 0.5rem 0;
	}

	.tiptap-wrapper :global(.tiptap li) {
		margin: 0.125rem 0;
	}

	.tiptap-wrapper :global(.tiptap hr) {
		border: none;
		border-top: 1px solid var(--color-border);
		margin: 1rem 0;
	}

	/* ==========================================================================
	   Generate Button
	   ========================================================================== */

	.generate-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		width: 100%;
		padding: 1.25rem 2rem;
		font-family: var(--font-primary);
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		font-stretch: 108%;
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-snug);
		background-color: var(--color-accent);
		color: white;
		border-radius: var(--radius-md);
		transition: background-color 0.15s ease, transform 0.1s ease;
	}

	.generate-btn:hover:not(:disabled) {
		background-color: var(--color-accent-hover);
	}

	.generate-btn:active:not(:disabled) {
		transform: scale(0.98);
	}

	.generate-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.generate-icon {
		display: flex;
		align-items: center;
	}

	.error-message {
		width: 100%;
		padding: 0.75rem 1rem;
		background-color: var(--color-error-bg);
		border: 1px solid var(--color-error-border);
		border-radius: var(--radius-sm);
		color: var(--color-error);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		text-align: center;
	}

	/* ==========================================================================
	   Result View
	   ========================================================================== */

	.result-view-content {
		display: flex;
		flex-direction: column;
	}

	.result-intro {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.result-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 0.5rem;
		opacity: 0.8;
	}

	.result-title {
		font-family: var(--font-primary);
		font-size: var(--text-xl);
		font-weight: var(--weight-medium);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		line-height: var(--leading-tight);
		color: var(--color-text);
		margin: 0 0 0.375rem 0;
	}

	.result-subtitle {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-relaxed);
		color: var(--color-text-muted);
		margin: 0;
	}

	.document-wrapper {
		width: 100%;
		position: relative;
	}

	.journal-save-container {
		width: 100%;
		margin-top: 1.5rem;
	}

	.journal-save-btn {
		width: 100%;
		padding: 1rem 1.25rem;
	}

	.journal-save-error {
		margin: 0.5rem 0 0 0;
		padding: 0.75rem 1rem;
		background-color: var(--color-error-bg);
		border: 1px solid var(--color-error-border);
		border-radius: var(--radius-sm);
		color: var(--color-error);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		text-align: center;
	}

	.actions-container {
		width: 100%;
		margin-top: 0.75rem;
	}

	.result-actions {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.75rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1rem;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
		background: var(--color-accent);
		color: white;
		border: none;
	}

	.action-btn:hover:not(:disabled) {
		background: var(--color-accent-hover);
		box-shadow: 0 4px 12px rgba(244, 63, 122, 0.25);
	}

	.action-btn:active:not(:disabled) {
		transform: scale(0.97);
	}

	.action-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.action-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.action-icon.check {
		color: #22c55e;
	}

	.restart-btn {
		width: 100%;
		margin-top: 0.75rem;
		background: transparent;
		color: var(--color-accent);
		border: 2px solid var(--color-accent);
	}

	.restart-btn:hover {
		background: var(--color-accent);
		color: white;
	}

	.restart-confirm {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.75rem;
		padding: 1rem 1.25rem;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.restart-confirm-text {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
		text-align: center;
	}

	.restart-confirm-actions {
		display: flex;
		gap: 0.75rem;
	}

	.restart-confirm-btn {
		padding: 0.625rem 1.25rem;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 0.15s ease;
		border: none;
	}

	.restart-yes {
		background: var(--color-error, #ef4444);
		color: white;
	}

	.restart-yes:hover {
		opacity: 0.9;
	}

	.restart-no {
		background: transparent;
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
	}

	.restart-no:hover {
		background: var(--color-neutral);
		color: var(--color-text);
	}

	/* ==========================================================================
	   Spinner
	   ========================================================================== */

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

	/* ==========================================================================
	   Email Modal
	   ========================================================================== */

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: fadeIn 0.15s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal-content {
		background: var(--color-bg-elevated);
		border-radius: var(--radius-md);
		padding: 1.5rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.2s ease;
	}

	@keyframes slideUp {
		from { transform: translateY(10px); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}

	.modal-title {
		font-family: var(--font-primary);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
	}

	.modal-description {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
		margin: 0 0 1rem 0;
		line-height: var(--leading-relaxed);
	}

	.modal-input {
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

	.modal-input:focus {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px rgba(244, 63, 122, 0.1);
	}

	.modal-input::placeholder {
		color: var(--color-text-muted);
	}

	.modal-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.modal-error {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		color: var(--color-error);
		margin: 0.75rem 0 0 0;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.25rem;
	}

	.modal-btn {
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

	.modal-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.modal-btn-cancel {
		background: transparent;
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
	}

	.modal-btn-cancel:hover:not(:disabled) {
		background: var(--color-neutral);
		color: var(--color-text);
	}

	.modal-btn-send {
		background: var(--color-accent);
		color: white;
		border: none;
	}

	.modal-btn-send:hover:not(:disabled) {
		background: var(--color-accent-hover);
	}

	/* ==========================================================================
	   Edit Mode
	   ========================================================================== */

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
		margin-top: 1.5rem;
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

	.edit-btn-cancel {
		background: transparent;
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
	}

	.edit-btn-cancel:hover {
		background: var(--color-neutral);
		color: var(--color-text);
	}

	.edit-btn-save {
		background: var(--color-accent);
		color: white;
	}

	.edit-btn-save:hover {
		background: var(--color-accent-hover);
	}

	/* ==========================================================================
	   Responsive
	   ========================================================================== */

	@media (max-width: 600px) {
		.editor-page {
			padding: calc(env(safe-area-inset-top, 0px) + 1.25rem) 1rem 1.25rem;
		}

		.editor-page.result-view {
			padding: calc(env(safe-area-inset-top, 0px) + 1rem) 1rem 1.5rem;
		}

		.step-title {
			font-size: var(--text-xl);
		}
	}

	@media (max-width: 480px) {
		.toolbar-separator {
			display: none;
		}

		.result-actions {
			grid-template-columns: 1fr;
		}

		.action-btn {
			padding: 1rem;
		}

		.modal-content {
			padding: 1.25rem;
		}

		.edit-textarea {
			padding: 1.25rem;
		}

		.edit-actions {
			margin-top: 1rem;
		}

		.edit-btn {
			padding: 0.875rem 1rem;
		}
	}

	@media (min-width: 481px) and (max-width: 640px) {
		.result-actions {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 641px) and (max-width: 900px) {
		.result-actions {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
