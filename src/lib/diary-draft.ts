// Ett anonymt dagboksutkast ska överleva vägen från startsidan, via den
// anonyma skrivytan, hela vägen in i /register och /dagbok/checkin.
//
// Tidigare fanns två nycklar utan koppling: GuestQuickEntry skrev till
// `mittpsyke_guest_entry` medan /register och /dagbok/checkin läste
// `mittpsyke_temp_entry`. Texten försvann därför i steget "Spara och skapa
// konto".
//
// Kanonisk nyckel för anonyma dagboksutkast är `mittpsyke_guest_entry`.
// Endast den skrivs av dagboksflödet. `mittpsyke_temp_entry` behålls som
// läsbar äldre nyckel eftersom chattens "ta med dig till dagboken" fortfarande
// lämnar över text där. Den läses som fallback, men skrivs aldrig härifrån —
// då hade vi fått två konkurrerande sanningar igen.

import { browser } from '$app/environment';

/** Kanonisk nyckel. Anonyma dagboksutkast skrivs alltid hit. */
export const DIARY_DRAFT_KEY = 'mittpsyke_guest_entry';

/**
 * Äldre nyckel. Skrivs av chattens överlämning till dagboken och av utkast
 * som sparats innan den kanoniska nyckeln fanns. Läses, men skrivs aldrig här.
 */
export const LEGACY_DIARY_DRAFT_KEY = 'mittpsyke_temp_entry';

/** Tidpunkt för senaste sparning. Ren metadata, aldrig text. */
const DIARY_DRAFT_SAVED_AT_KEY = 'mittpsyke_guest_entry_saved_at';

/**
 * Överlämning från startsidans hero till skrivytan. Ligger i sessionStorage
 * och konsumeras en gång, så den kan aldrig bli ett andra långlivat utkast.
 */
const DIARY_DRAFT_HANDOFF_KEY = 'mittpsyke_diary_draft_handoff';

/** Engångsöverlämning till den inloggade dagbokseditorn, utan URL-läckage. */
const DIARY_CHECKIN_PREFILL_KEY = 'mittpsyke_diary_checkin_prefill';

type SessionStorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function readLocal(key: string): string | null {
	if (!browser) return null;
	try {
		return window.localStorage.getItem(key);
	} catch {
		// Privatläge eller full kvot. Utkastet får då bara inte följa med.
		return null;
	}
}

function writeLocal(key: string, value: string) {
	if (!browser) return;
	try {
		window.localStorage.setItem(key, value);
	} catch {
		// Lagring får aldrig blockera skrivandet.
	}
}

function removeLocal(key: string) {
	if (!browser) return;
	try {
		window.localStorage.removeItem(key);
	} catch {
		// Ignoreras medvetet.
	}
}

/**
 * Utkast har historiskt lagrats både som ren text och som JSON med `content`.
 * Båda formaten måste fortsätta gå att läsa så att gamla lokala utkast inte
 * går förlorade.
 */
export function parseDiaryDraft(value: string | null): string {
	if (!value) return '';

	try {
		const parsed: unknown = JSON.parse(value);
		if (typeof parsed === 'string') return parsed.trim();
		if (parsed && typeof parsed === 'object' && 'content' in parsed) {
			const content = (parsed as { content?: unknown }).content;
			if (typeof content === 'string') return content.trim();
		}
	} catch {
		return value.trim();
	}

	return value.trim();
}

/** Kanonisk nyckel först, äldre nyckel som fallback. */
export function readDiaryDraft(): string {
	const canonical = parseDiaryDraft(readLocal(DIARY_DRAFT_KEY));
	if (canonical) return canonical;

	return parseDiaryDraft(readLocal(LEGACY_DIARY_DRAFT_KEY));
}

export function writeDiaryDraft(text: string) {
	const trimmed = text.trim();
	if (!trimmed) {
		clearDiaryDraft();
		return;
	}

	writeLocal(DIARY_DRAFT_KEY, text);
	writeLocal(DIARY_DRAFT_SAVED_AT_KEY, String(Date.now()));
}

/** Rensar båda nycklarna så att inget utkast blir kvar och dyker upp igen. */
export function clearDiaryDraft() {
	removeLocal(DIARY_DRAFT_KEY);
	removeLocal(LEGACY_DIARY_DRAFT_KEY);
	removeLocal(DIARY_DRAFT_SAVED_AT_KEY);
}

/**
 * Hela dygn sedan utkastet senast sparades, eller null om tidpunkten saknas.
 * Aggregerat värde för mätning — aldrig text.
 */
export function getDaysSinceDiaryDraftSaved(now = Date.now()): number | null {
	const raw = readLocal(DIARY_DRAFT_SAVED_AT_KEY);
	if (!raw) return null;

	const savedAt = Number(raw);
	if (!Number.isFinite(savedAt) || savedAt <= 0 || savedAt > now) return null;

	return Math.floor((now - savedAt) / 86_400_000);
}

export function writeDiaryDraftHandoff(text: string) {
	if (!browser) return;
	const trimmed = text.trim();
	if (!trimmed) return;

	try {
		window.sessionStorage.setItem(DIARY_DRAFT_HANDOFF_KEY, trimmed);
	} catch {
		// Utan sessionStorage följer texten bara inte med till skrivytan.
	}
}

/** Läser och tar bort överlämningen i ett steg. Gäller en gång. */
export function consumeDiaryDraftHandoff(): string {
	if (!browser) return '';

	try {
		const value = window.sessionStorage.getItem(DIARY_DRAFT_HANDOFF_KEY);
		if (value) window.sessionStorage.removeItem(DIARY_DRAFT_HANDOFF_KEY);
		return value?.trim() ?? '';
	} catch {
		return '';
	}
}

/**
 * Lämnar över personlig text till dagbokseditorn utan query string, historik
 * eller referrer. Värdet är flikbundet och konsumeras en gång.
 */
export function writeDiaryCheckinPrefill(
	text: string,
	storage: SessionStorageLike | null = browser ? window.sessionStorage : null
) {
	const trimmed = text.trim();
	if (!trimmed || !storage) return;
	try {
		storage.setItem(DIARY_CHECKIN_PREFILL_KEY, trimmed);
	} catch {
		// Om sessionStorage saknas navigerar användaren vidare utan prefill.
	}
}

export function consumeDiaryCheckinPrefill(
	storage: SessionStorageLike | null = browser ? window.sessionStorage : null
): string {
	if (!storage) return '';
	try {
		const value = storage.getItem(DIARY_CHECKIN_PREFILL_KEY);
		storage.removeItem(DIARY_CHECKIN_PREFILL_KEY);
		return value?.trim() ?? '';
	} catch {
		return '';
	}
}
