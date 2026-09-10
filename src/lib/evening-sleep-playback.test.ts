import { describe, expect, it } from 'vitest';
import {
	createAudioFilePlayback,
	createSilentPlayback,
	createTtsPlayback,
	type PlaybackUtterance,
	type SleepPlaybackStatus,
	type SpeechEngine
} from './evening-sleep-playback';

/**
 * Påhittad talmotor. Poängen med adaptergränssnittet är just att det ska gå
 * att driva uppspelningen utan en webbläsare - kommer den här testen igenom
 * kan en framtida ljudfilsadapter byggas mot samma kontrakt.
 */
function createFakeEngine() {
	const spoken: string[] = [];
	const calls: string[] = [];
	let pending: PlaybackUtterance | null = null;

	const engine: SpeechEngine = {
		createUtterance: (text) => ({ text, lang: 'sv-SE', voice: null, onend: null, onerror: null }),
		speak(utterance) {
			spoken.push(utterance.text);
			pending = utterance;
		},
		cancel() {
			calls.push('cancel');
			pending = null;
		},
		pause: () => calls.push('pause'),
		resume: () => calls.push('resume')
	};

	return {
		engine,
		spoken,
		calls,
		/** Simulerar att den senaste raden talats färdigt. */
		finishCurrent() {
			const current = pending;
			pending = null;
			current?.onend?.();
		},
		failCurrent() {
			const current = pending;
			pending = null;
			current?.onerror?.();
		}
	};
}

function track() {
	const statuses: SleepPlaybackStatus[] = [];
	return { statuses, onStatusChange: (status: SleepPlaybackStatus) => statuses.push(status) };
}

describe('TTS-uppspelning', () => {
	it('talar en rad i taget i stället för hela manuset på en gång', () => {
		const fake = createFakeEngine();
		const playback = createTtsPlayback(['Ett', 'Två', 'Tre'], fake.engine);

		playback.start();
		expect(fake.spoken).toEqual(['Ett']);

		fake.finishCurrent();
		expect(fake.spoken).toEqual(['Ett', 'Två']);

		fake.finishCurrent();
		expect(fake.spoken).toEqual(['Ett', 'Två', 'Tre']);
	});

	it('rapporterar ended när sista raden är klar', () => {
		const fake = createFakeEngine();
		const events = track();
		const playback = createTtsPlayback(['Ett', 'Två'], fake.engine, events);

		playback.start();
		fake.finishCurrent();
		fake.finishCurrent();

		expect(playback.status).toBe('ended');
		expect(events.statuses).toEqual(['playing', 'ended']);
	});

	it('pausar och återupptar via motorn utan att tappa sin plats i manuset', () => {
		const fake = createFakeEngine();
		const playback = createTtsPlayback(['Ett', 'Två', 'Tre'], fake.engine);

		playback.start();
		fake.finishCurrent();
		playback.pause();
		expect(playback.status).toBe('paused');
		expect(fake.calls).toContain('pause');

		playback.resume();
		expect(playback.status).toBe('playing');
		expect(fake.calls).toContain('resume');

		// Uppspelningen fortsätter där den var, inte från början.
		fake.finishCurrent();
		expect(fake.spoken).toEqual(['Ett', 'Två', 'Tre']);
	});

	it('ignorerar paus och återupptagning i fel läge', () => {
		const fake = createFakeEngine();
		const playback = createTtsPlayback(['Ett'], fake.engine);

		playback.pause();
		playback.resume();
		expect(fake.calls).toEqual([]);
		expect(playback.status).toBe('idle');
	});

	it('startar inte om av ett onend som kommer efter stop', () => {
		const fake = createFakeEngine();
		const playback = createTtsPlayback(['Ett', 'Två', 'Tre'], fake.engine);

		playback.start();
		const stale = fake.spoken.length;
		playback.stop();

		// Webbläsaren kan skicka onend som en följd av cancel(). Det får inte
		// tolkas som att raden talats färdigt och starta nästa.
		fake.finishCurrent();
		expect(fake.spoken).toHaveLength(stale);
		expect(playback.status).toBe('idle');
	});

	it('börjar om från första raden vid en ny start', () => {
		const fake = createFakeEngine();
		const playback = createTtsPlayback(['Ett', 'Två'], fake.engine);

		playback.start();
		fake.finishCurrent();
		playback.stop();
		playback.start();

		expect(fake.spoken).toEqual(['Ett', 'Två', 'Ett']);
	});

	it('rapporterar unavailable utan motor i stället för att kasta', () => {
		const events = track();
		const playback = createTtsPlayback(['Ett'], null, events);

		expect(() => playback.start()).not.toThrow();
		expect(playback.status).toBe('unavailable');
		expect(() => playback.pause()).not.toThrow();
		expect(() => playback.stop()).not.toThrow();
	});

	it('rapporterar unavailable när motorn felar mitt i', () => {
		const fake = createFakeEngine();
		const playback = createTtsPlayback(['Ett', 'Två'], fake.engine);

		playback.start();
		fake.failCurrent();
		expect(playback.status).toBe('unavailable');
	});

	it('behandlar ett tomt manus som unavailable', () => {
		const fake = createFakeEngine();
		const playback = createTtsPlayback([], fake.engine);

		playback.start();
		expect(playback.status).toBe('unavailable');
		expect(fake.spoken).toEqual([]);
	});
});

