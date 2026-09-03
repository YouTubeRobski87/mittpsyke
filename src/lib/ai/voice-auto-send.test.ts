import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVoiceAutoSend, VOICE_AUTO_SEND_DELAY_MS, type VoiceResults } from './voice-auto-send';

const final = (text: string) => ({ isFinal: true, 0: { transcript: text } });
const interim = (text: string) => ({ isFinal: false, 0: { transcript: text } });

function setup() {
	let draft = '';
	let enabled = true;
	let sending = false;
	let pending = false;
	const send = vi.fn(() => { draft = ''; });
	const onTranscript = vi.fn((text: string) => { draft = [draft, text].filter(Boolean).join(' '); });
	const voice = createVoiceAutoSend({
		isEnabled: () => enabled,
		canSend: () => !sending && Boolean(draft.trim()),
		onTranscript,
		onPendingChange: (value) => { pending = value; },
		onSend: () => send()
	});
	return {
		voice, send, onTranscript,
		draft: () => draft,
		pending: () => pending,
		type: (text: string) => { voice.cancel(); draft = text; },
		setEnabled: (value: boolean) => { enabled = value; },
		setSending: (value: boolean) => { sending = value; },
		manualSend: () => { voice.cancel(); send(); },
		finish: (results: VoiceResults = [final('En lugn promenad')]) => {
			voice.start();
			voice.speechStart();
			voice.result(results);
			voice.speechEnd();
		}
	};
}

