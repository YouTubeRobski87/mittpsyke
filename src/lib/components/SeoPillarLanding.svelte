<script lang="ts">
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
			<ul class="mt-3 space-y-2">
				{#each guides as guide}
					<li><a class="hover:underline" href={`/guider-seo/${guide.pillarSlug}/${guide.slug}`}>{guide.title}</a></li>
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
</main>