describe('Inspelad uppspelning', () => {
	function createFakeAudio() {
		const calls: string[] = [];
		const listeners = new Map<string, () => void>();
		let playRejects = false;

		const element = {
			src: '',
			preload: '',
			currentTime: 0,
			duration: 947,
			play() {
				calls.push('play');
				return playRejects ? Promise.reject(new Error('nekad')) : Promise.resolve();
			},
			pause: () => void calls.push('pause'),
			addEventListener: (type: string, listener: () => void) => void listeners.set(type, listener),
			removeEventListener: (type: string) => void listeners.delete(type)
		};

		return {
			element,
			calls,
			created: [] as string[],
			fire: (type: 'ended' | 'error') => listeners.get(type)?.(),
			failPlayback: () => {
				playRejects = true;
			}
		};
	}

	const SRC = '/audio/meditations/spar.mp3';

	it('spelar ljudfilen och rör aldrig talsyntesen', () => {
		const fake = createFakeAudio();
		const created: string[] = [];
		const playback = createAudioFilePlayback(SRC, {}, (src) => {
			created.push(src);
			return fake.element;
		});

		playback.start();

		expect(playback.kind).toBe('audio');
		expect(created).toEqual([SRC]);
		expect(fake.calls).toContain('play');
		expect(playback.status).toBe('playing');
	});

	it('upprepar inte spåret som standard', () => {
		const fake = createFakeAudio();
		const playback = createAudioFilePlayback(SRC, {}, () => fake.element);

		playback.start();

		expect((fake.element as { loop?: boolean }).loop).toBe(false);
	});

	it('upprepar spåret med elementets egen loop när det valts', () => {
		const fake = createFakeAudio();
		const playback = createAudioFilePlayback(SRC, { loop: true }, () => fake.element);

		playback.start();

		expect((fake.element as { loop?: boolean }).loop).toBe(true);
		expect(playback.status).toBe('playing');
	});

	it('kan slå av och på upprepning mitt i uppspelningen utan att starta om', () => {
		const fake = createFakeAudio();
		const playback = createAudioFilePlayback(SRC, {}, () => fake.element);

		playback.start();
		fake.element.currentTime = 42;
		playback.setLoop?.(true);
		expect((fake.element as { loop?: boolean }).loop).toBe(true);
		playback.setLoop?.(false);
		expect((fake.element as { loop?: boolean }).loop).toBe(false);

		// Bytet rör varken position eller uppspelning.
		expect(fake.element.currentTime).toBe(42);
		expect(fake.calls.filter((call) => call === 'play')).toHaveLength(1);
	});

	it('startar aldrig ljud när upprepning slås på före start', () => {
		const fake = createFakeAudio();
		const playback = createAudioFilePlayback(SRC, {}, () => fake.element);

		playback.setLoop?.(true);

		expect(fake.calls).not.toContain('play');
		expect(playback.status).toBe('idle');
		playback.start();
		expect((fake.element as { loop?: boolean }).loop).toBe(true);
	});

	it('pausar och fortsätter från samma position i samma instans', () => {
		const fake = createFakeAudio();
		const playback = createAudioFilePlayback(SRC, {}, () => fake.element);

		playback.start();
		fake.element.currentTime = 120;
		playback.pause();
		expect(playback.status).toBe('paused');
		expect(fake.calls).toContain('pause');

		playback.resume();
		expect(playback.status).toBe('playing');
		// Positionen rörs aldrig av adaptern - samma element, samma currentTime.
		expect(fake.element.currentTime).toBe(120);
		expect(fake.calls.filter((call) => call === 'play')).toHaveLength(2);
	});

	it('stoppar ljudet och släpper källan vid avslut', () => {
		const fake = createFakeAudio();
		const playback = createAudioFilePlayback(SRC, {}, () => fake.element);

		playback.start();
		playback.stop();

		expect(fake.calls).toContain('pause');
		// Källan nollställs så webbläsaren inte fortsätter buffra efteråt.
		expect(fake.element.src).toBe('');
		expect(playback.status).toBe('idle');
	});

	it('skapar aldrig två samtidiga ljud vid omstart', () => {
		const fake = createFakeAudio();
		let created = 0;
		const playback = createAudioFilePlayback(SRC, {}, () => {
			created += 1;
			return fake.element;
		});

		playback.start();
		playback.start();

		// Andra start river den första först: en pause per omstart.
		expect(created).toBe(2);
		expect(fake.calls.filter((call) => call === 'pause')).toHaveLength(1);
	});

	it('rapporterar ended när spåret spelat klart', () => {
		const fake = createFakeAudio();
		const events = track();
		const playback = createAudioFilePlayback(SRC, events, () => fake.element);

		playback.start();
		fake.fire('ended');

		expect(playback.status).toBe('ended');
		expect(events.statuses).toEqual(['playing', 'ended']);
	});

	it('fäller inte Sovläge när filen inte kan laddas', () => {
		const fake = createFakeAudio();
		const playback = createAudioFilePlayback(SRC, {}, () => fake.element);

		playback.start();
		expect(() => fake.fire('error')).not.toThrow();
		expect(playback.status).toBe('unavailable');
	});

	it('behandlar nekad uppspelning som ett laddningsfel i stället för att kasta', async () => {
		const fake = createFakeAudio();
		fake.failPlayback();
		const playback = createAudioFilePlayback(SRC, {}, () => fake.element);

		playback.start();
		await Promise.resolve();
		await Promise.resolve();

		expect(playback.status).toBe('unavailable');
	});
});

describe('Tyst uppspelning', () => {
	it('rör aldrig någon talmotor och stannar i idle', () => {
		const playback = createSilentPlayback();

		playback.start();
		playback.pause();
		playback.resume();
		playback.stop();

		expect(playback.kind).toBe('silent');
		expect(playback.status).toBe('idle');
	});
});
