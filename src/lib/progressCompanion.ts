/**
 * MittPsykes enda följeslagare. Björnen Balder är samma djur i hela världen:
 * Mitt Hem, Kvällstugan, Framsteg och profilkorten. Det finns inget val att
 * spara; ett äldre sparat val i user_metadata läses inte längre.
 */
export const COMPANION = {
	id: 'bear',
	name: 'Balder',
	speciesName: 'Björn',
	temperament: 'Lugn och stadig'
} as const;

export type ProgressCompanionDayState = 'morning' | 'day' | 'evening' | 'night';
export type ProgressCompanionSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export type DashboardCompanionGreeting = {
	label: string;
	note: string;
};

type ProgressCompanionPresenceInput = {
	lastEntryDaysAgo?: number | null;
	hasEntries?: boolean;
};

// WebP i stället för PNG: 2416 kB -> 272 kB (-89%) utan synlig kvalitetsskillnad.
// Bilden är LCP-element på både Mitt Hem och Framsteg, och laddas dessutom en
// gång till som suddig bakgrund i .companion-hero::before - besparingen slår
// alltså dubbelt. PNG-originalet ligger kvar i static/ som källfil.
export const COMPANION_WORLD_SCENE_IMAGE = '/images/dashboard-lakeside-world.webp';

/**
 * Fallback för src-attributet. Pekar medvetet på den minsta varianten:
 * webbläsarens preload-scanner hinner starta en hämtning av src innan den
 * hunnit väga srcset-kandidaterna, och då ska det inte vara 272 kB som går
 * i onödan. Moderna webbläsare väljer ändå rätt kandidat ur srcset.
 */
export const COMPANION_WORLD_SCENE_FALLBACK = '/images/dashboard-lakeside-world-800.webp';

/** Responsiva varianter av scenbilden. Mobilen hämtar 74 kB i stället för 272 kB. */
export const COMPANION_WORLD_SCENE_SRCSET = [
	'/images/dashboard-lakeside-world-800.webp 800w',
	'/images/dashboard-lakeside-world-1200.webp 1200w',
	'/images/dashboard-lakeside-world.webp 1672w'
].join(', ');

/**
 * Hjältekortet är fullbrett på mobil och toppar runt 720 CSS-px på desktop.
 * Värdet styr vilken srcset-kandidat webbläsaren väljer.
 */
export const COMPANION_WORLD_SCENE_SIZES = '(max-width: 620px) 100vw, 720px';

/**
 * Egen, liten bild för den suddiga bakgrunden i .companion-hero::before.
 * Den ritas med blur(10px) på opacity 0.35 - 400 px är omöjligt att skilja
 * från originalet där, men sparar 260 kB. Utan den skulle srcset dessutom
 * kunna ge två nedladdningar: en liten till <img> och full storlek till
 * bakgrunden.
 */
export const COMPANION_WORLD_SCENE_BACKDROP = '/images/dashboard-lakeside-world-backdrop.webp';

/**
 * Framsteg använder samma plats som Mitt Hem, men från längre avstånd.
 * De här konstanterna är avsiktligt separata från COMPANION_WORLD_SCENE_*
 * ovan så att Mitt Hems bild, backdrop och laddningsstrategi inte påverkas.
 */
export const PROGRESS_CABIN_LAKESIDE_SCENE_IMAGE = '/images/scenes/progress-cabin-lakeside.webp';
export const PROGRESS_CABIN_LAKESIDE_SCENE_FALLBACK =
	'/images/scenes/progress-cabin-lakeside-800.webp';
export const PROGRESS_CABIN_LAKESIDE_SCENE_SRCSET = [
	'/images/scenes/progress-cabin-lakeside-800.webp 800w',
	'/images/scenes/progress-cabin-lakeside-1200.webp 1200w',
	'/images/scenes/progress-cabin-lakeside.webp 1672w'
].join(', ');

/**
 * Samma plats som ovan, men solnedgångsvarianten: solen står lågt över
 * bergen, stugan är tänd och en person sitter vid lägerelden nere till
 * höger. Den befolkade varianten används på den publika startsidan -
 * grundbilden ovan är tom på både människa och eld, och en tom strand läser
 * som en tapet i stället för en plats någon är på.
 *
 * Filnamnet säger afternoon, men motivet är sent gyllene ljus: det är
 * Framstegs eget namn på dygnsspannet 17-20, inte en beskrivning av ljuset.
 *
 * Egna konstanter i stället för ett byte av värdena ovan: den tomma varianten
 * beskriver samma plats mitt på dagen och ska gå att gå tillbaka till.
 */
export const PROGRESS_CABIN_LAKESIDE_SUNSET_SCENE_IMAGE =
	'/images/scenes/progress-cabin-lakeside-afternoon.webp';
