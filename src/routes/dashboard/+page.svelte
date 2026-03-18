<script lang="ts">
	import { onMount } from 'svelte';
	import { trackHoroscopeCTAClick } from '$lib/analytics';
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';
	import Greeting from '$lib/components/dashboard/Greeting.svelte';
	import QuickActions from '$lib/components/dashboard/QuickActions.svelte';

	let user: any = null;
	let loading = true;

	onMount(async () => {
		loading = false;
	});
</script>

<main class="auth-page">
	<PortalSubnav
		active="dashboard"
		title="Min portal"
		description="En lugn startsida med dina viktigaste vägar vidare."
	/>

	<div class="auth-shell">
		{#if loading}
			<section class="auth-panel">
				<p class="auth-muted">Laddar...</p>
			</section>
		{:else}
			<section class="auth-panel">
				<Greeting {user} />
			</section>

			<section class="auth-panel auth-panel-accent">
				<p class="auth-muted">När du vill kan du fånga tanken direkt i dagboken.</p>
				<a
					href="/dagbok?from=horoscope"
					class="auth-button primary mt-3"
					onclick={trackHoroscopeCTAClick}
				>
					Vill du skriva några ord om det här?
				</a>
			</section>

			<QuickActions />
		{/if}
	</div>
</main>
