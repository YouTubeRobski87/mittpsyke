<script lang="ts">
	import InterviewEmptyState from '$lib/components/interview/InterviewEmptyState.svelte';
	import MessageList from '$lib/components/interview/MessageList.svelte';
	import ChatInput from '$lib/components/interview/ChatInput.svelte';
	import ToneSelection from '$lib/components/interview/ToneSelection.svelte';
	import DiaryCard from '$lib/components/DiaryCard.svelte';
	import PdfDocument from '$lib/components/PdfDocument.svelte';
	import { chatStore } from '$lib/stores/chat.svelte';
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { supabase } from '$lib/supabase/client';
	import { getApiUrl } from '$lib/config';
	import { goto } from '$app/navigation';
	import { tones } from '$lib/data/tones';
	import LegalFooter from '$lib/components/LegalFooter.svelte';
	import { isSeparatorParagraph } from '$lib/utils/paragraphs';
	import { getLoadingPhrases } from '$lib/data/loadingPhrases';
	import { downloadAsImage } from '$lib/utils/imageDownload';
	import { downloadAsPdf } from '$lib/utils/pdfDownload';
	import resultMessages from '$lib/data/resultMessages.json';
	import {
		EmojiRosePink,
		EmojiFramedPicture, EmojiPrinter, EmojiClipboard,
		EmojiEnvelopeArrow, EmojiEnvelopeEmail,
		EmojiFloppyDisk, EmojiCrossMark, EmojiSparkles
	} from '$lib/assets/emojis';

	// Generation state
	let generatedEntry = $state('');
	let error = $state('');
	let actualToneUsed = $state<string | null>(null);
	let interviewDate = $state('');
	let interviewDateISO = $state('');
	let interviewWeekday = $state('');

	// Component refs for export
	let diaryCardRef: DiaryCard = $state(null!);
	let pdfDocRef: PdfDocument = $state(null!);

	// Export action states
	let isDownloading = $state(false);
	let isDownloadingPdf = $state(false);
	let isCopying = $state(false);
	let isSendingEmail = $state(false);
	let showEmailModal = $state(false);
	let emailAddress = $state('');
	let emailError = $state('');
	let emailSent = $state(false);

	// Journal save state
	let isSavingEntry = $state(false);
	let entrySaved = $state(false);
	let entrySaveError = $state('');

	// Edit state
	let isEditing = $state(false);
	let editText = $state('');
	let editTextareaEl: HTMLTextAreaElement = $state(null!);

	// Result message (random congrats)
	let resultMessage = $state({ title: '', subtitle: '' });

	// Loading phrase cycling
	let loadingPhrase = $state('');
	let loadingPhraseVisible = $state(false);
	let phraseInterval: ReturnType<typeof setInterval> | null = null;

	// Restore draft on page load
	$effect(() => {
		chatStore.loadDraft();
	});

	// Dark mode detection (for rose icon)
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

	$effect(() => {
		if (isEditing && editTextareaEl) {
			autoResizeTextarea();
		}
	});

	// --- Helpers ---

	function computeTodayDate(): { weekday: string; date: string; dateISO: string } {
		const now = new Date();
		const weekdays = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
		const months = [
			'januari', 'februari', 'mars', 'april', 'maj', 'juni',
			'juli', 'augusti', 'september', 'oktober', 'november', 'december'
		];
		return {
			weekday: weekdays[now.getDay()],
			date: `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`,
			dateISO: now.toISOString().split('T')[0]
		};
	}

	function formatChatTranscript(): string {
		return chatStore.messages
			.filter((m) => m.content.trim().length > 0)
			.map((m) => {
				const prefix = m.role === 'user' ? 'Användaren' : 'Intervjuaren';
				return `${prefix}: ${m.content}`;
			})
			.join('\n\n');
	}

	function shuffled(arr: string[]): string[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	function startPhraseCycling(toneId: string) {
		let remaining = shuffled(getLoadingPhrases(toneId));
		loadingPhrase = remaining.pop()!;
		loadingPhraseVisible = true;

		phraseInterval = setInterval(() => {
			loadingPhraseVisible = false;
			setTimeout(() => {
				if (remaining.length === 0) {
					remaining = shuffled(getLoadingPhrases(toneId));
				}
				loadingPhrase = remaining.pop()!;
				loadingPhraseVisible = true;
			}, 300);
		}, 2200);
	}

	function stopPhraseCycling() {
		if (phraseInterval) {
			clearInterval(phraseInterval);
			phraseInterval = null;
		}
		loadingPhraseVisible = false;
	}

	function stripSeparatorLines(entry: string): string {
		return entry
			.split('\n')
			.filter((line) => !isSeparatorParagraph(line))
			.join('\n')
			.replace(/\n{3,}/g, '\n\n')
			.trim();
	}

	function selectRandomMessage() {
		const randomIndex = Math.floor(Math.random() * resultMessages.length);
		resultMessage = resultMessages[randomIndex];
	}

	function autoResizeTextarea() {
		if (!editTextareaEl) return;
		editTextareaEl.style.height = 'auto';
		editTextareaEl.style.height = editTextareaEl.scrollHeight + 'px';
	}

	// --- Streaming (existing) ---

	async function streamResponse() {
		chatStore.setStreaming(true);
		chatStore.setError('');
		chatStore.addAssistantMessage('');

		try {
			const payload = {
				messages: chatStore.messages
					.filter((m) => m.content.length > 0)
					.map((m) => ({ role: m.role, content: m.content })),
				profile: wizardStore.data.profile
			};

			const response = await fetch(getApiUrl('/api/chat'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(
					errorData?.error || `Något gick fel (${response.status}). Försök igen.`
				);
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error('Ingen ström tillgänglig.');

			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() ?? '';

				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed || !trimmed.startsWith('data: ')) continue;

					const data = trimmed.slice(6);
					if (data === '[DONE]') break;

					try {
						const parsed = JSON.parse(data);
						if (parsed.error) throw new Error(parsed.error);
						if (parsed.text) {
							chatStore.appendToLastAssistantMessage(parsed.text);
						}
					} catch (e) {
						if (e instanceof SyntaxError) continue;
						throw e;
					}
				}
			}
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Ett oväntat fel uppstod.';
			chatStore.setError(message);
			chatStore.removeLastAssistantMessage();
		} finally {
			chatStore.setStreaming(false);
		}
	}

	function handleSend(message: string) {
		chatStore.addUserMessage(message);
		if (chatStore.phase === 'empty') {
			chatStore.startChatting();
		}
		streamResponse();
	}

	// --- Generation ---

	async function handleGenerate() {
		error = '';
		generatedEntry = '';

		const today = computeTodayDate();
		interviewDate = today.date;
		interviewDateISO = today.dateISO;
		interviewWeekday = today.weekday;

		let toneToUse = chatStore.selectedTone;
		if (toneToUse === 'surprise') {
			const randomIndex = Math.floor(Math.random() * tones.length);
			toneToUse = tones[randomIndex].id;
		}
		actualToneUsed = toneToUse;

		chatStore.startGenerating();
		startPhraseCycling(toneToUse);

		try {
			const chatTranscript = formatChatTranscript();
			const payload = {
				...wizardStore.data,
				chatMode: true,
				chatTranscript,
				selectedTone: toneToUse,
				date: interviewDate,
				weekday: interviewWeekday,
				includeHoroscope: chatStore.includeHoroscope,
				includeOnThisDay: chatStore.includeOnThisDay,
				includeHomework: chatStore.includeHomework,
				includeDailyChallenge: chatStore.includeDailyChallenge,
				quickMode: false,
				quickText: ''
			};

			const response = await fetch(getApiUrl('/api/generate'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const result = await response.json();

			if (result.success) {
				generatedEntry = stripSeparatorLines(result.entry);
				selectRandomMessage();
				chatStore.showResult(generatedEntry);
				chatStore.clearDraft();
			} else {
				error = result.error || 'Något gick fel vid genereringen.';
			}
		} catch (err) {
			error = 'Kunde inte ansluta till servern. Försök igen.';
			console.error('Generation error:', err);
		} finally {
			stopPhraseCycling();
		}
	}

	// --- Export actions ---

	async function downloadAsImageHandler() {
		const element = diaryCardRef?.getDocumentElement();
		if (!element || isDownloading) return;
		isDownloading = true;

		const noExport = element.querySelector<HTMLElement>('[data-no-export]');
		if (noExport) noExport.style.display = 'none';

		try {
			const filename = `dagbok-${interviewDate.replace(/[\s,]+/g, '-').replace(/:/g, '').replace(/-+/g, '-') || 'entry'}.png`;
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
		if (!element || isDownloadingPdf) return;
		isDownloadingPdf = true;

		try {
			const filename = `dagbok-${interviewDate.replace(/[\s,]+/g, '-').replace(/:/g, '').replace(/-+/g, '-') || 'entry'}.pdf`;
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
			setTimeout(() => {
				isCopying = false;
			}, 1500);
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
					date: interviewDate,
					weekday: interviewWeekday
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

	// --- Edit mode ---

	function startEditing() {
		editText = generatedEntry;
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
		editText = '';
	}

	function saveEdit() {
		generatedEntry = editText;
		isEditing = false;
		editText = '';
	}

	// --- Journal save ---

	async function saveEntryToJournal() {
		if (!authStore.user || !generatedEntry.trim() || isSavingEntry) return;
		isSavingEntry = true;
		entrySaveError = '';

		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) {
				entrySaveError = 'Din session har gått ut. Logga in igen.';
				return;
			}

			const payload = {
				user_id: authStore.user.id,
				generated_text: generatedEntry,
				tone_id: actualToneUsed || chatStore.selectedTone,
				entry_date: interviewDateISO,
				weekday: interviewWeekday,
				emojis: [],
				mood_color: null,
				energy_level: 5,
				sleep_quality: 5,
				mood_level: 5
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

	// --- Start over ---

	function handleStartOver() {
		chatStore.clearDraft();
		chatStore.reset();
		generatedEntry = '';
		error = '';
		entrySaved = false;
		entrySaveError = '';
		goto('/');
	}

	async function handleExitChat() {
		stopPhraseCycling();
		await chatStore.clearDraft();
		chatStore.reset();

		generatedEntry = '';
		error = '';
		actualToneUsed = null;
		interviewDate = '';
		interviewWeekday = '';
		loadingPhrase = '';
		loadingPhraseVisible = false;

		isEditing = false;
		editText = '';

		entrySaved = false;
		entrySaveError = '';

		showEmailModal = false;
		emailAddress = '';
		emailError = '';
		emailSent = false;
	}
</script>

<main class="interview-page">
	<div class="interview-body">
		{#if chatStore.phase === 'empty'}
			<div class="interview-empty">
				<InterviewEmptyState onSend={handleSend} />
			</div>
		{:else if chatStore.phase === 'chatting'}
			<div class="interview-chat">
				<MessageList messages={chatStore.messages} />
			</div>
		{:else if chatStore.phase === 'tone-selection'}
			<div class="interview-tones">
				<ToneSelection onGenerate={handleGenerate} />
			</div>
		{:else if chatStore.phase === 'generating'}
			<div class="interview-loading">
				{#if error}
					<div class="error-message">{error}</div>
					<button class="generate-btn" onclick={handleGenerate}>
						<span class="generate-icon"><EmojiSparkles size={28} /></span>
						Försök igen
					</button>
				{:else}
					<button class="generate-btn" disabled>
						<span class="spinner"></span>
						<span class="loading-phrase" class:visible={loadingPhraseVisible}>{loadingPhrase}</span>
					</button>
				{/if}
			</div>
		{:else if chatStore.phase === 'result'}
			<div class="interview-result">
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
							weekday={interviewWeekday}
							date={interviewDate}
							emojis={[]}
							toneId={actualToneUsed || chatStore.selectedTone}
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
				{:else}
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
									<span class="spinner"></span>
									<span>Sparar...</span>
								{:else}
									<EmojiFramedPicture size={22} />
									<span>Spara bild</span>
								{/if}
							</button>
							<button class="action-btn" onclick={downloadAsPdfHandler} disabled={isDownloadingPdf}>
								{#if isDownloadingPdf}
									<span class="spinner"></span>
									<span>Skapar...</span>
								{:else}
									<EmojiPrinter size={22} />
									<span>Spara PDF</span>
								{/if}
							</button>
							<button class="action-btn" onclick={copyToClipboard} disabled={isCopying}>
								{#if isCopying}
									<svg class="action-icon check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
										<polyline points="20 6 9 17 4 12"/>
									</svg>
									<span>Kopierat!</span>
								{:else}
									<EmojiClipboard size={22} />
									<span>Kopiera</span>
								{/if}
							</button>
							<button class="action-btn" onclick={openEmailModal}>
								<EmojiEnvelopeArrow size={22} />
								<span>Maila</span>
							</button>
						</div>
						<button class="action-btn restart-btn" onclick={handleStartOver}>
							Börja om från början...
						</button>
					</div>
				{/if}

				{#if showEmailModal}
					<div class="modal-overlay" onclick={closeEmailModal} role="button" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && closeEmailModal()}>
						<div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && closeEmailModal()} role="dialog" aria-modal="true" aria-labelledby="email-modal-title" tabindex="-1">
							<h2 id="email-modal-title" class="modal-title">Skicka som e-post</h2>
							<p class="modal-description">Ange en e-postadress så skickar vi dagboksinlägget dit.</p>

							<input
								type="email"
								class="modal-input"
								placeholder="din@email.se"
								bind:value={emailAddress}
								onkeydown={(e) => e.key === 'Enter' && sendEmail()}
								disabled={isSendingEmail || emailSent}
							/>

							{#if emailError}
								<p class="modal-error">{emailError}</p>
							{/if}

							<div class="modal-actions">
								<button class="modal-btn modal-btn-cancel" onclick={closeEmailModal} disabled={isSendingEmail}>
									Avbryt
								</button>
								<button class="modal-btn modal-btn-send" onclick={sendEmail} disabled={isSendingEmail || emailSent || !emailAddress.trim()}>
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
			</div>

			<PdfDocument
				bind:this={pdfDocRef}
				weekday={interviewWeekday}
				date={interviewDate}
				emojis={[]}
				toneId={actualToneUsed || chatStore.selectedTone}
				generatedText={generatedEntry}
				birthday={wizardStore.data.profile.birthday || ''}
			/>
		{/if}

	</div>

	{#if chatStore.phase === 'empty' || chatStore.phase === 'chatting'}
		<div class="interview-footer">
			{#if chatStore.error}
				<div class="error-bar" role="alert">
					<span class="error-text">{chatStore.error}</span>
					<button class="error-retry" onclick={() => streamResponse()}>Försök igen</button>
				</div>
			{/if}
			<ChatInput onSend={handleSend} onExitChat={handleExitChat} />
		</div>
	{/if}

	<LegalFooter />
</main>

<style>
	.interview-page {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
		max-width: 720px;
		margin: 0 auto;
		width: 100%;
		overflow: hidden;
	}

	.interview-body {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.interview-empty {
		display: flex;
		flex: 1 1 auto;
		min-height: 0;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 0.25rem 0;
	}

	.interview-chat {
		display: flex;
		flex-direction: column;
		min-height: 100%;
	}

	.interview-tones,
	.interview-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem 0;
		width: 100%;
	}

	.interview-result {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0;
		padding-bottom: 0.25rem;
		width: 100%;
	}

	.interview-page > :global(.legal-footer) {
		flex-shrink: 0;
		margin-top: 0.5rem;
		padding-top: 0.5rem;
	}

	.interview-footer {
		flex-shrink: 0;
		padding: 0.5rem;
		padding-bottom: max(0.5rem, env(safe-area-inset-bottom, 0px));
		background: var(--color-bg);
	}

	.error-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.375rem 0.625rem;
		margin-bottom: 0.375rem;
		background: var(--color-error-bg);
		border: 1px solid var(--color-error-border);
		border-radius: var(--radius-sm);
	}

	.error-text {
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		color: var(--color-error);
		line-height: var(--leading-relaxed);
	}

	.error-retry {
		flex-shrink: 0;
		background: none;
		border: none;
		padding: 0;
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		color: var(--color-error);
		cursor: pointer;
		text-decoration: underline;
	}

	/* ==========================================================================
	   Loading Phase
	   ========================================================================== */

	.generate-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.875rem 1.5rem;
		font-family: var(--font-primary);
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		font-stretch: 108%;
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-snug);
		background-color: var(--color-accent);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			transform 0.1s ease;
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

	.loading-phrase {
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.loading-phrase.visible {
		opacity: 1;
	}

	.error-message {
		width: 100%;
		padding: 0.625rem 0.875rem;
		background-color: var(--color-error-bg);
		border: 1px solid var(--color-error-border);
		border-radius: var(--radius-sm);
		color: var(--color-error);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		text-align: center;
		margin-bottom: 0.75rem;
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

	.generate-btn .spinner {
		width: 18px;
		height: 18px;
		border-color: rgba(255, 255, 255, 0.3);
		border-top-color: white;
		opacity: 1;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ==========================================================================
	   Result View
	   ========================================================================== */

	.result-intro {
		text-align: center;
		margin: 0.25rem 0 0.5rem 0;
	}

	.result-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 0.25rem;
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
		margin: 0 0 0.25rem 0;
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

	/* ==========================================================================
	   Document Wrapper
	   ========================================================================== */

	.document-wrapper {
		width: 100%;
		position: relative;
		margin: 0;
	}

	/* ==========================================================================
	   Journal Save
	   ========================================================================== */

	.journal-save-container {
		width: 100%;
		margin-top: 0.5rem;
	}

	.journal-save-btn {
		width: 100%;
		padding: 0.75rem 1rem;
	}

	.journal-save-error {
		margin: 0.375rem 0 0 0;
		padding: 0.625rem 0.875rem;
		background-color: var(--color-error-bg);
		border: 1px solid var(--color-error-border);
		border-radius: var(--radius-sm);
		color: var(--color-error);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		text-align: center;
	}

	/* ==========================================================================
	   Action Buttons
	   ========================================================================== */

	.actions-container {
		width: 100%;
		margin: 0.25rem 0 0.25rem 0;
	}

	.result-actions {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 0.875rem;
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
		margin-top: 0.25rem;
		background: transparent;
		color: var(--color-accent);
		border: 2px solid var(--color-accent);
	}

	.restart-btn:hover {
		background: var(--color-accent);
		color: white;
	}

	/* ==========================================================================
	   Edit Mode
	   ========================================================================== */

	.edit-textarea {
		box-sizing: border-box;
		width: 100%;
		padding: 1.5rem;
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
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.edit-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
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
		padding: 0.75rem;
		animation: fadeIn 0.15s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		background: var(--color-bg-elevated);
		border-radius: var(--radius-md);
		padding: 1.25rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.2s ease;
	}

	@keyframes slideUp {
		from {
			transform: translateY(10px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-title {
		font-family: var(--font-primary);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		color: var(--color-text);
		margin: 0 0 0.375rem 0;
	}

	.modal-description {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
		margin: 0 0 0.75rem 0;
		line-height: var(--leading-relaxed);
	}

	.modal-input {
		width: 100%;
		padding: 0.75rem 0.875rem;
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
		margin: 0.5rem 0 0 0;
	}

	.modal-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.modal-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 0.875rem;
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
	   Responsive
	   ========================================================================== */

	@media (max-width: 480px) {
		.result-actions {
			grid-template-columns: 1fr;
		}

		.action-btn {
			padding: 0.625rem 0.75rem;
		}

		.modal-content {
			padding: 1rem;
		}

		.edit-textarea {
			padding: 1rem;
		}

		.edit-actions {
			margin-top: 0.625rem;
		}

		.edit-btn {
			padding: 0.625rem 0.875rem;
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