export const PROGRESS_CABIN_LAKESIDE_SUNSET_SCENE_FALLBACK =
	'/images/scenes/progress-cabin-lakeside-afternoon-800.webp';
export const PROGRESS_CABIN_LAKESIDE_SUNSET_SCENE_SRCSET = [
	'/images/scenes/progress-cabin-lakeside-afternoon-800.webp 800w',
	'/images/scenes/progress-cabin-lakeside-afternoon-1200.webp 1200w',
	'/images/scenes/progress-cabin-lakeside-afternoon.webp 1672w'
].join(', ');

/**
 * Frilagd, bakåtvänd sittpose av Balder för den publika lägereldsscenen.
 * Den separata posen låter björnen följa personens blick ut över sjön utan
 * att ändra companion-preseten som används i den inloggade upplevelsen.
 */
export const PROGRESS_COMPANION_BEAR_BACK_SITTING_IMAGE =
	'/images/avatars/presets/bear-sitting-back.png';


/** Frilagt porträttfoto av Balder för profilkorten. */
export const COMPANION_PORTRAIT_IMAGE = '/images/avatars/presets/bear.png';

export function getProgressCompanionSeason(date = new Date()): ProgressCompanionSeason {
	const month = date.getMonth() + 1;

	if (month === 12 || month <= 2) return 'winter';
	if (month >= 9 && month <= 11) return 'autumn';
	if (month >= 3 && month <= 5) return 'spring';
	return 'summer';
}

export function getDashboardCompanionGreeting(date = new Date()): DashboardCompanionGreeting {
	const hour = date.getHours();

	if (hour >= 5 && hour <= 10) return { label: 'God morgon', note: 'En ny dag börjar.' };
	if (hour >= 11 && hour <= 16) return { label: 'God dag', note: 'En sak i taget.' };
	if (hour >= 17 && hour <= 21) return { label: 'God kväll', note: 'Du får landa här.' };
	return { label: 'God natt', note: 'Det får vara stilla nu.' };
}


export function getProgressCompanionDayState(date = new Date()): ProgressCompanionDayState {
	const { hour } = getProgressCompanionLocalTime(date);

	if (!Number.isFinite(hour)) return 'day';
	if (hour >= 5 && hour < 10) return 'morning';
	if (hour >= 10 && hour < 17) return 'day';
	if (hour >= 17 && hour < 20) return 'evening';
	return 'night';
}

/** Den lokala Stockholmstiden som den levande världen använder. */
export function getProgressCompanionLocalTime(date = new Date()) {
	const parts = new Intl.DateTimeFormat('sv-SE', {
		timeZone: 'Europe/Stockholm',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23'
	}).formatToParts(date);
	const valueFor = (type: 'hour' | 'minute') => Number(parts.find((part) => part.type === type)?.value);
	const hour = valueFor('hour');
	const minute = valueFor('minute');

	return {
		hour: Number.isFinite(hour) ? hour : 12,
		minute: Number.isFinite(minute) ? minute : 0
	};
}

export function getProgressCompanionDayStateLabel(state: ProgressCompanionDayState): string {
	if (state === 'morning') return 'Morgon';
	if (state === 'evening') return 'Eftermiddag';
	if (state === 'night') return 'Kväll';
	return 'Dag';
}

export function getProgressCompanionStatusMessage({
	lastEntryDaysAgo = null,
	hasEntries = false
}: ProgressCompanionPresenceInput): string {
	if (!hasEntries) return 'Jag är här när du vill börja.';
	if (lastEntryDaysAgo === null) return 'Fint att du kom tillbaka.';
	if (lastEntryDaysAgo <= 0) return 'Du är här idag. Det räcker fint.';
	if (lastEntryDaysAgo === 1) return 'Fint att du kom tillbaka igen.';
	if (lastEntryDaysAgo <= 6) return 'Skönt att se dig igen. Platsen har väntat lugnt.';
	if (lastEntryDaysAgo <= 21) return 'Det var ett tag sedan. Vi tar det varsamt härifrån.';
	return 'Välkommen tillbaka. Trädgården finns kvar, precis som den är.';
}

export function getProgressCompanionCarePhrases(
	input: ProgressCompanionPresenceInput = {}
): string[] {
	const { lastEntryDaysAgo = null, hasEntries = false } = input;

	if (!hasEntries) {
		return [
			'Jag är här när du vill börja.',
			'En liten stund räcker.',
			'Platsen kan växa långsamt.'
		];
	}

	if (lastEntryDaysAgo !== null && lastEntryDaysAgo >= 7) {
		return [
			'Välkommen tillbaka.',
			'Vi börjar mjukt igen.',
			'Trädgården finns kvar här.',
			'Det går bra att ta en rad i taget.'
		];
	}

	return [
		'Fint att du kom tillbaka.',
		'Skönt att se dig igen.',
		'Du har gett trädgården lite mer ljus.',
		'Jag finns kvar här med dig.'
	];
}
