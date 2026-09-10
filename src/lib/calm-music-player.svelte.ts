// Global spelare för Lugn musik.
//
// En enda instans för hela appen, så att musiken kan fortsätta när användaren
// navigerar internt. Rotlayouten anropar attach() en gång i en $effect och
// får tillbaka en städfunktion; fullspelaren och minispelaren läser bara
// tillståndet och anropar metoderna. Ingen komponent skapar egna Audio-objekt
// eller egna ljudlyssnare.
//
// Regler som gäller hela filen:
// - Ljud startar bara från en metod som anropats av ett aktivt användarval.
// - Uppspelningsstatus sparas aldrig, bara spår, volym och upprepning.
// - src sätts först när det behövs (fullspelaren visas eller play trycks),
//   så vanliga sidvisningar hämtar inget ljud alls.

import { untrack } from 'svelte';
import {
	CALM_MUSIC_STORAGE_KEY,
	DEFAULT_CALM_MUSIC_PREFERENCES,
	clampVolume,
	getCalmMusicTrack,
	getNextTrackId,
	getPreviousTrackId,
	isLastTrack,
	parseCalmMusicPreferences,
	type CalmMusicTrack
} from '$lib/calm-music';

export type CalmMusicStatus = 'idle' | 'playing' | 'paused' | 'ended';

type AudioListener = [keyof HTMLMediaElementEventMap, () => void];

class CalmMusicPlayer {
	trackId = $state(DEFAULT_CALM_MUSIC_PREFERENCES.trackId);
	status = $state<CalmMusicStatus>('idle');
	currentTime = $state(0);
	duration = $state(Number.NaN);
	volume = $state(DEFAULT_CALM_MUSIC_PREFERENCES.volume);
	repeat = $state(DEFAULT_CALM_MUSIC_PREFERENCES.repeat);
	error = $state<string | null>(null);
	/** Sant när användaren startat musik under besöket. Styr minispelaren. */
	sessionActive = $state(false);
	/** Antal monterade fullspelare. Minispelaren döljs när en fullspelare syns. */
	fullPlayerCount = $state(0);

	private audio: HTMLAudioElement | null = null;

	get track(): CalmMusicTrack {
		return getCalmMusicTrack(this.trackId) ?? getCalmMusicTrack(DEFAULT_CALM_MUSIC_PREFERENCES.trackId)!;
	}

	get isPlaying(): boolean {
		return this.status === 'playing';
	}

	get showMiniPlayer(): boolean {
		return this.sessionActive && this.fullPlayerCount === 0;
	}

	/**
	 * Skapar spelarens enda Audio-element och kopplar lyssnarna. Anropas från
	 * rotlayoutens $effect i webbläsaren; returnerar städfunktionen.
	 */
	attach(): () => void {
		// untrack: anroparens $effect får inte bli beroende av tillståndet som
		// läses och skrivs här, annars kör effekten om sig själv i en loop.
		return untrack(() => this.attachAudio());
	}

	private attachAudio(): () => void {
		if (typeof window === 'undefined' || this.audio) return () => {};

		const prefs = parseCalmMusicPreferences(readStorage());
		this.trackId = prefs.trackId;
		this.volume = prefs.volume;
		this.repeat = prefs.repeat;

		const audio = new Audio();
		audio.preload = 'metadata';
		audio.volume = this.volume;
		audio.loop = this.repeat;
		this.audio = audio;

		const listeners: AudioListener[] = [
			['play', () => this.onPlay()],
			['pause', () => this.onPause()],
			['ended', () => this.onEnded()],
			['timeupdate', () => this.syncTime()],
			['loadedmetadata', () => this.syncDuration()],
			['durationchange', () => this.syncDuration()],
			['error', () => this.onError()]
		];
		for (const [type, handler] of listeners) audio.addEventListener(type, handler);

		// Barnkomponenters effekter körs före layoutens, så en fullspelare på
		// den första sidan hann registrera sig innan elementet fanns.
		if (this.fullPlayerCount > 0) this.loadSource();

		return () => {
			for (const [type, handler] of listeners) audio.removeEventListener(type, handler);
			audio.pause();
			audio.removeAttribute('src');
			audio.load();
			this.audio = null;
			this.status = 'idle';
			this.sessionActive = false;
		};
	}

	/** Fullspelaren anropar detta för att visa längden utan att spela. */
	registerFullPlayer(): () => void {
		untrack(() => {
			this.fullPlayerCount += 1;
			this.ensureSource();
		});
		return () => {
			untrack(() => {
				this.fullPlayerCount = Math.max(0, this.fullPlayerCount - 1);
			});
		};
	}

