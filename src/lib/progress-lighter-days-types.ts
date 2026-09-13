// Delade typer för "Det som ofta fanns med under lättare dagar" och den
// valbara AI-sammanfattningen. Servern fyller i dem
// ($lib/server/progress-lighter-days), Framsteg läser dem.

export type ThemeEvidence = {
	/** Id för originalinlägget i dagboken, när det finns. */
	entryId: string | null;
	/** Stockholmsdatum, YYYY-MM-DD. */
	date: string;
	dateLabel: string;
	mood: number;
	/**
	 * Ett ordagrant utdrag ur användarens egen text. null när meningen inte
	 * ska visas här (krisinnehåll) - då visas bara datum och humör.
	 */
	excerpt: string | null;
};

export type LighterDaysTheme = {
	/** Tekniskt id, originalnamnet i TOPICS. Används för korrigeringar. */
	id: string;
	/** Visningsnamn: användarens eget om temat bytt namn. */
	label: string;
	renamed: boolean;
	/** n: antal inlägg med högre humör där temat fanns med. */
	count: number;
	/** Jämförelsebasen: alla inlägg med högre humör i perioden. */
	base: number;
	/** Antal övriga inlägg där temat fanns med, och hur många övriga inlägg som finns. */
	otherCount: number;
	otherBase: number;
	/** Antal olika veckor som de n inläggen är spridda över. */
	weekCount: number;
	/** Huvudanteckningen, alltid med tema, n, jämförelsebas och period. */
	note: string;
	/** Jämförelsen med övriga inlägg. */
	comparison: string;
	evidence: ThemeEvidence[];
};

export type LighterDaysView = {
	periodDays: 30 | 90 | 180;
	/** Inlägg i perioden som har både text och humörvärde. */
	relevantEntryCount: number;
	/** Inlägg vars humör ligger över periodens mittvärde. */
	higherEntryCount: number;
	/** Periodens mittvärde (median) för humör, eller null utan underlag. */
	medianMood: number | null;
	lowConfidence: boolean;
	themes: LighterDaysTheme[];
	/** Teman användaren dolt, så att de kan visas igen. */
	hiddenThemes: { id: string; label: string }[];
	/** Hur urvalet är gjort, i klartext. */
	basis: string;
};

export type SummarySource = {
	/** Numret modellen refererar till, 1-baserat. */
	ref: number;
	entryId: string | null;
	date: string;
	dateLabel: string;
	themeLabel: string;
	excerpt: string;
};

export type SummaryStatement = {
	text: string;
	sources: SummarySource[];
};

export type SummaryResponse = {
	statements: SummaryStatement[];
	reason: 'no-sources' | 'withheld' | 'no-traceable-statements' | null;
};
