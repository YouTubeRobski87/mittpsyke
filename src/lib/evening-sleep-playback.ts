// Uppspelning för Sovläge – adapterlagret.
//
// Panelen vet ingenting om hur ljud produceras. Den skapar en SleepPlayback,
// anropar start/pause/resume/stop och lyssnar på statusändringar. Det gör att
// dagens webbläsar-TTS kan bytas mot riktiga ljudfiler senare utan att vare sig
// UI:t eller tillståndslogiken skrivs om: det enda som behövs är ytterligare en
// funktion i den här filen som returnerar samma gränssnitt.
//
// TTS är alltså en implementation av uppspelning, inte uppspelningen självt.

import {
	SWEDISH_LOCALE,
	selectGuidedVoiceForLang,
	waitForVoiceForLang
} from '$lib/ai/speech';

export type SleepPlaybackStatus = 'idle' | 'playing' | 'paused' | 'ended' | 'unavailable';

export type SleepPlaybackKind = 'tts' | 'audio' | 'silent';

export type SleepPlaybackEvents = {
	onStatusChange?: (status: SleepPlaybackStatus) => void;
};

export interface SleepPlayback {
	readonly kind: SleepPlaybackKind;
	readonly status: SleepPlaybackStatus;
	start(): void;
	pause(): void;
	resume(): void;
	stop(): void;
	/** Bara ljudfiler kan upprepas. Övriga adaptrar saknar metoden. */
	setLoop?(loop: boolean): void;
}

// ---------------------------------------------------------------------------
// Talmotor
//
// Ett minimalt gränssnitt runt speechSynthesis, av samma skäl som
// $lib/ai/speech.ts finns: uppspelningen ska gå att testa utan en riktig
// webbläsare, och utan att en test måste bygga en SpeechSynthesisUtterance.

export interface PlaybackUtterance {
	text: string;
	lang: string;
	voice: SpeechSynthesisVoice | null;
	onend: (() => void) | null;
	onerror: (() => void) | null;
}

export interface SpeechEngine {
	createUtterance(text: string): PlaybackUtterance;
	speak(utterance: PlaybackUtterance): void;
	cancel(): void;
	pause(): void;
	resume(): void;
}

/**
 * Bygger en talmotor mot webbläsarens speechSynthesis.
 *
 * Väntar in en svensk röst på samma sätt som chatten redan gör – utan det
 * läses svensk text upp med engelsk brytning på system med engelsk locale –
 * och uppgraderar sedan valet till en kvinnlig röst när en sådan finns.
 * Returnerar null när speechSynthesis saknas, så anroparen kan falla tillbaka
 * på ett tyst läge i stället för att krascha.
 */
export async function createBrowserSpeechEngine(): Promise<SpeechEngine | null> {
	if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') {
		return null;
	}

	const synth = window.speechSynthesis;
	// Väntan sker på den delade hjälpfunktionen, som redan hanterar att
	// röstlistan fylls på asynkront. Först därefter går det att välja på namn.
	await waitForVoiceForLang(SWEDISH_LOCALE, { synth });
	const voice = selectGuidedVoiceForLang(synth.getVoices(), SWEDISH_LOCALE);

	return {
		createUtterance(text: string): PlaybackUtterance {
			return { text, lang: SWEDISH_LOCALE, voice, onend: null, onerror: null };
		},
		speak(utterance: PlaybackUtterance) {
			// PlaybackUtterance är ett rent värdeobjekt; den riktiga yttrandet
			// byggs först här. Det håller gränssnittet fritt från DOM-typer och
			// gör adaptern testbar med en påhittad motor.
			const native = new SpeechSynthesisUtterance(utterance.text);
			native.lang = utterance.lang;
			if (utterance.voice) native.voice = utterance.voice;
			// Något långsammare och lägre än chattens uppläsning. Det här är en
			// kvällsstund, inte ett svar som ska tas emot.
			native.rate = 0.85;
			native.pitch = 0.95;
			native.onend = () => utterance.onend?.();
			native.onerror = () => utterance.onerror?.();
			synth.speak(native);
		},
		cancel: () => synth.cancel(),
		pause: () => synth.pause(),
		resume: () => synth.resume()
	};
}

// ---------------------------------------------------------------------------
// TTS-uppspelning

/**
 * Läser upp ett manus rad för rad.
 *
 * Raderna talas en i taget i stället för som en enda lång yttrande, av två
 * skäl: långa yttranden klipps av i Chrome, och radvis uppspelning ger
 * naturliga pauser mellan stegen i övningen.
 */
