<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { grantSensitiveConsent, type HealthConsentRecord } from '$lib/consent';
	import { supabase } from '$lib/supabase';
	import { dataflowCopy } from '$lib/dataflow-copy';
	import { GENERAL_SAFETY_COPY } from '$lib/safety-copy';

	export let onAccept: (consent: HealthConsentRecord) => void | Promise<void> = () => {};
	export let title = 'Innan du börjar';
	export let intro =
		`${GENERAL_SAFETY_COPY} Det du skriver kan innehålla känsliga uppgifter om mående.`;

	let confirmed = false;
	let errorMessage = '';

	// Fokushantering för dialogen. Detta gäller uttryckligt samtycke för
	// känsliga uppgifter, så tangentbords- och skärmläsarflödet måste vara
	// korrekt: fokus in i dialogen vid öppning, fokusfälla medan den är öppen,
	// bakgrunden `inert`, och fokus tillbaka till det som öppnade dialogen.
	let overlayEl: HTMLDivElement;
	let titleEl: HTMLHeadingElement;
	let previouslyFocused: HTMLElement | null = null;
	let restoreInert: (() => void) | null = null;

	const FOCUSABLE_SELECTOR =
		'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

	function getFocusable(): HTMLElement[] {
		return Array.from(overlayEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
	}

	function trapTab(event: KeyboardEvent) {
		if (event.key !== 'Tab') return;
		const focusable = getFocusable();
		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const active = document.activeElement as HTMLElement | null;
		// Fokus börjar på rubriken, som har tabindex="-1" och därför inte är
		// med i `focusable`. Shift+Tab därifrån har ingen naturlig "föregående"
		// inom fällan och måste alltså också hanteras här, annars läcker
		// fokus ut i sidan bakom (t.ex. cookiebannern).
		const activeIsTracked = active ? focusable.includes(active) : false;

		if (event.shiftKey) {
			if (!activeIsTracked || active === first) {
				event.preventDefault();
				last.focus();
			}
		} else if (activeIsTracked && active === last) {
			event.preventDefault();
			first.focus();
		}
	}

	// Gör allt utanför dialogens gren av DOM:et `inert`, ett steg åt gången
	// upp mot <body>. Fungerar oavsett var i sidan komponenten monteras,
	// utan att kräva en portal.
	function makeOutsideInert(node: HTMLElement): () => void {
		const restore: Array<() => void> = [];
		let current: HTMLElement | null = node;

		while (current && current.parentElement && current !== document.body) {
			const parent: HTMLElement = current.parentElement;
			for (const sibling of Array.from(parent.children)) {
				if (sibling === current) continue;
				const el = sibling as HTMLElement;
				if (el.hasAttribute('inert')) continue;
				el.setAttribute('inert', '');
				restore.push(() => el.removeAttribute('inert'));
			}
			current = parent;
		}

		return () => {
			for (const fn of restore) fn();
		};
	}

	onMount(() => {
		previouslyFocused = document.activeElement as HTMLElement | null;
		const restoreFirstPass = makeOutsideInert(overlayEl);
		document.addEventListener('keydown', trapTab);
		tick().then(() => {
			titleEl?.focus();
			// Cookiebannern i layouten öppnas via sin egen $effect en tick efter
			// att den här komponenten monteras, så den finns inte alltid med i
			// den första inert-passeringen. En andra passering efter tick()
			// fångar upp den (och annat som dyker upp lika sent) utan att kräva
			// en MutationObserver för detta smala fallet. Tab-fällan ovan är
			// kvar som skydd oavsett.
			const restoreSecondPass = makeOutsideInert(overlayEl);
			restoreInert = () => {
				restoreFirstPass();
				restoreSecondPass();
			};
		});
		restoreInert = restoreFirstPass;
	});

	// onDestroy körs även under SSR (till skillnad från onMount), så allt här
	// måste tåla att köras utan `document` — annars kraschar sidan på servern.
	onDestroy(() => {
		if (typeof document === 'undefined') return;
		document.removeEventListener('keydown', trapTab);
		restoreInert?.();
		previouslyFocused?.focus?.();
	});

	async function persistConsentForSignedInUser(consent: HealthConsentRecord) {
		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (!session) return;

		const { error } = await supabase.auth.updateUser({
			data: {
				health_data_processing_consent: consent
			}
		});

		if (!error) {
			await supabase.auth.refreshSession();
		}
	}

	async function handleStart() {
		if (!confirmed) {
			errorMessage =
				'Bekräfta först att du samtycker till behandlingen av känsliga uppgifter här.';
			return;
		}

		errorMessage = '';
		const consent = grantSensitiveConsent();
		await persistConsentForSignedInUser(consent);
		await onAccept(consent);
	}
</script>

<div class="consent-overlay" bind:this={overlayEl}>
	<div class="consent-box" role="dialog" aria-modal="true" aria-labelledby="health-consent-title">
		<h2 id="health-consent-title" bind:this={titleEl} tabindex="-1">{title}</h2>

		<p id="health-consent-copy">
			{intro}
		</p>

		<label class="consent-check">
			<input type="checkbox" bind:checked={confirmed} />
			<span
				>Jag samtycker uttryckligen till att MittPsyke och OpenAI behandlar meddelanden jag väljer
				att skicka i chatten för att kunna ge ett svar här.</span
			>
		</label>

		<details class="consent-more">
			<summary>Läs mer</summary>
			<p>Samtycket gäller meddelanden du aktivt väljer att skicka i chatten.</p>
			<p>
				Samtycket är separat för känsliga uppgifter, sparas med tidpunkt och version och kan
				återkallas senare i dina inställningar.
			</p>
			<div class="consent-data-summary">
				<h3>Så hanteras chattmeddelanden</h3>
				<ul>
					<li><strong>När det skickas:</strong> {dataflowCopy.guestChat.aiTransfer}</li>
					<li><strong>Utan konto:</strong> {dataflowCopy.guestChat.retention}</li>
					<li><strong>Med konto:</strong> {dataflowCopy.accountChat.storage} {dataflowCopy.accountChat.retention}</li>
					<li><strong>OpenAI:</strong> {dataflowCopy.providerRetention}</li>
				</ul>
			</div>

			<p class="links">
				Läs mer i <a href="/integritet">integritetspolicyn</a> och
				<a href="/ansvar">ansvarsinformationen</a>.
			</p>
		</details>

		{#if errorMessage}
			<p class="feedback">{errorMessage}</p>
		{/if}

		<div class="actions">
			<button onclick={handleStart} disabled={!confirmed}>Jag samtycker och vill fortsätta</button>
			<a class="secondary-link" href="/">Inte nu</a>
		</div>
	</div>
</div>

<style>
	.consent-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.consent-box {
		background: white;
		color: #111827;
		padding: 1.5rem;
		border-radius: 16px;
		max-width: 480px;
		width: 90%;
		box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
	}

	.consent-check {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin-top: 1rem;
		font-size: 0.95rem;
		line-height: 1.55;
	}

	.consent-check input {
		margin-top: 0.2rem;
	}

	.links {
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.consent-more {
		margin-top: 0.9rem;
	}

	.consent-more summary {
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 2px;
		list-style: none;
	}

	.consent-more summary::-webkit-details-marker {
		display: none;
	}

	#health-consent-title:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 4px;
		border-radius: 4px;
	}

	.consent-more summary:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
		border-radius: 4px;
	}

	.consent-more p {
		margin: 0.6rem 0 0;
		font-size: 0.88rem;
		line-height: 1.55;
		opacity: 0.85;
	}

	.consent-data-summary {
		margin-top: 0.9rem;
		padding: 0.75rem 0.85rem;
		border-radius: 12px;
		background: rgba(0, 0, 0, 0.03);
	}

	.consent-data-summary h3 {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 700;
	}

	.consent-data-summary ul {
		margin: 0.55rem 0 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.4rem;
		font-size: 0.85rem;
		line-height: 1.55;
		opacity: 0.9;
	}

	:global(.dark) .consent-data-summary {
		background: rgba(255, 255, 255, 0.05);
	}

	.feedback {
		margin: 0.85rem 0 0;
		font-size: 0.9rem;
		color: #8a5f17;
	}

	.actions {
		margin-top: 1rem;
		display: flex;
		align-items: center;
		gap: 0.85rem;
		flex-wrap: wrap;
	}

	button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.secondary-link {
		font-size: 0.95rem;
		color: inherit;
		opacity: 0.78;
	}

	:global(.dark) .consent-box {
		background: #171d24;
		color: #f8fafc;
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .consent-box a {
		color: #9ad7ce;
	}

	:global(.dark) .links {
		opacity: 0.9;
		color: #cbd5f5;
	}

	:global(.dark) .feedback {
		color: #f7d487;
	}
</style>
