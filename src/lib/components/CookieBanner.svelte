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
		class="fixed bottom-3 left-1/2 z-50 flex w-[min(520px,calc(100vw-1rem))] -translate-x-1/2 flex-col gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm shadow-lg dark:border-white/10 dark:bg-zinc-900 sm:bottom-4 sm:w-[min(520px,calc(100vw-2rem))] sm:gap-3 sm:px-5 sm:py-4"
	>
		<p class="opacity-80 leading-relaxed">
			Vi använder analys för att förstå hur sajten används och göra den bättre. Inga personuppgifter
			delas med tredje part.
			<a href="/integritet" class="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Läs mer</a>.
		</p>
		<div class="flex flex-col sm:flex-row gap-2">
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