export function createTtsPlayback(
	script: readonly string[],
	engine: SpeechEngine | null,
	events: SleepPlaybackEvents = {}
): SleepPlayback {
	let status: SleepPlaybackStatus = 'idle';
	let index = 0;
	// Räknare som ogiltigförklarar yttranden från en tidigare uppspelning.
	// Utan den kan ett onend som kommer efter stop() starta nästa rad igen.
	let generation = 0;

	function setStatus(next: SleepPlaybackStatus) {
		if (status === next) return;
		status = next;
		events.onStatusChange?.(next);
	}

	function speakFrom(currentGeneration: number) {
		if (!engine || currentGeneration !== generation) return;

		if (index >= script.length) {
			setStatus('ended');
			return;
		}

		const utterance = engine.createUtterance(script[index]);
		utterance.onend = () => {
			if (currentGeneration !== generation) return;
			index += 1;
			speakFrom(currentGeneration);
		};
		utterance.onerror = () => {
			if (currentGeneration !== generation) return;
			setStatus('unavailable');
		};
		engine.speak(utterance);
	}

	return {
		kind: 'tts',
		get status() {
			return status;
		},
		start() {
			if (!engine || script.length === 0) {
				setStatus('unavailable');
				return;
			}
			generation += 1;
			index = 0;
			setStatus('playing');
			speakFrom(generation);
		},
		pause() {
			if (!engine || status !== 'playing') return;
			engine.pause();
			setStatus('paused');
		},
		resume() {
			if (!engine || status !== 'paused') return;
			engine.resume();
			setStatus('playing');
		},
		stop() {
			// Höjs före cancel(), så att det onend som cancel utlöser inte
			// tolkas som att raden talats färdigt.
			generation += 1;
			index = 0;
			engine?.cancel();
			setStatus('idle');
		}
	};
}

// ---------------------------------------------------------------------------
// Inspelad uppspelning
//
// Färdiginspelade meditationer spelas som ljudfil. Talsyntesen rörs aldrig för
// ett sådant spår - det är hela poängen med att adaptern är utbytbar.

/**
 * Den delmängd av HTMLAudioElement som uppspelningen behöver. Gör adaptern
 * testbar utan DOM, precis som SpeechEngine gör för talsyntesen.
 */
export interface AudioElementLike {
	src: string;
	preload: string;
	currentTime: number;
	readonly duration: number;
	/** Valfri så att testernas påhittade element inte måste bära den. */
	loop?: boolean;
	play(): Promise<void> | void;
	pause(): void;
	addEventListener(type: 'ended' | 'error', listener: () => void): void;
	removeEventListener(type: 'ended' | 'error', listener: () => void): void;
}

/**
 * Spelar en färdiginspelad meditation.
 *
 * Samma instans används hela stunden: paus stannar där lyssnaren är, fortsätt
 * startar från samma position, och stop nollställer och släpper elementet. Det
 * är därför två val i rad aldrig kan ge dubbla ljud - panelen anropar alltid
 * stop på föregående uppspelning innan en ny skapas.
 */
export type AudioFilePlaybackOptions = SleepPlaybackEvents & {
	/**
	 * Upprepa spåret tills användaren pausar eller stänger av upprepningen.
	 * Elementets egen loop används, så spåret börjar om utan omladdning och
	 * utan att ended skickas. Av som standard.
	 */
	loop?: boolean;
};

export function createAudioFilePlayback(
	src: string,
	events: AudioFilePlaybackOptions = {},
	createAudio: (source: string) => AudioElementLike = (source) => new Audio(source)
): SleepPlayback {
	let status: SleepPlaybackStatus = 'idle';
	let audio: AudioElementLike | null = null;
	let loop = events.loop ?? false;

	function setStatus(next: SleepPlaybackStatus) {
		if (status === next) return;
		status = next;
		events.onStatusChange?.(next);
	}

	const onEnded = () => setStatus('ended');
	// Ett laddningsfel får aldrig fälla Sovläge. Statusen rapporteras, och
	// panelen visar en diskret rad med kvarvarande vägar ut.
	const onError = () => setStatus('unavailable');

	function release() {
		if (!audio) return;
		audio.removeEventListener('ended', onEnded);
		audio.removeEventListener('error', onError);
		audio.pause();
		// Nollställ innan elementet släpps, annars kan webbläsaren fortsätta
		// buffra en 38 MB-fil i bakgrunden efter att stunden är slut.
		audio.src = '';
		audio = null;
	}

	return {
		kind: 'audio',
		get status() {
			return status;
		},
		start() {
			release();
			audio = createAudio(src);
			audio.preload = 'metadata';
			audio.loop = loop;
			audio.addEventListener('ended', onEnded);
			audio.addEventListener('error', onError);
			setStatus('playing');
			// play() avvisas om webbläsaren nekar uppspelning. Det behandlas som
			// samma sak som ett laddningsfel i stället för att bli ett ohanterat
			// promise-fel.
			void Promise.resolve(audio.play()).catch(() => setStatus('unavailable'));
		},
		pause() {
			if (!audio || status !== 'playing') return;
			audio.pause();
			setStatus('paused');
		},
		resume() {
			if (!audio || status !== 'paused') return;
			setStatus('playing');
			void Promise.resolve(audio.play()).catch(() => setStatus('unavailable'));
		},
		stop() {
			release();
			setStatus('idle');
		},
		setLoop(next: boolean) {
			loop = next;
			if (audio) audio.loop = next;
		}
	};
}

// ---------------------------------------------------------------------------
// Tyst uppspelning

/**
 * Nollobjektet för Tystnad.
 *
 * Finns för att panelen ska slippa specialfall: den håller alltid en
 * SleepPlayback, även när valet uttryckligen är att ingenting ska spelas.
 * Skapar ingen ljudkontext och rör aldrig speechSynthesis.
 */
export function createSilentPlayback(): SleepPlayback {
	return {
		kind: 'silent',
		get status(): SleepPlaybackStatus {
			return 'idle';
		},
		start() {},
		pause() {},
		resume() {},
		stop() {}
	};
}
