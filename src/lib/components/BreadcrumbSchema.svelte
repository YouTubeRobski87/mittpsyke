<script lang="ts">
	type Crumb = {
		name: string;
		url: string;
	};

	const SITE_URL = 'https://www.mittpsyke.se';

	type BreadcrumbSchemaProps = {
		crumbs: Crumb[];
	};

	let { crumbs }: BreadcrumbSchemaProps = $props();

	function toAbsoluteUrl(url: string): string {
		if (url.startsWith('http://') || url.startsWith('https://')) {
			return url;
		}

		if (url === '/') {
			return `${SITE_URL}/`;
		}

		return `${SITE_URL}${url.startsWith('/') ? url : `/${url}`}`;
	}

	const normalizedCrumbs = $derived.by(() => {
		const remainingCrumbs =
			crumbs[0]?.name === 'Hem' || crumbs[0]?.url === '/' || crumbs[0]?.url === `${SITE_URL}/`
				? crumbs.slice(1)
				: crumbs;

		return [
			{ name: 'Hem', item: `${SITE_URL}/` },
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
