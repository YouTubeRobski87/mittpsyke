<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';
	import { dataflowCopy } from '$lib/dataflow-copy';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<SEO canonical="https://mittpsyke.se/ansvarsfull-ai" />

<svelte:head>
	<title>Ansvarsfull AI | MittPsyke</title>
	<meta
		name="description"
		content="Så använder MittPsyke AI ansvarsfullt inom psykisk hälsa: säkerhetsnät före varje AI-svar, tydliga gränser och mänsklig kontroll över innehållet."
	/>
</svelte:head>

<main class="ai-content mx-auto w-full px-5 py-10">
	<Breadcrumbs items={[{ label: 'Om MittPsyke', href: '/om-mittpsyke' }, { label: 'Ansvarsfull AI' }]} />

	<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Ansvarsfull AI</h1>
	<p class="opacity-80 leading-relaxed mb-4">
		MittPsyke använder AI som ett samtalsstöd, inte som vård. Den här sidan beskriver konkret hur
		AI-stödet är byggt: vad som händer innan AI:n svarar, vad AI:n inte gör, och vem som ansvarar
		för innehållet.
	</p>

	<section class="ai-quick" aria-label="Snabb överblick">
		<h2 class="text-lg font-semibold mt-0 mb-2">Snabb överblick</h2>
		<ul>
			<li><strong>Säkerhet först.</strong> Tecken på akut kris fångas upp innan någon AI kopplas in.</li>
			<li><strong>Ingen diagnos.</strong> AI:n ställer inte diagnos och ger inga medicinska beslut.</li>
			<li><strong>Mänskligt ansvar.</strong> Redaktionen, inte AI:n, ansvarar för innehåll och gränser.</li>
		</ul>
	</section>

	<h2 class="text-lg font-semibold mt-8 mb-2">Säkerhetsnätet kommer före AI:n</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Varje meddelande du skickar i chatten kontrolleras först mot ett separat säkerhetslager som
		letar efter tecken på akut kris. Den kontrollen är alltid det första som händer, oavsett vad du
		skriver, och avgör svaret direkt utan att skicka meddelandet vidare till AI-modellen. Vid
		tydliga krissignaler får du istället information om 112, 1177 och stödlinjer.se.
	</p>
	<p class="opacity-80 leading-relaxed mb-3">
		Det betyder att AI-modellen aldrig är den enda instansen mellan ett meddelande och ett
		krissvar. Säkerhetskontrollen körs på servern och kan inte kringgås av hur AI:n väljer att
		svara.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Vad AI-modellen gör och inte gör</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Samtalsstödet bygger på språkmodellen {data.supportChatModel} från OpenAI, som formulerar svar utifrån din
		text och de senaste meddelandena i samtalet. Den är till för reflektion, struktur och att sätta
		ord på tankar.
	</p>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2">
		<li>AI:n ställer inte diagnos och gör inga individanpassade behandlingsplaner.</li>
		<li>AI:n har inte tillgång till din journal eller annan vårdinformation.</li>
		<li>Svaren kan vara ofullständiga eller fel och ska inte vara enda underlag för beslut om din hälsa.</li>
		<li>Meddelanden har en längdgräns och samtalet begränsas till senaste tidens kontext, inte hela din historik på en gång.</li>
	</ul>

	<h2 class="text-lg font-semibold mt-8 mb-2">Mänsklig kontroll över innehåll och gränser</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Vilka ämnen AI-stödet får ge sig in på, hur krisregler är skrivna och hur försiktigt tjänsten
		formulerar sig är beslut som fattas av MittPsyke-redaktionen, inte av AI-modellen själv. Ändringar
		i säkerhetslogiken hanteras med extra försiktighet eftersom de påverkar användares säkerhet direkt.
		Läs mer om det redaktionella arbetet i vår
		<a href="/redaktionell-metod" class="underline hover:no-underline">redaktionella metod</a>.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Data i AI-samtal</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Konton har egna, skyddade samtal. {dataflowCopy.accountChat.storage}
		Använder du chatten utan att logga in ser det annorlunda ut: {dataflowCopy.guestChat.retention}
		I båda fallen gäller samma princip: dina samtal är inte offentliga
		och delas inte som träningsdata för andra syften. Fullständig information om vilka uppgifter som
		sparas och varför finns i
		<a href="/integritet" class="underline hover:no-underline">integritetspolicyn</a>.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">När du bör söka vård istället</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Om du mår dåligt under längre tid, får ökade symtom eller behöver en professionell bedömning bör
		du kontakta vården, till exempel via 1177. Vid akut fara, ring 112. Mer om tjänstens gränser
		finns samlat i <a href="/ansvar" class="underline hover:no-underline">ansvarsinformationen</a>.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Läs mer</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		För ett bredare perspektiv på möjligheter och gränser med AI inom psykisk hälsa, se artikeln
		<a href="/blogg/amne/ai-och-mental-halsa/ai-inom-psykisk-halsa-mojligheter-och-granser" class="underline hover:no-underline">AI inom psykisk hälsa – möjligheter, gränser och säker användning</a>.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Rapportera fel eller otydligheter</h2>
	<p class="opacity-80 leading-relaxed">
		Om ett AI-svar känns fel, otryggt eller otydligt kan du kontakta oss på
		<a href={PUBLIC_CONTACT_MAILTO} class="underline hover:no-underline">{PUBLIC_CONTACT_EMAIL}</a>.
		Din feedback används för att göra säkerhetsarbetet bättre.
	</p>
</main>

<style>
	.ai-content {
		max-width: 720px;
	}

	.ai-content p,
	.ai-content li {
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		letter-spacing: -0.005em;
	}

	.ai-content p {
		margin-bottom: 1rem;
	}

	.ai-content h1 {
		font-family: var(--font-heading);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.1;
	}

	.ai-content h2 {
		font-family: var(--font-heading);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.ai-quick {
		margin-top: 1.1rem;
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
	}

	.ai-quick ul {
		margin: 0.55rem 0 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
	}

	@media (max-width: 640px) {
		.ai-quick {
			padding: 0.9rem;
		}
	}
</style>
