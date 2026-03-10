<script lang="ts">
	import '../app.css';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { supabase } from '$lib/supabase';
	import { page } from '$app/state';
	import type { User } from '@supabase/supabase-js';

	const UNDER_CONSTRUCTION = false;

	let { children } = $props();
	const organizationJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'MittPsyke',
		url: 'https://www.mittpsyke.se',
		email: 'mittpsyke@ownit.nu',
		founder: {
			'@type': 'Person',
			name: 'Robert Claesson'
		},
		identifier: '198712284895'
	};

	const isChat = $derived(Boolean(page.route.id?.includes('/chat/')));

	let user = $state<User | null>(null);
	let displayName = $state<string | null>(null);
	let mobileMenuOpen = $state(false);
	let profileRequestVersion = 0;

	async function syncUser(sessionUser: User | null) {
		user = sessionUser;
		const requestVersion = ++profileRequestVersion;

		if (!sessionUser) {
			displayName = null;
			return;
		}

		const { data, error } = await supabase
			.from('profiles')
			.select('display_name')
			.eq('id', sessionUser.id)
			.maybeSingle();

		if (requestVersion !== profileRequestVersion) return;

		if (error) {
			displayName = null;
			return;
		}

		const nextName = typeof data?.display_name === 'string' ? data.display_name.trim() : '';
		displayName = nextName.length > 0 ? nextName : null;
	}

	$effect(() => {
		supabase.auth.getSession().then(({ data }) => {
			void syncUser(data.session?.user ?? null);
		});

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, session) => {
			void syncUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	});

	async function logout() {
		await supabase.auth.signOut();
		window.location.href = '/login';
	}
</script>

