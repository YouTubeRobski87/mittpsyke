<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { dataflowCopy } from '$lib/dataflow-copy';

	// Sidan följer samma kärnloop som startsidan: skriv, spara det du vill, kom
	// tillbaka, se vad som återkommer. Delarna förklaras först efter loopen, och
	// chatten sist, eftersom den är ett valfritt verktyg och inte produkten.
	// Dataflödena läses ur $lib/dataflow-copy så att sidan aldrig säger något
	// annat än integritetspolicyn.
</script>

<SEO canonical="https://mittpsyke.se/sa-fungerar-mittpsyke" />

<svelte:head>
	<title>Så fungerar MittPsyke | Skriv och se vad som återkommer</title>
	<meta
		name="description"
		content="Skriv, spara det du vill, kom tillbaka när du vill och se vad som återkommer. Om dagboken, Kvällstugan, följeslagaren Balder och den valfria AI-chatten."
	/>
</svelte:head>

<main class="how-content mx-auto w-full px-5 py-10">
	<Breadcrumbs items={[{ label: 'Om MittPsyke', href: '/om-mittpsyke' }, { label: 'Så fungerar MittPsyke' }]} />

	<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Så fungerar MittPsyke</h1>
	<p class="how-lead">
		MittPsyke bygger på dina egna ord över tid. Du skriver, sparar det du vill och kommer tillbaka
		när det passar – utan prestation och utan bedömning.
	</p>

	<section aria-labelledby="loop-title">
		<h2 id="loop-title">Fyra steg</h2>
		<ol class="how-loop" role="list">
			<li>
				<h3>Skriv.</h3>
				<p>Några ord eller en hel sida. Det finns inget rätt sätt.</p>
			</li>
			<li>
				<h3>Spara det du vill.</h3>
				<p>Utan konto stannar texten i din webbläsare. Med konto sparas bara det du väljer att spara.</p>
			</li>
			<li>
				<h3>Kom tillbaka när du vill.</h3>
				<p>Ingenting börjar om för att det gått en tid, och det finns ingen streak att hålla.</p>
			</li>
			<li>
				<h3>Se vad som återkommer.</h3>
				<p>
					I Framsteg sammanställs dina egna ord och humörvärden över tid. Ett tema visas först när det
					har återkommit minst 3 gånger under minst 2 olika veckor.
				</p>
			</li>
		</ol>
	</section>

	<section aria-labelledby="parts-title">
		<h2 id="parts-title">Delarna</h2>

		<div class="how-part">
			<h3>Dagboken</h3>
			<p>
				Här skriver du, kort eller långt. {dataflowCopy.anonymousDiary.short} Med konto sparas ett
				inlägg först när du väljer att spara det. {dataflowCopy.savedDiary.storage}
			</p>
		</div>

		<div class="how-part">
			<h3>Kvällstugan och Kvällsincheckningen</h3>
			<p>
				Kvällstugan är platsen där dagen får landa. Där inne finns Kvällsincheckningen: fyra korta
				steg där du väljer hur kvällen känns, kan skriva vad som tar mest plats och sedan bestämmer
				vad du vill göra med det för ikväll. Till sist väljer du om du vill spara incheckningen eller
				avsluta utan att spara. Du gör den i Kvällstugan när du har loggat in.
			</p>
		</div>

		<div class="how-part">
			<h3>Balder, din följeslagare</h3>
			<p>
				Balder är MittPsykes enda följeslagare. Han finns med i Mitt Hem och Kvällstugan så att
				platsen känns bekant när du kommer tillbaka. Han påverkas inte av hur du mår, och det finns
				ingen streak och inget att prestera – han är bara en lugn närvaro som följer tiden, årstiden
				och platsen tillsammans med dig.
			</p>
		</div>

		<div class="how-part">
			<h3>Chatten – ett valfritt AI-verktyg</h3>
			<p>
				Vill du hellre prata fram tankarna finns en chatt. Svaren skapas av AI, kan bli fel och
				ersätter inte vård eller en människa att prata med. Du kan använda MittPsyke helt utan den.
			</p>
			<p>
				{dataflowCopy.guestChat.aiTransfer} Utan konto: {dataflowCopy.guestChat.retention}
			</p>
		</div>
	</section>

	<section aria-labelledby="limits-title" class="how-limits">
		<h2 id="limits-title">Det här är MittPsyke inte</h2>
		<p>
			MittPsyke är inte vård, diagnos, behandling eller akuthjälp. Vid akut fara, ring
			<a href="tel:112">112</a>. För vårdråd, kontakta
			<a href="https://www.1177.se" rel="noopener noreferrer">1177</a>. Fler stödlinjer finns på
			<a href="https://stodlinjer.se" rel="noopener noreferrer">stodlinjer.se</a>.
		</p>
	</section>

	<nav class="how-more" aria-label="Läs mer">
		<h2>Läs mer</h2>
		<ul role="list">
			<li><a href="/integritet">Integritet</a></li>
			<li><a href="/ansvar">Ansvar</a></li>
			<li><a href="/kontakt-och-villkor">Kontakt och villkor</a></li>
			<li><a href="/cookies-och-leverantorer">Cookies och leverantörer</a></li>
			<li><a href="/tillganglighet">Tillgänglighet</a></li>
		</ul>
	</nav>
</main>

<style>
	.how-content {
		max-width: 720px;
	}

	.how-content section,
	.how-more {
		margin-top: 2.25rem;
	}

	.how-content p,
	.how-content li {
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		letter-spacing: -0.005em;
		overflow-wrap: break-word;
	}

	.how-content p {
		margin: 0 0 1rem;
		opacity: 0.85;
	}

	.how-content h1 {
		font-family: var(--font-heading);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.1;
	}

	.how-content h2 {
		margin: 0 0 0.75rem;
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.how-content h3 {
		margin: 0 0 0.3rem;
		font-family: var(--font-heading);
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.how-lead {
		font-size: 1.08rem;
	}

	.how-content a {
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}

	.how-content a:hover {
		text-decoration: none;
	}

	/* Samma form som startsidans steg: numrerade, med en linje till vänster. */
	.how-loop {
		display: grid;
		gap: 1.1rem;
		margin: 0;
		padding: 0;
		list-style: none;
		counter-reset: how-step;
	}

	.how-loop li {
		padding-left: 1rem;
		border-left: 2px solid hsl(var(--border));
	}

	.how-loop li::before {
		counter-increment: how-step;
		content: counter(how-step) / '';
		display: block;
		margin-bottom: 0.15rem;
		font-family: var(--font-heading);
		font-size: 0.82rem;
		font-weight: 700;
		opacity: 0.7;
	}

	.how-loop p {
		margin-bottom: 0;
	}

	.how-part + .how-part {
		margin-top: 1.5rem;
	}

	.how-limits {
		padding: 1rem 1.1rem;
		border-radius: var(--radius-card);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
	}

	.how-limits p {
		margin-bottom: 0;
	}

	.how-more ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	@media (min-width: 700px) {
		.how-loop {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 640px) {
		.how-limits {
			padding: 0.9rem;
		}
	}
</style>
