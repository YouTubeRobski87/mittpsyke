<script lang="ts">
	import PublicTrustPanel from '$lib/components/PublicTrustPanel.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';

	type TextLink = {
		href: string;
		label: string;
	};

	type ResourceItem = TextLink & {
		description: string;
	};

	type Section = {
		title: string;
		paragraphs: string[];
	};

	type FaqItem = {
		question: string;
		answer: string;
	};

	type TrustSource = {
		label: string;
		href: string;
	};

	// Kort, verifierbar trygghetspunkt högt upp på sidan. Texten ska alltid
	// kunna spåras till `dataflow-copy.ts`, aldrig skrivas fritt.
	type TrustPoint = {
		label: string;
		body: string;
	};

	type HowItWorksStep = {
		title: string;
		body: string;
	};

	type SafetyNote = {
		text: string;
		links?: TextLink[];
	};

	export type SeoSupportPageConfig = {
		title: string;
		description: string;
		canonical: string;
		ogTitle?: string;
		ogDescription?: string;
		h1: string;
		lead: string;
		primaryCta: TextLink;
		secondaryCta?: TextLink;
		sections: Section[];
		resourceListTitle: string;
		resourceListItems: ResourceItem[];
		nextStepTitle: string;
		nextStepParagraphs: string[];
		nextStepLinks: TextLink[];
		faq: FaqItem[];
		updatedDate: string;
		sources: TrustSource[];
		faqSchema?: boolean;
		// ---------------------------------------------------------------------
		// Frivilliga fält för landningsvarianten. Utan dem renderar sidan exakt
		// som förut, vilket är det som håller de övriga stödsidorna oförändrade.
		// ---------------------------------------------------------------------
		variant?: 'default' | 'landing';
		eyebrow?: string;
		trustPoints?: TrustPoint[];
		ctaNote?: string;
		howItWorksTitle?: string;
		howItWorks?: HowItWorksStep[];
		safetyNote?: SafetyNote;
		resourceLayout?: 'list' | 'cards';
	};

	let { config }: { config: SeoSupportPageConfig } = $props();

	const isLanding = $derived(config.variant === 'landing');
	const useResourceCards = $derived(config.resourceLayout === 'cards');

	function isExternal(href: string): boolean {
		return href.startsWith('http');
	}

	const faqJsonLd = $derived(
		config.faqSchema
			? {
					'@context': 'https://schema.org',
					'@type': 'FAQPage',
					mainEntity: config.faq.map((item) => ({
						'@type': 'Question',
						name: item.question,
						acceptedAnswer: {
							'@type': 'Answer',
							text: item.answer
						}
					}))
				}
			: null
	);

	const faqJsonLdTag = $derived(
		faqJsonLd
			? `<script type="application/ld+json">${JSON.stringify(faqJsonLd).replace(/</g, '\\u003c')}<\/script>`
			: ''
	);
</script>

<SeoHead
	title={config.title}
	description={config.description}
	canonical={config.canonical}
	og={{
		title: config.ogTitle ?? config.title,
		description: config.ogDescription ?? config.description,
		url: config.canonical
	}}
/>

<svelte:head>
	{@html faqJsonLdTag}
</svelte:head>

