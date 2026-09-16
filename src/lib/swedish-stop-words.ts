// Svenska stoppord för de ställen där MittPsyke räknar ord i egna texter.
//
// Listorna låg tidigare i tre filer och kunde glida isär utan att någon
// märkte det. Här bor de tillsammans, men de slås medvetet inte ihop: varje
// analys behåller exakt samma uppsättning ord som förut, så inget resultat
// ändras av att filerna flyttades. Det som faktiskt delas är kärnan nedan.
//
// Modulen är browser-safe: den innehåller bara data och importerar ingenting,
// så både $lib (webbläsaren) och $lib/server kan använda den.

/** Orden som alla tre analyser redan filtrerade bort. */
export const SWEDISH_STOP_WORDS_CORE: readonly string[] = [
	'att', 'bara', 'blev', 'den', 'det', 'dig', 'ett', 'från',
	'för', 'har', 'här', 'inte', 'kan', 'med', 'men', 'mig',
	'min', 'när', 'och', 'som', 'till', 'var', 'vara', 'över'
];

/**
 * Spegelvattnets veckoreflektion. Samma 95 ord som tidigare låg i
 * `$lib/server/spegelvattnet.ts`. Den filtrerar ord kortare än tre tecken,
 * därför finns korta ord som "av" och "på" kvar här.
 */
export const SPEGELVATTNET_STOP_WORDS: ReadonlySet<string> = new Set([
	...SWEDISH_STOP_WORDS_CORE,
	'alla', 'allt', 'alltid', 'andra', 'av', 'bli', 'blir', 'bra',
	'detta', 'din', 'dina', 'dom', 'du', 'där', 'efter', 'eller',
	'en', 'fast', 'få', 'får', 'fått', 'ganska', 'gör', 'göra',
	'ha', 'hade', 'han', 'hon', 'hos', 'hur', 'igen', 'in',
	'ingen', 'inget', 'jag', 'ju', 'kanske', 'kom', 'kommer', 'kunde',
	'lite', 'man', 'mer', 'mina', 'mitt', 'mot', 'mycket', 'nog',
	'någon', 'något', 'också', 'om', 'på', 'sa', 'samma', 'se',
	'sen', 'ska', 'skulle', 'så', 'tar', 'tror', 'under', 'upp',
	'utan', 'vad', 'varit', 'vecka', 'vid', 'vill', 'väl'
]);

/**
 * Dagsfrågan. Samma 30 ord som tidigare låg i
 * `$lib/server/daily-question.ts`. En avsiktligt kort lista: den plockar bara
 * ut några få återkommande ord ur de senaste inläggen.
 */
export const DAILY_QUESTION_STOP_WORDS: ReadonlySet<string> = new Set([
	...SWEDISH_STOP_WORDS_CORE,
	'du', 'idag', 'jag', 'kände', 'känna', 'känns'
]);

/**
 * Den lokala återblicken i webbläsaren. Bredast av listorna, eftersom den
 * visar teman direkt för användaren och hellre ska visa inget än ett svagt
 * tema. Ord kortare än fyra tecken filtreras redan innan listan används.
 */
export const LOCAL_RETROSPECT_STOP_WORDS: ReadonlySet<string> = new Set([
	...SWEDISH_STOP_WORDS_CORE,
	'alla', 'allt', 'alltid', 'andra', 'annat', 'bland', 'bli', 'blir',
	'borde', 'bra', 'både', 'dag', 'dagar', 'dagen', 'deras', 'dessa',
	'detta', 'din', 'dina', 'ditt', 'dom', 'där', 'därför', 'efter',
	'eller', 'ens', 'fast', 'fick', 'finns', 'fram', 'får', 'fått',
	'ganska', 'genom', 'gick', 'gjorde', 'gjort', 'går', 'gör', 'göra',
	'hade', 'haft', 'han', 'hann', 'hela', 'helt', 'hon', 'hos',
	'hur', 'idag', 'igen', 'igår', 'ingen', 'inget', 'kanske', 'kom',
	'kommer', 'kunde', 'kände', 'känna', 'känns', 'lite', 'litet', 'man',
	'medan', 'mellan', 'mer', 'mest', 'mina', 'mitt', 'mot', 'mycket',
	'många', 'måste', 'nog', 'någon', 'något', 'några', 'nästa', 'också',
	'ofta', 'oss', 'redan', 'samma', 'sedan', 'sen', 'sig', 'sin',
	'sina', 'sitt', 'ska', 'skulle', 'större', 'sådan', 'såg', 'sätt',
	'tar', 'tror', 'tycker', 'under', 'upp', 'utan', 'vad', 'varit',
	'varje', 'vecka', 'veckan', 'verkligen', 'vet', 'vid', 'vill', 'ville',
	'väl', 'ändå'
]);
