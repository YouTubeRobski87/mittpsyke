<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import { accentStore } from '$lib/stores/accent.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	let { children } = $props();

	onMount(async () => {
		themeStore.init();
		accentStore.init();
		await authStore.init();
		await accentStore.syncWithAuth();
		await wizardStore.initProfile();
	});
</script>

<svelte:head>
	<title>Storify – Din AI-dagbok</title>
	<meta name="description" content="Skapa personliga dagboksinlägg med AI. Besvara frågor om din dag och få en unik dagboksanteckning i din valda berättarröst." />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://mystorify.se/" />
	<meta property="og:title" content="Storify – Din intelligenta dagboksassistent" />
	<meta property="og:description" content="Skapa personliga dagboksinlägg med AI. Besvara frågor om din dag och få en unik dagboksanteckning i din valda berättarröst." />
	<meta property="og:image" content="https://mystorify.se/og-image.png" />
	<meta property="og:locale" content="sv_SE" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Storify – Din intelligenta dagboksassistent" />
	<meta name="twitter:description" content="Skapa personliga dagboksinlägg med AI. Besvara frågor om din dag och få en unik dagboksanteckning i din valda berättarröst." />
	<meta name="twitter:image" content="https://mystorify.se/og-image.png" />

	<link rel="canonical" href="https://mystorify.se/" />

	<!-- Structured Data -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Storify',
		description: 'Skapa personliga dagboksinlägg med AI. Besvara frågor om din dag och få en unik dagboksanteckning i din valda berättarröst.',
		url: 'https://mystorify.se',
		applicationCategory: 'LifestyleApplication',
		operatingSystem: 'Web, Android',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'SEK'
		},
		inLanguage: 'sv'
	})}</script>`}
</svelte:head>

<Navbar />
{@render children()}