describe('röstinmatning och autosändning', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

	it('skickar final rösttext först 1,5 sekunder efter avslutat tal', () => {
		const t = setup();
		t.finish();
		expect(t.draft()).toBe('En lugn promenad');
		expect(t.pending()).toBe(true);
		vi.advanceTimersByTime(VOICE_AUTO_SEND_DELAY_MS - 1);
		expect(t.send).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(t.send).toHaveBeenCalledTimes(1);
		expect(t.pending()).toBe(false);
	});

	it('väntar även när final kommer efter att talet avslutats', () => {
		const t = setup();
		t.voice.start();
		t.voice.speechEnd();
		vi.advanceTimersByTime(2000);
		t.voice.result([final('Hej')]);
		vi.advanceTimersByTime(1499);
		expect(t.send).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(t.send).toHaveBeenCalledTimes(1);
	});

	it('skickar inte final medan användaren fortfarande talar', () => {
		const t = setup();
		t.voice.start();
		t.voice.speechStart();
		t.voice.result([final('Hej')]);
		vi.advanceTimersByTime(10000);
		expect(t.send).not.toHaveBeenCalled();
	});

	it.each([
		['interim', [interim('Inte färdigt')]],
		['tom final', [final('   ')]],
		['tom resultatlista', []]
	])('%s lämnar ingen text och skickar aldrig', (_name, results) => {
		const t = setup();
		t.finish(results as VoiceResults);
		vi.runAllTimers();
		expect(t.onTranscript).not.toHaveBeenCalled();
		expect(t.send).not.toHaveBeenCalled();
	});

	it('vanlig textinmatning aktiverar aldrig autosändning', () => {
		const t = setup();
		t.type('Ett skrivet meddelande');
		t.voice.result([final('Sent event från gammal mikrofon')]);
		t.voice.speechEnd();
		vi.runAllTimers();
		expect(t.draft()).toBe('Ett skrivet meddelande');
		expect(t.send).not.toHaveBeenCalled();
	});

	it('en påbörjad mikrofon utan ny final skickar inte ett befintligt utkast', () => {
		const t = setup();
		t.type('Skrivet i förväg');
		t.finish([final('')]);
		vi.runAllTimers();
		expect(t.send).not.toHaveBeenCalled();
	});

	it('kort paus följd av nytt tal avbryter timern och skickar hela texten en gång', () => {
		const t = setup();
		t.finish([final('Jag vill')]);
		vi.advanceTimersByTime(1000);
		t.voice.speechStart();
		expect(t.pending()).toBe(false);
		t.voice.result([final('Jag vill'), interim('fortsätta')]);
		vi.advanceTimersByTime(2000);
		expect(t.send).not.toHaveBeenCalled();
		t.voice.speechEnd();
		t.voice.result([final('Jag vill'), final('fortsätta prata')]);
		expect(t.draft()).toBe('Jag vill fortsätta prata');
		vi.advanceTimersByTime(1499);
		expect(t.send).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(t.send).toHaveBeenCalledTimes(1);
		t.voice.result([final('Jag vill'), final('fortsätta prata')]);
		t.voice.speechEnd();
		vi.runAllTimers();
		expect(t.send).toHaveBeenCalledTimes(1);
	});

	it('återupptaget tal utan ny final får inte skicka tidigare final', () => {
		const t = setup();
		t.finish();
		t.voice.speechStart();
		t.voice.speechEnd();
		t.voice.result([final('En lugn promenad')]);
		vi.runAllTimers();
		expect(t.send).not.toHaveBeenCalled();
	});

	it('interim efter tidigare final blockerar sändning även om interim sedan tas bort', () => {
		const t = setup();
		t.finish([final('Färdigt'), interim('ofärdigt')]);
		expect(t.draft()).toBe('Färdigt');
		vi.runAllTimers();
		t.voice.result([final('Färdigt')]);
		vi.runAllTimers();
		expect(t.send).not.toHaveBeenCalled();
	});

	it('upprepade kumulativa resultat dubblerar varken utkast eller sändning', () => {
		const t = setup();
		t.finish();
		t.voice.result([final('En lugn promenad')]);
		t.voice.speechEnd();
		vi.runAllTimers();
		expect(t.onTranscript).toHaveBeenCalledTimes(1);
		expect(t.send).toHaveBeenCalledTimes(1);
	});

	it('manuell sändning före timeout förhindrar dubbelsändning', () => {
		const t = setup();
		t.finish();
		vi.advanceTimersByTime(1000);
		t.manualSend();
		t.voice.speechEnd();
		vi.runAllTimers();
		expect(t.send).toHaveBeenCalledTimes(1);
	});

	it('redigering under väntetiden avbryter autosändning och bevarar texten', () => {
		const t = setup();
		t.finish();
		t.type('Min ändrade text');
		vi.runAllTimers();
		expect(t.send).not.toHaveBeenCalled();
		expect(t.draft()).toBe('Min ändrade text');
	});

	it('manuellt mikrofonstopp väntar på avslut och skickar sedan final enligt samma regler', () => {
		const t = setup();
		t.finish();
		vi.advanceTimersByTime(1000);
		t.voice.waitForEnd();
		vi.advanceTimersByTime(2000);
		expect(t.send).not.toHaveBeenCalled();
		t.voice.speechEnd();
		vi.advanceTimersByTime(1499);
		expect(t.send).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(t.send).toHaveBeenCalledTimes(1);
	});

	it('avbrott vid speech error, aborted eller unmount ignorerar timer och sena resultat', () => {
		const t = setup();
		t.finish();
		t.voice.cancel();
		t.voice.result([final('En lugn promenad'), final('Sent resultat')]);
		t.voice.speechEnd();
		vi.runAllTimers();
		expect(t.pending()).toBe(false);
		expect(t.draft()).toBe('En lugn promenad');
		expect(t.send).not.toHaveBeenCalled();
	});

	it('avstängd inställning lämnar final som manuellt utkast', () => {
		const t = setup();
		t.setEnabled(false);
		t.finish();
		vi.runAllTimers();
		expect(t.draft()).toBe('En lugn promenad');
		expect(t.send).not.toHaveBeenCalled();
	});

	it('kontrollerar inställningen igen vid timeout', () => {
		const t = setup();
		t.finish();
		t.setEnabled(false);
		vi.runAllTimers();
		expect(t.send).not.toHaveBeenCalled();
	});

	it('köar inte en sändning när ett annat meddelande redan skickas', () => {
		const t = setup();
		t.finish();
		t.setSending(true);
		vi.runAllTimers();
		t.setSending(false);
		t.voice.speechEnd();
		vi.runAllTimers();
		expect(t.send).not.toHaveBeenCalled();
	});
});
