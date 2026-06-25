<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import HibpEmailCheck from '$lib/components/HibpEmailCheck.svelte';
</script>

<main class="dataintrang-page mx-auto w-full px-5 py-10">
	<Breadcrumbs items={[{ label: 'Hem', href: '/' }, { label: 'Dataintrång' }]} />

	<h1>Kontrollera e-post vid dataintrång</h1>
	<p class="lead">
		Det här är en enkel kontroll för att se om en e-postadress förekommer i kända dataintrång.
		Svaret kan vara ett första steg för att byta lösenord, slå på tvåstegsverifiering och ta det
		i lugn takt.
	</p>

	<HibpEmailCheck />
</main>

<style>
	.dataintrang-page {
		max-width: 760px;
	}

	h1 {
		margin: 0 0 1rem;
		font-family: var(--font-heading);
		font-size: clamp(1.75rem, 5vw, 2.45rem);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.1;
	}

	.lead {
		margin: 0 0 1.5rem;
		font-family: var(--font-body);
		line-height: 1.7;
		opacity: 0.82;
	}
</style>
