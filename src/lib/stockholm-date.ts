// Gemensam dygnsindelning för dagbokens statistikytor.
//
// Inläggen lagras som timestamp. Vilket dygn ett inlägg hamnar på beror på
// vilken tidszon man formaterar i, och koden har historiskt gjort det på tre
// olika sätt: UTC (heatmap, stats-timeline), Europe/Stockholm (streak) och
// webbläsarens lokala tid (DiaryMoodTimeline). Ett inlägg sparat 00:30 svensk
// tid räknades därför som föregående dag i UTC-ytorna, vilket gav olika tal på
// olika sidor. Den här modulen är en enda källa för dygnsnyckeln.

const STOCKHOLM_TIME_ZONE = 'Europe/Stockholm';
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// sv-CA formaterar som ISO, dvs YYYY-MM-DD.
const stockholmDateFormatter = new Intl.DateTimeFormat('sv-CA', {
	timeZone: STOCKHOLM_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

/** Dygnsnyckel i svensk tid för en timestamp. Ogiltiga värden ger null. */
export function toStockholmDateKey(value: string | Date | null | undefined): string | null {
	if (!value) return null;
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return stockholmDateFormatter.format(date);
}

/** Dagens dygnsnyckel i svensk tid. */
export function stockholmTodayKey(now: Date = new Date()): string {
	return stockholmDateFormatter.format(now);
}

/**
 * Flyttar en dygnsnyckel ett antal dagar. Räknar i UTC på ett rent kalender-
 * datum, så sommartidsövergångar inte kan tappa eller dubblera ett dygn.
 */
export function shiftDateKey(dateKey: string, days: number): string {
	if (!DATE_PATTERN.test(dateKey)) return dateKey;
	const [year, month, day] = dateKey.split('-').map(Number);
	const shifted = new Date(Date.UTC(year, month - 1, day) + days * DAY_MS);
	const shiftedYear = shifted.getUTCFullYear();
	const shiftedMonth = String(shifted.getUTCMonth() + 1).padStart(2, '0');
	const shiftedDay = String(shifted.getUTCDate()).padStart(2, '0');
	return `${shiftedYear}-${shiftedMonth}-${shiftedDay}`;
}

export { DATE_PATTERN as STOCKHOLM_DATE_PATTERN };
