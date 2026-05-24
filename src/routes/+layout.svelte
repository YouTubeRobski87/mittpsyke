<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';
	import {
		ANALYTICS_ENABLED,
		initializeAnalytics,
		trackPageView,
		disableAnalytics
	} from '$lib/analytics';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { getCachedTheme, getThemeColors, THEME_STORAGE_KEY } from '$lib/theme';
	import CookieBanner from '$lib/components/CookieBanner.svelte';
	import { Search } from 'lucide-svelte';
	import {
		ANALYTICS_CONSENT_EVENT,
		getAnalyticsConsent,
		hasAnalyticsConsent,
		cookieBannerOpen
	} from '$lib/consent';
	import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';
	import { resolveAvatarPresetUrl } from '$lib/avatar';
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

	const desktopPrimaryNavItems: NavItem[] = [
		{ href: '/chat', label: 'Chatta' },
		{ href: '/blogg', label: 'Artiklar' },
		{ href: '/guider', label: 'Guider' },
		{ href: '/anonyma-berattelser', label: 'Forum' },
		{ href: '/om-mittpsyke', label: 'Om MittPsyke' }
	];

	const guideNavItems: NavItem[] = [
		{
			href: '/guider#besvar-och-kanslor',
			label: 'Besvär & känslor',
			description: 'Förstå vanliga besvär'
		},
		{ href: '/ovningar', label: 'Övningar', description: 'Prova lugna verktyg' }
	];

	const mobilePrimaryNavItems: NavItem[] = [
		{ href: '/blogg', label: 'Artiklar' },
		{ href: '/chat', label: 'Chatta' },
		{ href: '/guider', label: 'Guider' },
		{ href: '/anonyma-berattelser', label: 'Forum' },
		{ href: '/om-mittpsyke', label: 'Om MittPsyke' }
	];

	const mobileSupplementalNavItems: NavItem[] = [
		{ href: '/ovningar', label: 'Övningar' }
	];

	const signedInPortalNavItems: NavItem[] = [
		{ href: '/framsteg', label: 'Framsteg' },
		{ href: '/notiser', label: 'Notiser' },
		{ href: '/dashboard/installningar', label: 'Inställningar' }
	];

	const guestSecondaryNavItems: NavItem[] = [
		{ href: 'https://stodlinjer.se', label: 'Akut hjälp', external: true }
	];

	function isActive(href: string): boolean {
		const path = page.url.pathname;
		const normalizedHref = href.split('#')[0].split('?')[0];
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
		'AI-baserat samtalsstöd för reflektion och stöd i vardagen. Börja utan konto eller skapa en egen plats över tid.';
	const ogDescription = $derived(page.data?.description || fallbackDescription);

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

	function getAvatarImageUrl(sessionUser: User | null) {
		if (!sessionUser) return null;
		const metadata = sessionUser.user_metadata as Record<string, unknown> | undefined;
		const presetAvatar = resolveAvatarPresetUrl(metadata?.avatar_key);
		const identityCandidates =
			Array.isArray((sessionUser as unknown as { identities?: unknown[] }).identities)
				? ((sessionUser as unknown as { identities?: unknown[] }).identities ?? []).flatMap((identity) => {
						const identityRecord =
							identity && typeof identity === 'object'
								? (identity as Record<string, unknown>)
								: undefined;
						const identityData =
							identityRecord?.identity_data &&
							typeof identityRecord.identity_data === 'object'
								? (identityRecord.identity_data as Record<string, unknown>)
								: undefined;

						return [
							normalizeText(identityData?.avatar_url),
							normalizeText(identityData?.picture),
							normalizeText(identityData?.profile_image_url),
							normalizeText(identityData?.photoURL)
						];
					})
				: [];

		const candidates = [
			presetAvatar,
			normalizeText(metadata?.avatar_url),
			normalizeText(metadata?.picture),
			normalizeText(metadata?.profile_image_url),
			normalizeText(metadata?.photoURL),
			...identityCandidates
		];
		const candidate = candidates.find((value) =>
			Boolean(value && (/^https?:\/\//i.test(value) || value.startsWith('/')))
		);
		return candidate ?? null;
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
		url: 'https://www.mittpsyke.se',
		email: PUBLIC_CONTACT_EMAIL,
		description: 'Svensk plattform för AI-baserat samtalsstöd och mental hälsa.',
		logo: {
			'@type': 'ImageObject',
			url: 'https://www.mittpsyke.se/apple-touch-icon.png'
		},
		founder: {
			'@type': 'Person',
			name: 'Robert Claesson'
		},
		areaServed: { '@type': 'Country', name: 'Sverige' },
		inLanguage: 'sv',
		identifier: '198712284895'
	};

	const webApplicationJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'MittPsyke',
		url: 'https://www.mittpsyke.se',
		description: 'AI-driven dagbok för mental hälsa på svenska',
		applicationCategory: 'HealthApplication',
		inLanguage: 'sv',
		offers: {
			'@type': 'Offer',
			price: '0'
		}
	};

	const isChat = $derived(Boolean(page.route.id?.includes('/chat/')));
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

	let user = $state<User | null>(null);
	let displayName = $state<string | null>(null);
	let mobileMenuOpen = $state(false);
	let mobileSearchOpen = $state(false);
	let profilePanelOpen = $state(false);
	let analyticsEnabled = $state(false);
	let lastTrackedPagePath = $state('');
	let profileRequestVersion = 0;
	let layoutSummaryRequestVersion = 0;
	let seededSessionAccessToken = '';
	let syncedProfileUserId = '';
	let loadedLayoutSummaryUserId = '';
	let avatarImageLoadFailed = $state(false);
	let profileButtonRef = $state<HTMLButtonElement | null>(null);
	let profilePanelRef = $state<HTMLDivElement | null>(null);
	let resourcesMenuRef = $state<HTMLDetailsElement | null>(null);
	let mobileSearchInputRef = $state<HTMLInputElement | null>(null);
	let profilePanelData = $state<ProfilePanelData>(null);
	let unreadNotificationCount = $state(0);
	let layoutSummaryLoading = $state(false);
	let layoutSummaryError = $state<string | null>(null);
	let supabaseClientPromise: Promise<SupabaseClient> | null = null;

	const profileName = $derived(getProfileName(displayName, user));
	const avatarImageUrl = $derived(getAvatarImageUrl(user));
	const showAvatarImage = $derived(Boolean(avatarImageUrl && !avatarImageLoadFailed));
	const memberSinceLabel = $derived(getMemberSinceLabel(user?.created_at));
	const diaryEntryTooltip = $derived(
		layoutSummaryLoading
			? 'Hämtar dagboksinlägg'
			: `${profilePanelData?.diaryEntryCount ?? 0} dagboksinlägg`
	);
	const shouldUseClientAuth = $derived(Boolean(data?.session || isPrivateOrUtilityPage));

	function getSupabaseClient() {
		if (!browser) return null;
		supabaseClientPromise ??= import('$lib/supabase').then(({ supabase }) => supabase);
		return supabaseClientPromise;
	}

	function handleAvatarImageError() {
		avatarImageLoadFailed = true;
	}

	$effect(() => {
		avatarImageUrl;
		avatarImageLoadFailed = false;
	});

	async function syncUser(sessionUser: User | null) {
		user = sessionUser;
		const requestVersion = ++profileRequestVersion;

		if (!sessionUser) {
			displayName = null;
			profilePanelOpen = false;
			profilePanelData = null;
			unreadNotificationCount = 0;
			syncedProfileUserId = '';
			loadedLayoutSummaryUserId = '';
			return;
		}

		if (loadedLayoutSummaryUserId !== sessionUser.id) {
			loadedLayoutSummaryUserId = sessionUser.id;
			void loadLayoutSummary();
		}
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
			const response = await fetch('/api/layout-summary');
			if (!response.ok) throw new Error('Kunde inte hämta profilöversikt.');
			const summary = (await response.json()) as {
				profilePanel: ProfilePanelData;
				unreadNotificationCount?: number;
			};
			if (requestVersion !== layoutSummaryRequestVersion) return;
			profilePanelData = summary.profilePanel ?? null;
			unreadNotificationCount = summary.unreadNotificationCount ?? 0;
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

			// Seed klienten med server-side session direkt (undviker flash vid login/redirect)
			if (data?.session) {
				if (seededSessionAccessToken !== data.session.access_token) {
					seededSessionAccessToken = data.session.access_token;
					void syncUser(data.session.user);
				} else if (user?.id !== data.session.user.id) {
					void syncUser(data.session.user);
				}
			} else {
				seededSessionAccessToken = '';
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
		if (!analyticsEnabled || !url) return;

		const nextPageKey = pageKey(url);
		if (lastTrackedPagePath === nextPageKey) return;

		trackPageView(url);
		lastTrackedPagePath = nextPageKey;
	}

	function syncAnalyticsConsent() {
		if (!browser) return;

		const consentStatus = getAnalyticsConsent();

		analyticsEnabled = ANALYTICS_ENABLED && hasAnalyticsConsent();
		if (!analyticsEnabled) {
			lastTrackedPagePath = '';
			disableAnalytics();
			return;
		}

		initializeAnalytics();
		trackCurrentPage(new URL(window.location.href));
	}

	$effect(() => {
		if (!browser) return;

		syncAnalyticsConsent();

		const handleConsentChange = () => {
			syncAnalyticsConsent();
		};

		window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChange);

		return () => {
			window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChange);
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

	afterNavigate(({ to }) => {
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
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="MittPsyke" />

		<meta property="og:url" content={`https://www.mittpsyke.se${page.url.pathname}`} />
		<meta property="og:image" content="https://www.mittpsyke.se/og-image.png" />

		<link rel="alternate" hreflang="sv" href={`https://www.mittpsyke.se${page.url.pathname}`} />

		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={page.data?.title ? `${page.data.title} | MittPsyke` : 'MittPsyke – Psykiskt stöd online'} />
		<meta
			name="twitter:description"
			content={ogDescription}
		/>
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
	<header class="site-header sticky top-0 z-30 bg-[hsl(var(--background)/0.94)] supports-[backdrop-filter]:backdrop-blur">
		<div class="site-header-inner flex items-center justify-between gap-2 px-5 py-3.5 md:gap-3">
			<div class="flex min-w-0 flex-1 items-center gap-2 md:gap-4 lg:flex-none">
				<a
					href="/"
					class="brand-link min-w-0 self-center opacity-95 hover:opacity-100 transition-opacity"
					aria-label="MittPsyke startsida"
					data-sveltekit-reload
				>
					<span class="brand-wordmark">MittPsyke</span>
				</a>
				<nav class="hidden lg:flex items-center gap-3" aria-label="Navigering">
					{#each desktopPrimaryNavItems as item}
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
				<nav class="mobile-quick-nav" aria-label="Snabbnavigering">
					{#each mobilePrimaryNavItems.slice(0, 3) as item}
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
				{#if !user}
					<div class="hidden lg:flex items-center gap-3">
						<a href={PUBLIC_CONTACT_MAILTO} class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity">Kontakt</a>
						<a href="/login" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">Logga in</a>
						<a href="/register" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">Registrera</a>
					</div>
				{/if}

					{#if user}
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
									{#if showAvatarImage}
										<img
											src={avatarImageUrl}
											alt=""
											width="96"
											height="96"
											class="profile-avatar-image"
											decoding="async"
											loading="lazy"
											onerror={handleAvatarImageError}
										/>
										{:else}
											<span class="profile-avatar-fallback" aria-hidden="true">
												<svg
													viewBox="0 0 24 24"
													class="profile-avatar-icon"
													fill="none"
													stroke="currentColor"
													stroke-width="1.8"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<circle cx="12" cy="8.2" r="3.3"></circle>
													<path d="M5.4 18.5c1.5-2.9 3.8-4.7 6.6-4.7 2.8 0 5.1 1.8 6.6 4.7"></path>
												</svg>
											</span>
										{/if}
									{#if unreadNotificationCount > 0}
										<span class="profile-avatar-badge" aria-hidden="true"></span>
									{/if}
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
											{#if showAvatarImage}
												<img
													src={avatarImageUrl}
													alt=""
													width="96"
													height="96"
													class="profile-panel-avatar-image"
													decoding="async"
													loading="lazy"
													onerror={handleAvatarImageError}
												/>
											{:else}
												<span class="profile-panel-avatar-fallback" aria-hidden="true">
													<svg
														viewBox="0 0 24 24"
														class="profile-avatar-icon"
														fill="none"
														stroke="currentColor"
														stroke-width="1.8"
														stroke-linecap="round"
														stroke-linejoin="round"
													>
														<circle cx="12" cy="8.2" r="3.3"></circle>
														<path d="M5.4 18.5c1.5-2.9 3.8-4.7 6.6-4.7 2.8 0 5.1 1.8 6.6 4.7"></path>
													</svg>
												</span>
											{/if}
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
										<a href="/dashboard" class="profile-panel-link" onclick={closeProfilePanel}>Min portal</a>
										<a href="/dagbok/checkin" class="profile-panel-link" onclick={closeProfilePanel}>Fortsätt i dagboken</a>
										<a href="/chat" class="profile-panel-link" onclick={closeProfilePanel}>Starta chat</a>
										<a href="/notiser" class="profile-panel-link" onclick={closeProfilePanel}>
											Notiser{#if unreadNotificationCount > 0} ({unreadNotificationCount}){/if}
										</a>
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
				{#each mobilePrimaryNavItems as item}
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
				{#each mobileSupplementalNavItems as item}
					<a href={item.href} class="mobile-menu-link mobile-menu-sub-link text-sm transition-opacity {isActive(item.href) ? 'opacity-100 underline' : 'opacity-80 hover:opacity-100 hover:underline'}" onclick={() => (mobileMenuOpen = false)} aria-current={isActive(item.href) ? 'page' : undefined}>{item.label}</a>
				{/each}
				{#if user}
					<p class="mobile-menu-greeting text-sm opacity-60">{displayName ? `Välkommen, ${displayName}` : 'Välkommen tillbaka'}</p>
					<p class="mobile-menu-section-title text-xs opacity-55">Profil</p>
					{#each signedInPortalNavItems as item}
						<a href={item.href} class="mobile-menu-link text-sm transition-opacity {isActive(item.href) ? 'opacity-100 underline' : 'opacity-85 hover:opacity-100 hover:underline'}" onclick={() => (mobileMenuOpen = false)} aria-current={isActive(item.href) ? 'page' : undefined}>
							{item.label}{#if item.href === '/notiser' && unreadNotificationCount > 0} ({unreadNotificationCount}){/if}
						</a>
					{/each}
					<a href={PUBLIC_CONTACT_MAILTO} class="mobile-menu-link text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity" onclick={() => (mobileMenuOpen = false)}>Kontakt</a>
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

	<div class:is-chat-page={isChat}>
		<main id="main-content" class="mt-6">
			{@render children()}
		</main>

		<section class="site-disclaimer mt-6 px-5">
			<p class="mx-auto max-w-4xl text-center text-xs sm:text-sm opacity-70 leading-relaxed">
				MittPsyke ersätter inte vård. Vid akut fara ring 112 &middot; Vårdråd 1177.
			</p>
		</section>

	<footer class="site-footer py-5 px-5 text-sm opacity-60 text-center mt-12">
		© {new Date().getFullYear()} MittPsyke. Alla rättigheter förbehållna.
		<span class="mx-2">&middot;</span>
		<a href="/kontakt-och-villkor" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
			Kontakt och villkor
		</a>
		<span class="mx-2">&middot;</span>
		<a href="/sa-fungerar-mittpsyke" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
			Så fungerar MittPsyke
		</a>
		<span class="mx-2">&middot;</span>
		<a href="/feedback" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
			Feedback
		</a>
		<span class="mx-2">&middot;</span>
		<a href="/blogg" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
			Artiklar
		</a>
		<span class="mx-2">&middot;</span>
		<a href="/ovningar" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
			Övningar
		</a>
		<span class="mx-2">&middot;</span>
		<a href="/sok" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
			Sök
		</a>
		<span class="mx-2">&middot;</span>
		<a href="/integritet" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
			Integritet
		</a>
		<span class="mx-2">&middot;</span>
		<a href="/ansvar" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
			Ansvar
		</a>
		<span class="mx-2">&middot;</span>
		<a href="/redaktionell-metod" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
			Redaktionell metod
		</a>
		<span class="mx-2">&middot;</span>
		<a href="/tillganglighet" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
			Tillgänglighet
		</a>
		<span class="mx-2">&middot;</span>
		<a href="/cookies-och-leverantorer" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
			Cookies och leverantörer
		</a>
		<span class="mx-2">&middot;</span>
		<a
			href="https://stodlinjer.se"
			target="_blank"
			rel="noopener noreferrer"
			class="footer-emergency-link text-sm font-medium opacity-90 hover:opacity-100 transition-opacity"
		>
			Akut hjälp (Stödlinjer)
		</a>
		<span class="mx-2">&middot;</span>
		<a href="/om-mittpsyke" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
			Om MittPsyke
		</a>
		<span class="mx-2">&middot;</span>
		<button onclick={() => cookieBannerOpen.set(true)} class="text-sm opacity-70 hover:opacity-100 transition-opacity">Cookieinställningar</button>
			<div class="footer-features mt-2 text-xs opacity-70" aria-label="Funktioner">
				<span class="font-medium">Funktioner:</span>
				<a href="/journalforing" class="hover:opacity-100 transition-opacity">Dagboksskrivande</a>
				<span class="mx-1">&middot;</span>
				<a href="/humorsparning" class="hover:opacity-100 transition-opacity">Humörspårning</a>
			</div>
			<div class="footer-company mt-2 text-xs opacity-70">
				<p>© MittPsyke</p>
				<p>Enskild näringsverksamhet</p>
				<p>Org.nr: 198712284895</p>
				<p><a href={PUBLIC_CONTACT_MAILTO} class="hover:opacity-100 transition-opacity">{PUBLIC_CONTACT_EMAIL}</a></p>
			</div>
		</footer>
	</div>

	<CookieBanner />
{/if}

<style>
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


	.mobile-menu-section-title {
		margin: 0.5rem 0 0.2rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
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
		min-height: 2.5rem;
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

	.profile-avatar-badge {
		position: absolute;
		top: 0.14rem;
		right: 0.14rem;
		width: 0.52rem;
		height: 0.52rem;
		border-radius: 9999px;
		background: hsl(var(--primary));
		box-shadow: 0 0 0 2px hsl(var(--background));
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

	.profile-avatar-image,
	.profile-avatar-fallback,
	.profile-panel-avatar-image,
	.profile-panel-avatar-fallback {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
	}

	.profile-avatar-image,
	.profile-panel-avatar-image {
		object-fit: cover;
		background: var(--layout-avatar-placeholder);
	}

	.profile-avatar-image,
	.profile-avatar-fallback {
		width: 2.15rem;
		height: 2.15rem;
	}

	.profile-panel-avatar-image,
	.profile-panel-avatar-fallback {
		width: 2.75rem;
		height: 2.75rem;
	}

	.profile-avatar-fallback,
	.profile-panel-avatar-fallback {
		color: hsl(var(--foreground) / 0.82);
		background: var(--layout-avatar-fallback-bg);
	}

	.profile-avatar-icon {
		width: 65%;
		height: 65%;
	}

	:global(.dark) .profile-avatar-fallback,
	:global(.dark) .profile-panel-avatar-fallback {
		color: hsl(var(--foreground) / 0.88);
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

		.profile-avatar-image,
		.profile-avatar-fallback {
			width: 2.15rem;
			height: 2.15rem;
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

		.mobile-menu-section-title {
			margin-top: 0.35rem;
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

		:global(.footer-features) {
			margin-top: 0.3rem !important;
		}

		:global(.footer-company) {
			margin-top: 0.3rem !important;
		}

		.footer-company p {
			margin-block: 0.04rem;
		}
	}

	@media (max-width: 370px) {
		.site-header-inner {
			padding-inline: 0.55rem;
			gap: 0.35rem;
		}

		.brand-wordmark {
			font-size: 1.08rem;
		}

		.mobile-quick-nav {
			gap: 0.05rem;
		}

		.mobile-quick-link {
			padding-inline: 0.34rem;
		}

		.mobile-quick-link-articles {
			font-size: 0.68rem;
		}
	}

</style>

