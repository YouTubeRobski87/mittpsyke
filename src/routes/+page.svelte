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
			class="inline-block text-sm underline opacity-70 hover:opacity-100 transition-opacity"
		>
			Läs mer om MittPsyke
		</a>
	</div>

	<section class="max-w-2xl mx-auto mb-10 text-left">
		<p class="opacity-80 leading-relaxed mb-4">
			MittPsyke är byggt med respekt för integritet, frivillighet och mänsklig sårbarhet.
			Målet är inte att ge snabba lösningar, utan att:
		</p>
		<ul class="list-disc pl-5 space-y-2 opacity-80 leading-relaxed mb-5">
			<li>minska ensamhet</li>
			<li>skapa förståelse</li>
			<li>ge stöd i stunden</li>
			<li>och vid behov hjälpa användaren vidare till professionella resurser</li>
		</ul>
		<div class="mt-6 pt-4 border-t border-black/10 dark:border-white/10">
			<p class="opacity-85 leading-relaxed">
				<span class="font-medium">Kort sagt…</span><br />
				MittPsyke finns där när det känns tungt – på dina villkor, i din takt
			</p>
		</div>
	</section>

	<h2 class="text-lg opacity-85 mb-5">Vad vill du fokusera på?</h2>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
		{#each portals as portal, i}
			<PortalCard {portal} active={i === 0} />
		{/each}
	</div>

	<section class="max-w-3xl mx-auto mt-12 text-left">
		<h3 class="text-2xl font-semibold tracking-tight mb-5 opacity-90">
			Beskrivning av webbplatsen – MittPsyke
		</h3>
		<p class="opacity-80 leading-relaxed mb-5">
			MittPsyke är en svensk webbplats skapad för att erbjuda ett tryggt, lugnt och
			tillgängligt digitalt stöd för människor som kämpar med psykisk ohälsa.
			Plattformen riktar sig till personer som upplever exempelvis ångest, depression,
			trauma, stress, ensamhet eller livskriser – men också till anhöriga som söker
			förståelse och vägledning.
		</p>
		<p class="opacity-80 leading-relaxed mb-5">
			Webbplatsen kombinerar mänsklig värme med modern teknik. I centrum finns ett
			AI-baserat samtalsstöd som fungerar som en empatisk följeslagare – inte som
			ersättning för vård, utan som ett komplement. Användaren kan skriva av sig i egen
			takt, reflektera, få stödjande svar och bli varsamt vägledd vidare vid behov.
		</p>
		<p class="opacity-80 leading-relaxed mb-5">
			MittPsyke är uppdelad i tydliga tematiska ingångar för att göra stödet mer begripligt
			och lätt att närma sig utifrån den situation man befinner sig i.
		</p>
		<ul class="list-disc pl-5 space-y-2 opacity-80 leading-relaxed mb-5">
			<li>Ångest</li>
			<li>Depression</li>
			<li>Trauma & våld</li>
		</ul>
		<p class="opacity-80 leading-relaxed mb-5">
			Detta gör det enklare att bli mött där man är, utan krav på prestation eller långa
			förklaringar.
		</p>
		<p class="opacity-80 leading-relaxed mb-5">
			Designfilosofin är avskalad, mjuk och icke-klinisk, med fokus på närvaro och lugn
			utan distraktioner.
		</p>
		<p class="opacity-80 leading-relaxed">
			Tjänsten kan användas anonymt för den som vill börja försiktigt, men erbjuder också
			möjlighet till inloggning där samtal kan sparas över tid – som ett digitalt
			samtalsrum eller en personlig journal.
		</p>
	</section>

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
