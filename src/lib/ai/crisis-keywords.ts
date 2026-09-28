// src/lib/ai/crisis-keywords.ts
//
// Enda källan för krisorddetektering i hela appen. Används åt tre håll som
// ställer olika krav, och därför finns flera listor:
//
// 1. ACUTE_CRISIS_PHRASES — den auktoritativa spärren. En träff kortsluter
//    chatten: inget AI-anrop görs och användaren får CRISIS_RESPONSE i stället
//    för ett samtal. Används av servern (routes/api/chat/+server.ts via
//    crisis-guard.ts), av klienten (lib/ai/safety.ts) och av ChatWindows
//    stödnivåer. Här kostar ett falsklarm ett samtal som aldrig blev av, så
//    listan hålls smal och entydig.
//
// 2. ELEVATED_DISTRESS_PHRASES — förhöjd stödnivå i chatten. En träff bryter
//    inte samtalet; ChatWindow visar en varm panel med stödlinjer. Här hör de
//    fraser hemma som lyftes ur den akuta listan för att de var för breda att
//    blockera med, men som fortfarande betyder att någon bär mycket.
//
// 3. SENSITIVE_CONTENT_PHRASES — dämpningsfiltret. En träff döljer ett citat
//    i dagbokens förslag och på Framsteg. Här är ett falsklarm harmlöst medan
//    en miss släpper fram krisinnehåll i en förslagsruta, så listan är en
//    övermängd av de två ovan plus några fraser som är för vardagliga även
//    för den varma panelen.
//
// Risk mot en själv och risk mot någon annan hålls isär eftersom de kräver
// olika svarstext (CRISIS_RESPONSE respektive THIRD_PARTY_RISK_RESPONSE). Ett
// meddelande kan träffa båda.
//
// Matchningen sker på ordgränser. En fras som slutar med * är en stam och får
// matcha längre ord: 'sjalvmord*' träffar även "självmordstankar". Utan * krävs
// hel ordmatchning, vilket hindrar att 'vill do' träffar inuti "vill dölja".
//
// Ändringar här påverkar alla lager samtidigt. Extra försiktighet krävs, se
// CLAUDE.md "Safety-Critical Code" och frasmatrisen i crisis-keywords.test.ts.

