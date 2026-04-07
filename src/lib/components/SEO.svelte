<script lang="ts">
	type SEOProps = {
		canonical: string;
	};

	let { canonical }: SEOProps = $props();

	function normalizeCanonical(url: string): string {
		const normalizedUrl = new URL(url);
		normalizedUrl.protocol = 'https:';
		normalizedUrl.host = 'www.mittpsyke.se';
		normalizedUrl.search = '';
		normalizedUrl.hash = '';

		if (normalizedUrl.pathname !== '/') {
			normalizedUrl.pathname = normalizedUrl.pathname.replace(/\/+$/, '');
		}

		return normalizedUrl.toString();
	}

	const canonicalHref = $derived(normalizeCanonical(canonical));
</script>

<svelte:head>
	<link rel="canonical" href={canonicalHref} />
</svelte:head>
