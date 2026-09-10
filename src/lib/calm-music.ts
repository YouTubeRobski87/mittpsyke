// Lugn musik – spårlista och ren logik för den globala musikspelaren.
//
// Filen innehåller inget ljud och ingen webbläsarkod, så allt här kan testas
// i Node. Själva Audio-elementet ägs av calm-music-player.svelte.ts.

export type CalmMusicTrack = {
	id: string;
	title: string;
	/** Neutral beskrivning av klangen. Beskriver, lovar ingen effekt. */
	summary: string;
	/** Publik URL. Filnamnen är ASCII, så ingen kodning behövs. */
	src: string;
};

export const CALM_MUSIC_TRACKS: readonly CalmMusicTrack[] = [
	{
		id: 'stilla-sjo',
		title: 'Stilla sjö',
		summary: 'Varm och meditativ.',
		src: '/audio/musik/stilla_sjo.mp3'
	},
	{
		id: 'mjuka-andetag',
		title: 'Mjuka andetag',
		summary: 'Luftig med mjuka klocktoner.',
		src: '/audio/musik/mjuka_andetag.mp3'
	},
	{
		id: 'trygg-natt',
		title: 'Trygg natt',
		summary: 'Mörkare och ombonad.',
		src: '/audio/musik/trygg_natt.mp3'
	}
];

/** Ankare till fullspelaren på övningssidan. Minispelaren länkar hit. */
export const CALM_MUSIC_PLAYER_HREF = '/ovningar#lugn-musik';

export const CALM_MUSIC_STORAGE_KEY = 'mittpsyke:calm-music';

export const DEFAULT_CALM_MUSIC_VOLUME = 0.7;

export type CalmMusicPreferences = {
	trackId: string;
	volume: number;
	repeat: boolean;
};

export const DEFAULT_CALM_MUSIC_PREFERENCES: CalmMusicPreferences = {
	trackId: CALM_MUSIC_TRACKS[0].id,
	volume: DEFAULT_CALM_MUSIC_VOLUME,
	repeat: false
};

export function getCalmMusicTrack(id: string): CalmMusicTrack | undefined {
	return CALM_MUSIC_TRACKS.find((track) => track.id === id);
}

export function getTrackIndex(id: string): number {
	const index = CALM_MUSIC_TRACKS.findIndex((track) => track.id === id);
	return index === -1 ? 0 : index;
}

/** Nästa spår, med omslag från sista till första. */
export function getNextTrackId(id: string): string {
	const index = getTrackIndex(id);
	return CALM_MUSIC_TRACKS[(index + 1) % CALM_MUSIC_TRACKS.length].id;
}

/** Föregående spår, med omslag från första till sista. */
export function getPreviousTrackId(id: string): string {
	const index = getTrackIndex(id);
	const length = CALM_MUSIC_TRACKS.length;
	return CALM_MUSIC_TRACKS[(index - 1 + length) % length].id;
}

export function isLastTrack(id: string): boolean {
	return getTrackIndex(id) === CALM_MUSIC_TRACKS.length - 1;
}

export function clampVolume(value: number): number {
	if (!Number.isFinite(value)) return DEFAULT_CALM_MUSIC_VOLUME;
	return Math.min(1, Math.max(0, value));
}

/**
 * Formaterar sekunder som m:ss. Okänd längd (NaN, Infinity, negativ) visas
 * som streck i stället för "NaN:NaN" medan metadata laddas.
 */
export function formatPlaybackTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '–:––';
	const whole = Math.floor(seconds);
	const minutes = Math.floor(whole / 60);
	const rest = whole % 60;
	return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

/** Tid i ord för skärmläsare, t.ex. "1 minut 5 sekunder". */
export function describePlaybackTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return 'okänd tid';
	const whole = Math.floor(seconds);
	const minutes = Math.floor(whole / 60);
	const rest = whole % 60;
	const minuteText = `${minutes} ${minutes === 1 ? 'minut' : 'minuter'}`;
	const secondText = `${rest} ${rest === 1 ? 'sekund' : 'sekunder'}`;
	if (minutes === 0) return secondText;
	return rest === 0 ? minuteText : `${minuteText} ${secondText}`;
}

/**
 * Läser sparade inställningar. Allt okänt eller trasigt faller tillbaka på
 * standardvärden – innehållet i localStorage kan vara vad som helst.
 * Uppspelningsstatus sparas aldrig, så en omladdning startar aldrig ljud.
 */
export function parseCalmMusicPreferences(raw: string | null): CalmMusicPreferences {
	if (!raw) return { ...DEFAULT_CALM_MUSIC_PREFERENCES };

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return { ...DEFAULT_CALM_MUSIC_PREFERENCES };
	}

	if (typeof parsed !== 'object' || parsed === null) {
		return { ...DEFAULT_CALM_MUSIC_PREFERENCES };
	}

	const record = parsed as Record<string, unknown>;
	const trackId =
		typeof record.trackId === 'string' && getCalmMusicTrack(record.trackId)
			? record.trackId
			: DEFAULT_CALM_MUSIC_PREFERENCES.trackId;
	const volume =
		typeof record.volume === 'number'
			? clampVolume(record.volume)
			: DEFAULT_CALM_MUSIC_PREFERENCES.volume;
	const repeat = typeof record.repeat === 'boolean' ? record.repeat : false;

	return { trackId, volume, repeat };
}
