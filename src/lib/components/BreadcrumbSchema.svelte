<script lang="ts">
	import { canonicalUrl, PUBLIC_SITE_ORIGIN } from '$lib/seo';
	type Crumb = {
		name: string;
		url: string;
	};

	type BreadcrumbSchemaProps = {
		crumbs: Crumb[];
	};

	let { crumbs }: BreadcrumbSchemaProps = $props();

	function toAbsoluteUrl(url: string): string {
		if (url.startsWith('http://') || url.startsWith('https://')) {
			const parsed = new URL(url);
			if (!['mittpsyke.se', 'www.mittpsyke.se'].includes(parsed.hostname)) return url;
		}

		return canonicalUrl(url);
	}

	const normalizedCrumbs = $derived.by(() => {
		const remainingCrumbs =
			crumbs[0]?.name === 'Hem' || crumbs[0]?.url === '/' || crumbs[0]?.url === `${PUBLIC_SITE_ORIGIN}/`
				? crumbs.slice(1)
				: crumbs;

		return [
			{ name: 'Hem', item: `${PUBLIC_SITE_ORIGIN}/` },
			...remainingCrumbs.map((crumb) => ({
				name: crumb.name || crumb.url.split('/').filter(Boolean).pop() || 'Sida',
				item: toAbsoluteUrl(crumb.url)
			}))
		];
	});

	const schema = $derived({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: normalizedCrumbs.map((crumb, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: crumb.name,
			item: crumb.item
		}))
	});
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify(schema)}<\/script>`}
</svelte:head>
