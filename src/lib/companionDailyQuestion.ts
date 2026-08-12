// Följeslagarens dagliga fråga. Ren, delad modul: både servern (som väljer och
// sparar dagens fråga) och Mitt Hem (som visar den) läser samma frågebank här.
//
// Modulen känner inte till databasen, användaren eller UI:t - den vet bara
// vilka frågor som finns, vilken av dem en viss dag hör till, och vad
// följeslagaren svarar. Håll det så: frågan ska kunna få fler bärare senare
// utan att den här filen behöver veta om dem.

export type CompanionDailyAnswer = {
	id: string;
	/** Kort etikett i svarschipet. Se MAX_COMPANION_DAILY_ANSWER_LABEL_LENGTH. */
	label: string;
	/** Följeslagarens direkta reaktion. Kort, varm, aldrig terapeutisk. */
	reaction: string;
};

export type CompanionDailyQuestion = {
	id: string;
	text: string;
	answers: CompanionDailyAnswer[];
};

/** Vad som hänt med dagens fråga. Hoppa över räknas som hanterad. */
export type CompanionDailyStatus = 'pending' | 'answered' | 'skipped';

/**
 * Layoutkontrakt, inte kosmetik: fyra chip med korta etiketter är det som får
 * plats i det kompakta kortet på 320 px utan att skapa horisontell overflow.
 * Testerna vaktar värdena så en ny fråga inte tyst kan spräcka mobilen.
 */
export const MAX_COMPANION_DAILY_ANSWERS = 4;
export const MAX_COMPANION_DAILY_ANSWER_LABEL_LENGTH = 26;
export const MAX_COMPANION_DAILY_QUESTION_TEXT_LENGTH = 64;

/** Hur länge följeslagarens reaktion syns innan bubblan tonar bort. */
export const COMPANION_DAILY_REACTION_DURATION_MS = 5_200;

const STOCKHOLM_TIME_ZONE = 'Europe/Stockholm';
const DAY_MS = 24 * 60 * 60 * 1000;

