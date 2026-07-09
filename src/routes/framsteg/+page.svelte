<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount } from 'svelte';
	import { THEMES, THEME_STORAGE_KEY, getCachedTheme } from '$lib/theme';
	import { browser } from '$app/environment';
	import AccountTeaser from '$lib/components/AccountTeaser.svelte';
	import ActivityHeatmap from '$lib/components/ActivityHeatmap.svelte';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import type { ProgressCompanionSelection } from '$lib/progressCompanion';
	import { trackMilestoneReachedOnce, trackStreakDayReachedOnce } from '$lib/analytics';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent,
		hasSensitiveConsent
	} from '$lib/consent';
	import { supabase } from '$lib/supabase';
	import { Leaf, TrendingUp, Lightbulb, Calendar, Heart } from 'lucide-svelte';

	const now = new Date();
	const hour = now.getHours();
	const month = now.getMonth() + 1;

	type CompanionSeason = 'spring' | 'summer' | 'autumn' | 'winter';
	type CompanionTimeOfDay = 'morning' | 'day' | 'evening' | 'night';

	interface CompanionScene {
		image: string;
		season: CompanionSeason;
		timeOfDay: CompanionTimeOfDay;
		alt: string;
		copy: string;
		anonymousCopy: string;
	}

	const getSeason = (value: number): CompanionSeason => {
		if (value >= 12 || value <= 2) return 'winter';
		if (value >= 3 && value <= 5) return 'spring';
		if (value >= 9 && value <= 11) return 'autumn';
		return 'summer';
	};

	const getTimeOfDay = (value: number): CompanionTimeOfDay => {
		if (value >= 5 && value < 10) return 'morning';
		if (value >= 10 && value < 17) return 'day';
		if (value >= 17 && value < 21) return 'evening';
		return 'night';
	};

	const season = getSeason(month);
	const timeOfDay = getTimeOfDay(hour);
	const sceneImages: Record<CompanionSeason, Partial<Record<CompanionTimeOfDay, string>> & { default: string }> = {
		spring: {
			default: '/images/avatars/presets/spring_meadow_fox.png',
			morning: '/images/avatars/presets/fox_sunrise_dawn.png',
			night: '/images/avatars/presets/fox-night.webp'
		},
		summer: {
			default: '/images/avatars/presets/fox-morning.webp',
			morning: '/images/avatars/presets/Morgon fox sjön.png',
			night: '/images/avatars/presets/fox-night.webp'
		},
		autumn: {
			default: '/images/avatars/presets/Autumn fox 2.png',
			night: '/images/avatars/presets/fox-night.webp'
		},
		winter: {
			default: '/images/avatars/presets/fox-winter.webp'
		}
	};
	const companionScene: CompanionScene = {
		image: sceneImages[season][timeOfDay] ?? sceneImages[season].default,
		season,
		timeOfDay,
		alt: 'Din följeslagare, räven, vid sjön',
		copy:
			season === 'autumn'
				? 'Räven vilar i höstljuset medan platsen rör sig stilla omkring dig.'
				: season === 'winter'
					? 'Räven håller platsen varm och stilla medan snön faller långsamt.'
					: 'Räven är vaken och håller dig sällskap på din resa.',
		anonymousCopy:
			season === 'autumn'
				? 'Räven vilar i höstljuset medan platsen växer fram i lugn takt.'
				: season === 'winter'
					? 'Räven håller platsen varm och stilla medan den växer fram.'
					: 'Räven är vaken och håller platsen sällskap medan den växer fram.'
	};

	interface StreakData {
		currentStreak: number;
		longestStreak: number;
		lastEntryDate: string | null;
		lastEntryDaysAgo: number;
	}

	interface Milestone {
		id: string;
		category: 'firstSteps' | 'diary' | 'consistency' | 'time' | 'writingDepth';
		metric:
			| 'totalEntries'
			| 'longestStreak'
			| 'daysSinceJoined'
			| 'maxWordsInEntry'
			| 'maxWordsInDay'
			| 'totalWords';
		threshold: number;
		title?: string;
		description?: string;
		text: string;
		achieved: boolean;
		emoji: string;
		current: number;
		remaining: number;
		progressPercent: number;
		unit: 'inlägg' | 'dagar' | 'ord';
	}

	interface MilestoneSection {
		id: 'firstSteps' | 'diary' | 'consistency' | 'time' | 'writingDepth';
		title: string;
		milestones: Milestone[];
	}

	interface MilestonesResponse {
		achieved: Milestone[];
		sections: MilestoneSection[];
		nextMilestone: Milestone | null;
		totalEntries: number;
	}

	interface InsightItem {
		type: string;
		title: string;
		description: string;
		icon: string;
	}

	interface InsightDay {
		day: string;
		average: number;
		count: number;
	}

	interface InsightsResponse {
		insights: InsightItem[];
		bestDay: InsightDay | null;
		worstDay: InsightDay | null;
		emotionDistribution: Record<string, number>;
		aiSummary: string | null;
	}

	interface HeatmapResponse {
		data?: Record<string, number>;
		error?: string;
		totalEntries?: number;
	}

	interface ProgressCachePayload {
		streak: StreakData | null;
		milestones: MilestonesResponse | null;
		heatmap: HeatmapResponse | null;
	}

	interface PageData {
		streak: StreakData | null;
		milestones: MilestonesResponse | null;
		weeklyEntries: number;
		entryCount: number;
		activeDays: number;
		growthScore: number;
		growthLevel: number;
		heatmapData?: Record<string, number>;
		heatmapError?: string;
		profileTheme?: keyof typeof THEMES | null;
		progressCompanion?: ProgressCompanionSelection | string | null;
		isAnonymous?: boolean;
	}

	const ANONYMOUS_PREVIEW_STREAK: StreakData = {
		currentStreak: 3,
		longestStreak: 6,
		lastEntryDate: null,
		lastEntryDaysAgo: 1
	};
	const ANONYMOUS_PREVIEW_INSIGHTS: InsightsResponse = {
		insights: [
			{
				type: 'rhythm',
				title: 'Varsam rytm',
				description: 'Flera reflektioner verkar landa när dagen får börja lite långsamt.',
				icon: 'leaf'
			},
			{
				type: 'return',
				title: 'Återkomst',
				description: 'Små återkommande stunder gör platsen lättare att hitta tillbaka till.',
				icon: 'garden'
			}
		],
		bestDay: { day: 'Tisdag', average: 7.1, count: 3 },
		worstDay: { day: 'Söndag', average: 5.4, count: 1 },
		emotionDistribution: { lugn: 4, oro: 2, trötthet: 2 },
		aiSummary:
			'Här kan en mjuk sammanfattning växa fram ur dina egna ord. Den ska hjälpa dig se mönster utan att pressa fram svar.'
	};

	function previewDateKey(daysAgo: number) {
		const date = new Date();
		date.setDate(date.getDate() - daysAgo);
		return date.toISOString().split('T')[0];
	}

	function buildAnonymousPreviewHeatmap() {
		return [2, 3, 6, 9, 10, 15, 18, 22, 29, 36, 39, 45, 52, 58].reduce(
			(map, daysAgo, index) => {
				map[previewDateKey(daysAgo)] = (index % 3) + 1;
				return map;
			},
			{} as Record<string, number>
		);
	}

	function createPreviewMilestone(
		milestone: Pick<Milestone, 'id' | 'category' | 'metric' | 'threshold' | 'text'> &
			Partial<Milestone>
	): Milestone {
		return {
			title: milestone.title,
			description: milestone.description,
			emoji: milestone.emoji ?? '',
			achieved: milestone.achieved ?? false,
			current: milestone.current ?? 0,
			remaining: milestone.remaining ?? 0,
			progressPercent: milestone.progressPercent ?? 0,
			unit: milestone.unit ?? 'inlägg',
			...milestone
		};
	}

	const PREVIEW_FIRST_STEP = createPreviewMilestone({
		id: 'preview-first-step',
		category: 'firstSteps',
		metric: 'totalEntries',
		threshold: 1,
		text: 'Ett första varsamt avtryck.',
		description: 'En första rad fick finnas kvar.',
		achieved: true,
		current: 18,
		progressPercent: 100,
		unit: 'inlägg'
	});
	const PREVIEW_RETURNING = createPreviewMilestone({
		id: 'preview-returning',
		category: 'consistency',
		metric: 'longestStreak',
		threshold: 3,
		text: 'Platsen fick känna igen dig igen.',
		description: 'Flera små återkomster har börjat skapa rytm.',
		achieved: true,
		current: 6,
		progressPercent: 100,
		unit: 'dagar'
	});
	const PREVIEW_DEEPER_TEXT = createPreviewMilestone({
		id: 'preview-deeper-text',
		category: 'writingDepth',
		metric: 'maxWordsInEntry',
		threshold: 250,
		text: 'En tanke fick ta mer plats.',
		description: 'Ibland blir några rader lite mer sammanhängande.',
		achieved: true,
		current: 340,
		progressPercent: 100,
		unit: 'ord'
	});
	const PREVIEW_NEXT_STEP = createPreviewMilestone({
		id: 'preview-next-step',
		category: 'diary',
		metric: 'totalEntries',
		threshold: 25,
		text: 'Fler små stunder kan få landa här.',
		description: 'Trädgården får växa långsamt när du återvänder.',
		achieved: false,
		current: 18,
		remaining: 7,
		progressPercent: 72,
		unit: 'inlägg'
	});
	const ANONYMOUS_PREVIEW_MILESTONES: MilestonesResponse = {
		achieved: [PREVIEW_FIRST_STEP, PREVIEW_RETURNING, PREVIEW_DEEPER_TEXT],
		sections: [
			{
				id: 'firstSteps',
				title: 'Första avtryck',
				milestones: [PREVIEW_FIRST_STEP, PREVIEW_NEXT_STEP]
			},
			{
				id: 'consistency',
				title: 'Återkomst',
				milestones: [PREVIEW_RETURNING]
			},
			{
				id: 'writingDepth',
				title: 'Ord som fick plats',
				milestones: [PREVIEW_DEEPER_TEXT]
			}
		],
		nextMilestone: PREVIEW_NEXT_STEP,
		totalEntries: 18
	};
	const ANONYMOUS_PREVIEW_HEATMAP = buildAnonymousPreviewHeatmap();

	// ── Theme ──

	let { data } = $props<{ data: PageData }>();
	let profileTheme = $state<keyof typeof THEMES>(getCachedTheme());
	const isAnonymous = $derived(Boolean(data.isAnonymous));
	const currentTheme = $derived(THEMES[profileTheme] ?? THEMES.neutral);
	const themeStyle = $derived(
		`--theme-accent: ${currentTheme.accent}; --theme-bg: ${currentTheme.bg};`
	);
	$effect(() => {
		const nextProfileTheme = data.profileTheme;
		if (nextProfileTheme && THEMES[nextProfileTheme]) {
			profileTheme = nextProfileTheme;
		}
	});

	// ── Props + State ──
	let loadedStreakData = $state<StreakData | null>({
		currentStreak: 0,
		longestStreak: 0,
		lastEntryDate: null,
		lastEntryDaysAgo: 0
	});
	let loadedMilestonesData = $state<MilestonesResponse | null>({
		achieved: [],
		sections: [],
		nextMilestone: null,
		totalEntries: 0
	});
	let loadedWeeklyEntries = $state(0);
	let loadedEntryCount = $state(0);
	let loadedActiveDays = $state(0);
	let loadedGrowthScore = $state(0);
	let loadedGrowthLevel = $state(0);
	let loadedHeatmapData = $state<Record<string, number>>({});
	let heatmapError = $state('');
	let progressLoading = $state(false);
	let progressLoaded = $state(false);
	let progressError = $state('');
	let loadedInsightsData = $state<InsightsResponse | null>(null);
	let insightsLoading = $state(false);
	let insightsError = $state('');
	let hasSensitiveDataConsent = $state(browser ? hasSensitiveConsent() : false);
	let insightsVisible = $state(false);
	let heatmapVisible = $state(false);
	let insightsCardEl = $state<HTMLElement | null>(null);
	let heatmapCardEl = $state<HTMLElement | null>(null);
	const streakData = $derived(isAnonymous ? ANONYMOUS_PREVIEW_STREAK : loadedStreakData);
	const milestonesData = $derived(isAnonymous ? ANONYMOUS_PREVIEW_MILESTONES : loadedMilestonesData);
	const weeklyEntries = $derived(isAnonymous ? 3 : loadedWeeklyEntries);
	const entryCount = $derived(isAnonymous ? 18 : loadedEntryCount);
	const activeDays = $derived(isAnonymous ? 11 : loadedActiveDays);
	const growthLevel = $derived(isAnonymous ? 3 : loadedGrowthLevel);
	const heatmapData = $derived(isAnonymous ? ANONYMOUS_PREVIEW_HEATMAP : loadedHeatmapData);
	const insightsData = $derived(isAnonymous ? ANONYMOUS_PREVIEW_INSIGHTS : loadedInsightsData);
	const shouldShowInsights = $derived(isAnonymous || insightsVisible);
	const shouldShowHeatmap = $derived(isAnonymous || heatmapVisible);
	let loading = $derived(progressLoading && !progressLoaded);
	let error = $derived(progressError);
	let hasInsightsContent = $derived(
		Boolean(
			insightsData &&
				(insightsData.aiSummary ||
					insightsData.insights.length > 0 ||
					insightsData.bestDay ||
					insightsData.worstDay)
		)
	);

	// ── Weekly summary copy (no AI, just warm text) ──
	const weeklySummaryText = $derived.by(() => {
		if (isAnonymous) {
			return 'Här kan en mjuk veckosammanfattning visas när dagboken börjar få återkommande rader.';
		}

		if (weeklyEntries === 0) return 'Du har inte checkat in den här veckan än — och det är helt okej.';
		if (weeklyEntries === 1) return 'Du har checkat in en gång den här veckan. Det räcker fint.';
		if (weeklyEntries === 2) return 'Två incheckningar den här veckan — du tar hand om dig.';
		if (weeklyEntries <= 4) return `${weeklyEntries} incheckningar den här veckan. Du fortsätter komma tillbaka, i din takt.`;
		return `${weeklyEntries} incheckningar den här veckan — du har verkligen tagit dig tid för dig själv.`;
	});

	const weeklyEncouragement = $derived.by(() => {
		if (isAnonymous) return 'Varje rad kan räknas, även när den är kort.';

		if (weeklyEntries >= 1) return 'Varje rad räknas, även när den är kort.';
		return 'Det finns inget som måste vara perfekt för att räknas.';
	});

	const latestEntryText = $derived.by(() => {
		if (!streakData?.lastEntryDate) return 'Inte ännu';
		if (streakData.lastEntryDaysAgo <= 0) return 'Idag';
		if (streakData.lastEntryDaysAgo === 1) return 'Igår';
		return `${streakData.lastEntryDaysAgo} dagar sedan`;
	});

	function softMilestoneTitle(milestone: Milestone) {
		if (!milestone.achieved) return 'Får växa fram senare';

		if (milestone.metric === 'longestStreak') {
			return isAnonymous ? 'Återbesök gör platsen mer levande' : 'Du har återvänt hit';
		}
		if (milestone.metric === 'daysSinceJoined') return 'Platsen finns kvar över tid';
		if (milestone.metric === 'maxWordsInEntry' || milestone.metric === 'maxWordsInDay') {
			return 'En tanke fick ta mer plats';
		}
		if (milestone.metric === 'totalWords') return 'Många ord har fått landa';
		if (milestone.metric === 'totalEntries' && milestone.threshold <= 10) return 'Ett varsamt avtryck';
		if (milestone.metric === 'totalEntries' && milestone.threshold < 100) return 'Fler stunder fick plats';
		return isAnonymous ? 'Trädgården kan växa lite till' : 'Din trädgård har vuxit lite till';
	}

	function softMilestoneDescription(milestone: Milestone) {
		if (!milestone.achieved) {
			return 'Det här får vila tills det blir en naturlig del av din plats.';
		}

		const source = milestone.description ?? milestone.text;
		const softened = source
			.replace(/^\d+\s+(inlägg|dagar i rad|dagar|ord)\.?\s*/i, '')
			.replace(/^Över\s+\d+\s+ord\s+i\s+ett\s+inlägg\.?\s*/i, '')
			.replace(/^\d+\s+ord\s+på\s+en\s+dag\.?\s*/i, '')
			.replace(/^\d+\s+skrivna\s+ord\.?\s*/i, '')
			.trim();

		return softened || 'Din trädgård har vuxit lite till.';
	}

	function nextMilestoneCopy(milestone: Milestone) {
		const softened = softMilestoneDescription({ ...milestone, achieved: true });
		if (softened !== milestone.text) return softened;
		return isAnonymous
			? 'Trädgården kan växa lite till när återbesöken blir fler.'
			: 'Din trädgård kan växa lite till när du återvänder.';
	}

	// ── Reflection prompts (rotate based on day) ──
	const reflections = [
		'Vad har hjälpt dig mest den senaste tiden?',
		'Finns det något du vill ta med dig in i nästa vecka?',
		'Vad har du gjort för dig själv idag?',
		'Finns det något du vill släppa taget om?',
		'Vad gör dig lugn just nu?',
		'Hur vill du att kommande vecka ska kännas?',
		'Vad är du tacksam för just nu?'
	];
	const todayReflection = reflections[new Date().getDay()];

	function getGrowthLevel(entryCountValue: number) {
		let level = 0;
		if (entryCountValue >= 1) level = 1;
		if (entryCountValue >= 6) level = 2;
		if (entryCountValue >= 16) level = 3;
		if (entryCountValue >= 31) level = 4;
		return level;
	}

	function startOfWeekKey() {
		const now = new Date();
		const dayOfWeek = now.getDay();
		const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
		const monday = new Date(now);
		monday.setDate(now.getDate() + mondayOffset);
		monday.setHours(0, 0, 0, 0);
		return monday.toISOString().split('T')[0];
	}

	function applyProgressPayload(payload: ProgressCachePayload) {
		loadedStreakData = payload.streak;
		loadedMilestonesData = payload.milestones;
		loadedHeatmapData = payload.heatmap?.data ?? {};
		heatmapError = payload.heatmap?.error ?? '';

		const weekStart = startOfWeekKey();
		loadedWeeklyEntries = Object.entries(loadedHeatmapData).reduce(
			(sum, [day, count]) => (day >= weekStart ? sum + count : sum),
			0
		);
		loadedEntryCount = loadedMilestonesData?.totalEntries ?? payload.heatmap?.totalEntries ?? 0;
		loadedActiveDays = Object.keys(loadedHeatmapData).length;
		loadedGrowthScore = loadedEntryCount + loadedActiveDays * 3;
		loadedGrowthLevel = getGrowthLevel(loadedEntryCount);
		progressLoaded = true;

		if (loadedStreakData?.currentStreak) {
			trackStreakDayReachedOnce(loadedStreakData.currentStreak);
		}
		for (const milestone of loadedMilestonesData?.achieved ?? []) {
			trackMilestoneReachedOnce(milestone.title ?? milestone.text);
		}
	}

	async function loadProgressData() {
		if (isAnonymous || progressLoading || progressLoaded) return;

		progressLoading = true;
		progressError = '';

		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();

			if (!session?.access_token) {
				progressError = 'Du behöver vara inloggad för att se framsteg.';
				return;
			}

			const headers = { Authorization: `Bearer ${session.access_token}` };
			const [streakRes, milestonesRes, heatmapRes] = await Promise.all([
				fetch('/api/diary/streak', { headers }),
				fetch('/api/diary/milestones', { headers }),
				fetch('/api/diary/heatmap', { headers })
			]);

			const [streakPayload, milestonesPayload, heatmapPayload] = await Promise.all([
				streakRes.ok ? streakRes.json() : null,
				milestonesRes.ok ? milestonesRes.json() : null,
				heatmapRes.ok ? heatmapRes.json() : null
			]);

			const payload = {
				streak: streakPayload as StreakData | null,
				milestones: milestonesPayload as MilestonesResponse | null,
				heatmap: heatmapPayload as HeatmapResponse | null
			};
			applyProgressPayload(payload);
		} catch {
			progressError = 'Kunde inte ladda framsteg just nu.';
		} finally {
			progressLoading = false;
		}
	}

	function maybeLoadInsights() {
		if (
			isAnonymous ||
			!browser ||
			!hasSensitiveDataConsent ||
			!insightsVisible ||
			insightsLoading ||
			insightsData
		) {
			return;
		}

		void loadInsights();
	}

	onMount(() => {
		if (isAnonymous) {
			progressLoaded = true;
			insightsVisible = true;
			heatmapVisible = true;
			if (browser) {
				localStorage.setItem(THEME_STORAGE_KEY, profileTheme);
			}
			return;
		}

		void loadProgressData();
		hasSensitiveDataConsent = hasSensitiveConsent();
		if (browser) {
			localStorage.setItem(THEME_STORAGE_KEY, profileTheme);
		}
		insightsVisible = true;
		heatmapVisible = true;
		maybeLoadInsights();

		if (typeof IntersectionObserver === 'undefined') {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;

					if (entry.target === insightsCardEl) {
						insightsVisible = true;
						maybeLoadInsights();
						observer.unobserve(entry.target);
					}

					if (entry.target === heatmapCardEl) {
						heatmapVisible = true;
						observer.unobserve(entry.target);
					}
				}
			},
			{ rootMargin: '180px 0px' }
		);

		if (insightsCardEl) observer.observe(insightsCardEl);
		if (heatmapCardEl) observer.observe(heatmapCardEl);

		return () => {
			observer.disconnect();
		};
	});

	$effect(() => {
		if (hasSensitiveDataConsent && insightsVisible) {
			maybeLoadInsights();
		}
	});

	async function loadInsights() {
		if (insightsLoading) return;

		insightsLoading = true;
		insightsError = '';

		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();

			if (!session?.access_token) {
				insightsError = 'Du behöver vara inloggad för att se AI-insikter.';
				loadedInsightsData = null;
				return;
			}

			const insightsFetchController = new AbortController();
			const insightsFetchTimeout = setTimeout(() => {
				insightsFetchController.abort();
			}, 12000);

			const response = await fetch('/api/diary/insights', {
				headers: {
					Authorization: `Bearer ${session.access_token}`,
					[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
				},
				signal: insightsFetchController.signal
			}).finally(() => {
				clearTimeout(insightsFetchTimeout);
			});

			const result = (await response.json().catch(() => null)) as
				| InsightsResponse
				| { error?: string }
				| null;

			if (!response.ok || !result || !('insights' in result)) {
				insightsError =
					result && 'error' in result && typeof result.error === 'string'
						? result.error
						: 'Kunde inte ladda AI-insikter just nu.';
				loadedInsightsData = null;
				return;
			}

			loadedInsightsData = result;
		} catch {
			insightsError = 'Kunde inte ladda AI-insikter just nu.';
			loadedInsightsData = null;
		} finally {
			insightsLoading = false;
		}
	}

	function acceptSensitiveDataConsent() {
		try {
			grantSensitiveConsent();
		} catch (error) {
			console.error('Could not persist sensitive consent in localStorage:', error);
		}
		hasSensitiveDataConsent = true;
		if (insightsVisible) {
			void loadInsights();
			return;
		}
		maybeLoadInsights();
	}

