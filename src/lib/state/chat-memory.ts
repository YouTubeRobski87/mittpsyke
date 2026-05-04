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
