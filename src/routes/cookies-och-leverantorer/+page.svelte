<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { cookieBannerOpen } from '$lib/consent';
</script>

<SEO canonical="https://mittpsyke.se/cookies-och-leverantorer" />

<svelte:head>
	<title>Cookies och leverantörer | MittPsyke</title>
	<meta
		name="description"
		content="Läs hur MittPsyke använder cookies, analysverktyg och externa leverantörer samt hur du kan hantera samtycke."
	/>
</svelte:head>

<main class="cookies-content mx-auto w-full px-5 py-10">
	<Breadcrumbs items={[{ label: 'Om MittPsyke', href: '/om-mittpsyke' }, { label: 'Cookies och leverantörer' }]} />

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
			<li>Google Analytics används bara när du har godkänt analys i cookieinställningarna.</li>
			<li>Ahrefs Web Analytics används för cookie-fri, samlad webbstatistik först efter ditt analyssamtycke.</li>
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
		Google Analytics och Ahrefs Web Analytics aktiveras först när du har godkänt analys.
		Ahrefs används utan cookies men behandlar ändå teknisk användningsdata för samlad webbstatistik.
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
	<section class="provider-card mt-3" aria-label="Ahrefs Web Analytics">
		<h3 class="text-base font-semibold mt-0 mb-2">Ahrefs Web Analytics</h3>
		<ul>
			<li><strong>Syfte:</strong> samlad statistik om trafik och sidvisningar.</li>
			<li><strong>När det aktiveras:</strong> först efter att du godkänt analys.</li>
			<li><strong>Typ av data:</strong> sid-URL, referrer och teknisk användningsdata som sammanställs utan cookies enligt Ahrefs standardinställning.</li>
			<li><strong>Samtycke:</strong> krävs i MittPsyke även om Ahrefs inte sätter analyscookies.</li>
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
			<p>Kan behandla text du skickar till AI-funktioner. Hur länge OpenAI behåller den texten styrs av OpenAI:s egna villkor för deras API.</p>
		</section>
		<section class="provider-card" aria-label="Anthropic">
			<h3 class="text-base font-semibold mt-0 mb-2">Anthropic</h3>
			<p>Den guidade dagboken och vissa sammanfattningar använder Claude för att skapa frågor och dagbokstext.</p>
			<p>Kan behandla den text du aktivt skickar efter att du har gett samtycke för funktionen.</p>
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
		<section class="provider-card" aria-label="Ahrefs Web Analytics">
			<h3 class="text-base font-semibold mt-0 mb-2">Ahrefs Web Analytics</h3>
			<p>Cookie-fri, samlad statistik om trafik och sidvisningar.</p>
			<p>Används för att följa webbplatsens användning och verifiera installationen i Ahrefs.</p>
		</section>
	</div>

	<h2 class="text-lg font-semibold mt-8 mb-2">Hur du ändrar samtycke</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Du kan öppna cookieinställningarna igen och ändra ditt val. Om du väljer bort analys
		meddelas analysverktygen, och MittPsyke försöker också rensa Google Analytics-cookies från webbläsaren.
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
