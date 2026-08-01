<script lang="ts">
	import { browser, dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Square, Volume2 } from 'lucide-svelte';
	import { containsCrisisSignal, containsThirdPartyRiskSignal } from '$lib/ai/safety';
	import { getTopicHint } from '$lib/ai/chat-topics';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import VoiceInput from '$lib/components/VoiceInput.svelte';
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
	let firstMessageSource = $state<'manual' | 'chip' | 'voice'>('manual');
	let hasSensitiveDataConsent = $state(false);
	let conversationId = $state<string | null>(null);
	let historyNoticeVisible = $state(false);
	let persistenceReady = $state(false);
	let persistenceUserId = $state<string | null>(null);
	let pendingHeroSend = $state(false);
	// Valfri ämnesgenväg från chattingången. Skickas med som extra kontext till
	// /api/chat, men styr aldrig samtalet - modellen följer användarens ord.
	let topicHint = $state<string | null>(null);
	let clearingHistory = $state(false);
	let voiceBusy = $state(false);
	let sendInFlight = false;
	let speechSupported = $state(true);
	let autoReadReplies = $state(false);
	let sendWithEnter = $state(true);
	let desktopKeyboard = $state(false);
	let speakingMessageIndex = $state<number | null>(null);
	let swedishVoice: SpeechSynthesisVoice | null = null;
	let activeUtterance: SpeechSynthesisUtterance | null = null;
	let chatLog: HTMLDivElement;
	let showHumanSupport = $state(false);
	let showSettings = $state(false);
	let takeawayOpen = $state(false);
	let takeawayDismissed = $state(false);
	let takeawayDraft = $state('');
	let takeawayError = $state('');
	let hasUserMessage = $derived(messages.some((message) => message.role === 'user'));
	let showChatIntro = $derived(persistenceReady && !hasUserMessage);
	let assistantMessageCount = $derived(messages.filter((message) => message.role === 'assistant').length);
	let canCaptureTakeaway = $derived(
		hasSensitiveDataConsent &&
		!sending &&
		!takeawayDismissed &&
		assistantMessageCount >= 2 &&
		messages[messages.length - 1]?.role === 'assistant' &&
		!messages[messages.length - 1]?.crisis
	);

	const MAX_MESSAGE_LENGTH = 2000;
	const LONG_MESSAGE_ERROR =
		'Din text blev lite för lång att skicka på en gång. Dela gärna upp den i två delar.';
	const GENERIC_CHAT_ERROR = 'Något gick fel. Försök igen om en stund.';
	const HISTORY_NOTICE = 'Tidigare samtal är laddat.';
	const guestIdStorageKey = 'mittpsyke:guest-id';
	const autoReadStorageKey = 'mittpsyke:chat-auto-read-replies';
	const sendWithEnterStorageKey = 'mittpsyke:chat-send-with-enter';
	const starterSuggestions = ['En sak i taget', 'Lugna tankarna', 'Skriv av dig'];

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

	let chatTopic = $derived(getChatTopic(category));
	let inputLength = $derived(input.length);
	let showStarterSuggestions = $derived(
		hasSensitiveDataConsent && messages.length === 0 && input.trim().length === 0
	);
	let showFollowUpSuggestions = $derived(
		hasSensitiveDataConsent &&
		!sending &&
		input.trim().length === 0 &&
		messages[messages.length - 1]?.role === 'assistant'
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
		if (containsCrisisSignal(text)) {
			return 'acute';
		}
		if (containsThirdPartyRiskSignal(text)) {
			return 'acute-third-party';
		}
		if (elevatedSupportKeywords.some((keyword) => text.includes(keyword))) {
			return 'elevated';
		}
		return 'standard';
	}

	let currentSupportLevel = $derived(supportLevel());
	let followUpSuggestions = $derived(
		currentSupportLevel === 'acute' ||
		currentSupportLevel === 'acute-third-party' ||
		currentSupportLevel === 'elevated'
			? ['Jag vill stanna kvar i det här en stund', 'Hjälp mig hitta ett tryggt nästa steg']
			: category === 'a'
				? ['Kan vi ta en sak i taget?', 'Hjälp mig lugna tankarna lite']
				: category === 'b'
					? ['Hjälp mig sätta ord på det här', 'Kan vi börja med något väldigt litet?']
					: category === 'e'
						? ['Kan vi ta det långsamt?', 'Hjälp mig hitta något som känns tryggt nu']
						: ['Jag vill stanna kvar i det här en stund', 'Vad kan vara ett litet nästa steg?']
	);
	const tempEntryStorageKey = 'mittpsyke_temp_entry';
	const heroQuickStartStorageKey = 'mittpsyke_hero_quick_start';
	const topicHintStorageKey = 'mittpsyke_chat_topic_hint';

	function scrollToBottom() {
		if (chatLog) {
			chatLog.scrollTop = chatLog.scrollHeight;
		}
	}

	function isFollowingLatestMessage() {
		if (!chatLog) return true;
		return chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight <= 96;
	}

	function readStorageValue(key: string) {
		if (!browser) return null;
		try {
			return window.localStorage.getItem(key);
		} catch {
			return null;
		}
	}

	function writeStorageValue(key: string, value: string) {
		if (!browser) return;
		try {
			window.localStorage.setItem(key, value);
		} catch {
			// Lokal lagring är bäst möjliga fallback och får inte blockera chatten.
		}
	}

	function removeStorageValue(key: string) {
		if (!browser) return;
		try {
			window.localStorage.removeItem(key);
		} catch {
			// Chatten fortsätter utan lokal lagring.
		}
	}

	function loadSpeechVoices() {
		if (!browser || !speechSupported) return;

		const voices = window.speechSynthesis.getVoices();
		swedishVoice =
			voices.find((voice) => voice.lang.toLowerCase() === 'sv-se') ??
			voices.find((voice) => voice.lang.toLowerCase().startsWith('sv')) ??
			null;
	}

	function stopSpeaking() {
		if (!browser || typeof window.speechSynthesis === 'undefined') return;

		if (activeUtterance) {
			activeUtterance.onend = null;
			activeUtterance.onerror = null;
		}
		activeUtterance = null;
		speakingMessageIndex = null;
		window.speechSynthesis.cancel();
	}

	function speakReply(content: string, messageIndex: number) {
		const normalized = content.trim();
		if (!browser || !speechSupported || !normalized) return;

		stopSpeaking();
		loadSpeechVoices();

		const utterance = new SpeechSynthesisUtterance(normalized);
		utterance.lang = swedishVoice?.lang ?? 'sv-SE';
		utterance.voice = swedishVoice;
		utterance.rate = 0.92;
		utterance.pitch = 1;
		utterance.volume = 1;
		utterance.onend = () => {
			if (activeUtterance !== utterance) return;
			activeUtterance = null;
			speakingMessageIndex = null;
		};
		utterance.onerror = () => {
			if (activeUtterance !== utterance) return;
			activeUtterance = null;
			speakingMessageIndex = null;
		};

		activeUtterance = utterance;
		speakingMessageIndex = messageIndex;
		window.speechSynthesis.speak(utterance);
	}

	function toggleReplySpeech(content: string, messageIndex: number) {
		if (speakingMessageIndex === messageIndex) {
			stopSpeaking();
			return;
		}

		speakReply(content, messageIndex);
	}

	function setAutoReadReplies(enabled: boolean) {
		if (!browser || !speechSupported) return;

		autoReadReplies = enabled;
		writeStorageValue(autoReadStorageKey, String(enabled));

		if (!enabled) stopSpeaking();
	}

	function setSendWithEnter(enabled: boolean) {
		sendWithEnter = enabled;
		writeStorageValue(sendWithEnterStorageKey, String(enabled));
	}

	function getOrCreateGuestId() {
		if (!browser) return null;

		const existingGuestId = readStorageValue(guestIdStorageKey)?.trim();
		if (existingGuestId) return existingGuestId;

		const guestId = crypto.randomUUID();
		writeStorageValue(guestIdStorageKey, guestId);
		return guestId;
	}

	function readLocalHistory(userId: string | null = null) {
		if (!browser) return [];

		const primaryKey = getChatHistoryStorageKey(chatTopic, userId);
		const fallbackKey = userId ? getChatHistoryStorageKey(chatTopic) : null;

		for (const key of [primaryKey, fallbackKey]) {
			if (!key) continue;

			try {
				const raw = readStorageValue(key);
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
			removeStorageValue(storageKey);
			return;
		}

		writeStorageValue(storageKey, JSON.stringify(nextMessages));
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
		stopSpeaking();
		clearingHistory = true;
		chatError = '';
		input = '';
		messages = [];
		savePromptHidden = {};
		takeawayOpen = false;
		takeawayDismissed = false;
		takeawayDraft = '';
		takeawayError = '';
		historyNoticeVisible = false;
		conversationId = null;

		writeLocalHistory([], null);
		if (persistenceUserId) {
			writeLocalHistory([], persistenceUserId);
			await deletePersistedChatHistory(persistenceUserId, 'clear-history');
		}

		await goto(page.url.pathname, {
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
			stopSpeaking();
			persistenceReady = false;
			chatError = '';
			savePromptHidden = {};
			takeawayOpen = false;
			takeawayDismissed = false;
			takeawayDraft = '';
			takeawayError = '';
			historyNoticeVisible = false;

			// Text skriven i hero-fältet på startsidan tar alltid med sig hela vägen in i chatten.
			const heroEntry = readStorageValue(heroQuickStartStorageKey)?.trim() ?? '';
			if (heroEntry.length > 0) {
				removeStorageValue(heroQuickStartStorageKey);
			}

			// Ämnesgenväg vald i chattingången. Läses en gång och gäller sessionen.
			const storedTopicHint = readStorageValue(topicHintStorageKey)?.trim() ?? '';
			if (storedTopicHint.length > 0) {
				removeStorageValue(topicHintStorageKey);
				topicHint = getTopicHint(storedTopicHint)?.id ?? null;
			}

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
					const tempEntry = readStorageValue(tempEntryStorageKey)?.trim() ?? '';
					if (tempEntry.length > 0) {
						input = tempEntry;
						removeStorageValue(tempEntryStorageKey);
					}
				}
			}

			if (heroEntry.length > 0) {
				input = heroEntry;
				pendingHeroSend = true;
			}

			writeStorageValue('mittpsyke:last-chat-category', category);
			persistenceReady = true;
			await tick();
			scrollToBottom();
		}

		void bootstrapHistory();

		return () => {
			cancelled = true;
		};
	});

	// Skickar hero-utkastet automatiskt så snart samtycket är klart — aldrig innan.
	$effect(() => {
		if (!pendingHeroSend) return;
		if (!persistenceReady || !hasSensitiveDataConsent) return;
		if (sendInFlight || !input.trim()) return;

		pendingHeroSend = false;
		firstMessageSource = 'manual';
		void send();
	});

	onMount(() => {
		sendWithEnter = readStorageValue(sendWithEnterStorageKey) !== 'false';
		const desktopPointerQuery = window.matchMedia('(pointer: fine)');
		const updateDesktopKeyboard = () => {
			desktopKeyboard = desktopPointerQuery.matches;
		};
		updateDesktopKeyboard();
		desktopPointerQuery.addEventListener('change', updateDesktopKeyboard);
		speechSupported =
			typeof window.speechSynthesis !== 'undefined' &&
			typeof window.SpeechSynthesisUtterance !== 'undefined';

		if (speechSupported) {
			autoReadReplies = readStorageValue(autoReadStorageKey) === 'true';

			loadSpeechVoices();
			window.speechSynthesis.addEventListener('voiceschanged', loadSpeechVoices);
		} else {
			autoReadReplies = false;
		}

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
			stopSpeaking();
			desktopPointerQuery.removeEventListener('change', updateDesktopKeyboard);
			if (speechSupported) {
				window.speechSynthesis.removeEventListener('voiceschanged', loadSpeechVoices);
			}
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
		if (!hasSensitiveDataConsent || !text || sendInFlight) return;

		chatError = '';
		if (text.length > MAX_MESSAGE_LENGTH) {
			chatError = LONG_MESSAGE_ERROR;
			return;
		}

		takeawayOpen = false;
		takeawayDraft = '';
		takeawayError = '';
		sendInFlight = true;
		sending = true;
		stopSpeaking();
		let userMessageAdded = false;

		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();
			const guestId = session ? null : getOrCreateGuestId();
			const contextMessages = sanitizeChatMessages(messages, CHAT_CONTEXT_LIMIT);

			messages.push({ role: 'user', content: text });
			userMessageAdded = true;
			input = '';
			await tick();
			scrollToBottom();

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
					...(topicHint ? { topicHint } : {}),
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

			writeStorageValue('mittpsyke:last-chat-category', category);

			trackChatMessageSent();
			if (!hasTrackedFirstMessage) {
				trackChatStarted();
				void trackEvent('first_message_sent', {
					source: firstMessageSource,
					textLength: text.length
				});
				hasTrackedFirstMessage = true;
			}

			const assistantReply =
				data?.reply && data.reply.trim() ? data.reply : GENERIC_CHAT_ERROR;
			const assistantMessageIndex = messages.length;
			const shouldFollowReply = isFollowingLatestMessage();

			messages.push({
				role: 'assistant',
				content: assistantReply,
				crisis: data?.crisis ?? false
			});

			await tick();
			if (shouldFollowReply) scrollToBottom();
			if (autoReadReplies) {
				// Autouppläsning sker bara här efter ett nytt, lyckat API-svar – aldrig vid historikladdning.
				speakReply(assistantReply, assistantMessageIndex);
			}
		} catch (error) {
			const lastMessage = messages[messages.length - 1];
			if (userMessageAdded && lastMessage?.role === 'user' && lastMessage.content === text) {
				messages = messages.slice(0, -1);
			}

			chatError =
				error instanceof Error && error.message.trim().length > 0
					? error.message
					: GENERIC_CHAT_ERROR;
			if (!input.trim()) input = text;

		} finally {
			sendInFlight = false;
			sending = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.isComposing) return;
		if (desktopKeyboard && sendWithEnter && event.key === 'Enter' && !event.shiftKey) {
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

	function useVoiceTranscript(transcript: string) {
		const normalized = transcript.trim();
		if (!normalized) return;

		chatError = '';
		firstMessageSource = 'voice';
		input = input.trim() ? `${input.trim()} ${normalized}` : normalized;
	}

	function clearDraft() {
		input = '';
		chatError = '';
		firstMessageSource = 'manual';
	}

	function useFollowUpSuggestion(text: string) {
		chatError = '';
		input = text;
		void trackEvent('starter_chip_clicked', { source: 'follow_up' });
	}

	function openTakeaway() {
		takeawayOpen = true;
		takeawayError = '';
	}

	function dismissTakeaway() {
		takeawayOpen = false;
		takeawayDismissed = true;
		takeawayDraft = '';
		takeawayError = '';
	}

	function continueTakeawayInDiary() {
		const reflection = takeawayDraft.trim();
		if (!reflection) {
			takeawayError = 'Skriv en rad du vill ta med dig, eller välj Inte nu.';
			return;
		}

		const content = `Jag tar med mig från chatten:\n\n${reflection}`;
		try {
			window.localStorage.setItem(
				tempEntryStorageKey,
				JSON.stringify({ title: 'En tanke från chatten', content })
			);
		} catch {
			takeawayError = 'Det gick inte att föra över texten just nu. Du kan kopiera den och försöka igen.';
			return;
		}

		void goto('/dagbok/checkin#skriv-sjalv');
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

{#if showChatIntro}
	<section class="chat-intro-panel" aria-labelledby="chat-intro-title">
		<h2 id="chat-intro-title">Så går det till här</h2>
		<p>
			Du skriver några rader. MittPsyke svarar lugnt och hjälper dig att sortera det som känns
			mest nära just nu.
		</p>
		<ul>
			<li>Du behöver inte formulera allt perfekt.</li>
			<li>Du kan ta en sak i taget och pausa när du vill.</li>
			<li>Vid akut fara ska du ringa 112 i stället för att använda chatten.</li>
		</ul>
	</section>
{/if}

<div class="chat-container flex flex-col h-[calc(100vh-175px)] max-w-2xl mx-auto">
	<div class="chat-toolbar px-4 pb-1">
		{#if historyNoticeVisible && messages.length > 0}
			<span class="history-notice">{HISTORY_NOTICE}</span>
		{/if}

		{#if messages.length > 0 || clearingHistory}
			<button
				type="button"
				class="clear-history-button"
				onclick={clearHistory}
				disabled={sending || clearingHistory || messages.length === 0}
				aria-label="Rensa den laddade chatthistoriken"
			>
				Rensa historik
			</button>
		{/if}
	</div>

	<div
		bind:this={chatLog}
		class="chat-messages flex-1 overflow-y-auto px-4 pt-2 pb-3 space-y-2"
		aria-live="polite"
		aria-busy={sending}
	>
		{#if messages.length === 0}
			<div class="text-center mt-2">
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
						class="message-bubble max-w-[80%] px-4 py-3 rounded-[var(--radius-card)] text-sm leading-relaxed
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

				{#if msg.role === 'assistant'}
					<div class="speech-message-actions px-1 text-left">
						<button
							type="button"
							class="speech-button"
							class:speaking={speakingMessageIndex === i}
							onclick={() => toggleReplySpeech(msg.content, i)}
							disabled={!speechSupported}
							aria-pressed={speakingMessageIndex === i}
							aria-label={speakingMessageIndex === i
								? 'Stoppa uppläsning av AI-svaret'
								: 'Läs upp AI-svaret'}
							title={!speechSupported ? 'Uppläsning stöds inte i den här webbläsaren.' : undefined}
						>
							{#if speakingMessageIndex === i}
								<Square size={13} aria-hidden="true" />
								<span>Stoppa uppläsning</span>
							{:else}
								<Volume2 size={14} aria-hidden="true" />
								<span>Lyssna</span>
							{/if}
						</button>
					</div>
				{/if}
			</div>
		{/each}

		{#if sending}
			<div class="flex justify-start" role="status" aria-live="polite" aria-label="Väntar på AI-svar">
				<div class="bg-black/5 dark:bg-white/10 px-4 py-3 rounded-[var(--radius-card)] rounded-bl-md text-sm opacity-60">
					Mitt stöd tar en stund och formulerar ett svar…
				</div>
			</div>
		{/if}
	</div>

	{#if showAccountNudge}
		<div class="account-nudge border-t border-black/5 px-4 py-2 text-xs dark:border-white/5">
			<p class="account-nudge-copy">Vill du kunna återvända hit? Skapa konto för att spara dina reflektioner.</p>
			<div class="account-nudge-actions" aria-label="Kontolänkar">
				<a
					href="/register"
					class="account-nudge-link account-nudge-link-primary"
					onclick={() => {
						void trackEvent('click_chat_nudge');
					}}
				>
					Skapa konto
				</a>
				<a href="/" class="account-nudge-link account-nudge-link-secondary">Till startsidan</a>
				<button
					type="button"
					class="account-nudge-close"
					onclick={() => {
						showAccountNudge = false;
						nudgeDismissed = true;
					}}
					aria-label="Stäng förslaget om att skapa konto"
				>
					Stäng
				</button>
			</div>
		</div>
	{/if}

	{#if canCaptureTakeaway}
		<section class="takeaway-card" aria-labelledby="takeaway-title">
			{#if takeawayOpen}
				<label for="chat-takeaway" class="takeaway-label" id="takeaway-title">
					En tanke att ta med
				</label>
				<textarea
					id="chat-takeaway"
					bind:value={takeawayDraft}
					maxlength="500"
					rows="2"
					placeholder="Till exempel: Jag behöver inte lösa allt på en gång."
					aria-describedby="takeaway-help{takeawayError ? ' takeaway-error' : ''}"
					oninput={() => (takeawayError = '')}
				></textarea>
				<p id="takeaway-help" class="takeaway-help">Din formulering skickas inte till AI:n.</p>
				{#if takeawayError}
					<p id="takeaway-error" class="takeaway-error" role="alert">{takeawayError}</p>
				{/if}
				<div class="takeaway-actions">
					<button type="button" class="takeaway-primary" onclick={continueTakeawayInDiary}>
						Fortsätt i dagboken
					</button>
					<button type="button" class="takeaway-secondary" onclick={dismissTakeaway}>Inte nu</button>
				</div>
			{:else}
				<p id="takeaway-title" class="takeaway-copy">Vill du skriva en rad att ta med dig?</p>
				<div class="takeaway-actions">
					<button type="button" class="takeaway-primary" onclick={openTakeaway}>Fånga en tanke</button>
					<button type="button" class="takeaway-secondary" onclick={dismissTakeaway}>Inte nu</button>
				</div>
			{/if}
		</section>
	{/if}

	<div class="chat-input-area border-t border-black/8 dark:border-white/10 px-3 pt-2 pb-3">
		<div class="chat-input-extras">
		{#if !hasSensitiveDataConsent}
			<div class="mb-3">
				<ConsentGate onAccept={acceptSensitiveConsent} />
			</div>
		{/if}

		<!-- Stödpaneler: akut och förhöjd visas alltid; standardnivå är diskret tills användaren klickar -->
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
		{:else if currentSupportLevel === 'acute-third-party'}
			<div class="support-panel support-panel-acute mb-3 rounded-[var(--radius-card)] border border-rose-300/70 bg-rose-50 dark:bg-rose-900/20 px-3 py-3 text-sm">
				<p class="font-medium text-rose-900 dark:text-rose-100">
					Om du eller någon annan är i fara just nu, ring 112 direkt.
				</p>
				<div class="mt-2 flex flex-wrap gap-2">
					<a href="tel:112" class="support-chip support-chip-urgent">Ring 112</a>
					<a href="tel:1177" class="support-chip">Ring 1177</a>
				</div>
				<p class="mt-2 text-xs opacity-70">
					MittPsyke är inte en akuttjänst. Vid risk för någons säkerhet, kontakta alltid 112 eller vården.
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
		{:else if showHumanSupport}
			<div class="support-panel support-panel-standard mb-2 rounded-[var(--radius-card)] border border-black/10 dark:border-white/12 bg-black/[0.02] dark:bg-white/[0.03] px-3 py-3 text-sm">
				<p class="opacity-85">
					Behöver du mänsklig kontakt? Här finns stödlinjer med chatt och telefon.
				</p>
				<div class="mt-2 flex gap-3 items-center flex-wrap">
					<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="support-chip">Se stödlinjer</a>
					<button
						type="button"
						class="text-xs opacity-45 hover:opacity-75 transition-opacity"
						onclick={() => (showHumanSupport = false)}
					>
						Stäng
					</button>
				</div>
			</div>
		{:else}
			<p class="human-support-link">
				<button
					type="button"
					class="human-support-button"
					onclick={() => (showHumanSupport = true)}
				>
					Behöver du mänskligt stöd?
				</button>
			</p>
		{/if}

		<!-- Snabbförslag: starter-chips eller uppföljningschips, inga rubriker -->
		{#if showStarterSuggestions}
			<div class="chips-row mb-1">
				{#each starterSuggestions as suggestion}
					<button
						type="button"
						class="starter-chip"
						onclick={() => useStarterSuggestion(suggestion)}
						aria-label={`Använd förslaget: ${suggestion}`}
					>
						{suggestion}
					</button>
				{/each}
			</div>
		{:else if showFollowUpSuggestions}
			<div class="chips-row mb-1">
				{#each followUpSuggestions as suggestion}
					<button
						type="button"
						class="starter-chip"
						onclick={() => useFollowUpSuggestion(suggestion)}
						aria-label={`Använd uppföljningen: ${suggestion}`}
					>
						{suggestion}
					</button>
				{/each}
			</div>
		{/if}

		{#if hasSensitiveDataConsent}
			{#if chatError}
				<div class="mb-2 rounded-[var(--radius-card)] border border-rose-300/70 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 text-sm">
					<p id="chat-error-text" class="text-rose-900 dark:text-rose-100">{chatError}</p>
				</div>
			{/if}

			<VoiceInput
				disabled={sending}
				hasDraft={input.trim().length > 0}
				onTranscript={useVoiceTranscript}
				onClear={clearDraft}
				onBusyChange={(busy) => (voiceBusy = busy)}
				showPrivacyNote={false}
			/>
		{/if}
		</div>

		{#if hasSensitiveDataConsent}
			<div class="composer-row flex gap-2">
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
					placeholder={sending ? 'Väntar lugnt på svar…' : 'Skriv det som är i huvudet just nu...'}
					aria-describedby={chatError ? 'chat-safety-note chat-error-text' : 'chat-safety-note'}
					aria-invalid={chatError.length > 0}
					aria-busy={sending}
					disabled={sending}
					rows={1}
					class="flex-1 resize-none rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
						bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2
						focus:border-[var(--primary)] transition-colors"
				></textarea>
				<button
					type="button"
					onclick={send}
					disabled={sending || voiceBusy || !input.trim()}
					class="send-button px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white text-sm font-medium
						disabled:opacity-40 transition-opacity"
					aria-label={sending ? 'Väntar på AI-svar' : 'Skicka meddelandet'}
				>
					{sending ? 'Väntar…' : 'Skicka'}
				</button>
			</div>

			<!-- Tillgänglighet: akut säkerhetsinformation för skärmläsare -->
			<span id="chat-safety-note" class="sr-only">Vid akut fara, ring 112. För vårdråd, kontakta 1177.</span>

			<!-- Inställningar & hjälp: kollapsbar sektion längst ned -->
			<div class="settings-footer">
				<span class="char-count" aria-live="off">{inputLength}/{MAX_MESSAGE_LENGTH}</span>
				<button
					type="button"
					class="settings-toggle"
					onclick={() => (showSettings = !showSettings)}
					aria-expanded={showSettings}
				>
					{showSettings ? 'Stäng' : 'Inställningar & hjälp'}
				</button>
			</div>

			{#if showSettings}
				<div class="settings-panel">
					<div class="chat-setting">
						<label>
							<input
								type="checkbox"
								checked={sendWithEnter}
								onchange={(event) =>
									setSendWithEnter((event.currentTarget as HTMLInputElement).checked)}
							/>
							<span>Skicka med Enter</span>
						</label>
						<p>
							På dator skickar Enter när den är på. Shift + Enter ger alltid en ny rad. På mobil
							använder du Skicka-knappen.
						</p>
					</div>
					<div class="speech-setting" class:unsupported={!speechSupported}>
						<label>
							<input
								type="checkbox"
								checked={autoReadReplies}
								disabled={!speechSupported}
								onchange={(event) =>
									setAutoReadReplies((event.currentTarget as HTMLInputElement).checked)}
							/>
							<span>Läs upp AI-svar automatiskt</span>
						</label>
						{#if !speechSupported}
							<p role="status">Uppläsning stöds inte i den här webbläsaren. AI-svaret visas alltid i text.</p>
						{:else if autoReadReplies}
							<p>Nya AI-svar läses upp tills du stänger av. Svaret visas alltid i text.</p>
						{:else}
							<p>Av som standard. Du kan också välja Lyssna vid ett enskilt svar.</p>
						{/if}
					</div>
					<p class="privacy-note-inline">Du väljer själv vad du skickar. Texten sparas bara när du skickar.</p>
					<div class="settings-links">
						<a
							href="https://stodlinjer.se"
							target="_blank"
							rel="noopener noreferrer"
							class="settings-link"
						>
							Se stödlinjer
						</a>
						<a
							href={PUBLIC_CONTACT_MAILTO}
							class="settings-link"
							title="Skicka e-post till support"
						>
							Kontakta oss
						</a>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.chat-intro-panel {
		flex: 0 0 auto;
		width: 100%;
		max-width: 42rem;
		margin: 0 auto 0.85rem;
		padding: 0.95rem 1rem;
		border: 1px solid rgba(52, 91, 55, 0.1);
		border-radius: var(--radius-card);
		background: rgba(248, 245, 239, 0.9);
		color: inherit;
	}

	.chat-intro-panel h2 {
		margin: 0 0 0.4rem;
		font-size: 0.98rem;
		font-weight: 700;
	}

	.chat-intro-panel p {
		margin: 0;
		font-size: 0.94rem;
		line-height: 1.6;
	}

	.chat-intro-panel ul {
		display: grid;
		gap: 0.35rem;
		margin: 0.65rem 0 0;
		padding-left: 1.1rem;
		font-size: 0.9rem;
		line-height: 1.55;
	}

	:global(.dark) .chat-intro-panel {
		border-color: rgba(255, 255, 255, 0.08);
		background: rgba(23, 29, 36, 0.84);
	}

	.chat-container {
		flex: 1 1 auto;
		height: auto;
		width: 100%;
		max-width: min(42rem, 100%);
		min-height: 0;
		max-height: none;
		min-width: 0;
		overflow: hidden;
	}

	.chat-toolbar {
		display: flex;
		flex: 0 0 auto;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.4rem;
		padding-top: 0.18rem;
	}

	.history-notice {
		font-size: 0.7rem;
		line-height: 1.3;
		color: rgba(15, 23, 42, 0.52);
	}

	.clear-history-button {
		padding: 0.38rem 0.72rem;
		border-radius: 999px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		background: rgba(15, 23, 42, 0.03);
		font-size: 0.76rem;
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

	.clear-history-button:focus-visible,
	.starter-chip:focus-visible,
	.account-nudge-link:focus-visible,
	.account-nudge-close:focus-visible,
	.takeaway-primary:focus-visible,
	.takeaway-secondary:focus-visible,
	.takeaway-card textarea:focus-visible,
	.send-button:focus-visible,
	.settings-toggle:focus-visible,
	.human-support-button:focus-visible,
	.speech-setting input:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.account-nudge {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.65rem;
		color: rgba(15, 23, 42, 0.66);
	}

	.account-nudge-copy {
		margin: 0;
		line-height: 1.45;
	}

	.account-nudge-actions {
		display: flex;
		flex: 0 0 auto;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-end;
		gap: 0.45rem;
	}

	.account-nudge-link,
	.account-nudge-close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 1.9rem;
		padding: 0.34rem 0.58rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 650;
		line-height: 1;
		text-decoration: none;
		transition: background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
	}

	.account-nudge-link-primary {
		border: 1px solid rgba(15, 118, 110, 0.18);
		background: rgba(15, 118, 110, 0.08);
		color: rgba(15, 92, 86, 0.96);
	}

	.account-nudge-link-secondary,
	.account-nudge-close {
		border: 1px solid rgba(15, 23, 42, 0.1);
		background: transparent;
		color: rgba(15, 23, 42, 0.58);
	}

	.account-nudge-link:hover,
	.account-nudge-close:hover {
		opacity: 1;
	}

	.account-nudge-close {
		cursor: pointer;
	}

	:global(.dark) .account-nudge {
		color: rgba(248, 250, 252, 0.68);
	}

	:global(.dark) .account-nudge-link-primary {
		border-color: rgba(94, 234, 212, 0.16);
		background: rgba(94, 234, 212, 0.08);
		color: rgba(204, 251, 241, 0.92);
	}

	:global(.dark) .account-nudge-link-secondary,
	:global(.dark) .account-nudge-close {
		border-color: rgba(248, 250, 252, 0.12);
		color: rgba(248, 250, 252, 0.58);
	}

	.takeaway-card {
		margin: 0.2rem 0;
		padding: 0.8rem 1rem;
		border: 1px solid rgba(52, 91, 55, 0.13);
		border-radius: var(--radius-card);
		background: rgba(248, 245, 239, 0.78);
	}

	.takeaway-label,
	.takeaway-copy {
		display: block;
		margin: 0;
		font-size: 0.83rem;
		font-weight: 650;
		line-height: 1.45;
		color: rgba(15, 23, 42, 0.8);
	}

	.takeaway-card textarea {
		box-sizing: border-box;
		width: 100%;
		margin-top: 0.5rem;
		padding: 0.65rem 0.75rem;
		resize: vertical;
		border: 1px solid rgba(15, 23, 42, 0.14);
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.72);
		font: inherit;
		font-size: 0.84rem;
		line-height: 1.5;
		color: inherit;
	}

	.takeaway-help,
	.takeaway-error {
		margin: 0.42rem 0 0;
		font-size: 0.72rem;
		line-height: 1.4;
	}

	.takeaway-help {
		opacity: 0.62;
	}

	.takeaway-error {
		color: #9f1239;
	}

	.takeaway-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.62rem;
	}

	.takeaway-primary,
	.takeaway-secondary {
		min-height: 2rem;
		padding: 0.42rem 0.72rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 650;
		line-height: 1;
		cursor: pointer;
	}

	.takeaway-primary {
		border: 1px solid rgba(15, 118, 110, 0.18);
		background: rgba(15, 118, 110, 0.09);
		color: rgba(15, 92, 86, 0.96);
	}

	.takeaway-secondary {
		border: 1px solid rgba(15, 23, 42, 0.12);
		background: transparent;
		color: rgba(15, 23, 42, 0.6);
	}

	:global(.dark) .takeaway-card {
		border-color: rgba(147, 197, 253, 0.16);
		background: rgba(147, 197, 253, 0.06);
	}

	:global(.dark) .takeaway-label,
	:global(.dark) .takeaway-copy {
		color: rgba(248, 250, 252, 0.86);
	}

	:global(.dark) .takeaway-card textarea {
		border-color: rgba(248, 250, 252, 0.14);
		background: rgba(15, 23, 42, 0.28);
	}

	:global(.dark) .takeaway-primary {
		border-color: rgba(94, 234, 212, 0.16);
		background: rgba(94, 234, 212, 0.08);
		color: rgba(204, 251, 241, 0.92);
	}

	:global(.dark) .takeaway-secondary {
		border-color: rgba(248, 250, 252, 0.12);
		color: rgba(248, 250, 252, 0.62);
	}

	@media (max-width: 520px) {
		.account-nudge {
			display: grid;
			gap: 0.5rem;
		}

		.account-nudge-actions {
			justify-content: flex-start;
		}
	}

	.speech-message-actions {
		margin-top: 0.22rem;
	}

	.speech-button {
		display: inline-flex;
		align-items: center;
		gap: 0.32rem;
		min-height: 1.8rem;
		padding: 0.26rem 0.5rem;
		border: 1px solid rgba(15, 23, 42, 0.1);
		border-radius: 999px;
		background: transparent;
		color: rgba(15, 23, 42, 0.64);
		font-size: 0.72rem;
		font-weight: 600;
		transition: background-color 0.16s ease, color 0.16s ease, opacity 0.16s ease;
	}

	.speech-button:hover:not(:disabled),
	.speech-button.speaking {
		background: rgba(15, 118, 110, 0.07);
		color: rgba(15, 118, 110, 0.9);
	}

	.speech-button:disabled {
		cursor: not-allowed;
		opacity: 0.42;
	}

	.speech-button:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	/* Stödlinjer-chips */
	.support-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.36rem 0.65rem;
		border-radius: 999px;
		border: 1px solid rgba(15, 23, 42, 0.18);
		background: rgba(255, 255, 255, 0.85);
		font-size: 0.76rem;
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

	/* Diskret stödlänk (standardnivå) */
	.human-support-link {
		margin: 0 0 0.3rem;
	}

	.human-support-button {
		font-size: 0.74rem;
		color: rgba(15, 23, 42, 0.48);
		text-decoration: underline;
		text-underline-offset: 2px;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: color 0.15s;
	}

	.human-support-button:hover {
		color: rgba(15, 23, 42, 0.78);
	}

	/* Snabbförslagschips */
	.chips-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.starter-chip {
		padding: 0.38rem 0.72rem;
		border-radius: 999px;
		border: 1px solid rgba(15, 23, 42, 0.1);
		background: rgba(15, 23, 42, 0.02);
		font-size: 0.78rem;
		line-height: 1.3;
		text-align: left;
		color: rgba(15, 23, 42, 0.75);
		transition: background 0.15s, opacity 0.15s;
	}

	.starter-chip:hover {
		background: rgba(15, 23, 42, 0.06);
		color: rgba(15, 23, 42, 0.9);
	}

	/* Inställningar-footer */
	.settings-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.25rem;
	}

	.char-count {
		font-size: 0.68rem;
		opacity: 0.42;
		font-variant-numeric: tabular-nums;
	}

	.settings-toggle {
		font-size: 0.72rem;
		color: rgba(15, 23, 42, 0.45);
		text-decoration: underline;
		text-underline-offset: 2px;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: color 0.15s;
	}

	.settings-toggle:hover {
		color: rgba(15, 23, 42, 0.72);
	}

	/* Inställningspanel */
	.settings-panel {
		margin-top: 0.6rem;
		padding: 0.7rem 0.8rem;
		border-radius: 12px;
		border: 1px solid rgba(15, 23, 42, 0.07);
		background: rgba(15, 23, 42, 0.02);
		display: grid;
		gap: 0.55rem;
	}

	.speech-setting,
	.chat-setting {
		display: grid;
		gap: 0.14rem;
	}

	.speech-setting label,
	.chat-setting label {
		display: flex;
		align-items: center;
		gap: 0.48rem;
		font-size: 0.78rem;
		font-weight: 650;
		line-height: 1.35;
		cursor: pointer;
	}

	.speech-setting input,
	.chat-setting input {
		width: 1rem;
		height: 1rem;
		margin: 0;
		accent-color: var(--primary);
	}

	.speech-setting p,
	.chat-setting p {
		margin: 0 0 0 1.48rem;
		font-size: 0.69rem;
		line-height: 1.4;
		opacity: 0.58;
	}

	.speech-setting.unsupported label {
		cursor: not-allowed;
		opacity: 0.55;
	}

	.privacy-note-inline {
		margin: 0;
		font-size: 0.69rem;
		line-height: 1.4;
		opacity: 0.52;
	}

	.settings-links {
		display: flex;
		gap: 0.8rem;
		flex-wrap: wrap;
	}

	.settings-link {
		font-size: 0.72rem;
		color: rgba(15, 23, 42, 0.55);
		text-decoration: underline;
		text-underline-offset: 2px;
		transition: color 0.15s;
	}

	.settings-link:hover {
		color: rgba(15, 23, 42, 0.82);
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

	:global(.dark) .speech-button {
		border-color: rgba(255, 255, 255, 0.11);
		color: rgba(226, 232, 240, 0.68);
	}

	:global(.dark) .speech-button:hover:not(:disabled),
	:global(.dark) .speech-button.speaking {
		background: rgba(45, 212, 191, 0.08);
		color: rgba(153, 246, 228, 0.9);
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

	:global(.dark) .human-support-button {
		color: rgba(226, 232, 240, 0.38);
	}

	:global(.dark) .human-support-button:hover {
		color: rgba(226, 232, 240, 0.68);
	}

	:global(.dark) .starter-chip {
		border-color: rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .settings-toggle,
	:global(.dark) .settings-link {
		color: rgba(226, 232, 240, 0.42);
	}

	:global(.dark) .settings-toggle:hover,
	:global(.dark) .settings-link:hover {
		color: rgba(226, 232, 240, 0.72);
	}

	:global(.dark) .settings-panel {
		border-color: rgba(255, 255, 255, 0.07);
		background: rgba(255, 255, 255, 0.025);
	}

	:global(.dark) .speech-setting label {
		color: rgba(226, 232, 240, 0.86);
	}

	:global(.dark) .privacy-note-inline {
		color: rgba(226, 232, 240, 0.48);
	}

	:global(.dark) .char-count {
		color: rgba(226, 232, 240, 0.38);
	}

	:global(.crisis-message) {
		white-space: pre-line;
	}

	:global(.message-bubble) {
		min-width: 0;
		word-break: break-word;
		overflow-wrap: anywhere;
	}

	.chat-messages,
	.chat-input-area,
	.chat-input-extras,
	.composer-row {
		min-width: 0;
		max-width: 100%;
	}

	.chat-messages {
		flex: 1 1 auto;
		min-height: 0;
		overflow-x: hidden;
	}

	.chat-input-area {
		flex: 0 0 auto;
	}

	.composer-row textarea {
		width: 100%;
		min-width: 0;
		min-height: 2.75rem;
		max-height: 8rem;
		field-sizing: content;
		overflow-y: auto;
		overflow-wrap: anywhere;
	}

	.send-button {
		flex: 0 0 auto;
		min-height: 2.75rem;
	}

	@media (max-width: 768px) {
		.chat-intro-panel {
			width: auto;
			margin: 0 0.65rem 0.4rem;
			padding: 0.6rem 0.7rem;
		}

		.chat-intro-panel h2 {
			margin-bottom: 0.25rem;
			font-size: 0.9rem;
		}

		.chat-intro-panel p {
			font-size: 0.8rem;
			line-height: 1.4;
		}

		.chat-intro-panel ul {
			gap: 0.18rem;
			margin-top: 0.4rem;
			font-size: 0.76rem;
			line-height: 1.35;
		}

		.chat-container {
			flex: 1 1 auto;
			height: auto;
			min-height: 0;
			max-height: none;
			overflow: hidden;
		}

		.chat-toolbar {
			padding: 0.15rem 0.75rem 0.25rem;
			gap: 0.4rem;
		}

		.clear-history-button {
			padding: 0.26rem 0.55rem;
			font-size: 0.7rem;
		}

		.chat-messages {
			flex: 1 1 auto;
			min-height: 0;
			padding: 0.6rem 0.65rem 1rem;
			overflow-y: auto;
			overflow-x: hidden;
			overscroll-behavior: contain;
			-webkit-overflow-scrolling: touch;
		}

		:global(.message-bubble) {
			max-width: 90%;
			padding: 0.6rem 0.85rem;
		}

		.chat-input-area {
			display: flex;
			flex: 0 0 auto;
			flex-direction: column;
			min-height: 0;
			max-height: min(48dvh, 25rem);
			overflow: hidden;
			padding: 0.4rem 0.75rem calc(0.5rem + env(safe-area-inset-bottom));
		}

		.chat-input-extras {
			min-height: 0;
			overflow-y: auto;
			overscroll-behavior: contain;
			-webkit-overflow-scrolling: touch;
		}

		.composer-row,
		.settings-footer {
			flex: 0 0 auto;
		}

		.composer-row {
			align-items: flex-end;
			padding-top: 0.25rem;
			background: hsl(var(--background));
		}

		:global(.dark) .composer-row {
			background: var(--chat-input-bg-dark);
		}

		.support-panel {
			margin-bottom: 0.45rem;
			padding: 0.62rem;
			font-size: 0.85rem;
		}

		.chips-row {
			flex-wrap: nowrap;
			overflow-x: auto;
			padding-bottom: 0.1rem;
		}

		.starter-chip {
			flex: 0 0 auto;
			max-width: 72vw;
			padding: 0.36rem 0.65rem;
			font-size: 0.76rem;
			white-space: nowrap;
		}

		.settings-footer {
			margin-top: 0.35rem;
		}
	}

	@media (max-width: 340px) {
		.chat-intro-panel {
			margin-inline: 0.5rem;
			padding: 0.55rem 0.65rem;
		}

		.composer-row {
			gap: 0.4rem;
		}

		.composer-row textarea {
			padding-inline: 0.75rem;
		}

		.send-button {
			padding-inline: 0.85rem;
		}
	}
</style>
