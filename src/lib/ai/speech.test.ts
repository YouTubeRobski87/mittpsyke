import { describe, expect, it, vi } from 'vitest';
import {
	SWEDISH_LOCALE,
	applyVoiceForLang,
	selectVoiceForLang,
	waitForVoiceForLang,
	type SpeechSynthesisLike,
	type UtteranceLike
} from './speech';

// Bygger en minimal röst som liknar SpeechSynthesisVoice för testerna.
function voice(lang: string, name = lang): SpeechSynthesisVoice {
	return {
		lang,
		name,
		default: false,
		localService: true,
		voiceURI: name
	} as SpeechSynthesisVoice;
}

// Simulerar en dator med engelska systeminställningar: engelsk röst är
// standard/först i listan, men en svensk röst finns tillgänglig.
const englishSystemVoices = [voice('en-US', 'Samantha'), voice('en-GB', 'Daniel'), voice('sv-SE', 'Alva')];

describe('röstval för uppläsning', () => {
	it('väljer svensk röst för svensk text trots engelsk systemlocale', () => {
		const selected = selectVoiceForLang(englishSystemVoices, SWEDISH_LOCALE);
		expect(selected?.lang).toBe('sv-SE');
	});

	it('prioriterar sv-SE framför andra svenska varianter', () => {
		const voices = [voice('sv-FI'), voice('en-US'), voice('sv-SE')];
		expect(selectVoiceForLang(voices, SWEDISH_LOCALE)?.lang).toBe('sv-SE');
	});

	it('faller tillbaka på annan svensk variant när sv-SE saknas', () => {
		const voices = [voice('en-US'), voice('sv-FI')];
		expect(selectVoiceForLang(voices, SWEDISH_LOCALE)?.lang).toBe('sv-FI');
	});

	it('returnerar null när ingen svensk röst finns', () => {
		const voices = [voice('en-US'), voice('en-GB')];
		expect(selectVoiceForLang(voices, SWEDISH_LOCALE)).toBeNull();
	});

	it('väljer engelsk röst för engelsk text', () => {
		const selected = selectVoiceForLang(englishSystemVoices, 'en-US');
		expect(selected?.lang).toBe('en-US');
	});
});

describe('applyVoiceForLang', () => {
	it('sätter svensk röst och sv-SE på en utterance vid svensk text', () => {
		const utterance: UtteranceLike = { lang: 'en-US', voice: null };
		const chosen = applyVoiceForLang(utterance, englishSystemVoices, SWEDISH_LOCALE);

		expect(utterance.lang).toBe('sv-SE');
		expect(utterance.voice?.lang).toBe('sv-SE');
		expect(chosen?.lang).toBe('sv-SE');
	});

	it('sätter utterance.lang = sv-SE och kraschar inte när ingen svensk röst finns', () => {
		const utterance: UtteranceLike = { lang: 'en-US', voice: null };
		const chosen = applyVoiceForLang(utterance, [voice('en-US')], SWEDISH_LOCALE);

		// Fallback: språket sätts alltid, men vi tvingar inte fram OS-standardrösten.
		expect(utterance.lang).toBe('sv-SE');
		expect(utterance.voice).toBeNull();
		expect(chosen).toBeNull();
	});

	it('sätter engelsk röst för engelsk text', () => {
		const utterance: UtteranceLike = { lang: 'sv-SE', voice: null };
		applyVoiceForLang(utterance, englishSystemVoices, 'en-US');

		expect(utterance.lang).toBe('en-US');
		expect(utterance.voice?.lang).toBe('en-US');
	});
});

// Falsk speechSynthesis som låter oss styra röstlistan och fejka voiceschanged.
function createFakeSynth(initialVoices: SpeechSynthesisVoice[]) {
	let voices = initialVoices;
	const listeners = new Set<() => void>();
	const synth: SpeechSynthesisLike = {
		getVoices: () => voices,
		addEventListener: (_type, listener) => listeners.add(listener),
		removeEventListener: (_type, listener) => listeners.delete(listener)
	};
	return {
		synth,
		listenerCount: () => listeners.size,
		// Uppdaterar röstlistan och skickar voiceschanged, som webbläsaren gör.
		emitVoicesChanged: (nextVoices: SpeechSynthesisVoice[]) => {
			voices = nextVoices;
			for (const listener of [...listeners]) listener();
		}
	};
}

