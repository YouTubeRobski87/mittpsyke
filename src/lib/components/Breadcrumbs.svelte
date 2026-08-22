<script lang="ts">
	import { page } from '$app/state';
	import { canonicalUrl } from '$lib/seo';

	type BreadcrumbItem = {
		label: string;
		href?: string;
	};

	type BreadcrumbsProps = {
		items: BreadcrumbItem[];
	};

	let { items }: BreadcrumbsProps = $props();

	function toAbsoluteUrl(href: string): string {
		return canonicalUrl(href);
	}

	const normalizedItems = $derived.by(() => {
		const hasHome = items[0]?.href === '/' || items[0]?.label === 'Hem';
		const sourceItems = hasHome ? items : [{ label: 'Hem', href: '/' }, ...items];

		return sourceItems.map((item, index) => {
			const isCurrent = index === sourceItems.length - 1;

			return {
				...item,
				href: isCurrent ? undefined : item.href,
				itemUrl: toAbsoluteUrl(item.href ?? page.url.pathname)
			};
		});
	});

	const schema = $derived({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: normalizedItems.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.label,
			item: item.itemUrl
		}))
	});
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify(schema)}<\/script>`}
</svelte:head>

<nav class="breadcrumbs" aria-label="Brödsmulor">
	<ol>
		{#each normalizedItems as item, index}
			<li>
				{#if index > 0}
					<span class="separator" aria-hidden="true">›</span>
				{/if}
				{#if item.href}
					<a href={item.href}>{item.label}</a>
				{:else}
					<span aria-current="page">{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.breadcrumbs {
		max-width: 100%;
		margin: 0 0 1rem;
		color: hsl(var(--muted-foreground));
		font-family: var(--font-body);
		font-size: 0.86rem;
		line-height: 1.4;
	}

	ol {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: inline-flex;
		align-items: center;
		min-width: 0;
		gap: 0.35rem;
	}

	a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.18em;
		transition: color 150ms ease, opacity 150ms ease;
	}

	a:hover,
	a:focus-visible {
		color: hsl(var(--foreground));
	}

	span[aria-current='page'] {
		color: hsl(var(--foreground) / 0.78);
	}

	.separator {
		opacity: 0.55;
	}
</style>
