<script lang="ts">
	import { page } from '$app/stores';
	import BreadcrumbSchema from '$lib/components/BreadcrumbSchema.svelte';
	import ContentTrustBlock from '$lib/components/ContentTrustBlock.svelte';
	import GuideActionCta from '$lib/components/GuideActionCta.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { buildTitle } from '$lib/seo-kit/seo';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const pillarRoutes: Record<string, string> = {
		angest: '/angest',
		panikattack: '/panikattack',
		depression: '/depression',
		trauma: '/trauma',
		sovproblem: '/sovproblem',
		sjalvkansla: '/sjalvkansla',
		stress: '/stress',
		ensamhet: '/ensamhet',
		overtankande: '/oro',
		kbt: '/kbt',
		beroende: '/guider/beroende'
	};

	const pillarRoute = $derived(pillarRoutes[data.pillar.slug] ?? null);

	function normalizeGuideHref(href: string): string {
		return href.startsWith('/guider-seo/') ? href.replace('/guider-seo/', '/guider/') : href;
	}

	const articleSchema = $derived({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: data.guide.title,
		description: data.guide.seoDescription ?? data.guide.description,
		url: `https://www.mittpsyke.se${$page.url.pathname}`,
		publisher: {
			'@type': 'Organization',
			name: 'MittPsyke',
			url: 'https://www.mittpsyke.se'
		},
		inLanguage: 'sv-SE'
	});

	function markdownToHtml(md: string): string {
		return md
			.replace(/^### (.+)$/gm, '<h3 class="mt-5 text-lg font-semibold">$1</h3>')
			.replace(/^## (.+)$/gm, '<h2 class="mt-7 text-xl font-semibold">$1</h2>')
			.replace(
				/^- \*\*(.+?)\*\*(.*)$/gm,
				'<li class="guide-copy ml-4 mt-1 leading-relaxed"><strong>$1</strong>$2</li>'
			)
			.replace(/^- (.+)$/gm, '<li class="guide-copy ml-4 mt-1 leading-relaxed">$1</li>')
			.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="mt-3 list-disc pl-4">${match}</ul>`)
			.replace(/^\*\*(.+?)\*\*$/gm, '<p class="mt-3 font-semibold">$1</p>')
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/\n\n/g, '</p><p class="guide-copy mt-3 leading-relaxed">')
			.replace(/^(?!<)(.+)$/gm, '<p class="guide-copy mt-3 leading-relaxed">$1</p>')
			.replace(/<p[^>]*><\/p>/g, '');
	}

	const faqSchema = $derived(
		data.guide.faqs?.length
			? {
					'@context': 'https://schema.org',
					'@type': 'FAQPage',
					mainEntity: data.guide.faqs.map((faq: { question: string; answer: string }) => ({
						'@type': 'Question',
						name: faq.question,
						acceptedAnswer: {
							'@type': 'Answer',
							text: faq.answer
						}
					}))
				}
			: null
	);
</script>

<SeoHead
	title={data.guide.seoTitle ?? buildTitle(data.guide.title)}
	description={data.guide.seoDescription ?? data.guide.description}
	canonical={`https://www.mittpsyke.se${$page.url.pathname}`}
/>
<BreadcrumbSchema
	crumbs={[
		{ name: 'Hem', url: '/' },
		{ name: 'Guider', url: '/guider' },
		{ name: data.pillar.title, url: `/guider/${data.pillar.slug}` },
		{ name: data.guide.title, url: $page.url.pathname }
	]}
/>

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify(articleSchema)}<\/script>`}
	{#if faqSchema}
		{@html `<script type="application/ld+json">${JSON.stringify(faqSchema)}<\/script>`}
	{/if}
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-10">
	<nav class="mb-5 text-sm opacity-75" aria-label="Brödsmulor">
		<a class="hover:underline" href="/guider">Guider</a>
		<span> / </span>
		<a class="hover:underline" href={`/guider/${data.pillar.slug}`}>{data.pillar.title}</a>
		<span> / </span>
		<span>{data.guide.title}</span>
	</nav>

	<h1 class="text-3xl font-semibold tracking-tight">{data.guide.title}</h1>
	<p class="guide-ingress mt-3 leading-relaxed">{data.guide.description}</p>

	{#if data.guide.content}
		<div class="guide-content mt-8">
			{@html markdownToHtml(data.guide.content)}
		</div>
	{/if}

	<h2 class="mt-8 text-xl font-semibold">Vanliga frågor</h2>
	<ul class="mt-4 space-y-3">
		{#each data.guide.faqs as faq}
			<li class="rounded-lg border border-black/10 p-4">
				<strong>{faq.question}</strong>
				<p class="guide-copy mt-2 leading-relaxed">{faq.answer}</p>
			</li>
		{/each}
	</ul>

	{#if data.guide.relatedArticles?.length}
		<h2 class="mt-8 text-xl font-semibold">Relaterade artiklar</h2>
		<p class="guide-copy mt-2 leading-relaxed">Fördjupning och vidare läsning inom samma område.</p>
		<ul class="mt-3 space-y-2">
			{#each data.guide.relatedArticles as article}
				<li>
					<a class="hover:underline" href={normalizeGuideHref(article.href)}>{article.title}</a>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="mt-10">
		<GuideActionCta
			pillarSlug={data.pillar.slug}
			chatHref={data.pillar.chatPath}
			exerciseHref={data.nextTool ? `/ovningar/${data.nextTool.slug}` : '/ovningar'}
			exerciseLabel={data.nextTool ? `Prova: ${data.nextTool.title}` : 'Gör en enkel övning'}
		/>
	</div>

	{#if pillarRoute}
		<section class="nasta-steg mt-6 rounded-xl border border-black/10 p-5" aria-label="Mer i samma tema">
			<h2 class="text-base font-semibold">Mer i samma tema</h2>
			<ul class="mt-3 space-y-2">
				<li>
					<a class="next-link" href={pillarRoute}>Fortsätt läsa om {data.pillar.title.toLowerCase()}</a>
				</li>
			</ul>
		</section>
	{/if}

	{#if data.guide.sources?.length || data.guide.updatedAt}
		<ContentTrustBlock updatedAt={data.guide.updatedAt} sources={data.guide.sources} />
	{/if}
</main>

<style>
	.nasta-steg {
		background: rgba(67, 110, 143, 0.04);
	}

	.guide-ingress,
	.guide-copy {
		color: rgba(17, 24, 39, 0.8);
	}

	.guide-content :global(strong) {
		color: rgba(17, 24, 39, 0.92);
	}

	.next-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		text-decoration: underline;
		text-underline-offset: 2px;
		font-size: 0.95rem;
	}

	.next-link:hover {
		opacity: 0.75;
	}

	:global(.dark) .nasta-steg {
		background: rgba(86, 148, 201, 0.06);
		border-color: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .guide-ingress,
	:global(.dark) .guide-copy {
		color: rgba(241, 245, 249, 0.82);
	}

	:global(.dark) .guide-content :global(strong) {
		color: rgba(248, 250, 252, 0.94);
	}
</style>
