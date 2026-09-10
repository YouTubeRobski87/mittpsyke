// Sovläge i Kvällsstugan – ren tillståndslogik.
//
// Fyra regler bär hela filen:
//
// 1. Ingenting startar av sig självt. Varje steg kräver ett uttryckligt val,
//    och ljud spelas aldrig förrän användaren valt både källa och längd.
// 2. Ingenting sparas. Sovläge lever bara i den öppna vyn – ingen DB, ingen
//    ny datainsamling. Enda undantaget är användarens upprepningsval för
//    musiken, en inställning som ligger i evening-music-sources.
// 3. Tiden räknas mot tidsstämplar, aldrig mot en tickräknare. En strypt
//    bakgrundsflik ska inte kunna få sessionen att glida.
// 4. Copyn beskriver vad användaren valt. Den lovar aldrig sömn, effekt eller
//    resultat – se docs/NORTH_STAR.md.

export type SleepStage = 'closed' | 'source' | 'music' | 'meditation' | 'length' | 'active';

export type SleepSourceId = 'music' | 'meditation' | 'silence';

export type SleepSourceOption = {
	id: SleepSourceId;
	label: string;
	/** Kort förtydligande under etiketten. Beskriver, lovar inget. */
	hint: string;
};

/**
 * Naturljud saknar fortfarande både ljudfil och licensbeslut i repot, och att
 * visa det som gråat eller "kommer snart" hade gjort valet till en vägg i
 * stället för ett val. Det läggs till när det finns något att spela.
 *
 * Musik står först: det är den enda källan utan guidande röst som ändå ger
 * något att vila till. Vilket spår väljs i ett eget steg.
 */
export const SLEEP_SOURCES: readonly SleepSourceOption[] = [
	{ id: 'music', label: 'Lugn musik', hint: 'Välj ett stilla spår att vila till' },
	{ id: 'meditation', label: 'Meditation', hint: 'En lugn röst som guidar dig' },
	{ id: 'silence', label: 'Tystnad', hint: 'Inget ljud alls' }
];

export type SleepLengthId = '10' | '20' | '30' | 'open';

export type SleepLengthOption = {
	id: SleepLengthId;
	label: string;
	/** null = ingen sluttid; stunden pågår tills användaren själv avslutar. */
	minutes: number | null;
};

export const SLEEP_LENGTHS: readonly SleepLengthOption[] = [
	{ id: '10', label: '10 min', minutes: 10 },
	{ id: '20', label: '20 min', minutes: 20 },
	{ id: '30', label: '30 min', minutes: 30 },
	{ id: 'open', label: 'Tills jag avslutar själv', minutes: null }
];

export function getSleepSource(id: SleepSourceId | null): SleepSourceOption | null {
	if (!id) return null;
	return SLEEP_SOURCES.find((source) => source.id === id) ?? null;
}

export function getSleepLength(id: SleepLengthId | null): SleepLengthOption | null {
	if (!id) return null;
	return SLEEP_LENGTHS.find((length) => length.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Stegövergångar
//
// Musik och meditation har var sitt mellansteg där spåret väljs. Tystnad har
// ingenting att välja mellan och går direkt till längden – ett tomt steg hade
// bara varit en klickning till.

export function getSleepStageAfterSource(source: SleepSourceId): SleepStage {
	if (source === 'music') return 'music';
	if (source === 'meditation') return 'meditation';
	return 'length';
}

/** Vägen bakåt. Speglar getSleepStageAfterSource så "Tillbaka" alltid landar rätt. */
export function getSleepStageBefore(
	stage: SleepStage,
	source: SleepSourceId | null
): SleepStage {
	if (stage === 'length') {
		if (source === 'music') return 'music';
		if (source === 'meditation') return 'meditation';
		return 'source';
	}
	if (stage === 'music' || stage === 'meditation') return 'source';
	return 'closed';
}

/** Sant när steget är ett val i panelen och inte det aktiva Sovläget. */
export function isSleepChoiceStage(stage: SleepStage): boolean {
	return stage === 'source' || stage === 'music' || stage === 'meditation' || stage === 'length';
}

// ---------------------------------------------------------------------------
// Tid
//
// Timern är ett rent värdeobjekt. Den mäter mot Date.now() och håller reda på
// hur länge den varit pausad, så att en paus varken förlänger eller förkortar
// den valda stunden.

export type SleepTimer = {
	startedAt: number;
	/** null = öppen längd, ingen sluttid. */
	durationMs: number | null;
	/** Tidpunkt då pausen började, eller null när stunden löper. */
	pausedAt: number | null;
	pausedTotalMs: number;
};

export function createSleepTimer(startedAt: number, minutes: number | null): SleepTimer {
	return {
		startedAt,
		durationMs: minutes === null ? null : minutes * 60_000,
		pausedAt: null,
		pausedTotalMs: 0
	};
}

export function getSleepElapsedMs(timer: SleepTimer, now: number): number {
	const reference = timer.pausedAt ?? now;
	return Math.max(0, reference - timer.startedAt - timer.pausedTotalMs);
}

/** null vid öppen längd – då finns ingen återstående tid att visa. */
export function getSleepRemainingMs(timer: SleepTimer, now: number): number | null {
	if (timer.durationMs === null) return null;
	return Math.max(0, timer.durationMs - getSleepElapsedMs(timer, now));
}

export function isSleepFinished(timer: SleepTimer, now: number): boolean {
	if (timer.durationMs === null) return false;
	return getSleepElapsedMs(timer, now) >= timer.durationMs;
}

export function pauseSleepTimer(timer: SleepTimer, now: number): SleepTimer {
	if (timer.pausedAt !== null) return timer;
	return { ...timer, pausedAt: now };
}

export function resumeSleepTimer(timer: SleepTimer, now: number): SleepTimer {
	if (timer.pausedAt === null) return timer;
	return {
		...timer,
		pausedAt: null,
		pausedTotalMs: timer.pausedTotalMs + Math.max(0, now - timer.pausedAt)
	};
}

/**
 * Återstående tid i ord. Avrundar uppåt, så "1 min kvar" står kvar hela sista
 * minuten i stället för att räkna ned sekunder – nedräkning drar uppmärksamhet
 * och det är precis vad Sovläge inte ska göra.
 */
export function formatSleepRemaining(remainingMs: number | null): string | null {
	if (remainingMs === null) return null;
	const minutes = Math.ceil(remainingMs / 60_000);
	if (minutes <= 0) return 'Snart klart';
	if (minutes === 1) return '1 minut kvar';
	return `${minutes} minuter kvar`;
}

// ---------------------------------------------------------------------------
// Copy

export function getSleepStageHeading(stage: SleepStage, source: SleepSourceId | null): string {
	if (stage === 'source') return 'Välj något som hjälper dig att varva ner.';
	if (stage === 'music') return 'Vilken musik vill du lyssna på?';
	if (stage === 'meditation') return 'Vilken vill du lyssna på?';
	if (stage === 'length') {
		return source === 'silence' ? 'Hur länge vill du ha tyst?' : 'Hur länge vill du lyssna?';
	}
	if (stage === 'active') return 'Du ligger kvar i stugan.';
	return '';
}

/** Statusraden i aktivt Sovläge. Beskriver läget, aldrig en förväntad effekt. */
export function getSleepActiveStatus(
	source: SleepSourceId | null,
	trackTitle: string | null
): string {
	if (source === 'silence') return 'Det är tyst nu.';
	if ((source === 'meditation' || source === 'music') && trackTitle) {
		return `${trackTitle} spelas.`;
	}
	return 'Sovläge är på.';
}
