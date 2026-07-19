<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount } from 'svelte';
	import { THEMES, THEME_STORAGE_KEY, getCachedTheme } from '$lib/theme';
	import { browser } from '$app/environment';
	import AccountTeaser from '$lib/components/AccountTeaser.svelte';
	import ActivityHeatmap from '$lib/components/ActivityHeatmap.svelte';
	import CompanionPose from '$lib/components/CompanionPose.svelte';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import LivingWorld from '$lib/components/LivingWorld.svelte';
	import {
		COMPANION_WORLD_SCENE_IMAGE,
		getProgressCompanionDayState,
		getProgressCompanionDayStateLabel,
		getProgressCompanionSeason,
		getProgressCompanionAnimal,
		getProgressCompanionArtId,
		type ProgressCompanionDayState,
		type ProgressCompanionSeason,
		type ProgressCompanionSelection
	} from '$lib/progressCompanion';
	import { getCompanionBasePose } from '$lib/companionPoseState';
	import {
		BEAR_SCENE_PLACEMENTS,
		WOLF_SCENE_PLACEMENTS,
		type CompanionPose as CompanionPoseData
	} from '$lib/companionPoseManifest';
	import { getLivingWorldScene } from '$lib/worldScene';
	import { trackMilestoneReachedOnce, trackStreakDayReachedOnce } from '$lib/analytics';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent,
		hasSensitiveConsent
	} from '$lib/consent';
	import { supabase } from '$lib/supabase';
	import { Leaf, TrendingUp, Lightbulb, Calendar, Heart } from 'lucide-svelte';

	let { data } = $props<{ data: PageData }>();

	type CompanionTimeOfDay = ProgressCompanionDayState;

	interface CompanionScene {
		image: string;
		season: ProgressCompanionSeason;
		timeOfDay: ProgressCompanionDayState;
		alt: string;
		copy: string;
		anonymousCopy: string;
	}

	let season = $state<ProgressCompanionSeason>(getProgressCompanionSeason());
	let timeOfDay = $state<CompanionTimeOfDay>(getProgressCompanionDayState());
	let companionPoseId = $state('idle');
	let companionBasePose = $state<CompanionPoseData | null>(null);
	const livingWorldScene = $derived(getLivingWorldScene({ season, timeOfDay }));

	function getCompanionPoseCopy(poseId: string, anonymous: boolean, companionId: 'fox' | 'bear' | 'wolf') {
		if (companionId === 'bear') {
			if (poseId.startsWith('sleep')) {
				return anonymous ? 'Björnen vilar lugnt medan platsen är stilla.' : 'Björnen vilar lugnt vid sjön.';
			}
			return anonymous ? 'Björnen håller platsen lugnt sällskap.' : 'Björnen håller dig lugnt sällskap.';
		}
		if (companionId === 'wolf') {
			return anonymous ? 'Vargen håller platsen stilla sällskap.' : 'Vargen håller dig stilla sällskap.';
		}
		if (poseId.startsWith('sleep')) {
			return anonymous ? 'Räven sover lugnt medan platsen vilar.' : 'Räven sover lugnt vid sjön.';
		}

		if (poseId === 'rest') {
			return anonymous ? 'Räven vilar lugnt medan platsen växer fram.' : 'Räven vilar lugnt vid sjön.';
		}

		if (poseId === 'drink') {
			return anonymous ? 'Räven har gått ner till vattnet medan platsen vilar.' : 'Räven har gått ner till vattnet.';
		}

		if (poseId === 'walk') {
			return anonymous ? 'Räven rör sig långsamt genom platsen.' : 'Räven går långsamt genom platsen.';
		}

		if (poseId === 'sniff') {
			return anonymous ? 'Räven nosar försiktigt i gräset.' : 'Räven nosar försiktigt vid strandkanten.';
		}

		if (poseId === 'stretch') {
			return anonymous ? 'Räven sträcker lugnt på sig.' : 'Räven sträcker lugnt på sig vid sjön.';
		}

		if (poseId === 'evening-lake' || poseId.startsWith('sit') || poseId.startsWith('look')) {
			return anonymous ? 'Räven sitter stilla och håller platsen sällskap.' : 'Räven sitter stilla och håller dig sällskap.';
		}

		return anonymous ? 'Räven håller platsen sällskap.' : 'Räven håller dig sällskap.';
	}

	const sceneCompanionId = $derived(
		getProgressCompanionArtId(
			getProgressCompanionAnimal(data.isAnonymous ? { id: 'fox' } : data.progressCompanion)?.id
		) === 'bear'
			? 'bear'
			: getProgressCompanionArtId(
				getProgressCompanionAnimal(data.isAnonymous ? { id: 'fox' } : data.progressCompanion)?.id
			) === 'wolf'
				? 'wolf'
				: 'fox'
	) as 'fox' | 'bear' | 'wolf';

	const companionScene = $derived<CompanionScene>({
		image: COMPANION_WORLD_SCENE_IMAGE,
		season,
		timeOfDay,
		alt: `Din följeslagare, ${sceneCompanionId === 'bear' ? 'björnen' : sceneCompanionId === 'wolf' ? 'vargen' : 'räven'}, vid sjön`,
		copy: getCompanionPoseCopy(companionPoseId, false, sceneCompanionId),
		anonymousCopy: getCompanionPoseCopy(companionPoseId, true, sceneCompanionId)
	});
	const bearProgressSceneStyle = $derived(
		sceneCompanionId === 'bear'
			? [
					`--bear-progress-scale: ${BEAR_SCENE_PLACEMENTS.progress.scale}`,
					`--bear-progress-bottom: ${BEAR_SCENE_PLACEMENTS.progress.bottom}`,
					`--bear-progress-right: ${BEAR_SCENE_PLACEMENTS.progress.right}`,
					`--bear-progress-ground-left: ${BEAR_SCENE_PLACEMENTS.progress.groundLeft}`,
					`--bear-progress-ground-top: ${BEAR_SCENE_PLACEMENTS.progress.groundTop}`,
					`--bear-progress-compact-scale: ${BEAR_SCENE_PLACEMENTS.progress.compact.scale}`,
					`--bear-progress-compact-bottom: ${BEAR_SCENE_PLACEMENTS.progress.compact.bottom}`,
					`--bear-progress-compact-right: ${BEAR_SCENE_PLACEMENTS.progress.compact.right}`,
					`--bear-progress-compact-ground-left: ${BEAR_SCENE_PLACEMENTS.progress.compact.groundLeft}`,
					`--bear-progress-compact-ground-top: ${BEAR_SCENE_PLACEMENTS.progress.compact.groundTop}`
				].join('; ')
			: undefined
	);
	const wolfProgressSceneStyle = $derived(
		sceneCompanionId === 'wolf'
			? [
					`--wolf-progress-scale: ${WOLF_SCENE_PLACEMENTS.progress.scale}`,
					`--wolf-progress-bottom: ${WOLF_SCENE_PLACEMENTS.progress.bottom}`,
					`--wolf-progress-right: ${WOLF_SCENE_PLACEMENTS.progress.right}`,
					`--wolf-progress-ground-left: ${WOLF_SCENE_PLACEMENTS.progress.groundLeft}`,
					`--wolf-progress-ground-top: ${WOLF_SCENE_PLACEMENTS.progress.groundTop}`,
					`--wolf-progress-compact-scale: ${WOLF_SCENE_PLACEMENTS.progress.compact.scale}`,
					`--wolf-progress-compact-bottom: ${WOLF_SCENE_PLACEMENTS.progress.compact.bottom}`,
					`--wolf-progress-compact-right: ${WOLF_SCENE_PLACEMENTS.progress.compact.right}`,
					`--wolf-progress-compact-ground-left: ${WOLF_SCENE_PLACEMENTS.progress.compact.groundLeft}`,
					`--wolf-progress-compact-ground-top: ${WOLF_SCENE_PLACEMENTS.progress.compact.groundTop}`
				].join('; ')
			: undefined
	);

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
		const updateCompanionTimeOfDay = () => {
			const now = new Date();
			timeOfDay = getProgressCompanionDayState(now);
			season = getProgressCompanionSeason(now);
			companionBasePose = getCompanionBasePose(
				now,
				browser ? window.localStorage : null,
				sceneCompanionId
			);
			companionPoseId = companionBasePose.id;
		};
		updateCompanionTimeOfDay();
		const companionTimeTimer = window.setInterval(updateCompanionTimeOfDay, 60 * 1000);
		const cleanupCompanionTime = () => window.clearInterval(companionTimeTimer);

		if (isAnonymous) {
			progressLoaded = true;
			insightsVisible = true;
			heatmapVisible = true;
			if (browser) {
				localStorage.setItem(THEME_STORAGE_KEY, profileTheme);
			}
			return cleanupCompanionTime;
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
			return cleanupCompanionTime;
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
			cleanupCompanionTime();
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
					<section
						class="companion-banner"
						aria-label={`Följeslagarscen, ${getProgressCompanionDayStateLabel(companionScene.timeOfDay)}`}
					>
			<div
				class="companion-media"
				data-season={companionScene.season}
				data-time={companionScene.timeOfDay}
				data-companion={sceneCompanionId}
				data-pose={companionBasePose?.id}
				style={bearProgressSceneStyle ?? wolfProgressSceneStyle}
			>
				<img
					class="companion-world-scene"
					src={companionScene.image}
					alt=""
					aria-hidden="true"
					loading="eager"
					decoding="async"
				/>
				<span class="companion-ground-shadow" aria-hidden="true"></span>
				<CompanionPose class="progress-companion-pose" basePose={companionBasePose} companionId={sceneCompanionId} decorative />
				<span class="companion-foreground-edge" aria-hidden="true"></span>
				<LivingWorld scene={livingWorldScene} class="progress-living-world" />
				<span class="progress-ripple progress-ripple--one" aria-hidden="true"></span>
				<span class="progress-ripple progress-ripple--two" aria-hidden="true"></span>
			<div class="companion-copy">
				<span class="companion-eyebrow">{getProgressCompanionDayStateLabel(companionScene.timeOfDay)}</span>
				<h2>Din resa</h2>
				<p>
					{isAnonymous
						? companionScene.anonymousCopy
						: companionScene.copy}
				</p>
			</div>
			</div>
					</section>
	<div class="framsteg-layout">
	<div class="framsteg-main">

		<!-- ── Aktivitetskarta ── -->
		<section class="card heatmap-card" bind:this={heatmapCardEl}>
			<div class="card-header">
				<div class="icon-badge heat"><TrendingUp size={24} /></div>
				<h2>Din aktivitetsöversikt</h2>
			</div>
			<p class="heatmap-description">Varje markering är en dag. Färgen visar hur mycket du skrev i dagboken.</p>
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
						<div class="summary-stat" class:summary-stat--growth={Boolean(streakData)}>
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
	.journey-container { display: grid; gap: 20px; }

	.framsteg-page {
		padding: 30px 3rem 40px;
	}

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
		gap: 20px;
	}

	.framsteg-shell {
		width: min(1440px, 100%);
		max-width: none;
	}

	.framsteg-shell + .framsteg-shell {
		margin-top: 28px;
	}

	.framsteg-page .auth-hero {
		padding: 0.25rem 0;
	}

	.framsteg-layout {
		display: grid;
		grid-template-columns: minmax(0, 1.5fr) minmax(360px, 1fr);
		gap: 20px;
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

	.companion-banner {
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--color-dashboard-border) 82%, transparent);
		border-radius: 14px;
		background: #0d1727;
	}

	.companion-media {
		position: relative;
		--scene-background: 0;
		--scene-midground: 1;
		--scene-ambient: 2;
		--scene-companion: 3;
		--scene-foreground: 4;
		--scene-overlay: 5;
		width: 100%;
		height: clamp(220px, 22vw, 300px);
		overflow: hidden;
		background: #0d1727;
		isolation: isolate;
	}

	.companion-media::before,
	.companion-media::after {
		content: '';
		position: absolute;
		pointer-events: none;
	}

	.companion-media::before {
		top: -2%;
		right: -1%;
		z-index: var(--scene-midground);
		width: 30%;
		height: 27%;
		background:
			radial-gradient(ellipse at 38% 28%, rgb(92 120 62 / 0.16), transparent 62%),
			radial-gradient(ellipse at 72% 16%, rgb(131 151 82 / 0.13), transparent 60%);
		filter: blur(1.5px);
		opacity: 0.48;
		transform-origin: 72% 0%;
		animation: progressCanopyDrift 8.5s ease-in-out infinite alternate;
	}

	.companion-media::after {
		inset: auto 0 0;
		z-index: var(--scene-foreground);
		height: 47%;
		background: linear-gradient(
			180deg,
			transparent 0%,
			rgb(5 12 22 / 0.14) 32%,
			rgb(5 12 22 / 0.68) 100%
		);
	}

	.companion-world-scene {
		position: relative;
		z-index: var(--scene-background);
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: 70% 64%;
		display: block;
		transform: scale(1.018);
		animation: companionWorldDrift 18s ease-in-out infinite alternate;
		will-change: transform, filter;
	}

	.companion-media :global(.progress-living-world) {
		z-index: var(--scene-ambient);
	}

	.companion-media[data-time='evening'] .companion-world-scene {
		filter: saturate(0.96) brightness(0.96) sepia(0.04);
	}

	.companion-media[data-time='night'] .companion-world-scene {
		filter: saturate(1.04) brightness(0.95);
	}

	.companion-media :global(.progress-companion-pose) {
		position: absolute;
		right: 21%;
		bottom: 32%;
		z-index: var(--scene-companion);
		width: clamp(42px, 9%, 64px);
		--companion-grade: saturate(0.7) contrast(0.88) brightness(0.94) sepia(0.14)
			hue-rotate(-3deg);
	}

	.companion-media[data-companion='bear'] :global(.progress-companion-pose) {
		right: var(--bear-progress-right);
		bottom: var(--bear-progress-bottom);
		transform: scale(var(--bear-progress-scale));
		transform-origin: 50% 100%;
	}

	.companion-media[data-companion='wolf'] :global(.progress-companion-pose) {
		right: var(--wolf-progress-right);
		bottom: var(--wolf-progress-bottom);
		transform: scale(var(--wolf-progress-scale));
		transform-origin: 50% 100%;
	}

	.companion-media[data-companion='bear'] :global(.progress-companion-pose[data-pose='bear-sleeping']) {
		width: clamp(50px, 11.2%, 74px);
		bottom: 27.8%;
	}

	.companion-media[data-companion='bear'] :global(.progress-companion-pose[data-pose='bear-stretching']) {
		right: 20.2%;
		bottom: 28.8%;
	}

	.companion-media[data-companion='bear'] .companion-ground-shadow {
		left: var(--bear-progress-ground-left);
		top: var(--bear-progress-ground-top);
		width: clamp(56px, 10.8%, 98px);
		height: clamp(9px, 1.45vw, 15px);
		opacity: 0.62;
		transform: translate3d(-50%, -50%, 0) rotate(-8deg) skewX(-18deg) scaleX(1.28);
	}

	.companion-media[data-companion='wolf'] .companion-ground-shadow {
		left: var(--wolf-progress-ground-left);
		top: var(--wolf-progress-ground-top);
		width: clamp(42px, 7.4%, 72px);
		height: clamp(5px, 0.7vw, 8px);
		filter: blur(4.5px);
		opacity: 0.28;
		transform: translate3d(-50%, -50%, 0) rotate(-5deg) skewX(-12deg) scaleX(1.12);
	}

	.companion-media[data-companion='wolf'] .companion-foreground-edge {
		left: var(--wolf-progress-ground-left);
		top: calc(var(--wolf-progress-ground-top) + 0.55%);
		width: clamp(50px, 7.9%, 78px);
		height: clamp(7px, 1.1vw, 12px);
		background:
			radial-gradient(ellipse at center, rgb(226 238 231 / 0.22), transparent 66%),
			linear-gradient(90deg, transparent, rgb(219 234 227 / 0.18) 45% 58%, transparent);
		filter: blur(0.6px);
		opacity: 0.42;
		mix-blend-mode: screen;
	}

	.companion-media[data-companion='bear'][data-pose='bear-sleeping'] .companion-ground-shadow {
		top: 65.2%;
		width: clamp(62px, 12%, 106px);
	}

	.companion-media[data-companion='bear'][data-pose='bear-stretching'] .companion-ground-shadow {
		left: 66.1%;
		top: 65.1%;
	}

	.companion-media[data-time='evening'] :global(.progress-companion-pose) {
		--companion-grade: saturate(0.68) contrast(0.88) brightness(0.88) sepia(0.18)
			hue-rotate(-6deg);
	}

	.companion-media[data-companion='wolf'][data-time='evening'] :global(.progress-companion-pose) {
		--companion-grade: saturate(0.62) contrast(0.84) brightness(0.84) sepia(0.21)
			hue-rotate(-8deg) blur(0.12px);
	}

	.companion-media[data-time='night'] :global(.progress-companion-pose) {
		--companion-grade: saturate(0.55) contrast(0.84) brightness(0.72) sepia(0.14)
			hue-rotate(5deg);
	}

	.companion-media :global(.progress-companion-pose .companion-pose-image) {
		filter: var(--companion-grade) drop-shadow(0 7px 8px rgb(37 31 20 / 0.1));
		-webkit-mask-image: radial-gradient(ellipse at 50% 52%, #000 72%, rgb(0 0 0 / 0.88) 89%, transparent 100%);
		mask-image: radial-gradient(ellipse at 50% 52%, #000 72%, rgb(0 0 0 / 0.88) 89%, transparent 100%);
	}

	/* Vargbilden är redan frilagd. Låt dess egen alpha-kant möta skuggan och
	 * förgrunden, i stället för att lägga på den generella panoramamasken. */
	.companion-media[data-companion='wolf'] :global(.progress-companion-pose .companion-pose-image) {
		-webkit-box-reflect: below -22%
			linear-gradient(to bottom, rgb(0 0 0 / 0.2), rgb(0 0 0 / 0.08) 38%, transparent 76%);
		-webkit-mask-image: none;
		mask-image: none;
	}

	.companion-ground-shadow,
	.companion-foreground-edge {
		position: absolute;
		pointer-events: none;
	}

	.companion-ground-shadow {
		left: 66.9%;
		top: 64%;
		z-index: var(--scene-ambient);
		width: clamp(48px, 9.2%, 88px);
		height: clamp(8px, 1.3vw, 14px);
		border-radius: 52% 48% 58% 42%;
		background:
			radial-gradient(ellipse at 45% 58%, rgb(28 31 20 / 0.28), transparent 62%),
			linear-gradient(88deg, transparent 0%, rgb(41 43 27 / 0.16) 32%, rgb(31 34 22 / 0.18) 58%, transparent 100%);
		filter: blur(4.5px);
		opacity: 0.58;
		transform: translate3d(-50%, -50%, 0) rotate(-8deg) skewX(-18deg) scaleX(1.18);
		transform-origin: 44% 50%;
		mix-blend-mode: multiply;
	}

	.companion-foreground-edge {
		left: 66.6%;
		top: 64.1%;
		z-index: var(--scene-foreground);
		width: clamp(58px, 9.4%, 92px);
		height: clamp(18px, 3vw, 32px);
		background:
			radial-gradient(38% 20% at 26% 78%, rgb(58 67 43 / 0.38), transparent 72%),
			radial-gradient(36% 18% at 72% 82%, rgb(84 86 59 / 0.26), transparent 74%),
			linear-gradient(78deg, transparent 0 20%, rgb(61 81 46 / 0.34) 21% 23%, transparent 24%),
			linear-gradient(96deg, transparent 0 39%, rgb(79 97 54 / 0.3) 40% 42%, transparent 43%),
			linear-gradient(82deg, transparent 0 58%, rgb(50 70 42 / 0.34) 59% 61%, transparent 62%);
		filter: blur(0.18px);
		opacity: 0.68;
		transform: translate3d(-50%, -50%, 0) rotate(-8deg) skewX(-8deg);
		mix-blend-mode: multiply;
	}

	.progress-ripple {
		position: absolute;
		z-index: var(--scene-ambient);
		display: block;
		width: clamp(34px, 6.5%, 58px);
		aspect-ratio: 2.9 / 1;
		border: 1px solid rgb(238 251 248 / 0.3);
		border-radius: 50%;
		background: radial-gradient(ellipse at center, rgb(255 255 255 / 0.1), transparent 68%);
		filter: blur(0.2px);
		opacity: 0;
		transform: translate3d(-50%, -50%, 0) scale(0.55);
		pointer-events: none;
		animation: progressWaterRipple 12.5s ease-out infinite;
	}

	.progress-ripple--one {
		left: 49%;
		top: 56%;
		animation-delay: -2.4s;
	}

	.progress-ripple--two {
		left: 56%;
		top: 59%;
		width: clamp(26px, 5%, 46px);
		opacity: 0;
		animation-duration: 16.5s;
		animation-delay: -8.8s;
	}

	.companion-media :global(.progress-companion-pose)::before {
		content: '';
		position: absolute;
		z-index: -1;
		left: 17%;
		bottom: 9%;
		width: 58%;
		height: 6%;
		border-radius: 50%;
		background: rgb(43 39 27 / 0.08);
		filter: blur(3px);
		transform: rotate(-4deg);
		pointer-events: none;
	}

	.companion-media :global(.progress-companion-pose)::after {
		content: '';
		position: absolute;
		z-index: 3;
		left: 14%;
		right: 8%;
		bottom: 4%;
		height: 16%;
		background:
			radial-gradient(32% 18% at 24% 80%, rgb(74 78 52 / 0.35), transparent 70%),
			radial-gradient(25% 14% at 68% 86%, rgb(96 93 66 / 0.22), transparent 72%),
			linear-gradient(82deg, transparent 0 17%, rgb(86 103 61 / 0.4) 18% 19%, transparent 20%),
			linear-gradient(98deg, transparent 0 42%, rgb(65 85 51 / 0.32) 43% 44%, transparent 45%),
			linear-gradient(76deg, transparent 0 60%, rgb(91 109 65 / 0.36) 61% 62%, transparent 63%);
		opacity: 0.36;
		pointer-events: none;
	}

	.companion-copy {
		position: absolute;
		left: clamp(1.25rem, 3.2vw, 2rem);
		right: clamp(1.25rem, 24vw, 13rem);
		bottom: clamp(1.15rem, 3vw, 2rem);
		z-index: var(--scene-overlay);
		padding: 0;
		text-shadow: 0 2px 14px rgb(0 0 0 / 0.42);
	}

	.companion-eyebrow {
		display: block;
		margin-bottom: 0.2rem;
		color: rgb(255 250 242 / 0.76);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.companion-copy h2 {
		margin: 0 0 0.35rem;
		font-size: clamp(1rem, 1.5vw, 1.18rem);
		color: #fffaf2;
	}

	.companion-copy p {
		margin: 0;
		max-width: 36rem;
		color: rgb(247 244 234 / 0.86);
		font-size: 0.84rem;
		line-height: 1.4;
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

	.summary-stat--growth {
		grid-column: 1 / -1;
	}

	@media (min-width: 981px) {
	.companion-media {
		height: clamp(240px, 20vw, 300px);
	}

	.companion-world-scene {
		object-position: 50% 50%;
	}

	.companion-copy {
		right: clamp(1.5rem, 22vw, 13rem);
	}
}
	@media (max-width: 980px) {
		.framsteg-page {
			padding: 24px 22px 20px;
		}

		.framsteg-layout {
			grid-template-columns: 1fr;
		}

		.framsteg-column {
			position: static;
			order: -1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.companion-world-scene,
		.card-placeholder,
		.companion-media::before,
		.progress-ripple {
			animation: none !important;
		}

		.companion-world-scene {
			transform: none;
			filter: none;
		}

		.companion-media::before,
		.progress-ripple {
			opacity: 0 !important;
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
	.heatmap-card,
	.progress-summary-card { min-height: 25rem; }
	.progress-summary-card { box-sizing: border-box; }
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

	@keyframes progressCanopyDrift {
		0% {
			transform: translate3d(0, 0, 0) rotate(0deg);
		}
		100% {
			transform: translate3d(-2px, 1px, 0) rotate(-0.7deg);
		}
	}

	@keyframes progressWaterRipple {
		0%,
		47% {
			opacity: 0;
			transform: translate3d(-50%, -50%, 0) scale(0.52);
		}
		52% {
			opacity: 0.17;
		}
		70% {
			opacity: 0.05;
			transform: translate3d(-50%, -50%, 0) scale(1.18);
		}
		76%,
		100% {
			opacity: 0;
			transform: translate3d(-50%, -50%, 0) scale(1.34);
		}
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
		.framsteg-page {
			padding: 16px 14px 18px;
		}

		.framsteg-shell + .framsteg-shell {
			margin-top: 20px;
		}

		.companion-media { height: clamp(210px, 68vw, 260px); }

		.progress-preview-note {
			position: relative;
			top: auto;
			right: auto;
			width: 100%;
			margin-bottom: 0.25rem;
		}

		.card { padding: 1.5rem; }
		.companion-media::after { height: 62%; }
		.companion-media :global(.progress-companion-pose) {
			right: 20%;
			bottom: 31%;
			width: clamp(38px, 10%, 58px);
		}

		.companion-media[data-companion='bear'] :global(.progress-companion-pose) {
			right: var(--bear-progress-compact-right);
			bottom: var(--bear-progress-compact-bottom);
			transform: scale(var(--bear-progress-compact-scale));
		}

		.companion-media[data-companion='wolf'] :global(.progress-companion-pose) {
			right: var(--wolf-progress-compact-right);
			bottom: var(--wolf-progress-compact-bottom);
			transform: scale(var(--wolf-progress-compact-scale));
		}

		.companion-media[data-companion='bear'] :global(.progress-companion-pose[data-pose='bear-sleeping']) {
			bottom: 28.5%;
		}

		.companion-media[data-companion='bear'] .companion-ground-shadow {
			left: var(--bear-progress-compact-ground-left);
			top: var(--bear-progress-compact-ground-top);
		}

		.companion-media[data-companion='wolf'] .companion-ground-shadow {
			left: var(--wolf-progress-compact-ground-left);
			top: var(--wolf-progress-compact-ground-top);
		}
		.companion-ground-shadow {
			left: 70.8%;
			top: 64.1%;
			width: clamp(42px, 14%, 68px);
			height: 9px;
			filter: blur(4px);
			transform: translate3d(-50%, -50%, 0) rotate(-8deg) skewX(-16deg) scaleX(1.12);
		}
		.companion-foreground-edge {
			left: 70.5%;
			top: 64.2%;
			width: clamp(52px, 17%, 82px);
			height: clamp(18px, 6vw, 30px);
		}
		.companion-copy {
			left: 1.2rem;
			right: 5.5rem;
			bottom: 1.1rem;
		}
		.companion-copy h2 { font-size: 1rem; }
		.companion-copy p { font-size: 0.8rem; line-height: 1.4; }
		.card-header { flex-direction: column; align-items: flex-start; }
		.insights-card,
		.heatmap-card,
		.progress-summary-card { min-height: 18rem; }
		.card-placeholder--heatmap { min-height: 14rem; }
		.milestones-grid { grid-template-columns: 1fr; }
		.insights-grid { grid-template-columns: 1fr; }
		.overview-grid { grid-template-columns: repeat(2, 1fr); }
		.overview-number { font-size: 1.8rem; }
		.icon-badge { width: 2.3rem; height: 2.3rem; }
	}
</style>


