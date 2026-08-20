// Delad logik för sektionen "Kanske värt att prova" på Framsteg.
//
// Modulen håller ihop tre saker: typerna som servern fyller i, den svenska
// copyn för varje förslagstyp, och urvalet på klienten. Själva underlaget
// byggs i $lib/server/diary-support-suggestions.
//
// Språkregel för hela modulen: samband, aldrig orsak. Ingen text får säga att
// något gör att användaren mår bättre. Den får bara säga att något förekommer
// oftare i vissa perioder. Ingen text får heller formuleras som en uppmaning,
// en behandling eller ett mål.

/** Vardagliga förslagstyper. Varje typ måste kunna härledas ur användarens egen historik. */
export type SupportSuggestionKind = 'walk' | 'contact' | 'rest' | 'creative' | 'write' | 'smaller-day';

/**
 * 'everyday' är grundläget. 'gentle' används när den senaste tiden ligger lågt,
 * och gör förslaget mindre i stället för att byta ut det mot något större.
 */
export type SupportTone = 'everyday' | 'gentle';

export interface SupportSuggestion {
	/** Stabil nyckel så att svar och rotation kan följa förslaget mellan renderingar. */
	id: string;
	kind: SupportSuggestionKind;
	tone: SupportTone;
	title: string;
	/** Beskriver sambandet i användarens data. Aldrig ett påstående om orsak. */
	body: string;
	/** Den räknade grunden, så att förslaget går att granska. */
	evidence: string;
	/** Temat förslaget kommer ur, används för att hämta användarens egna exempel. */
	topicLabel: string | null;
}

export interface SupportExample {
	topicLabel: string;
	/** Formaterat datum för raden exemplet kommer från. */
	date: string;
	/** Kort citat ur användarens egen text, eller null när texten inte bör visas. */
	quote: string | null;
	/** Neutral sammanfattning som alltid går att visa i stället för citatet. */
	summary: string;
}

export interface SupportView {
	/** Sant när underlaget inte räcker för personliga förslag. Då visas inga förslag alls. */
	learning: boolean;
	/** Sant när säkerhetslogiken har stoppat vardagsförslagen. Då visas ingenting. */
	withheldForSafety: boolean;
	/** Sant när den senaste tiden ligger lågt. Styr ton och hur många förslag som visas. */
	heavyPeriod: boolean;
	suggestions: SupportSuggestion[];
	/** Teman som återkommer i lättare perioder. Visas som "Det som verkar ge lite andrum". */
	breathingRoom: string[];
	examples: SupportExample[];
}

export const EMPTY_SUPPORT_VIEW: SupportView = {
	learning: true,
	withheldForSafety: false,
	heavyPeriod: false,
	suggestions: [],
	breathingRoom: [],
	examples: []
};

export const SUPPORT_LEARNING_COPY = 'Vi lär fortfarande känna dina mönster.';
export const SUPPORT_LEARNING_DETAIL =
	'Fortsätt registrera hur du mår så blir den här delen mer personlig med tiden.';
export const SUPPORT_INTRO_COPY =
	'Det här kommer ur dina egna registreringar. Det är något att fundera över, inte något du behöver göra.';

type SuggestionCopy = { title: string; body: string };

/**
 * Copyn är fast och deterministisk. Ingen språkmodell formulerar de här
 * meningarna, och ingen av dem får innehålla ett kausalt påstående.
 */
const SUGGESTION_COPY: Record<SupportSuggestionKind, Record<SupportTone, SuggestionCopy>> = {
	walk: {
		everyday: {
			title: 'En kort promenad?',
			body: 'Promenader och rörelse förekommer oftare i dina texter från dagar med högre registreringar. Om det känns möjligt kanske några minuter ute är värt att prova idag.'
		},
		gentle: {
			title: 'Några minuter ute?',
			body: 'Rörelse förekommer oftare i dina lättare dagar. Det behöver inte bli en runda — några minuter utanför dörren räcker som försök.'
		}
	},
	contact: {
		everyday: {
			title: 'Någon att höra av sig till?',
			body: 'Social kontakt återkommer i flera av dina stabilare perioder. Kanske finns det någon du skulle vilja skriva en rad till.'
		},
		gentle: {
			title: 'En rad till någon?',
			body: 'Sällskap återkommer i dina lättare dagar. Det behöver inte bli ett samtal — ett kort meddelande är också något.'
		}
	},
	rest: {
		everyday: {
			title: 'Lite andrum?',
			body: 'Vila och pauser nämns oftare i texter från dagar med högre registreringar. Kanske finns det en stund idag som får vara ledig.'
		},
		gentle: {
			title: 'En paus som inte ska leda någonstans',
			body: 'Vila återkommer i dina lättare dagar. Det räcker med en kort stund där inget behöver hända.'
		}
	},
	creative: {
		everyday: {
			title: 'Något med händerna?',
			body: 'Skapande förekommer oftare i dina texter från dagar med högre registreringar. Kanske finns det något litet du skulle vilja plocka fram.'
		},
		gentle: {
			title: 'Något litet med händerna?',
			body: 'Skapande återkommer i dina lättare dagar. Det behöver inte bli färdigt, eller ens påbörjat på riktigt.'
		}
	},
	write: {
		everyday: {
			title: 'Skriv av dig en stund',
			body: 'Under perioder där du skrivit flera korta reflektioner har ditt mående varit lättare att följa över tid.'
		},
		gentle: {
			title: 'Några ord räcker',
			body: 'Under perioder med flera korta rader har måendet varit lättare att följa. Det behöver inte bli mer än en mening.'
		}
	},
	'smaller-day': {
		everyday: {
			title: 'Ta dagen i mindre delar',
			body: 'När flera saker belastar dig samtidigt brukar dina registreringar ligga lägre. Du behöver inte lösa allt idag.'
		},
		gentle: {
			title: 'Gör dagen mindre',
			body: 'Dina svårare perioder innehåller ofta flera belastningar samtidigt. Det kanske räcker att välja en enda sak att ta hand om just nu.'
		}
	}
};

