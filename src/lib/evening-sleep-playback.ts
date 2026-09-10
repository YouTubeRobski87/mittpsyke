// Uppspelning för Sovläge – adapterlagret.
//
// Panelen vet ingenting om hur ljud produceras. Den skapar en SleepPlayback,
// anropar start/pause/resume/stop och lyssnar på statusändringar. Det gör att
// dagens webbläsar-TTS kan bytas mot riktiga ljudfiler senare utan att vare sig
// UI:t eller tillståndslogiken skrivs om: det enda som behövs är ytterligare en
// funktion i den här filen som returnerar samma gränssnitt.
//
// TTS är alltså en implementation av uppspelning, inte uppspelningen självt.

import { SWEDISH_LOCALE, waitForVoiceForLang } from '$lib/ai/speech';

export type SleepPlaybackStatus = 'idle' | 'playing' | 'paused' | 'ended' | 'unavailable';

export type SleepPlaybackKind = 'tts' | 'silent';

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
 * Kvinnliga svenska röster i de talmotorer som faktiskt förekommer:
 * Alva och Klara på macOS/iOS, Hedvig och Sofie på Windows, Hillevi i Azure.
 */
const FEMALE_SWEDISH_VOICE_NAMES = ['alva', 'klara', 'hedvig', 'sofie', 'hillevi', 'astrid'];

/**
 * Kända manliga svenska röster. Bengt är Windows standardröst för svenska och
 * är den som annars väljs först – det är den rösten det här ersätter.
 */
const MALE_SWEDISH_VOICE_NAMES = ['bengt', 'oskar', 'mattias', 'gustav', 'erik'];

const includesName = (voiceName: string, names: readonly string[]) =>
	names.some((name) => voiceName.toLowerCase().includes(name));

/**
 * Väljer en kvinnlig svensk röst för kvällens uppläsning.
 *
 * Tre steg, i fallande säkerhet:
 *   1. En svensk röst vars namn är en känd kvinnlig röst.
 *   2. En svensk röst som inte är en känd manlig röst. Fångar motorer som
 *      namnger rösten efter språket ("Google svenska") i stället för person.
 *   3. `fallback` – den röst den delade språkvalslogiken redan valt.
 *
 * Steg 3 gör bytet säkert: finns bara en manlig svensk röst installerad läses
 * texten fortfarande upp, i stället för att tystna. Urvalet är medvetet lokalt
 * för Sovläge och rör inte $lib/ai/speech.ts, som chatten delar.
 */
export function selectFemaleSwedishVoice(
	voices: readonly SpeechSynthesisVoice[],
	fallback: SpeechSynthesisVoice | null
): SpeechSynthesisVoice | null {
	const swedish = voices.filter((voice) => voice.lang.toLowerCase().startsWith('sv'));

	return (
		swedish.find((voice) => includesName(voice.name, FEMALE_SWEDISH_VOICE_NAMES)) ??
		swedish.find((voice) => !includesName(voice.name, MALE_SWEDISH_VOICE_NAMES)) ??
		fallback
	);
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
	const anySwedishVoice = await waitForVoiceForLang(SWEDISH_LOCALE, { synth });
	const voice = selectFemaleSwedishVoice(synth.getVoices(), anySwedishVoice);

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
