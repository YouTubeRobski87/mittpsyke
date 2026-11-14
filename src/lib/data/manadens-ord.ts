// Månadens ord: ett ord, en kort reflektion, en öppen fråga och en artikel.
//
// Innehållet ligger i den här filen i stället för i en databas eller ett CMS.
// Det är tolv poster om året, skrivna av en människa, och varje ändring går
// genom samma granskning som resten av koden. Testet bredvid kontrollerar att
// artikeln finns och att texten håller sig till de redaktionella reglerna.
//
// Redaktionella regler: inga diagnoser, inga behandlingslöften, inga
// påståenden om hur läsaren mår, ingen press att reflektera och ingen skuld
// för den som inte återkommer. Exakt en fråga per månad.

export type MonthlyWord = {
	/** Månaden posten gäller, som ÅÅÅÅ-MM. */
	month: string;
	word: string;
	/** Kort, mänskligt skriven text. Två till fyra meningar. */
	reflection: string;
	/** En enda öppen fråga. */
	question: string;
	/** Sökväg till en publicerad artikel, t.ex. /blogg/amne/<ämne>/<slug>. */
	articlePath: string;
	/** Opublicerade poster visas aldrig, även om månaden har börjat. */
	published: boolean;
};

export const MONTHLY_WORDS: readonly MonthlyWord[] = [
	{
		month: '2026-11',
		word: 'Återhämtning',
		reflection:
			'Återhämtning är inte alltid vila. Ibland är det en promenad, en stängd dörr eller en kväll utan planer. Det ser olika ut för olika människor och olika veckor.',
		question: 'Vad skulle du vilja ge lite mer utrymme just nu?',
		articlePath: '/blogg/amne/oro-och-stress/aterhamtning-efter-manga-intryck',
		published: true
	},
	{
		month: '2026-12',
		word: 'Gränser',
		reflection:
			'En gräns behöver inte vara ett nej till någon annan. Den kan vara ett ja till något eget: en tid, en ork, en tystnad. De flesta gränser märks först när de saknas.',
		question: 'Var i din vardag skulle det få finnas lite mer plats för dig?',
		articlePath: '/blogg/amne/oro-och-stress/satta-granser-utan-daligt-samvete',
		published: true
	},
	{
		month: '2027-01',
		word: 'Tålamod',
		reflection:
			'Vissa saker rör sig långsammare än vi vill. Det betyder inte att de står stilla. Tålamod är ofta bara att låta något ta den tid det tar.',
		question: 'Vad i ditt liv får ta den tid det behöver?',
		articlePath: '/blogg/amne/sjalvkansla-och-sjalvbild/hard-mot-sig-sjalv',
		published: true
	}
];

/** Aktuell månad i svensk tid, som ÅÅÅÅ-MM. */
export function getStockholmMonthKey(date: Date = new Date()): string {
	const parts = new Intl.DateTimeFormat('sv-SE', {
		timeZone: 'Europe/Stockholm',
		year: 'numeric',
		month: '2-digit'
	}).formatToParts(date);
	const year = parts.find((part) => part.type === 'year')?.value ?? '';
	const month = parts.find((part) => part.type === 'month')?.value ?? '';
	return `${year}-${month}`;
}

/**
 * Ordet som ska visas: den senaste publicerade posten vars månad har börjat.
 * Saknas en post för innevarande månad ligger föregående kvar, så sidan står
 * aldrig tom för att en text inte hann bli klar. Null först när ingenting är
 * publicerat alls.
 */
export function getCurrentMonthlyWord(
	date: Date = new Date(),
	words: readonly MonthlyWord[] = MONTHLY_WORDS
): MonthlyWord | null {
	const currentMonth = getStockholmMonthKey(date);
	return (
		words
			.filter((entry) => entry.published && entry.month <= currentMonth)
			.sort((a, b) => b.month.localeCompare(a.month))[0] ?? null
	);
}

/** "november 2026" av "2026-11". */
export function formatMonthLabel(month: string): string {
	const [year, monthNumber] = month.split('-').map(Number);
	const name = new Intl.DateTimeFormat('sv-SE', { month: 'long', timeZone: 'UTC' }).format(
		new Date(Date.UTC(year, monthNumber - 1, 1))
	);
	return `${name} ${year}`;
}
