import { describe, expect, it } from 'vitest';
import {
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