describe('waitForVoiceForLang', () => {
	it('returnerar rösten direkt när den redan finns', async () => {
		const { synth, listenerCount } = createFakeSynth(englishSystemVoices);
		const result = await waitForVoiceForLang(SWEDISH_LOCALE, { synth });

		expect(result?.lang).toBe('sv-SE');
		// Ingen väntan behövdes – ingen lyssnare ska ha registrerats.
		expect(listenerCount()).toBe(0);
	});

	it('väntar in svensk röst som kommer via voiceschanged', async () => {
		const { synth, listenerCount, emitVoicesChanged } = createFakeSynth([voice('en-US')]);
		const pending = waitForVoiceForLang(SWEDISH_LOCALE, { synth, timeoutMs: 1000 });

		// Röstlistan var tom på svenska vid start.
		expect(listenerCount()).toBe(1);
		emitVoicesChanged([voice('en-US'), voice('sv-SE', 'Alva')]);

		expect((await pending)?.lang).toBe('sv-SE');
		// Lyssnaren ska tas bort efter träff.
		expect(listenerCount()).toBe(0);
	});

	it('faller säkert tillbaka på null vid timeout utan svensk röst', async () => {
		vi.useFakeTimers();
		try {
			const { synth, listenerCount } = createFakeSynth([voice('en-US')]);
			const pending = waitForVoiceForLang(SWEDISH_LOCALE, { synth, timeoutMs: 1200 });

			await vi.advanceTimersByTimeAsync(1200);

			expect(await pending).toBeNull();
			// Lyssnaren ska tas bort även vid timeout.
			expect(listenerCount()).toBe(0);
		} finally {
			vi.useRealTimers();
		}
	});

	it('tar bort lyssnaren efter både träff och timeout', async () => {
		// Träff: verifieras ovan. Här kontrolleras att en voiceschanged utan svensk
		// röst inte råkar rensa lyssnaren i förtid, men att timeouten gör det.
		vi.useFakeTimers();
		try {
			const { synth, listenerCount, emitVoicesChanged } = createFakeSynth([voice('en-US')]);
			const pending = waitForVoiceForLang(SWEDISH_LOCALE, { synth, timeoutMs: 1000 });

			// Ett event utan svensk röst ska inte avsluta väntan.
			emitVoicesChanged([voice('en-GB')]);
			expect(listenerCount()).toBe(1);

			await vi.advanceTimersByTimeAsync(1000);
			expect(await pending).toBeNull();
			expect(listenerCount()).toBe(0);
		} finally {
			vi.useRealTimers();
		}
	});
});

describe('avbruten uppläsning startar inte efter sen röstladdning', () => {
	// Speglar cancel-logiken i ChatWindow.speakReply: ett request-id ökas vid
	// avbrott, och den väntande uppläsningen startar bara om id:t fortfarande gäller.
	it('startar inte utterance när användaren avbrutit under väntan', async () => {
		const { synth, emitVoicesChanged } = createFakeSynth([voice('en-US')]);

		let requestCounter = 0;
		let spoke = false;

		const speak = async () => {
			const requestId = ++requestCounter;
			const chosen = await waitForVoiceForLang(SWEDISH_LOCALE, { synth, timeoutMs: 1000 });
			if (requestId !== requestCounter) return; // avbruten
			void chosen;
			spoke = true;
		};

		const pending = speak();
		// Användaren avbryter (motsvarar stopSpeaking som ökar räknaren).
		requestCounter += 1;
		// Rösten laddas först nu – men uppläsningen är redan ogiltigförklarad.
		emitVoicesChanged([voice('sv-SE', 'Alva')]);

		await pending;
		expect(spoke).toBe(false);
	});
});