<main class="page" class:landing={isLanding}>
	<div class="page-container">
		<header class="hero">
			{#if config.eyebrow}
				<p class="eyebrow">{config.eyebrow}</p>
			{/if}
			<h1>{config.h1}</h1>
			<p>{config.lead}</p>
		</header>

		{#if config.trustPoints?.length}
			<ul class="trust-points">
				{#each config.trustPoints as point}
					<li>
						<span class="trust-label">{point.label}</span>
						<span class="trust-body">{point.body}</span>
					</li>
				{/each}
			</ul>
		{/if}

		<div class="cta-container">
			<a class="cta-button" href={config.primaryCta.href}>{config.primaryCta.label}</a>
			{#if config.secondaryCta}
				<a class="cta-button ghost" href={config.secondaryCta.href}>{config.secondaryCta.label}</a>
			{/if}
		</div>

		{#if config.ctaNote}
			<p class="cta-note">{config.ctaNote}</p>
		{/if}

		{#if config.howItWorks?.length}
			<section class="section how-it-works">
				<h2>{config.howItWorksTitle ?? 'Så fungerar det'}</h2>
				<ol class="how-steps">
					{#each config.howItWorks as step}
						<li>
							<h3>{step.title}</h3>
							<p>{step.body}</p>
						</li>
					{/each}
				</ol>
			</section>
		{/if}

		{#snippet contentSections()}
			{#each config.sections as section}
				<section class="section">
					<h2>{section.title}</h2>
					{#each section.paragraphs as paragraph}
						<p>{paragraph}</p>
					{/each}
				</section>
			{/each}
		{/snippet}

		<!-- Landningsvarianten får en wrapper så textsektionerna kan ställas i
		     två kolumner på desktop. Övriga stödsidor renderar sektionerna som
		     direkta barn precis som förut, utan extra element. -->
		{#if isLanding}
			<div class="section-pair">{@render contentSections()}</div>
		{:else}
			{@render contentSections()}
		{/if}

		{#if config.safetyNote}
			<aside class="safety-note" aria-label="Om akut hjälp">
				<p>{config.safetyNote.text}</p>
				{#if config.safetyNote.links?.length}
					<p class="safety-links">
						{#each config.safetyNote.links as link}
							{#if isExternal(link.href)}
								<a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
							{:else}
								<a href={link.href}>{link.label}</a>
							{/if}
						{/each}
					</p>
				{/if}
			</aside>
		{/if}

		<section class="section" class:section-wide={useResourceCards}>
			<h2>{config.resourceListTitle}</h2>
			{#if useResourceCards}
				<ul class="resource-cards">
					{#each config.resourceListItems as item}
						<li>
							<a href={item.href}>{item.label}</a>
							<span>{item.description}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<ul>
					{#each config.resourceListItems as item}
						<li>
							<a href={item.href}>{item.label}</a> {item.description}
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="section">
			<h2>{config.nextStepTitle}</h2>
			{#each config.nextStepParagraphs as paragraph}
				<p>{paragraph}</p>
			{/each}
			<p class="links-row">
				{#each config.nextStepLinks as link}
					<a href={link.href}>{link.label}</a>
				{/each}
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			{#each config.faq as item}
				<h3>{item.question}</h3>
				<p>{item.answer}</p>
			{/each}
		</section>

		<PublicTrustPanel updatedDate={config.updatedDate} sources={config.sources} />
	</div>
</main>

<style>
	.page {
		padding: clamp(2.2rem, 6vw, 3rem) clamp(1.25rem, 4vw, 1.5rem) clamp(3.2rem, 8vw, 4rem);
	}

	.page-container {
		max-width: 840px;
		margin: 0 auto;
		display: grid;
		gap: clamp(1.3rem, 3vw, 1.8rem);
	}

	.hero,
	.section {
		max-width: 720px;
	}

	h1,
	h2,
	h3 {
		font-family: var(--font-heading);
		margin: 0;
		letter-spacing: -0.02em;
	}

	h1 {
		font-size: clamp(1.8rem, 1.45rem + 1.8vw, 2.2rem);
		line-height: 1.08;
	}

	h2 {
		font-size: 1.3rem;
		margin-bottom: 0.6rem;
	}

	h3 {
		font-size: 1rem;
		margin-top: 0.9rem;
	}

	p,
	li {
		font-family: var(--font-body);
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.08rem);
		line-height: 1.72;
		margin: 0;
	}

	.section {
		display: grid;
		gap: 0.85rem;
	}

	ul {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.55rem;
	}

	a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.cta-container {
		max-width: 720px;
		display: flex;
		gap: 0.7rem;
		flex-wrap: wrap;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.7rem 1.35rem;
		border-radius: var(--radius-pill);
		background: #1f2937;
		border: 1px solid rgba(15, 23, 42, 0.22);
		color: white;
		font-family: var(--font-heading);
		font-weight: 600;
		text-decoration: none;
	}

	.cta-button.ghost {
		background: transparent;
		border-color: rgba(15, 23, 42, 0.18);
		color: hsl(var(--foreground));
	}

	.links-row {
		margin-top: 0.1rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
	}

	.faq p + h3 {
		margin-top: 1rem;
	}

	@media (max-width: 640px) {
		.cta-button {
			width: 100%;
		}
	}

	:global(.dark) .cta-button.ghost {
		color: #f8fafc;
		border-color: rgba(255, 255, 255, 0.18);
	}

	:global(.dark) .cta-button {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.18);
	}

	/* -------------------------------------------------------------------------
	 * Landningsvarianten. Allt nedan är scopat under `.landing` så att de
	 * stödsidor som inte sätter `variant: 'landing'` behåller exakt sin
	 * nuvarande rendering.
	 * ---------------------------------------------------------------------- */

	.landing {
		background:
			radial-gradient(
				120% 62% at 50% 0%,
				var(--dashboard-bg-accent) 0%,
				transparent 68%
			),
			linear-gradient(hsl(var(--background)), hsl(var(--surface-muted) / 0.42));
	}

	.landing .page-container {
		max-width: var(--container-max);
		gap: clamp(1.5rem, 3.2vw, 2.1rem);
	}

	.landing .hero {
		max-width: 34ch;
	}

	.landing .section {
		max-width: 62ch;
	}

	.landing h1 {
		font-size: clamp(2rem, 1.5rem + 2.4vw, 2.9rem);
		line-height: 1.06;
		text-wrap: balance;
	}

	.landing .hero p {
		margin-top: 0.85rem;
		max-width: 46ch;
		color: hsl(var(--muted-foreground));
	}

	.eyebrow {
		margin-bottom: 0.7rem;
		font-family: var(--font-heading);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--primary);
	}

	/* Trygghetspunkter: kort rad direkt under ingressen, före CTA. */
	.trust-points {
		max-width: var(--container-max);
		padding-left: 0;
		list-style: none;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.7rem;
	}

	.trust-points li {
		min-width: 0;
		display: grid;
		gap: 0.2rem;
		padding: 0.9rem 1rem;
		border-radius: var(--radius-card);
		background: var(--color-surface);
		border: 1px solid var(--primary-border-soft);
		box-shadow: 0 1px 2px var(--shadow-color);
	}

	.trust-label {
		font-family: var(--font-heading);
		font-size: 0.98rem;
		font-weight: 600;
		line-height: 1.35;
		letter-spacing: -0.01em;
	}

	.trust-body {
		font-family: var(--font-body);
		font-size: 0.9rem;
		line-height: 1.55;
		color: hsl(var(--muted-foreground));
	}

	/* CTA i landningsvarianten använder produktens primärfärg i stället för
	 * mallens hårdkodade mörka knapp. */
	.landing .cta-button {
		min-height: 3rem;
		padding: 0.85rem 1.85rem;
		background: var(--primary);
		border-color: var(--primary);
	}

	.landing .cta-button:hover {
		background: var(--color-primary-hover);
		border-color: var(--color-primary-hover);
	}

	.landing .cta-button.ghost {
		background: transparent;
		border-color: var(--primary-border-soft);
		color: hsl(var(--foreground));
	}

	.landing .cta-button.ghost:hover {
		background: var(--primary-soft);
	}

	.landing .cta-button:focus-visible {
		outline: 3px solid var(--focus-ring);
		outline-offset: 2px;
	}

	.cta-note {
		margin-top: -0.6rem;
		max-width: 46ch;
		font-size: 0.9rem;
		line-height: 1.6;
		color: hsl(var(--muted-foreground));
	}

	/* "Så fungerar det" – tre steg, samma varma kortkänsla som chattsidan. */
	.how-it-works {
		max-width: var(--container-max);
		padding: 1.15rem 1.25rem;
		border-radius: var(--radius-card);
		background: var(--color-surface-muted);
		border: 1px solid var(--border-subtle);
	}

	.how-steps {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
		counter-reset: how;
	}

	.how-steps li {
		min-width: 0;
		counter-increment: how;
		padding: 0.95rem 1rem;
		border-radius: var(--radius-card);
		background: var(--color-surface);
		border: 1px solid var(--border-subtle);
	}

	.how-steps h3 {
		margin-top: 0;
		display: grid;
		grid-template-columns: 1.5rem 1fr;
		gap: 0.55rem;
		align-items: baseline;
		font-size: 0.98rem;
		line-height: 1.35;
	}

	.how-steps h3::before {
		content: counter(how);
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--primary);
	}

	.how-steps p {
		margin-top: 0.5rem;
		font-size: 0.88rem;
		line-height: 1.6;
		color: hsl(var(--muted-foreground));
	}

	/* Akuthänvisning: tydlig men medvetet lågmäld, inte en varningsbanner. */
	.safety-note {
		max-width: 62ch;
		padding: 0.85rem 1rem;
		border-left: 3px solid var(--primary-border-soft);
		border-radius: 0 var(--radius-input) var(--radius-input) 0;
		background: var(--primary-soft);
	}

	.safety-note p {
		font-size: 0.92rem;
		line-height: 1.6;
	}

	.safety-links {
		margin-top: 0.45rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.9rem;
	}

	.safety-links a {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		font-size: 0.92rem;
	}

	/* Väg vidare som kort i stället för punktlista. Samma länkmål som förut. */
	.resource-cards {
		padding-left: 0;
		list-style: none;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.7rem;
	}

	.resource-cards li {
		position: relative;
		min-width: 0;
		display: grid;
		gap: 0.2rem;
		padding: 0.9rem 1rem;
		border-radius: var(--radius-card);
		background: var(--color-surface);
		border: 1px solid var(--border-subtle);
	}

	.resource-cards a {
		font-family: var(--font-heading);
		font-size: 0.98rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	/* Hela kortet blir träffyta, så länken inte blir ett smalt textmål på mobil. */
	.resource-cards a::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: var(--radius-card);
	}

	.resource-cards li:hover {
		border-color: var(--primary-border-soft);
	}

	.resource-cards a:focus-visible {
		outline: none;
	}

	.resource-cards li:focus-within {
		outline: 3px solid var(--focus-ring);
		outline-offset: 2px;
	}

	.resource-cards span {
		font-size: 0.88rem;
		line-height: 1.55;
		color: hsl(var(--muted-foreground));
	}

	.landing .section-wide {
		max-width: var(--container-max);
	}

	/* Wrappern runt textsektionerna. Under desktopbrytpunkten är den en ren
	 * enkolumnsstack med samma avstånd som containern hade, så mobil- och
	 * tablet-layouten är oförändrad. */
	.landing .section-pair {
		display: grid;
		gap: clamp(1.5rem, 3.2vw, 2.1rem);
	}

	@media (max-width: 860px) {
		.trust-points,
		.how-steps {
			grid-template-columns: 1fr;
		}

		.resource-cards {
			grid-template-columns: 1fr;
		}
	}

	/* På mobil blir trygghetspunkterna ett samlat kort med tunna avdelare i
	 * stället för tre separata kort. Det håller CTA:n kvar i första vyn. */
	@media (max-width: 640px) {
		.trust-points {
			gap: 0;
			border-radius: var(--radius-card);
			background: var(--color-surface);
			border: 1px solid var(--primary-border-soft);
			box-shadow: 0 1px 2px var(--shadow-color);
		}

		.trust-points li {
			padding: 0.6rem 0.9rem;
			border: none;
			border-radius: 0;
			background: transparent;
			box-shadow: none;
		}

		.trust-points li + li {
			border-top: 1px solid var(--border-subtle);
		}

		.trust-label {
			font-size: 0.94rem;
		}

		.trust-body {
			font-size: 0.86rem;
			line-height: 1.45;
		}
	}

	@media (max-width: 640px) {
		.landing {
			padding-top: 1.6rem;
		}

		.landing .hero,
		.landing .section {
			max-width: 100%;
		}

		.landing h1 {
			font-size: clamp(1.75rem, 1.3rem + 2.4vw, 2.1rem);
		}

		.cta-note {
			margin-top: -0.35rem;
		}
	}

	/* -------------------------------------------------------------------------
	 * Desktop: hero i två kolumner. Vänster bär rubrik, ingress, CTA och
	 * samtyckesraden; höger bär trygghetspunkterna och dataflödesstegen.
	 *
	 * Detta är enbart grid-placering. DOM-ordningen är oförändrad, så
	 * rubrikordning, skärmläsarflöde och tabbordning påverkas inte, och
	 * trygghetspunkterna och stegen innehåller inga fokuserbara element.
	 * ---------------------------------------------------------------------- */
	@media (min-width: 900px) {
		.landing {
			padding-top: 2rem;
		}

		.landing .page-container {
			max-width: 1160px;
			grid-template-columns: 42fr 58fr;
			column-gap: clamp(2rem, 3.6vw, 3.25rem);
			row-gap: 1.5rem;
			align-items: start;
		}

		.landing .hero {
			grid-column: 1;
			grid-row: 1;
			max-width: none;
		}

		.landing .hero p {
			max-width: none;
		}

		.landing .cta-container {
			grid-column: 1;
			grid-row: 2;
			max-width: none;
		}

		.landing .cta-note {
			grid-column: 1;
			grid-row: 3;
			max-width: none;
		}

		/* Trygghetspunkterna följer hela vänsterkolumnen i stället för bara
		 * rubrikraden. De staplas eftersom kolumnen är för smal för tre
		 * etiketter i bredd. */
		.landing .trust-points {
			grid-column: 2;
			grid-row: 1 / 4;
			align-self: start;
			grid-template-columns: 1fr;
			gap: 0.6rem;
		}

		/* "Så fungerar det" är en egen sektion under hero-raden, inte en del
		 * av högerkolumnen. Tidigare spände den rad 2–3, vilket tvingade upp
		 * radhöjderna och lade ett tomrum mellan CTA och samtyckesraden. */
		.landing .how-it-works {
			grid-column: 1 / -1;
			max-width: none;
		}

		/* Allt under hero-blocket återgår till en kolumn i full bredd.
		 * Brödtexten behåller sitt läsmått. */
		.landing .section:not(.how-it-works),
		.landing .safety-note {
			grid-column: 1 / -1;
		}

		.landing .section-wide {
			max-width: none;
		}

		/* Samma tresspalt som stegen ovan, så sidans nedre del får samma
		 * rytm i stället för två breda kort. */
		.landing .resource-cards {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		/* Källpanelen är en egen komponent och ligger utanför denna
		 * komponents CSS-scope, men är ett direkt grid-barn. */
		.landing .page-container > :global(.trust-panel) {
			grid-column: 1 / -1;
		}

		/* Textsektionerna i två lika breda kolumner. Wrappern spänner hela
		 * containern och delar den själv, så hero-gridens 42/58 lämnas orörd. */
		.landing .section-pair {
			grid-column: 1 / -1;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			column-gap: clamp(2rem, 3.6vw, 3.25rem);
			row-gap: 1.5rem;
			align-items: start;
		}

		/* Sektionerna ligger nu i wrapperns grid, inte i sidans. Nollställ
		 * spannet från regeln ovan så de hamnar bredvid varandra. */
		.landing .section-pair .section {
			grid-column: auto;
		}

		/* Akutrutan får ligga an mot samma kanter som kolumnerna ovan.
		 * Den är fortfarande lågmäld genom sin ton, inte genom sin bredd. */
		.landing .safety-note {
			max-width: none;
		}
	}

	:global(.dark) .landing {
		background:
			radial-gradient(120% 62% at 50% 0%, var(--dashboard-bg-accent) 0%, transparent 68%),
			hsl(var(--background));
	}

	:global(.dark) .eyebrow,
	:global(.dark) .how-steps h3::before {
		color: var(--primary-dark);
	}

	:global(.dark) .trust-points li,
	:global(.dark) .how-steps li,
	:global(.dark) .resource-cards li {
		background: rgba(255, 255, 255, 0.04);
		border-color: var(--border-subtle-inverted);
	}

	:global(.dark) .how-it-works {
		background: rgba(255, 255, 255, 0.02);
		border-color: var(--border-subtle-inverted);
	}

	:global(.dark) .safety-note {
		border-left-color: var(--primary-dark-border-soft);
		background: var(--primary-dark-soft);
	}

	:global(.dark) .landing .cta-button {
		color: #0b1220;
		background: var(--primary-dark);
		border-color: var(--primary-dark);
	}

	:global(.dark) .landing .cta-button:hover {
		background: var(--primary-dark);
		border-color: var(--primary-dark);
	}

	:global(.dark) .landing .cta-button.ghost {
		color: #f8fafc;
		background: transparent;
		border-color: var(--primary-dark-border-soft);
	}

	:global(.dark) .landing .cta-button.ghost:hover {
		background: var(--primary-dark-soft);
	}

	/* Sist i filen: mobilvarianten av trygghetskortet i mörkt läge måste ligga
	 * efter de generella dark-reglerna ovan, annars vinner de på källordning. */
	@media (max-width: 640px) {
		:global(.dark) .trust-points {
			background: rgba(255, 255, 255, 0.04);
			border-color: var(--primary-dark-border-soft);
		}

		:global(.dark) .trust-points li {
			background: transparent;
			border-color: transparent;
		}

		:global(.dark) .trust-points li + li {
			border-top: 1px solid var(--border-subtle-inverted);
		}
	}
</style>
