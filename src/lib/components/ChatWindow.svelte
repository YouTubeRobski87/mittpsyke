<script lang="ts">
	import { browser, dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { containsCrisisSignal } from '$lib/ai/safety';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import { PUBLIC_CONTACT_MAILTO } from '$lib/contact';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent,
		hasSensitiveConsent,
		type HealthConsentRecord
	} from '$lib/consent';
	import {
		trackChatMessageSent,
		trackChatStarted,
		trackEvent
	} from '$lib/analytics';
	import {
		CHAT_CONTEXT_LIMIT,
		getChatHistoryStorageKey,
		getChatTopic,
		sanitizeChatMessages
	} from '$lib/state/chat-memory';
	import { supabase } from '$lib/supabase';
	import { onMount, tick } from 'svelte';
	import type { ChatMessage } from '$lib/types';

	type ChatHistoryRow = {
		id: string;
		user_id: string;
		topic: string;
		messages: unknown;
		updated_at: string;
	};

	let {
		category,
		initialMessages = [],
		initialConversationId = null
	}: {
		category: string;
		initialMessages?: ChatMessage[];
		initialConversationId?: string | null;
	} = $props();

	let messages = $state<ChatMessage[]>([]);
	let input = $state('');
	let sending = $state(false);
	let chatError = $state('');
	let savePromptHidden = $state<Record<number, boolean>>({});
	let hasTrackedOpen = $state(false);
	let hasTrackedFirstMessage = $state(false);
	let showAccountNudge = $state(false);
	let nudgeDismissed = $state(false);
	let isAnonymous = $state(true);
	let firstMessageSource = $state<'manual' | 'chip'>('manual');
	let hasSensitiveDataConsent = $state(false);
	let conversationId = $state<string | null>(null);
	let historyNoticeVisible = $state(false);
	let persistenceReady = $state(false);
	let persistenceUserId = $state<string | null>(null);
	let clearingHistory = $state(false);
	let chatLog: HTMLDivElement;

	const MAX_MESSAGE_LENGTH = 2000;
	const LONG_MESSAGE_ERROR =
		'Din text blev lite för lång att skicka på en gång. Dela gärna upp den i två delar.';
	const GENERIC_CHAT_ERROR = 'Något gick fel. Försök igen om en stund.';
	const HISTORY_NOTICE = 'Tidigare samtal är laddat.';
	const guestIdStorageKey = 'mittpsyke:guest-id';
	const starterSuggestions = ['Jag känner mig orolig', 'Hjälp mig sortera mina tankar'];
	const extraSuggestions = [
		'Tankarna snurrar och jag får ingen ro',
		'Jag vet inte varför jag mår dåligt'
	];
	let showMoreSuggestions = $state(false);

	const elevatedSupportKeywords = [
		'för mycket',
		'for mycket',
		'hopplös',
		'orkar inte',
		'hopplös',
		'hopplöst',
		'hopplost',
		'ensam',
		'kan inte mer',
		'prata med någon',
		'prata med nagon',
		'prata med en människa',
		'prata med en manniska',
		'text räcker inte',
		'text racker inte',
		'texten räcker inte',
		'texten racker inte'
	];

	const acuteSupportKeywords = [
		'akut fara',
		'självmord',
		'sjalvmord',
		'suicid',
		'ta mitt liv',
		'ta livet av mig',
		'vill dö',
		'vill vara död',
		'vill do',
		'vill vara dod',
		'orkar inte leva',
		'inte orkar leva',
		'skada mig själv',
		'skada mig sjalv',
		'självskad',
		'sjalvskad',
		'skada någon annan',
		'skada nagon annan',
		'hoppa från',
		'hoppa fran',
		'försvinna för alltid',
		'forsvinna for alltid',
		'ingen mening att leva',
		'hoppas att jag dör',
		'hoppas att jag dor',
		'bättre om jag var död',
		'battre om jag var dod',
		'avsluta allt',
		'avsluta mitt liv',
		'inte vakna',
		'somna för alltid',
		'somna for alltid',
		'avskedsbrev',
		'ta tabletter',
		'ta överdos',
		'ta overdos',
		'sista utvägen',
		'sista utvagen',
		'göra slut på allt',
		'gora slut pa allt'
	];

	let chatTopic = $derived(getChatTopic(category));
	let inputLength = $derived(input.length);
	let showStarterSuggestions = $derived(
		hasSensitiveDataConsent && messages.length === 0 && input.trim().length === 0
	);

	function latestUserMessageContent() {
		for (let i = messages.length - 1; i >= 0; i -= 1) {
			const msg = messages[i];
			if (msg.role === 'user') return msg.content.toLowerCase();
		}
		return '';
	}

	function supportLevel() {
		const text = latestUserMessageContent();
		if (!text) return 'standard';
		if (acuteSupportKeywords.some((keyword) => text.includes(keyword)) || containsCrisisSignal(text)) {
			return 'acute';
		}
		if (elevatedSupportKeywords.some((keyword) => text.includes(keyword))) {
			return 'elevated';
		}
		return 'standard';
	}

	let currentSupportLevel = $derived(supportLevel());
	const tempEntryStorageKey = 'mittpsyke_temp_entry';

	function scrollToBottom() {
		if (chatLog) {
			chatLog.scrollTop = chatLog.scrollHeight;
		}
	}

	function getOrCreateGuestId() {
		if (!browser) return null;

		const existingGuestId = window.localStorage.getItem(guestIdStorageKey)?.trim();
		if (existingGuestId) return existingGuestId;

		const guestId = crypto.randomUUID();
		window.localStorage.setItem(guestIdStorageKey, guestId);
		return guestId;
	}

	function readLocalHistory(userId: string | null = null) {
		if (!browser) return [];

		const primaryKey = getChatHistoryStorageKey(chatTopic, userId);
		const fallbackKey = userId ? getChatHistoryStorageKey(chatTopic) : null;

		for (const key of [primaryKey, fallbackKey]) {
			if (!key) continue;

			try {
				const raw = window.localStorage.getItem(key);
				if (!raw) continue;

				const parsed = JSON.parse(raw);
				const nextMessages = sanitizeChatMessages(parsed);
				if (nextMessages.length > 0) return nextMessages;
			} catch (error) {
				console.error('Could not parse local chat history:', error);
			}
		}

		return [];
	}

	function writeLocalHistory(nextMessages: ChatMessage[], userId: string | null = null) {
		if (!browser) return;

		const storageKey = getChatHistoryStorageKey(chatTopic, userId);
		if (nextMessages.length === 0) {
			window.localStorage.removeItem(storageKey);
			return;
		}

		window.localStorage.setItem(storageKey, JSON.stringify(nextMessages));
	}

	function logChatCleanupError(context: string, error: unknown) {
		if (dev) {
			console.error(`[chat] cleanup failed (${context}):`, error);
		}
	}

	async function getActiveChatHistoryUserId(expectedUserId: string | null, context: string) {
		if (!expectedUserId) return null;

		try {
			const {
				data: { session },
				error
			} = await supabase.auth.getSession();

			if (error) {
				logChatCleanupError(context, error);
				return null;
			}

			const sessionUserId = session?.user?.id?.trim();
			if (!session?.access_token || !sessionUserId || sessionUserId !== expectedUserId) {
				return null;
			}

			return sessionUserId;
		} catch (error) {
			logChatCleanupError(context, error);
			return null;
		}
	}

	async function deletePersistedChatHistory(userId: string | null, context: string) {
		const activeUserId = await getActiveChatHistoryUserId(userId, context);
		if (!activeUserId) return;

		try {
			const { error } = await supabase
				.from('chat_history')
				.delete()
				.eq('user_id', activeUserId)
				.eq('topic', chatTopic);

			if (error) {
				logChatCleanupError(context, error);
			}
		} catch (error) {
			logChatCleanupError(context, error);
		}
	}

	async function loadPersistedHistory(userId: string | null) {
		const localMessages = readLocalHistory(userId);
		if (!userId) {
			return {
				messages: localMessages,
				loadedFromMemory: localMessages.length > 0
			};
		}

		try {
			const { data, error } = await supabase
				.from('chat_history')
				.select('id, user_id, topic, messages, updated_at')
				.eq('user_id', userId)
				.eq('topic', chatTopic)
				.maybeSingle();

			if (error) {
				throw error;
			}

			const nextMessages = sanitizeChatMessages((data as ChatHistoryRow | null)?.messages);
			if (nextMessages.length > 0) {
				return {
					messages: nextMessages,
					loadedFromMemory: true
				};
			}

			return {
				messages: localMessages,
				loadedFromMemory: localMessages.length > 0
			};
		} catch (error) {
			console.error('Could not load Supabase chat history, using local fallback:', error);
			return {
				messages: localMessages,
				loadedFromMemory: localMessages.length > 0
			};
		}
	}

	async function persistHistory(nextMessages: ChatMessage[], userId: string | null) {
		const normalized = sanitizeChatMessages(nextMessages);

		writeLocalHistory(normalized, userId);

		if (!userId) return;

		try {
			if (normalized.length === 0) {
				await deletePersistedChatHistory(userId, 'persist-empty-history');
				return;
			}

			const { error } = await supabase.from('chat_history').upsert(
				{
					user_id: userId,
					topic: chatTopic,
					messages: normalized,
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'user_id,topic' }
			);

			if (error) throw error;
		} catch (error) {
			console.error('Could not sync chat history to Supabase, local fallback kept:', error);
			writeLocalHistory(normalized, userId);
		}
	}

	async function clearHistory() {
		clearingHistory = true;
		chatError = '';
		input = '';
		messages = [];
		savePromptHidden = {};
		historyNoticeVisible = false;
		conversationId = null;

		writeLocalHistory([], null);
		if (persistenceUserId) {
			writeLocalHistory([], persistenceUserId);
			await deletePersistedChatHistory(persistenceUserId, 'clear-history');
		}

		await goto(`/chat/${category}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});

		await tick();
		scrollToBottom();
		clearingHistory = false;
	}

	$effect(() => {
		if (!browser) return;

		let cancelled = false;

		async function bootstrapHistory() {
			persistenceReady = false;
			chatError = '';
			savePromptHidden = {};
			historyNoticeVisible = false;
			showMoreSuggestions = false;

			const seededMessages = sanitizeChatMessages(initialMessages);
			const {
				data: { session }
			} = await supabase.auth.getSession();

			if (cancelled) return;

			persistenceUserId = session?.user.id ?? null;
			isAnonymous = !session;

			if (seededMessages.length > 0 || initialConversationId) {
				messages = seededMessages;
				conversationId = initialConversationId;
				historyNoticeVisible = seededMessages.length > 0;
			} else {
				const persisted = await loadPersistedHistory(session?.user.id ?? null);
				if (cancelled) return;

				messages = persisted.messages;
				conversationId = null;
				historyNoticeVisible = persisted.loadedFromMemory;

				// Carry first draft text from /skriv into chat input when no history exists yet.
				if (messages.length === 0) {
					const tempEntry = window.localStorage.getItem(tempEntryStorageKey)?.trim() ?? '';
					if (tempEntry.length > 0) {
						input = tempEntry;
						window.localStorage.removeItem(tempEntryStorageKey);
					}
				}
			}

			window.localStorage.setItem('mittpsyke:last-chat-category', category);
			persistenceReady = true;
			await tick();
			scrollToBottom();
		}

		void bootstrapHistory();

		return () => {
			cancelled = true;
		};
	});

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, session) => {
			isAnonymous = !session;
			persistenceUserId = session?.user.id ?? null;
			if (hasSensitiveConsent(session?.user.user_metadata)) {
				hasSensitiveDataConsent = true;
			}
		});

		void supabase.auth.getSession().then(({ data }) => {
			hasSensitiveDataConsent = hasSensitiveConsent(data.session?.user.user_metadata);
		});

		if (!hasTrackedOpen) {
			hasTrackedOpen = true;
			void trackEvent('chat_open');
		}

		return () => {
			subscription.unsubscribe();
		};
	});

	$effect(() => {
		const assistantCount = messages.filter((message) => message.role === 'assistant').length;
		if (assistantCount >= 3 && isAnonymous && !nudgeDismissed) {
			showAccountNudge = true;
			void trackEvent('view_chat_nudge');
		}
	});

	$effect(() => {
		if (!browser || !persistenceReady || clearingHistory) return;
		void persistHistory(messages, persistenceUserId);
	});

	async function send() {
		const text = input.trim();
		if (!hasSensitiveDataConsent || !text || sending) return;

		chatError = '';
		if (text.length > MAX_MESSAGE_LENGTH) {
			chatError = LONG_MESSAGE_ERROR;
			return;
		}

		const {
			data: { session }
		} = await supabase.auth.getSession();
		const guestId = session ? null : getOrCreateGuestId();
		const contextMessages = sanitizeChatMessages(messages, CHAT_CONTEXT_LIMIT);

		messages.push({ role: 'user', content: text });
		input = '';
		sending = true;
		await tick();
		scrollToBottom();

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION,
					...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
				},
				body: JSON.stringify({
					message: text,
					category,
					conversationId,
					contextMessages,
					...(guestId ? { guestId } : {})
				})
			});

			const data = (await res.json().catch(() => null)) as
				| {
						reply?: string;
						conversationId?: string;
						crisis?: boolean;
						error?: string;
						code?: string;
				  }
				| null;

			if (!res.ok) {
				if (res.status === 413 || data?.code === 'MESSAGE_TOO_LONG') {
					throw new Error(LONG_MESSAGE_ERROR);
				}
				if (typeof data?.error === 'string' && data.error.trim()) {
					throw new Error(data.error);
				}
				throw new Error(GENERIC_CHAT_ERROR);
			}

			if (data?.conversationId) {
				conversationId = data.conversationId;
			}

			if (browser) {
				window.localStorage.setItem('mittpsyke:last-chat-category', category);
			}

			trackChatMessageSent();
			if (!hasTrackedFirstMessage) {
				trackChatStarted();
				void trackEvent('first_message_sent', {
					source: firstMessageSource,
					textLength: text.length
				});
				hasTrackedFirstMessage = true;
			}

			messages.push({
				role: 'assistant',
				content: data?.reply && data.reply.trim() ? data.reply : GENERIC_CHAT_ERROR,
				crisis: data?.crisis ?? false
			});

			await tick();
			scrollToBottom();
		} catch (error) {
			const lastMessage = messages[messages.length - 1];
			if (lastMessage?.role === 'user' && lastMessage.content === text) {
				messages = messages.slice(0, -1);
			}

			chatError =
				error instanceof Error && error.message.trim().length > 0
					? error.message
					: GENERIC_CHAT_ERROR;
			input = text;

			await tick();
			scrollToBottom();
		} finally {
			sending = false;
			await tick();
			scrollToBottom();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			void send();
		}
	}

	function useStarterSuggestion(text: string) {
		if (!hasSensitiveDataConsent) return;

		chatError = '';
		firstMessageSource = 'chip';
		void trackEvent('starter_chip_clicked', {
			source: 'chip',
			textLength: text.length
		});
		input = text;
	}

	async function saveAsJournalNote(content: string, index: number) {
		savePromptHidden[index] = true;

		const { data } = await supabase.auth.getSession();
		if (!data.session) {
			void goto('/login');
			return;
		}

		void goto(`/dagbok/checkin?prefill=${encodeURIComponent(content)}`);
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

	function acceptSensitiveConsent() {
		const consent = grantSensitiveConsent();
		hasSensitiveDataConsent = true;
		void persistUserConsent(consent);
	}
</script>

<div class="chat-container flex flex-col h-[calc(100vh-200px)] max-w-2xl mx-auto">
	<div class="chat-support-link px-4 pb-2 text-right">
		<a
			href="https://stodlinjer.se"
			target="_blank"
			rel="noopener noreferrer"
			class="text-xs underline opacity-70 hover:opacity-100 transition-opacity"
		>
			Behöver du mänsklig kontakt? Se stödlinjer
		</a>
	</div>

	<div class="chat-toolbar px-4 pb-3">
		{#if historyNoticeVisible && messages.length > 0}
			<p class="history-notice">{HISTORY_NOTICE}</p>
		{/if}

		<button
			type="button"
			class="clear-history-button"
			onclick={clearHistory}
			disabled={sending || clearingHistory || messages.length === 0}
		>
			Rensa historik
		</button>
	</div>

	<div
		bind:this={chatLog}
		class="chat-messages flex-1 overflow-y-auto p-4 space-y-3"
		aria-live="polite"
		aria-busy={sending}
	>
		{#if messages.length === 0}
			<div class="text-center mt-4">
				<p class="text-sm opacity-60">Skriv något så börjar vi prata. Allt sker utan dömande.</p>
			</div>
		{/if}

		{#each messages as msg, i}
			<div class="space-y-1">
				{#if msg.role === 'assistant'}
					<div class="text-xs opacity-55 px-1 text-left">✦ Mitt stöd</div>
				{/if}

				<div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
					<div
						class="max-w-[80%] px-4 py-3 rounded-[var(--radius-card)] text-sm leading-relaxed
							{msg.role === 'user'
								? 'bg-[var(--primary)] text-white rounded-br-md'
								: msg.crisis
									? 'bg-rose-50 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-700 rounded-bl-md crisis-message'
									: 'bg-black/5 dark:bg-white/10 rounded-bl-md'}"
					>
						{#each msg.content.split('\n') as line, j}
							{#if j > 0}<br />{/if}
							{line}
						{/each}
					</div>
				</div>

				{#if msg.role === 'assistant' && !savePromptHidden[i]}
					<div class="text-xs opacity-55 px-1 text-left">
						Vill du spara detta som anteckning?
						<button
							type="button"
							class="ml-1 underline hover:opacity-100 transition-opacity"
							onclick={() => saveAsJournalNote(msg.content, i)}
						>
							Ja
						</button>
					</div>
				{/if}
			</div>
		{/each}

		{#if sending}
			<div class="flex justify-start" role="status" aria-live="polite">
				<div class="bg-black/5 dark:bg-white/10 px-4 py-3 rounded-[var(--radius-card)] rounded-bl-md text-sm opacity-60">
					Skriver...
				</div>
			</div>
		{/if}
	</div>

	{#if showAccountNudge}
		<div class="px-4 py-2 flex items-center justify-between gap-2 text-xs opacity-60 border-t border-black/5 dark:border-white/5">
			<p>
				Vill du kunna återvända hit?
				<a
					href="/register"
					class="underline hover:opacity-100"
					onclick={() => {
						void trackEvent('click_chat_nudge');
					}}
				>
					Skapa konto
				</a>
				för att spara dina reflektioner.
			</p>
			<button
				type="button"
				class="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
				onclick={() => {
					showAccountNudge = false;
					nudgeDismissed = true;
				}}
			>
				Stäng
			</button>
		</div>
	{/if}

	<div class="chat-input-area border-t border-black/8 dark:border-white/10 p-4">
		{#if !hasSensitiveDataConsent}
			<div class="mb-3">
				<ConsentGate onAccept={acceptSensitiveConsent} />
			</div>
		{/if}

		{#if currentSupportLevel === 'acute'}
			<div class="support-panel support-panel-acute mb-3 rounded-[var(--radius-card)] border border-rose-300/70 bg-rose-50 dark:bg-rose-900/20 px-3 py-3 text-sm">
				<p class="font-medium text-rose-900 dark:text-rose-100">
					Om du är i akut fara eller riskerar att skada dig själv eller någon annan, ring 112 direkt.
				</p>
				<div class="mt-2 flex flex-wrap gap-2">
					<a href="tel:112" class="support-chip support-chip-urgent">Ring 112</a>
					<a href="tel:90101" class="support-chip support-chip-mind">Mind 90101</a>
					<a href="tel:1177" class="support-chip">Ring 1177</a>
					<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="support-chip">Se stödlinjer</a>
				</div>
				<p class="mt-2 text-xs opacity-70">
					MittPsyke är inte en akuttjänst. Vid akut kris, kontakta alltid professionell hjälp.
				</p>
			</div>
		{:else if currentSupportLevel === 'elevated'}
			<div class="support-panel support-panel-elevated mb-3 rounded-[var(--radius-card)] border border-amber-300/70 bg-amber-50 dark:bg-amber-900/20 px-3 py-3 text-sm">
				<p class="text-amber-900 dark:text-amber-100">
					Du behöver inte bära allt ensam. Här finns stödlinjer om du vill prata med någon.
				</p>
				<div class="mt-2 flex flex-wrap gap-2">
					<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="support-chip">Se stödlinjer</a>
					<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="support-chip">Prata med någon</a>
				</div>
			</div>
		{:else}
			<div class="support-panel support-panel-standard mb-3 rounded-[var(--radius-card)] border border-black/10 dark:border-white/12 bg-black/[0.02] dark:bg-white/[0.03] px-3 py-3 text-sm">
				<p class="opacity-85">
					Behöver du mänsklig kontakt? Här finns stödlinjer med chatt och telefon.
				</p>
				<div class="mt-2">
					<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="support-chip">Se stödlinjer</a>
				</div>
			</div>
		{/if}

		{#if showStarterSuggestions}
			<div class="mb-4">
				<p class="text-xs opacity-55 mb-2">Eller börja med ett förslag:</p>
				<div class="starter-chips">
					{#each starterSuggestions as suggestion}
						<button type="button" class="starter-chip" onclick={() => useStarterSuggestion(suggestion)}>
							{suggestion}
						</button>
					{/each}
					{#if showMoreSuggestions}
						{#each extraSuggestions as suggestion}
							<button type="button" class="starter-chip" onclick={() => useStarterSuggestion(suggestion)}>
								{suggestion}
							</button>
						{/each}
					{:else}
						<button
							type="button"
							class="starter-chip starter-chip-more"
							onclick={() => {
								showMoreSuggestions = true;
							}}
						>
							Visa fler...
						</button>
					{/if}
				</div>
			</div>
		{/if}

		{#if hasSensitiveDataConsent}
			{#if chatError}
				<div class="mb-3 rounded-[var(--radius-card)] border border-rose-300/70 bg-rose-50 dark:bg-rose-900/20 px-3 py-3 text-sm">
					<p id="chat-error-text" class="text-rose-900 dark:text-rose-100">{chatError}</p>
				</div>
			{/if}

			<div class="flex gap-2">
				<label class="sr-only" for="chat-message">Skriv ditt meddelande</label>
				<textarea
					id="chat-message"
					bind:value={input}
					maxlength={MAX_MESSAGE_LENGTH}
					oninput={() => {
						if (chatError) chatError = '';
					}}
					onkeydown={handleKeydown}
					aria-label="Skriv ditt meddelande"
					placeholder="Skriv det som är i huvudet just nu..."
					aria-describedby={chatError ? 'chat-help-text chat-error-text' : 'chat-help-text'}
					aria-invalid={chatError.length > 0}
					rows={1}
					class="flex-1 resize-none rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
						bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2
						focus:border-[var(--primary)] transition-colors"
				></textarea>
				<button
					type="button"
					onclick={send}
					disabled={sending || !input.trim()}
					class="px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white text-sm font-medium
						disabled:opacity-40 transition-opacity"
				>
					Skicka
				</button>
			</div>

			<p id="chat-help-text" class="chat-help-text mt-2 text-xs opacity-60">
				Max {MAX_MESSAGE_LENGTH} tecken ({inputLength}/{MAX_MESSAGE_LENGTH}). Skriv i din egen takt. Vid akut fara, ring 112. För vårdråd, kontakta 1177.
			</p>
		{/if}

		<div class="chat-contact-link mt-3 text-center">
			<a
				href={PUBLIC_CONTACT_MAILTO}
				class="inline-block px-4 py-2 rounded-[12px] bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-200 text-sm font-medium
					hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors border border-teal-200 dark:border-teal-800/50"
				title="Skicka e-post till support"
			>
				Kontakta oss
			</a>
		</div>
	</div>
</div>

<style>
	.chat-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.history-notice {
		margin: 0;
		font-size: 0.78rem;
		line-height: 1.4;
		color: rgba(15, 23, 42, 0.68);
	}

	.clear-history-button {
		padding: 0.42rem 0.78rem;
		border-radius: 999px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		background: rgba(15, 23, 42, 0.03);
		font-size: 0.78rem;
		line-height: 1;
		color: rgba(15, 23, 42, 0.76);
		transition: opacity 0.18s ease, background 0.18s ease;
	}

	.clear-history-button:hover:not(:disabled) {
		background: rgba(15, 23, 42, 0.06);
	}

	.clear-history-button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.support-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.4rem 0.7rem;
		border-radius: 999px;
		border: 1px solid rgba(15, 23, 42, 0.18);
		background: rgba(255, 255, 255, 0.85);
		font-size: 0.78rem;
		font-weight: 600;
		color: #1e293b;
		text-decoration: none;
	}

	.support-chip-urgent {
		background: #b91c1c;
		border-color: #b91c1c;
		color: #fff;
	}

	.support-chip-mind {
		background: #7c3aed;
		border-color: #7c3aed;
		color: #fff;
	}

	.starter-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.starter-chip {
		padding: 0.45rem 0.8rem;
		border-radius: 999px;
		border: 1px solid rgba(15, 23, 42, 0.1);
		background: rgba(15, 23, 42, 0.02);
		font-size: 0.8rem;
		line-height: 1.3;
		text-align: left;
		color: rgba(15, 23, 42, 0.75);
		transition: background 0.15s, opacity 0.15s;
	}

	.starter-chip:hover {
		background: rgba(15, 23, 42, 0.06);
		color: rgba(15, 23, 42, 0.9);
	}

	.starter-chip-more {
		border-style: dashed;
		opacity: 0.55;
		font-size: 0.75rem;
	}

	.starter-chip-more:hover {
		opacity: 0.8;
	}

	:global(.dark) .history-notice {
		color: rgba(229, 231, 235, 0.72);
	}

	:global(.dark) .clear-history-button {
		border-color: rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.05);
		color: rgba(229, 231, 235, 0.84);
	}

	:global(.dark) .clear-history-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .support-chip {
		border-color: rgba(255, 255, 255, 0.18);
		background: rgba(255, 255, 255, 0.08);
		color: #e5e7eb;
	}

	:global(.dark) .support-chip-urgent {
		background: #dc2626;
		border-color: #dc2626;
		color: #fff;
	}

	:global(.dark) .support-chip-mind {
		background: #8b5cf6;
		border-color: #8b5cf6;
		color: #fff;
	}

	:global(.dark) .starter-chip {
		border-color: rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .starter-chip-more {
		opacity: 0.45;
	}

	:global(.crisis-message) {
		white-space: pre-line;
	}

	@media (max-width: 768px) {
		.chat-container {
			height: calc(100dvh - 3.4rem);
			min-height: calc(100dvh - 3.4rem);
			max-height: calc(100dvh - 3.4rem);
		}

		.chat-support-link,
		.support-panel-standard,
		.chat-help-text,
		.chat-contact-link {
			display: none;
		}

		.chat-toolbar {
			padding: 0.35rem 0.75rem 0.45rem;
			gap: 0.45rem;
		}

		.clear-history-button {
			padding: 0.36rem 0.7rem;
			font-size: 0.74rem;
		}

		.chat-messages {
			padding: 0.75rem;
		}

		.chat-input-area {
			padding: 0.65rem 0.75rem calc(0.65rem + env(safe-area-inset-bottom));
		}

		.support-panel {
			margin-bottom: 0.55rem;
			padding: 0.7rem;
			font-size: 0.86rem;
		}

		.starter-chips {
			flex-wrap: nowrap;
			overflow-x: auto;
			padding-bottom: 0.1rem;
		}

		.starter-chip {
			flex: 0 0 auto;
			max-width: 72vw;
			padding: 0.42rem 0.7rem;
			font-size: 0.78rem;
			white-space: nowrap;
		}
	}
</style>
