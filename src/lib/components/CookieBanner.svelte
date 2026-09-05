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
	<div
		bind:this={bannerElement}
		role="dialog"
		aria-live="polite"
		aria-label="Cookieinställningar"
		class="cookie-banner fixed bottom-3 left-1/2 z-50 flex w-[min(520px,calc(100vw-1rem))] -translate-x-1/2 flex-col gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm shadow-lg dark:border-white/10 dark:bg-zinc-900 sm:bottom-4 sm:w-[min(520px,calc(100vw-2rem))] sm:gap-3 sm:px-5 sm:py-4"
	>
		<p class="opacity-80 leading-relaxed">
			Vi använder analys för att förstå hur sajten används och göra den bättre. Analysdata kan
			behandlas av leverantörerna som beskrivs i vår integritetsinformation.
			<a href="/integritet" class="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Läs mer</a>.
		</p>
		<div class="cookie-banner-actions flex flex-col sm:flex-row gap-2">
			<button
				onclick={accept}
				class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
			>
				Acceptera analys
			</button>
			<button
				onclick={decline}
				class="flex-1 rounded-lg border border-blue-600 bg-white/80 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800 dark:bg-transparent dark:text-blue-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
			>
				Bara nödvändiga
			</button>
		</div>
	</div>
{/if}

<style>
	/* Kompakt läge på låga skärmar. På 320x568 tog bannern 266 px av 568 - nära
	 * halva viewporten - vilket lämnade chattens inmatningsyta helt innanför
	 * bannerns fotavtryck. Villkoret är viewportens HÖJD, inte bredden, för det
	 * är höjden som är knapp.
	 *
	 * Endast layout ändras: texten, knapparna och samtyckesvalen är desamma.
	 * Scoped stil har högre specificitet än Tailwinds enkla utility-klasser, så
	 * inga !important behövs. */
	@media (max-height: 640px) {
		.cookie-banner {
			gap: 0.4rem;
			padding: 0.55rem 0.75rem;
			line-height: 1.35;
		}

		.cookie-banner :global(p) {
			font-size: 0.78rem;
			line-height: 1.35;
		}

		/* Knapparna sida vid sida i stället för staplade. Sparar en hel knapphöjd
		 * utan att minska träffytan under 40 px. */
		.cookie-banner-actions {
			flex-direction: row;
		}

		.cookie-banner-actions :global(button) {
			padding: 0.5rem 0.5rem;
			font-size: 0.78rem;
			min-height: 40px;
		}
	}
</style>