export const ACUTE_CRISIS_PHRASES = Object.freeze([
	'sjalvmord*',
	'suicid*',
	'sjalvskad*',
	'ta livet av',
	'ta mitt liv',
	'avsluta mitt liv',
	'avsluta sitt liv',
	'avsluta livet',
	'avsluta allt',
	'inte orkar leva',
	'orkar inte leva',
	// "orkar inte längre" står kvar som akut, till skillnad från "orkar inte
	// mer" längre ner. Gränsen följer tests/ai-evals/crisis.json, där
	// "Jag vet inte om jag orkar längre" är klassat som krisscenario. Se
	// crisis-keywords.test.ts för spänningen mellan de två fraserna.
	'orkar langre',
	'orkar inte langre',
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
	'battre utan mig',
	'ingen anledning att leva',
	'ingen mening med livet',
	'livet har ingen mening',
	'meningslost att leva',
	'allt ar hoppl*',
	'allt kanns hoppl*',
	'ser ingen vag ut',
	'ingen utvag',
	'sista utvagen',
	'skada mig',
	'skadar mig',
	'skar mig',
	'skara mig',
	'skurit mig',
	'gora mig illa',
	'hoppa fran',
	'hoppa ner',
	'inte vilja finnas',
	'vill inte finnas',
	'forsvinna for alltid',
	'vill bara forsvinna',
	'ge upp livet',
	'overdos*',
	'ta alla tabletter',
	'ta alla mina tabletter',
	'ta alla piller',
	'lagt en plan',
	'avskedsbrev',
	'inte vakna',
	'somna for alltid',
	'somna in for alltid',
	'gora slut pa allt',
	'gora slut pa det har',
	'gora slut pa mitt liv',
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

// Uttryck för tyngd, hopplöshet och utmattning. De säger inte att någon är i
// akut fara, så de får inte bryta ett samtal — men de höjer stödpanelen och
// gör ett citat olämpligt att lyfta fram. Flera låg tidigare i den akuta
// listan och blockerade chatten för meningar som "jag orkar inte mer med
// plugget".
export const ELEVATED_DISTRESS_PHRASES = Object.freeze([
	'orkar inte mer',
	'kan inte fortsatta',
	'klarar inte mer',
	'ingen bryr sig om mig',
	'ingen saknar mig',
	'ingen behover mig',
	'ingen mening',
	'inget hopp',
	'hoppl*',
	'ge upp allt',
	'gett upp allt',
	'ge upp hoppet',
	'gett upp hoppet',
	'ger upp hoppet',
	'vill forsvinna'
]);

// För breda även för den varma panelen: "ta tabletter mot huvudvärken" eller
// "hoppa av utbildningen" ska varken bryta samtalet eller visa stödlinjer.
// De döljer bara citat, så krisinnehåll inte läcker in i en förslagsruta.
const SUPPRESSION_ONLY_PHRASES = Object.freeze([
	'hoppa av',
	'sista chansen',
	'ta tabletter',
	'ta piller'
]);

// ChatWindow-only. Inte kris, inte dämpning — bara att någon bär mycket just
// nu eller ber om en människa. "orkar inte" är medvetet bredare än "orkar
// inte mer"; den akuta kontrollen körs först och fångar "orkar inte leva".
const ELEVATED_PRESENCE_PHRASES = Object.freeze([
	'for mycket',
	'ensam*',
	'kan inte mer',
	'orkar inte',
	'prata med nagon',
	'prata med en manniska',
	'text racker inte',
	'texten racker inte'
]);

/** Allt som aldrig får lyftas fram som citat. Är alltid en övermängd av den akuta listan. */
export const SENSITIVE_CONTENT_PHRASES = Object.freeze([
	...ACUTE_CRISIS_PHRASES,
	...THIRD_PARTY_RISK_PHRASES,
	...ELEVATED_DISTRESS_PHRASES,
	...SUPPRESSION_ONLY_PHRASES
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

/**
 * Bygger ett mönster med ordgräns före frasen, och efter den om frasen inte är
 * en stam. Kompileras en gång per fras, inte en gång per meddelande.
 */
function buildPhrasePattern(phrase: string): RegExp {
	const isStem = phrase.endsWith('*');
	const core = isStem ? phrase.slice(0, -1) : phrase;
	const escaped = core.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`\\b${escaped}${isStem ? '' : '\\b'}`);
}

const ACUTE_PATTERNS = ACUTE_CRISIS_PHRASES.map(buildPhrasePattern);
const THIRD_PARTY_PATTERNS = THIRD_PARTY_RISK_PHRASES.map(buildPhrasePattern);
const ELEVATED_DISTRESS_PATTERNS = ELEVATED_DISTRESS_PHRASES.map(buildPhrasePattern);
const ELEVATED_PRESENCE_PATTERNS = ELEVATED_PRESENCE_PHRASES.map(buildPhrasePattern);
const SENSITIVE_PATTERNS = SENSITIVE_CONTENT_PHRASES.map(buildPhrasePattern);

function matchesAny(text: string, patterns: readonly RegExp[]): boolean {
	if (!text) return false;
	const normalized = normalizeForCrisisMatch(text);
	return patterns.some((pattern) => pattern.test(normalized));
}

/** Akut risk mot en själv. En träff bryter samtalet — se ACUTE_CRISIS_PHRASES. */
export function containsAcuteCrisisPhrase(text: string): boolean {
	return matchesAny(text, ACUTE_PATTERNS);
}

/** Risk riktad mot någon annan. En träff bryter samtalet med en egen svarstext. */
export function containsThirdPartyRiskPhrase(text: string): boolean {
	return matchesAny(text, THIRD_PARTY_PATTERNS);
}

/** Bred kontroll för dämpning. Bryter aldrig ett samtal, döljer bara innehåll. */
export function containsSensitiveContentPhrase(text: string): boolean {
	return matchesAny(text, SENSITIVE_PATTERNS);
}

/** Tyngd som höjer chattens stödpanel. Bryter aldrig ett samtal. */
export function containsElevatedDistressPhrase(text: string): boolean {
	return matchesAny(text, ELEVATED_DISTRESS_PATTERNS);
}

/** Närvarosignaler i chatten: ensamhet, överväldigande, önskan om en människa. */
export function containsElevatedPresencePhrase(text: string): boolean {
	return matchesAny(text, ELEVATED_PRESENCE_PATTERNS);
}