const stockholmDateFormatter = new Intl.DateTimeFormat('sv-CA', {
	timeZone: STOCKHOLM_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

/**
 * Kalenderdagen i Stockholm som ISO-datum (YYYY-MM-DD). Samma tidszon och
 * format som resten av MittPsyke redan använder för dygnsgränser, så dagens
 * fråga byts vid samma midnatt som dagbokens dagar.
 */
export function getStockholmDateKey(date: Date = new Date()): string {
	return stockholmDateFormatter.format(date);
}

/**
 * Frågebanken. Frågorna ska gå att svara på med ett tryck, utan kliniska
 * skalor, och varje svar har en egen reaktion från följeslagaren.
 *
 * Copy-regler (se docs/NORTH_STAR.md): kort, varm men inte överdrivet
 * emotionell, aldrig diagnostiserande, aldrig skuldbeläggande, och aldrig
 * formuleringar där följeslagaren gör sig beroende av att användaren återvänder.
 * "Vet inte" ska alltid vara ett fullgott svar - därför finns det med överallt.
 */
export const COMPANION_DAILY_QUESTIONS: readonly CompanionDailyQuestion[] = [
	{
		id: 'daily-lighten-day',
		text: 'Vad skulle göra idag lite lättare?',
		answers: [
			{ id: 'calm', label: 'Få lite lugn', reaction: 'Då tar vi det lugnt idag.' },
			{ id: 'talk', label: 'Prata med någon', reaction: 'Det kan vara ett bra steg.' },
			{ id: 'outside', label: 'Komma ut en stund', reaction: 'Lite luft låter inte dumt.' },
			{ id: 'unsure', label: 'Vet inte', reaction: 'Det är okej. Vi behöver inte veta än.' }
		]
	},
	{
		id: 'daily-energy',
		text: 'Hur mycket ork känns det som att du har idag?',
		answers: [
			{ id: 'plenty', label: 'Ganska mycket', reaction: 'Fint. Den får räcka som den vill.' },
			{ id: 'enough', label: 'Lagom', reaction: 'Lagom räcker längre än man tror.' },
			{ id: 'little', label: 'Inte så mycket', reaction: 'Då tar vi dagen i den takten.' },
			{ id: 'unsure', label: 'Vet inte', reaction: 'Det är okej. Vi känner efter under dagen.' }
		]
	},
	{
		id: 'daily-focus',
		text: 'Vad behöver mest plats idag?',
		answers: [
			{ id: 'rest', label: 'Vila', reaction: 'Vila får ta plats.' },
			{ id: 'task', label: 'Något jag måste göra', reaction: 'En sak i taget.' },
			{ id: 'thought', label: 'En tanke jag bär på', reaction: 'Den får finnas här.' },
			{ id: 'unsure', label: 'Vet inte', reaction: 'Det är okej. Den kan få komma senare.' }
		]
	},
	{
		id: 'daily-kindness',
		text: 'Vad vore snällast mot dig själv idag?',
		answers: [
			{ id: 'slow', label: 'Sakta ner', reaction: 'Långsamt är också framåt.' },
			{ id: 'enjoy', label: 'Göra något jag gillar', reaction: 'Det låter fint.' },
			{ id: 'release', label: 'Släppa ett krav', reaction: 'Ett krav mindre är gott nog.' },
			{ id: 'unsure', label: 'Vet inte', reaction: 'Det är okej. Snällhet får vara liten.' }
		]
	},
	{
		id: 'daily-company',
		text: 'Eget utrymme eller lite sällskap idag?',
		answers: [
			{ id: 'space', label: 'Eget utrymme', reaction: 'Då håller jag mig lugn här borta.' },
			{ id: 'company', label: 'Lite sällskap', reaction: 'Jag sitter kvar en stund.' },
			{ id: 'both', label: 'Lite av båda', reaction: 'Det får skifta under dagen.' },
			{ id: 'unsure', label: 'Vet inte', reaction: 'Det är okej. Vi ser hur det blir.' }
		]
	},
	{
		id: 'daily-small-good',
		text: 'Vad vore en liten bra sak idag?',
		answers: [
			{ id: 'own-time', label: 'En stund för mig själv', reaction: 'Den stunden är din.' },
			{ id: 'fresh-air', label: 'Lite frisk luft', reaction: 'Lite luft låter inte dumt.' },
			{ id: 'simple', label: 'Något enkelt jag klarar', reaction: 'Enkelt räcker fint.' },
			{ id: 'unsure', label: 'Vet inte', reaction: 'Det är okej. Den kan dyka upp ändå.' }
		]
	}
];

export function getCompanionDailyQuestionById(
	questionId: string | null | undefined
): CompanionDailyQuestion | null {
	if (!questionId) return null;
	return COMPANION_DAILY_QUESTIONS.find((question) => question.id === questionId) ?? null;
}

export function getCompanionDailyAnswer(
	questionId: string | null | undefined,
	answerId: string | null | undefined
): CompanionDailyAnswer | null {
	if (!answerId) return null;
	const question = getCompanionDailyQuestionById(questionId);
	if (!question) return null;
	return question.answers.find((answer) => answer.id === answerId) ?? null;
}

/** Följeslagarens svar på ett valt alternativ, eller null om svaret inte finns. */
export function getCompanionDailyReaction(
	questionId: string | null | undefined,
	answerId: string | null | undefined
): string | null {
	return getCompanionDailyAnswer(questionId, answerId)?.reaction ?? null;
}

/** Dygn sedan epoken för en Stockholm-datumnyckel. Stabilt, inte tidsberoende. */
function dayIndexFromDateKey(dateKey: string): number {
	const [year, month, day] = dateKey.split('-').map(Number);
	if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return 0;
	return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

/** Liten stabil sträng-hash. Samma teknik som dailyPrompt.ts redan använder. */
function hashString(value: string): number {
	let hash = 0;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 31 + value.charCodeAt(index)) & 0xffffffff;
	}
	return Math.abs(hash);
}

/**
 * Dagens fråga, deterministiskt vald ur banken. Refresh kan aldrig ge en ny
 * fråga: valet beror bara på användaren och kalenderdagen, aldrig på slump
 * eller på när på dygnet sidan laddas.
 *
 * Dagindexet stegar ett steg per dygn, så två dagar i rad aldrig kan ge samma
 * fråga så länge banken har fler än en fråga. Användarnyckeln gör att alla inte
 * får exakt samma fråga samma dag.
 */
export function getCompanionDailyQuestionForDay(
	dateKey: string,
	userKey = ''
): CompanionDailyQuestion {
	const bankSize = COMPANION_DAILY_QUESTIONS.length;
	const index = (hashString(userKey) + dayIndexFromDateKey(dateKey)) % bankSize;
	return COMPANION_DAILY_QUESTIONS[index];
}

export type CompanionDailyState = {
	dateKey: string;
	questionId: string;
	status: CompanionDailyStatus;
	answerId: string | null;
	/** Antal dagar användaren faktiskt svarat. Driver bond och trädgård. */
	answeredDayCount: number;
};

/**
 * Om frågan ska visas just nu. Utloggade och gästbesök påverkas aldrig, och en
 * dag som redan är hanterad (svarad ELLER överhoppad) visar aldrig frågan igen.
 */
export function shouldShowCompanionDailyQuestion(input: {
	isAnonymous: boolean;
	state: CompanionDailyState | null;
}): boolean {
	if (input.isAnonymous || !input.state) return false;
	return input.state.status === 'pending';
}
