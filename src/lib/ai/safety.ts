// src/lib/ai/safety.ts

/**
 * Krisorddetektering – klient-sida.
 * Fraserna kommer från $lib/ai/crisis-keywords, den enda källan som delas
 * med den auktoritativa servkontrollen i /api/chat/+server.ts och med
 * ChatWindows stödnivåer. Backend gör den auktoritativa kontrollen; detta
 * är en snabb klient-sida check för att visa UI-element omedelbart.
 */

import { containsAcuteCrisisPhrase, containsThirdPartyRiskPhrase } from './crisis-keywords';

export function containsCrisisSignal(text: string): boolean {
	return containsAcuteCrisisPhrase(text);
}

export function containsThirdPartyRiskSignal(text: string): boolean {
	return containsThirdPartyRiskPhrase(text);
}