<svelte:head>
	{#if UNDER_CONSTRUCTION}
		<title>MittPsyke - Under konstruktion</title>
		<meta
			name="description"
			content="MittPsyke är tillfälligt under konstruktion medan vi arbetar med förbättringar."
		/>
	{:else}
		<title>{page.data?.title ? `${page.data.title} | Mittpsyke` : 'Psykiskt stöd online | Verktyg mot ångest | Mittpsyke.se'}</title>

		<meta
			name="description"
			content={page.data?.description || 'Anonymt samtalsstöd och digitala verktyg för din psykiska hälsa.'}
		/>

		<meta name="robots" content="index, follow" />
		<meta name="author" content="MittPsyke" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />

		<meta property="og:title" content={page.data?.title ? `${page.data.title} | Mittpsyke` : 'MittPsyke – Psykiskt stöd online'} />
		<meta
			property="og:description"
			content={page.data?.description || 'Anonymt samtalsstöd och digitala verktyg för din psykiska hälsa.'}
		/>
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="MittPsyke" />

		<meta property="og:url" content="https://www.mittpsyke.se{page.url.pathname}" />
		<meta property="og:image" content="https://www.mittpsyke.se/og-image.png" />

		<link rel="canonical" href="https://www.mittpsyke.se{page.url.pathname}" />

		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={page.data?.title ? `${page.data.title} | Mittpsyke` : 'MittPsyke – Psykiskt stöd online'} />
		<meta
			name="twitter:description"
			content={page.data?.description || 'Anonymt samtalsstöd och digitala verktyg för din psykiska hälsa.'}
		/>
		{@html `<script type="application/ld+json">${JSON.stringify(organizationJsonLd)}<\/script>`}
	{/if}
</svelte:head>

{#if UNDER_CONSTRUCTION}
	<main class="maintenance-screen">
		<section class="maintenance-card" aria-label="Under konstruktion">
			<h1>MittPsyke</h1>
			<p class="subtitle">Sidan är tillfälligt under konstruktion.</p>
			<p class="details">
				Vi arbetar lugnt och metodiskt med förbättringar. Tack för ditt tålamod.
			</p>
		</section>
	</main>
{:else}
	<header class="sticky top-0 z-30 border-b border-black/8 bg-white/75 dark:bg-black/35 backdrop-blur">
		<div class="flex items-center justify-between gap-3 px-5 py-3.5">
			<div class="flex items-center gap-3 sm:gap-4 min-w-0">
				<a
					href="/"
					class="text-sm font-semibold opacity-95 hover:opacity-100 hover:underline transition-opacity whitespace-nowrap"
				>
					Hem
				</a>

				<nav class="hidden md:flex items-center gap-4">
					<a
						href="/guider"
						class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity"
					>
						Guider
					</a>
					<a
						href="/ovningar"
						class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity"
					>
						Övningar
					</a>
					<a
						href="/om-mittpsyke"
						class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity"
					>
						Om MittPsyke
					</a>
					<a
						href="https://stodlinjer.se"
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity"
					>
						Akut hjälp (Stödlinjer)
					</a>
				</nav>
			</div>

			<div class="flex items-center gap-3">
				<nav class="hidden md:flex items-center gap-4">
					{#if user}
						<span class="text-sm opacity-70">
							{displayName ? `V\u00e4lkommen, ${displayName}` : 'V\u00e4lkommen tillbaka'}
						</span>
						<a href="/dagbok" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">
							Dagbok
						</a>
						<a href="/framsteg" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">
							Framsteg
						</a>
						<a href="/dashboard" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">
							Min portal
						</a>
						<button
							onclick={logout}
							class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity"
						>
							Logga ut
						</button>
					{:else}
						<a
							href="mailto:mittpsyke@ownit.nu"
							class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity"
						>
							Kontakt
						</a>
						<a href="/login" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">
							Logga in
						</a>
						<a href="/register" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">
							Registrera
						</a>
					{/if}
				</nav>

				<ThemeToggle />

				<button
					type="button"
					class="md:hidden inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/10 px-2.5 py-2 text-sm opacity-80 hover:opacity-100 transition-opacity"
					aria-label="Öppna meny"
					aria-expanded={mobileMenuOpen}
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				>
					&#9776;
				</button>
			</div>
		</div>

		{#if mobileMenuOpen}
			<div class="md:hidden border-t border-black/8 dark:border-white/10 px-5 py-3 space-y-2">
				<a
					href="/guider"
					class="block text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity"
					onclick={() => (mobileMenuOpen = false)}
				>
					Guider
				</a>
				<a
					href="/ovningar"
					class="block text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity"
					onclick={() => (mobileMenuOpen = false)}
				>
					Övningar
				</a>
				<a
					href="/om-mittpsyke"
					class="block text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity"
					onclick={() => (mobileMenuOpen = false)}
				>
					Om MittPsyke
				</a>
				<a
					href="https://stodlinjer.se"
					target="_blank"
					rel="noopener noreferrer"
					class="block text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity"
					onclick={() => (mobileMenuOpen = false)}
				>
					Akut hjälp (Stödlinjer)
				</a>
				{#if user}
					<p class="text-sm opacity-70">{displayName ? `V\u00e4lkommen, ${displayName}` : 'V\u00e4lkommen tillbaka'}</p>
					<a
						href="/dagbok"
						class="block text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity"
						onclick={() => (mobileMenuOpen = false)}
					>
						Dagbok
					</a>
					<a
						href="/framsteg"
						class="block text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity"
						onclick={() => (mobileMenuOpen = false)}
					>
						Framsteg
					</a>
					<a
						href="/dashboard"
						class="block text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity"
						onclick={() => (mobileMenuOpen = false)}
					>
						Min portal
					</a>
					<button
						onclick={() => {
							mobileMenuOpen = false;
							logout();
						}}
						class="block text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity"
					>
						Logga ut
					</button>
				{:else}
					<a
						href="mailto:mittpsyke@ownit.nu"
						class="block text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity"
						onclick={() => (mobileMenuOpen = false)}
					>
						Kontakt
					</a>
					<a
						href="/login"
						class="block text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity"
						onclick={() => (mobileMenuOpen = false)}
					>
						Logga in
					</a>
					<a
						href="/register"
						class="block text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity"
						onclick={() => (mobileMenuOpen = false)}
					>
						Registrera
					</a>
				{/if}
				<p class="pt-1 text-xs opacity-60">Vid akut fara: ring 112</p>
			</div>
		{/if}
	</header>

	<div class:is-chat-page={isChat}>
		<main class="mt-6">
			{@render children()}
		</main>

		<section class="site-disclaimer mt-10 px-5">
			<p class="mx-auto max-w-4xl text-center text-xs sm:text-sm opacity-70 leading-relaxed">
				MittPsyke ersätter inte vård. Vid akut fara ring 112 &middot; Vårdråd 1177.
			</p>
		</section>

	<footer class="site-footer border-t border-black/8 py-5 px-5 text-sm opacity-60 text-center mt-12">
		© {new Date().getFullYear()} MittPsyke. Alla rättigheter förbehållna.
		<span class="mx-2">&middot;</span>
		<a href="/om-mittpsyke" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
			Om MittPsyke
		</a>
		<span class="mx-2">&middot;</span>
		<a href="/integritet" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
			Integritetspolicy
		</a>
		<span class="mx-2">&middot;</span>
		<a href="/ansvar" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
			Ansvarsinfo
		</a>
		<span class="mx-2">&middot;</span>
		<a
			href="https://stodlinjer.se"
			target="_blank"
			rel="noopener noreferrer"
			class="text-sm font-medium text-teal-700/90 dark:text-teal-300/90 opacity-90 hover:opacity-100 transition-opacity"
		>
			Akut hjälp (Stödlinjer)
		</a>
		<div class="footer-company mt-2 text-xs opacity-70">
			<p>© MittPsyke</p>
			<p>Enskild näringsverksamhet</p>
			<p>Org.nr: 198712284895</p>
			<p><a href="mailto:mittpsyke@ownit.nu" class="hover:opacity-100 transition-opacity">mittpsyke@ownit.nu</a></p>
		</div>
	</footer>
	</div>
{/if}

<style>
	.maintenance-screen {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 1.5rem;
		background: #0f172a;
	}

	.maintenance-card {
		width: min(560px, 100%);
		padding: 2.5rem 3rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(255, 255, 255, 0.03);
		backdrop-filter: blur(6px);
		text-align: center;
	}

	.maintenance-card h1 {
		margin: 0;
		color: #f8fafc;
		font-family: var(--font-heading);
		font-weight: 850;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	.maintenance-card .subtitle {
		margin: 0.85rem 0 0;
		color: #cbd5e1;
		font-family: var(--font-body);
		font-weight: 400;
		font-size: clamp(1rem, 2.2vw, 1.125rem);
		line-height: 1.6;
	}

	.maintenance-card .details {
		margin: 0.9rem 0 0;
		color: rgba(255, 255, 255, 0.65);
		font-family: var(--font-body);
		font-weight: 400;
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.footer-company p {
		margin: 0.1rem 0;
	}
</style>

