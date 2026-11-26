import type { ChatMessage } from '$lib/types';

export const CHAT_HISTORY_LIMIT = 20;
export const CHAT_CONTEXT_LIMIT = 10;

export type ChatTopic = 'angest' | 'nedstamdhet' | 'stress-oro' | 'allmant';

const UI_ONLY_MESSAGES = new Set([
	'Jag minns vårt tidigare samtal.',
	'Tidigare samtal är laddat.',
	'Vill du spara detta som anteckning?',
	'Vill du spara det här som en anteckning?',
	'Skriver...'
]);

const CATEGORY_TO_TOPIC: Record<string, ChatTopic> = {
	a: 'angest',
	b: 'nedstamdhet',
	e: 'stress-oro'
};

export function getChatTopic(category: string): ChatTopic {
	return CATEGORY_TO_TOPIC[category.trim().toLowerCase()] ?? 'allmant';
}

export function getChatHistoryStorageKey(topic: ChatTopic, userId?: string | null) {
	return userId?.trim() ? `chat_history_${topic}_${userId.trim()}` : `chat_history_${topic}`;
}

const CHAT_TOPICS: readonly ChatTopic[] = ['angest', 'nedstamdhet', 'stress-oro', 'allmant'];

type StorageLike = Pick<Storage, 'length' | 'key' | 'removeItem'>;

/** Webbläsarens localStorage, eller null om den saknas eller är blockerad. */
export function getLocalStorageSafely(): StorageLike | null {
	try {
		return typeof window === 'undefined' ? null : window.localStorage;
	} catch {
		return null;
	}
}

/**
 * Tar bort inloggade användares chatthistorik (chat_history_<ämne>_<user-id>)
 * ur webbläsarens lagring. Används vid utloggning, kontobyte, utgången session
 * och kontoradering, så att nästa person på samma enhet inte kan läsa den.
 *
 * keepUserId behåller den nu inloggade användarens egen historik. Nycklar utan
 * user-id (äldre gästnycklar) och all annan lagring, till exempel gästens
 * lokala dagbok och tillgänglighetsinställningar, rörs inte.
 *
 * Returnerar nycklarna som togs bort.
 */
export function clearAccountChatHistory(
	storage: StorageLike | null | undefined,
	keepUserId: string | null = null
): string[] {
	if (!storage) return [];
	const keep = keepUserId?.trim() || null;
	const toRemove: string[] = [];

	try {
		for (let index = 0; index < storage.length; index += 1) {
			const key = storage.key(index);
			if (!key) continue;
			for (const topic of CHAT_TOPICS) {
				const prefix = `chat_history_${topic}_`;
				if (!key.startsWith(prefix)) continue;
				const owner = key.slice(prefix.length);
				if (owner && owner !== keep) toRemove.push(key);
				break;
			}
		}
		// Ta bort efter genomgången, eftersom index flyttas när nycklar försvinner
		for (const key of toRemove) storage.removeItem(key);
	} catch {
		// Blockerad lagring: inget att rensa, och utloggningen får inte stoppas
		return [];
	}

	return toRemove;
}

export function sanitizeChatMessages(input: unknown, limit = CHAT_HISTORY_LIMIT): ChatMessage[] {
	if (!Array.isArray(input)) return [];

	const normalized = input
		.reduce<ChatMessage[]>((acc, value) => {
			if (!value || typeof value !== 'object') return acc;

			const record = value as Record<string, unknown>;
			const role = record.role === 'user' || record.role === 'assistant' ? record.role : null;
			const content = typeof record.content === 'string' ? record.content.trim() : '';

			if (!role || !content || UI_ONLY_MESSAGES.has(content)) return acc;

			const previous = acc.at(-1);
			if (previous?.role === role && previous.content === content) return acc;

			acc.push({
				role,
				content,
				...(record.crisis === true ? { crisis: true } : {})
			});

			return acc;
		}, [])
		.slice(-Math.max(limit, 0));

	return normalized;
}

export function getChatContextMessages(input: unknown, limit = CHAT_CONTEXT_LIMIT): ChatMessage[] {
	return sanitizeChatMessages(input, limit);
}
