<script lang="ts">
	import { CheckCircle2, LoaderCircle, Mic, MicOff, Square, Trash2 } from 'lucide-svelte';
	import { onDestroy, onMount } from 'svelte';
	import { createVoiceAutoSend, type VoiceResults } from '$lib/ai/voice-auto-send';

	type VoiceStatus = 'ready' | 'listening' | 'transcribing' | 'pending-send' | 'ready-to-send' | 'error' | 'unsupported';

	type SpeechRecognitionEventLike = {
		results: VoiceResults;
	};

	type SpeechRecognitionErrorEventLike = {
		error?: string;
	};

	type SpeechRecognitionLike = {
		lang: string;
		continuous: boolean;
		interimResults: boolean;
		onstart: (() => void) | null;
		onspeechstart: (() => void) | null;
		onspeechend: (() => void) | null;
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
		hasDraft = false,
		showPrivacyNote = true,
		autoSend = false,
		onTranscript,
		onAutoSend = () => undefined,
		onClear,
		onBusyChange = () => undefined
	}: {
		disabled?: boolean;
		hasDraft?: boolean;
		showPrivacyNote?: boolean;
		autoSend?: boolean;
		onTranscript: (transcript: string) => void;
		onAutoSend?: () => void;
		onClear: () => void;
		onBusyChange?: (busy: boolean) => void;
	} = $props();

	const HELP_STORAGE_KEY = 'mittpsyke:voice-input-help-seen';

	let recognition: SpeechRecognitionLike | null = null;
	let Recognition: SpeechRecognitionConstructor | null = null;
	let status = $state<VoiceStatus>('ready');
	let detailMessage = $state('Tryck på mikrofonen när du vill börja.');
	let showFirstTimeHelp = $state(false);
	let isListening = $state(false);
	let pendingSend = $state(false);
	let hasFinalTranscript = false;
	const autoSender = createVoiceAutoSend({
		isEnabled: () => autoSend && !disabled,
		canSend: () => hasDraft && !disabled,
		onTranscript: (text) => {
			hasFinalTranscript = true;
			onTranscript(text);
		},
		onPendingChange: (pending) => {
			pendingSend = pending;
			if (pending) setStatus('pending-send', isListening
				? 'Texten skickas strax. Du kan fortsätta prata eller avbryta.'
				: 'Texten skickas strax. Du kan avbryta.');
		},
		onSend: () => {
			cancel();
			onAutoSend();
		}
	});

	let statusLabel = $derived(
		status === 'ready'
			? 'Redo'
			: status === 'listening'
				? 'Lyssnar'
				: status === 'transcribing'
					? 'Transkriberar'
					: status === 'pending-send'
						? 'Skickar snart'
						: status === 'ready-to-send'
							? 'Klart att skicka'
							: status === 'unsupported'
								? 'Stöds inte'
								: 'Fel'
	);

	function setStatus(nextStatus: VoiceStatus, message: string) {
		status = nextStatus;
		detailMessage = message;
		onBusyChange(nextStatus === 'listening' || nextStatus === 'transcribing');
	}

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
		if (error === 'audio-capture') return 'Ingen mikrofon hittades. Du kan skriva i fältet i stället.';
		if (error === 'network') return 'Taligenkänningen tappade kontakten. Försök igen om en stund.';
		return 'Taligenkänningen kunde inte starta. Du kan fortfarande skriva ditt meddelande.';
	}

	function startListening() {
		if (!Recognition || disabled || isListening) return;
		cancel();
		autoSender.start();
		hasFinalTranscript = false;
		showFirstTimeHelp = false;
		isListening = true;
		setStatus('listening', 'Prata i din egen takt. Tryck på Stoppa när du är klar.');
		// A new instance isolates late events from a cancelled or already sent recording.
		const current = new Recognition();
		recognition = current;
		current.lang = 'sv-SE';
		current.continuous = autoSend;
		current.interimResults = true;
		current.onstart = () => {
			if (recognition !== current) return;
			setStatus('listening', 'Prata i din egen takt. Tryck på Stoppa när du är klar.');
		};
		current.onspeechstart = () => {
			if (recognition !== current) return;
			autoSender.speechStart();
			setStatus('listening', 'Prata i din egen takt. Tryck på Stoppa när du är klar.');
		};
		current.onspeechend = () => {
			if (recognition !== current) return;
			setStatus('transcribing', 'Gör om talet till text…');
			autoSender.speechEnd();
		};
		current.onresult = (event) => {
			if (recognition !== current) return;
			autoSender.result(event.results);
			if (!pendingSend) setStatus('listening', 'Prata i din egen takt. Tryck på Stoppa när du är klar.');
		};
		current.onerror = (event) => {
			if (recognition !== current) return;
			cancel();
			setStatus('error', describeError(event.error));
		};
		current.onend = () => {
			if (recognition !== current) return;
			isListening = false;
			autoSender.speechEnd();
			if (!pendingSend) {
				setStatus(hasFinalTranscript ? 'ready-to-send' : 'error', hasFinalTranscript
					? 'Kontrollera texten och tryck på Skicka när du är redo.'
					: 'Jag hörde inget färdigt tal. Försök igen när du är redo.');
			}
		};

		try {
			current.start();
		} catch {
			cancel();
			setStatus('error', 'Mikrofonen kunde inte starta. Vänta en stund och försök igen.');
		}
	}

	function stopListening() {
		if (!recognition || !isListening) return;
		autoSender.waitForEnd();
		setStatus('transcribing', 'Gör om talet till text…');
		try {
			recognition.stop();
		} catch {
			cancel();
			setStatus('error', describeError());
		}
	}

	// Called synchronously before manual send, editing, clearing or changing settings.
	// Keep the final draft, but make every outstanding timer/event inert.
	export function cancel() {
		if (!recognition && !pendingSend) return;
		autoSender.cancel();
		const current = recognition;
		recognition = null;
		isListening = false;
		if (current) {
			current.onstart = null;
			current.onspeechstart = null;
			current.onspeechend = null;
			current.onresult = null;
			current.onerror = null;
			current.onend = null;
			current.abort();
		}
		setStatus(hasDraft ? 'ready-to-send' : 'ready', hasDraft
			? 'Texten är kvar. Tryck på Skicka när du är redo.'
			: 'Tryck på mikrofonen när du vill börja.');
	}

	function clearDraft() {
		if (!hasDraft) return;
		cancel();
		onClear();
		setStatus('ready', 'Texten är rensad. Tryck på mikrofonen när du vill börja igen.');
	}

	$effect(() => {
		if (!hasDraft && status === 'ready-to-send') {
			setStatus('ready', 'Tryck på mikrofonen när du vill börja.');
		}
	});

	$effect(() => {
		if (disabled) cancel();
	});

	onMount(() => {
		try {
			showFirstTimeHelp = !window.localStorage.getItem(HELP_STORAGE_KEY);
			window.localStorage.setItem(HELP_STORAGE_KEY, '1');
		} catch {
			showFirstTimeHelp = true;
		}

		Recognition = getSpeechRecognitionConstructor();
		if (!Recognition) {
			setStatus(
				'unsupported',
				'Röstinmatning stöds inte i den här webbläsaren. Skriv i fältet nedan i stället.'
			);
			return;
		}
	});

	onDestroy(cancel);
