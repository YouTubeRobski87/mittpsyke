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
</script>

<main class="mx-auto max-w-3xl px-4 py-10">
	<nav class="text-sm opacity-75">
		<a class="hover:underline" href="/guider-seo">Guider SEO</a>
	</nav>

	<h1 class="mt-3 text-3xl font-semibold tracking-tight">{landing?.h1 ?? pillar.title}</h1>
	<p class="mt-3 leading-relaxed text-black/75">{landing?.intro ?? pillar.description}</p>

	{#each contentSections as section}
		<section class="mt-6 rounded-xl border border-black/10 bg-black/[0.02] p-4">
			<h2 class="text-xl font-semibold">{section.heading}</h2>
			<p class="mt-2 leading-relaxed text-black/80">{section.body}</p>
			{#if section.links?.length}
				<ul class="mt-3 space-y-2">
					{#each section.links as link}
						<li><a class="hover:underline" href={link.href}>{link.title}</a></li>
					{/each}
				</ul>
			{/if}
		</section>
	{/each}

	{#if guides.length}
		<section class="mt-8" aria-label="Fördjupning">
			<h2 class="text-xl font-semibold">Fördjupa dig i området</h2>
			<p class="mt-2 leading-relaxed text-black/75">Välj en guide som matchar det du behöver just nu.</p>
			<ul class="mt-4 grid gap-3 md:grid-cols-2">
				{#each guides as guide}
					<li class="rounded-xl border border-black/10 bg-white/70 p-4">
						<a
							class="block leading-relaxed hover:underline"
							href={`/guider-seo/${guide.pillarSlug}/${guide.slug}`}
						>
							{guide.title}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if landing?.primaryLinks?.length}
		<section class="mt-8" aria-label="Relaterade ämnen">
			<h2 class="text-xl font-semibold">Relaterade ämnen</h2>
			<ul class="mt-3 space-y-2">
				{#each landing.primaryLinks as link}
					<li><a class="hover:underline" href={link.href}>{link.title}</a></li>
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
			<h2 class="text-xl font-semibold">Vanliga frågor</h2>
			<ul class="mt-4 space-y-3">
				{#each faqs as faq}
					<li class="rounded-xl border border-black/10 bg-black/[0.02] p-4">
						<h3 class="text-base font-semibold">{faq.question}</h3>
						<p class="mt-2 leading-relaxed text-black/80">{faq.answer}</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if landing?.sources?.length || landing?.updatedAt}
		<ContentTrustBlock updatedAt={landing?.updatedAt} sources={landing?.sources} />
	{/if}
</main>