</script>

<SEO canonical="https://www.mittpsyke.se/framsteg" />

<main class="auth-page framsteg-page" style={themeStyle}>
	<div class="auth-shell framsteg-shell">
		<header class="auth-hero">
			<div>
				{#if isAnonymous}
					<a class="home-return-link" href="/">&larr; Till startsidan</a>
				{/if}
				<h1>Framsteg</h1>
				<p>
					{isAnonymous
						? 'En förhandsvisning av hur små framsteg kan få synas över tid.'
						: 'En lugn överblick över din resa, i din egen takt.'}
				</p>
			</div>
		</header>
	</div>

	<div class="auth-shell framsteg-shell">
		<div class="journey-container">
			{#if loading}
				<section class="auth-panel loading-state">Laddar din sida med framsteg...</section>
			{:else if error}
				<section class="auth-panel auth-panel-error error-state">
					<p>{error}</p>
					<small>Försök att ladda sidan igen</small>
				</section>
			{:else}
				<div class="progress-content" class:account-preview-content={isAnonymous}>
					{#if isAnonymous}
						<div class="progress-preview-note">
							<AccountTeaser variant="progress" mode="overlay" />
						</div>
					{/if}
	<div class="framsteg-layout">
	<div class="framsteg-main">
		<section class="card companion-card">
			<div
				class="companion-media"
				data-season={companionScene.season}
				data-time={companionScene.timeOfDay}
			>
				<img
					src={companionScene.image}
					alt={companionScene.alt}
					loading="lazy"
					decoding="async"
				/>
				<div class="living-world" aria-hidden="true">
					<span class="sky-glow"></span>
					<span class="lake-mist mist-one"></span>
					<span class="lake-mist mist-two"></span>
					<span class="meteor meteor-one"></span>
					<span class="meteor meteor-two"></span>
					<span class="water-shimmer shimmer-one"></span>
					<span class="water-shimmer shimmer-two"></span>
					<span class="fox-breath"></span>
					<span class="drifting-leaf leaf-one"></span>
					<span class="drifting-leaf leaf-two"></span>
					<span class="drifting-leaf leaf-three"></span>
					<span class="snowflake snow-one"></span>
					<span class="snowflake snow-two"></span>
					<span class="snowflake snow-three"></span>
					<span class="distant-bird bird-one"></span>
					<span class="firefly firefly-one"></span>
					<span class="firefly firefly-two"></span>
					<span class="firefly firefly-three"></span>
				</div>
			</div>
			<div class="companion-copy">
				<h2>Din följeslagare</h2>
				<p>
					{isAnonymous
						? companionScene.anonymousCopy
						: companionScene.copy}
				</p>
			</div>
		</section>

		<!-- ── Aktivitetskarta ── -->
		<section class="card heatmap-card" bind:this={heatmapCardEl}>
			<div class="card-header">
				<div class="icon-badge heat"><TrendingUp size={24} /></div>
				<h2>{isAnonymous ? 'Exempel på aktivitetskarta' : 'Din aktivitetskarta'}</h2>
			</div>
			<p class="heatmap-description">
				{isAnonymous
					? 'Varje ruta kan motsvara en dag. Mörkare färg visar hur fler inlägg kan synas.'
					: 'Varje ruta motsvarar en dag. Mörkare färg betyder fler inlägg.'}
			</p>
			{#if shouldShowHeatmap}
				<ActivityHeatmap data={heatmapData} error={heatmapError} />
			{:else}
				<div class="card-placeholder card-placeholder--heatmap" aria-hidden="true"></div>
			{/if}
		</section>

		<!-- ── AI-insikter ── -->
		<section class="card insights-card" bind:this={insightsCardEl}>
			<div class="card-header">
				<div class="icon-badge insight"><Lightbulb size={24} /></div>
				<h2>{isAnonymous ? 'Exempel på AI-insikter' : 'Dina AI-insikter'}</h2>
			</div>

			{#if !isAnonymous && !hasSensitiveDataConsent}
				<ConsentGate
					title="Samtycke innan AI-insikter"
					dataLabel="Din dagbok och dina mönster"
					serviceLabel="AI- och tredjepartstjänster"
					onAccept={acceptSensitiveDataConsent}
				/>
			{:else if !shouldShowInsights}
				<div class="card-placeholder card-placeholder--insights" aria-hidden="true"></div>
			{:else if insightsLoading}
				<p class="heatmap-description">Laddar AI-insikter...</p>
			{:else if insightsError}
				<p class="heatmap-description">{insightsError}</p>
			{:else if hasInsightsContent && insightsData}
				{#if insightsData.aiSummary}
					<div class="summary-box">
						<p>{insightsData.aiSummary}</p>
					</div>
				{/if}

				{#if insightsData.bestDay || insightsData.worstDay}
					<div class="insights-grid">
						{#if insightsData.bestDay}
							<div class="insight-item best">
								<div class="insight-content">
									<h3>Mår bäst på</h3>
									<p class="day-name">{insightsData.bestDay.day}</p>
									<small>Genomsnitt: {insightsData.bestDay.average}/10</small>
								</div>
							</div>
						{/if}
						{#if insightsData.worstDay}
							<div class="insight-item worst">
								<div class="insight-content">
									<h3>Svårare på</h3>
									<p class="day-name">{insightsData.worstDay.day}</p>
									<small>Genomsnitt: {insightsData.worstDay.average}/10</small>
								</div>
							</div>
						{/if}
					</div>
				{/if}

				{#if insightsData.insights.length > 0}
					<ul class="patterns-list">
						{#each insightsData.insights as insight}
							<li>
								<span class="pattern-text">{insight.title}: {insight.description}</span>
							</li>
						{/each}
					</ul>
				{/if}
			{:else}
				<p class="heatmap-description">Det finns inte tillräckligt med data för AI-insikter ännu.</p>
			{/if}
		</section>

		<!-- ── Lugn dataöverblick ── -->
		{#if streakData || milestonesData}
			<section class="card overview-card">
				<h2 class="overview-heading">Lugn överblick</h2>
				<div class="overview-grid">
					{#if milestonesData}
						<div class="overview-item">
							<div class="overview-number">{milestonesData.totalEntries}</div>
							<div class="overview-label">Texter skrivna</div>
						</div>
					{/if}
					<div class="overview-item">
						<div class="overview-number">{activeDays}</div>
						<div class="overview-label">Dagar med avtryck</div>
					</div>
					{#if streakData}
						<div class="overview-item">
							<div class="overview-number overview-number--text">{latestEntryText}</div>
							<div class="overview-label">
								{isAnonymous ? 'Exempel på senaste anteckning' : 'Senaste gången du skrev'}
							</div>
						</div>
					{/if}
				</div>
			</section>
		{/if}

		<!-- ── Mjuk veckosammanfattning ── -->
		<section class="card summary-card">
			<div class="card-header">
				<div class="icon-badge week"><Heart size={24} /></div>
				<h2>Den här veckan</h2>
			</div>
			<p class="summary-text">{weeklySummaryText}</p>
			<p class="encouragement">{weeklyEncouragement}</p>
		</section>

		<!-- ── Milstolpar ── -->
		{#if milestonesData}
			<section class="card milestones-card">
				<div class="card-header">
					<div class="icon-badge milestone-leaf"><Leaf size={24} /></div>
					<div>
						<h2>Små tecken på omsorg</h2>
						<p class="card-intro">
							{isAnonymous
								? 'Små tecken på hur återbesök, reflektioner och tid kan få synas i platsen.'
								: 'Små tecken på att du har återvänt, reflekterat och gett dig själv plats över tid.'}
						</p>
					</div>
				</div>
				{#each milestonesData.sections as section}
					<div class="milestones-section">
						<h3 class="milestones-section-title">{section.title}</h3>
						<div class="milestones-grid">
							{#each section.milestones as milestone}
								<div class="milestone {milestone.achieved ? 'achieved' : 'resting'}">
									<div class="milestone-mark" aria-hidden="true"></div>
									<div class="milestone-copy">
										<h4>{softMilestoneTitle(milestone)}</h4>
										<p>{softMilestoneDescription(milestone)}</p>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
				{#if milestonesData.nextMilestone}
					<div class="next-milestone">
						<div class="next-header"><Calendar size={18} /><span>Det som långsamt kan växa fram</span></div>
						<h3>{isAnonymous ? 'Trädgården kan få plats för mer ljus.' : 'Din trädgård har plats för mer ljus.'}</h3>
						<p>{nextMilestoneCopy(milestonesData.nextMilestone)}</p>
						<small>
							{isAnonymous
								? 'Ingen brådska. Platsen kan växa när återbesöken blir fler.'
								: 'Ingen brådska. Den här platsen växer när du återvänder.'}
						</small>
					</div>
				{:else}
					<div class="next-milestone">
						<div class="next-header"><Calendar size={18} /><span>Det som långsamt kan växa fram</span></div>
						<p>
							{isAnonymous
								? 'Här kan platsen visa att inget behöver jagas. Den får växa i lugn takt.'
								: 'Det finns inget mer du behöver jaga. Fortsätt återvända när det hjälper dig.'}
						</p>
					</div>
				{/if}
			</section>
		{/if}

		<!-- ── Tom state ── -->
		{#if entryCount === 0}
			<section class="card empty-state">
				<h2>Börja där du är</h2>
				<p>Du behöver inte ha kommit någonstans för att börja se mönster. Skriv en rad idag, så får platsen sitt första lilla ljus.</p>
				<a href="/dagbok/checkin" class="auth-button primary">Skriv en rad</a>
			</section>
		{/if}
			</div>

			<aside class="framsteg-column">
				
				<section class="card progress-summary-card">
					<div class="card-header">
						<div class="icon-badge week"><Leaf size={24} /></div>
						<h2>Framsteg</h2>
					</div>
					<div class="summary-stats">
						<div class="summary-stat">
							<span class="summary-stat-number">{entryCount}</span>
							<span class="summary-stat-label">Texter skrivna</span>
						</div>
						<div class="summary-stat">
							<span class="summary-stat-number">{activeDays}</span>
							<span class="summary-stat-label">Dagar med avtryck</span>
						</div>
						{#if streakData}
							<div class="summary-stat">
								<span class="summary-stat-number">{streakData.currentStreak}</span>
								<span class="summary-stat-label">Dagar i följd</span>
							</div>
						{/if}
						<div class="summary-stat">
							<span class="summary-stat-number">{weeklyEntries}</span>
							<span class="summary-stat-label">Den här veckan</span>
						</div>
						<div class="summary-stat">
							<span class="summary-stat-number">{growthLevel}</span>
							<span class="summary-stat-label">Trädgården växer</span>
						</div>
					</div>
				</section>
			</aside>
		</div>
				</div>
			{/if}
		</div>
	</div>
</main>

<style>
	.journey-container { display: grid; gap: 1rem; }

	.home-return-link {
		display: inline-flex;
		align-items: center;
		width: fit-content;
		margin-bottom: 0.65rem;
		color: var(--color-dashboard-text-muted);
		font-size: 0.9rem;
		font-weight: 700;
		text-decoration: none;
	}

	.home-return-link:hover,
	.home-return-link:focus-visible {
		color: var(--color-dashboard-text);
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}

	.progress-content {
		display: grid;
		gap: 1rem;
	}

	.framsteg-shell {
		max-width: 1240px;
	}

	.framsteg-layout {
		display: grid;
		grid-template-columns: minmax(0, 2fr) clamp(300px, 28%, 340px);
		gap: 1.2rem;
		align-items: start;
	}

	.framsteg-main {
		display: grid;
		gap: 1rem;
		min-width: 0;
	}

	.framsteg-column {
		display: grid;
		gap: 1rem;
		align-content: start;
		position: sticky;
		top: 1rem;
	}

	.companion-card {
		padding: 0;
		overflow: hidden;
	}

	.companion-media {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 10;
		overflow: hidden;
		background: #0d1727;
		isolation: isolate;
	}

	.companion-media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: 50% 50%;
		display: block;
		transform: scale(1.018);
		animation: companionWorldDrift 18s ease-in-out infinite alternate;
		will-change: transform, filter;
	}

	.companion-media[data-season='autumn'] img,
	.companion-media[data-season='spring'] img {
		object-position: 52% 50%;
	}

	.companion-media[data-time='night'] img {
		filter: saturate(1.04) brightness(0.95);
	}

	.living-world,
	.living-world span {
		position: absolute;
		pointer-events: none;
	}

	.living-world {
		inset: 0;
		z-index: 1;
		overflow: hidden;
		mix-blend-mode: screen;
	}

	.living-world span {
		will-change: transform, opacity;
	}

	.sky-glow {
		inset: -18% -10% 48% -10%;
		background:
			radial-gradient(circle at 30% 18%, rgba(180, 224, 255, 0.28), transparent 34%),
			radial-gradient(circle at 68% 10%, rgba(112, 190, 255, 0.16), transparent 28%);
		opacity: 0.52;
		animation: skyPulse 9s ease-in-out infinite;
	}

	.companion-media[data-season='autumn'] .sky-glow {
		background:
			radial-gradient(circle at 25% 16%, rgba(255, 219, 143, 0.42), transparent 36%),
			radial-gradient(circle at 71% 12%, rgba(255, 146, 72, 0.18), transparent 30%);
		mix-blend-mode: soft-light;
	}

	.companion-media[data-time='night'] .sky-glow {
		background:
			radial-gradient(circle at 18% 18%, rgba(117, 202, 255, 0.34), transparent 30%),
			radial-gradient(circle at 64% 8%, rgba(142, 112, 255, 0.16), transparent 28%);
	}

	.lake-mist {
		left: -8%;
		right: -8%;
		height: clamp(2.2rem, 8vw, 5.8rem);
		border-radius: 999px;
		background: linear-gradient(90deg, transparent, rgba(255, 251, 236, 0.26), rgba(226, 245, 255, 0.18), transparent);
		filter: blur(10px);
		opacity: 0;
		mix-blend-mode: soft-light;
	}

	.mist-one {
		top: 49%;
		animation: lakeMistDrift 15s ease-in-out infinite;
	}

	.mist-two {
		top: 57%;
		animation: lakeMistDrift 19s ease-in-out 4s infinite reverse;
	}

	.meteor {
		width: clamp(7rem, 18vw, 15rem);
		height: 2px;
		border-radius: 999px;
		background: linear-gradient(90deg, transparent, rgba(175, 230, 255, 0.12), rgba(206, 244, 255, 0.9));
		filter: drop-shadow(0 0 8px rgba(93, 191, 255, 0.75));
		opacity: 0;
		transform: rotate(-35deg);
	}

	.companion-media:not([data-time='night']) .meteor {
		display: none;
	}

	.meteor-one {
		top: 13%;
		left: 22%;
		animation: meteorDrift 8.5s ease-in-out infinite;
	}

	.meteor-two {
		top: 24%;
		left: 58%;
		width: clamp(5rem, 14vw, 11rem);
		animation: meteorDrift 12s ease-in-out 3.4s infinite;
	}

	.water-shimmer {
		left: 6%;
		right: 34%;
		height: 1px;
		border-radius: 999px;
		background: linear-gradient(90deg, transparent, rgba(168, 228, 255, 0.42), transparent);
		filter: blur(0.5px);
		opacity: 0;
	}

	.shimmer-one {
		top: 56%;
		animation: waterShimmer 5.8s ease-in-out infinite;
	}

	.shimmer-two {
		top: 63%;
		left: 10%;
		right: 44%;
		animation: waterShimmer 7.5s ease-in-out 1.9s infinite;
	}

	.fox-breath {
		right: clamp(5rem, 12vw, 9rem);
		bottom: clamp(1.4rem, 4vw, 3.8rem);
		width: clamp(7rem, 20vw, 15rem);
		height: clamp(4rem, 11vw, 8rem);
		border-radius: 999px;
		background: radial-gradient(ellipse at center, rgba(255, 188, 106, 0.2), rgba(255, 148, 72, 0.08) 45%, transparent 72%);
		filter: blur(10px);
		opacity: 0.62;
		mix-blend-mode: soft-light;
		animation: foxBreath 5.4s ease-in-out infinite;
	}

	.firefly {
		width: 0.42rem;
		height: 0.42rem;
		border-radius: 999px;
		background: rgba(255, 239, 156, 0.92);
		box-shadow: 0 0 12px rgba(255, 225, 125, 0.78);
		opacity: 0;
	}

	.companion-media[data-season='winter'] .firefly,
	.companion-media[data-time='morning'] .firefly,
	.companion-media[data-time='day'] .firefly {
		display: none;
	}

	.firefly-one {
		right: 16%;
		bottom: 30%;
		animation: fireflyFloat 7s ease-in-out infinite;
	}

	.firefly-two {
		right: 9%;
		bottom: 44%;
		animation: fireflyFloat 9s ease-in-out 1.6s infinite;
	}

	.firefly-three {
		right: 27%;
		bottom: 22%;
		animation: fireflyFloat 8s ease-in-out 3.1s infinite;
	}

	.drifting-leaf {
		top: -8%;
		width: clamp(0.85rem, 1.8vw, 1.25rem);
		height: clamp(0.52rem, 1.1vw, 0.78rem);
		border-radius: 90% 0 90% 0;
		background: linear-gradient(135deg, rgba(255, 194, 85, 0.92), rgba(185, 91, 39, 0.78));
		filter: drop-shadow(0 0 5px rgba(255, 178, 81, 0.28));
		opacity: 0;
		transform: rotate(20deg);
	}

	.leaf-one {
		left: 25%;
		animation: leafDrift 13s ease-in-out infinite;
	}

	.leaf-two {
		left: 55%;
		animation: leafDrift 17s ease-in-out 3.2s infinite;
	}

	.leaf-three {
		left: 80%;
		animation: leafDrift 15s ease-in-out 6.8s infinite;
	}

	.companion-media:not([data-season='autumn']) .drifting-leaf {
		display: none;
	}

	.snowflake {
		top: -8%;
		width: 0.36rem;
		height: 0.36rem;
		border-radius: 999px;
		background: rgba(245, 252, 255, 0.9);
		box-shadow: 0 0 9px rgba(196, 232, 255, 0.64);
		opacity: 0;
	}

	.snow-one {
		left: 20%;
		animation: snowFall 14s linear infinite;
	}

	.snow-two {
		left: 52%;
		animation: snowFall 18s linear 2.8s infinite;
	}

	.snow-three {
		left: 82%;
		animation: snowFall 16s linear 6s infinite;
	}

	.companion-media:not([data-season='winter']) .snowflake {
		display: none;
	}

	.distant-bird {
		top: 23%;
		left: -8%;
		width: 1.9rem;
		height: 0.75rem;
		opacity: 0;
	}

	.distant-bird::before,
	.distant-bird::after {
		content: '';
		position: absolute;
		top: 0.2rem;
		width: 0.9rem;
		height: 0.38rem;
		border-top: 2px solid rgba(41, 63, 56, 0.38);
		border-radius: 999px 999px 0 0;
	}

	.distant-bird::before {
		left: 0;
		transform: rotate(-12deg);
	}

	.distant-bird::after {
		right: 0;
		transform: rotate(12deg);
	}

	.bird-one {
		animation: birdGlide 22s ease-in-out 5s infinite;
	}

	.companion-media[data-time='night'] .distant-bird,
	.companion-media[data-season='winter'] .distant-bird {
		display: none;
	}

	.companion-copy {
		padding: 1rem 1.5rem 1.2rem;
	}

	.companion-copy h2 {
		margin: 0 0 0.35rem;
		font-size: 1.15rem;
		color: var(--color-dashboard-text);
	}

	.companion-copy p {
		margin: 0;
		color: var(--color-dashboard-text-muted);
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.summary-stats {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.summary-stat {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 1rem 1.1rem;
		border-radius: 12px;
		background: color-mix(in srgb, var(--color-dashboard-surface-strong, #ffffff) 70%, transparent);
		border: 1px solid var(--color-dashboard-border);
	}

	.summary-stat-number {
		font-size: 1.6rem;
		font-weight: 700;
		line-height: 1.1;
		color: var(--color-dashboard-text);
	}

	.summary-stat-label {
		font-size: 0.8rem;
		color: var(--color-dashboard-text-muted);
	}
    @media (min-width: 861px) {
	.companion-card {
		padding: 0;
	}

	.companion-media {
		height: 320px;
		aspect-ratio: auto;
	}

	.companion-media img {
		object-position: 50% 50%;
	}

	.companion-copy {
		padding: 1.2rem 1.75rem 1.4rem;
	}
}
	@media (max-width: 860px) {
		.framsteg-layout {
			grid-template-columns: 1fr;
		}

		.framsteg-column {
			position: static;
			order: -1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.companion-media img,
		.sky-glow,
		.lake-mist,
		.meteor,
		.water-shimmer,
		.fox-breath,
		.drifting-leaf,
		.snowflake,
		.distant-bird,
		.firefly,
		.card-placeholder {
			animation: none !important;
		}

		.companion-media img {
			transform: none;
			filter: none;
		}

		.living-world {
			display: none;
		}
	}

	.account-preview-content {
		position: relative;
	}

	.account-preview-content::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 3;
		border-radius: 8px;
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.24), rgba(248, 244, 232, 0.18)),
			rgba(255, 255, 255, 0.14);
		backdrop-filter: blur(2.5px);
		pointer-events: none;
	}

	.account-preview-content > :not(.progress-preview-note) {
		opacity: 0.68;
		filter: saturate(0.82);
		pointer-events: none;
		user-select: none;
	}

	.progress-preview-note {
		position: absolute;
		z-index: 4;
		top: clamp(1rem, 2vw, 1.35rem);
		right: clamp(1rem, 2vw, 1.35rem);
		width: min(28rem, calc(100% - 2rem));
	}

	.loading-state, .error-state { text-align: center; padding: 2rem 1rem; font-size: 1.05rem; }
	.loading-state { color: hsl(var(--muted-foreground)); }
	.error-state small { display: block; margin-top: 0.5rem; opacity: 0.9; font-size: 0.9rem; }

	/* Cards base */
	.card {
		background: hsl(var(--surface));
		border-radius: var(--radius-card);
		padding: 2.5rem;
		margin: 0;
		border: 1px solid var(--color-dashboard-border);
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
		transition: border-color 160ms ease, box-shadow 160ms ease;
	}
	.card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: color-mix(in srgb, var(--color-dashboard-border) 76%, var(--primary) 24%); }
	.card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.3rem; }
	.card-header h2 { font-size: 1.45rem; margin: 0; color: hsl(var(--foreground)); }
	.card-intro {
		max-width: 42rem;
		margin: 0.35rem 0 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.95rem;
		line-height: 1.6;
	}
	.icon-badge { width: 3.2rem; height: 3.2rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
	.insights-card,
	.heatmap-card { min-height: 25rem; }
	.card-placeholder {
		border-radius: 0.75rem;
		background:
			linear-gradient(90deg, hsl(var(--surface-muted)) 25%, hsl(var(--surface-soft)) 50%, hsl(var(--surface-muted)) 75%);
		background-size: 200% 100%;
		animation: cardPlaceholderShimmer 1.6s ease-in-out infinite;
	}
	.card-placeholder--insights { min-height: 12rem; }
	.card-placeholder--heatmap { min-height: 21rem; }

	@keyframes cardPlaceholderShimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	@keyframes companionWorldDrift {
		0% {
			transform: scale(1.018) translate3d(-0.4%, -0.25%, 0);
			filter: saturate(1.02) brightness(0.98);
		}
		50% {
			transform: scale(1.035) translate3d(0.35%, 0.18%, 0);
			filter: saturate(1.07) brightness(1.04);
		}
		100% {
			transform: scale(1.024) translate3d(0.7%, -0.18%, 0);
			filter: saturate(1.03) brightness(1);
		}
	}

	@keyframes skyPulse {
		0%, 100% { opacity: 0.38; transform: translate3d(-1%, 0, 0) scale(1); }
		50% { opacity: 0.68; transform: translate3d(1.2%, 1%, 0) scale(1.035); }
	}

	@keyframes meteorDrift {
		0%, 58% { opacity: 0; transform: translate3d(0, 0, 0) rotate(-35deg); }
		64% { opacity: 0.95; }
		78% { opacity: 0; transform: translate3d(-34vw, 22vw, 0) rotate(-35deg); }
		100% { opacity: 0; transform: translate3d(-34vw, 22vw, 0) rotate(-35deg); }
	}

	@keyframes lakeMistDrift {
		0%, 100% { opacity: 0.08; transform: translate3d(-4%, 0, 0) scaleX(0.95); }
		42% { opacity: 0.32; }
		70% { opacity: 0.18; transform: translate3d(5%, -4%, 0) scaleX(1.08); }
	}

	@keyframes waterShimmer {
		0%, 100% { opacity: 0; transform: translate3d(-8%, 0, 0) scaleX(0.72); }
		35% { opacity: 0.54; }
		68% { opacity: 0.12; transform: translate3d(18%, 0, 0) scaleX(1.08); }
	}

	@keyframes foxBreath {
		0%, 100% { opacity: 0.38; transform: scale(0.96) translate3d(0, 0, 0); }
		48% { opacity: 0.75; transform: scale(1.08) translate3d(-1.6%, -2%, 0); }
	}

	@keyframes fireflyFloat {
		0%, 100% { opacity: 0; transform: translate3d(0, 0, 0) scale(0.75); }
		18% { opacity: 0.72; }
		46% { opacity: 0.28; transform: translate3d(-1.4rem, -1.1rem, 0) scale(1); }
		72% { opacity: 0.82; transform: translate3d(0.8rem, -2rem, 0) scale(0.9); }
	}

	@keyframes leafDrift {
		0% { opacity: 0; transform: translate3d(0, 0, 0) rotate(15deg); }
		14% { opacity: 0.72; }
		52% { opacity: 0.58; transform: translate3d(-2.4rem, 14rem, 0) rotate(96deg); }
		100% { opacity: 0; transform: translate3d(1.8rem, 28rem, 0) rotate(176deg); }
	}

	@keyframes snowFall {
		0% { opacity: 0; transform: translate3d(0, 0, 0) scale(0.8); }
		12% { opacity: 0.62; }
		88% { opacity: 0.48; }
		100% { opacity: 0; transform: translate3d(2.2rem, 31rem, 0) scale(1.08); }
	}

	@keyframes birdGlide {
		0%, 18% { opacity: 0; transform: translate3d(0, 0, 0) scale(0.82); }
		26% { opacity: 0.46; }
		78% { opacity: 0.28; transform: translate3d(74vw, -2.8rem, 0) scale(0.92); }
		100% { opacity: 0; transform: translate3d(82vw, -3rem, 0) scale(0.92); }
	}

	/* Badge colors */
	.icon-badge.week { background: var(--theme-accent, #436e8f); }
	.icon-badge.milestone-leaf { background: linear-gradient(135deg, #7ea47c, #557c68); }
	.icon-badge.heat { background: linear-gradient(135deg, #6bcf7f, #4caf50); }
	.icon-badge.insight { background: linear-gradient(135deg, #667eea, #764ba2); }

	/* Weekly summary */
	.summary-card { background: var(--theme-bg, hsl(var(--surface-soft))); }
	.summary-text { font-size: 1.1rem; color: hsl(var(--foreground)); line-height: 1.7; margin: 0 0 0.75rem 0; }
	.encouragement { font-size: 0.95rem; color: hsl(var(--muted-foreground)); font-style: italic; margin: 0; }

	/* Overview */
	.overview-heading { font-size: 1.25rem; margin: 0 0 1.6rem 0; color: hsl(var(--foreground)); }
	.overview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1.4rem; margin-bottom: 1rem; }
	.overview-item { text-align: center; padding: 1rem 0.5rem; border-radius: 0.5rem; background: var(--theme-bg, hsl(var(--surface-soft))); }
	.overview-number { font-size: 2.6rem; font-weight: 700; color: var(--theme-accent, #436e8f); }
	.overview-number--text { font-size: 1.25rem; line-height: 1.2; }
	.overview-label { font-size: 0.85rem; color: hsl(var(--muted-foreground)); margin-top: 0.3rem; }

	/* Milestones */
	.milestones-section + .milestones-section { margin-top: 1.2rem; }
	.milestones-section-title {
		margin: 0 0 0.65rem;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0;
		color: hsl(var(--foreground));
	}
	.milestones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.2rem; }
	.milestone { min-height: 10rem; padding: 1.2rem; border-radius: 0.5rem; display: flex; align-items: flex-start; gap: 1rem; background: hsl(var(--surface-muted)); border: 1px solid var(--color-dashboard-border); transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease; }
	.milestone.achieved { background: var(--theme-bg, hsl(var(--success-surface))); border-color: var(--color-dashboard-border); }
	.milestone.resting { opacity: 0.78; }
	.milestone:hover { border-color: color-mix(in srgb, var(--color-dashboard-border) 72%, var(--theme-accent, #557c68) 28%); box-shadow: 0 3px 10px rgba(0,0,0,0.06); }
	.milestone-mark {
		width: 1.65rem;
		height: 1.65rem;
		border-radius: 999px;
		flex: 0 0 auto;
		margin-top: 0.1rem;
		background:
			radial-gradient(circle at 35% 35%, rgba(255,255,255,0.55), transparent 38%),
			linear-gradient(135deg, #b8c9a7, #6f8f73);
		box-shadow: inset 0 -2px 5px rgba(38, 62, 42, 0.18);
	}
	.milestone-copy h4 { margin: 0 0 0.35rem; color: hsl(var(--foreground)); font-size: 0.98rem; font-weight: 650; }
	.milestone-copy p { margin: 0; color: hsl(var(--muted-foreground)); font-size: 0.86rem; line-height: 1.5; }
	.next-milestone { background: hsl(var(--surface-soft)); border: 1px solid var(--color-dashboard-border); padding: 1.5rem; border-radius: 0.5rem; margin-top: 1.5rem; }
	.next-header { display: flex; align-items: center; gap: 0.5rem; color: var(--theme-accent, #557c68); font-weight: 600; margin-bottom: 0.75rem; }
	.next-milestone h3 { margin: 0 0 0.45rem; color: hsl(var(--foreground)); font-size: 1.05rem; }
	.next-milestone p { font-size: 1rem; color: hsl(var(--muted-foreground)); margin: 0.5rem 0 0.75rem 0; line-height: 1.6; }
	.next-milestone small { color: hsl(var(--muted-foreground)); display: block; line-height: 1.5; }

	/* Heatmap */
	.heatmap-card { overflow-x: auto; }
	.heatmap-description { color: hsl(var(--muted-foreground)); font-size: 0.95rem; margin: 0 0 1.5rem 0; }

	/* Insights */
	.summary-box { margin-bottom: 1rem; padding: 1rem; border-radius: 0.5rem; background: hsl(var(--surface-muted)); border: 1px solid var(--color-dashboard-border); }
	.summary-box p { margin: 0; color: hsl(var(--foreground)); line-height: 1.6; }
	.insights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.2rem; }
	.insight-item { padding: 1.5rem; border-radius: 0.5rem; display: flex; align-items: center; gap: 1rem; border: 1px solid var(--color-dashboard-border); background: hsl(var(--surface-muted)); transition: all 0.2s ease; }
	.insight-item.best { background: var(--theme-bg, hsl(var(--surface-soft))); border-color: var(--color-dashboard-border); }
	.insight-item.worst { background: hsl(var(--error-surface)); border-color: hsl(var(--error-foreground) / 0.24); }
	.insight-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
	.insight-content h3 { margin: 0 0 0.25rem 0; font-size: 0.9rem; color: hsl(var(--muted-foreground)); text-transform: uppercase; letter-spacing: 0.5px; }
	.day-name { margin: 0; font-size: 1.2rem; font-weight: 600; color: hsl(var(--foreground)); }
	.insight-content small { color: hsl(var(--muted-foreground)); font-size: 0.85rem; }
	.patterns-list { list-style: none; padding: 0; margin: 0; }
	.patterns-list li { display: flex; align-items: center; padding: 0.75rem; background: hsl(var(--surface-muted)); border-radius: 0.25rem; margin-bottom: 0.5rem; font-size: 0.95rem; }
	.pattern-text { color: hsl(var(--foreground)); font-weight: 500; }

	/* Empty state */
	.empty-state { text-align: center; padding: 3rem 2rem; background: var(--theme-bg, hsl(var(--surface-soft))); border: 1px dashed var(--color-dashboard-border); }
	.empty-state h2 { margin-top: 0; color: hsl(var(--foreground)); }
	.empty-state p { color: hsl(var(--muted-foreground)); margin: 1rem 0 1.5rem 0; line-height: 1.6; }
	.empty-state .auth-button { margin-top: 0.25rem; }

	@media (max-width: 640px) {
		.progress-preview-note {
			position: relative;
			top: auto;
			right: auto;
			width: 100%;
			margin-bottom: 0.25rem;
		}

		.card { padding: 1.5rem; }
		.card-header { flex-direction: column; align-items: flex-start; }
		.insights-card,
		.heatmap-card { min-height: 18rem; }
		.card-placeholder--heatmap { min-height: 14rem; }
		.milestones-grid { grid-template-columns: 1fr; }
		.insights-grid { grid-template-columns: 1fr; }
		.overview-grid { grid-template-columns: repeat(2, 1fr); }
		.overview-number { font-size: 1.8rem; }
		.icon-badge { width: 2.3rem; height: 2.3rem; }
	}
</style>