</script>

<div class="voice-card" class:has-error={status === 'error'} class:unsupported={status === 'unsupported'}>
	{#if showFirstTimeHelp}
		<p class="first-time-help">Du kan prata fritt. Texten går att ändra innan du skickar.</p>
	{/if}
	{#if autoSend}
		<p class="first-time-help">Skickas automatiskt efter tal. Du kan avbryta innan texten skickas.</p>
	{/if}

	<div class="voice-controls">
		<button
			type="button"
			class="microphone-button"
			class:listening={isListening}
			onclick={isListening ? stopListening : startListening}
			disabled={disabled || status === 'unsupported' || (status === 'transcribing' && !isListening)}
			aria-pressed={isListening}
			aria-describedby={showPrivacyNote ? 'voice-input-status voice-input-privacy' : 'voice-input-status'}
			aria-label={isListening
				? 'Stoppa röstinmatning'
				: status === 'unsupported'
					? 'Röstinmatning stöds inte. Skriv ditt meddelande i textfältet.'
					: 'Starta röstinmatning'}
		>
			{#if isListening}
				<Square size={15} aria-hidden="true" />
				<span>Stoppa lugnt</span>
			{:else if status === 'unsupported'}
				<MicOff size={17} aria-hidden="true" />
				<span>Skriv i stället</span>
			{:else}
				<Mic size={18} aria-hidden="true" />
				<span>Prata in</span>
			{/if}
		</button>

		{#if pendingSend}
			<button type="button" class="clear-button" onclick={cancel}>
				Avbryt autosändning
			</button>
		{:else if hasDraft}
			<button
				type="button"
				class="clear-button"
				onclick={clearDraft}
				disabled={disabled || isListening}
				aria-label="Rensa meddelandetexten"
			>
				<Trash2 size={15} aria-hidden="true" />
				<span>Rensa text</span>
			</button>
		{/if}
	</div>

	<div id="voice-input-status" class="status-row" data-status={status} aria-live="polite">
		<span class="status-icon" aria-hidden="true">
			{#if status === 'transcribing'}
				<LoaderCircle size={15} />
			{:else if status === 'ready-to-send'}
				<CheckCircle2 size={15} />
			{:else if status === 'unsupported'}
				<MicOff size={15} />
			{:else}
				<span class="status-dot"></span>
			{/if}
		</span>
		<span><strong>{statusLabel}.</strong> {detailMessage}</span>
	</div>
</div>

{#if showPrivacyNote}
	<p id="voice-input-privacy" class="privacy-note">
		Du väljer själv vad du skickar. Texten sparas bara när du skickar.
	</p>
{/if}

<style>
	.voice-card {
		display: grid;
		gap: 0.5rem;
		margin-bottom: 0.4rem;
		padding: 0.6rem 0.72rem;
		border: 1px solid rgba(15, 118, 110, 0.16);
		border-radius: 14px;
		background: rgba(15, 118, 110, 0.035);
	}

	.voice-card.has-error,
	.voice-card.unsupported {
		border-color: rgba(100, 116, 139, 0.2);
		background: rgba(100, 116, 139, 0.04);
	}

	.first-time-help,
	.privacy-note,
	.status-row {
		margin: 0;
		font-size: 0.74rem;
		line-height: 1.45;
	}

	.first-time-help {
		color: rgba(15, 23, 42, 0.76);
	}

	.voice-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.microphone-button,
	.clear-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.42rem;
		min-height: 2.5rem;
		padding: 0.52rem 0.82rem;
		border-radius: 999px;
		color: inherit;
		font-size: 0.8rem;
		font-weight: 650;
		transition: background-color 0.16s ease, border-color 0.16s ease, opacity 0.16s ease;
	}

	.microphone-button {
		border: 1px solid rgba(15, 118, 110, 0.28);
		background: rgba(15, 118, 110, 0.08);
	}

	.microphone-button:hover:not(:disabled) {
		background: rgba(15, 118, 110, 0.14);
	}

	.microphone-button.listening {
		border-color: rgba(14, 116, 144, 0.42);
		background: rgba(14, 116, 144, 0.12);
	}

	.clear-button {
		border: 1px solid rgba(15, 23, 42, 0.12);
		background: transparent;
		font-weight: 550;
		opacity: 0.72;
	}

	.clear-button:hover:not(:disabled) {
		background: rgba(15, 23, 42, 0.05);
		opacity: 1;
	}

	.microphone-button:disabled,
	.clear-button:disabled {
		cursor: not-allowed;
		opacity: 0.46;
	}

	.microphone-button:focus-visible,
	.clear-button:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.status-row {
		display: flex;
		align-items: flex-start;
		gap: 0.38rem;
		color: rgba(15, 23, 42, 0.66);
	}

	.status-row strong {
		font-weight: 700;
	}

	.status-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1rem;
		min-height: 1rem;
		margin-top: 0.08rem;
		color: rgb(15, 118, 110);
	}

	.status-dot {
		width: 0.48rem;
		height: 0.48rem;
		border-radius: 999px;
		background: currentColor;
	}

	.status-row[data-status='listening'] .status-dot {
		background: rgb(14, 116, 144);
	}

	.status-row[data-status='transcribing'] .status-icon :global(svg) {
		animation: gentle-spin 1.4s linear infinite;
	}

	.status-row[data-status='error'],
	.status-row[data-status='unsupported'] {
		color: rgba(71, 85, 105, 0.82);
	}

	.privacy-note {
		margin-bottom: 0.65rem;
		opacity: 0.58;
	}

	:global(.dark) .voice-card {
		border-color: rgba(94, 234, 212, 0.16);
		background: rgba(45, 212, 191, 0.045);
	}

	:global(.dark) .voice-card.has-error,
	:global(.dark) .voice-card.unsupported {
		border-color: rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.035);
	}

	:global(.dark) .first-time-help,
	:global(.dark) .status-row {
		color: rgba(226, 232, 240, 0.72);
	}

	:global(.dark) .microphone-button {
		border-color: rgba(94, 234, 212, 0.24);
		background: rgba(45, 212, 191, 0.09);
	}

	:global(.dark) .microphone-button:hover:not(:disabled) {
		background: rgba(45, 212, 191, 0.14);
	}

	:global(.dark) .microphone-button.listening {
		border-color: rgba(103, 232, 249, 0.34);
		background: rgba(34, 211, 238, 0.12);
	}

	:global(.dark) .clear-button {
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .clear-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.07);
	}

	@keyframes gentle-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.status-row[data-status='transcribing'] .status-icon :global(svg) {
			animation: none;
		}
	}

	@media (max-width: 768px) {
		.voice-card {
			gap: 0.45rem;
			padding: 0.55rem 0.62rem;
		}

		.voice-controls {
			align-items: center;
		}

		.microphone-button,
		.clear-button {
			min-height: 2.4rem;
		}

		.microphone-button {
			flex: 0 0 auto;
		}

		.clear-button {
			flex: 0 0 auto;
		}

		.first-time-help,
		.status-row,
		.privacy-note {
			font-size: 0.7rem;
		}
	}
</style>
