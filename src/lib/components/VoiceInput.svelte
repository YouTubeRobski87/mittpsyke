<script lang="ts">
	import { Mic, Square } from 'lucide-svelte';
	import { onDestroy, onMount } from 'svelte';

	type SpeechRecognitionResultLike = {
		isFinal: boolean;
		0?: { transcript?: string };
	};

	type SpeechRecognitionEventLike = {
		results: {
			length: number;
			[index: number]: SpeechRecognitionResultLike;
		};
	};

	type SpeechRecognitionErrorEventLike = {
		error?: string;
	};

	type SpeechRecognitionLike = {
		lang: string;
		continuous: boolean;
		interimResults: boolean;
		onstart: (() => void) | null;
		onresult: ((event: SpeechRecognitionEventLike) => void) | null;
		onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
		onend: (() => void) | null;
		start: () => void;
		stop: () => void;
		abort: () => void;
	};

	type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

	let {
		disabled = false,
		onTranscript
	}: {
		disabled?: boolean;
		onTranscript: (transcript: string) => void;
	} = $props();

	let recognition: SpeechRecognitionLike | null = null;
	let supported = $state(true);
	let listening = $state(false);
	let statusMessage = $state('');
	let transcript = '';
	let shouldSubmitTranscript = false;

	function getSpeechRecognitionConstructor() {
		const speechWindow = window as Window & {
			SpeechRecognition?: SpeechRecognitionConstructor;
			webkitSpeechRecognition?: SpeechRecognitionConstructor;
		};

		return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
	}

	function describeError(error?: string) {
		if (error === 'not-allowed' || error === 'service-not-allowed') {
			return 'Mikrofonen är blockerad. Tillåt mikrofonåtkomst i webbläsaren och försök igen.';
		}
		if (error === 'no-speech') return 'Jag hörde inget tal. Försök igen när du är redo.';
		if (error === 'audio-capture') return 'Ingen mikrofon hittades.';
		return 'Taligenkänningen kunde inte starta. Du kan fortfarande skriva ditt meddelande.';
	}

	function startListening() {
		if (!recognition || disabled || listening) return;

		transcript = '';
		shouldSubmitTranscript = true;
		statusMessage = 'Lyssnar… prata i din egen takt.';

		try {
			recognition.start();
		} catch {
			shouldSubmitTranscript = false;
			statusMessage = 'Mikrofonen kunde inte starta. Vänta en stund och försök igen.';
		}
	}

	function stopListening() {
		if (!recognition || !listening) return;
		statusMessage = 'Bearbetar det du sa…';
		recognition.stop();
	}

	onMount(() => {
		const Recognition = getSpeechRecognitionConstructor();
		if (!Recognition) {
			supported = false;
			statusMessage = 'Röstinmatning stöds inte i den här webbläsaren. Du kan skriva som vanligt.';
			return;
		}

		recognition = new Recognition();
		recognition.lang = 'sv-SE';
		recognition.continuous = false;
		recognition.interimResults = true;
		recognition.onstart = () => {
			listening = true;
		};
		recognition.onresult = (event) => {
			let nextTranscript = '';
			for (let index = 0; index < event.results.length; index += 1) {
				nextTranscript += event.results[index]?.[0]?.transcript ?? '';
			}
			transcript = nextTranscript.trim();
			if (transcript) statusMessage = `Hörde: ${transcript}`;
		};
		recognition.onerror = (event) => {
			shouldSubmitTranscript = false;
			listening = false;
			statusMessage = describeError(event.error);
		};
		recognition.onend = () => {
			listening = false;
			if (shouldSubmitTranscript && transcript) {
				onTranscript(transcript);
				statusMessage = 'Texten är tillagd. Läs gärna igenom den innan du skickar.';
			} else if (shouldSubmitTranscript) {
				statusMessage = 'Jag hörde inget tal. Försök igen när du är redo.';
			}
			shouldSubmitTranscript = false;
		};
	});

	onDestroy(() => {
		shouldSubmitTranscript = false;
		recognition?.abort();
	});
</script>

<div class="voice-input">
	<button
		type="button"
		class:listening
		onclick={listening ? stopListening : startListening}
		disabled={disabled || !supported}
		aria-pressed={listening}
		aria-describedby="voice-input-status voice-input-privacy"
	>
		{#if listening}
			<Square size={15} aria-hidden="true" />
			<span>Stoppa</span>
		{:else}
			<Mic size={17} aria-hidden="true" />
			<span>Prata in</span>
		{/if}
	</button>
	<p id="voice-input-status" class="status" aria-live="polite">{statusMessage}</p>
</div>

<p id="voice-input-privacy" class="privacy-note">
	Taligenkänningen hanteras av din webbläsare och kan skicka ljud till webbläsarens leverantör.
	MittPsyke sparar ingen ljudfil här. Texten läggs i fältet så att du kan läsa innan du skickar.
</p>

<style>
	.voice-input {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		margin-bottom: 0.6rem;
	}

	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		min-height: 2.35rem;
		padding: 0.48rem 0.8rem;
		border: 1px solid rgba(15, 23, 42, 0.14);
		border-radius: 999px;
		background: rgba(15, 23, 42, 0.04);
		color: inherit;
		font-size: 0.8rem;
		font-weight: 650;
		transition: background-color 0.16s ease, border-color 0.16s ease;
	}

	button:hover:not(:disabled) {
		background: rgba(15, 23, 42, 0.08);
	}

	button.listening {
		border-color: rgba(190, 24, 93, 0.5);
		background: rgba(190, 24, 93, 0.1);
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}

	button:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.status,
	.privacy-note {
		margin: 0;
		font-size: 0.72rem;
		line-height: 1.4;
		opacity: 0.65;
	}

	.status:empty {
		display: none;
	}

	.privacy-note {
		margin-bottom: 0.65rem;
	}

	:global(.dark) button {
		border-color: rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.06);
	}

	:global(.dark) button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) button.listening {
		border-color: rgba(244, 114, 182, 0.55);
		background: rgba(190, 24, 93, 0.2);
	}

	@media (max-width: 768px) {
		.voice-input {
			align-items: flex-start;
			margin-bottom: 0.5rem;
		}

		.status {
			padding-top: 0.3rem;
		}

		.privacy-note {
			font-size: 0.68rem;
		}
	}
</style>
