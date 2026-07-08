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

	const companionImage =
		month >= 12 || month <= 2
			? '/images/avatars/presets/fox-winter.webp'
			: month >= 9 && month <= 11
				? '/images/avatars/presets/fox-autumn.webp'
				: hour >= 6 && hour < 18
					? '/images/avatars/presets/fox-morning.webp'
					: '/images/avatars/presets/fox-night.webp';

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
		if