<script lang="ts">
	import { onDestroy } from 'svelte';

	type Props = {
		onrecorded?: (blob: Blob) => void;
		onreset?: () => void;
	};

	let { onrecorded, onreset }: Props = $props();

	const MAX_SECONDS = 180;
	const VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
	type CameraFacingMode = 'user' | 'environment';

	const hasGetUserMedia =
		typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
	const hasMediaRecorder = typeof MediaRecorder !== 'undefined';

	// Live-inspelning används överallt där webbläsaren stöder det (även mobil).
	// File input med capture finns kvar som fallback för webbläsare utan stöd.
	const useLiveRecorder = hasGetUserMedia && hasMediaRecorder;

	let stream = $state<MediaStream | null>(null);
	let recorder: MediaRecorder | null = null;
	let chunks: BlobPart[] = [];
	let previewEl = $state<HTMLVideoElement | null>(null);
	let playbackUrl = $state<string | null>(null);
	let recording = $state(false);
	let seconds = $state(0);
	let timer: ReturnType<typeof setInterval> | null = null;
	let errorMessage = $state('');
	let activeFacingMode = $state<CameraFacingMode>('environment');

	// Väljer ett mime-format webbläsaren faktiskt stöder. iOS Safari stöder inte
	// webm utan bara mp4, och returnerar ibland inget från isTypeSupported alls —
	// då skapar vi MediaRecorder utan mimeType och låter webbläsaren välja själv.
	function createRecorder(mediaStream: MediaStream): MediaRecorder {
		const types = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'];
		const mimeType = types.find((t) => {
			try {
				return MediaRecorder.isTypeSupported(t);
			} catch {
				return false;
			}
		});
		try {
			return mimeType
				? new MediaRecorder(mediaStream, { mimeType })
				: new MediaRecorder(mediaStream);
		} catch {
			return new MediaRecorder(mediaStream);
		}
	}

	function setPlayback(blob: Blob) {
		if (playbackUrl) URL.revokeObjectURL(playbackUrl);
		playbackUrl = URL.createObjectURL(blob);
		onrecorded?.(blob);
	}

	function getVideoConstraints(facingMode: CameraFacingMode): MediaTrackConstraints {
		return {
			facingMode: facingMode === 'environment' ? { ideal: 'environment' } : 'user',
			width: { ideal: 1280 }
		};
	}

	// ── Live-inspelning (desktop) ──
	async function startCamera(facingMode: CameraFacingMode = activeFacingMode) {
		errorMessage = '';
		activeFacingMode = facingMode;
		stream?.getTracks().forEach((t) => t.stop());
		stream = null;
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: getVideoConstraints(facingMode),
				audio: true
			});
			if (previewEl) {
				previewEl.srcObject = stream;
				previewEl.muted = true;
				await previewEl.play();
			}
		} catch (e) {
			errorMessage =
				'Kunde inte starta kameran. Kontrollera att webbläsaren har tillgång till kamera och mikrofon.';
			console.error('Kamerafel:', e);
		}
	}

	function switchCamera() {
		void startCamera(activeFacingMode === 'environment' ? 'user' : 'environment');
	}

	function startRecording() {
		if (!stream) return;
		chunks = [];
		seconds = 0;
		recorder = createRecorder(stream);
		recorder.ondataavailable = (e) => {
			if (e.data.size) chunks.push(e.data);
		};
		recorder.onstop = () => {
			setPlayback(new Blob(chunks, { type: recorder!.mimeType || 'video/mp4' }));
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

	function resetLive() {
		if (playbackUrl) URL.revokeObjectURL(playbackUrl);
		playbackUrl = null;
		errorMessage = '';
		onreset?.();
		void startCamera(activeFacingMode);
	}

	// ── Native kamera-app (mobil) ──
	function handleFileSelect(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;
		input.value = ''; // tillåt att välja samma fil igen
		if (!file) return;

		if (!file.type.startsWith('video/')) {
			errorMessage = 'Välj en videofil.';
			return;
		}
		if (file.size > VIDEO_MAX_BYTES) {
			errorMessage = 'Videon är för stor (max 50 MB). Spela in en kortare video.';
			return;
		}
		errorMessage = '';
		setPlayback(file);
	}

	function resetFile() {
		if (playbackUrl) URL.revokeObjectURL(playbackUrl);
		playbackUrl = null;
		errorMessage = '';
		onreset?.();
	}

	onDestroy(() => {
		stream?.getTracks().forEach((t) => t.stop());
		if (timer) clearInterval(timer);
		if (playbackUrl) URL.revokeObjectURL(playbackUrl);
	});
</script>

{#if useLiveRecorder}
	{#if !playbackUrl}
		<div class="video-camera-wrap">
			<video bind:this={previewEl} playsinline autoplay muted class="video-preview"></video>
		</div>
		{#if errorMessage}
			<p class="video-error">{errorMessage}</p>
		{/if}
		{#if !stream}
			<button type="button" class="video-action-btn" onclick={() => startCamera()}> Starta kamera </button>
		{:else if !recording}
			<button
				type="button"
				class="video-action-btn video-action-btn--record"
				onclick={startRecording}
			>
				● Spela in
			</button>
			<button
				type="button"
				class="video-action-btn"
				onclick={switchCamera}
			>
				Byt kamera
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
		<button type="button" class="video-action-btn" onclick={resetLive}> Spela in igen </button>
	{/if}
{:else}
	<!-- Mobil / webbläsare utan live-inspelning: använd den inbyggda kameran -->
	{#if !playbackUrl}
		<label class="video-action-btn video-action-btn--record">
			● Spela in video
			<input
				type="file"
				accept="video/*"
				capture="user"
				class="video-file-input"
				onchange={handleFileSelect}
			/>
		</label>
		{#if errorMessage}
			<p class="video-error">{errorMessage}</p>
		{/if}
	{:else}
		<div class="video-playback-wrap">
			<!-- svelte-ignore a11y_media_has_caption -->
			<video src={playbackUrl} controls playsinline class="video-playback"></video>
		</div>
		{#if errorMessage}
			<p class="video-error">{errorMessage}</p>
		{/if}
		<button type="button" class="video-action-btn" onclick={resetFile}> Spela in igen </button>
	{/if}
{/if}

<style>
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
		min-height: 9rem;
		max-height: 14rem;
		object-fit: cover;
	}

	.video-error {
		margin: 0.3rem 0 0;
		font-size: 0.82rem;
		color: hsl(var(--error-foreground));
	}

	.video-action-btn {
		display: inline-block;
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

	.video-file-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
</style>
