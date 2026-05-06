<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount, tick } from 'svelte';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import ColorPicker from '$lib/components/ColorPicker.svelte';
	import {
		grantSensitiveConsent,
		hasSensitiveConsent,
		type HealthConsentRecord
	} from '$lib/consent';
	import { supabase } from '$lib/supabase';
	import { activeStorifyTones, storifyTones } from '$lib/data/storifyTones';

	// --- Typer ---

	type Phase = 'empty' | 'chatting' | 'tone-selection' | 'generating' | 'result';
	type Role = 'user' | 'assistant';

	type ChatMessage = {
		id: string;
		role: Role;
		content: string;
	};

	type StorifyEntry = {
		id: string;
		content: string;
		tone: string | null;
		mood_emojis: string[] | null;
		created_at: string;
	};

	// --- Props ---

	let { data } = $props<{ data: { entries: StorifyEntry[] } }>();

	// --- Globalt tillstånd ---

	let activeTab = $state<'skriv' | 'entries'>('skriv');

	// --- Intervjutillstånd ---

	let phase = $state<Phase>('empty');
	let messages = $state<ChatMessage[]>([]);
	let isStreaming = $state(false);
	let streamError = $state('');
	let inputValue = $state('');
	let hasSelectedVoice = $state(false);
	let hasHealthDataConsent = $state(false);

	// --- Tonval ---

	const DEFAULT_TONE_ID = activeStorifyTones[0]?.id ?? 'therapist';
	let selectedTone = $state(DEFAULT_TONE_ID);
	let draftColor = $state('');
	let draftColorName = $state('');
	let draftColorMeaning = $state('');
	let draftColorKeywords = $state<string[]>([]);
	const selectedToneMeta = $derived(
		activeStorifyTones.find((tone) => tone.id === selectedTone) ?? activeStorifyTones[0]
	);
	const colorTone = $derived(
		draftColor
			? {
					id: draftColor,
					name: draftColorName || draftColor,
					meaning: draftColorMeaning,
					keywords: draftColorKeywords
				}
			: null
	);

	// --- Genereringtillstånd ---

	let generatedEntry = $state('');
	let generatedTone = $state('');
	let generating = $state(false);
	let generateError = $state('');

	// --- Sparatillstånd ---

	let isSaved = $state(false);
	let saveError = $state('');

	// --- Inläggslist ---

	let entries = $state<StorifyEntry[]>([]);

	$effect(() => {
		entries = data.entries ?? [];
	});

	// --- Scrollreferens för chattfönstret ---

	let messageListEl = $state<HTMLElement | null>(null);
	let answerInputEl = $state<HTMLTextAreaElement | null>(null);

	// Scrolla till botten efter nya meddelanden
	$effect(() => {
		if (messages.length > 0 && messageListEl) {
			messageListEl.scrollTop = messageListEl.scrollHeight;
		}
	});

	// --- Helpers ---

	function uid(): string {
		return Math.random().toString(36).slice(2);
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('sv-SE', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatTranscript(): string {
		return messages
			.filter((m) => m.content.trim().length > 0)
			.map((m) => {
				const prefix = m.role === 'user' ? 'Användaren' : 'Intervjuaren';
				return `${prefix}: ${m.content}`;
			})
			.join('\n\n');
	}

	function userMessageCount(): number {
		return messages.filter((m) => m.role === 'user').length;
	}

	async function focusAnswerInput() {
		await tick();
		answerInputEl?.focus();
	}

	async function getToken(): Promise<string | null> {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		return session?.access_token ?? null;
	}

	// --- Starta om ---

	function resetInterview() {
		phase = 'empty';
		messages = [];
		inputValue = '';
		streamError = '';
		selectedTone = DEFAULT_TONE_ID;
		hasSelectedVoice = false;
		draftColor = '';
		draftColorName = '';
		draftColorMeaning = '';
		draftColorKeywords = [];
		generatedEntry = '';
		generatedTone = '';
		generateError = '';
		isSaved = false;
		saveError = '';
	}

	// --- Streaming-chatt ---

	async function streamResponse(newMessages: ChatMessage[]) {
		isStreaming = true;
		streamError = '';

		// Lägg till tomt assistentmeddelande som fylls på
		const assistantMsg: ChatMessage = { id: uid(), role: 'assistant', content: '' };
		messages = [...newMessages, assistantMsg];

		try {
			// Injicera ett syntetiskt öppningsmeddelande från assistenten så att AI:n
		// alltid ser [assistant_open, user_svar, ...] och hoppar direkt till uppföljning.
		// Matchar den statiska texten som visas i empty-fasen.
		const OPENING_MSG = { role: 'assistant' as const, content: 'Hur var din dag?' };
		const apiMessages = [
			OPENING_MSG,
			...newMessages.map((m) => ({ role: m.role, content: m.content }))
		];

		const response = await fetch('/api/storify/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: apiMessages,
					selectedTone,
					colorTone
				})
			});

			if (!response.ok) {
				const err = await response.json().catch(() => ({})) as { error?: string };
				throw new Error(err.error ?? `Fel ${response.status}`);
			}

			const reader = response.body!.getReader();
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
					if (!trimmed.startsWith('data: ')) continue;

					const data = trimmed.slice(6);
					if (data === '[DONE]') break;

					try {
						const parsed = JSON.parse(data) as { text?: string; error?: string };
						if (parsed.error) throw new Error(parsed.error);
						if (parsed.text) {
							// Lägg till text till sista assistentmeddelandet
							messages = messages.map((m, i) =>
								i === messages.length - 1 ? { ...m, content: m.content + parsed.text } : m
							);
						}
					} catch (e) {
						if (e instanceof SyntaxError) continue;
						throw e;
					}
				}
			}
		} catch (e) {
			streamError = e instanceof Error ? e.message : 'Ett oväntat fel uppstod.';
			// Ta bort det tomma assistentmeddelandet vid fel
			messages = messages.filter((m) => !(m.role === 'assistant' && m.content === ''));
		} finally {
			isStreaming = false;
			if (activeTab === 'skriv' && phase === 'chatting') {
				void focusAnswerInput();
			}
		}
	}

	function handleSend() {
		const text = inputValue.trim();
		if (!hasHealthDataConsent || !text || isStreaming) return;

		inputValue = '';

		const userMsg: ChatMessage = { id: uid(), role: 'user', content: text };
		const newMessages = [...messages, userMsg];

		if (phase === 'empty') {
			phase = 'chatting';
		}

		streamResponse(newMessages);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	// --- Tonval och generering ---

	function proceedToToneSelection() {
		phase = 'tone-selection';
	}

	async function handleGenerate() {
		generateError = '';
		generatedEntry = '';
		phase = 'generating';
		generating = true;

		const token = await getToken();
		if (!token) {
			generateError = 'Sessionen har gått ut. Ladda om sidan och försök igen.';
			generating = false;
			phase = 'tone-selection';
			return;
		}

		const transcript = formatTranscript();

		const res = await fetch('/api/storify/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ chatTranscript: transcript, selectedTone, colorTone })
		});

		const body = await res.json().catch(() => ({})) as { entry?: string; tone?: string; error?: string };

		if (!res.ok) {
			generateError = body.error ?? 'Generering misslyckades. Försök igen.';
			generating = false;
			phase = 'tone-selection';
			return;
		}

		generatedEntry = body.entry ?? '';
		generatedTone = body.tone ?? selectedTone;
		generating = false;
		phase = 'result';

		// Spara automatiskt efter generering
		await autoSave(token);
	}

	async function autoSave(existingToken?: string) {
		const token = existingToken ?? (await getToken());
		if (!token) {
			console.error('[autoSave] Ingen token – sessionen har gått ut.');
			saveError = 'Inlägget genererades men kunde inte sparas eftersom sessionen har gått ut.';
			return;
		}
		if (!generatedEntry) {
			console.error('[autoSave] generatedEntry är tomt – inget att spara.');
			return;
		}

		console.log('[autoSave] Skickar till /api/storify/save, tone:', generatedTone, '| length:', generatedEntry.length);

		const res = await fetch('/api/storify/save', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				entry: generatedEntry,
				tone: generatedTone,
				moodEmojis: [],
				energyScore: 5
			})
		});

		const resBody = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };

		if (res.ok) {
			console.log('[autoSave] Sparat OK.');
			isSaved = true;
			const newEntry: StorifyEntry = {
				id: uid(),
				content: generatedEntry,
				tone: generatedTone,
				mood_emojis: [],
				created_at: new Date().toISOString()
			};
			entries = [newEntry, ...entries];
		} else {
			console.error('[autoSave] Misslyckades. Status:', res.status, '| Fel:', resBody.error);
			saveError = 'Inlägget genererades men kunde inte sparas.';
		}
	}

	// Tonetikett för visning
	function getToneLabel(toneId: string): string {
		return storifyTones.find((t) => t.id === toneId)?.label ?? toneId;
	}

	async function persistUserConsent(consent: HealthConsentRecord) {
		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (!session) return;

		const { error } = await supabase.auth.updateUser({
			data: {
				health_data_processing_consent: consent
			}
		});

		if (!error) {
			await supabase.auth.refreshSession();
		}
	}

	function acceptHealthConsent() {
		const consent = grantSensitiveConsent();
		hasHealthDataConsent = true;
		void persistUserConsent(consent);
	}

	onMount(async () => {
		const {
			data: { session }
		} = await supabase.auth.getSession();

		hasHealthDataConsent = hasSensitiveConsent(session?.user.user_metadata);
	});
