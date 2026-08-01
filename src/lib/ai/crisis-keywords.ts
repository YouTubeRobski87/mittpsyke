// src/lib/ai/crisis-keywords.ts
//
// Enda källan för krisorddetektering i hela appen. Används av:
// - Servern (routes/api/chat/+server.ts) — den auktoritativa spärren som körs
//   INNAN varje AI-anrop och kortsluter till ett fast, ofarligt svar.
// - Klienten (lib/ai/safety.ts) — omedelbar UI-feedback.
// - ChatWindow.svelte — vilken stödnivå ("akut") som visas i chatten.
//
// Listan är sammanslagen från tre tidigare separata listor som hade glidit
// isär. Fraser som tidigare bara fanns i UI-lagren gjorde aldrig att servern
// gav det garanterat säkra krissvaret — det gör de nu.
//
// Risk mot en själv och risk mot någon annan hålls isär i två listor, eftersom
// de kräver olika svarstext (se CRISIS_RESPONSE respektive
// THIRD_PARTY_RISK_RESPONSE i +server.ts). Ett meddelande kan träffa båda.
//
// Ändringar här påverkar alla tre lager samtidigt. Extra försiktighet krävs,
// se CLAUDE.md "Safety-Critical Code".

export const ACUTE_CRISIS_PHRASES = Object.freeze([
	'sjalvmord',
	'suicid',
	'sjalvskad',
	'ta livet av',
	'ta mitt liv',
	'avsluta mitt',
	'avsluta sitt',
	'avsluta livet',
	'avsluta allt',
	'inte orkar leva',
	'orkar inte leva',
	'orkar inte mer',
	'vill inte leva',
	'vill do',
	'vill vara dod',
	'vill bara do',
	'vill bara vara dod',
	'vill helst do',
	'vill helst vara dod',
	'hoppas att jag dor',
	'battre om jag var dod',
	'battre om jag vore dod',
	'ingen anledning att leva',
	'skada mig',
	'hoppa fran',
	'hoppa av',
	'hoppa ner',
	'inte vilja finnas',
	'forsvinna for alltid',
	'vill forsvinna',
	'ge upp allt',
	'ge upp livet',
	'ge upp hoppet',
	'inget hopp',
	'ingen mening',
	'allt ar hopplost',
	'alla vore battre utan mig',
	'ingen saknar mig',
	'ingen behover mig',
	'ingen bryr sig om mig',
	'ta tabletter',
	'ta piller',
	'ta overdos',
	'lagt en plan',
	'avskedsbrev',
	'inte vakna',
	'somna for alltid',
	'somna in for alltid',
	'gora slut pa allt',
	'gora slut pa det har',
	'gora slut pa mitt liv',
	'kan inte fortsatta',
	'sista utvagen',
	'sista chansen',
	'akut fara'
]);

// Risk riktad mot en annan person, inte mot en själv. Hålls avsiktligt kort —
// breddas den för mycket riskerar den att träffa oskyldiga uttryck (t.ex.
// vardagligt bildspråk). Utökas bara medvetet, inte i förbifarten.
export const THIRD_PARTY_RISK_PHRASES = Object.freeze([
	'skada nagon annan',
	'skada nagon jag kanner',
	'gora nagon illa'
]);

export function normalizeForCrisisMatch(text: string): string {
	return text
		.toLowerCase()
		.replace(/[åäàá]/g, 'a')
		.replace(/[öòó]/g, 'o')
		.replace(/[éè]/g, 'e')
		.replace(/\s+/g, ' ')
		.trim();
}

function includesAnyPhrase(normalized: string, phrases: readonly string[]): boolean {
	return phrases.some((phrase) => normalized.includes(phrase));
}

export function containsAcuteCrisisPhrase(text: string): boolean {
	if (!text) return false;
	return includesAnyPhrase(normalizeForCrisisMatch(text), ACUTE_CRISIS_PHRASES);
}

export function containsThirdPartyRiskPhrase(text: string): boolean {
	if (!text) return false;
	return includesAnyPhrase(normalizeForCrisisMatch(text), THIRD_PARTY_RISK_PHRASES);
}
