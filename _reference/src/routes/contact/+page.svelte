<script lang="ts">
	import { onMount } from 'svelte';
	import {
		EmojiWomanWavingPink,
		EmojiWomanWavingAmber,
		EmojiWomanWavingBlue,
		EmojiWomanWavingLime,
		EmojiWomanWavingRed,
		EmojiBouquet
	} from '$lib/assets/emojis';
	import { accentStore } from '$lib/stores/accent.svelte';
	import LegalFooter from '$lib/components/LegalFooter.svelte';

	const wavingComponents = {
		pink: EmojiWomanWavingPink,
		amber: EmojiWomanWavingAmber,
		blue: EmojiWomanWavingBlue,
		lime: EmojiWomanWavingLime,
		red: EmojiWomanWavingRed
	};

	let WavingIcon = $derived(wavingComponents[accentStore.current]);

	const FORM_ID = 'o77pouaahs4';
	let forminit: any;

	let isSubmitting = $state(false);
	let showModal = $state(false);
	let errorMessage = $state('');
	let fileName = $state('');

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			if (input.files.length === 1) {
				fileName = input.files[0].name;
			} else {
				fileName = `${input.files.length} filer valda`;
			}
		} else {
			fileName = '';
		}
	}

	onMount(() => {
		const script = document.createElement('script');
		script.src = 'https://forminit.com/sdk/v1/forminit.js';
		script.onload = () => {
			forminit = new (window as any).Forminit();
		};
		document.body.appendChild(script);
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!forminit) return;

		const form = e.target as HTMLFormElement;
		isSubmitting = true;
		errorMessage = '';

		const formData = new FormData(form);
		const { data, error } = await forminit.submit(FORM_ID, formData);

		if (error) {
			errorMessage = error.message;
			isSubmitting = false;
			return;
		}

		showModal = true;
		form.reset();
		fileName = '';
		isSubmitting = false;
	}

	function closeModal() {
		showModal = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && showModal) {
			closeModal();
		}
	}

	function handleEmailClick(e: MouseEvent) {
		e.preventDefault();
		if (confirm('Vill du öppna din e-postklient?')) {
			window.location.href = 'mailto:johanna@mystorify.se';
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<main class="legal-page">
	<div class="page-header">
		<WavingIcon size={96} />
		<h1>Hör av dig</h1>
	</div>

	<section>
		<h2>Jag vill gärna höra från dig!</h2>
		<p>Har du en idé, hittat något som gick sönder, vill samarbeta, strö beröm eller gnälla (konstruktivt) – eller bara säga hej? Tveka inte att höra av dig. Jag svarar vanligtvis inom ett par dagar.</p>
	</section>

	<section class="form-section">
		<h2>Skicka ett meddelande</h2>
		<form class="contact-form" onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="name">Namn <span class="required">*</span></label>
				<input
					type="text"
					id="name"
					name="fi-sender-fullName"
					placeholder="Ditt namn"
					required
				/>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="email">E-post <span class="required">*</span></label>
					<input
						type="email"
						id="email"
						name="fi-sender-email"
						placeholder="din@epost.se"
						required
					/>
				</div>

				<div class="form-group">
					<label for="phone">Telefon <span class="optional">(valfritt)</span></label>
					<input
						type="tel"
						id="phone"
						name="fi-sender-phone"
						placeholder="+46701234567"
					/>
				</div>
			</div>

			<div class="form-group">
				<label for="subject">Ämne <span class="required">*</span></label>
				<select id="subject" name="fi-select-subject" required>
					<option value="" disabled selected>-- VÄLJ --</option>
					<option value="say-hi">Vill bara säga hej</option>
					<option value="ideas">Jag har en idé!</option>
					<option value="bugs">Något gick sönder..</option>
					<option value="praise">Beröm och lovord</option>
					<option value="complaints">Gnäll (Konstruktivt)</option>
					<option value="co-op">Samarbeten</option>
					<option value="other">Någonting annat</option>
				</select>
			</div>

			<div class="form-group">
				<label for="message">Meddelande <span class="required">*</span></label>
				<textarea
					id="message"
					name="fi-text-message"
					placeholder="Skriv ditt meddelande här..."
					rows="4"
					required
				></textarea>
			</div>

			<div class="form-group">
				<label for="attachment">Bifoga fil <span class="optional">(valfritt)</span></label>
				<div class="file-input-wrapper">
					<input
						type="file"
						id="attachment"
						name="fi-file-attachment"
						class="file-input-hidden"
						onchange={handleFileChange}
						multiple
					/>
					<button type="button" class="file-input-button" onclick={() => document.getElementById('attachment')?.click()}>
						Välj filer
					</button>
					<span class="file-input-text">{fileName || 'Inga filer valda'}</span>
				</div>
				<p class="field-hint">T.ex. skärmdumpar om något gick sönder</p>
			</div>

			<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
				{isSubmitting ? 'Skickar...' : 'Skicka meddelande'}
			</button>

			{#if errorMessage}
				<div class="error-message">
					<span class="error-icon">!</span>
					{errorMessage}
				</div>
			{/if}
		</form>
	</section>

	<section>
		<h2>Andra sätt att nå mig</h2>
		<ul class="contact-links">
			<li>
				<strong>GitHub:</strong>
				<a href="https://github.com/johannaefageras" target="_blank" rel="noopener">@johannaefageras</a>
			</li>
			<li>
				<strong>E-post:</strong>
				<a href="mailto:johanna@mystorify.se" onclick={handleEmailClick}>johanna@mystorify.se</a>
			</li>
			<li>
				<strong>Telefon:</strong>
				<a href="tel:+46728903615">+46 72-890 36 15</a>
			</li>
		</ul>
	</section>

	<section>
		<p>Storify är ett enmansprojekt, så alla meddelanden läses av en faktisk människa – inte en bot. På hedersord.</p>
	</section>

	<LegalFooter />
</main>

{#if showModal}
	<div class="modal-backdrop" onclick={closeModal} onkeydown={(e) => e.key === 'Escape' && closeModal()} role="button" tabindex="-1">
		<div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && closeModal()} role="dialog" aria-modal="true" tabindex="-1">
			<button class="modal-close" onclick={closeModal} aria-label="Stäng">
				&times;
			</button>
			<div class="modal-header">
				<EmojiBouquet size={80} />
				<h1>Tack för ditt meddelande!</h1>
			</div>
			<p>Ditt meddelande är mottaget och jag återkommer så snart jag kan – vanligtvis inom ett par dagar.</p>
			<p class="modal-signature">— Johanna</p>
		</div>
	</div>
{/if}

<style>
	.legal-page {
		max-width: 720px;
		margin: 0 auto;
		padding: 2rem;
		padding-top: calc(env(safe-area-inset-top, 0px) + 2rem);
		padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 2rem);
	}

	.page-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}

	h1 {
		font-family: var(--font-primary);
		font-size: var(--text-2xl);
		font-weight: var(--weight-medium);
		color: var(--color-text);
		margin-bottom: 0;
		text-align: center;
	}

	h2 {
		font-family: var(--font-primary);
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
		margin-bottom: 0.75rem;
	}

	section {
		margin-bottom: 2.5rem;
	}

	p {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
	}

	p:last-child {
		margin-bottom: 0;
	}

	/* Form section card */
	.form-section {
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-top: 3px solid var(--color-accent);
		border-radius: var(--radius-md);
		padding: 2rem;
	}

	.form-section h2 {
		margin-bottom: 1.25rem;
	}

	/* Contact form */
	.contact-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	@media (max-width: 500px) {
		.legal-page {
			padding: 1rem;
			padding-top: calc(env(safe-area-inset-top, 0px) + 1rem);
			padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1rem);
		}

		.form-section {
			padding: 1.25rem;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.modal-content h1 {
			font-size: var(--text-lg);
		}
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.form-group label {
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
	}

	.form-group label .required {
		color: var(--color-accent);
		font-weight: var(--weight-normal);
	}

	.form-group label .optional {
		font-weight: var(--weight-normal);
		text-transform: none;
		letter-spacing: normal;
		opacity: 0.7;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		padding: 0.7rem 0.875rem;
		border: 1.5px solid color-mix(in srgb, var(--color-border) 50%, transparent);
		border-radius: var(--radius-sm);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		color: var(--color-text);
		background-color: var(--color-bg);
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px rgba(244, 63, 122, 0.06);
	}

	.form-group input::placeholder,
	.form-group textarea::placeholder {
		color: var(--color-text-muted);
		opacity: 0.5;
	}

	.form-group select {
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%235f5f5f' d='M5 7L1 3h8z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.875rem center;
		padding-right: 2.25rem;
	}

	:global([data-theme='dark']) .form-group select {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23a7a7ad' d='M5 7L1 3h8z'/%3E%3C/svg%3E");
	}

	.form-group textarea {
		resize: none;
		min-height: 130px;
	}

	/* File input styling */
	.file-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.file-input-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}

	.file-input-button {
		padding: 0.6rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background-color: var(--color-bg-elevated);
		color: var(--color-text);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		cursor: pointer;
		transition: background-color 0.2s ease, border-color 0.2s ease;
		white-space: nowrap;
	}

	.file-input-button:hover {
		background-color: var(--color-neutral);
		border-color: var(--color-accent);
	}

	.file-input-text {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.field-hint {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		opacity: 0.7;
		margin: 0;
	}

	.contact-form .btn {
		align-self: stretch;
		margin-top: 0.75rem;
		padding: 0.75rem 1.25rem;
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		letter-spacing: var(--tracking-wider);
	}

	.contact-form .btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background-color: color-mix(in srgb, #ef4444 10%, var(--color-bg));
		border: 1px solid color-mix(in srgb, #ef4444 30%, var(--color-border));
		border-radius: var(--radius-sm);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		color: var(--color-text);
		animation: fade-in 0.3s ease;
	}

	.error-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		background-color: #ef4444;
		color: white;
		font-size: 11px;
		font-weight: var(--weight-bold);
		border-radius: 50%;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Contact links */
	.contact-links {
		list-style: none;
		margin: 1rem 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.contact-links li {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
		color: var(--color-text-muted);
		padding: 0.75rem 1rem;
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.contact-links li strong {
		color: var(--color-text);
		font-weight: var(--weight-medium);
	}

	/* Regular list */
	ul:not(.contact-links) {
		list-style: none;
		margin: 1rem 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	ul:not(.contact-links) li {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
		color: var(--color-text-muted);
		padding-left: 1.25rem;
		position: relative;
	}

	ul:not(.contact-links) li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55rem;
		width: 6px;
		height: 6px;
		background-color: var(--color-accent);
		border-radius: 50%;
	}

	ul:not(.contact-links) li strong {
		color: var(--color-text);
		font-weight: var(--weight-medium);
	}

	a {
		color: var(--color-accent);
		text-decoration: none;
		font-weight: var(--weight-medium);
		transition: color 0.2s ease;
	}

	a:hover {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		z-index: 1000;
		animation: fade-in 0.2s ease;
	}

	.modal-content {
		position: relative;
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 2.5rem 2rem;
		max-width: 420px;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1rem;
		animation: modal-slide-in 0.3s ease;
	}

	.modal-close {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		line-height: 1;
		color: var(--color-text-muted);
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: color 0.2s ease, background-color 0.2s ease;
	}

	.modal-close:hover {
		color: var(--color-text);
		background-color: var(--color-neutral);
	}

	.modal-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.modal-content h1 {
		font-family: var(--font-primary);
		font-size: var(--text-2xl);
		font-weight: var(--weight-medium);
		color: var(--color-text);
		margin: 0;
	}

	.modal-content p {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		line-height: var(--leading-relaxed);
		margin: 0;
	}

	.modal-signature {
		font-weight: var(--weight-medium);
		color: var(--color-text);
	}

	@keyframes modal-slide-in {
		from {
			opacity: 0;
			transform: translateY(-10px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
