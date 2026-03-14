<script lang="ts">
	import SeoCta from '$lib/seo-kit/SeoCta.svelte';
	import { buildTitle, canonical } from '$lib/seo-kit/seo';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	// Map content.ts pillar slugs → main pillar route paths
	const pillarRoutes: Record<string, string> = {
		angest: '/angest',
		depression: '/depression',
		trauma: '/trauma',
		sovproblem: '/sovproblem',
		sjalvkansla: '/sjalvkansla',
		stress: '/stress',
		ensamhet: '/ensamhet'
	};

	const pillarRoute = pillarRoutes[data.pillar.slug] ?? null;

	function formatDate(iso: string): string {
		const months = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];
		const [year, month, day] = iso.split('-');
		return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
	}

	const jsonLdArticle = $derived({
		"@context": "https://schema.org",
		"@type": "Article",
		"headline": data.guide.title,
		"description": data.guide.description,
		"url": `https://mittpsyke.se/guider-seo/${data.pillar.slug}/${data.guide.slug}`,
		"dateModified": data.guide.updatedAt ?? undefined,
		"author": [
			{
				"@type": "Organization",
				"name": "MittPsyke",
				"url": "https://mittpsyke.se"
			},
			{
				"@type": "Person",
				"name": "Robert Claesson",
				"jobTitle": "Grundare",
				"url": "https://mittpsyke.se/om-mittpsyke"
			}
		],
		"publisher": {
			"@type": "Organization",
			"name": "MittPsyke",
			"url": "https://mittpsyke.se"
		},
		"inLanguage": "sv-SE"
	});

	function markdownToHtml(md: string): string {
		return md
			.replace(/^### (.+)$/gm, '<h3 class="mt-5 text-lg font-semibold">$1</h3>')
			.replace(/^## (.+)$/gm, '<h2 class="mt-7 text-xl font-semibold">$1</h2>')
			.replace(/^- \*\*(.+?)\*\*(.*)$/gm, '<li class="ml-4 mt-1 leading-relaxed text-black/80"><strong>$1</strong>$2</li>')
			.replace(/^- (.+)$/gm, '<li class="ml-4 mt-1 leading-relaxed text-black/80">$1</li>')
			.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="mt-3 list-disc pl-4">${match}</ul>`)
			.replace(/^\*\*(.+?)\*\*$/gm, '<p class="mt-3 font-semibold">$1</p>')
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/\n\n/g, '</p><p class="mt-3 leading-relaxed text-black/80">')
			.replace(/^(?!<)(.+)$/gm, '<p class="mt-3 leading-relaxed text-black/80">$1</p>')
			.replace(/<p[^>]*><\/p>/g, '');
	}

	const jsonLdFaq = $derived(data.guide.faqs?.length ? {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		"mainEntity": data.guide.faqs.map((faq: { question: string; answer: string }) => ({
			"@type": "Question",
			"name": faq.question,
			"acceptedAnswer": {
				"@type": "Answer",
				"text": faq.answer
			}
		}))
	} : null);
</script>

<svelte:head>
	<title>{buildTitle(data.guide.title)}</title>
	<link rel="canonical" href={canonical(`/guider-seo/${data.pillar.slug}/${data.guide.slug}`)} />
	<meta name="description" content={data.guide.description} />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLdArticle)}<\/script>`}
	{#if jsonLdFaq}
		{@html `<script type="application/ld+json">${JSON.stringify(jsonLdFaq)}<\/script>`}
	{/if}
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-10">
	<nav class="mb-5 text-sm opacity-75">
		<a class="hover:underline" href="/guider-seo">Guider SEO</a>
		<span> / </span>
		<a class="hover:underline" href={`/guider-seo/${data.pillar.slug}`}>{data.pillar.title}</a>
	</nav>

	<h1 class="text-3xl font-semibold tracking-tight">{data.guide.title}</h1>
	<p class="mt-3 leading-relaxed text-black/75">{data.guide.description}</p>

	<section class="mt-6 rounded-xl border border-black/10 bg-black/[0.02] p-4" aria-label="Om innehållet">
		<p class="text-sm"><strong>Innehåll från MittPsyke-redaktionen</strong></p>
		<p class="mt-2 text-sm leading-relaxed text-black/80">Faktagranskad mot: <a class="underline" href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>, <a class="underline" href="https://www.socialstyrelsen.se" target="_blank" rel="noopener noreferrer">Socialstyrelsen</a>, <a class="underline" href="https://www.folkhalsomyndigheten.se" target="_blank" rel="noopener noreferrer">Folkhälsomyndigheten</a></p>
		<p class="mt-2 text-sm leading-relaxed text-black/80">Det här är stödjande information för reflektion och egen förståelse. Det ersätter inte vård, diagnos eller behandling.</p>
		<p class="mt-2 text-sm"><a class="text-black/60 underline underline-offset-2 hover:text-black" href="/sa-arbetar-vi-med-innehall">Läs mer om hur vi arbetar med innehåll →</a></p>
	</section>

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
				<p class="mt-2 leading-relaxed text-black/80">{faq.answer}</p>
			</li>
		{/each}
	</ul>

	{#if data.guide.relatedArticles?.length}
		<h2 class="mt-8 text-xl font-semibold">Relaterade artiklar</h2>
		<p class="mt-2 leading-relaxed text-black/75">Fördjupning och vidare läsning inom samma område.</p>
		<ul class="mt-3 space-y-2">
			{#each data.guide.relatedArticles as article}
				<li>
					<a class="hover:underline" href={article.href}>{article.title}</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if data.guide.sources?.length || data.guide.updatedAt}
		<section class="mt-10 border-t border-black/10 pt-6" aria-label="Källor och vidare läsning">
			{#if data.guide.updatedAt}
				<p class="mb-3 text-xs text-black/50">Senast uppdaterad: {formatDate(data.guide.updatedAt)}</p>
			{/if}
			{#if data.guide.sources?.length}
				<h2 class="text-base font-semibold">Källor och vidare läsning</h2>
				<ul class="mt-2 space-y-1">
					{#each data.guide.sources as source}
						<li class="text-sm">
							<a
								class="text-black/70 underline underline-offset-2 hover:text-black"
								href={source.url}
								target="_blank"
								rel="noopener noreferrer"
							>{source.label}</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}

	{#if data.nextTool || pillarRoute}
		<section class="nasta-steg mt-10 rounded-xl border border-black/10 p-5" aria-label="Nästa steg">
			<h2 class="text-base font-semibold">Nästa steg</h2>
			<ul class="mt-3 space-y-2">
				{#if data.nextTool}
					<li>
						<a class="next-link" href={`/ovningar/${data.nextTool.slug}`}>
							<span class="next-icon">🧘</span> Testa övningen: {data.nextTool.title}
						</a>
					</li>
				{/if}
				{#if pillarRoute}
					<li>
						<a class="next-link" href={pillarRoute}>
							<span class="next-icon">📖</span> Mer om {data.pillar.title}
						</a>
					</li>
				{/if}
				<li>
					<a class="next-link" href="/dagbok">
						<span class="next-icon">✏️</span> Skriv om det i dagboken
					</a>
				</li>
			</ul>
		</section>
	{/if}

	<div class="mt-10">
		<SeoCta chatPath={data.pillar.chatPath} />
	</div>
</main>

<style>
	.nasta-steg {
		background: rgba(67, 110, 143, 0.04);
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

	.next-icon {
		font-size: 1rem;
	}

	:global(.dark) .nasta-steg {
		background: rgba(86, 148, 201, 0.06);
		border-color: rgba(255, 255, 255, 0.1);
	}
</style>
