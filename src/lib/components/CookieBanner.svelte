<script lang="ts">
	import { browser } from '$app/environment';
	import { ANALYTICS_ENABLED } from '$lib/analytics';
	import {
		getAnalyticsConsent,
		grantAnalyticsConsent,
		declineAnalyticsConsent,
		cookieBannerOpen
	} from '$lib/consent';

	$effect(() => {
		if (browser && ANALYTICS_ENABLED && getAnalyticsConsent() === null) {
			cookieBannerOpen.set(true);
		}
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
		declineAnalyticsConsent();
		cookieBannerOpen.set(false);
	}
</script>

{#if $cookieBannerOpen}
	<div
		role="dialog"
		aria-live="polite"
		aria-label="Cookieinställningar"
		class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(520px,calc(100vw-2rem))] rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 px-5 py-4 shadow-lg text-sm flex flex-col gap-3"
	>
		<p class="opacity-80 leading-relaxed">
			Vi använder analys för att förstå hur sajten används och göra den bättre. Inga personuppgifter
			delas med tredje part.
			<a href="/integritet" class="underline opacity-70 hover:opacity-100">Läs mer</a>.
		</p>
		<div class="flex flex-col sm:flex-row gap-2">
			<button
				onclick={accept}
				class="flex-1 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
			>
				Acceptera analys
			</button>
			<button
				onclick={decline}
				class="flex-1 px-4 py-2 rounded-lg border border-teal-600 text-teal-700 dark:text-teal-400 text-sm font-medium hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
			>
				Bara nödvändiga
			</button>
		</div>
	</div>
{/if}
