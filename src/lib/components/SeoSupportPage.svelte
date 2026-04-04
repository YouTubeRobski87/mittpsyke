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
	};

	let { config }: { config: SeoSupportPageConfig } = $props();

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

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>{config.h1}</h1>
			<p>{config.lead}</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href={config.primaryCta.href}>{config.primaryCta.label}</a>
			{#if config.secondaryCta}
				<a class="cta-button ghost" href={config.secondaryCta.href}>{config.secondaryCta.label}</a>
			{/if}
		</div>

		{#each config.sections as section}
			<section class="section">
				<h2>{section.title}</h2>
				{#each section.paragraphs as paragraph}
					<p>{paragraph}</p>
				{/each}
			</section>
		{/each}

		<section class="section">
			<h2>{config.resourceListTitle}</h2>
			<ul>
				{#each config.resourceListItems as item}
					<li>
						<a href={item.href}>{item.label}</a> {item.description}
					</li>
				{/each}
			</ul>
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
		background: var(--primary);
		border: 2px solid var(--primary);
		color: white;
		font-family: var(--font-heading);
		font-weight: 600;
		text-decoration: none;
	}

	.cta-button.ghost {
		background: transparent;
		color: var(--primary);
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
		color: #86dfd6;
		border-color: #86dfd6;
	}
</style>
