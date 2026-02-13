<script lang="ts">
	import PortalCard from '$lib/components/PortalCard.svelte';
	import { portals } from '$lib/data/portals';
</script>

<svelte:head>
	<title>MittPsyke – Tryggt stöd för ditt psyke</title>
</svelte:head>

<section class="container py-16 text-center">
	<div class="hero">
		
		<img
			src="/assets/MittPsykeLogo1.png"
			alt="MittPsyke logotyp"
			class="hero-logo"
		/>
		<h1 class="text-4xl font-bold tracking-tight mb-4">
			Välkommen till MittPsyke
		</h1>
		<p class="max-w-xl mx-auto opacity-75 leading-relaxed mb-10">
			Ett tryggt rum för tanke, känsla och återhämtning.
		</p>
		<a
			href="/om-mittpsyke"
			class="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-black/12 dark:border-white/12
				bg-white/55 dark:bg-white/5 hover:border-black/22 dark:hover:border-white/22 transition-colors text-sm opacity-85"
		>
			Klicka här för att läsa mer om MittPsyke
		</a>
	</div>

	<h2 class="text-lg opacity-85 mb-5">Vad vill du fokusera på?</h2>
	<p class="max-w-3xl mx-auto text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-7">
		Välj en kategori för att starta en trygg, specialiserad AI-chatt.<br />
		Varje område har en egen inriktning för att bättre möta det du går igenom.
	</p>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
		{#each portals as portal, i}
			<PortalCard {portal} active={i === 0} />
		{/each}
	</div>

	<div class="mt-10">
		<a
			href="/chat/a"
			class="inline-flex items-center justify-center px-5 py-3 rounded-full border border-black/12 dark:border-white/12
				bg-white/55 dark:bg-white/5 hover:border-black/22 dark:hover:border-white/22 transition-colors text-sm"
		>
			Eller börja en fri reflektion
		</a>
	</div>
</section>

<style>
.hero {
	text-align: center;
	margin-bottom: 3rem;
}

.hero img {
	max-width: 420px;
	width: 100%;
	margin: 0 auto 1.5rem;
	border-radius: 1.25rem;
	opacity: 0.95;
}

.hero .hero-logo {
	display: block;
	max-width: 240px;
	width: 100%;
	margin: 0 auto 1.5rem;
	border-radius: 0;
	opacity: 0.8;
	animation: fadeIn 1.1s ease-out;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(6px);
	}
	to {
		opacity: 0.8;
		transform: translateY(0);
	}
}
</style>
