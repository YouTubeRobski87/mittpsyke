// Regler för chattingången på /chat.
//
// Ligger i en egen modul i stället för inne i sidan så att beteendet går att
// testa utan komponentrendering: tomt meddelande blockeras, texten följer med
// in i samtalet, genvägen är frivillig, och analytics får aldrig fritexten.

import { getTopicHint } from './chat-topics';

export type ChatStartPlan =
	| { ok: false; reason: 'empty' }
	| {
			ok: true;
			/** Användarens första meddelande, trimmat. Skickas in i chatten. */
			text: string;
			/** Vald genväg, eller null. Alltid frivillig. */
			topicId: string | null;
			/** Vart användaren ska. Neutrala spåret, ingen kategori krävs. */
			destination: string;
			/**
			 * Det som får skickas till analytics. Innehåller aldrig texten - bara
			 * dess längd och genvägens id, som är ett fast värde ur en känd lista.
			 */
			analytics: { event: string; topic: string | null; textLength: number };
	  };

export const CHAT_START_DESTINATION = '/chat/samtal';

export function planChatStart(draft: unknown, topicId: unknown): ChatStartPlan {
	const text = typeof draft === 'string' ? draft.trim() : '';
	if (!text) return { ok: false, reason: 'empty' };

	// Okända genvägar tystas ner till null i stället för att följa med vidare.
	const hint = getTopicHint(topicId);

	return {
		ok: true,
		text,
		topicId: hint?.id ?? null,
		destination: CHAT_START_DESTINATION,
		analytics: {
			event: hint ? 'ai_chat_started_with_topic' : 'ai_chat_started_free_text',
			topic: hint?.id ?? null,
			textLength: text.length
		}
	};
}