	play(): void {
		const audio = this.audio;
		if (!audio) return;
		this.ensureSource();
		this.error = null;
		this.sessionActive = true;
		if (this.status === 'ended') audio.currentTime = 0;

		audio.play().catch((reason: unknown) => {
			// AbortError betyder att play avbröts av ett spårbyte – inget fel.
			if (reason instanceof DOMException && reason.name === 'AbortError') return;
			this.status = 'paused';
			// Fel i själva filen hanteras av error-lyssnaren med samma text.
			if (!audio.error) this.error = playbackErrorMessage(this.track.title);
		});
	}

	pause(): void {
		this.audio?.pause();
	}

	toggle(): void {
		if (this.isPlaying) this.pause();
		else this.play();
	}

	/** Byter spår. Spelar bara om användaren valde spåret aktivt eller musik redan spelades. */
	selectTrack(id: string, options: { play: boolean }): void {
		if (!getCalmMusicTrack(id)) return;
		const shouldPlay = options.play || this.isPlaying;

		if (id !== this.trackId) {
			this.trackId = id;
			this.currentTime = 0;
			this.duration = Number.NaN;
			this.error = null;
			if (this.status === 'ended') this.status = 'paused';
			this.savePreferences();
			this.loadSource();
		}

		if (shouldPlay) this.play();
	}

	next(): void {
		this.selectTrack(getNextTrackId(this.trackId), { play: false });
	}

	previous(): void {
		this.selectTrack(getPreviousTrackId(this.trackId), { play: false });
	}

	seek(seconds: number): void {
		const audio = this.audio;
		if (!audio || !Number.isFinite(seconds)) return;
		const max = Number.isFinite(this.duration) ? this.duration : seconds;
		const target = Math.min(Math.max(0, seconds), max);
		audio.currentTime = target;
		this.currentTime = target;
		if (this.status === 'ended') this.status = 'paused';
	}

	setVolume(value: number): void {
		this.volume = clampVolume(value);
		if (this.audio) this.audio.volume = this.volume;
		this.savePreferences();
	}

	toggleRepeat(): void {
		this.repeat = !this.repeat;
		if (this.audio) this.audio.loop = this.repeat;
		this.savePreferences();
	}

	/** Stoppar musiken och döljer minispelaren. */
	close(): void {
		const audio = this.audio;
		if (audio) {
			audio.pause();
			audio.currentTime = 0;
		}
		this.currentTime = 0;
		this.status = 'idle';
		this.sessionActive = false;
	}

	private ensureSource(): void {
		const audio = this.audio;
		if (!audio) return;
		if (!audio.getAttribute('src')) this.loadSource();
	}

	private loadSource(): void {
		const audio = this.audio;
		if (!audio) return;
		audio.src = this.track.src;
		audio.load();
	}

	private onPlay(): void {
		this.status = 'playing';
		this.error = null;
	}

	private onPause(): void {
		// ended skickar också pause; ended-lyssnaren sätter rätt status.
		if (this.audio?.ended) return;
		if (this.status === 'playing') this.status = 'paused';
	}

	private onEnded(): void {
		// Med upprepning loopar elementet självt och ended skickas inte.
		// Utan upprepning spelas listan klart en gång och stannar sedan.
		if (!isLastTrack(this.trackId)) {
			this.selectTrack(getNextTrackId(this.trackId), { play: true });
			return;
		}
		this.status = 'ended';
	}

	private onError(): void {
		const audio = this.audio;
		// Ett element utan src skickar error vid städning – inget att visa.
		if (!audio || !audio.getAttribute('src')) return;
		this.status = 'paused';
		this.error = playbackErrorMessage(this.track.title);
	}

	private syncTime(): void {
		if (this.audio) this.currentTime = this.audio.currentTime;
	}

	private syncDuration(): void {
		if (this.audio) this.duration = this.audio.duration;
	}

	private savePreferences(): void {
		try {
			localStorage.setItem(
				CALM_MUSIC_STORAGE_KEY,
				JSON.stringify({ trackId: this.trackId, volume: this.volume, repeat: this.repeat })
			);
		} catch {
			// Privat läge eller full lagring – inställningen gäller då bara besöket.
		}
	}
}

function readStorage(): string | null {
	try {
		return localStorage.getItem(CALM_MUSIC_STORAGE_KEY);
	} catch {
		return null;
	}
}

function playbackErrorMessage(title: string): string {
	return `${title} går inte att spela just nu. Det kan bero på anslutningen. Försök igen om en stund, eller välj en annan låt.`;
}

export const calmMusic = new CalmMusicPlayer();
