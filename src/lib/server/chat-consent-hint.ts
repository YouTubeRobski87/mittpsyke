import { ANONYMOUS_CHAT_CONSENT_COOKIE } from '$lib/server/anonymous-chat-consent';

// Startläge för chattens samtyckesruta vid serverrendering.
//
// Bara en layoutfråga, aldrig en behörighet: /api/chat kontrollerar alltid
// samtycket på servern, och klienten frågar ändå /api/consent/chat-ai* efter
// start. Svaret avgör bara vad som syns innan den frågan hunnit svara.
//
// 'missing' ges bara när svaret är säkert utan databas eller signaturkontroll:
// en gäst utan samtyckescookie kan inte ha samtyckt. Då renderas samtyckes-
// rutan direkt i HTML:en i stället för att en kort statusrad byts mot den
// mycket högre rutan efter laddning (det gav CLS 0,6 på mobil).
//
// Inloggade och gäster med en cookie får 'check' och behåller statusraden,
// så att den som redan har samtyckt inte ser rutan blinka förbi.
export type ChatConsentHint = 'missing' | 'check';

export function resolveChatConsentHint(input: {
	authenticated: boolean;
	guestConsentCookie: string | undefined;
}): ChatConsentHint {
	if (input.authenticated) return 'check';
	return input.guestConsentCookie ? 'check' : 'missing';
}

export function chatConsentHintFromRequest(
	authenticated: boolean,
	cookies: { get(name: string): string | undefined }
): ChatConsentHint {
	return resolveChatConsentHint({
		authenticated,
		guestConsentCookie: cookies.get(ANONYMOUS_CHAT_CONSENT_COOKIE)
	});
}
