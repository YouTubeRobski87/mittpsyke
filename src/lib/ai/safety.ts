// src/lib/ai/safety.ts
//
// Krisorddetektering – klient-sida.
// Fraserna kommer från $lib/ai/crisis-keywords, den enda källan som delas
// med den auktoritativa serverkontrollen i /api/chat/+server.ts och med
// ChatWindows stödnivåer. Backend gör den auktoritativa kontrollen; detta
// är en snabb klient-sida check för att visa UI-element omedelbart.

import {
	containsAcuteCrisisPhrase,
	containsElevatedDistressPhrase,
	containsElevatedPresencePhrase,
	containsThirdPartyRiskPhrase
} from './crisis-keywords';

export type ChatSupportLevel = 'standard' | 'elevated' | 'acute' | 'acute-third-party';

export function containsCrisisSignal(text: string): boolean {
	return containsAcuteCrisisPhrase(text);
}

export function containsThirdPartyRiskSignal(text: string): boolean {
	return containsThirdPartyRiskPhrase(text);
}

/** Förhöjd nivå: tyngd från krislistan eller närvarofraser som ensamhet. */
export function containsElevatedSupportSignal(text: string): boolean {
	return containsElevatedDistressPhrase(text) || containsElevatedPresencePhrase(text);
}

/**
 * ChatWindows stödnivå. Akut vinner alltid över förhöjd, så "orkar inte leva"
 * inte visas som en varm panel i stället för krishänvisning.
 */
export function resolveChatSupportLevel(text: string): ChatSupportLevel {
	if (!text) return 'standard';
	if (containsAcuteCrisisPhrase(text)) return 'acute';
	if (containsThirdPartyRiskPhrase(text)) return 'acute-third-party';
	if (containsElevatedSupportSignal(text)) return 'elevated';
	return 'standard';
}
