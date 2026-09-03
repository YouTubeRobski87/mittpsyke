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
	let timer: ReturnType<typeof setTimeout> | null = null;
	let timerVersion = 0;

	function clearTimer() {
		timerVersion += 1;
		if (timer !== null) clearTimeout(timer);
		timer = null;
		options.onPendingChange(false);
	}

	function cancel() {
		active = false;
		clearTimer();
	}

	function schedule() {
		if (!active || !options.isEnabled()) return;

		const version = timerVersion;
		options.onPendingChange(true);
		timer = setTimeout(() => {
			// An already queued callback must not consume a newer timer/session.
			if (version !== timerVersion) return;
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
		},
		result(results: VoiceResults) {
			if (!active) return;
			// Every result is activity, including interim and repeated final results.
			// Cancel before processing; only a NEW non-empty final can arm the timer.
			clearTimer();
			const additions: string[] = [];
			let hasInterim = false;
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
				options.onTranscript(additions.join(' '));
				if (!hasInterim) schedule();
			}
		},
		speechStart() {
			if (!active) return;
			clearTimer();
		},
		cancel
	};
}
