<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { supabase } from '$lib/supabase/client';
	import { tones } from '$lib/data/tones';
	import { moodColors } from '$lib/data/moodColors';
	import { getApiUrl } from '$lib/config';
	import { isSeparatorParagraph } from '$lib/utils/paragraphs';
	import { downloadAsImage } from '$lib/utils/imageDownload';
	import { downloadAsPdf } from '$lib/utils/pdfDownload';
	import { getZodiacFromBirthday } from '$lib/utils/zodiac';
	import { getLoadingPhrases } from '$lib/data/loadingPhrases';
	import resultMessages from '$lib/data/resultMessages.json';
	import type { Component } from 'svelte';
	import DiaryCard from '$lib/components/DiaryCard.svelte';
	import PdfDocument from '$lib/components/PdfDocument.svelte';
	import LegalFooter from '$lib/components/LegalFooter.svelte';
	import RequiredIndicator from '$lib/components/RequiredIndicator.svelte';
	import IconArrowLeft from '$lib/assets/icons/IconArrowLeft.svelte';
	import {
		EmojiSparkles, EmojiRosePink, EmojiFramedPicture, EmojiPrinter,
		EmojiClipboard, EmojiEnvelopeArrow, EmojiEnvelopeEmail, EmojiFloppyDisk, EmojiRocket, EmojiPencil, EmojiCrossMark,
		EmojiFaceCryingLoudly, EmojiFaceCrying, EmojiFaceFrowning, EmojiFaceSlightlyFrowning,
		EmojiFaceNeutral, EmojiFaceRelieved, EmojiFaceSmilingEyes, EmojiFaceSmilingHearts,
		EmojiFaceGrinningSweat, EmojiFaceLol,
		EmojiChart, EmojiCalendar, EmojiTrophy, EmojiPalette, EmojiSpeakingHead,
		EmojiLedger, EmojiOpenBook, EmojiOwl, EmojiMicrophone, EmojiCat, EmojiFaceUnamused,
		EmojiCrown, EmojiPoo, EmojiFaceGrimacing, EmojiFlagUk, EmojiVideoGame, EmojiFaceYawning,
		EmojiEarth, EmojiBrain, EmojiRobot, EmojiTheaterMasks, EmojiNewspaper, EmojiBlackNib,
		EmojiMusicalNotes, EmojiFaceNerd, EmojiSatellite, EmojiWomanMeditating, EmojiWomanDetective,
		EmojiFaceExplodingHead, EmojiFaceUpsideDown, EmojiArchive, EmojiTornado, EmojiWiltedFlower
	} from '$lib/assets/emojis';
	import UniqueEmoji from '$lib/components/UniqueEmoji.svelte';

	const toneEmojiMap: Record<string, Component> = {
		'classic': EmojiLedger,
		'storytelling': EmojiOpenBook,
		'philosophical': EmojiOwl,
		'sportscaster': EmojiMicrophone,
		'cat-perspective': EmojiCat,
		'cynical': EmojiFaceUnamused,
		'drama-queen': EmojiCrown,
		'meme': EmojiPoo,
		'cringe': EmojiFaceGrimacing,
		'british': EmojiFlagUk,
		'quest-log': EmojiVideoGame,
		'bored': EmojiFaceYawning,
		'nature-documentary': EmojiEarth,
		'therapist': EmojiBrain,
		'ai-robot': EmojiRobot,
		'shakespeare': EmojiTheaterMasks,
		'tabloid': EmojiNewspaper,
		'formal': EmojiBlackNib,
		'troubadour': EmojiMusicalNotes,
		'nerd': EmojiFaceNerd,
		'tinfoil-hat': EmojiSatellite,
		'self-help': EmojiWomanMeditating,
		'detective': EmojiWomanDetective,
		'overthinker': EmojiFaceExplodingHead,
		'passive-aggressive': EmojiFaceUpsideDown,
		'bureaucratic': EmojiArchive,
		'chaotic': EmojiTornado,
		'melodramatic': EmojiWiltedFlower,
	};

	// Mood emoji array (same as Step2Energy mood slider)
	const moodEmojis: Component[] = [
		EmojiFaceCryingLoudly, EmojiFaceCrying, EmojiFaceFrowning, EmojiFaceSlightlyFrowning,
		EmojiFaceNeutral, EmojiFaceRelieved, EmojiFaceSmilingEyes, EmojiFaceSmilingHearts,
		EmojiFaceGrinningSweat, EmojiFaceLol
	];

	function getMoodEmoji(value: number): Component {
		const index = Math.round(value) - 1;
		return moodEmojis[Math.min(Math.max(index, 0), 9)];
	}

	// Date initialization (same as Step1Emojis)
	const weekdays = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
	const months = [
		'januari', 'februari', 'mars', 'april', 'maj', 'juni',
		'juli', 'augusti', 'september', 'oktober', 'november', 'december'
	];

	onMount(async () => {
		await wizardStore.initProfile();
		wizardStore.initWeather();

		// Mark as quick mode first so draft save uses the right key
		wizardStore.updateData('quickMode', true);

		// Try to restore a saved draft
		const restored = await wizardStore.restoreDraft('quick');
		if (restored) {
			// Sync local winInput from restored data (clear it since tags are already in wins array)
			winInput = '';
		}

		const now = new Date();
		const weekday = weekdays[now.getDay()];
		const date = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
		wizardStore.updateData('weekday', weekday);
		wizardStore.updateData('date', date);
		wizardStore.updateData('dateISO', now.toISOString().split('T')[0]);

		// Default tone (only if not restored from draft)
		if (!wizardStore.data.selectedTone) {
			wizardStore.updateData('selectedTone', 'classic');
		}

		// Disable addons (quick flow has no addon controls)
		wizardStore.updateData('includeHomework', false);
		wizardStore.updateData('includeHoroscope', false);
		wizardStore.updateData('includeOnThisDay', false);
	});

	// Win tag input
	let winInput = $state('');

	function addWin() {
		const value = winInput.trim();
		if (!value || wizardStore.data.wins.includes(value)) {
			winInput = '';
			return;
		}
		wizardStore.updateData('wins', [...wizardStore.data.wins.filter(w => w.trim()), value]);
		winInput = '';
	}

	function removeWin(win: string) {
		wizardStore.updateData('wins', wizardStore.data.wins.filter(w => w !== win));
	}

	function removeLastWin() {
		const arr = wizardStore.data.wins.filter(w => w.trim());
		if (arr.length > 0) {
			wizardStore.updateData('wins', arr.slice(0, -1));
		}
	}

	function handleWinKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addWin();
		} else if (event.key === 'Backspace') {
			const input = event.currentTarget as HTMLInputElement;
			if (input.value === '' || (input.selectionStart === 0 && input.selectionEnd === 0)) {
				event.preventDefault();
				removeLastWin();
			}
		}
	}

	function handleWinCommaInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const value = input.value;
		if (value.includes(',')) {
			const parts = value.split(',');
			const beforeComma = parts[0];
			const afterComma = parts.slice(1).join(',').trimStart();

			input.value = beforeComma;
			winInput = beforeComma;
			addWin();

			input.value = afterComma;
			winInput = afterComma;
		}
	}

	function focusWinInput(event: MouseEvent) {
		const container = event.currentTarget as HTMLElement;
		const input = container.querySelector('input');
		if (input) input.focus();
	}

	// Form validity
	let isFormValid = $derived(
		wizardStore.data.selectedTone.trim() !== '' &&
		wizardStore.data.quickText.trim() !== '' &&
		wizardStore.data.wins.some(w => w.trim()) &&
		wizardStore.data.moodColor.trim() !== ''
	);

	// Generation state
	let isGenerating = $state(false);
	let generatedEntry = $state('');
	let error = $state('');
	let actualToneUsed = $state<string | null>(null);

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

	// Loading phrases
	let loadingPhrase = $state('');
	let loadingPhraseVisible = $state(false);
	let phraseInterval: ReturnType<typeof setInterval> | null = null;

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
				if (remaining.length === 0) remaining = shuffled(getLoadingPhrases(toneId));
				loadingPhrase = remaining.pop()!;
				loadingPhraseVisible = true;
			}, 300);
		}, 2200);
	}

	function stopPhraseCycling() {
		if (phraseInterval) { clearInterval(phraseInterval); phraseInterval = null; }
		loadingPhraseVisible = false;
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

	async function handleGenerate() {
		isGenerating = true;
		error = '';
		generatedEntry = '';

		let toneToUse = wizardStore.data.selectedTone;
		if (toneToUse === 'surprise') {
			const randomIndex = Math.floor(Math.random() * tones.length);
			toneToUse = tones[randomIndex].id;
		}
		actualToneUsed = toneToUse;
		startPhraseCycling(toneToUse);

		try {
			const response = await fetch(getApiUrl('/api/generate'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...wizardStore.data, selectedTone: toneToUse })
			});
			const result = await response.json();
			if (result.success) {
				generatedEntry = stripSeparatorLines(result.entry);
				selectRandomMessage();
				void wizardStore.clearDraft('quick');
			} else {
				error = result.error || 'Något gick fel vid genereringen.';
			}
		} catch (err) {
			error = 'Kunde inte ansluta till servern. Försök igen.';
			console.error('Generation error:', err);
		} finally {
			stopPhraseCycling();
			isGenerating = false;
		}
	}

	function handleStartOver() {
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
				tone_id: actualToneUsed || wizardStore.data.selectedTone,
				entry_date: wizardStore.data.dateISO,
				weekday: wizardStore.data.weekday,
				emojis: [],
				mood_color: wizardStore.data.moodColor || null,
				energy_level: null,
				sleep_quality: null,
				mood_level: Math.round(wizardStore.data.mood)
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

<main class="quick" class:result-view={!!generatedEntry}>
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
						toneId={actualToneUsed || wizardStore.data.selectedTone}
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
				<button class="action-btn restart-btn" onclick={handleStartOver}>
					Börja om från början...
				</button>
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
			toneId={actualToneUsed || wizardStore.data.selectedTone}
			generatedText={generatedEntry}
			birthday={wizardStore.data.profile.birthday || ''}
		/>
	{:else}
		<!-- Quick mode form -->
		<header class="quick-header">
			<div class="step-indicator">
				<div class="step-icon"><UniqueEmoji><EmojiRocket size={72} /></UniqueEmoji></div>
				<h1 class="step-title">Snabbläge</h1>
			</div>
		</header>

		<div class="quick-form">
			<p class="step-intro">Fånga dagens känsla på under en minut.</p>
			<!-- Mood slider -->
			<section class="form-section">
				<label class="section-label" for="mood-slider">Hur var dagsformen?<RequiredIndicator /></label>
				<div class="slider-emoji">
					{#key wizardStore.data.mood}
						{@const EmojiComponent = getMoodEmoji(wizardStore.data.mood)}
						<EmojiComponent size={32} />
					{/key}
				</div>
				<div class="slider-container">
					<span class="slider-bound">På botten</span>
					<input
						type="range"
						id="mood-slider"
						min="1"
						max="10"
						step="0.01"
						bind:value={wizardStore.data.mood}
						class="slider"
					/>
					<span class="slider-bound">Strålande</span>
				</div>
			</section>

			<!-- Free text -->
			<section class="form-section">
				<label class="section-label" for="quick-text">Berätta kort om din dag<RequiredIndicator /></label>
				<textarea
					id="quick-text"
					class="text-input"
					rows="3"
					placeholder="Var har du varit? Vad hände? Vilka var med?"
					bind:value={wizardStore.data.quickText}
					maxlength="1000"
				></textarea>
			</section>

			<!-- Win -->
			<section class="form-section">
				<span class="section-label">Dagens segrar (små som stora)<RequiredIndicator /></span>
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div class="tag-input" role="group" onclick={focusWinInput} onkeydown={(e) => e.key === 'Enter' && focusWinInput(e as unknown as MouseEvent)}>
					{#each wizardStore.data.wins.filter(w => w.trim()) as win}
						<span class="tag">
							{win}
							<button class="tag-remove" onclick={() => removeWin(win)}>×</button>
						</span>
					{/each}
					<input
						type="text"
						placeholder={wizardStore.data.wins.filter(w => w.trim()).length === 0 ? 'Någonting bra som hände idag...' : ''}
						bind:value={winInput}
						onkeydown={handleWinKeydown}
						oninput={handleWinCommaInput}
						onblur={addWin}
						maxlength="200"
					/>
				</div>
			</section>

			<!-- Color of the day -->
			<section class="form-section">
				<span class="section-label">Om idag var en färg...<RequiredIndicator /></span>
				<p class="section-description">Välj den färg som bäst speglar känslan din dag.</p>
				<div class="color-swatches">
					{#each moodColors as color}
						<button
							type="button"
							class="color-swatch"
							class:selected={wizardStore.data.moodColor === color.id}
							style="--swatch-color: var({color.cssVar})"
							aria-label={color.name}
							onclick={() => wizardStore.updateData('moodColor', wizardStore.data.moodColor === color.id ? '' : color.id)}
						>
							<span class="swatch-inner"></span>
						</button>
					{/each}
				</div>
				{#if wizardStore.data.moodColor}
					{@const selectedColor = moodColors.find(c => c.id === wizardStore.data.moodColor)}
					{#if selectedColor}
						<p class="selected-color-keywords">
							{#each selectedColor.keywords as keyword}
								<span class="keyword-tag">#{keyword}</span>
							{/each}
						</p>
					{/if}
				{:else}
					<p class="color-hint">Klicka på en färg för att se dess betydelse</p>
				{/if}
			</section>

			<!-- Voice picker -->
			<section class="form-section">
				<span class="section-label">Välj en röst<RequiredIndicator /></span>
				<div class="voice-grid-compact">
					{#each tones as tone}
						{@const ToneEmoji = toneEmojiMap[tone.id]}
						<button
							class="voice-chip"
							class:selected={wizardStore.data.selectedTone === tone.id}
							onclick={() => wizardStore.updateData('selectedTone', tone.id)}
						>
							<span class="voice-chip-emoji">
								{#if ToneEmoji}
									<ToneEmoji size={20} />
								{:else}
									{tone.emoji}
								{/if}
							</span>
							<span class="voice-chip-name">{tone.name}</span>
						</button>
					{/each}
				</div>
			</section>

			<!-- Generate -->
			<section class="form-section">
				{#if error}
					<div class="error-message">{error}</div>
				{/if}
				<button class="generate-btn" onclick={handleGenerate} disabled={isGenerating || !isFormValid}>
					{#if isGenerating}
						<span class="spinner"></span>
						<span class="loading-phrase" class:visible={loadingPhraseVisible}>{loadingPhrase}</span>
					{:else}
						<span class="generate-icon"><EmojiSparkles size={28} /></span>
						Generera dagboksinlägg
					{/if}
				</button>
			</section>
		</div>

		<footer class="quick-footer">
			<a href="/" class="btn btn-secondary"><IconArrowLeft size={16} /> Tillbaka</a>
		</footer>
		<LegalFooter />
	{/if}
</main>

<style>
	/* ==========================================================================
	   Layout
	   ========================================================================== */

	.quick {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		max-width: 720px;
		margin: 0 auto;
		padding: 1.75rem 1.25rem;
	}

	.quick.result-view {
		padding: 1.25rem 1.25rem 2rem;
	}

	/* ==========================================================================
	   Header
	   ========================================================================== */

	.quick-header {
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

	/* ==========================================================================
	   Form
	   ========================================================================== */

	.quick-form {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.section-label {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		margin-bottom: 0.375rem;
		font-family: var(--font-primary);
		font-size: var(--text-md);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text);
	}

.section-description {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
		font-weight: var(--weight-light);
		letter-spacing: var(--tracking-wide);
		text-align: center;
	}

	/* ==========================================================================
	   Mood Slider (from Step2Energy)
	   ========================================================================== */

	.slider-emoji {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.slider-container {
		display: flex;
		align-items: center;
		gap: 0.875rem;
	}

	.slider-bound {
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		font-stretch: 105%;
		letter-spacing: var(--tracking-wider);
		color: var(--color-text-muted);
		min-width: 3.5rem;
		flex-shrink: 0;
	}

	.slider-bound:first-child {
		text-align: right;
	}

	.slider-bound:last-child {
		text-align: left;
	}

	.slider {
		flex: 1;
		-webkit-appearance: none;
		appearance: none;
		height: 3px;
		background: var(--color-border);
		border-radius: 2px;
		outline: none;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		background: var(--color-accent);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.slider:focus::-webkit-slider-thumb {
		box-shadow: 0 0 0 3px var(--color-bg), 0 0 0 5px color-mix(in srgb, var(--color-accent) 30%, transparent);
	}

	.slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		background: var(--color-accent);
		border: none;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
	}

	.slider::-moz-range-thumb:hover {
		transform: scale(1.1);
	}

	.slider::-moz-range-track {
		height: 3px;
		background: var(--color-border);
		border-radius: 2px;
	}

	/* ==========================================================================
	   Text Inputs
	   ========================================================================== */

	.text-input {
		width: 100%;
		padding: 0.75rem 0.875rem;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text);
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		outline: none;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
		resize: none;
	}

	.text-input:focus {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
	}

	.text-input::placeholder {
		color: var(--color-text-muted);
		font-weight: var(--weight-light);
		letter-spacing: var(--tracking-wider);
	}

	/* ==========================================================================
	   Tag Input
	   ========================================================================== */

	.tag-input {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
		min-height: 2.75rem;
		padding: 0.375rem 0.625rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background-color: var(--color-bg-elevated);
		cursor: text;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.tag-input:focus-within {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
	}

	.tag-input input {
		flex: 1;
		min-width: 80px;
		height: 1.75rem;
		padding: 0 0.25rem;
		border: none;
		background: transparent;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		color: var(--color-text);
	}

	.tag-input input:focus {
		border: none;
		outline: none;
		box-shadow: none;
	}

	.tag-input input::placeholder {
		color: var(--color-text-muted);
		font-weight: var(--weight-light);
		letter-spacing: var(--tracking-wider);
		opacity: 0.6;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		padding: 0.12rem 0.5rem;
		background-color: var(--color-accent);
		border-radius: 0.325rem;
		color: white;
		white-space: nowrap;
	}

	.tag-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 0.875rem;
		height: 0.875rem;
		font-size: 0.875rem;
		line-height: 1;
		background: none;
		border: none;
		color: white;
		cursor: pointer;
		opacity: 0.8;
		transition: opacity 0.15s ease;
	}

	.tag-remove:hover {
		opacity: 1;
	}

	/* ==========================================================================
	   Color Swatches (from Step6FoodMusic)
	   ========================================================================== */

	.color-swatches {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: clamp(0.25rem, 1vw, 0.5rem);
	}

	.color-swatch {
		position: relative;
		aspect-ratio: 1;
		padding: clamp(2px, 0.5vw, 4px);
		border: none;
		border-radius: 4px;
		background-color: var(--color-bg-elevated);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.color-swatch:hover {
		transform: scale(1.1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
	}

	.color-swatch.selected {
		box-shadow: 0 0 0 2px var(--swatch-color), 0 1px 3px rgba(0, 0, 0, 0.15);
	}

	.swatch-inner {
		display: block;
		width: 100%;
		height: 100%;
		border-radius: 2px;
		background-color: var(--swatch-color);
	}

	.selected-color-keywords {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.375rem;
		margin: 0.25rem 0 0;
		font-size: var(--text-sm);
		font-weight: var(--weight-light);
		color: var(--color-text-muted);
		letter-spacing: var(--tracking-wide);
	}

	.keyword-tag {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.color-hint {
		margin: 0.25rem 0 0;
		font-size: var(--text-sm);
		font-weight: var(--weight-light);
		color: var(--color-text-muted);
		letter-spacing: var(--tracking-wide);
		opacity: 0.7;
		font-style: italic;
		text-align: center;
	}

	/* ==========================================================================
	   Voice Grid (from guide page)
	   ========================================================================== */

	.voice-grid-compact {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
	}

	.voice-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.325rem 0.575rem;
		background: var(--color-bg-elevated);
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.15s ease;
		font-family: var(--font-primary);
	}

	.voice-chip:hover {
		background: var(--color-bg-hover, rgba(255, 255, 255, 0.1));
		border-color: var(--color-border-subtle, rgba(255, 255, 255, 0.1));
	}

	.voice-chip:active {
		transform: scale(0.98);
	}

	.voice-chip.selected {
		border-color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 12%, var(--color-bg-elevated));
		box-shadow: 0 0 0 1px var(--color-accent);
	}

	.voice-chip-emoji {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.voice-chip-name {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--color-text);
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

	.loading-phrase {
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.loading-phrase.visible {
		opacity: 1;
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
	   Footer
	   ========================================================================== */

	.quick-footer {
		display: flex;
		justify-content: flex-start;
		padding-top: 2.25rem;
		margin-top: auto;
	}

	/* ==========================================================================
	   Result View (shared with Step10Summary patterns)
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
		.quick {
			padding: calc(env(safe-area-inset-top, 0px) + 1.25rem) 1rem 1.25rem;
		}

		.quick.result-view {
			padding: calc(env(safe-area-inset-top, 0px) + 1rem) 1rem 1.5rem;
		}

		.step-title {
			font-size: var(--text-xl);
		}
	}

	@media (max-width: 560px) {
		.slider-container {
			gap: 0.625rem;
		}

		.slider-bound {
			min-width: 2.75rem;
			font-size: 0.75rem;
		}

		.slider {
			height: 2px;
		}

		.slider::-webkit-slider-thumb {
			width: 14px;
			height: 14px;
		}

		.slider::-moz-range-thumb {
			width: 14px;
			height: 14px;
		}
	}

	@media (max-width: 480px) {
		.result-actions {
			grid-template-columns: 1fr;
		}

		.action-btn {
			padding: 1rem;
		}

		.color-swatch {
			padding: 4px;
			border-radius: 5px;
		}

		.quick-footer {
			flex-direction: column;
			gap: 0.75rem;
		}

		.quick-footer > a.btn {
			width: 100%;
			align-self: stretch;
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

	@media (min-width: 480px) {
		.color-swatches {
			grid-template-columns: repeat(8, 1fr);
		}

		.color-swatch {
			min-width: 2.75rem;
			min-height: 2.75rem;
		}
	}

	@media (min-width: 481px) and (max-width: 640px) {
		.result-actions {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 640px) {
		.color-swatches {
			grid-template-columns: repeat(16, 1fr);
		}

		.color-swatch {
			min-width: 0;
			min-height: 0;
		}
	}

	@media (min-width: 641px) and (max-width: 900px) {
		.result-actions {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
