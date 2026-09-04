<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { afterNavigate, onNavigate } from '$app/navigation';
	import {
		ANALYTICS_ENABLED,
		trackAuthCompletedFromPendingState,
		trackInternalLinkClicked,
		trackLandingPageViewOnce,
		trackSignUp,
		initializeAnalytics,
		trackReturnVisitIfNeeded,
		trackPageView,
		disableAnalytics
	} from '$lib/analytics';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { getCachedTheme, getThemeColors, THEME_STORAGE_KEY } from '$lib/theme';
	import CookieBanner from '$lib/components/CookieBanner.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import { Search } from 'lucide-svelte';
	import { DIARY_ENTRIES_CHANGED_EVENT } from '$lib/diary-events';
	import {
		ANALYTICS_CONSENT_EVENT,
		getAnalyticsConsent,
		hasAnalyticsConsent,
		cookieBannerOpen
	} from '$lib/consent';
	import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';
	import { GENERAL_SAFETY_COPY } from '$lib/safety-copy';
	import { canonicalUrl, PUBLIC_SITE_ORIGIN } from '$lib/seo';
	import { page } from '$app/state';
	import type { SupabaseClient, User } from '@supabase/supabase-js';

	const UNDER_CONSTRUCTION = false;

	type NavItem = {
		href: string;
		label: string;
		description?: string;
		external?: boolean;
	};

	type ProfilePanelData = {
		diaryEntryCount: number;
		chatSessionCount: number;
	} | null;

	const memberSinceFormatter = new Intl.DateTimeFormat('sv-SE', {
		month: 'long',
		year: 'numeric'
	});

	const primaryNavItems: NavItem[] = [
		{ href: '/dagbok', label: 'Dagbok' },
		{ href: '/chat', label: 'Chatta' },
		{ href: '/guider', label: 'Guider' },
		{ href: '/blogg', label: 'Artiklar' },
		{ href: '/anonyma-berattelser', label: 'Berättelser' },
		{ href: '/om-mittpsyke', label: 'Om MittPsyke' },
		{ href: '/om-skaparen', label: 'Om skaparen' }
	];

	const guideNavItems: NavItem[] = [
		{
			href: '/guider#besvar-och-kanslor',
			label: 'Besvär & känslor',
			description: 'Förstå vanliga besvär'
		},
		{ href: '/ovningar', label: 'Övningar', description: 'Prova lugna verktyg' }
	];

	const mobileSupplementalNavItems: NavItem[] = [
		{ href: '/ovningar', label: 'Övningar' }
	];

	const signedInPortalNavItems: NavItem[] = [
		{ href: '/', label: 'Översikt' },
		{ href: '/dashboard', label: 'Mitt Hem' },
		{ href: '/framsteg', label: 'Framsteg' },
		{ href: '/dagbok/checkin', label: 'Dagbok' },
		{ href: '/chat', label: 'Chatta' },
		{ href: '/blogg', label: 'Artiklar' },
		{ href: '/anonyma-berattelser', label: 'Berättelser' },
		{ href: '/dashboard/installningar', label: 'Inställningar' }
	];

	const mobileSignedInGeneralNavItems: NavItem[] = [
		...signedInPortalNavItems,
		{ href: '/guider', label: 'Guider' },
		{ href: '/ovningar', label: 'Övningar' },
		{ href: '/om-mittpsyke', label: 'Om MittPsyke' },
		{ href: '/om-skaparen', label: 'Om skaparen' },
		{ href: PUBLIC_CONTACT_MAILTO, label: 'Kontakt' }
	];

	const mobileGuestGeneralNavItems: NavItem[] = [
		...primaryNavItems
	];

	const guestSecondaryNavItems: NavItem[] = [
		{ href: 'https://stodlinjer.se', label: 'Akut hjälp', external: true }
	];

	function isActive(href: string): boolean {
		const path = page.url.pathname;
		const normalizedHref = href.split('#')[0].split('?')[0];

		if (normalizedHref === '/dashboard') {
			return path === '/dashboard' ||
				(path.startsWith('/dashboard/') && !path.startsWith('/dashboard/installningar'));
		}

		if (normalizedHref === '/dashboard/installningar') {
			return path === '/dashboard/installningar';
		}

		if (normalizedHref === '/framsteg') return path === '/framsteg';

		if (normalizedHref === '/dagbok/checkin') {
			return path === '/dagbok' || path.startsWith('/dagbok/') || path === '/journalforing';
		}

		return normalizedHref === '/'
			? path === '/'
			: path === normalizedHref || path.startsWith(normalizedHref + '/');
	}

	function normalizeText(value: unknown): string | null {
		if (typeof value !== 'string') return null;
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}

	const fallbackDescription =
		'Digitalt stöd för att skriva, reflektera och se mönster över tid. Skriv lokalt utan konto eller använd AI-chatten.';
	const ogDescription = $derived(page.data?.description || fallbackDescription);
	const ogImage = $derived(page.data?.ogImage ?? canonicalUrl('/og-image.png'));
	const pageCanonical = $derived(page.data?.canonical ?? canonicalUrl(page.url.pathname));

	function getProfileName(profileDisplayName: string | null, sessionUser: User | null) {
		const metadata = sessionUser?.user_metadata as Record<string, unknown> | undefined;
		return (
			profileDisplayName ??
			normalizeText(metadata?.display_name) ??
			normalizeText(metadata?.full_name) ??
			normalizeText(metadata?.name) ??
			'Du'
		);
	}

	function getMemberSinceLabel(createdAt: string | undefined) {
		if (!createdAt) return 'okänd';
		const parsed = new Date(createdAt);
		if (Number.isNaN(parsed.getTime())) return 'okänd';
		return memberSinceFormatter.format(parsed);
	}

	let { children, data } = $props();
	const organizationJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'MittPsyke',
		url: PUBLIC_SITE_ORIGIN,
		email: PUBLIC_CONTACT_EMAIL,
		description: 'Svensk plattform för självreflektion, dagbok och AI-baserat samtalsstöd.',
		logo: canonicalUrl('/logo.png'),
		founder: {
			'@type': 'Person',
			name: 'Robert Claesson'
		},
		areaServed: { '@type': 'Country', name: 'Sverige' },
		identifier: '198712284895'
	};

	const webApplicationJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'MittPsyke',
		url: PUBLIC_SITE_ORIGIN,
		description: 'Digitalt stöd för dagbok, reflektion, mönster över tid och AI-chatt på svenska',
		applicationCategory: 'HealthApplication',
		inLanguage: 'sv',
		offers: {
			'@type': 'Offer',
			price: '0'
		}
	};

	const isChat = $derived(page.url.pathname === '/chat' || page.url.pathname.startsWith('/chat/'));
	const isPrivateOrUtilityPage = $derived(
		Boolean(
			page.route.id &&
			(
				page.route.id.includes('/dashboard') ||
				page.route.id.includes('/framsteg') ||
				page.route.id.includes('/login') ||
				page.route.id.includes('/register')
			)
		)
	);
	const isProductPage = $derived(
		page.url.pathname === '/dashboard' ||
		page.url.pathname.startsWith('/dashboard/') ||
		page.url.pathname === '/framsteg'
	);

	let user = $state<User | null>(null);
	let displayName = $state<string | null>(null);
	let mobileMenuOpen = $state(false);
	let mobileSearchOpen = $state(false);
	let profilePanelOpen = $state(false);
	let analyticsEnabled = $state(false);
	let signUpTracked = $state(false);
	let lastTrackedPagePath = $state('');
	let profileRequestVersion = 0;
	let layoutSummaryRequestVersion = 0;
	let seededServerUserId = '';
	let syncedProfileUserId = '';
	let loadedLayoutSummaryUserId = '';
	let profileButtonRef = $state<HTMLButtonElement | null>(null);
	let profilePanelRef = $state<HTMLDivElement | null>(null);
	let resourcesMenuRef = $state<HTMLDetailsElement | null>(null);
	let mobileSearchInputRef = $state<HTMLInputElement | null>(null);
	let profilePanelData = $state<ProfilePanelData>(null);
	let layoutSummaryLoading = $state(false);
	let layoutSummaryError = $state<string | null>(null);
	let supabaseClientPromise: Promise<SupabaseClient> | null = null;

	const serverUser = $derived(data?.authenticatedUser ?? null);

	// Sätts först när syncUser() faktiskt kört, alltså när klienten läst
	// sessionen. Dessförinnan säger `user` bara "vet inte än", inte "utloggad".
	let clientAuthResolved = $state(false);

	// Headerns enda auth-källa. `user` är $state(null) och fylls först av en
	// $effect som kräver browser + en dynamisk import av supabase-klienten -
	// under SSR och hela hydreringen är den alltså null även för en inloggad
	// användare, och headern renderade då "Logga in"/"Registrera" för alla.
	// Serverns getUser() vet redan svaret vid SSR, så den gäller tills klienten
	// tagit över (som behövs för in- och utloggning utan omladdning).
	const currentUser = $derived(clientAuthResolved ? user : serverUser);

	const profileName = $derived(getProfileName(displayName, currentUser));
	const memberSinceLabel = $derived(getMemberSinceLabel(currentUser?.created_at));
	const diaryEntryTooltip = $derived(
		layoutSummaryLoading
			? 'Hämtar dagboksinlägg'
			: `${profilePanelData?.diaryEntryCount ?? 0} dagboksinlägg`
	);
	const shouldUseClientAuth = $derived(Boolean(serverUser || isPrivateOrUtilityPage));

	function getSupabaseClient() {
		if (!browser) return null;
		supabaseClientPromise ??= import('$lib/supabase').then(({ supabase }) => supabase);
		return supabaseClientPromise;
	}

	async function syncUser(sessionUser: User | null) {
		user = sessionUser;
		clientAuthResolved = true;
		const requestVersion = ++profileRequestVersion;

		if (!sessionUser) {
			displayName = null;
			profilePanelOpen = false;
			profilePanelData = null;
			syncedProfileUserId = '';
			loadedLayoutSummaryUserId = '';
			return;
		}

		if (loadedLayoutSummaryUserId !== sessionUser.id) {
			loadedLayoutSummaryUserId = sessionUser.id;
			void loadLayoutSummary();
		}
		trackAuthCompletedFromPendingState();
		if (syncedProfileUserId === sessionUser.id) return;
		syncedProfileUserId = sessionUser.id;

		const supabase = await getSupabaseClient();
		if (!supabase) return;

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

	async function loadLayoutSummary() {
		if (!browser) return;
		const requestVersion = ++layoutSummaryRequestVersion;
		layoutSummaryLoading = true;
		layoutSummaryError = null;

		try {
			const response = await fetch('/api/layout-summary', { cache: 'no-store' });
			if (!response.ok) throw new Error('Kunde inte hämta profilöversikt.');
			const summary = (await response.json()) as {
				profilePanel: ProfilePanelData;
			};
			if (requestVersion !== layoutSummaryRequestVersion) return;
			profilePanelData = summary.profilePanel ?? null;
		} catch (error) {
			if (requestVersion !== layoutSummaryRequestVersion) return;
			layoutSummaryError = error instanceof Error ? error.message : 'Kunde inte hämta profilöversikt.';
		} finally {
			if (requestVersion === layoutSummaryRequestVersion) layoutSummaryLoading = false;
		}
	}

	$effect(() => {
		if (!browser || !shouldUseClientAuth) return;

		let cancelled = false;
		let unsubscribe: (() => void) | undefined;

		void getSupabaseClient()?.then((supabase) => {
			if (cancelled) return;

			// Endast en av servern verifierad användare får användas för första UI-renderingen.
			if (serverUser) {
				if (seededServerUserId !== serverUser.id) {
					seededServerUserId = serverUser.id;
					void syncUser(serverUser);
				} else if (user?.id !== serverUser.id) {
					void syncUser(serverUser);
				}
			} else {
				seededServerUserId = '';
				supabase.auth.getSession().then(({ data: sessionData }) => {
					void syncUser(sessionData.session?.user ?? null);
				});
			}

			const {
				data: { subscription }
			} = supabase.auth.onAuthStateChange((_event, session) => {
				void syncUser(session?.user ?? null);
			});
			unsubscribe = () => subscription.unsubscribe();
		});

		return () => {
			cancelled = true;
			unsubscribe?.();
		};
	});

	async function logout() {
		const supabase = await getSupabaseClient();
		if (!supabase) return;
		profilePanelOpen = false;
		await supabase.auth.signOut();
		window.location.href = '/login';
	}

	function toggleProfilePanel() {
		profilePanelOpen = !profilePanelOpen;
		if (profilePanelOpen) mobileMenuOpen = false;
	}

	function closeProfilePanel() {
		profilePanelOpen = false;
	}

	function openMobileSearch() {
		mobileSearchOpen = true;
		mobileMenuOpen = false;
		profilePanelOpen = false;
	}

	function closeMobileSearch() {
		mobileSearchOpen = false;
	}

	function closeResourcesMenu() {
		if (resourcesMenuRef) resourcesMenuRef.open = false;
	}

	function pageKey(url: URL) {
		return `${url.pathname}${url.search}`;
	}

	function trackCurrentPage(url?: URL) {
		if (!url) return;

		const nextPageKey = pageKey(url);
		if (analyticsEnabled && lastTrackedPagePath !== nextPageKey) {
			trackPageView(url);
			trackLandingPageViewOnce(url);
			trackReturnVisitIfNeeded();
			lastTrackedPagePath = nextPageKey;
		}

	}

	function handleInternalLinkClick(event: MouseEvent) {
		if (!analyticsEnabled || !browser) return;

		const target = event.target;
		if (!(target instanceof Element)) return;

		const anchor = target.closest('a[href]');
		if (!(anchor instanceof HTMLAnchorElement)) return;

		const href = anchor.getAttribute('href');
		if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

		let destination: URL;
		try {
			destination = new URL(href, window.location.href);
		} catch {
			return;
		}

		if (destination.origin !== window.location.origin) return;

		trackInternalLinkClicked({
			destination: `${destination.pathname}${destination.search}${destination.hash}`
		});
	}

	function syncAnalyticsConsent() {
		if (!browser) return;

		const consentStatus = getAnalyticsConsent();
		const hasConsent = hasAnalyticsConsent();
		analyticsEnabled = ANALYTICS_ENABLED && hasConsent;

		if (!analyticsEnabled) {
			lastTrackedPagePath = '';
			disableAnalytics();
		} else {
			initializeAnalytics();
		}

		trackCurrentPage(new URL(window.location.href));
	}

	$effect(() => {
		if (!browser) return;

		syncAnalyticsConsent();

		const handleConsentChange = () => {
			syncAnalyticsConsent();
		};

		window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChange);
		document.addEventListener('click', handleInternalLinkClick);

		return () => {
			window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChange);
			document.removeEventListener('click', handleInternalLinkClick);
		};
	});

	$effect(() => {
		if (!browser || !data?.signUpCompleted || signUpTracked) return;

		signUpTracked = true;
		trackSignUp();
	});

	$effect(() => {
		if (!browser) return;

		const handleDiaryEntriesChanged = () => {
			if (user) void loadLayoutSummary();
		};

		window.addEventListener(DIARY_ENTRIES_CHANGED_EVENT, handleDiaryEntriesChanged);

		return () => {
			window.removeEventListener(DIARY_ENTRIES_CHANGED_EVENT, handleDiaryEntriesChanged);
		};
	});

	// Apply color theme globally (CSS variables on <html>)
	$effect(() => {
		if (!browser) return;

		function applyColorTheme() {
			const key = getCachedTheme();
			const colors = getThemeColors(key);
			const el = document.documentElement;
			el.style.setProperty('--primary', colors.accent);
			el.style.setProperty('--theme-accent', colors.accent);
			el.style.setProperty('--theme-bg', colors.bg);
		}

		applyColorTheme();

		const onChanged = () => applyColorTheme();
		window.addEventListener('mittpsyke:theme-changed', onChanged);
		window.addEventListener('storage', (e) => {
			if (e.key === THEME_STORAGE_KEY) applyColorTheme();
		});

		return () => {
			window.removeEventListener('mittpsyke:theme-changed', onChanged);
		};
	});

	// Låt SvelteKit återställa scroll direkt vid sidbyte och back/forward.
	onNavigate(() => {
		delete document.documentElement.dataset.smoothScroll;
	});

	afterNavigate(({ to }) => {
		document.documentElement.dataset.smoothScroll = '';
		mobileMenuOpen = false;
		mobileSearchOpen = false;
		profilePanelOpen = false;
		closeResourcesMenu();
		if (to?.url) {
			trackCurrentPage(to.url);
		}
	});

	$effect(() => {
		if (!browser) return;

		const onPointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (!resourcesMenuRef?.open || !(target instanceof Node)) return;
			if (resourcesMenuRef.contains(target)) return;
			closeResourcesMenu();
		};

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') closeResourcesMenu();
		};

		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);

		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	});

	$effect(() => {
		if (!browser || !profilePanelOpen) return;

		const onPointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (profilePanelRef?.contains(target) || profileButtonRef?.contains(target)) return;
			profilePanelOpen = false;
		};

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') profilePanelOpen = false;
		};

		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);

		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	});

	$effect(() => {
		if (!browser || !mobileSearchOpen) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		const focusFrame = requestAnimationFrame(() => mobileSearchInputRef?.focus());
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') closeMobileSearch();
		};

		document.addEventListener('keydown', onKeyDown);

		return () => {
			cancelAnimationFrame(focusFrame);
			document.body.style.overflow = previousOverflow;
			document.removeEventListener('keydown', onKeyDown);
		};
	});

