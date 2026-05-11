<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { cookieBannerOpen } from '$lib/consent';
</script>

<SEO canonical="https://www.mittpsyke.se/cookies-och-leverantorer" />

<svelte:head>
	<title>Cookies och leverantörer | MittPsyke</title>
	<meta
		name="description"
		content="Läs hur MittPsyke använder cookies, analysverktyg och externa leverantörer samt hur du kan hantera samtycke."
	/>
</svelte:head>

<main class="cookies-content mx-auto w-full px-5 py-10">
	<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Cookies och leverantörer</h1>
	<p class="opacity-80 leading-relaxed mb-4">
		Här förklarar vi kort hur MittPsyke använder cookies, lokal lagring, analysverktyg
		och externa leverantörer. Målet är att du ska förstå vad som behövs för att tjänsten
		ska fungera och vad som bara används om du samtycker.
	</p>

	<section class="cookies-quick" aria-label="Kort sammanfattning">
		<h2 class="text-lg font-semibold mt-0 mb-2">Kort sammanfattning</h2>
		<ul>
			<li>Vissa tekniska funktioner behövs för att sidan, konto och inställningar ska fungera.</li>
			<li>Analys och statistik används bara när du har godkänt analys i cookieinställningarna.</li>
			<li>Du kan ändra ditt val genom att öppna cookieinställningarna igen.</li>
		</ul>
	</section>

	<h2 class="text-lg font-semibold mt-8 mb-2">Cookies och lokal lagring</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		MittPsyke använder teknisk lagring för sådant som samtycke, tema, sessionshantering
		och funktioner som behöver komma ihåg ett val i webbläsaren. En del lagras som cookies
		och en del som local storage.
	</p>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2">
		<li><strong>Nödvändiga funktioner:</strong> används för grundläggande drift, inloggning och säkerhet.</li>
		<li><strong>Inställningar:</strong> kan användas för tema, cookieval och andra val du gjort.</li>
		<li><strong>Analyscookies:</strong> används bara om du samtycker till analys.</li>
	</ul>

	<h2 class="text-lg font-semibold mt-8 mb-2">Analysverktyg</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Kodbasen använder Google Analytics via gtag när analys är aktiverat och du har samtyckt.
		Vi hittar ingen aktiv Vercel Analytics-klientkod i projektet.
	</p>
	<section class="provider-card" aria-label="Google Analytics">
		<h3 class="text-base font-semibold mt-0 mb-2">Google Analytics</h3>
		<ul>
			<li><strong>Syfte:</strong> förstå hur webbplatsen används och förbättra upplevelsen.</li>
			<li><strong>När det aktiveras:</strong> endast efter att du godkänt analys.</li>
			<li><strong>Typ av data:</strong> sidvisningar, händelser och teknisk användningsdata.</li>
			<li><strong>Samtycke:</strong> krävs.</li>
		</ul>
	</section>

	<h2 class="text-lg font-semibold mt-8 mb-2">Externa leverantörer</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		MittPsyke använder externa leverantörer för att tjänsten ska fungera. De behandlar
		uppgifter bara i den utsträckning som behövs för respektive funktion.
	</p>
	<div class="provider-list">
		<section class="provider-card" aria-label="Supabase">
			<h3 class="text-base font-semibold mt-0 mb-2">Supabase</h3>
			<p>Konto, inloggning, sessioner och lagring av innehåll som du väljer att spara.</p>
			<p>Kan behandla kontouppgifter, tekniska identifierare och sparat innehåll.</p>
		</section>
		<section class="provider-card" aria-label="OpenAI">
			<h3 class="text-base font-semibold mt-0 mb-2">OpenAI</h3>
			<p>AI-funktioner som chatt, reflektioner och vissa dagboksrelaterade svar.</p>
			<p>Kan behandla text du skickar till AI-funktioner. API-data används inte för modellträning enligt integritetspolicyn.</p>
		</section>
		<section class="provider-card" aria-label="Retell">
			<h3 class="text-base font-semibold mt-0 mb-2">Retell</h3>
			<p>Röstsamtalsfunktionen, om du väljer att använda den.</p>
			<p>Kan behandla röstdata i samband med samtalet.</p>
		</section>
		<section class="provider-card" aria-label="Vercel">
			<h3 class="text-base font-semibold mt-0 mb-2">Vercel</h3>
			<p>Hosting, leverans av webbplatsen och tekniska loggar för drift och felsökning.</p>
			<p>Kan behandla tekniska uppgifter som behövs för säker och stabil drift.</p>
		</section>
		<section class="provider-card" aria-label="Soro">
			<h3 class="text-base font-semibold mt-0 mb-2">Soro</h3>
			<p>Används för att hämta bloggartiklar från Soro-integrationen.</p>
			<p>Soro används inte som analysverktyg i MittPsykes cookie-samtycke.</p>
		</section>
		<section class="provider-card" aria-label="Google Analytics">
			<h3 class="text-base font-semibold mt-0 mb-2">Google Analytics</h3>
			<p>Analys och statistik om hur webbplatsen används, om du samtycker.</p>
			<p>Kan behandla teknisk användningsdata och sidvisningar.</p>
		</section>
	</div>

	<h2 class="text-lg font-semibold mt-8 mb-2">Hur du ändrar samtycke</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Du kan öppna cookieinställningarna igen och ändra ditt val. Om du väljer bort analys
		försöker MittPsyke också rensa Google Analytics-cookies från webbläsaren.
	</p>
	<button
		type="button"
		class="settings-button"
		onclick={() => cookieBannerOpen.set(true)}
	>
		Öppna cookieinställningar
	</button>

	<h2 class="text-lg font-semibold mt-8 mb-2">Relaterade sidor</h2>
	<p class="opacity-80 leading-relaxed">
		Läs också <a href="/integritet" class="underline hover:no-underline">integritetspolicyn</a>,
		<a href="/kontakt-och-villkor" class="underline hover:no-underline">kontakt och villkor</a>,
		<a href="/ansvar" class="underline hover:no-underline">ansvar</a> och
		<a href="/tillganglighet" class="underline hover:no-underline">tillgänglighet</a>.
	</p>
</main>

<style>
	.cookies-content {
		max-width: 720px;
	}

	.cookies-content p,
	.cookies-content li {
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		letter-spacing: -0.005em;
	}

	.cookies-content p {
		margin-bottom: 1rem;
	}

	.cookies-content h1 {
		font-family: var(--font-heading);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.1;
	}

	.cookies-content h2,
	.cookies-content h3 {
		font-family: var(--font-heading);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.cookies-quick,
	.provider-card {
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
	}

	.cookies-quick {
		margin-top: 1.1rem;
	}

	.cookies-quick ul,
	.provider-card ul {
		margin: 0.55rem 0 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
	}

	.provider-list {
		display: grid;
		gap: 0.8rem;
	}

	.provider-card p {
		margin: 0.45rem 0 0;
	}

	.settings-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-pill);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
		padding: 0.65rem 1rem;
		font-weight: 700;
		transition: opacity 150ms ease;
	}

	.settings-button:hover {
		opacity: 0.84;
	}

	@media (max-width: 640px) {
		.cookies-quick,
		.provider-card {
			padding: 0.9rem;
		}
	}
</style>
