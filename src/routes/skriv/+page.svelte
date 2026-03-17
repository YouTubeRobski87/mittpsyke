<script lang="ts">
	import { onMount } from 'svelte';
	import { trackWriteStarted, trackContinueFromWrite, trackSaveAccountFromWrite } from '$lib/analytics';

	const DRAFT_KEY = 'mittpsyke:draft';
	const TEMP_KEY = 'mittpsyke_temp_entry';

	let text = $state('');
	let phase: 'writing' | 'done' = $state('writing');
	let charCount = $derived(text.trim().length);
	let returningDraft = $state(''); // Text from previous anonymous session
	let writeStarted = false;

	function handleWriteInput() {
		if (!writeStarted) {
			writeStarted = true;
			trackWriteStarted();
		}
	}

	function handleContinue() {
		if (charCount < 3) return;
		localStorage.setItem(DRAFT_KEY, text.trim());
		trackContinueFromWrite(charCount);
		phase = 'done';
	}

	function handleSaveAccount() {
		// Save as temp entry for register page to pick up
		localStorage.setItem(TEMP_KEY, text.trim());
		trackSaveAccountFromWrite(charCount);
		window.location.href = '/register?from=skriv';
	}

	function handleAnonymous() {
		// Save as temp entry in case they change their mind later
		localStorage.setItem(TEMP_KEY, text.trim());
		// Go back to writing phase
		phase = 'writing';
	}

	function handleWriteMore() {
		phase = 'writing';
	}

	function restoreDraft() {
		text = returningDraft;
		returningDraft = '';
		// Remove from temp storage since it's now in the textarea
		localStorage.removeItem(TEMP_KEY);
	}

	function dismissDraft() {
		returningDraft = '';
		localStorage.removeItem(TEMP_KEY);
	}

	onMount(() => {
		// Check for a previous anonymous session draft
		const tempEntry = localStorage.getItem(TEMP_KEY);
		// Only show "returning draft" if no current draft
		const currentDraft = localStorage.getItem(DRAFT_KEY);

		if (tempEntry && !currentDraft) {
			returningDraft = tempEntry;
		} else if (currentDraft) {
			// Restore normal draft
			text = currentDraft;
		}
	});
</script>

