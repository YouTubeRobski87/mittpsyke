<script lang="ts">
	import ContentTrustBlock from '$lib/components/ContentTrustBlock.svelte';
	import GuideActionCta from '$lib/components/GuideActionCta.svelte';
	import type { Guide, Pillar, SeoLandingPage } from '$lib/seo-kit/content';

	type SeoPillarLandingProps = {
		pillar: Pillar;
		guides: Guide[];
		landing: SeoLandingPage | null;
	};

	let { pillar, guides, landing }: SeoPillarLandingProps = $props();

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
		kbt: '/guider/kbt'
	};

	const pillarRoute = $derived(pillarRoutes[pillar.slug] ?? null);
	const publishedAt = $derived(landing?.publishedAt ?? '2026-03-21');
	const updatedAt = $derived(
		landing?.updatedAt ??
			guides
				.map((guide) => guide.updatedAt)
				.filter((value): value is string => Boolean(value))
				.sort()
				.at(-1) ??
			publishedAt
	);
	const contentSections = $derived(
		landing?.sections?.length
			? landing.sections
			: [
					{
						heading: `Om ${pillar.title.toLowerCase()}`,
						body: pillar.description
					}
				]
	);
	const faqs = $derived(landing?.faqs ?? []);
	const hasSingleGuide = $derived(guides.length === 1);
</script>

