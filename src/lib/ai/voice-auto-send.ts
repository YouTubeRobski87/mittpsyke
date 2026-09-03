export const VOICE_AUTO_SEND_DELAY_MS = 1500;

export type VoiceResults = ArrayLike<{
	isFinal: boolean;
	0?: { transcript?: string };
}>;

/** One microphone session. Only final results enter the draft; sending uses the chat's callback. */
export function createVoiceAutoSend(options: {
	isEnabled: () => boolean;
	canSend: () => boolean;
	onTranscript: (text: string) => void;
	onPendingChange: (pending: boolean) => void;
	onSend: () => void;
}) {
	let active = false;
	let finalCount = 0;
	let hasFinalText = false;
	let hasInterim = false;
	let awaitingFinal = true;
	let speechEnded = false;
	let timer: ReturnType<typeof setTimeout> | null = null;

	function clearTimer() {
		if (timer !== null) clearTimeout(timer);
		timer = null;
		options.onPendingChange(false);
	}

	function cancel() {
		active = false;
		clearTimer();
	}

	function schedule() {
		clearTimer();
		if (!active || !speechEnded || awaitingFinal || hasInterim || !hasFinalText || !options.isEnabled()) return;

		options.onPendingChange(true);
		timer = setTimeout(() => {
			// Consume before calling out: duplicate events and failed sends cannot retry this session.
			const allowed = active && options.isEnabled() && options.canSend();
			cancel();
			if (allowed) options.onSend();
		}, VOICE_AUTO_SEND_DELAY_MS);
	}

	return {
		start() {
			cancel();
			active = true;
			finalCount = 0;
			hasFinalText = false;
			hasInterim = false;
			awaitingFinal = true;
			speechEnded = false;
		},
		result(results: VoiceResults) {
			if (!active) return;
			const additions: string[] = [];
			hasInterim = false;
			for (let index = 0; index < results.length; index += 1) {
				const result = results[index];
				if (!result.isFinal) {
					hasInterim = true;
					continue;
				}
				// Web Speech results are cumulative; final entries are immutable.
				if (index < finalCount) continue;
				finalCount = index + 1;
				const text = result[0]?.transcript?.trim();
				if (text) additions.push(text);
			}
			if (additions.length) {
				hasFinalText = true;
				awaitingFinal = false;
				options.onTranscript(additions.join(' '));
			}
			if (hasInterim) awaitingFinal = true;
			schedule();
		},
		speechStart() {
			if (!active) return;
			speechEnded = false;
			awaitingFinal = true;
			clearTimer();
		},
		speechEnd() {
			if (!active) return;
			speechEnded = true;
			schedule();
		},
		waitForEnd() {
			speechEnded = false;
			clearTimer();
		},
		cancel
	};
}
