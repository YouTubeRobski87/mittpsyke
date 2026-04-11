<script lang="ts">
	import { browser } from '$app/environment';
	import { ANALYTICS_ENABLED } from '$lib/analytics';
	import {
		getAnalyticsConsent,
		grantAnalyticsConsent,
		declineAnalyticsConsent
	} from '$lib/consent';

	let visible = $state(false);

	$effect(() => {
		if (browser && ANALYTICS_ENABLED && getAnalyticsConsent() === null) {
			visible = true;
		}
	});

	function accept() {
		if (!ANALYTICS_ENABLED) {
			visible = false;
			return;
		}

		grantAnalyticsConsent();
		visible = false;
	}

	function decline() {
		declineAnalyticsConsent();
		visible = false;
	}
</script>

{#if visible}
	<div
		role="dialog"
		aria-live="polite"
		aria-label="Cookie-samtycke"
		class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(480px,calc(100vw-2rem))] rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 py-3 shadow-lg text-sm flex flex-col sm:flex-row sm:items-center gap-3"
	>
		<p class="flex-1 opacity-80 leading-relaxed">
			Vi använder analysverktyg för att förstå hur sajten används och förbättra upplevelsen.
			<a href="/integritet" class="underline opacity-70 hover:opacity-100">Läs mer</a>.
		</p>
		<div class="flex gap-2 shrink-0">
			<button
				onclick={decline}
				class="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 text-sm opacity-70 hover:opacity-100 transition-opacity"
			>
				Neka
			</button>
			<button
				onclick={accept}
				class="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-700 transition-colors"
			>
				Godkänn
			</button>
		</div>
	</div>
{/if}