export function buildSupportCopy(kind: SupportSuggestionKind, tone: SupportTone): SuggestionCopy {
	return SUGGESTION_COPY[kind][tone];
}

// ── Användarens svar ──
// Svaren är en preferenssignal, aldrig en skattning. De lagras separat från
// dagboken och får aldrig gå in i måendehistoriken.

export type SupportResponse = 'fits' | 'not-today';

export interface SupportPreference {
	accepted: number;
	declined: number;
	/** Datumnyckel, YYYY-MM-DD. Ett avböjt förslag vilar resten av dagen. */
	lastDeclinedDate: string | null;
}

export type SupportPreferences = Record<string, SupportPreference>;

export const SUPPORT_PREFERENCES_STORAGE_KEY = 'mittpsyke:support-preferences:v1';

export interface SupportStorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

function toDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function toCount(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function toPreference(value: unknown): SupportPreference | null {
	if (typeof value !== 'object' || value === null) return null;
	const record = value as Record<string, unknown>;
	const lastDeclinedDate = record.lastDeclinedDate;
	return {
		accepted: toCount(record.accepted),
		declined: toCount(record.declined),
		lastDeclinedDate: typeof lastDeclinedDate === 'string' ? lastDeclinedDate : null
	};
}

/** Trasig eller manipulerad lagring ska aldrig kunna välta sektionen. */
export function readSupportPreferences(
	storage: SupportStorageLike | null | undefined
): SupportPreferences {
	if (!storage) return {};
	try {
		const raw = storage.getItem(SUPPORT_PREFERENCES_STORAGE_KEY);
		if (!raw) return {};
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== 'object' || parsed === null) return {};
		const preferences: SupportPreferences = {};
		for (const [kind, value] of Object.entries(parsed as Record<string, unknown>)) {
			const preference = toPreference(value);
			if (preference) preferences[kind] = preference;
		}
		return preferences;
	} catch {
		return {};
	}
}

export function recordSupportResponse(
	storage: SupportStorageLike | null | undefined,
	kind: SupportSuggestionKind,
	response: SupportResponse,
	now: Date = new Date()
): SupportPreferences {
	const preferences = readSupportPreferences(storage);
	const current = preferences[kind] ?? { accepted: 0, declined: 0, lastDeclinedDate: null };
	const next: SupportPreference =
		response === 'fits'
			? { ...current, accepted: current.accepted + 1 }
			: { ...current, declined: current.declined + 1, lastDeclinedDate: toDateKey(now) };
	const updated: SupportPreferences = { ...preferences, [kind]: next };

	if (storage) {
		try {
			storage.setItem(SUPPORT_PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
		} catch {
			// Lagring kan vara avstängd. Preferensen får då bara gälla den här sessionen.
		}
	}

	return updated;
}

/** Högst två förslag åt gången, och bara ett när den senaste tiden ligger lågt. */
export function getSupportVisibleLimit(view: SupportView): number {
	return view.heavyPeriod ? 1 : 2;
}

/**
 * Rangordnar poolen efter vad användaren själv har markerat som relevant och
 * lägger avböjda förslag åt sidan resten av dagen. Rotationen låter
 * "Visa något annat" stega vidare i poolen utan att räknas som ett avböjande.
 */
export function selectVisibleSuggestions(
	view: SupportView,
	preferences: SupportPreferences,
	options: { rotation?: number; now?: Date } = {}
): SupportSuggestion[] {
	if (view.withheldForSafety || view.learning) return [];

	const todayKey = toDateKey(options.now ?? new Date());
	const rotation = Math.max(0, Math.floor(options.rotation ?? 0));
	const available = view.suggestions.filter(
		(suggestion) => preferences[suggestion.kind]?.lastDeclinedDate !== todayKey
	);
	if (available.length === 0) return [];

	const ranked = available
		.map((suggestion, index) => {
			const preference = preferences[suggestion.kind];
			const score = (preference?.accepted ?? 0) - (preference?.declined ?? 0);
			return { suggestion, index, score };
		})
		.sort((a, b) => b.score - a.score || a.index - b.index)
		.map((item) => item.suggestion);

	const limit = Math.min(getSupportVisibleLimit(view), ranked.length);
	const offset = rotation % ranked.length;
	return Array.from({ length: limit }, (_, step) => ranked[(offset + step) % ranked.length]);
}

/** Exempel hör till ett tema. Utan valt tema visas det första temat som har exempel. */
export function getExamplesForTopic(view: SupportView, topicLabel: string | null): SupportExample[] {
	const label = topicLabel ?? view.examples[0]?.topicLabel ?? null;
	if (!label) return [];
	return view.examples.filter((example) => example.topicLabel === label).slice(0, 4);
}

/** Teman som faktiskt har sparade exempel att visa. */
export function getExampleTopics(view: SupportView): string[] {
	return [...new Set(view.examples.map((example) => example.topicLabel))];
}
