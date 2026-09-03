import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVoiceAutoSend, VOICE_AUTO_SEND_DELAY_MS, type VoiceResults } from './voice-auto-send';

const final = (text: string) => ({ isFinal: true, 0: { transcript: text } });
const interim = (text: string) => ({ isFinal: false, 0: { transcript: text } });

function setup() {
	let draft = '';
	let enabled = true;
	let sending = false;
	let pending = false;
	const send = vi.fn((_text: string) => { draft = ''; });
	const onTranscript = vi.fn((text: string) => { draft = [draft, text].filter(Boolean).join(' '); });
	const voice = createVoiceAutoSend({
		isEnabled: () => enabled,
		canSend: () => !sending && Boolean(draft.trim()),
		onTranscript,
		onPendingChange: (value) => { pending = value; },
		onSend: () => send(draft)
	});
	return {
		voice, send, onTranscript,
		draft: () => draft,
		pending: () => pending,
		type: (text: string) => { voice.cancel(); draft = text; },
		setEnabled: (value: boolean) => { enabled = value; },
		setSending: (value: boolean) => { sending = value; },
		manualSend: () => { voice.cancel(); send(draft); },
		finish: (results: VoiceResults = [final('En lugn promenad')]) => {
			voice.start();
			voice.speechStart();
			voice.result(results);
		}
	};
}

describe('röstinmatning och autosändning', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => { vi.restoreAllMocks(); vi.clearAllTimers(); vi.useRealTimers(); });

	it('skickar final efter exakt 1500 ms även när speechend/end uteblir helt', () => {
		const t = setup();
		t.finish();
		expect(t.draft()).toBe('En lugn promenad');
		expect(t.pending()).toBe(true);
		vi.advanceTimersByTime(VOICE_AUTO_SEND_DELAY_MS - 1);
		expect(t.send).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(t.send).toHaveBeenCalledTimes(1);
		expect(t.send).toHaveBeenCalledWith('En lugn promenad');
		expect(t.pending()).toBe(false);
	});

	it('väntar 1500 ms från final, inte från mikrofonstart', () => {
		const t = setup();
		t.voice.start();
		vi.advanceTimersByTime(2000);
		t.voice.result([final('Hej')]);
		vi.advanceTimersByTime(1499);
		expect(t.send).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(t.send).toHaveBeenCalledTimes(1);
	});

	it('speechstart före timeout avbryter autosändning direkt', () => {
		const t = setup();
		t.finish();
		vi.advanceTimersByTime(1499);
		t.voice.speechStart();
		expect(t.pending()).toBe(false);
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
		t.voice.result([final('Jag vill'), final('fortsätta prata')]);
		expect(t.draft()).toBe('Jag vill fortsätta prata');
		vi.advanceTimersByTime(1499);
		expect(t.send).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(t.send).toHaveBeenCalledTimes(1);
		expect(t.send).toHaveBeenCalledWith('Jag vill fortsätta prata');
		t.voice.result([final('Jag vill'), final('fortsätta prata')]);
		vi.runAllTimers();
		expect(t.send).toHaveBeenCalledTimes(1);
	});

	it('återupptaget tal utan ny final får inte skicka tidigare final', () => {
		const t = setup();
		t.finish();
		t.voice.speechStart();
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

	it('upprepad final avbryter timern men återanvänder inte ett redan behandlat resultat', () => {
		const t = setup();
		t.finish();
		vi.advanceTimersByTime(1499);
		t.voice.result([final('En lugn promenad')]);
		vi.runAllTimers();
		expect(t.onTranscript).toHaveBeenCalledTimes(1);
		expect(t.send).not.toHaveBeenCalled();
		expect(t.pending()).toBe(false);
	});

	it('manuell sändning före timeout förhindrar dubbelsändning', () => {
		const t = setup();
		t.finish();
		vi.advanceTimersByTime(1000);
		t.manualSend();
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

	it('nytt result avbryter timern före bearbetning och ny final startar en hel väntetid', () => {
		const t = setup();
		t.finish([final('Första delen')]);
		vi.advanceTimersByTime(1000);
		t.onTranscript.mockImplementationOnce(() => {
			expect(t.pending()).toBe(false);
			expect(vi.getTimerCount()).toBe(0);
		});
		t.voice.result([final('Första delen'), final('Andra delen')]);
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
		t.voice.result([final('En lugn promenad')]);
		vi.runAllTimers();
		expect(t.send).not.toHaveBeenCalled();
	});

	it.each([
		['interim', [final('Hej'), interim('mer')]],
		['tomt event', []],
		['tom ny final', [final('Hej'), final(' ')]]
	])('nytt result med %s avbryter pending utan att arma en timer', (_name, results) => {
		const t = setup();
		t.finish([final('Hej')]);
		vi.advanceTimersByTime(1499);
		t.voice.result(results as VoiceResults);
		expect(t.pending()).toBe(false);
		vi.runAllTimers();
		expect(t.send).not.toHaveBeenCalled();
		expect(t.draft()).toBe('Hej');
	});

	it('flera interim-resultat kan aldrig arma autosändning', () => {
		const t = setup();
		t.voice.start();
		for (const text of ['Jag', 'Jag vill', 'Jag vill prata']) {
			t.voice.result([interim(text)]);
			vi.advanceTimersByTime(2000);
		}
		expect(t.pending()).toBe(false);
		expect(t.onTranscript).not.toHaveBeenCalled();
		expect(t.send).not.toHaveBeenCalled();
	});

	it('Avbryt autosändning bevarar utkastet och ignorerar sena resultat', () => {
		const t = setup();
		t.finish();
		t.voice.cancel();
		t.voice.result([final('En lugn promenad'), final('Sena ord')]);
		vi.runAllTimers();
		expect(t.send).not.toHaveBeenCalled();
		expect(t.draft()).toBe('En lugn promenad');
	});

	it('en stale timer får varken skicka eller avbryta en ersättande sessions timer', () => {
		const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
		const t = setup();
		t.finish([final('Gammal session')]);
		const staleCallback = timeoutSpy.mock.calls.at(-1)![0] as () => void;
		t.voice.cancel();
		t.type('');
		t.finish([final('Ny session')]);
		staleCallback();
		expect(t.send).not.toHaveBeenCalled();
		expect(t.pending()).toBe(true);
		vi.advanceTimersByTime(1500);
		expect(t.send).toHaveBeenCalledExactlyOnceWith('Ny session');
	});

	it('en stale timer från föregående final kan inte skicka nästa final för tidigt', () => {
		const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
		const t = setup();
		t.finish([final('Första')]);
		const staleCallback = timeoutSpy.mock.calls.at(-1)![0] as () => void;
		vi.advanceTimersByTime(1000);
		t.voice.result([final('Första'), final('andra')]);
		staleCallback();
		expect(t.send).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1500);
		expect(t.send).toHaveBeenCalledExactlyOnceWith('Första andra');
	});
});