</script>

<svelte:head>
    <meta name="seobility" content="071531d0f6c0c987d277990fe526c5d4" />
	{#if UNDER_CONSTRUCTION}
		<title>MittPsyke - Under konstruktion</title>
		<meta
			name="description"
			content="MittPsyke är tillfälligt under konstruktion medan vi arbetar med förbättringar."
		/>
	{:else}
		<title>{page.data?.title ? `${page.data.title} | MittPsyke` : 'Psykiskt stöd online | Verktyg mot ångest | MittPsyke'}</title>

		<meta
			name="description"
			content={ogDescription}
		/>

		{#if isPrivateOrUtilityPage || page.data?.noindex}
			<meta name="robots" content="noindex, nofollow" />
		{/if}
		<meta name="author" content="MittPsyke" />

		<meta property="og:title" content={page.data?.title ? `${page.data.title} | MittPsyke` : 'MittPsyke – Psykiskt stöd online'} />
		<meta
			property="og:description"
			content={ogDescription}
		/>
		<meta property="og:type" content={page.data?.ogType ?? 'website'} />
		<meta property="og:site_name" content="MittPsyke" />

		<meta property="og:url" content={pageCanonical} />
		<meta property="og:image" content={ogImage} />

		<link rel="alternate" hreflang="sv" href={pageCanonical} />

		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={page.data?.title ? `${page.data.title} | MittPsyke` : 'MittPsyke – Psykiskt stöd online'} />
		<meta
			name="twitter:description"
			content={ogDescription}
		/>
		<meta name="twitter:image" content={ogImage} />
		{@html `<script type="application/ld+json">${JSON.stringify(organizationJsonLd)}<\/script>`}
		{@html `<script type="application/ld+json">${JSON.stringify(webApplicationJsonLd)}<\/script>`}
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
	<a href="#main-content" class="skip-link">Hoppa till innehåll</a>
		<header
			class="site-header sticky top-0 z-30 bg-[hsl(var(--background)/0.94)] supports-[backdrop-filter]:backdrop-blur"
			class:chat-header={isChat}
		>
		<div class="site-header-inner flex items-center justify-between gap-2 px-5 py-3.5 md:gap-3">
			<div class="flex min-w-0 flex-1 items-center gap-2 md:gap-4 lg:gap-0 lg:flex-none">
				<a
					href="/"
					class="brand-link min-w-0 self-center opacity-95 hover:opacity-100 transition-opacity"
					aria-label="MittPsyke startsida"
					data-sveltekit-reload
				>
					<span class="brand-wordmark">MittPsyke</span>
				</a>
				<nav class="product-nav hidden lg:flex items-center gap-3" aria-label={currentUser ? 'Din navigation' : 'Navigering'}>
					{#each (currentUser ? signedInPortalNavItems : primaryNavItems) as item}
						{#if item.href === '/guider'}
							<details bind:this={resourcesMenuRef} class="resources-dropdown">
								<summary class="text-sm transition-opacity {isActive(item.href) || guideNavItems.some((guideItem) => isActive(guideItem.href)) ? 'opacity-100 underline' : 'opacity-80 hover:opacity-100 hover:underline'}">{item.label}</summary>
								<div class="resources-dropdown-menu">
									{#each guideNavItems as guideItem}
										<a href={guideItem.href} class="resources-dropdown-link" onclick={closeResourcesMenu} aria-current={isActive(guideItem.href) ? 'page' : undefined}>
											<span class="resources-dropdown-label">{guideItem.label}</span>
											<span class="resources-dropdown-description">{guideItem.description}</span>
										</a>
									{/each}
								</div>
							</details>
						{:else}
							<a
								href={item.href}
								class="text-sm transition-opacity {isActive(item.href) ? 'opacity-100 underline' : 'opacity-80 hover:opacity-100 hover:underline'}"
								target={item.external ? '_blank' : undefined}
								rel={item.external ? 'noopener noreferrer' : undefined}
								aria-current={isActive(item.href) ? 'page' : undefined}
							>
								{item.label}
							</a>
						{/if}
					{/each}
				</nav>
			</div>

			<div class="flex shrink-0 items-center gap-1 md:gap-3">
				<nav class="mobile-quick-nav" class:mobile-quick-nav-signed={Boolean(currentUser)} aria-label="Snabbnavigering">
					{#each (currentUser ? signedInPortalNavItems.slice(0, 1) : primaryNavItems.slice(0, 3)) as item}
						<a
							href={item.href}
							class="mobile-quick-link"
							class:mobile-quick-link-articles={item.href === '/blogg'}
							class:mobile-quick-link-chat={item.href === '/chat'}
							onclick={() => {
								mobileMenuOpen = false;
								profilePanelOpen = false;
							}}
							aria-current={isActive(item.href) ? 'page' : undefined}
						>
							{item.label}
						</a>
					{/each}
				</nav>
				<a
					href="/sok"
					class="search-nav-link hidden lg:inline-flex text-sm transition-opacity {isActive('/sok') ? 'opacity-100 underline' : 'opacity-85 hover:opacity-100 hover:underline'}"
					aria-label="Sök på MittPsyke"
					aria-current={isActive('/sok') ? 'page' : undefined}
				>
					<Search size={16} aria-hidden="true" />
				</a>
				{#if !currentUser}
					<div class="hidden lg:flex items-center gap-3">
						<a href={PUBLIC_CONTACT_MAILTO} class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity">Kontakt</a>
						<a href="/login" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">Logga in</a>
						<a href="/register" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">Registrera</a>
					</div>
				{/if}

					{#if currentUser}
						<div class="relative">
							<div class="profile-trigger">
								<button
									type="button"
									bind:this={profileButtonRef}
									class="profile-avatar-link"
									aria-label="Öppna profilmeny"
									aria-haspopup="dialog"
									aria-expanded={profilePanelOpen}
									aria-controls="header-profile-panel"
									aria-describedby="diary-count-tooltip"
									onclick={toggleProfilePanel}
								>
									<UserAvatar
										name={profileName}
										seed={currentUser?.id ?? profileName}
										size="md"
										label={`${profileName} profilbild`}
										decorative
									/>
									<span id="diary-count-tooltip" class="profile-avatar-tooltip" role="tooltip">
										{diaryEntryTooltip}
									</span>
								</button>
							</div>

							{#if profilePanelOpen}
								<div
									id="header-profile-panel"
									bind:this={profilePanelRef}
									role="dialog"
									aria-label="Din profil"
									class="profile-panel"
								>
									<div class="profile-panel-header">
										<UserAvatar
											name={profileName}
											seed={currentUser?.id ?? profileName}
											size="lg"
											label={`${profileName} profilbild`}
											decorative
										/>
										<div class="min-w-0">
											<p class="text-sm font-medium leading-tight">{profileName}</p>
											<p class="text-xs opacity-65">Medlem sedan {memberSinceLabel}</p>
										</div>
									</div>

									<div class="profile-panel-stats" aria-label="Din statistik">
										<p class="profile-panel-stat">
											<span>Dagboksinlägg</span>
											<strong>{layoutSummaryLoading ? '...' : (profilePanelData?.diaryEntryCount ?? 0)}</strong>
										</p>
										<p class="profile-panel-stat">
											<span>Chattsessioner</span>
											<strong>{layoutSummaryLoading ? '...' : (profilePanelData?.chatSessionCount ?? 0)}</strong>
										</p>
									</div>
									{#if layoutSummaryError}
										<p class="profile-panel-error">{layoutSummaryError}</p>
									{/if}

									<div class="profile-panel-links" aria-label="Snabbval">
										<a href="/dagbok/checkin" class="profile-panel-link" onclick={closeProfilePanel}>Fortsätt i dagboken</a>
										<a href="/chat" class="profile-panel-link" onclick={closeProfilePanel}>Starta chat</a>
										<a href="/dashboard/installningar" class="profile-panel-link" onclick={closeProfilePanel}>Inställningar</a>
										<button type="button" class="profile-panel-link" onclick={logout}>Logga ut</button>
									</div>
								</div>
							{/if}
						</div>
					{/if}

					<div class="hidden md:block">
						<ThemeToggle />
					</div>

				<button
					type="button"
					class="mobile-menu-button lg:hidden inline-flex items-center justify-center rounded-md px-2.5 py-2 text-sm opacity-80 hover:opacity-100 transition-opacity"
					aria-label="Öppna meny"
					aria-expanded={mobileMenuOpen}
					aria-controls="mobile-menu"
						onclick={() => {
							profilePanelOpen = false;
							mobileMenuOpen = !mobileMenuOpen;
						}}
				>
					<span class="mobile-menu-icon" aria-hidden="true">&#9776;</span>
				</button>
			</div>
		</div>

		{#if mobileSearchOpen}
			<div
				class="mobile-search-overlay"
				role="dialog"
				aria-modal="true"
				aria-label="Sök"
				tabindex="-1"
				onclick={(event) => {
					if (event.target === event.currentTarget) closeMobileSearch();
				}}
				onkeydown={(event) => {
					if (event.key === 'Escape') closeMobileSearch();
				}}
			>
				<form class="mobile-search-panel" action="/sok" method="GET">
					<input
						bind:this={mobileSearchInputRef}
						class="mobile-search-input"
						type="search"
						name="q"
						autocomplete="off"
						placeholder="Sök guider, artiklar..."
						aria-label="Sök guider och artiklar"
					/>
					<button type="button" class="mobile-search-close" aria-label="Stäng sök" onclick={closeMobileSearch}>
						×
					</button>
				</form>
			</div>
		{/if}

		{#if mobileMenuOpen}
			<div id="mobile-menu" class="mobile-menu-panel lg:hidden px-5 py-3" role="navigation" aria-label="Mobilmeny">
				{#each (currentUser ? mobileSignedInGeneralNavItems : mobileGuestGeneralNavItems) as item}
					<a
						href={item.href}
						class="mobile-menu-link text-sm transition-opacity {isActive(item.href) ? 'opacity-100 underline' : 'opacity-80 hover:opacity-100 hover:underline'}"
						onclick={() => (mobileMenuOpen = false)}
						aria-current={isActive(item.href) ? 'page' : undefined}
					>
						{item.label}
					</a>
				{/each}
				<a href="/sok" class="mobile-menu-link mobile-menu-search-link text-sm transition-opacity {isActive('/sok') ? 'opacity-100 underline' : 'opacity-80 hover:opacity-100 hover:underline'}" onclick={() => (mobileMenuOpen = false)} aria-label="Sök på MittPsyke" aria-current={isActive('/sok') ? 'page' : undefined}>
					<Search size={16} aria-hidden="true" />
					<span>Sök</span>
				</a>
				{#if !currentUser}
					{#each mobileSupplementalNavItems as item}
						<a href={item.href} class="mobile-menu-link mobile-menu-sub-link text-sm transition-opacity {isActive(item.href) ? 'opacity-100 underline' : 'opacity-80 hover:opacity-100 hover:underline'}" onclick={() => (mobileMenuOpen = false)} aria-current={isActive(item.href) ? 'page' : undefined}>{item.label}</a>
					{/each}
				{/if}
				{#if currentUser}
					<p class="mobile-menu-greeting text-sm opacity-60">{displayName ? `Välkommen, ${displayName}` : 'Välkommen tillbaka'}</p>
					<button
						onclick={() => { mobileMenuOpen = false; logout(); }}
						class="mobile-menu-link text-sm opacity-70 hover:opacity-100 hover:underline transition-opacity"
					>Logga ut</button>
				{:else}
					{#each guestSecondaryNavItems as item}
						<a
							href={item.href}
							class="mobile-menu-link text-sm transition-opacity {isActive(item.href) ? 'opacity-100 underline' : 'opacity-80 hover:opacity-100 hover:underline'}"
							target={item.external ? '_blank' : undefined}
							rel={item.external ? 'noopener noreferrer' : undefined}
							onclick={() => (mobileMenuOpen = false)}
							aria-current={isActive(item.href) ? 'page' : undefined}
						>
							{item.label}
						</a>
					{/each}
					<a href={PUBLIC_CONTACT_MAILTO} class="mobile-menu-link text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity" onclick={() => (mobileMenuOpen = false)}>Kontakt</a>
					<a href="/login" class="mobile-menu-link text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity" onclick={() => (mobileMenuOpen = false)}>Logga in</a>
					<a href="/register" class="mobile-menu-link text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity" onclick={() => (mobileMenuOpen = false)}>Registrera</a>
				{/if}
				<div class="mobile-menu-theme md:hidden">
					<ThemeToggle />
				</div>
				<p class="mobile-menu-help pt-1 text-xs opacity-60">Vid akut fara: ring 112</p>
			</div>
		{/if}
		</header>

	<div class="app-shell" class:is-chat-page={isChat}>
		<main id="main-content" class={isProductPage ? 'app-shell-main' : 'mt-6'} class:chat-main={isChat}>
			{@render children()}
		</main>

		{#if !isProductPage && !isChat}
			<section class="site-disclaimer mt-6 px-5">
				<p class="mx-auto max-w-4xl text-center text-xs sm:text-sm opacity-70 leading-relaxed">
					{GENERAL_SAFETY_COPY} Vid akut fara ring 112 &middot; Vårdråd 1177.
				</p>
			</section>

	<footer class="site-footer mt-12">
		<div class="footer-inner">
			<div class="footer-grid">
				<!-- Kolumn 1: Tjänsten -->
				<div class="footer-col">
					<p class="footer-col-heading">Tjänsten</p>
					<a href="/chat" class="footer-link">Chatta anonymt</a>
					<a href="/dagbok" class="footer-link">Dagbok</a>
					<a href="/ovningar" class="footer-link">Övningar</a>
					<a href="/guider" class="footer-link">Guider</a>
					<a href="/blogg" class="footer-link">Artiklar</a>
					<a href="/anonyma-berattelser" class="footer-link">Berättelser</a>
					<a href="/humorsparning" class="footer-link">Humörspårning</a>
					<a href="/premium" class="footer-link">Premium</a>
				</div>

				<!-- Kolumn 2: Om MittPsyke -->
				<div class="footer-col">
					<p class="footer-col-heading">Om MittPsyke</p>
					<a href="/om-mittpsyke" class="footer-link">Om tjänsten</a>
					<a href="/om-skaparen" class="footer-link">Om skaparen</a>
					<a href="/sa-fungerar-mittpsyke" class="footer-link">Så fungerar det</a>
					<a href="/redaktionell-metod" class="footer-link">Redaktionell metod</a>
					<a href="/ansvarsfull-ai" class="footer-link">Ansvarsfull AI</a>
					<a href="/ansvar" class="footer-link">Ansvar</a>
					<a href="/feedback" class="footer-link">Feedback</a>
					<a href="/kontakt-och-villkor" class="footer-link">Kontakt och villkor</a>
				</div>

				<!-- Kolumn 3: Juridiskt & säkerhet -->
				<div class="footer-col">
					<p class="footer-col-heading">Integritet & tillgänglighet</p>
					<a href="/integritet" class="footer-link">Integritetspolicy</a>
					<a href="/cookies-och-leverantorer" class="footer-link">Cookies och leverantörer</a>
					<a href="/tillganglighet" class="footer-link">Tillgänglighet</a>
					<button onclick={() => cookieBannerOpen.set(true)} class="footer-link footer-link-btn">Cookieinställningar</button>
					<a href="/sok" class="footer-link">Sök</a>
				</div>

				<!-- Kolumn 4: Akut hjälp + info -->
				<div class="footer-col">
					<p class="footer-col-heading footer-col-heading--emergency">Vid akut läge</p>
					<a href="tel:112" class="footer-link footer-emergency-link">Ring 112</a>
					<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer" class="footer-link">Vårdråd 1177</a>
					<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="footer-link footer-emergency-link">Stödlinjer.se</a>
					<div class="footer-company">
						<p>© {new Date().getFullYear()} MittPsyke</p>
						<p>Enskild näringsverksamhet</p>
						<p>
							<a href="/kontakt-och-villkor" class="footer-link">Org.nr och kontaktuppgifter</a>
						</p>
						<p><a href={PUBLIC_CONTACT_MAILTO} class="footer-link">{PUBLIC_CONTACT_EMAIL}</a></p>
					</div>
				</div>
			</div>

			<p class="footer-disclaimer">
				{GENERAL_SAFETY_COPY} Vid akut fara ring 112 · Vårdråd 1177.
			</p>
		</div>
	</footer>
		{/if}
	</div>

	{#if !isProductPage}
		<CookieBanner />
	{/if}
{/if}

<style>
	:global(#main-content.chat-main) {
		margin-top: 0 !important;
	}

	.site-header {
		top: 0;
		z-index: 60;
		padding-top: env(safe-area-inset-top, 0px);
	}

	.maintenance-screen {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 1.5rem;
		background: var(--layout-maintenance-bg);
	}

	.maintenance-card {
		width: min(560px, 100%);
		padding: 2.5rem 3rem;
		border-radius: var(--radius-card);
		border: 1px solid var(--layout-maintenance-border);
		background: var(--layout-maintenance-surface);
		backdrop-filter: blur(6px);
		text-align: center;
	}

	.maintenance-card h1 {
		margin: 0;
		color: var(--layout-maintenance-text);
		font-family: var(--font-heading);
		font-weight: 850;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	.maintenance-card .subtitle {
		margin: 0.85rem 0 0;
		color: var(--layout-maintenance-muted);
		font-family: var(--font-body);
		font-weight: 400;
		font-size: clamp(1rem, 2.2vw, 1.125rem);
		line-height: 1.6;
	}

	.maintenance-card .details {
		margin: 0.9rem 0 0;
		color: var(--layout-maintenance-subtle);
		font-family: var(--font-body);
		font-weight: 400;
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.footer-company p {
		margin: 0.1rem 0;
	}

	.site-footer {
		border-top: 1px solid var(--layout-footer-border);
		padding: 2.5rem 1.25rem 2rem;
	}

	.footer-inner {
		max-width: 1080px;
		margin: 0 auto;
	}

	.footer-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 2rem 1.5rem;
	}

	@media (min-width: 680px) {
		.footer-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	.footer-col {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		min-width: 0;
	}

	.footer-col-heading {
		margin: 0 0 0.35rem;
		font-family: var(--font-heading);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		opacity: 0.5;
	}

	.footer-col-heading--emergency {
		color: var(--layout-footer-emergency);
		opacity: 0.75;
	}

	:global(.dark) .footer-col-heading--emergency {
		color: var(--layout-footer-emergency-dark);
	}

	.footer-link {
		display: block;
		font-size: 0.84rem;
		line-height: 1.5;
		opacity: 0.65;
		text-decoration: none;
		color: inherit;
		overflow-wrap: break-word;
		transition: opacity 0.15s ease;
	}

	.footer-link:hover {
		opacity: 1;
	}

	.footer-link-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
		font: inherit;
	}

	.footer-company {
		margin-top: 1rem;
		font-size: 0.78rem;
		opacity: 0.5;
		line-height: 1.7;
	}

	.footer-company a {
		text-decoration: none;
		color: inherit;
	}

	.footer-company a:hover {
		opacity: 1;
		text-decoration: underline;
	}

	.footer-disclaimer {
		margin: 2rem 0 0;
		padding-top: 1.25rem;
		border-top: 1px solid var(--layout-footer-border);
		text-align: center;
		font-size: 0.78rem;
		opacity: 0.45;
	}

	.footer-emergency-link {
		color: var(--layout-footer-emergency);
	}

	:global(.dark) .footer-emergency-link {
		color: var(--layout-footer-emergency-dark);
	}

	.skip-link {
		position: absolute;
		left: 1rem;
		top: -3rem;
		z-index: 60;
		padding: 0.65rem 0.9rem;
		border-radius: 12px;
		background: var(--layout-skip-bg);
		color: var(--layout-skip-text);
		border: 1px solid var(--layout-border-soft);
	}

	.skip-link:focus-visible {
		top: 1rem;
	}

	.resources-dropdown {
		position: relative;
	}

	.search-nav-link {
		align-items: center;
		gap: 0.35rem;
	}

	.resources-dropdown summary {
		list-style: none;
		cursor: pointer;
	}

	.resources-dropdown summary::-webkit-details-marker {
		display: none;
	}

	.resources-dropdown summary::after {
		content: '▾';
		font-size: 0.72rem;
	}

	.resources-dropdown-menu {
		position: absolute;
		left: 0;
		top: calc(100% + 0.5rem);
		z-index: 45;
		min-width: 15rem;
		padding: 0.4rem;
		border: 1px solid var(--layout-menu-border);
		border-radius: 12px;
		background: var(--layout-menu-bg);
		box-shadow: 0 14px 30px var(--layout-menu-shadow);
		backdrop-filter: blur(10px);
	}

	:global(.dark) .resources-dropdown-menu {
		border-color: var(--layout-menu-dark-border);
		background: var(--layout-menu-dark-bg);
		box-shadow: 0 16px 34px var(--layout-menu-dark-shadow);
	}

	.resources-dropdown-link {
		display: grid;
		gap: 0.08rem;
		padding: 0.58rem 0.65rem;
		border-radius: 10px;
		font-size: 0.86rem;
		line-height: 1.25;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.resources-dropdown-label {
		font-weight: 650;
	}

	.resources-dropdown-description {
		color: hsl(var(--muted-foreground));
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 400;
		line-height: 1.25;
	}

	.resources-dropdown-link:hover,
	.resources-dropdown-link:focus-visible {
		background: var(--layout-menu-hover);
	}

	:global(.dark) .resources-dropdown-link:hover,
	:global(.dark) .resources-dropdown-link:focus-visible {
		background: var(--layout-menu-dark-hover);
	}

	.mobile-search-overlay {
		position: fixed;
		inset: 0;
		z-index: 70;
		padding: 0.85rem;
		background: hsl(var(--background) / 0.98);
		overscroll-behavior: contain;
	}

	.mobile-search-panel {
		display: flex;
		gap: 0.6rem;
		width: 100%;
	}

	.mobile-search-input {
		min-height: 2.75rem;
		min-width: 0;
		flex: 1;
		border: 1px solid hsl(var(--border));
		border-radius: 999px;
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		padding: 0.7rem 0.95rem;
		font: inherit;
	}

	.mobile-search-close {
		min-height: 2.75rem;
		min-width: 2.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 999px;
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		font-weight: 700;
	}

	@media (max-width: 767px) {
		.chat-main {
			margin-top: 0 !important;
		}

		.chat-header .site-header-inner {
			height: 3.5rem;
			padding-block: 0.3rem;
		}

		.chat-header .brand-link {
			min-height: 2rem;
		}

		:global(.site-header button[aria-label="Växla tema"]) {
			min-width: 2rem;
			min-height: 2rem;
			padding: 0.35rem;
		}
	}

	.mobile-menu-panel {
		max-height: calc(100vh - 5.5rem);
		overflow-y: auto;
		overscroll-behavior: contain;
		-webkit-overflow-scrolling: touch;
		border-top: 1px solid var(--layout-footer-border);
	}

	.mobile-menu-link {
		display: block;
		width: 100%;
		margin: 0;
		padding: 0.38rem 0;
		line-height: 1.35;
		text-align: left;
		background: transparent;
		border: 0;
	}

	.mobile-menu-sub-link {
		padding-left: 0.9rem;
		opacity: 0.78;
	}

	.mobile-menu-search-link {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}

		.mobile-menu-link + .mobile-menu-link {
			margin-top: 0.08rem;
		}


	.mobile-menu-help {
		margin: 0.5rem 0 0;
	}

	.mobile-menu-icon {
		display: block;
		font-size: 1.6rem;
		line-height: 1;
	}

	.mobile-menu-button {
		border: 1px solid var(--layout-border-soft);
	}

	.mobile-quick-nav {
		display: none;
		align-items: center;
		gap: 0.18rem;
	}

	.mobile-quick-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding: 0 0.48rem;
		border-radius: 999px;
		color: hsl(var(--foreground) / 0.82);
		font-family: var(--font-heading);
		font-size: 0.78rem;
		font-weight: 560;
		line-height: 1;
		text-decoration: none;
		white-space: nowrap;
		transition: background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
	}

	.mobile-quick-link:hover,
	.mobile-quick-link:focus-visible,
	.mobile-quick-link[aria-current='page'] {
		background: var(--layout-menu-hover);
		color: hsl(var(--foreground) / 0.96);
	}

	.mobile-quick-link-chat {
		flex-shrink: 0;
		font-weight: 650;
	}

	.mobile-quick-link-articles {
		min-width: 0;
		flex-shrink: 1;
		font-size: 0.74rem;
		opacity: 0.86;
	}

	:global(.dark) .mobile-quick-link:hover,
	:global(.dark) .mobile-quick-link:focus-visible,
	:global(.dark) .mobile-quick-link[aria-current='page'] {
		background: var(--layout-menu-dark-hover);
	}

	:global(.dark) .mobile-menu-button,
	:global(.dark) .mobile-menu-panel {
		border-color: var(--layout-menu-dark-border);
	}

	.mobile-menu-theme {
		margin-top: 0.45rem;
	}

	.brand-link {
		display: flex;
		align-items: center;
		min-height: 2.75rem;
		padding: 0.125rem 0;
		line-height: 1;
	}

	.brand-wordmark {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		font-family: var(--font-heading);
		font-size: clamp(1.32rem, 1.16rem + 0.42vw, 1.52rem);
		font-weight: 760;
		letter-spacing: -0.04em;
		line-height: 1;
		white-space: nowrap;
	}

	@media (min-width: 1024px) {
		.product-nav {
			margin-left: clamp(1.75rem, 3vw, 3.5rem);
			flex-shrink: 0;
			white-space: nowrap;
		}
	}

	.profile-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}

	.profile-avatar-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		border: 1px solid var(--layout-border-soft);
		background: var(--layout-avatar-bg);
		transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
		color: inherit;
		text-decoration: none;
	}

	.profile-avatar-link {
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		position: relative;
	}

	.profile-avatar-tooltip {
		position: absolute;
		right: 50%;
		top: calc(100% + 0.5rem);
		z-index: 50;
		width: max-content;
		max-width: 12rem;
		padding: 0.35rem 0.5rem;
		border-radius: 0.55rem;
		background: hsl(var(--foreground));
		color: hsl(var(--background));
		font-size: 0.72rem;
		line-height: 1.2;
		opacity: 0;
		pointer-events: none;
		transform: translate(50%, -0.15rem);
		transition: opacity 0.15s ease, transform 0.15s ease;
		white-space: nowrap;
	}

	.profile-avatar-link:hover .profile-avatar-tooltip,
	.profile-avatar-link:focus-visible .profile-avatar-tooltip {
		opacity: 1;
		transform: translate(50%, 0);
	}

	:global(.dark) .profile-avatar-link {
		border-color: var(--layout-avatar-dark-border);
		background: var(--layout-avatar-dark-bg);
	}

	.profile-avatar-link:hover {
		opacity: 1;
		border-color: var(--layout-avatar-hover-border);
		background: var(--layout-avatar-hover-bg);
	}

	:global(.dark) .profile-avatar-link:hover {
		border-color: var(--layout-avatar-dark-hover-border);
		background: var(--layout-avatar-dark-hover-bg);
	}

	.profile-avatar-link:focus-visible {
		outline: 2px solid hsl(var(--primary));
		outline-offset: 2px;
	}

	.profile-panel {
		position: absolute;
		right: 0;
		top: calc(100% + 0.55rem);
		z-index: 40;
		width: min(88vw, 19rem);
		padding: 0.75rem;
		border-radius: 0.95rem;
		border: 1px solid var(--layout-panel-border);
		background: hsl(var(--background));
		box-shadow: 0 10px 28px var(--layout-panel-shadow);
	}

	:global(.dark) .profile-panel {
		border-color: var(--layout-panel-dark-border);
		box-shadow: 0 12px 30px var(--layout-panel-dark-shadow);
	}

	.profile-panel-header {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		margin-bottom: 0.6rem;
	}

	.profile-panel-stats {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.45rem;
		margin-bottom: 0.65rem;
	}

	.profile-panel-stat {
		margin: 0;
		padding: 0.48rem 0.55rem;
		border-radius: 0.72rem;
		background: var(--layout-panel-stat-bg);
		display: grid;
		gap: 0.12rem;
	}

	.profile-panel-stat span {
		font-size: 0.72rem;
		opacity: 0.72;
		line-height: 1.25;
	}

	.profile-panel-stat strong {
		font-size: 1rem;
		font-weight: 620;
		line-height: 1.15;
	}

	.profile-panel-links {
		display: grid;
		gap: 0.38rem;
	}

	.profile-panel-error {
		margin: -0.25rem 0 0.55rem;
		font-size: 0.73rem;
		line-height: 1.35;
		color: hsl(var(--muted-foreground));
	}

	.profile-panel-link {
		display: block;
		width: 100%;
		padding: 0.45rem 0.55rem;
		border: 0;
		border-radius: 0.68rem;
		font-size: 0.84rem;
		line-height: 1.35;
		text-align: left;
		text-decoration: none;
		color: inherit;
		background: var(--layout-panel-link-bg);
		transition: background-color 0.15s ease;
		cursor: pointer;
	}

	.profile-panel-link:hover,
	.profile-panel-link:focus-visible {
		background: var(--layout-panel-link-hover);
		outline: none;
	}

	@media (max-width: 767px) {
		.site-header-inner {
			padding: 0.48rem 0.75rem;
			gap: 0.55rem;
		}

		:global(#main-content) {
			margin-top: 0.75rem !important;
		}

		:global(#main-content.chat-main) {
			margin-top: 0 !important;
		}

		.mobile-quick-nav {
			display: inline-flex;
		}

		:global(.site-disclaimer) {
			margin-top: 1.5rem !important;
		}

		:global(.site-footer) {
			margin-top: 1.75rem !important;
			padding-block: 0.9rem !important;
		}

		.brand-link {
			min-height: 2.2rem;
		}

		.brand-wordmark {
			font-size: 1.22rem;
		}

		.mobile-quick-nav {
			display: inline-flex;
		}

		.profile-avatar-link {
			width: 2.5rem;
			height: 2.5rem;
		}

		:global(.site-header .lg\:hidden) {
			padding: 0.4rem 0.55rem;
		}

		.mobile-menu-panel {
			max-height: calc(100svh - 3.4rem);
			padding: 0.65rem 0.75rem !important;
		}

		.mobile-menu-greeting,
		.mobile-menu-help {
			display: none;
		}

		.mobile-menu-link {
			padding: 0.42rem 0;
		}

		.mobile-menu-button .mobile-menu-icon {
			font-size: 1.85rem;
			line-height: 1;
			display: block;
		}

		.profile-panel {
			position: fixed;
			left: 0.75rem;
			right: 0.75rem;
			top: 3.6rem;
			width: auto;
			max-width: none;
		}

		.profile-panel-stats {
			grid-template-columns: minmax(0, 1fr);
		}

		:global(.site-footer) {
			padding: 1.75rem 1rem 1.5rem !important;
		}
	}

	@media (max-width: 640px) {
		.mobile-quick-nav {
			display: none;
		}

		.mobile-quick-nav-signed {
			display: inline-flex;
		}

		.site-header-inner {
			padding: 0.4rem 0.65rem;
			gap: 0.4rem;
		}

		.brand-wordmark {
			font-size: 1.18rem;
		}
	}

	@media (max-width: 370px) {
		.site-header-inner {
			padding-inline: 0.55rem;
			gap: 0.35rem;
		}

		.brand-wordmark {
			font-size: 1.05rem;
		}
	}

</style>
