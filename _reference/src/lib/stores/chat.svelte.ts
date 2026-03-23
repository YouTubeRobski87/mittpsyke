import { browser } from '$app/environment';
import { Preferences } from '@capacitor/preferences';

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
}

export type InterviewPhase = 'empty' | 'chatting' | 'tone-selection' | 'generating' | 'result';

const CHAT_DRAFT_KEY = 'storify-chat-draft';
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface ChatDraft {
	messages: ChatMessage[];
	phase: InterviewPhase;
	selectedTone: string;
	includeHoroscope: boolean;
	includeOnThisDay: boolean;
	includeHomework: boolean;
	includeDailyChallenge: boolean;
	savedAt: number;
}

let messageIdCounter = 0;

function generateMessageId(): string {
	return `msg-${Date.now()}-${++messageIdCounter}`;
}

function createChatStore() {
	let messages = $state<ChatMessage[]>([]);
	let phase = $state<InterviewPhase>('empty');
	let isStreaming = $state(false);
	let selectedTone = $state('');
	let generatedEntry = $state('');
	let includeHoroscope = $state(false);
	let includeOnThisDay = $state(false);
	let includeHomework = $state(true);
	let includeDailyChallenge = $state(false);
	let error = $state('');

	let draftSaveTimer: ReturnType<typeof setTimeout> | null = null;

	function scheduleDraftSave() {
		if (!browser) return;
		if (draftSaveTimer) clearTimeout(draftSaveTimer);
		draftSaveTimer = setTimeout(() => saveDraftNow(), 500);
	}

	async function saveDraftNow() {
		if (!browser) return;
		try {
			const draft: ChatDraft = {
				messages: messages.map((m) => ({ ...m })),
				phase,
				selectedTone,
				includeHoroscope,
				includeOnThisDay,
				includeHomework,
				includeDailyChallenge,
				savedAt: Date.now()
			};
			await Preferences.set({
				key: CHAT_DRAFT_KEY,
				value: JSON.stringify(draft)
			});
		} catch (e) {
			console.error('Failed to save chat draft:', e);
		}
	}

	return {
		get messages() {
			return messages;
		},
		get phase() {
			return phase;
		},
		get isStreaming() {
			return isStreaming;
		},
		get selectedTone() {
			return selectedTone;
		},
		get generatedEntry() {
			return generatedEntry;
		},
		get includeHoroscope() {
			return includeHoroscope;
		},
		get includeOnThisDay() {
			return includeOnThisDay;
		},
		get includeHomework() {
			return includeHomework;
		},
		get includeDailyChallenge() {
			return includeDailyChallenge;
		},
		get error() {
			return error;
		},
		get hasMessages() {
			return messages.some((m) => m.role === 'user');
		},
		get isEmpty() {
			return phase === 'empty';
		},
		get messageCount() {
			return messages.length;
		},
		get isNearLimit() {
			return messages.length >= 30;
		},
		get isAtLimit() {
			return messages.length >= 36;
		},

		// Conversation
		addUserMessage(content: string) {
			messages.push({
				id: generateMessageId(),
				role: 'user',
				content,
				timestamp: Date.now()
			});
			scheduleDraftSave();
		},
		addAssistantMessage(content: string) {
			messages.push({
				id: generateMessageId(),
				role: 'assistant',
				content,
				timestamp: Date.now()
			});
		},
		appendToLastAssistantMessage(chunk: string) {
			const lastMessage = messages[messages.length - 1];
			if (lastMessage && lastMessage.role === 'assistant') {
				lastMessage.content += chunk;
			}
		},
		removeLastAssistantMessage() {
			const lastMessage = messages[messages.length - 1];
			if (lastMessage && lastMessage.role === 'assistant') {
				messages.pop();
			}
		},
		setStreaming(value: boolean) {
			isStreaming = value;
			if (!value && messages.length > 0) {
				scheduleDraftSave();
			}
		},
		setError(value: string) {
			error = value;
		},

		// Phase transitions
		startChatting() {
			phase = 'chatting';
		},
		finishInterview() {
			phase = 'tone-selection';
		},
		backToInterview() {
			phase = 'chatting';
		},
		startGenerating() {
			phase = 'generating';
		},
		showResult(entry: string) {
			generatedEntry = entry;
			phase = 'result';
		},

		// Tone selection
		setSelectedTone(toneId: string) {
			selectedTone = toneId;
			scheduleDraftSave();
		},
		setAddon(key: 'horoscope' | 'onThisDay' | 'homework' | 'dailyChallenge', value: boolean) {
			switch (key) {
				case 'horoscope':
					includeHoroscope = value;
					break;
				case 'onThisDay':
					includeOnThisDay = value;
					break;
				case 'homework':
					includeHomework = value;
					break;
				case 'dailyChallenge':
					includeDailyChallenge = value;
					break;
			}
			scheduleDraftSave();
		},

		// Draft persistence
		async loadDraft(): Promise<boolean> {
			if (!browser) return false;
			try {
				const { value } = await Preferences.get({ key: CHAT_DRAFT_KEY });
				if (!value) return false;
				const draft: ChatDraft = JSON.parse(value);
				if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
					await Preferences.remove({ key: CHAT_DRAFT_KEY });
					return false;
				}
				messages = draft.messages;
				phase = draft.phase;
				selectedTone = draft.selectedTone;
				includeHoroscope = draft.includeHoroscope;
				includeOnThisDay = draft.includeOnThisDay;
				includeHomework = draft.includeHomework;
				includeDailyChallenge = draft.includeDailyChallenge ?? false;
				return true;
			} catch (e) {
				console.error('Failed to load chat draft:', e);
				return false;
			}
		},
		async clearDraft() {
			if (!browser) return;
			if (draftSaveTimer) clearTimeout(draftSaveTimer);
			try {
				await Preferences.remove({ key: CHAT_DRAFT_KEY });
			} catch (e) {
				console.error('Failed to clear chat draft:', e);
			}
		},

		// Lifecycle
		reset() {
			messages = [];
			phase = 'empty';
			isStreaming = false;
			selectedTone = '';
			generatedEntry = '';
			includeHoroscope = false;
			includeOnThisDay = false;
			includeHomework = true;
			includeDailyChallenge = false;
			error = '';
		}
	};
}

export const chatStore = createChatStore();
