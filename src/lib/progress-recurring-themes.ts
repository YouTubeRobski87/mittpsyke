// "Det som börjar synas i dina anteckningar" på Framsteg.
//
// Typer, trösklar och text som delas av servern ($lib/server/progress-analysis
// räknar fram teman och underlag) och sidan (som bara visar dem). Trösklarna
// ligger här, så att förklaringen i lågdataläget alltid säger exakt det som
// analysen faktiskt kräver.

/** Ett tema visas först när det finns i minst så här många anteckningar ... */
export const MIN_THEME_COUNT = 3;
/** ... under minst så här många olika veckor. En enda intensiv vecka räcker inte. */
export const MIN_THEME_WEEKS = 2;
/** Fler än så här blir en lista att ta sig igenom i stället för en återblick. */
export const MAX_RECURRING_THEMES = 3;
/** Så många anteckningar listas under "Visa underlaget". Antalet säger alltid hur många som finns. */
export const MAX_RECURRING_THEME_EVIDENCE = 8;
/** Så många utdrag visas direkt i kortet, innan underlaget öppnas. */
export const RECURRING_THEME_PREVIEW_QUOTES = 2;

export type RecurringThemeEvidence = {
	/** Id för originalinlägget i dagboken, när det finns. Aldrig text. */
	entryId: string | null;
	/** Stockholmsdatum, YYYY-MM-DD. */
	date: string;
	dateLabel: string;
	/**
	 * Ett ordagrant utdrag ur anteckningen. null när meningen inte ska visas
	 * här (krisinnehåll) - då visas bara datumet.
	 */
	excerpt: string | null;
};

export type RecurringTheme = {
	/** Tekniskt id, originalnamnet i analysens temalista. */
	id: string;
	/** Visningsnamn: användarens eget om temat bytt namn. */
	label: string;
	/** Antal anteckningar med text där temat finns med. */
	count: number;
	/** Antal anteckningar med text i perioden, dvs. jämförelsebasen. */
	textEntryCount: number;
	weekCount: number;
	firstHalfCount: number;
	secondHalfCount: number;
	/** Första och senaste anteckningen där temat finns med. */
	firstDate: string;
	lastDate: string;
	firstDateLabel: string;
	lastDateLabel: string;
	/** De anteckningar temat bygger på, senaste först, högst MAX_RECURRING_THEME_EVIDENCE. */
	evidence: RecurringThemeEvidence[];
};

/** Förklaringen till när teman kan börja synas. Lugn, och aldrig en uppmaning. */
export const RECURRING_THEME_THRESHOLD_COPY = `När ett tema återkommer i minst ${MIN_THEME_COUNT} anteckningar under minst ${MIN_THEME_WEEKS} olika veckor kan det börja synas här. Du behöver inte skriva varje dag.`;

function plural(count: number, one: string, many: string): string {
	return `${count} ${count === 1 ? one : many}`;
}

/** Huvudraden: hur många anteckningar, av hur många, och hur utspritt. */
export function recurringThemeCountCopy(theme: RecurringTheme): string {
	return `Finns i ${theme.count} av ${plural(theme.textEntryCount, 'anteckning', 'anteckningar')} med text, spritt över ${plural(theme.weekCount, 'vecka', 'veckor')}.`;
}

/** Vilken tid observationen omfattar, i datum från användarens egna anteckningar. */
export function recurringThemePeriodCopy(theme: RecurringTheme): string {
	return theme.firstDate === theme.lastDate
		? `Den ${theme.firstDateLabel}.`
		: `Från ${theme.firstDateLabel} till ${theme.lastDateLabel}.`;
}

/** Säger hur många av anteckningarna som listas, när listan är kapad. */
export function recurringThemeEvidenceCopy(theme: RecurringTheme): string {
	if (theme.evidence.length >= theme.count) {
		return `Temat bygger på de här ${plural(theme.count, 'anteckningen', 'anteckningarna')}.`;
	}
	return `Visar de ${theme.evidence.length} senaste av ${theme.count} anteckningar där temat finns med.`;
}

/** De utdrag som visas direkt i kortet. Bara riktiga utdrag, aldrig tomma rader. */
export function previewQuotes(theme: RecurringTheme): (RecurringThemeEvidence & { excerpt: string })[] {
	return theme.evidence
		.filter((item): item is RecurringThemeEvidence & { excerpt: string } => item.excerpt !== null)
		.slice(0, RECURRING_THEME_PREVIEW_QUOTES);
}

/**
 * När teman visas i ett eget kort ska samma tema inte upprepas som en
 * insikt längre ned. Ordningen på övriga insikter rörs inte.
 */
export function withoutRecurringThemeInsight<T extends { category: string }>(
	insights: T[],
	hasRecurringThemes: boolean
): T[] {
	return hasRecurringThemes ? insights.filter((item) => item.category !== 'recurring') : insights;
}
