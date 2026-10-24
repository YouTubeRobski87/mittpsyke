// Klientens begäran om samtycke till AI-chatten.
//
// Servern är facit: inloggad → raden i user_ai_consents, gäst → den signerade
// HttpOnly-cookien. Ett felsvar tidigare satte bara en flagga till false och
// returnerade, så samtyckesrutan visade inget fel och knappen såg ut att inte
// göra något. Nu kastar begäran vid allt annat än ett lyckat svar, så att
// rutan kan visa sitt felmeddelande. Chatten låses aldrig upp av ett fel.

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const CHAT_AI_CONSENT_ENDPOINT = '/api/consent/chat-ai';
export const CHAT_AI_ANONYMOUS_CONSENT_ENDPOINT = '/api/consent/chat-ai/anonymous';

/** Kastas när servern inte bekräftade samtycket. Bär bara statuskoden. */
export class ChatAiConsentError extends Error {
	readonly status: number;

	constructor(status: number) {
		super(`Samtycket kunde inte sparas (status ${status}).`);
		this.name = 'ChatAiConsentError';
		this.status = status;
	}
}

/**
 * Ber servern registrera samtycket. Med `accessToken` gäller det den
 * inloggade användaren, annars gästens cookie. Löser ut först när servern
 * svarat OK. Felsvar och nätverksfel kastar.
 */
export async function requestChatAiConsent(
	fetchFn: FetchLike,
	accessToken: string | null
): Promise<void> {
	const response = accessToken
		? await fetchFn(CHAT_AI_CONSENT_ENDPOINT, {
				method: 'POST',
				headers: { Authorization: `Bearer ${accessToken}` }
			})
		: await fetchFn(CHAT_AI_ANONYMOUS_CONSENT_ENDPOINT, { method: 'POST' });

	if (!response.ok) throw new ChatAiConsentError(response.status);
}
