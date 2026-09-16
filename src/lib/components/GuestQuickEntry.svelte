<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import {
		trackAccountOfferSeen,
		trackAnonymousWriteCompletedFromText,
		trackAnonymousWriteStarted,
		trackReturningDiaryUser
	} from '$lib/analytics';
	import {
		clearDiaryDraft,
		consumeDiaryDraftHandoff,
		getDaysSinceDiaryDraftSaved,
		readDiaryDraft,
		writeDiaryDraft
	} from '$lib/diary-draft';
	import {
		clearLocalEntries,
		formatLocalEntryDate,
		localEntryPreview,
		migrateDraftIntoLocalEntries,
		readCurrentLocalEntryId,
		readLocalEntries,
		saveLocalEntry,
		writeCurrentLocalEntryId,
		type LocalDiaryEntry
	} from '$lib/diary-local-history';
	import { dataflowCopy } from '$lib/dataflow-copy';
	import { scrollIntoViewWithMotionPreference } from '$lib/scroll';

	const AUTOSAVE_INTERVAL_MS = 3000;

	// Startfrågor som fyller i första raden. Frivilliga, högst fyra, och alltid
	// med fritext som ett likvärdigt val. Ingen fråga om diagnos eller behandling.
	const STARTERS = [
		{ label: 'Så här känns det just nu', prefix: 'Så här känns det just nu… ' },
		{ label: 'Det som tar mest plats idag', prefix: 'Det som tar mest plats idag är… ' },
		{ label: 'Något som gick bättre än väntat', prefix: 'En sak som gick bättre än väntat… ' },
		{ label: 'Skriv fritt', prefix: '' }
	];

	let entry = $state('');
	// Lokal historik: inläggen ligger bara i den här webbläsaren.
	let localEntries = $state<LocalDiaryEntry[]>([]);
	let currentEntryId = $state<string | null>(null);
	let confirmClearAll = $state(false);
	let savedEntryFromPreviousVisit = $state('');
	let showSavedEntryPrompt = $state(false);
	let saveStatus = $state<'idle' | 'saved'>('idle');
	let containerEl = $state<HTMLElement | null>(null);
	let textareaEl = $state<HTMLTextAreaElement | null>(null);
	let accountOfferEl = $state<HTMLElement | null>(null);
	let lastSavedValue = '';
	let saveTimer: ReturnType<typeof setInterval> | null = null;
	let accountOfferObserver: IntersectionObserver | null = null;
	let hasStartedTracking = false;
	let hasCompletedTracking = false;

	function persistIfDirty() {
		if (!browser) return;
		if (entry === lastSavedValue) return;

		if (entry.trim().length === 0) {
			clearDiaryDraft();
			// Ett tomrensat inlägg ska inte ligga kvar som en blank rad i listan.
			saveLocalEntry({ id: currentEntryId, text: '' });
			currentEntryId = null;
			writeCurrentLocalEntryId(null);
		} else {
			writeDiaryDraft(entry);
			const saved = saveLocalEntry({ id: currentEntryId, text: entry });
			currentEntryId = saved?.id ?? null;
			writeCurrentLocalEntryId(currentEntryId);
			if (!hasCompletedTracking) {
				hasCompletedTracking = true;
				trackAnonymousWriteCompletedFromText(entry);
			}
		}
		localEntries = readLocalEntries();
		lastSavedValue = entry;
		saveStatus = 'saved';
	}

	/** Lägger undan det som skrivits och öppnar en tom yta. */
	function startNewEntry() {
		persistIfDirty();
		entry = '';
		lastSavedValue = '';
		currentEntryId = null;
		writeCurrentLocalEntryId(null);
		clearDiaryDraft();
		savedEntryFromPreviousVisit = '';
		showSavedEntryPrompt = false;
		confirmClearAll = false;
		saveStatus = 'idle';
		localEntries = readLocalEntries();
		textareaEl?.focus();
	}

	/** Öppnar ett tidigare lokalt inlägg för att läsa eller skriva vidare. */
	function openLocalEntry(item: LocalDiaryEntry) {
		persistIfDirty();
		entry = item.text;
		lastSavedValue = item.text;
		currentEntryId = item.id;
		writeCurrentLocalEntryId(item.id);
		// Utkastnyckeln bär det som är öppet, så /register och den inloggade
		// dagboken ser samma text som skrivytan.
		writeDiaryDraft(item.text);
		savedEntryFromPreviousVisit = '';
		showSavedEntryPrompt = false;
		confirmClearAll = false;
		saveStatus = 'saved';
		textareaEl?.focus();
	}

	function clearAllLocalEntries() {
		clearLocalEntries();
		clearDiaryDraft();
		localEntries = [];
		currentEntryId = null;
		entry = '';
		lastSavedValue = '';
		savedEntryFromPreviousVisit = '';
		showSavedEntryPrompt = false;
		confirmClearAll = false;
		saveStatus = 'idle';
		textareaEl?.focus();
	}

	function applyStarter(prefix: string) {
		// Startfrågan fyller bara i en början. Texten går alltid att skriva över.
		if (showSavedEntryPrompt) {
			clearSavedEntry({ keepCurrentText: true });
		}
		entry = prefix ? `${prefix}${entry.trimStart()}` : entry;
		saveStatus = 'idle';
		textareaEl?.focus();
		// Markören hamnar sist så att användaren skriver vidare direkt.
		queueMicrotask(() => {
			textareaEl?.setSelectionRange(entry.length, entry.length);
		});
		if (!hasStartedTracking && entry.trim().length > 0) {
			hasStartedTracking = true;
			trackAnonymousWriteStarted();
		}
	}

	function handleInput() {
		if (showSavedEntryPrompt) {
			clearSavedEntry({ keepCurrentText: true });
		}
		if (!hasStartedTracking && entry.trim().length > 0) {
			hasStartedTracking = true;
			trackAnonymousWriteStarted();
		}
		if (saveStatus === 'saved') {
			saveStatus = 'idle';
		}
	}

	function continuePreviousEntry() {
		entry = savedEntryFromPreviousVisit;
		lastSavedValue = savedEntryFromPreviousVisit;
		savedEntryFromPreviousVisit = '';
		showSavedEntryPrompt = false;
		saveStatus = entry.trim().length > 0 ? 'saved' : 'idle';
		textareaEl?.focus();
	}

	function saveAndCreateAccount() {
	}

	function clearSavedEntry(options: { keepCurrentText?: boolean } = {}) {
		if (!browser) return;

		clearDiaryDraft();

		if (!options.keepCurrentText) {
			entry = '';
		}
		savedEntryFromPreviousVisit = '';
		showSavedEntryPrompt = false;
		lastSavedValue = options.keepCurrentText ? '' : entry;
		saveStatus = 'idle';
		textareaEl?.focus();
	}

	onMount(() => {
		if (!browser) return;

		// Ett utkast från tiden före den lokala historiken lyfts in som ett
		// första inlägg. Utkastnyckeln lämnas orörd, så ingenting går förlorat.
		migrateDraftIntoLocalEntries();
		localEntries = readLocalEntries();
		currentEntryId = readCurrentLocalEntryId();

		// Text skriven i startsidans hero följer med hit och fylls i direkt. Den
		// är inte ett "tidigare besök" och ska därför inte ligga bakom en fråga.
		const handoff = consumeDiaryDraftHandoff();
		if (handoff) {
			entry = handoff;
			hasStartedTracking = true;
			trackAnonymousWriteStarted();
		} else {
			// Håll tidigare text dold tills användaren själv väljer att fortsätta.
			const stored = readDiaryDraft();
			if (stored) {
				savedEntryFromPreviousVisit = stored;
				showSavedEntryPrompt = true;
				trackReturningDiaryUser({ days_since_last: getDaysSinceDiaryDraftSaved() });
			}
		}

		// Auto-scroll till komponenten efter kort fördröjning
		const scrollTimer = setTimeout(() => {
			if (containerEl) scrollIntoViewWithMotionPreference(containerEl, { block: 'start' });
			textareaEl?.focus({ preventScroll: true });
		}, 100);

		// Auto-save var 3:e sekund
		saveTimer = setInterval(persistIfDirty, AUTOSAVE_INTERVAL_MS);

		// Räknas som sett först när kontoerbjudandet faktiskt syns i vyn.
		if (accountOfferEl && typeof IntersectionObserver !== 'undefined') {
			accountOfferObserver = new IntersectionObserver(
				(entries) => {
					if (!entries.some((observed) => observed.isIntersecting)) return;
					trackAccountOfferSeen('guest_diary');
					accountOfferObserver?.disconnect();
					accountOfferObserver = null;
				},
				{ threshold: 0.6 }
			);
			accountOfferObserver.observe(accountOfferEl);
		}

		return () => clearTimeout(scrollTimer);
	});

	onDestroy(() => {
		if (saveTimer) clearInterval(saveTimer);
		accountOfferObserver?.disconnect();
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
				{dataflowCopy.anonymousDiary.storage} {dataflowCopy.anonymousDiary.transfer}
				{#if saveStatus === 'saved' && entry.length > 0}
					<span class="status-pill" aria-live="polite">Lokalt utkast</span>
				{/if}
			</p>
			<p class="meta">
				Utkastet finns normalt kvar när du laddar om sidan eller stänger webbläsaren.
				I privat läge kan det försvinna när du stänger webbläsaren.
			</p>
		</header>

		{#if showSavedEntryPrompt}
			<div class="saved-entry-prompt" role="status" aria-live="polite">
				<p>Du skrev något senast. Vill du fortsätta där du var eller börja på nytt?</p>
				<div class="saved-entry-actions">
					<button type="button" class="prompt-primary-action" onclick={continuePreviousEntry}>
						Fortsätt där jag var
					</button>
					<button type="button" class="prompt-secondary-action" onclick={() => clearSavedEntry()}>
						Börja på nytt
					</button>
				</div>
			</div>
		{/if}

		<div class="starters">
			<p class="starters-label" id="guest-entry-starters-label">Vill du ha en början?</p>
			<div class="starter-row" role="group" aria-labelledby="guest-entry-starters-label">
				{#each STARTERS as starter}
					<button type="button" class="starter-chip" onclick={() => applyStarter(starter.prefix)}>
						{starter.label}
					</button>
				{/each}
			</div>
		</div>

		<textarea
			bind:this={textareaEl}
			bind:value={entry}
			oninput={handleInput}
			placeholder="Några rader räcker."
			rows="8"
			aria-label="Din snabbanteckning"
		></textarea>

		<div class="entry-actions">
			<button type="button" class="entry-action-primary" onclick={startNewEntry}>
				Nytt inlägg
			</button>
			<button type="button" class="clear-entry-link" onclick={() => clearSavedEntry()}>
				Rensa texten
			</button>
		</div>

		{#if localEntries.length > 0}
			<section class="local-history" aria-labelledby="local-history-heading">
				<h3 id="local-history-heading">Dina senaste inlägg på den här enheten</h3>
				<p class="local-history-note">
					De här inläggen finns bara i den här webbläsaren. Den som har tillgång till enheten kan
					också kunna läsa dem.
				</p>

				<ul class="local-history-list">
					{#each localEntries as item (item.id)}
						<li>
							<button
								type="button"
								class="local-history-item"
								class:is-open={item.id === currentEntryId}
								aria-current={item.id === currentEntryId ? 'true' : undefined}
								onclick={() => openLocalEntry(item)}
							>
								<span class="local-history-date">
									{formatLocalEntryDate(item.updatedAt)}
									{#if item.id === currentEntryId}<span class="local-history-open">Öppet nu</span>{/if}
								</span>
								<span class="local-history-preview">{localEntryPreview(item.text)}</span>
							</button>
						</li>
					{/each}
				</ul>

				<div class="local-history-footer">
					{#if confirmClearAll}
						<p class="local-history-confirm" role="status" aria-live="polite">
							Vill du ta bort alla {localEntries.length} inlägg från den här webbläsaren? Det går inte
							att ångra.
						</p>
						<div class="local-history-confirm-actions">
							<button type="button" class="confirm-destructive" onclick={clearAllLocalEntries}>
								Ja, rensa allt
							</button>
							<button type="button" class="confirm-cancel" onclick={() => (confirmClearAll = false)}>
								Avbryt
							</button>
						</div>
					{:else}
						<button type="button" class="clear-entry-link" onclick={() => (confirmClearAll = true)}>
							Rensa allt
						</button>
					{/if}
				</div>
			</section>
		{/if}

		<footer class="guest-entry-footer" bind:this={accountOfferEl}>
			<div class="account-offer">
				<p class="account-offer-title">Vill du spara ett dagboksinlägg på ditt konto?</p>
				<p class="account-offer-text">
					Utkastet stannar lokalt när du skapar konto. Det blir ett dagboksinlägg först när du
					är inloggad och väljer att spara i dagboken.
				</p>
			</div>
			<div class="actions">
				<a class="primary-action" href="/register?fromDiary=true" onclick={saveAndCreateAccount}
					>Skapa konto för att spara inlägg</a
				>
			</div>
			<span class="char-count" aria-hidden="true">{charCount} tecken</span>
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

	.saved-entry-prompt {
		border: 1px solid hsl(var(--border));
		border-radius: 16px;
		background: hsl(var(--surface-soft));
		padding: 0.95rem;
		display: grid;
		gap: 0.85rem;
	}

	.saved-entry-prompt p {
		margin: 0;
		color: hsl(var(--foreground) / 0.86);
		font-size: 0.95rem;
		line-height: 1.55;
	}

	.saved-entry-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem;
	}

	.prompt-primary-action,
	.prompt-secondary-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.4rem;
		padding: 0.55rem 0.9rem;
		border-radius: var(--radius-pill);
		font-family: var(--font-heading);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
	}

	.prompt-primary-action {
		border: 1px solid var(--theme-accent, var(--primary));
		background: var(--theme-accent, var(--primary));
		color: #fff;
	}

	.prompt-secondary-action {
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
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

	.entry-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 1rem;
	}

	.entry-action-primary {
		min-height: 44px;
		padding: 0.5rem 1.1rem;
		border: 1px solid hsl(var(--foreground) / 0.32);
		border-radius: var(--radius-pill);
		background: hsl(var(--surface-soft));
		color: hsl(var(--foreground));
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.entry-action-primary:hover {
		border-color: hsl(var(--foreground) / 0.55);
	}

	/* Lokal historik: en lugn lista, inte ett arkiv. */
	.local-history {
		display: grid;
		gap: 0.6rem;
		padding-top: 0.9rem;
		border-top: 1px solid hsl(var(--border));
	}

	.local-history h3 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1rem;
		letter-spacing: -0.01em;
	}

	.local-history-note {
		margin: 0;
		max-width: 62ch;
		color: hsl(var(--muted-foreground));
		font-size: 0.86rem;
		line-height: 1.55;
	}

	.local-history-list {
		display: grid;
		gap: 0.45rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.local-history-item {
		display: grid;
		gap: 0.2rem;
		width: 100%;
		min-height: 44px;
		padding: 0.55rem 0.7rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-input, 0.75rem);
		background: hsl(var(--surface-soft));
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.local-history-item:hover {
		border-color: hsl(var(--foreground) / 0.35);
	}

	.local-history-item.is-open {
		border-color: var(--primary-dark);
	}

	.local-history-date {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.78rem;
	}

	.local-history-open {
		padding: 0.05rem 0.45rem;
		border-radius: var(--radius-pill);
		background: var(--primary-dark-soft);
		color: var(--primary-dark);
		font-size: 0.72rem;
		font-weight: 600;
	}

	.local-history-preview {
		font-size: 0.92rem;
		line-height: 1.5;
		overflow-wrap: anywhere;
	}

	.local-history-footer {
		display: grid;
		gap: 0.5rem;
	}

	.local-history-confirm {
		margin: 0;
		max-width: 62ch;
		font-size: 0.88rem;
		line-height: 1.55;
	}

	.local-history-confirm-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.confirm-destructive,
	.confirm-cancel {
		min-height: 44px;
		padding: 0.45rem 1rem;
		border-radius: var(--radius-pill);
		border: 1px solid hsl(var(--foreground) / 0.32);
		background: hsl(var(--surface-soft));
		color: hsl(var(--foreground));
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.confirm-destructive {
		border-color: hsl(var(--foreground) / 0.5);
	}

	.clear-entry-link {
		justify-self: start;
		border: 0;
		background: transparent;
		padding: 0;
		color: hsl(var(--muted-foreground));
		font: inherit;
		font-size: 0.86rem;
		text-decoration: underline;
		text-underline-offset: 0.18em;
		cursor: pointer;
	}

	.clear-entry-link:hover,
	.clear-entry-link:focus-visible {
		color: hsl(var(--foreground));
	}

	.clear-entry-link:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 3px;
		border-radius: 4px;
	}

	.starters {
		display: grid;
		gap: 0.5rem;
	}

	.starters-label {
		margin: 0;
		font-size: 0.86rem;
		color: hsl(var(--muted-foreground));
	}

	.starter-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.starter-chip {
		min-height: 2.2rem;
		padding: 0.4rem 0.75rem;
		border-radius: var(--radius-pill);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
		color: hsl(var(--foreground) / 0.88);
		font: inherit;
		font-size: 0.86rem;
		line-height: 1.3;
		text-align: left;
		cursor: pointer;
		transition: border-color 150ms ease, background 150ms ease;
	}

	.starter-chip:hover,
	.starter-chip:focus-visible {
		border-color: var(--theme-accent, var(--primary));
		background: hsl(var(--surface));
	}

	.guest-entry-footer {
		display: grid;
		gap: 0.75rem;
		padding: 0.95rem;
		border-radius: 16px;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
	}

	.account-offer {
		display: grid;
		gap: 0.3rem;
	}

	.account-offer-title {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 650;
		color: hsl(var(--foreground));
	}

	.account-offer-text {
		margin: 0;
		max-width: 46ch;
		font-size: 0.9rem;
		line-height: 1.6;
		color: hsl(var(--foreground) / 0.78);
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

	.primary-action {
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

	.primary-action:hover {
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
			padding: 0.8rem;
		}

		.starter-chip {
			font-size: 0.83rem;
		}

		.actions {
			display: grid;
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.primary-action {
			width: 100%;
		}

		.saved-entry-actions {
			display: grid;
			grid-template-columns: 1fr;
		}
	}
</style>
