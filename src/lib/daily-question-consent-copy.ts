/*
 * Canonical copy för dagens fråga.
 *
 * Ligger klient-säkert (inte under $lib/server) eftersom checkin-sidan behöver
 * visa den i sin ConsentGate. Servermodulen daily-question-ai-consent
 * återexporterar den, så det finns fortfarande exakt en källa.
 *
 * Formen matchar ConsentGate:s `dataLabel`/`serviceLabel`. Copyn beskriver den
 * faktiska dataminimeringen - ett kort utdrag och härledda signaler, inte hela
 * dagboken - och namnger Anthropic, som är den provider flödet verkligen
 * använder. Den lovar inte anonymisering, säger inget om behandling eller
 * diagnos, och påstår inte att providern slipper se innehållet.
 */
export const DAILY_QUESTION_CONSENT_COPY = {
	title: 'Innan du hämtar dagens fråga',
	dataLabel:
		'Ett kort utdrag ur ditt senaste dagboksinlägg och härledda signaler som humörvärden, trend och återkommande ord',
	serviceLabel: 'MittPsyke och Anthropic för att skapa en fråga att reflektera kring',
	/** Visas som förtydligande: frågan hämtas aldrig av sig själv. */
	activeChoice:
		'Frågan skapas bara när du själv väljer att hämta den, och du kan återkalla samtycket när du vill.'
} as const;
