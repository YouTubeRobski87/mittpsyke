<script lang="ts">
	import { onDestroy } from 'svelte';

	type Props = {
		onrecorded?: (blob: Blob) => void;
		onreset?: () => void;
	};

	let { onrecorded, onreset }: Props = $props();

	const MAX_SECONDS = 180;
	const supported =
		typeof window !== 'undefined' &&
		typeof MediaRecorder !== 'undefined' &&
		typeof navigator !== 'undefined' &&
		!!navigator.mediaDevices?.getUserMedia;

	let stream = $state<MediaStream | null>(null);
	let recorder: MediaRecorder | null = null;
	let chunks: BlobPart[] = [];
	let previewEl = $state<HTMLVideoElement | null>(null);
	let playbackUrl = $state<string | null>(null);
	let recording = $state(false);
	let seconds = $state(0);
	let timer: ReturnType<typeof setInterval> | null = null;
	let cameraError = $state('');

	function getMimeType(): string {
		const types = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'];
		return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
	}

	async function startCamera() {
		cameraError = '';
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'user', width: { ideal: 1280 } },
				audio: true
			});
			if (previewEl) {
				previewEl.srcObject = stream;
				previewEl.muted = true;
				await previewEl.play();
			}
		} catch (e) {
			cameraError =
				'Kunde inte starta kameran. Kontrollera att webbläsaren har tillgång till kamera och mikrofon.';
			console.error('Kamerafel:', e);
		}
	}

	function startRecording() {
		if (!stream) return;
		chunks = [];
		seconds = 0;
		recorder = new MediaRecorder(stream, { mimeType: getMimeType() });
		recorder.ondataavailable = (e) => {
			if (e.data.size) chunks.push(e.data);
		};
		recorder.onstop = () => {
			const blob = new Blob(chunks, { type: recorder!.mimeType });
			playbackUrl = URL.createObjectURL(blob);
			onrecorded?.(blob);
		};
		recorder.start();
		recording = true;
		timer = setInterval(() => {
			seconds++;
			if (seconds >= MAX_SECONDS) stopRecording();
		}, 1000);
	}

	function stopRecording() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
		if (recorder && recorder.state !== 'inactive') recorder.stop();
		recording = false;
		stream?.getTracks().forEach((t) => t.stop());
		stream = null;
	}

	function reset() {
		if (playbackUrl) URL.revokeObjectURL(playbackUrl);
		playbackUrl = null;
		onreset?.();
		startCamera();
	}

	onDestroy(() => {
		stream?.getTracks().forEach((t) => t.stop());
		if (timer) clearInterval(timer);
		if (playbackUrl) URL.revokeObjectURL(playbackUrl);
	});
</script>

{#if !supported}
	<p class="video-unsupported">Videoinspelning stöds inte i den här webbläsaren.</p>
{:else if !playbackUrl}
	<div class="video-camera-wrap">
		<video bind:this={previewEl} playsinline autoplay muted class="video-preview"></video>
	</div>
	{#if cameraError}
		<p class="video-error">{cameraError}</p>
	{/if}
	{#if !stream}
		<button type="button" class="video-action-btn" onclick={startCamera}> Starta kamera </button>
	{:else if !recording}
		<button type="button" class="video-action-btn video-action-btn--record" onclick={startRecording}>
			● Spela in
		</button>
	{:else}
		<button type="button" class="video-action-btn video-action-btn--stop" onclick={stopRecording}>
			■ Stoppa ({MAX_SECONDS - seconds}s kvar)
		</button>
	{/if}
{:else}
	<div class="video-playback-wrap">
		<!-- svelte-ignore a11y_media_has_caption -->
		<video src={playbackUrl} controls playsinline class="video-playback"></video>
	</div>
	<button type="button" class="video-action-btn" onclick={reset}> Spela in igen </button>
{/if}

<style>
	.video-unsupported {
		margin: 0;
		font-size: 0.83rem;
		color: hsl(var(--muted-foreground));
	}

	.video-camera-wrap,
	.video-playback-wrap {
		width: 100%;
		border-radius: var(--radius-input);
		overflow: hidden;
		border: 1px solid hsl(var(--border));
		background: #000;
	}

	.video-preview,
	.video-playback {
		display: block;
		width: 100%;
		max-height: 14rem;
		object-fit: cover;
	}

	.video-error {
		margin: 0.3rem 0 0;
		font-size: 0.82rem;
		color: hsl(var(--error-foreground));
	}

	.video-action-btn {
		margin-top: 0.4rem;
		border: none;
		background: transparent;
		padding: 0;
		font-size: 0.83rem;
		color: hsl(var(--muted-foreground));
		text-decoration: underline;
		text-underline-offset: 2px;
		cursor: pointer;
		transition: color 130ms ease;
	}

	.video-action-btn:hover {
		color: hsl(var(--foreground));
	}

	.video-action-btn--record {
		color: hsl(var(--foreground));
		font-weight: 600;
	}

	.video-action-btn--stop {
		color: hsl(var(--error-foreground, 0 80% 45%));
	}
</style>