</script>

<SEO canonical="https://www.mittpsyke.se/dagars-avtryck" />

<svelte:head>
	<title>Dagbok med olika stilar | MittPsyke</title>
	<meta name="description" content="Välj en röst som Grubblaren, Filosofen, Psykologen eller Quest log och låt en guidad intervju bli ett dagboksinlägg." />
</svelte:head>

<main class="auth-page">
	<div class="auth-shell">

		<!-- Sidhuvud -->
		<div class="auth-panel page-header">
			<h1 class="page-title">Dagbok med olika stilar</h1>
			<p class="auth-muted header-desc">
				Välj en röst, svara i lugn takt och låt intervjun bli ett personligt dagboksinlägg.
			</p>
			<p class="auth-muted header-context">
				En del av <a href="/dagbok" class="header-link">Dagbok</a>. Vill du skriva fritt i stället? Välj
				<a href="/dagbok/checkin#skriv-sjalv" class="header-link">Skriv själv</a>.
			</p>
		</div>

		<!-- Fliknavigering -->
		<nav class="auth-subnav" aria-label="Flikar">
			<button
				class="auth-subnav-link tab-btn"
				class:active={activeTab === 'skriv'}
				onclick={() => (activeTab = 'skriv')}
			>
				Skriv
			</button>
			<button
				class="auth-subnav-link tab-btn"
				class:active={activeTab === 'entries'}
				onclick={() => (activeTab = 'entries')}
			>
				Mina inlägg ({entries.length})
			</button>
		</nav>

		<!-- ===== SKRIV-FLIKEN ===== -->
		{#if activeTab === 'skriv'}
			{#if !hasHealthDataConsent}
				<ConsentGate onAccept={acceptHealthConsent} />
			{:else}

			<!-- FAS: Tom start -->
			{#if phase === 'empty'}
				<section class="auth-panel empty-panel">
					<div class="voice-intro">
						<p class="voice-kicker">Välj röst först</p>
						<div class="voice-grid" aria-label="Välj röst för frågeflödet">
							{#each activeStorifyTones as tone}
								<button
									type="button"
									class="tone-btn voice-btn"
									class:selected={selectedTone === tone.id}
									onclick={() => { selectedTone = tone.id; hasSelectedVoice = true; }}
									aria-pressed={selectedTone === tone.id}
									title={tone.description}
								>
									<span class="tone-emoji">{tone.emoji}</span>
									<span class="tone-label">{tone.label}</span>
								</button>
							{/each}
						</div>
						<p class="voice-copy auth-muted">
							Vald röst: {selectedToneMeta?.label}. Frågorna och dagboksinlägget följer samma ton.
						</p>
						<p class="voice-kicker">Vilken färg har dagen idag?</p>
						<p class="voice-copy auth-muted">
							Det hjälper tonen i reflektionen att landa närmare det du bär på just nu.
						</p>
						<ColorPicker
							bind:value={draftColor}
							bind:selectedName={draftColorName}
							bind:selectedMeaning={draftColorMeaning}
							bind:selectedKeywords={draftColorKeywords}
						/>
					</div>
					<p class="empty-prompt">
						{selectedToneMeta?.label} börjar: hur var din dag?
					</p>
					<div class="input-row">
						<textarea
							bind:this={answerInputEl}
							class="chat-input"
							placeholder={hasSelectedVoice ? 'Skriv något och tryck Enter...' : 'Välj en röst ovan för att börja...'}
							bind:value={inputValue}
							onkeydown={handleKeydown}
							disabled={!hasSelectedVoice}
							rows={2}
							aria-label="Berätta om din dag"
						></textarea>
						<button
							class="send-btn"
							onclick={handleSend}
							disabled={!inputValue.trim() || !hasSelectedVoice}
							aria-label="Skicka"
						>
							→
						</button>
					</div>
				</section>

			<!-- FAS: Chattar -->
			{:else if phase === 'chatting'}
				<section class="auth-panel chat-panel">
					<!-- Meddelandelista -->
					<div class="message-list" bind:this={messageListEl} aria-live="polite" aria-label="Konversation">
						{#each messages as msg (msg.id)}
							<div class="message" class:user={msg.role === 'user'} class:assistant={msg.role === 'assistant'}>
								<div class="bubble">
									{#if msg.content}
										{msg.content}
									{:else if isStreaming}
										<span class="typing-dots"><span></span><span></span><span></span></span>
									{/if}
								</div>
							</div>
						{/each}
					</div>

					{#if streamError}
						<div class="stream-error" role="alert">
							{streamError}
							<button class="retry-btn" onclick={() => streamResponse(messages.slice(0, -1))}>Försök igen</button>
						</div>
					{/if}

					<!-- Inmatningsfält -->
					<div class="input-area">
						<textarea
							bind:this={answerInputEl}
							class="chat-input"
							placeholder="Skriv ditt svar..."
							bind:value={inputValue}
							onkeydown={handleKeydown}
							disabled={isStreaming}
							rows={2}
							aria-label="Ditt svar"
						></textarea>
						<button
							class="send-btn"
							onclick={handleSend}
							disabled={!inputValue.trim() || isStreaming}
							aria-label="Skicka"
						>
							→
						</button>
					</div>

					<!-- Avsluta-knapp (synlig efter minst 3 användarmeddelanden) -->
					{#if userMessageCount() >= 3}
						<div class="finish-row">
							<button class="auth-button primary finish-btn" onclick={handleGenerate} disabled={isStreaming}>
								Skapa dagboksinlägg →
							</button>
						</div>
					{/if}
				</section>

			<!-- FAS: Tonval -->
			{:else if phase === 'tone-selection'}
				<section class="auth-panel">
					<h2 class="section-title">Justera rösten innan du skapar inlägget</h2>
					<p class="auth-muted tone-intro">Frågorna har gått i {selectedToneMeta?.label?.toLowerCase() ?? 'vald'} ton. Du kan byta innan dagboken skapas.</p>

					<div class="tone-grid">
						{#each activeStorifyTones as tone}
							<button
								class="tone-btn"
								class:selected={selectedTone === tone.id}
								onclick={() => (selectedTone = tone.id)}
								aria-pressed={selectedTone === tone.id}
								title={tone.description}
							>
								<span class="tone-emoji">{tone.emoji}</span>
								<span class="tone-label">{tone.label}</span>
							</button>
						{/each}
					</div>

					{#if generateError}
						<p class="error-msg" role="alert">{generateError}</p>
					{/if}

					<div class="tone-actions">
						<button class="auth-button back-btn" onclick={() => (phase = 'chatting')}>
							← Tillbaka
						</button>
						<button class="auth-button primary generate-btn" onclick={handleGenerate}>
							Skapa dagboksinlägg
						</button>
					</div>
				</section>

			<!-- FAS: Genererar -->
			{:else if phase === 'generating'}
				<section class="auth-panel generating-panel">
					<div class="spinner" aria-hidden="true"></div>
					<p class="generating-text">Skriver ditt dagboksinlägg...</p>
					<p class="auth-muted generating-tone">Ton: {getToneLabel(selectedTone)}</p>
				</section>

			<!-- FAS: Resultat -->
			{:else if phase === 'result'}
				<section class="auth-panel auth-panel-accent result-panel">
					<div class="result-header">
						<p class="entry-kicker">Ditt dagboksinlägg</p>
						<span class="tone-badge">{getToneLabel(generatedTone || selectedTone)}</span>
					</div>

					<div class="entry-text">
						{generatedEntry}
					</div>

					<div class="result-status">
						{#if isSaved}
							<p class="saved-msg">Sparat till Mina inlägg ✓</p>
						{:else if saveError}
							<p class="error-msg" role="alert">{saveError}</p>
						{/if}
					</div>

					<div class="result-actions">
						<button class="auth-button primary" onclick={resetInterview}>
							Ny intervju
						</button>
					</div>
				</section>
			{/if}
			{/if}

		<!-- ===== MINA INLÄGG-FLIKEN ===== -->
		{:else}
			{#if entries.length === 0}
				<section class="auth-panel">
					<p class="auth-muted">
						Du har inga sparade inlägg ännu. Gå till "Skriv" och skapa ditt första!
					</p>
				</section>
			{:else}
				{#each entries as entry (entry.id)}
					<article class="auth-panel entry-card">
						<header class="entry-header">
							<time class="entry-date auth-muted" datetime={entry.created_at}>
								{formatDate(entry.created_at)}
							</time>
							<div class="entry-meta">
								{#if entry.mood_emojis && entry.mood_emojis.length > 0}
									<span class="entry-moods" aria-label="Stämning">{entry.mood_emojis.join(' ')}</span>
								{/if}
								{#if entry.tone}
									<span class="tone-badge">{getToneLabel(entry.tone)}</span>
								{/if}
							</div>
						</header>
						<p class="entry-content">{entry.content}</p>
					</article>
				{/each}
			{/if}
		{/if}

	</div>
</main>

<style>
	/* Sidhuvud */
	.page-header {
		padding: 1.25rem;
	}

	.page-title {
		margin: 0;
		font-size: clamp(1.4rem, 1.1rem + 1vw, 1.9rem);
	}

	.header-desc {
		margin: 0.3rem 0 0;
		font-size: 0.95rem;
	}

	.header-context {
		margin: 0.4rem 0 0;
		font-size: 0.86rem;
	}

	.header-link {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* Flikar */
	.tab-btn {
		background: transparent;
		cursor: pointer;
	}

	/* Tom startpanel */
	.empty-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.voice-intro {
		display: grid;
		gap: 0.75rem;
	}

	.voice-kicker {
		margin: 0;
		font-size: 0.76rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.voice-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
		gap: 0.4rem;
	}

	.voice-btn {
		min-height: 5.25rem;
	}

	.voice-copy {
		margin: 0;
		font-size: 0.86rem;
	}

	.empty-prompt {
		margin: 0;
		font-size: 1.05rem;
	}

	/* Chattpanel */
	.chat-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0;
		overflow: hidden;
	}

	.message-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		max-height: 55vh;
		overflow-y: auto;
		scroll-behavior: smooth;
	}

	.message {
		display: flex;
	}

	.message.user {
		justify-content: flex-end;
	}

	.message.assistant {
		justify-content: flex-start;
	}

	.bubble {
		max-width: 78%;
		padding: 0.6rem 0.85rem;
		border-radius: 18px;
		line-height: 1.55;
		font-size: 0.95rem;
		white-space: pre-wrap;
	}

	.message.user .bubble {
		background: var(--theme-bg, hsl(var(--surface-soft)));
		border: 1px solid hsl(var(--border));
		border-bottom-right-radius: 4px;
	}

	.message.assistant .bubble {
		background: hsl(var(--surface-muted));
		border: 1px solid hsl(var(--border));
		border-bottom-left-radius: 4px;
		color: hsl(var(--foreground));
	}

	/* Skrivindikator */
	.typing-dots {
		display: inline-flex;
		gap: 4px;
		align-items: center;
		padding: 2px 0;
	}

	.typing-dots span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: hsl(var(--muted-foreground));
		animation: dot-bounce 1.2s infinite ease-in-out;
	}

	.typing-dots span:nth-child(1) { animation-delay: 0s; }
	.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
	.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

	@keyframes dot-bounce {
		0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
		40% { transform: translateY(-5px); opacity: 1; }
	}

	/* Fel */
	.stream-error {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: hsl(var(--error-surface));
		color: hsl(var(--error-foreground));
		font-size: 0.88rem;
	}

	.retry-btn {
		background: none;
		border: none;
		cursor: pointer;
		text-decoration: underline;
		color: inherit;
		font-size: inherit;
	}

	/* Inmatningsfält */
	.input-area {
		display: flex;
		gap: 0.5rem;
		align-items: flex-end;
		padding: 0.75rem 1rem;
		border-top: 1px solid hsl(var(--border));
	}

	.input-row {
		display: flex;
		gap: 0.5rem;
		align-items: flex-end;
	}

	.chat-input {
		flex: 1;
		padding: 0.6rem 0.75rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-muted));
		color: hsl(var(--foreground));
		font-size: 0.95rem;
		line-height: 1.5;
		resize: none;
		transition: border-color 150ms ease;
	}

	.chat-input:focus {
		outline: none;
		border-color: hsl(var(--muted-foreground) / 0.5);
	}

	.chat-input:disabled {
		opacity: 0.6;
	}

	.send-btn {
		flex-shrink: 0;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: var(--theme-bg, hsl(var(--surface-soft)));
		cursor: pointer;
		font-size: 1.1rem;
		transition: background-color 120ms ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.send-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.send-btn:not(:disabled):hover {
		background: hsl(var(--surface-soft));
	}

	/* Avsluta-rad */
	.finish-row {
		padding: 0.5rem 1rem 0.75rem;
		display: flex;
		justify-content: flex-end;
	}

	.finish-btn {
		font-size: 0.9rem;
	}

	/* Sektionsrubrik */
	.section-title {
		margin: 0 0 0.25rem;
		font-size: 1.1rem;
	}

	.tone-intro {
		margin: 0 0 1rem;
		font-size: 0.9rem;
	}

	/* Tonväljare */
	.tone-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 0.4rem;
		margin-bottom: 1.25rem;
	}

	.tone-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		padding: 0.6rem 0.4rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-muted));
		cursor: pointer;
		transition: background-color 120ms ease, border-color 120ms ease;
		text-align: center;
	}

	.tone-btn:hover {
		background: hsl(var(--surface-soft));
		border-color: hsl(var(--muted-foreground) / 0.4);
	}

	.tone-btn.selected {
		background: var(--theme-bg, hsl(var(--surface-soft)));
		border-color: hsl(var(--muted-foreground) / 0.6);
	}

	.tone-emoji {
		font-size: 1.4rem;
	}

	.tone-label {
		font-size: 0.72rem;
		line-height: 1.2;
		color: hsl(var(--foreground));
	}

	.tone-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.generate-btn {
		flex: 1;
	}

	.back-btn {
		flex-shrink: 0;
	}

	/* Genererar */
	.generating-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 2.5rem 1rem;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid hsl(var(--border));
		border-top-color: hsl(var(--muted-foreground));
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.generating-text {
		margin: 0;
		font-size: 0.95rem;
	}

	.generating-tone {
		margin: 0;
		font-size: 0.85rem;
	}

	/* Resultatpanel */
	.result-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.result-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.entry-kicker {
		margin: 0;
		font-size: 0.76rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.tone-badge {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: var(--radius-pill);
		background: hsl(var(--surface-muted));
		border: 1px solid hsl(var(--border));
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.entry-text {
		line-height: 1.75;
		white-space: pre-wrap;
	}

	.result-status {
		min-height: 1.4rem;
	}

	.saved-msg {
		margin: 0;
		font-size: 0.88rem;
		color: hsl(var(--success-foreground));
	}

	.error-msg {
		margin: 0;
		font-size: 0.88rem;
		color: hsl(var(--error-foreground));
	}

	.result-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	/* Mina inlägg */
	.entry-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.entry-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.entry-date {
		font-size: 0.82rem;
	}

	.entry-meta {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.entry-moods {
		font-size: 1rem;
	}

	.entry-content {
		margin: 0;
		line-height: 1.7;
	}
</style>
