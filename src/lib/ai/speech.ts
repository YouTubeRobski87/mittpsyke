// Röstval för uppläsning (text-to-speech).
//
// Bakgrund: på en dator med engelska systeminställningar väljer webbläsarens
// speechSynthesis sin standardröst utifrån operativsystemets locale om ingen
// röst anges explicit. Då läses svensk text upp med engelsk brytning.
//
// Reglerna här väljer alltid röst utifrån `voice.lang` – aldrig utifrån OS:ets
// eller webbläsarens standardspråk – och `utterance.lang` sätts alltid, även när
// ingen matchande röst finns, så uppläsningen kan falla tillbaka utan att krascha.

// Svensk standard-locale. Sätts alltid på utterance för svensk text.
export const SWEDISH_LOCALE = 'sv-SE';

// Minimalt gränssnitt för det vi behöver konfigurera på en utterance. Gör
// funktionerna testbara utan en riktig SpeechSynthesisUtterance.
export interface UtteranceLike {
	lang: string;
	voice: SpeechSynthesisVoice | null;
}

// Väljer bästa tillgängliga röst för ett språk.
//
// Prioritetsordning:
//   1. Exakt träff på hela språkkoden (t.ex. "sv-SE" före "sv-FI").
//   2. Första röst vars språk börjar med basspråket (t.ex. "sv").
//
// Returnerar null om ingen röst matchar – då ansvarar anroparen för att ändå
// sätta utterance.lang och låta motorn falla tillbaka på en standardröst.
export function selectVoiceForLang(
	voices: readonly SpeechSynthesisVoice[],
	lang: string
): SpeechSynthesisVoice | null {
	const target = lang.toLowerCase();
	const base = target.split('-')[0];

	return (
		voices.find((voice) => voice.lang.toLowerCase() === target) ??
		voices.find((voice) => voice.lang.toLowerCase().startsWith(base)) ??
		null
	);
}

// Minsta delmängd av speechSynthesis som väntelogiken behöver. Gör
// waitForVoiceForLang testbar utan en riktig webbläsarmiljö.
export interface SpeechSynthesisLike {
	getVoices(): SpeechSynthesisVoice[];
	addEventListener(type: 'voiceschanged', listener: () => void): void;
	removeEventListener(type: 'voiceschanged', listener: () => void): void;
}

// Standardtimeout för väntan på asynkront laddade röster.
export const DEFAULT_VOICE_WAIT_MS = 1200;

// Väntar in en matchande röst innan uppläsningen startar.
//
// I Chrome/Safari laddas röstlistan asynkront: getVoices() kan vara tom eller
// sakna svensk röst vid första klicket, och en redan startad utterance påverkas
// inte av att listan fylls på senare. Därför:
//   1. kollas nuvarande getVoices() direkt,
//   2. annars väntar vi på "voiceschanged" och försöker igen när det kommer,
//   3. med en kort timeout så funktionen aldrig hänger.
// Eventlyssnare och timeout rensas i alla kodvägar. Returnerar en matchande röst
// om den dyker upp, annars null (då sätter anroparen ändå utterance.lang).
export function waitForVoiceForLang(
	lang: string,
	options: { synth?: SpeechSynthesisLike | null; timeoutMs?: number } = {}
): Promise<SpeechSynthesisVoice | null> {
	const synth = options.synth;
	const timeoutMs = options.timeoutMs ?? DEFAULT_VOICE_WAIT_MS;

	if (!synth) return Promise.resolve(null);

	const immediate = selectVoiceForLang(synth.getVoices(), lang);
	if (immediate) return Promise.resolve(immediate);

	return new Promise((resolve) => {
		let settled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;

		const onVoicesChanged = () => {
			const voice = selectVoiceForLang(synth.getVoices(), lang);
			// Fortsätt vänta tills timeout om rösten fortfarande saknas.
			if (voice) finish(voice);
		};

		const finish = (voice: SpeechSynthesisVoice | null) => {
			if (settled) return;
			settled = true;
			synth.removeEventListener('voiceschanged', onVoicesChanged);
			if (timer !== undefined) clearTimeout(timer);
			resolve(voice);
		};

		synth.addEventListener('voiceschanged', onVoicesChanged);
		timer = setTimeout(() => finish(null), timeoutMs);
	});
}

// Konfigurerar en utterance för ett givet språk.
//
// utterance.lang sätts ALLTID till det begärda språket. utterance.voice sätts
// bara när en matchande röst hittas – vi skriver aldrig över med null och
// tvingar aldrig fram OS-standardrösten. Returnerar den valda rösten (eller null).
export function applyVoiceForLang(
	utterance: UtteranceLike,
	voices: readonly SpeechSynthesisVoice[],
	lang: string
): SpeechSynthesisVoice | null {
	utterance.lang = lang;
	const voice = selectVoiceForLang(voices, lang);
	if (voice) {
		utterance.voice = voice;
	}
	return voice;
}
