// Delade typer och gränser för "Sammanfatta mina anteckningar" i Framsteg.
// Servern bygger och kontrollerar sammanfattningen; klienten läser bara de här
// typerna. Inget i sammanfattningen sparas.

export type PeriodSummaryPeriod = 30 | 90 | 180;

/** Färre anteckningar med text än så ger ingen sammanfattning. */
export const MIN_PERIOD_SUMMARY_ENTRIES = 5;
/** Högst så många anteckningar skickas, de senaste först. */
export const MAX_PERIOD_SUMMARY_ENTRIES = 40;
/** Högst så många ord skickas sammanlagt. */
export const MAX_PERIOD_SUMMARY_WORDS = 6000;
/** En enskild anteckning kortas vid en meningsgräns efter så många ord. */
export const MAX_PERIOD_SUMMARY_ENTRY_WORDS = 400;

/** Det användaren får se innan något skickas. Inga texter, bara omfånget. */
export type PeriodSummaryBasis = {
	period: PeriodSummaryPeriod;
	/** Anteckningar som skickas. */
	entryCount: number;
	/** Anteckningar som inte skickas eftersom krisvakten eller känsligt innehåll flaggade dem. */
	excludedCount: number;
	/** Sant när periodens anteckningar inte rymdes i taket och bara de senaste skickas. */
	capped: boolean;
	/** Första och sista datum (YYYY-MM-DD) bland anteckningarna som skickas. */
	firstDate: string | null;
	lastDate: string | null;
};

export type PeriodSummaryPreview = PeriodSummaryBasis & { snapshotId: string };

export type PeriodSummarySource = { ref: number; entryId: string; date: string };

export type PeriodSummaryStatement = { text: string; sources: PeriodSummarySource[] };

export type PeriodSummaryMoment = { quote: string; source: PeriodSummarySource };

export type PeriodSummaryResult = {
	basis: PeriodSummaryBasis;
	/** Det du skrev mest om. */
	themes: PeriodSummaryStatement[];
	/** Det som verkar ha förändrats under perioden. */
	changes: PeriodSummaryStatement[];
	/** Stunder som sticker ut, med ordagranna citat. */
	moments: PeriodSummaryMoment[];
	/** En fråga att ta med sig, eller null. */
	question: string | null;
};

export function isPeriodSummaryPeriod(value: unknown): value is PeriodSummaryPeriod {
	return value === 30 || value === 90 || value === 180;
}
