<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';

	// Personen bakom MittPsyke, i första person. Sidan ska bygga förtroende för
	// den som driver tjänsten utan att bli ett personvarumärke: MittPsyke är
	// fortfarande huvudsaken. Inga tekniska detaljer eller utvecklarnoteringar -
	// de hör inte hemma i det användaren läser.
	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'AboutPage',
		name: 'Om skaparen',
		url: 'https://mittpsyke.se/om-skaparen',
		description: 'Robert "Robban" Claesson, som har skapat och driver MittPsyke.',
		mainEntity: {
			'@type': 'Person',
			name: 'Robert Claesson',
			alternateName: 'Robban',
			jobTitle: 'Grundare av MittPsyke'
		},
		publisher: { '@type': 'Organization', name: 'MittPsyke', url: 'https://mittpsyke.se' }
	};
</script>

<SEO canonical="https://mittpsyke.se/om-skaparen" />

<svelte:head>
	<title>Om skaparen | MittPsyke</title>
	<meta
		name="description"
		content='Robert "Robban" Claesson har skapat och driver MittPsyke. Om varför tjänsten finns, vad den vill vara och vad den inte är.'
	/>
	{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}<\/script>`}
</svelte:head>

<main class="creator-content mx-auto w-full px-5 py-10">
	<Breadcrumbs items={[{ label: 'Om MittPsyke', href: '/om-mittpsyke' }, { label: 'Om skaparen' }]} />

	<header class="creator-hero">
		<div class="creator-hero-copy">
			<p class="creator-eyebrow">Bakom MittPsyke</p>
			<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Om skaparen</h1>
			<p class="creator-lead">
				Jag heter Robert Claesson, men de flesta säger Robban. Det är jag som har skapat och driver
				MittPsyke.
			</p>
		</div>

		<aside class="creator-snapshot" aria-label='Kort om Robert "Robban" Claesson'>
			<span class="creator-monogram" aria-hidden="true">RC</span>
			<div>
				<p class="snapshot-name">Robert "Robban" Claesson</p>
				<p class="snapshot-text">Grundare av MittPsyke</p>
			</div>
		</aside>
	</header>

	<section aria-labelledby="why-title">
		<h2 id="why-title">Varför jag skapade MittPsyke</h2>
		<p>
			MittPsyke föddes ur en tid i mitt liv då jag själv mådde väldigt dåligt och hade svårt att få det
			stöd jag behövde. När hjälpen kändes långt borta började jag småprata med AI. De enkla samtalen
			blev med tiden ett sätt att sätta ord på tankar och känslor som annars var svåra att bära ensam.
		</p>
		<p>
			Det var ingen lösning på allt, men det blev ett första steg. Jag tänkte att om det kunde hjälpa
			mig vidare, borde fler få samma möjlighet.
		</p>
	</section>

	<section aria-labelledby="ambition-title">
		<h2 id="ambition-title">Vad jag vill med MittPsyke</h2>
		<p>
			Att det ska finnas en lugn plats där man kan skriva av sig, komma tillbaka och se vad som
			återkommer i sina egna ord – utan krav, utan dömande och med låg tröskel att börja. Jag bygger
			den i små steg och ändrar när något kan bli tydligare eller tryggare.
		</p>
	</section>

	<section aria-labelledby="not-title">
		<h2 id="not-title">Det jag inte är</h2>
		<p>
			Jag är inte psykolog eller annan vårdpersonal. MittPsyke bygger på egen erfarenhet, inte på
			klinisk utbildning. Guiderna skriver jag själv, och de är inte medicinskt granskade – därför
			anges källor som 1177 och Folkhälsomyndigheten i varje guide. Hur det går till beskrivs i
			<a href="/redaktionell-metod">den redaktionella metoden</a>.
		</p>
	</section>

	<section class="contact-panel" aria-labelledby="creator-contact">
		<h2 id="creator-contact">Hör gärna av dig</h2>
		<p>
			Har du frågor om MittPsyke, vill samarbeta eller har hittat något som inte stämmer? Mejla mig
			på <a href={PUBLIC_CONTACT_MAILTO}>{PUBLIC_CONTACT_EMAIL}</a>.
		</p>
	</section>

	<nav class="creator-more" aria-label="Läs mer">
		<h2>Läs mer</h2>
		<ul role="list">
			<li><a href="/om-mittpsyke">Om MittPsyke</a></li>
			<li><a href="/redaktionell-metod">Redaktionell metod</a></li>
			<li><a href="/integritet">Integritet</a></li>
		</ul>
	</nav>
</main>

<style>
	.creator-content {
		max-width: 720px;
	}

	.creator-content section,
	.creator-more {
		margin-top: 2.25rem;
	}

	.creator-content p {
		margin: 0 0 1rem;
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		overflow-wrap: break-word;
	}

	.creator-content section p {
		color: hsl(var(--foreground) / 0.86);
	}

	.creator-content h1,
	.creator-content h2 {
		font-family: var(--font-heading);
		letter-spacing: 0;
	}

	.creator-content h1 {
		font-weight: 850;
		line-height: 1.1;
	}

	.creator-content h2 {
		margin: 0 0 0.6rem;
		font-size: 1.2rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.creator-content a {
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}

	.creator-content a:hover {
		text-decoration: none;
	}

	.creator-hero {
		display: grid;
		gap: 1rem;
		align-items: center;
		margin-top: 0.5rem;
	}

	.creator-hero-copy {
		min-width: 0;
	}

	.creator-eyebrow {
		margin: 0 0 0.45rem;
		color: var(--primary-dark);
		font-family: var(--font-heading);
		font-size: 0.86rem;
		font-weight: 700;
		line-height: 1.3;
	}

	.creator-lead {
		max-width: 60ch;
		font-size: clamp(1.02rem, 0.98rem + 0.25vw, 1.12rem);
	}

	.creator-snapshot,
	.contact-panel {
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		background: hsl(var(--surface-soft));
	}

	.creator-snapshot {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.85rem;
		align-items: center;
		padding: 1rem;
	}

	.creator-monogram {
		display: inline-flex;
		width: 3rem;
		height: 3rem;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-input);
		background: var(--primary-dark-soft);
		color: var(--primary-dark);
		font-family: var(--font-heading);
		font-weight: 850;
		line-height: 1;
	}

	.creator-snapshot p {
		margin: 0;
	}

	.snapshot-name {
		font-family: var(--font-heading);
		font-weight: 700;
		line-height: 1.25;
	}

	.snapshot-text {
		color: hsl(var(--muted-foreground));
		font-size: 0.95rem;
		line-height: 1.55;
	}

	.contact-panel {
		padding: 1rem 1.1rem;
	}

	.contact-panel p {
		margin-bottom: 0;
	}

	.creator-more ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* Kortet ligger under ingressen i alla bredder. Bredvid den, i en 720 px
	   bred spalt, bröts namnet på tre rader. */
	.creator-snapshot {
		justify-self: start;
		min-width: min(100%, 20rem);
	}

	@media (max-width: 640px) {
		.creator-content {
			padding-top: 2rem;
			padding-bottom: 2.8rem;
		}

		.creator-snapshot,
		.contact-panel {
			padding: 0.9rem;
		}
	}
</style>
