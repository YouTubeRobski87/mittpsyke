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
			src="/assets/mittpsyke-hero.png"
			alt="Illustration av hjärna och hjärta – balans mellan tanke och känsla"
		/>
		<h1 class="text-4xl font-bold tracking-tight mb-4">
			Välkommen till MittPsyke
		</h1>
		<p class="max-w-xl mx-auto opacity-75 leading-relaxed mb-10">
			Ett tryggt rum för tanke, känsla och återhämtning.
		</p>
	</div>

	<h2 class="text-lg opacity-85 mb-5">Vad vill du fokusera på?</h2>

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

<section class="container max-w-2xl mb-12">
	<div class="border border-black/10 dark:border-white/10 rounded-2xl p-5 bg-white/45 dark:bg-white/5">
		<h3 class="font-semibold mb-2.5">Hur MittPsyke ser på psyket</h3>
		<ul class="list-disc pl-5 space-y-2 opacity-85 text-sm">
			<li>Psyket är inte trasigt – det är ofta överbelastat</li>
			<li>Ångest, depression och stress är signaler, inte fel</li>
			<li>Tankar, känslor och kropp hänger samman</li>
			<li>Trygghet och förståelse är ofta första steget mot förändring</li>
		</ul>
	</div>
</section>

<style>
.hero {
\ttext-align: center;
\tmargin-bottom: 3rem;
}

.hero img {
\tmax-width: 420px;
\twidth: 100%;
\tmargin: 0 auto 1.5rem;
\tborder-radius: 1.25rem;
\topacity: 0.95;
}
</style>

