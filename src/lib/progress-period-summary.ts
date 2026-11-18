// Delade typer och gränser för "Det du har skrivit" i Framsteg: en sammanhängande
// AI-text om allt användaren har skrivit i dagboken. Servern bygger och
// kontrollerar texten; klienten läser bara de här typerna. Inget sparas.

/** Färre anteckningar med text än så ger ingen text. */
export const MIN_PERIOD_SUMMARY_ENTRIES = 5;
/** Färre ord än så utan humörvärde räknas som en testanteckning och hoppas över. */
export const MIN_PERIOD_SUMMARY_ENTRY_WORDS = 3;
/** Fler ord än så räknas som inklistrad text och hoppas över. */
export const MAX_PERIOD_SUMMARY_SOURCE_WORDS = 400;
/** Högst så många anteckningar skickas, spridda över hela tiden. */
export const MAX_PERIOD_SUMMARY_ENTRIES = 40;
/** Högst så många ord skickas sammanlagt. */
export const MAX_PERIOD_SUMMARY_WORDS = 6000;
/** En enskild anteckning kortas vid en meningsgräns efter högst så många ord. */
export const MAX_PERIOD_SUMMARY_ENTRY_WORDS = 400;

/** Omfånget för urvalet. */
export type PeriodSummaryBasis = {
	/** Anteckningar som skickas. */
	entryCount: number;
	/** Anteckningar med text som hade kunnat skickas. */
	availableCount: number;
	/** Anteckningar som inte skickas eftersom krisvakten flaggade dem. */
	excludedCount: number;
	/** Anteckningar som hoppas över för att de är mycket korta eller ser inklistrade ut. */
	skippedCount: number;
	/** Sant när inte alla anteckningar ryms och ett urval spritt över tiden skickas. */
	capped: boolean;
	/** Sant när dagboken har fler rader än som läses, så de äldsta inte är med alls. */
	truncated: boolean;
	/** Första och sista datum (YYYY-MM-DD) bland anteckningarna som skickas. */
	firstDate: string | null;
	lastDate: string | null;
};

/** En anteckning precis som den skickas till AI, så att användaren kan granska urvalet. */
export type PeriodSummaryPreviewEntry = {
	ref: number;
	entryId: string;
	date: string;
	mood: number | null;
	text: string;
};

export type PeriodSummaryPreview = PeriodSummaryBasis & {
	snapshotId: string;
	/** Exakt det som skickas, i kronologisk ordning. Visas bara för kontots ägare. */
	entries: PeriodSummaryPreviewEntry[];
};

export type PeriodSummarySource = { ref: number; entryId: string; date: string };

/** En bit av ett stycke: löptext eller en hänvisning till en eller flera anteckningar. */
export type PeriodSummarySegment = { text: string } | { sources: PeriodSummarySource[] };

export type PeriodSummaryResult = {
	basis: PeriodSummaryBasis;
	/** Löptext i stycken, med hänvisningar inne i texten. */
	paragraphs: PeriodSummarySegment[][];
	/** En fråga att ta med sig, eller null. */
	question: string | null;
};