<svelte:head>
	<title>Börja skriva – MittPsyke</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="skriv-page">
	<div class="skriv-container">

		{#if phase === 'writing'}

			<header class="skriv-header">
				<a href="/" class="back-link" aria-label="Tillbaka till startsidan">← MittPsyke</a>
				<h1 class="skriv-heading">Vad snurrar i huvudet just nu?</h1>
				<p class="skriv-sub">Du behöver inte ha rätt ord. Skriv precis som det känns.</p>
			</header>

			{#if returningDraft}
			<div class="returning-banner">
				<div class="returning-banner-top">
					<span class="returning-icon">💬</span>
					<p class="returning-text">Vi hittade ett utkast från tidigare.</p>
				</div>
				<blockquote class="returning-preview">
					{returningDraft.length > 120 ? returningDraft.slice(0, 120) + '…' : returningDraft}
				</blockquote>
				<div class="returning-actions">
					<button class="btn-restore" onclick={restoreDraft}>Hämta tillbaka</button>
					<button class="btn-dismiss" onclick={dismissDraft}>Börja om</button>
				</div>
			</div>
			{/if}

			<div class="textarea-wrap">
				<textarea
					id="skriv-textarea"
					name="entry"
					bind:value={text}
					oninput={handleWriteInput}
					placeholder="Börja skriva här…"
					class="skriv-textarea"
					rows="10"
					autofocus
					aria-label="Skriv vad du tänker"
				></textarea>
			</div>

			<p class="privacy-note">
				Det här är bara för dig.
				<span>Du bestämmer själv vad som sparas.</span>
			</p>

			<div class="skriv-actions">
				<button
					class="btn-primary"
					onclick={handleContinue}
					disabled={charCount < 3}
				>
					Fortsätt
				</button>
			</div>

		{:else}

			<div class="done-view">
				<div class="done-icon">✦</div>
				<h2 class="done-heading">Bra att du skrev ner det.</h2>
				<p class="done-sub">Ord som får plats gör ofta lite lättare.</p>

				<blockquote class="draft-preview">
					{text.length > 200 ? text.slice(0, 200) + '…' : text}
				</blockquote>

				<div class="save-prompt">
					<p class="save-question">Vill du spara detta i din dagbok?</p>
					<p class="save-desc">
						Skapa ett konto på 10 sekunder — texten sparas automatiskt som ditt första inlägg.
					</p>

					<div class="save-actions">
						<button class="btn-primary" onclick={handleSaveAccount}>
							Skapa konto och spara
						</button>
						<div class="anonymous-wrap">
							<button class="btn-secondary" onclick={handleAnonymous}>
								Fortsätt anonymt
							</button>
							<p class="anonymous-note">Din text sparas inte</p>
						</div>
					</div>

					<button class="write-more-link" onclick={handleWriteMore}>
						← Skriv mer
					</button>
				</div>
			</div>

		{/if}

	</div>
</main>

<style>
	.skriv-page {
		min-height: 100dvh;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 2rem 1rem 4rem;
	}

	.skriv-container {
		width: 100%;
		max-width: 600px;
	}

	/* Header */
	.skriv-header {
		margin-bottom: 2rem;
	}

	.back-link {
		display: inline-block;
		font-size: 0.85rem;
		opacity: 0.5;
		text-decoration: none;
		margin-bottom: 2rem;
		transition: opacity 0.2s;
		color: inherit;
	}
	.back-link:hover { opacity: 0.9; }

	.skriv-heading {
		font-size: clamp(1.5rem, 4vw, 2rem);
		font-weight: 600;
		margin: 0 0 0.5rem;
		line-height: 1.25;
		letter-spacing: -0.02em;
	}

	.skriv-sub {
		font-size: 0.95rem;
		opacity: 0.6;
		margin: 0;
	}

	/* Returning user banner */
	.returning-banner {
		background: color-mix(in srgb, var(--primary, #6b8f71) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--primary, #6b8f71) 20%, transparent);
		border-radius: 12px;
		padding: 1rem 1.25rem;
		margin-bottom: 1.5rem;
	}

	.returning-banner-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.returning-icon {
		font-size: 1.1rem;
		flex-shrink: 0;
	}

	.returning-text {
		font-size: 0.88rem;
		font-weight: 500;
		margin: 0;
		opacity: 0.85;
	}

	.returning-preview {
		background: rgba(0, 0, 0, 0.04);
		border-left: 3px solid var(--primary, #6b8f71);
		border-radius: 0 6px 6px 0;
		padding: 0.6rem 0.875rem;
		margin: 0 0 0.875rem;
		font-size: 0.85rem;
		line-height: 1.55;
		font-style: italic;
		color: inherit;
		opacity: 0.75;
		white-space: pre-wrap;
		word-break: break-word;
	}

	:global(html.dark) .returning-preview {
		background: rgba(255, 255, 255, 0.05);
	}

	.returning-actions {
		display: flex;
		gap: 0.75rem;
	}

	.btn-restore {
		background: var(--primary, #6b8f71);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.5rem 1.25rem;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		font-family: inherit;
		transition: opacity 0.2s;
	}
	.btn-restore:hover { opacity: 0.85; }

	.btn-dismiss {
		background: transparent;
		color: inherit;
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 8px;
		padding: 0.5rem 1.25rem;
		font-size: 0.85rem;
		cursor: pointer;
		font-family: inherit;
		opacity: 0.6;
		transition: opacity 0.2s;
	}

	:global(html.dark) .btn-dismiss {
		border-color: rgba(255, 255, 255, 0.15);
	}

	.btn-dismiss:hover { opacity: 0.9; }

	/* Textarea */
	.textarea-wrap {
		margin-bottom: 1rem;
	}

	.skriv-textarea {
		width: 100%;
		padding: 1.25rem;
		font-size: 1rem;
		line-height: 1.7;
		border-radius: 12px;
		border: 1.5px solid rgba(0,0,0,0.1);
		background: rgba(255,255,255,0.6);
		color: inherit;
		resize: vertical;
		font-family: inherit;
		transition: border-color 0.2s, box-shadow 0.2s;
		box-sizing: border-box;
	}

	:global(html.dark) .skriv-textarea {
		background: rgba(255,255,255,0.05);
		border-color: rgba(255,255,255,0.12);
	}

	@media (prefers-color-scheme: dark) {
		.skriv-textarea {
			background: rgba(255,255,255,0.05);
			border-color: rgba(255,255,255,0.12);
		}
	}

	.skriv-textarea:focus {
		outline: none;
		border-color: var(--primary, #6b8f71);
		box-shadow: 0 0 0 3px rgba(107,143,113,0.15);
	}

	.skriv-textarea::placeholder {
		opacity: 0.35;
	}

	/* Privacy note */
	.privacy-note {
		font-size: 0.82rem;
		opacity: 0.5;
		margin: 0 0 1.5rem;
		text-align: center;
	}
	.privacy-note span { display: block; }

	/* Actions */
	.skriv-actions {
		display: flex;
		justify-content: center;
	}

	.btn-primary {
		background: var(--primary, #6b8f71);
		color: white;
		border: none;
		border-radius: 10px;
		padding: 0.85rem 2.5rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s, transform 0.1s;
		font-family: inherit;
	}
	.btn-primary:hover:not(:disabled) { opacity: 0.88; }
	.btn-primary:active:not(:disabled) { transform: scale(0.98); }
	.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

	/* Done view */
	.done-view {
		text-align: center;
	}

	.done-icon {
		font-size: 2.5rem;
		margin-bottom: 1rem;
		opacity: 0.7;
	}

	.done-heading {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.4rem;
	}

	.done-sub {
		opacity: 0.6;
		font-size: 0.95rem;
		margin: 0 0 1.75rem;
	}

	.draft-preview {
		background: rgba(0,0,0,0.04);
		border-left: 3px solid var(--primary, #6b8f71);
		border-radius: 0 8px 8px 0;
		padding: 1rem 1.25rem;
		text-align: left;
		font-size: 0.95rem;
		line-height: 1.6;
		margin: 0 0 2rem;
		opacity: 0.8;
		font-style: italic;
		color: inherit;
	}

	@media (prefers-color-scheme: dark) {
		.draft-preview {
			background: rgba(255,255,255,0.05);
		}
	}

	.save-prompt {
		background: rgba(0,0,0,0.03);
		border: 1px solid rgba(0,0,0,0.07);
		border-radius: 14px;
		padding: 1.75rem 1.5rem;
	}

	@media (prefers-color-scheme: dark) {
		.save-prompt {
			background: rgba(255,255,255,0.04);
			border-color: rgba(255,255,255,0.08);
		}
	}

	.save-question {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
	}

	.save-desc {
		font-size: 0.88rem;
		opacity: 0.6;
		margin: 0 0 1.5rem;
		line-height: 1.5;
	}

	.save-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
	}

	.btn-secondary {
		background: transparent;
		color: inherit;
		border: 1.5px solid rgba(0,0,0,0.15);
		border-radius: 10px;
		padding: 0.75rem 2rem;
		font-size: 0.95rem;
		cursor: pointer;
		transition: opacity 0.2s;
		font-family: inherit;
		width: 100%;
		max-width: 280px;
	}

	.btn-primary {
		width: 100%;
		max-width: 280px;
	}

	@media (prefers-color-scheme: dark) {
		.btn-secondary {
			border-color: rgba(255,255,255,0.18);
		}
	}
	.btn-secondary:hover { opacity: 0.7; }

	.write-more-link {
		background: none;
		border: none;
		color: inherit;
		font-size: 0.85rem;
		opacity: 0.45;
		cursor: pointer;
		margin-top: 1.25rem;
		transition: opacity 0.2s;
		font-family: inherit;
	}
	.write-more-link:hover { opacity: 0.8; }

	.anonymous-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
	}

	.anonymous-note {
		font-size: 0.75rem;
		color: var(--color-text-muted, #888);
		margin: 0;
	}

</style>