<main class="guide-page mx-auto max-w-3xl px-4 py-10">
	<nav class="guide-breadcrumb text-sm" aria-label="Brödsmulor">
		<a class="guide-link hover:underline" href="/guider">Guider</a>
	</nav>

	{#if pillarRoute}
		<section class="guide-entry guide-surface mt-4 rounded-xl p-4" aria-label="Guide-nivå">
			<p class="guide-kicker">Fördjupning</p>
			<p class="guide-copy leading-relaxed">
				Det här är fördjupningen om {pillar.title.toLowerCase()}. Om du vill börja mer översiktligt
				finns huvudsidan om {pillar.title.toLowerCase()} som första ingång.
			</p>
			<a class="guide-link mt-3 inline-flex hover:underline" href={pillarRoute}>
				Gå till huvudsidan om {pillar.title.toLowerCase()}
			</a>
		</section>
	{/if}

	<h1 class="guide-title mt-3 text-3xl font-semibold tracking-tight">{landing?.h1 ?? pillar.title}</h1>
	<p class="guide-copy mt-3 leading-relaxed">{landing?.intro ?? pillar.description}</p>
	<div class="article-meta mt-4" aria-label="Guideinformation">
		<p>Publicerad: {publishedAt}</p>
		<p>Senast uppdaterad: {updatedAt}</p>
		<p>Författare: MittPsyke</p>
	</div>

	{#each contentSections as section, index}
		<section class={`guide-surface rounded-xl p-4 ${index === 0 ? 'mt-8' : 'mt-6'}`}>
			<h2 class="guide-heading text-xl font-semibold">{section.heading}</h2>
			<p class="guide-copy mt-2 leading-relaxed">{section.body}</p>
			{#if section.links?.length}
				<ul class="mt-3 space-y-2">
					{#each section.links as link}
						<li><a class="guide-link hover:underline" href={link.href}>{link.title}</a></li>
					{/each}
				</ul>
			{/if}
		</section>
	{/each}

	{#if guides.length}
		<section class="mt-8" aria-label="Fördjupning">
			<h2 class="guide-heading text-xl font-semibold">Guider i ämnet</h2>
			<p class="guide-copy mt-2 leading-relaxed">
				När du vill läsa vidare kan du välja en fördjupning som passar just nu.
			</p>
			<ul class={`guide-card-grid mt-4 grid gap-3 ${hasSingleGuide ? 'single' : 'md:grid-cols-2'}`}>
				{#each guides as guide}
					<li class={`guide-surface rounded-xl p-4 ${hasSingleGuide ? 'guide-card-feature' : 'guide-card'}`}>
						<a
							class="guide-link guide-card-link block leading-relaxed hover:underline"
							href={`/guider/${guide.pillarSlug}/${guide.slug}`}
						>
							{guide.title}
						</a>
						<p class="guide-copy mt-2 leading-relaxed">{guide.description}</p>
						<a
							class="guide-card-cta mt-3 inline-flex hover:underline"
							href={`/guider/${guide.pillarSlug}/${guide.slug}`}
						>
							Läs guiden
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if landing?.primaryLinks?.length}
		<section class="mt-8" aria-label="Relaterade ämnen">
			<h2 class="guide-heading text-xl font-semibold">Relaterade ämnen</h2>
			<ul class="mt-3 space-y-2">
				{#each landing.primaryLinks as link}
					<li><a class="guide-link hover:underline" href={link.href}>{link.title}</a></li>
				{/each}
			</ul>
		</section>
	{/if}

	<GuideActionCta
		layout="compact"
		pillarSlug={pillar.slug}
		chatHref={pillar.chatPath}
		exerciseHref="/ovningar"
		exerciseLabel="Se alla övningar"
	/>

	{#if faqs.length}
		<section class="mt-8" aria-label="Vanliga frågor">
			<h2 class="guide-heading text-xl font-semibold">Vanliga frågor</h2>
			<ul class="mt-4 space-y-3">
				{#each faqs as faq}
					<li class="guide-surface rounded-xl p-4">
						<h3 class="guide-heading text-base font-semibold">{faq.question}</h3>
						<p class="guide-copy mt-2 leading-relaxed">{faq.answer}</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<ContentTrustBlock
		updatedAt={updatedAt}
		sources={landing?.sources}
	/>
</main>

<style>
	.guide-page {
		color: #0f172a;
	}

	.guide-breadcrumb {
		color: rgba(15, 23, 42, 0.62);
	}

	.guide-kicker {
		margin: 0 0 0.45rem;
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		color: #436e8f;
	}

	.guide-title,
	.guide-heading {
		color: #0f172a;
	}

	.guide-entry {
		display: grid;
		gap: 0.25rem;
	}

	.guide-copy {
		color: rgba(15, 23, 42, 0.82);
	}

	.article-meta {
		display: grid;
		gap: 0.25rem;
		font-size: 0.9rem;
		line-height: 1.55;
		color: rgba(15, 23, 42, 0.66);
	}

	.article-meta p {
		margin: 0;
	}

	.guide-surface {
		border: 1px solid rgba(15, 23, 42, 0.08);
		background:
			radial-gradient(circle at top left, rgba(15, 118, 110, 0.08), transparent 42%),
			linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 252, 0.98));
	}

	.guide-card,
	.guide-card-feature {
		display: flex;
		flex-direction: column;
	}

	.guide-card-feature {
		padding: 1.1rem 1.1rem 1rem;
	}

	.guide-card-link {
		font-size: 1.02rem;
		font-weight: 600;
	}

	.guide-card-cta {
		font-size: 0.9rem;
		font-weight: 600;
		color: #436e8f;
	}

	.guide-link {
		color: #436e8f;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	:global(.dark) .guide-breadcrumb {
		color: rgba(226, 232, 240, 0.68);
	}

	:global(.dark) .guide-kicker {
		color: #7dd3fc;
	}

	:global(.dark) .guide-title,
	:global(.dark) .guide-heading {
		color: #f8fafc;
	}

	:global(.dark) .guide-copy {
		color: rgba(226, 232, 240, 0.82);
	}

	:global(.dark) .article-meta {
		color: rgba(226, 232, 240, 0.68);
	}

	:global(.dark) .guide-surface {
		border-color: rgba(148, 163, 184, 0.12);
		background:
			radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 42%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
	}

	:global(.dark) .guide-link {
		color: #7dd3fc;
	}

	:global(.dark) .guide-card-cta {
		color: #7dd3fc;
	}
</style>
