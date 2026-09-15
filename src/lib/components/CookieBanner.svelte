<script lang="ts">
	import { browser } from '$app/environment';
	import { ANALYTICS_ENABLED } from '$lib/analytics';
	import {
		getAnalyticsConsent,
		grantAnalyticsConsent,
		declineAnalyticsConsent,
		cookieBannerOpen
	} from '$lib/consent';

	// Bannern är fixerad längst ned och täckte tidigare sidinnehåll där - bland
	// annat knappen i ConsentGate, som är en vanlig inline-panel och inte en
	// modal. I stället för att lyfta enskilda element ovanför bannern reserverar
	// den nu sin egen yta: höjden mäts och exponeras som --cookie-banner-space,
	// som layouten lägger till som bottenutrymme.
	//
	// Höjden mäts i stället för att hårdkodas, så den följer textbrytning,
	// översättningar och framtida innehåll utan att någon siffra behöver
	// underhållas.
	const BANNER_SPACE_VARIABLE = '--cookie-banner-space';

	let bannerElement = $state<HTMLElement | null>(null);

	function setBannerSpace(pixels: number) {
		if (!browser) return;
		document.documentElement.style.setProperty(BANNER_SPACE_VARIABLE, `${Math.round(pixels)}px`);
	}

	function clearBannerSpace() {
		if (!browser) return;
		document.documentElement.style.removeProperty(BANNER_SPACE_VARIABLE);
	}

	$effect(() => {
		if (browser && ANALYTICS_ENABLED && getAnalyticsConsent() === null) {
			cookieBannerOpen.set(true);
		}
	});

	$effect(() => {
		const element = bannerElement;
		if (!browser || !element) {
			clearBannerSpace();
			return;
		}

		// Avståndet till viewportens nederkant räknas med, annars hamnar
		// innehållet i glipan under bannern.
		const measure = () => {
			const rect = element.getBoundingClientRect();
			setBannerSpace(Math.max(0, window.innerHeight - rect.top));
		};

		measure();

		// ResizeObserver täcker textbrytning och innehållsändringar, resize-
		// händelsen täcker att gapet till nederkanten ändras med brytpunkten.
		// Båda skriver samma värde, så ingen loop kan uppstå: variabeln påverkar
		// bara sidans bottenutrymme, aldrig bannerns egen storlek.
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		window.addEventListener('resize', measure);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', measure);
			clearBannerSpace();
		};
	});

	function accept() {
		if (!ANALYTICS_ENABLED) {
			cookieBannerOpen.set(false);
			return;
		}

		grantAnalyticsConsent();
		cookieBannerOpen.set(false);
	}

	function decline() {
		const wasAccepted = getAnalyticsConsent() === 'accepted';
		declineAnalyticsConsent();
		cookieBannerOpen.set(false);
		// Redan körd tredjepartskod kan inte säkert avregistreras. En omladdning
		// startar sidan i nekat läge och förhindrar nya GA-/Ahrefs-anrop.
		if (wasAccepted && browser) window.location.reload();
	}
</script>

{#if $cookieBannerOpen}
	<!-- Båda valen har exakt samma knappstil, storlek och kontrast, så att
	     designen inte styr beslutet. "Bara nödvändiga" står först eftersom det
	     är valet som inte delar något; ordningen är den enda skillnaden. -->
	<div
		bind:this={bannerElement}
		role="dialog"
		aria-live="polite"
		aria-label="Cookieinställningar"
		class="cookie-banner"
	>
		<p class="cookie-banner-text">
			Vi använder analys för att förstå hur sajten används och göra den bättre. Analysdata kan
			behandlas av leverantörerna som beskrivs i vår integritetsinformation.
			<a href="/integritet" class="cookie-banner-link">Läs mer</a>.
		</p>
		<div class="cookie-banner-actions">
			<button type="button" class="cookie-choice" onclick={decline}>Bara nödvändiga</button>
			<button type="button" class="cookie-choice" onclick={accept}>Acceptera analys</button>
		</div>
	</div>
{/if}

<style>
	/* Permanent mörkt tema: ytor och text ur appens tokens, inga ljusa varianter. */
	.cookie-banner {
		position: fixed;
		bottom: 0.75rem;
		left: 50%;
		z-index: 50;
		display: flex;
		flex-direction: column;
		/* Samma mått som tidigare, så bannern inte tar mer höjd på mobil. */
		gap: 0.5rem;
		width: min(520px, calc(100vw - 1rem));
		padding: 0.75rem 1rem;
		transform: translateX(-50%);
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		font-size: 0.875rem;
		box-shadow: 0 12px 32px rgb(0 0 0 / 0.45);
	}

	.cookie-banner-text {
		margin: 0;
		color: hsl(var(--foreground) / 0.86);
		line-height: 1.625;
	}

	.cookie-banner-link {
		color: hsl(var(--foreground));
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}

	.cookie-banner-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* En enda knappstil för båda valen: samma fyllning, kant, textfärg,
	   storlek och fokusmarkering. Ingen fylld primärknapp mot en svag outline. */
	.cookie-choice {
		flex: 1 1 0;
		min-height: 44px;
		padding: 0.55rem 1rem;
		border: 1px solid hsl(var(--foreground) / 0.32);
		border-radius: 0.5rem;
		background: hsl(var(--surface-soft));
		color: hsl(var(--foreground));
		font-size: 0.875rem;
		font-weight: 600;
		line-height: 1.25;
		cursor: pointer;
		transition: background-color 150ms ease, border-color 150ms ease;
	}

	.cookie-choice:hover {
		border-color: hsl(var(--foreground) / 0.55);
		background: hsl(var(--surface-muted));
	}

	/* Fokus: sajtens globala ring (app.css, #7dd3fc på mörk yta, ~11:1) gäller
	   båda valen likadant. Ingen egen regel här, så de kan inte glida isär. */

	@media (min-width: 640px) {
		.cookie-banner {
			bottom: 1rem;
			gap: 0.75rem;
			width: min(520px, calc(100vw - 2rem));
			padding: 1rem 1.25rem;
		}

		.cookie-banner-actions {
			flex-direction: row;
		}
	}

	/* Kompakt läge på låga skärmar. På 320x568 tog bannern 266 px av 568 - nära
	 * halva viewporten - vilket lämnade chattens inmatningsyta helt innanför
	 * bannerns fotavtryck. Villkoret är viewportens HÖJD, inte bredden, för det
	 * är höjden som är knapp.
	 *
	 * Endast layout ändras: texten, knapparna och samtyckesvalen är desamma. */
	@media (max-height: 640px) {
		.cookie-banner {
			gap: 0.4rem;
			padding: 0.55rem 0.75rem;
			line-height: 1.35;
		}

		.cookie-banner-text {
			font-size: 0.78rem;
			line-height: 1.35;
		}

		/* Knapparna sida vid sida i stället för staplade. Sparar en hel knapphöjd
		 * utan att minska träffytan under 40 px. */
		.cookie-banner-actions {
			flex-direction: row;
		}

		.cookie-choice {
			padding: 0.5rem 0.5rem;
			font-size: 0.78rem;
			min-height: 40px;
		}
	}
</style>
