<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount } from 'svelte';
	import { THEMES, THEME_STORAGE_KEY, getCachedTheme } from '$lib/theme';
	import { browser } from '$app/environment';
	import AccountTeaser from '$lib/components/AccountTeaser.svelte';
	import ActivityHeatmap from '$lib/components/ActivityHeatmap.svelte';
	import CompanionPose from '$lib/components/CompanionPose.svelte';
	import CompanionPresenceTracker from '$lib/components/CompanionPresenceTracker.svelte';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import AmbientWorld from '$lib/components/world/AmbientWorld.svelte';
	import CompanionFriend from '$lib/components/world/CompanionFriend.svelte';
	import CompanionVisitor from '$lib/components/world/CompanionVisitor.svelte';
	import { page } from '$app/stores';
	import {
		PROGRESS_SCENE_SOURCES,
		PROGRESS_SCENE_CROSSFADE_MS,
		clearProgressSceneOutgoing,
		completeProgressSceneTransition,
		getProgressSceneBand,
		getProgressSceneLabel,
		parseProgressSceneOverride,
		prepareProgressSceneTransition,
		type ProgressSceneBand,
		type ProgressSceneTransitionState
	} from '$lib/progressScene';
	import {
		getProgressCompanionDayState,
		getProgressCompanionDisplayName,
		getProgressCompanionSeason,
		getProgressCompanionAnimal,
		getProgressCompanionArtId,
		getWorldCompanionId,
		type ProgressCompanionDayState,
		type ProgressCompanionSeason,
		type ProgressCompanionSelection
	} from '$lib/progressCompanion';
	import { getCompanionBasePose } from '$lib/companionPoseState';
	import {
		type CompanionId,
		type CompanionPose as CompanionPoseData
	} from '$lib/companionPoseManifest';
	import {
		getProgressCabinPlacement,
		getProgressCabinPlacementStyle,
		getProgressCompanionPlacementStyle,
		type ProgressCabinPlacement
	} from '$lib/progressCompanionPlacement';
	import { getGardenGrowthPoints, getLivingWorldScene, getGrowthLevel } from '$lib/worldScene';
	import WorldMarks from '$lib/components/world/WorldMarks.svelte';
	import {
		buildWorldPresence,
		getDaysSinceLastVisit,
		getWorldGrowthLevel,
		getCompanionMark,
		getWorldMarks,
		getWorldReturnCopy,
		getWorldStage,
		readLastVisit,
		recordVisit,
		type CompanionMarkBox
	} from '$lib/world/worldStage';
	import { getLivingWorldReflectionCopy } from '$lib/livingWorldCopy';
	import {
		trackInsightOpened,
		trackMilestoneReachedOnce,
		trackProgressViewOpened,
		trackStreakDayReachedOnce
	} from '$lib/analytics';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent,
		hasSensitiveConsent
	} from '$lib/consent';
	import { supabase } from '$lib/supabase';
	import RecentPeriodChart from '$lib/components/RecentPeriodChart.svelte';
	import {
		buildRecentPeriodView,
		buildHistoryActivity,
		toMoodSamples,
		CHART_FALLBACK_COPY,
		type ChartPoint,
		type MoodSample,
		type PeriodDays
	} from '$lib/progress-recent-period';
	import {
		buildPeriodAnalysis,
		buildMoodTimelineView,
		EMPTY_MOOD_COPY
	} from '$lib/progress-reflection';
	import { buildWeekSummary } from '$lib/progress-week-summary';
	import { buildHalfYearView } from '$lib/progress-half-year';
	import {
		EMPTY_SUPPORT_VIEW,
		SUPPORT_INTRO_COPY,
		SUPPORT_LEARNING_COPY,
		SUPPORT_LEARNING_DETAIL,
		getExampleTopics,
		getExamplesForTopic,
		readSupportPreferences,
		recordSupportResponse,
		selectVisibleSuggestions,
		type SupportPreferences,
		type SupportResponse,
		type SupportSuggestion,
		type SupportView
	} from '$lib/progress-support';
	import { Leaf, TrendingUp, Lightbulb, Calendar, Heart, ChevronDown } from 'lucide-svelte';

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
	// Landskapsbilden väljs på tid, inte filtreras fram. Egen state från
	// progressScene så bild och etikett alltid kommer ur samma spann.
	let sceneBand = $state<ProgressSceneBand>(getProgressSceneBand());
	// TILLFÄLLIG: ?scene=morning|day|afternoon|evening för okulär granskning.
	// Läses ur page-storen så den gäller redan vid serverrendering, utan flash.
	const sceneOverride = $derived(parseProgressSceneOverride($page.url.searchParams.get('scene')));
	const activeSceneBand = $derived(sceneOverride ?? sceneBand);
	let sceneTransition = $state<ProgressSceneTransitionState>({
		visibleBand: getProgressSceneBand(),
		pendingBand: null,
		outgoingBand: null
	});
	let clearSceneTransitionTimer: number | null = null;
	const visibleSceneSources = $derived(PROGRESS_SCENE_SOURCES[sceneTransition.visibleBand]);
	let companionPoseId = $state('idle');
	let companionBasePose = $state<CompanionPoseData | null>(null);
	const companionRelationshipStage = $derived(data.companionRelationshipStage ?? 0);

	function prepareSceneTransition(nextBand: ProgressSceneBand) {
		sceneTransition = prepareProgressSceneTransition(sceneTransition, nextBand);
	}

	function revealPreparedScene(loadedBand: ProgressSceneBand) {
		const next = completeProgressSceneTransition(sceneTransition, loadedBand);
		if (next === sceneTransition) return;
		if (clearSceneTransitionTimer !== null) window.clearTimeout(clearSceneTransitionTimer);
		sceneTransition = next;
		updateProgressCompanionPlacement();
		clearSceneTransitionTimer = window.setTimeout(() => {
			sceneTransition = clearProgressSceneOutgoing(sceneTransition);
			clearSceneTransitionTimer = null;
		}, PROGRESS_SCENE_CROSSFADE_MS + 80);
	}

	$effect(() => {
		prepareSceneTransition(activeSceneBand);
	});

	function getCompanionPoseCopy(poseId: string, anonymous: boolean, companionId: CompanionId) {
		const companionName = getProgressCompanionDisplayName(companionId);
		if (companionId === 'bear') {
			if (poseId.startsWith('sleep')) {
				return anonymous ? `${companionName} vilar lugnt medan platsen är stilla.` : `${companionName} vilar lugnt vid sjön.`;
			}
			return anonymous ? `${companionName} håller platsen lugnt sällskap.` : `${companionName} håller dig lugnt sällskap.`;
		}
		if (companionId === 'wolf') {
			return anonymous ? `${companionName} håller platsen stilla sällskap.` : `${companionName} håller dig stilla sällskap.`;
		}
		if (poseId.startsWith('sleep')) {
			return anonymous ? `${companionName} sover lugnt medan platsen vilar.` : `${companionName} sover lugnt vid sjön.`;
		}

		if (poseId === 'rest') {
			return anonymous ? `${companionName} vilar lugnt medan platsen växer fram.` : `${companionName} vilar lugnt vid sjön.`;
		}

		if (poseId === 'drink') {
			return anonymous ? `${companionName} har gått ner till vattnet medan platsen vilar.` : `${companionName} har gått ner till vattnet.`;
		}

		if (poseId === 'walk') {
			return anonymous ? `${companionName} rör sig långsamt genom platsen.` : `${companionName} går långsamt genom platsen.`;
		}

		if (poseId === 'sniff') {
			return anonymous ? `${companionName} nosar försiktigt i gräset.` : `${companionName} nosar försiktigt vid strandkanten.`;
		}

		if (poseId === 'stretch') {
			return anonymous ? `${companionName} sträcker lugnt på sig.` : `${companionName} sträcker lugnt på sig vid sjön.`;
		}

		if (poseId === 'evening-lake' || poseId.startsWith('sit') || poseId.startsWith('look')) {
			return anonymous ? `${companionName} sitter stilla och håller platsen sällskap.` : `${companionName} sitter stilla och håller dig sällskap.`;
		}

		return anonymous ? `${companionName} håller platsen sällskap.` : `${companionName} håller dig sällskap.`;
	}

	const sceneCompanionId = $derived(
		getWorldCompanionId(
			getProgressCompanionAnimal(data.isAnonymous ? { id: 'fox' } : data.progressCompanion)?.id
		)
	) as CompanionId;

	const companionScene = $derived<CompanionScene>({
		image: visibleSceneSources.fallback,
		season,
		timeOfDay,
		alt: `Din följeslagare, ${getProgressCompanionDisplayName(sceneCompanionId)}, vid sjön`,
		copy: getCompanionPoseCopy(companionPoseId, false, sceneCompanionId),
		anonymousCopy: getCompanionPoseCopy(companionPoseId, true, sceneCompanionId)
	});
	let progressPlacementStyle = $state('');
	const progressSceneStyle = $derived(
		`${progressPlacementStyle}${progressPlacementStyle ? '; ' : ''}--progress-scene-crossfade-duration: ${PROGRESS_SCENE_CROSSFADE_MS}ms`
	);
	// Stugan finns bara som motiv i scenbilden. Klickytan renderas därför bara
	// när den uppmätta rutan faktiskt syns i den aktuella beskärningen.
	let cabinPlacement = $state<ProgressCabinPlacement | null>(null);

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

	// Speglar exakt vad /api/diary/insights svarar. Endpointens kontraktstest
	// låser svaret till { analysis, support }, så inga andra fält får antas här.
	// Tidigare fanns aiSummary, bestDay, worstDay, insights och
	// emotionDistribution kvar i typen för en äldre presentation. Servern slutade
	// skicka dem, men typen påstod fortfarande att de fanns - och läsningen av
	// insights.length kastade därför TypeError så fort analysen laddats.
	interface InsightsResponse {
		analysis: ProgressAnalysisResponse;
		// Underlaget till "Kanske värt att prova". Byggs deterministiskt av samma
		// rader som analysen och följer med i samma svar.
		support?: SupportView | null;
	}

	interface ProgressInsight {
		id: string;
		category: string;
		title: string;
		description: string;
		evidence: string;
		confidence: 'strong' | 'moderate';
		rank: number;
	}

	interface ProgressAnalysisResponse {
		periodDays: PeriodDays;
		periodLabel: string;
		longPeriodSummary: string | null;
		coverage: {
			periodStart: string;
			periodEnd: string;
			entryCount: number;
			firstDate: string | null;
			latestDate: string | null;
			textEntryCount: number;
			activeDays: number;
			activeWeeks: number;
			coveredWeeks: number;
			coveredMonths: number;
			sparsePeriods: { id: string; label: string; kind: 'week' | 'month'; status: 'thin' | 'missing'; entryCount: number; activeDays: number }[];
			truncated: boolean;
		};
		moodSummary: { entryCount: number; activeDays: number; activeWeeks: number; mean: number | null; median: number | null; min: number | null; max: number | null; standardDeviation: number | null; lowShare: number | null; middleShare: number | null; highShare: number | null };
		monthly: { month: string; label: string; entryCount: number; activeDays: number; status: 'sufficient' | 'thin' | 'missing'; mean: number | null; median: number | null; standardDeviation: number | null }[];
		insights: ProgressInsight[];
		halfYearSummary: ProgressInsight[];
	}

	interface HeatmapResponse {
		data?: Record<string, number>;
		error?: string;
		totalEntries?: number;
	}

	interface MoodTimelineResponse {
		success?: boolean;
		data?: { date?: unknown; mood?: unknown }[];
	}

	interface ProgressCachePayload {
		streak: StreakData | null;
		milestones: MilestonesResponse | null;
		heatmap: HeatmapResponse | null;
		moodTimeline: MoodTimelineResponse | null;
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
		companionRelationshipStage?: 0 | 1 | 2 | 3 | 4;
		companionDaily?: { answeredDayCount: number } | null;
		isAnonymous?: boolean;
		/** Kontots skapandedatum. En av världens tidssignaler, aldrig visad som siffra. */
		accountCreatedAt?: string | null;
	}

	const ANONYMOUS_PREVIEW_STREAK: StreakData = {
		currentStreak: 0,
		longestStreak: 0,
		lastEntryDate: null,
		lastEntryDaysAgo: 0
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
		achieved: [],
		sections: [],
		nextMilestone: null,
		totalEntries: 0
	};
	const ANONYMOUS_PREVIEW_HEATMAP: Record<string, number> = {};

	// Utloggad vy använder aldrig exempelvärden som kan uppfattas som användarens.
	const ANONYMOUS_PREVIEW_MOOD_SAMPLES: MoodSample[] = [];

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
	let loadedMoodSamples = $state<MoodSample[]>([]);
	let moodTimelineLoading = $state(false);
	let selectedPeriod = $state<PeriodDays>(30);
	let selectedMoodPoint = $state<ChartPoint | null>(null);
	let historyOpen = $state(false);
	let heatmapError = $state('');
	let progressLoading = $state(false);
	let progressLoaded = $state(false);
	let progressError = $state('');
	let loadedInsightsData = $state<InsightsResponse | null>(null);
	let loadedInsightsPeriod = $state<PeriodDays | null>(null);
	let hasTrackedInsightOpened = false;
	let insightsLoading = $state(false);
	let insightsError = $state('');
	let hasSensitiveDataConsent = $state(browser ? hasSensitiveConsent() : false);
	let insightsVisible = $state(false);
	let heatmapVisible = $state(false);
	let heatmapCardEl = $state<HTMLElement | null>(null);
	const streakData = $derived(
		loadedStreakData ?? { currentStreak: 0, longestStreak: 0, lastEntryDate: null, lastEntryDaysAgo: 0 }
	);
	const milestonesData = $derived(
		loadedMilestonesData ?? { achieved: [], sections: [], nextMilestone: null, totalEntries: 0 }
	);
	// "Det som långsamt kan växa fram" får aldrig peka ut ett antal
	// sammanhängande dagar. En obruten rad som nästa steg är ett användningsmål,
	// inte en observation - och en dag utan inlägg blir då ett misslyckande.
	// Milstolpen finns kvar i listan och kan fortfarande uppnås; den lyfts bara
	// inte fram som något att sträva mot.
	const nextMilestone = $derived(
		milestonesData.nextMilestone && milestonesData.nextMilestone.metric !== 'longestStreak'
			? milestonesData.nextMilestone
			: null
	);
	const weeklyEntries = $derived(isAnonymous ? 3 : loadedWeeklyEntries);
	// Samma serverkälla som Dashboard: alla sparade rader i diary, utan tidsgräns.
	const entryCount = $derived(data.entryCount ?? 0);
	const livingWorldReflectionCopy = $derived(
		getLivingWorldReflectionCopy(isAnonymous ? undefined : entryCount)
	);
	const activeDays = $derived(isAnonymous ? 11 : loadedActiveDays);

	// ── Världens långsamma utveckling ──
	// Underlaget är enbart tid, återkomst och aktivitet. Inga humörvärden går in
	// här: hur användaren mår får aldrig avgöra hur platsen ser ut.
	const worldPresence = $derived(
		isAnonymous
			? buildWorldPresence({})
			: buildWorldPresence({
					heatmapData: loadedHeatmapData,
					moodDates: loadedMoodSamples.map((sample) => sample.date),
					entryCount,
					moodEntryCount: loadedMoodSamples.length,
					reflectionCount: data.companionDaily?.answeredDayCount ?? 0,
					accountCreatedAt: data.accountCreatedAt ?? null
				})
	);
	const worldStage = $derived(getWorldStage(worldPresence));
	// Ett besök ger samma små förskjutningar hela vägen; nästa besök ger andra.
	let visitSeed = $state<string | null>(null);
	let daysSinceLastVisit = $state<number | null>(null);
	// Serverrenderingen utgår från den breda scenen. De minsta spåren tas bort
	// först när klienten vet att vyn faktiskt är smal.
	let isNarrowViewport = $state(false);
	// Följeslagarens ruta mäts ur den renderade scenen. Placeringen varierar med
	// djur, pose och brytpunkt, så en fast koordinat skulle hamna fel.
	let sceneEl = $state<HTMLElement | null>(null);
	let companionMarkBox = $state<CompanionMarkBox | null>(null);
	const companionMark = $derived(getCompanionMark(worldPresence, companionMarkBox));
	const worldMarks = $derived([
		...getWorldMarks(worldPresence, { timeOfDay, narrow: isNarrowViewport }),
		...(companionMark ? [companionMark] : [])
	]);
	const worldReturnCopy = $derived(getWorldReturnCopy(worldPresence, daysSinceLastVisit));

	// Samma tillväxtunderlag som Dashboard, men kontinuitet får höja nivån:
	// någon som återvänder och registrerar utan att skriva långa texter ska också
	// få en rikare plats. Math.max gör steget enkelriktat - inget kan tas bort.
	const growthLevel = $derived(
		Math.max(
			getGrowthLevel(getGardenGrowthPoints(entryCount, data.companionDaily?.answeredDayCount ?? 0)),
			getWorldGrowthLevel(worldStage)
		)
	);
	// Växtnivån styr hur rik den beständiga världen är. Reaktiv: uppdateras när
	// loadProgressData() satt loadedGrowthLevel efter klientfetch.
	// De fyra landskapsbilderna har himlen inbakad: moln, sol och måne finns
	// redan i motivet. Lagren stängs därför av här - annars får kvällsbilden två
	// månar och morgon/eftermiddag två solar. Avstängningen är lokal via
	// features; Mitt Hem och Kvällsstugan väljer in moon/cloud själva och rörs
	// inte. Vatten, dimma, lövverk och drift är kvar som ambient rörelse.
	const livingWorldScene = $derived(
		getLivingWorldScene({
			season,
			timeOfDay,
			growthLevel,
			features: { cloud: false, sun: false, moon: false }
		})
	);
	const heatmapData = $derived(isAnonymous ? ANONYMOUS_PREVIEW_HEATMAP : loadedHeatmapData);
	const moodSamples = $derived(loadedMoodSamples);
	const moodTimeline = $derived(buildMoodTimelineView(moodSamples, selectedPeriod));
	const periodAnalysis = $derived(buildPeriodAnalysis(moodSamples, selectedPeriod));
	const historyActivity = $derived(buildHistoryActivity(heatmapData, moodSamples, selectedPeriod));
	// Utan något sparat material har underlagskortet inget att redovisa. Att räkna
	// upp nollor gör en tom sida till ett facit (docs/NORTH_STAR.md, "Ingen skuld").
	const hasHistoryMaterial = $derived(moodSamples.length > 0 || entryCount > 0);
	// Överblicken högst upp. Oberoende av periodvalet: den svarar alltid på den
	// senaste veckan, som annars inte hade någon yta alls på sidan.
	const weekSummary = $derived(buildWeekSummary(moodSamples));
	const progressAnalysis = $derived(loadedInsightsData?.analysis ?? null);
	// Servern har redan sorterat och begränsat listan. De här två vyerna delar
	// därför samma data utan någon egen klientrangordning.
	const primaryInsight = $derived(progressAnalysis?.insights[0] ?? null);
	const remainingInsights = $derived(progressAnalysis?.insights.slice(1) ?? []);
	const analysisPeriodSummary = $derived.by(() => {
		if (!progressAnalysis) return null;
		const count = progressAnalysis.coverage.entryCount;
		const label = count === 1 ? 'anteckning' : 'anteckningar';
		return `Baserat på ${count} ${label} under den valda perioden.`;
	});
	// Halvårsvyn härleds ur samma månadsblock som redan kommer från servern.
	// Modulen räknar inget nytt ur databasen och anropas bara för 180 dagar, så
	// 30- och 90-dagarsvyn är oförändrad.
	const halfYear = $derived.by(() => {
		if (!progressAnalysis || selectedPeriod !== 180) return null;
		return buildHalfYearView({
			months: progressAnalysis.monthly,
			truncated: progressAnalysis.coverage.truncated
		});
	});
	const sparseMonthCopy = $derived.by(() => {
		if (!progressAnalysis || selectedPeriod !== 180) return null;
		const labels = progressAnalysis.coverage.sparsePeriods
			.filter((period) => period.kind === 'month')
			.map((period) => period.label);
		if (labels.length === 0) return null;
		return `${labels.join(', ')} har begränsat underlag och väger därför mindre i analysen.`;
	});
	// Huvudvyn visar bara de starkast rankade insikterna. Beräkningen och
	// rangordningen sker server-side; här hålls endast det lokala visningsläget.
	let openAnalysisInsights = $state<Record<string, boolean>>({});
	let analysisBasisOpen = $state(false);
	function toggleAnalysisInsight(id: string) {
		openAnalysisInsights = { ...openAnalysisInsights, [id]: !openAnalysisInsights[id] };
	}
	const allMoodAverage = $derived.by(() => {
		if (moodSamples.length === 0) return null;
		return moodSamples.reduce((sum, sample) => sum + sample.mood, 0) / moodSamples.length;
	});
	const selectedMoodDifference = $derived(
		selectedMoodPoint && allMoodAverage !== null ? selectedMoodPoint.value - allMoodAverage : null
	);

	// ── Kanske värt att prova ──
	// Svaren är en preferenssignal som ligger lokalt hos användaren. De går
	// aldrig in i dagboken eller måendehistoriken.
	let supportPreferences = $state<SupportPreferences>({});
	let supportRotation = $state(0);
	let supportResponses = $state<Record<string, SupportResponse>>({});
	let supportExamplesOpen = $state(false);
	let supportSelectedTopic = $state<string | null>(null);

	const supportView = $derived(loadedInsightsData?.support ?? EMPTY_SUPPORT_VIEW);
	const supportSuggestions = $derived(
		selectVisibleSuggestions(supportView, supportPreferences, { rotation: supportRotation })
	);
	const supportExampleTopics = $derived(getExampleTopics(supportView));
	const supportExamples = $derived(getExamplesForTopic(supportView, supportSelectedTopic));
	// Vid akut risk visas ingenting. Sektionen är vardagligt reflektionsstöd och
	// ska aldrig försöka möta ett akut läge med en promenad eller en övning.
	// Ett misslyckat anrop får inte läsas som att underlaget saknas, så kortet
	// döljs hellre än att visa "vi lär fortfarande känna dina mönster".
	const showSupportCard = $derived(
		!supportView.withheldForSafety && !insightsError && (isAnonymous || hasSensitiveDataConsent)
	);

	function supportStorage() {
		return browser ? window.localStorage : null;
	}

	/**
	 * Läser förra besöket innan det här besöket skrivs över det, så en återkomst
	 * hinner märkas. Seeden lever i sessionStorage: samma flik ger samma värld
	 * hela vägen, en ny flik ger nästa besöks små variationer.
	 */
	function initWorldVisit() {
		if (!browser) return;
		const now = new Date();
		daysSinceLastVisit = getDaysSinceLastVisit(readLastVisit(window.localStorage), now);
		recordVisit(window.localStorage, now);

		const seedKey = 'mittpsyke:world-visit-seed:v1';
		const existing = window.sessionStorage.getItem(seedKey);
		if (existing) {
			visitSeed = existing;
			return;
		}
		const seed = window.crypto.randomUUID();
		window.sessionStorage.setItem(seedKey, seed);
		visitSeed = seed;
	}

	function respondToSuggestion(suggestion: SupportSuggestion, response: SupportResponse) {
		supportPreferences = recordSupportResponse(supportStorage(), suggestion.kind, response);
		supportResponses = { ...supportResponses, [suggestion.id]: response };
	}

	function showAnotherSuggestion() {
		supportRotation += 1;
		supportResponses = {};
	}

	/**
	 * Mäter var följeslagaren faktiskt hamnade och översätter rutan till procent
	 * av scenen. Misslyckas mätningen lämnas rutan tom, och då finns ingen
	 * träffyta alls — resten av scenen påverkas inte.
	 */
	function measureCompanionBox() {
		if (!browser || !sceneEl) return;
		const pose = sceneEl.querySelector('.progress-companion-pose');
		if (!(pose instanceof HTMLElement)) {
			companionMarkBox = null;
			return;
		}
		const sceneRect = sceneEl.getBoundingClientRect();
		const poseRect = pose.getBoundingClientRect();
		if (sceneRect.width <= 0 || sceneRect.height <= 0 || poseRect.width <= 0) {
			companionMarkBox = null;
			return;
		}
		companionMarkBox = {
			x: ((poseRect.left - sceneRect.left) / sceneRect.width) * 100,
			y: ((poseRect.top - sceneRect.top) / sceneRect.height) * 100,
			width: (poseRect.width / sceneRect.width) * 100,
			height: (poseRect.height / sceneRect.height) * 100
		};
	}

	/**
	 * Bildens crop och följeslagarens markpunkt räknas från samma originalbild.
	 * Inga procentvärden från hero-containern används här.
	 */
	function updateProgressCompanionPlacement(element = sceneEl) {
		if (!browser || !element) return;
		const { width, height } = element.getBoundingClientRect();
		const input = {
			scene: sceneTransition.visibleBand,
			containerWidth: width,
			containerHeight: height,
			viewportWidth: window.innerWidth
		};
		// Stugans klickyta mäts i samma svep som följeslagaren, ur samma
		// cover-geometri. Ingen extra observer, ingen andra sanning om cropen.
		cabinPlacement = getProgressCabinPlacement(input);
		progressPlacementStyle = [
			getProgressCompanionPlacementStyle({ ...input, companionId: sceneCompanionId }),
			getProgressCabinPlacementStyle(input)
		]
			.filter(Boolean)
			.join('; ');
	}

	function chooseSupportTopic(topic: string) {
		supportSelectedTopic = topic;
		supportExamplesOpen = true;
	}

	function toggleSupportExamples() {
		supportExamplesOpen = !supportExamplesOpen;
		if (supportExamplesOpen && !supportSelectedTopic) {
			supportSelectedTopic = supportExampleTopics[0] ?? null;
		}
	}

	function chooseMoodPoint(point: ChartPoint) {
		selectedMoodPoint = point;
	}

	function changePeriod(period: PeriodDays) {
		selectedPeriod = period;
		selectedMoodPoint = null;
		openAnalysisInsights = {};
		supportRotation = 0;
		if (!isAnonymous && hasSensitiveDataConsent && insightsVisible) void loadInsights();
	}

	// Hela sektionen "Din senaste tid" byggs av redan hämtad data.
	const recentPeriod = $derived(
		buildRecentPeriodView({
			samples: moodSamples,
			heatmapData,
			themes: null,
			hasConsent: isAnonymous || hasSensitiveDataConsent,
			periodDays: selectedPeriod
		})
	);
	const shouldShowHeatmap = $derived(isAnonymous || heatmapVisible);
	let loading = $derived(progressLoading && !progressLoaded);
	let error = $derived(progressError);

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
		loadedMoodSamples = toMoodSamples(payload.moodTimeline?.data);
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
			const [streakRes, milestonesRes, heatmapRes, moodTimelineRes] = await Promise.all([
				fetch('/api/diary/streak', { headers }),
				fetch('/api/diary/milestones', { headers }),
				fetch('/api/diary/heatmap', { headers }),
				fetch('/api/diary/stats-timeline', { headers })
			]);

			const [streakPayload, milestonesPayload, heatmapPayload, moodTimelinePayload] =
				await Promise.all([
					streakRes.ok ? streakRes.json() : null,
					milestonesRes.ok ? milestonesRes.json() : null,
					heatmapRes.ok ? heatmapRes.json() : null,
					moodTimelineRes.ok ? moodTimelineRes.json() : null
				]);

			const payload = {
				streak: streakPayload as StreakData | null,
				milestones: milestonesPayload as MilestonesResponse | null,
				heatmap: heatmapPayload as HeatmapResponse | null,
				moodTimeline: moodTimelinePayload as MoodTimelineResponse | null
			};
			applyProgressPayload(payload);
		} catch {
			progressError = 'Kunde inte ladda framsteg just nu.';
		} finally {
			progressLoading = false;
		}
	}

	async function loadMoodTimeline() {
		if (isAnonymous) return;
		moodTimelineLoading = true;

		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();
			if (!session?.access_token) return;

			const response = await fetch('/api/diary/stats-timeline', {
				headers: { Authorization: `Bearer ${session.access_token}` }
			});
			if (!response.ok) return;
			const payload = (await response.json()) as MoodTimelineResponse;
			loadedMoodSamples = toMoodSamples(payload.data);
		} catch {
			// Ett tomt läge är tryggare än en gissad kurva när tidslinjen inte går att läsa.
			loadedMoodSamples = [];
		} finally {
			moodTimelineLoading = false;
		}
	}

	function maybeLoadInsights() {
		if (
			isAnonymous ||
			!browser ||
			!hasSensitiveDataConsent ||
			!insightsVisible ||
			insightsLoading ||
			loadedInsightsPeriod === selectedPeriod
		) {
			return;
		}

		void loadInsights();
	}

	onMount(() => {
		// Enbart om vyn öppnades och om besökaren var inloggad. Ingen dagboksdata.
		trackProgressViewOpened({ signed_in: !isAnonymous });
		supportPreferences = readSupportPreferences(supportStorage());
		initWorldVisit();

		const narrowQuery = window.matchMedia('(max-width: 620px)');
		isNarrowViewport = narrowQuery.matches;
		const onNarrowChange = (event: MediaQueryListEvent) => {
			isNarrowViewport = event.matches;
		};
		narrowQuery.addEventListener('change', onNarrowChange);

		// Scenen ändrar storlek när bilden laddats och vid varje omritning. En
		// ResizeObserver håller både den synliga cropens markpunkt och följeslagarens
		// träffyta i synk med den verkliga renderade scenen.
		const sceneResizeObserver =
			typeof ResizeObserver !== 'undefined' && sceneEl
				? new ResizeObserver(() => {
					updateProgressCompanionPlacement();
					measureCompanionBox();
				})
				: null;
		if (sceneResizeObserver && sceneEl) sceneResizeObserver.observe(sceneEl);
		updateProgressCompanionPlacement();
		measureCompanionBox();

		const cleanupNarrowQuery = () => {
			narrowQuery.removeEventListener('change', onNarrowChange);
			sceneResizeObserver?.disconnect();
		};

		const updateCompanionTimeOfDay = () => {
			const now = new Date();
			timeOfDay = getProgressCompanionDayState(now);
			sceneBand = getProgressSceneBand(now);
			season = getProgressCompanionSeason(now);
			companionBasePose = getCompanionBasePose(
				now,
				browser ? window.localStorage : null,
				sceneCompanionId,
				'progress',
				'resting'
			);
			companionPoseId = companionBasePose.id;
		};
		updateCompanionTimeOfDay();
		const companionTimeTimer = window.setInterval(updateCompanionTimeOfDay, 60 * 1000);
		const cleanupSceneWatchers = () => {
			window.clearInterval(companionTimeTimer);
			if (clearSceneTransitionTimer !== null) window.clearTimeout(clearSceneTransitionTimer);
			cleanupNarrowQuery();
		};

		if (isAnonymous) {
			progressLoaded = true;
			insightsVisible = true;
			heatmapVisible = true;
			if (browser) {
				localStorage.setItem(THEME_STORAGE_KEY, profileTheme);
			}
			return cleanupSceneWatchers;
		}

		void loadMoodTimeline();
		hasSensitiveDataConsent = hasSensitiveConsent();
		if (browser) {
			localStorage.setItem(THEME_STORAGE_KEY, profileTheme);
		}
		insightsVisible = true;
		heatmapVisible = true;
		maybeLoadInsights();

		if (typeof IntersectionObserver === 'undefined') {
			return cleanupSceneWatchers;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;

					if (entry.target === heatmapCardEl) {
						heatmapVisible = true;
						observer.unobserve(entry.target);
					}
				}
			},
			{ rootMargin: '180px 0px' }
		);

		if (heatmapCardEl) observer.observe(heatmapCardEl);

		return () => {
			observer.disconnect();
			cleanupSceneWatchers();
		};
	});

	// Ny pose eller nytt djur betyder ny storlek och nytt läge i scenen.
	$effect(() => {
		// Bindningen sker efter första rendern; gör den reaktiv så den första
		// riktiga scenytan också får en placement, inte bara senare scenbyten.
		const renderedSceneEl = sceneEl;
		companionPoseId;
		sceneCompanionId;
		activeSceneBand;
		isNarrowViewport;
		updateProgressCompanionPlacement(renderedSceneEl);
		measureCompanionBox();
	});

	$effect(() => {
		if (hasSensitiveDataConsent && insightsVisible) {
			maybeLoadInsights();
		}
	});

	async function loadInsights() {
		if (insightsLoading) return;
		const requestedPeriod = selectedPeriod;

		insightsLoading = true;
		insightsError = '';

		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();

			if (!session?.access_token) {
				insightsError = 'Du behöver vara inloggad för att se din analys.';
				loadedInsightsData = null;
				return;
			}

			const insightsFetchController = new AbortController();
			const insightsFetchTimeout = setTimeout(() => {
				insightsFetchController.abort();
			}, 12000);

			const response = await fetch(`/api/diary/insights?period=${requestedPeriod}`, {
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

			if (!response.ok || !result || !('analysis' in result)) {
				insightsError =
					result && 'error' in result && typeof result.error === 'string'
						? result.error
						: 'Kunde inte ladda analysen just nu.';
				loadedInsightsData = null;
				loadedInsightsPeriod = null;
				return;
			}

			if (selectedPeriod !== requestedPeriod) return;
			loadedInsightsData = result;
			loadedInsightsPeriod = requestedPeriod;

			// Insikterna visades med innehåll. Endast fast typ, en boolean och ett
			// antal — aldrig sammanfattningen, temana eller humörvärdena.
			if (!hasTrackedInsightOpened) {
				const hasContent = result.analysis.insights.length > 0;
				if (hasContent) {
					hasTrackedInsightOpened = true;
					trackInsightOpened({
						insight_type: 'diary_insights',
						has_summary: result.analysis.halfYearSummary.length > 0,
						pattern_count: result.analysis.insights.length
					});
				}
			}
		} catch {
			insightsError = 'Kunde inte ladda analysen just nu.';
			loadedInsightsData = null;
		} finally {
			insightsLoading = false;
			if (selectedPeriod !== requestedPeriod) void loadInsights();
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

<SEO canonical="https://mittpsyke.se/framsteg" />
<CompanionPresenceTracker enabled={!data.isAnonymous} />

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
						? 'En förhandsvisning av hur flera sparade stunder kan göra sådant som återkommer eller förändras lättare att se.'
						: 'När flera stunder finns kvar kan sådant som återkommer eller förändras bli lättare att se.'}
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
						aria-label={`Följeslagarscen, ${getProgressSceneLabel(sceneTransition.visibleBand)}`}
					>
			<div
				class="companion-media"
				bind:this={sceneEl}
				data-season={companionScene.season}
				data-time={sceneTransition.visibleBand}
				data-companion={sceneCompanionId}
				data-pose={companionBasePose?.id}
				style={progressSceneStyle}
			>
				<!-- width/height ger proportionerna innan bilden laddats så scenen
					 inte hoppar till. fetchpriority="high" - detta är LCP-elementet. -->
					<!-- En egen bild per dygnsspann, med ljuset inbakat. Den synliga
						 bilden behålls tills nästa responsiva asset är klar, så scenen
						 aldrig blir tom under följeslagare eller world marks. -->
					{#if sceneTransition.outgoingBand}
						{@const outgoingSceneSources = PROGRESS_SCENE_SOURCES[sceneTransition.outgoingBand]}
						<img
							class="companion-world-scene companion-world-scene--outgoing"
							srcset={outgoingSceneSources.srcset}
							sizes="(max-width: 980px) calc(100vw - 44px), (max-width: 1536px) calc(100vw - 96px), 1440px"
							src={outgoingSceneSources.fallback}
							alt=""
							aria-hidden="true"
							width="1672"
							height="941"
							decoding="async"
						/>
					{/if}
					{#key sceneTransition.visibleBand}
						<img
							class:companion-world-scene--crossfading={sceneTransition.outgoingBand !== null}
							class="companion-world-scene companion-world-scene--visible"
							srcset={visibleSceneSources.srcset}
							sizes="(max-width: 980px) calc(100vw - 44px), (max-width: 1536px) calc(100vw - 96px), 1440px"
							src={visibleSceneSources.fallback}
							alt=""
							aria-hidden="true"
							width="1672"
							height="941"
							fetchpriority="high"
							loading="eager"
							decoding="async"
						/>
					{/key}
					{#if sceneTransition.pendingBand}
						{#each [sceneTransition.pendingBand] as pendingBand (pendingBand)}
							{@const pendingSceneSources = PROGRESS_SCENE_SOURCES[pendingBand]}
							<img
								class="companion-world-scene companion-world-scene--preload"
								srcset={pendingSceneSources.srcset}
								sizes="(max-width: 980px) calc(100vw - 44px), (max-width: 1536px) calc(100vw - 96px), 1440px"
								src={pendingSceneSources.fallback}
								alt=""
								aria-hidden="true"
								width="1672"
								height="941"
								loading="eager"
								decoding="async"
								onload={() => revealPreparedScene(pendingBand)}
							/>
						{/each}
					{/if}
				{#if cabinPlacement}
					<!-- Stugan är inbakad i scenbilden, så genvägen hem är en osynlig
						 länk lagd exakt över motivet. Ingen knapp, ingen etikett. -->
					<a
						class="progress-cabin-link"
						href="/dashboard"
						aria-label="Gå till Mitt Hem"
						data-testid="progress-cabin-link"
					></a>
				{/if}
				<span class="companion-ground-shadow" aria-hidden="true"></span>
				<CompanionPose
					class="progress-companion-pose"
					basePose={companionBasePose}
					companionId={sceneCompanionId}
					scene="progress"
					behaviourProfile="quiet"
					decorative
				/>
				<CompanionVisitor
					class="progress-companion-visitor"
					mainCompanionId={sceneCompanionId}
					isSleeping={timeOfDay === 'night' || companionBasePose?.id.includes('sleep') === true}
					scene="progress"
					sceneAllowsVisitor={true}
				/>
				<span class="companion-foreground-edge" aria-hidden="true"></span>
				<AmbientWorld scene={livingWorldScene} class="progress-living-world" relationshipStage={isAnonymous ? 0 : companionRelationshipStage} />
				<CompanionFriend class="progress-companion-friend" companionId={sceneCompanionId} stage={isAnonymous ? 0 : companionRelationshipStage} />
				<WorldMarks class="progress-world-marks" marks={worldMarks} {visitSeed} />
				<span class="progress-ripple progress-ripple--one" aria-hidden="true"></span>
				<span class="progress-ripple progress-ripple--two" aria-hidden="true"></span>
			<div class="companion-copy">
				<span class="companion-eyebrow">{getProgressSceneLabel(sceneTransition.visibleBand)}</span>
				<h2>Din plats idag</h2>
				<p>
					{isAnonymous
						? companionScene.anonymousCopy
						: companionScene.copy}
				</p>
				<p class="companion-reflection">{worldReturnCopy ?? livingWorldReflectionCopy}</p>
			</div>
			</div>
					</section>
	<div class="framsteg-layout framsteg-layout-v2">
		<div class="framsteg-main">
			<!-- Överblicken ligger först: den ska gå att läsa på några sekunder och
			     svarar på "hur har den senaste tiden sett ut?". Kurvan och analysen
			     under är fördjupningen. Inget här är beroende av AI eller samtycke -
			     det räknas fram ur humörvärden som redan är hämtade. -->
			<section class="card week-summary-card" aria-labelledby="week-summary-heading" data-testid="week-summary">
				<div class="card-header">
					<div class="icon-badge heat"><Calendar size={24} /></div>
					<h2 id="week-summary-heading">Den senaste veckan</h2>
				</div>
				<p class="week-summary-lead">{weekSummary.summary}</p>
				{#if weekSummary.comparisonText}
					<p class="week-summary-comparison">{weekSummary.comparisonText}</p>
				{:else if !weekSummary.insufficient}
					<p class="week-summary-note">
						Veckan innan har för få registreringar för en jämförelse.
					</p>
				{/if}
			</section>

			<section class="card recent-card" aria-labelledby="mood-history-heading" data-testid="mood-history">
				<div class="card-header">
					<div class="icon-badge heat"><TrendingUp size={24} /></div>
					<h2 id="mood-history-heading">Senaste tiden</h2>
				</div>
				<p class="recent-intro">Här syns bara de humörvärden du själv har satt i dagboken. Välj en punkt för att se den i sitt sammanhang.</p>
				{#if moodTimelineLoading}
					<p class="reflection-copy">Laddar dina sparade humörvärden.</p>
				{:else}
					<RecentPeriodChart
						points={moodTimeline.points}
						period={selectedPeriod}
						onSelectPeriod={changePeriod}
						selectedPointKey={selectedMoodPoint?.key}
						onSelectPoint={chooseMoodPoint}
						textAlternative={moodTimeline.textAlternative}
						hasChart={moodTimeline.hasChart}
						fallbackText={EMPTY_MOOD_COPY}
					/>
					{#if moodTimeline.hasChart && analysisPeriodSummary}
						<p class="recent-summary">{analysisPeriodSummary}</p>
					{/if}
					{#if selectedMoodPoint}
						<section class="chart-detail" aria-live="polite" aria-label="Detaljer för vald punkt">
							<strong>{selectedMoodPoint.fullLabel} · {selectedMoodPoint.value.toFixed(1).replace('.', ',')}/10</strong>
							{#if selectedMoodDifference !== null}
								<span>
									{selectedMoodDifference >= 0 ? '+' : ''}{selectedMoodDifference.toFixed(1).replace('.', ',')} jämfört med genomsnittet i tidslinjen.
								</span>
							{/if}
							<small>{selectedMoodPoint.count} {selectedMoodPoint.count === 1 ? 'registrering' : 'registreringar'} ligger bakom punkten.</small>
						</section>
					{/if}
				{/if}
			</section>

			<section class="card reflection-card analysis-card" aria-labelledby="analysis-heading" data-testid="mood-analysis">
				<div class="card-header">
					<div class="icon-badge insight"><Lightbulb size={24} /></div>
					<h2 id="analysis-heading">Det som börjar synas</h2>
				</div>
				<p class="analysis-intro">Samband som går att räkna fram ur dina egna registreringar.</p>
				{#if !isAnonymous && !hasSensitiveDataConsent}
					<ConsentGate
						title="Se analys av dina mönster"
						dataLabel="Dina sparade texter och humörvärden"
						serviceLabel="MittPsykes regelbaserade mönsteranalys"
						onAccept={acceptSensitiveDataConsent}
					/>
				{:else if insightsLoading}
					<p class="reflection-copy">Räknar bara på sådant som har tillräckligt underlag.</p>
				{:else if insightsError}
					<p class="reflection-copy">Det gick inte att hämta analysen just nu.</p>
				{:else if progressAnalysis}
					{#if progressAnalysis.coverage.truncated}
						<p class="analysis-coverage-note">Analysen bygger på en begränsad del av periodens anteckningar.</p>
					{/if}
					{#if primaryInsight}
						<section class="analysis-primary-insight" aria-labelledby="primary-insight-heading">
							<h3 id="primary-insight-heading">Det viktigaste just nu</h3>
							<p class="analysis-primary-title">{primaryInsight.title}</p>
							<p class="analysis-primary-conclusion">{primaryInsight.description}</p>
							<button
								type="button"
								class="analysis-more"
								aria-expanded={openAnalysisInsights[primaryInsight.id] === true}
								onclick={() => toggleAnalysisInsight(primaryInsight.id)}
							>
								{openAnalysisInsights[primaryInsight.id] ? 'Visa mindre' : 'Vad bygger det här på?'}
							</button>
							{#if openAnalysisInsights[primaryInsight.id]}
								<dl class="analysis-details">
									<dt>Så är observationen räknad</dt>
									<dd>{primaryInsight.evidence}</dd>
								</dl>
							{/if}
						</section>
					{/if}
					{#if selectedPeriod === 180 && halfYear}
						<section class="analysis-section analysis-long-period" aria-labelledby="half-year-summary-heading">
							<h3 id="half-year-summary-heading">Ditt senaste halvår</h3>
							<div class="half-year-reflection">
								{#each halfYear.reflection.sentences as sentence}
									<p>{sentence}</p>
								{/each}
							</div>
							{#if halfYear.reflection.highlights.length > 0}
								<section class="half-year-highlights" aria-labelledby="half-year-highlights-heading">
									<h4 id="half-year-highlights-heading">Det som sticker ut</h4>
									<ul>
										{#each halfYear.reflection.highlights as highlight}
											<li>{highlight}</li>
										{/each}
									</ul>
								</section>
							{/if}
							<!-- Fakta-korten ligger efter reflektionen: de ger detaljer utan att
							     användaren först behöver tolka siffrorna själv. -->
							<dl class="half-year-stats">
								{#each halfYear.stats as stat (stat.id)}
									<div class="half-year-stat">
										<dt>{stat.label}</dt>
										<dd>{stat.value}</dd>
										<p>{stat.note}</p>
									</div>
								{/each}
							</dl>
						</section>
						<section class="analysis-section" aria-labelledby="monthly-analysis-heading">
							<h3 id="monthly-analysis-heading">Månad för månad</h3>
							<ul class="monthly-analysis-list">
								{#each halfYear.months as month (month.month)}
									<li class:thin={month.status !== 'sufficient'}>
										<strong>{month.shortLabel}</strong>
										{#if month.status === 'sufficient' && month.mean !== null}
											<span>Snitt {month.mean.toFixed(1).replace('.', ',')} · {month.entryCount} {month.entryCount === 1 ? 'registrering' : 'registreringar'}</span>
											<!-- Lägesmarkering mot användarens eget halvårssnitt. Samma
											     dämpade stil för alla tre lägen: ingen bra/dålig-signal. -->
											{#if month.relativeText}<span class="month-relative">{month.relativeText}</span>{/if}
										{:else if month.status === 'thin'}
											<span>Tunt underlag · {month.entryCount} {month.entryCount === 1 ? 'registrering' : 'registreringar'}</span>
										{:else}
											<span>Inget mående registrerat</span>
										{/if}
									</li>
								{/each}
							</ul>
							{#if sparseMonthCopy}<p class="analysis-coverage-note">{sparseMonthCopy}</p>{/if}
						</section>
					{/if}
					{#if progressAnalysis.insights.length === 0}
						<p class="reflection-copy">Inget tydligt mönster syns ännu i den här perioden. Det är okej — underlaget kan vara för glest eller för jämnt för en försiktig slutsats.</p>
					{:else if remainingInsights.length > 0}
						<ul class="analysis-grid">
							{#each remainingInsights as item (item.id)}
								<li class="analysis-tile" data-card={item.category}>
								<h3>{item.title}</h3>
								<p class="analysis-tile-conclusion">{item.description}</p>
								<button
									type="button"
									class="analysis-more"
									aria-expanded={openAnalysisInsights[item.id] === true}
									onclick={() => toggleAnalysisInsight(item.id)}
								>
									{openAnalysisInsights[item.id] ? 'Visa mindre' : 'Vad bygger det här på?'}
								</button>
								{#if openAnalysisInsights[item.id]}
									<dl class="analysis-details">
										<dt>Så är observationen räknad</dt>
										<dd>{item.evidence}</dd>
									</dl>
								{/if}
								</li>
							{/each}
						</ul>
					{/if}

					<button
						type="button"
						class="analysis-more analysis-basis-toggle"
						aria-expanded={analysisBasisOpen}
						onclick={() => (analysisBasisOpen = !analysisBasisOpen)}
					>
						{analysisBasisOpen ? 'Dölj datagrunden' : 'Vad bygger det här på?'}
					</button>
					{#if analysisBasisOpen}
						<p class="analysis-basis">
							Analysen bygger på {progressAnalysis.coverage.entryCount} {progressAnalysis.coverage.entryCount === 1 ? 'anteckning' : 'anteckningar'}, varav {progressAnalysis.moodSummary.entryCount} {progressAnalysis.moodSummary.entryCount === 1 ? 'måenderegistrering' : 'måenderegistreringar'} och {progressAnalysis.coverage.textEntryCount} {progressAnalysis.coverage.textEntryCount === 1 ? 'sparad text' : 'sparade texter'}{#if progressAnalysis.coverage.firstDate && progressAnalysis.coverage.latestDate} från {progressAnalysis.coverage.firstDate} till {progressAnalysis.coverage.latestDate}{/if}. Här visas bara mönster som går att räkna fram ur den valda periodens registreringar och sparade texter. Varje slutsats visas först när den passerat ett tröskelvärde, och den beskriver samband — inte orsak.
							{#if progressAnalysis.moodSummary.mean !== null && progressAnalysis.moodSummary.median !== null}
								Ditt snitt är {progressAnalysis.moodSummary.mean.toFixed(1).replace('.', ',')} och medianen {progressAnalysis.moodSummary.median.toFixed(1).replace('.', ',')} på skalan. Registreringarna ligger mellan {progressAnalysis.moodSummary.min} och {progressAnalysis.moodSummary.max}.
							{/if}
							{#if progressAnalysis.coverage.truncated} Analysen kan vara begränsad eftersom perioden innehåller fler registreringar än den säkra läsgränsen just nu. {/if}
						</p>
						{#if halfYear}
							<!-- Halvårets eget underlag: vilka månader som jämförts, hur många
							     registreringar de bygger på, och varför en slutsats kan eller
							     inte kan dras. -->
							<p class="analysis-basis">{halfYear.basis}</p>
						{/if}
					{/if}
				{:else}
					<p class="reflection-copy">Det finns ännu inte tillräckligt med data för en personlig analys.</p>
				{/if}
			</section>

			{#if showSupportCard}
				<section class="card reflection-card support-card" aria-labelledby="support-heading" data-testid="support-suggestions">
					<div class="card-header">
						<div class="icon-badge milestone-leaf"><Leaf size={24} /></div>
						<h2 id="support-heading">Kanske värt att prova</h2>
					</div>
					<p class="analysis-intro">{SUPPORT_INTRO_COPY}</p>

					{#if insightsLoading}
						<p class="reflection-copy">Letar efter något som har täckning i din egen historik.</p>
					{:else if supportView.learning || supportSuggestions.length === 0}
						<p class="reflection-copy">{SUPPORT_LEARNING_COPY}</p>
						<p class="reflection-copy">{SUPPORT_LEARNING_DETAIL}</p>
					{:else}
						<ul class="support-suggestions">
							{#each supportSuggestions as suggestion (suggestion.id)}
								<li class="support-suggestion">
									<strong>{suggestion.title}</strong>
									<span>{suggestion.body}</span>
									<small>{suggestion.evidence}</small>
									{#if supportResponses[suggestion.id]}
										<p class="support-receipt" aria-live="polite">
											{supportResponses[suggestion.id] === 'fits'
												? 'Noterat som något som kan passa. Det påverkar inte din måendehistorik.'
												: 'Okej. Det här får vila resten av dagen.'}
										</p>
									{:else}
										<div class="support-actions">
											<button type="button" class="support-action" onclick={() => respondToSuggestion(suggestion, 'fits')}>
												Det här passar idag
											</button>
											<button type="button" class="support-action" onclick={() => respondToSuggestion(suggestion, 'not-today')}>
												Inte idag
											</button>
										</div>
									{/if}
								</li>
							{/each}
						</ul>

						{#if supportView.suggestions.length > supportSuggestions.length}
							<button type="button" class="support-link" onclick={showAnotherSuggestion}>Visa något annat</button>
						{/if}

						{#if supportView.breathingRoom.length > 0}
							<div class="analysis-section">
								<h3>Det som verkar ge lite andrum</h3>
								<ul class="support-topics">
									{#each supportView.breathingRoom as topic}
										<li>
											<button
												type="button"
												class="support-chip"
												aria-pressed={supportExamplesOpen && supportSelectedTopic === topic}
												onclick={() => chooseSupportTopic(topic)}
											>
												{topic.toLocaleLowerCase('sv-SE')}
											</button>
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if supportExampleTopics.length > 0}
							<button
								type="button"
								class="support-link"
								aria-expanded={supportExamplesOpen}
								onclick={toggleSupportExamples}
							>
								{supportExamplesOpen ? 'Dölj det som hjälpt tidigare' : 'Visa vad som hjälpt tidigare'}
							</button>
							{#if supportExamplesOpen}
								{#if supportExamples.length > 0}
									<ul class="evidence-observations support-examples">
										{#each supportExamples as example (`${example.topicLabel}-${example.date}-${example.summary}`)}
											<li>
												<strong>{example.date}</strong>
												{#if example.quote}
													<span>”{example.quote}”</span>
												{/if}
												<small>{example.summary}</small>
											</li>
										{/each}
									</ul>
								{:else}
									<p class="reflection-copy">Det finns inga sparade rader att visa för det temat än.</p>
								{/if}
							{/if}
						{/if}
					{/if}
				</section>
			{/if}

			<section class="card garden-presence-card" aria-labelledby="garden-presence-heading">
				<div class="card-header">
					<div class="icon-badge milestone-leaf"><Leaf size={24} /></div>
					<h2 id="garden-presence-heading">Vad det här bygger på</h2>
				</div>
				<!-- Korten ovan säger vad som går att se. Det här säger hur mycket
				     material observationerna vilar på, så att användaren kan väga dem
				     själv. Det är underlag - inte ett resultat, och inte ett mått på
				     hur mycket appen har använts (docs/NORTH_STAR.md, "Ingen skuld"). -->
				{#if hasHistoryMaterial}
					<p class="reflection-copy">
						{moodSamples.length}
						{moodSamples.length === 1 ? 'måenderegistrering' : 'måenderegistreringar'} i tidslinjen och
						{entryCount}
						{entryCount === 1 ? 'sparat dagboksinlägg' : 'sparade dagboksinlägg'} totalt.
					</p>
					<p class="reflection-copy">
						Registreringarna i den valda perioden är spridda över {historyActivity.activeDays}
						{historyActivity.activeDays === 1 ? 'dag' : 'dagar'} och {historyActivity.activeWeeks}
						{historyActivity.activeWeeks === 1 ? 'vecka' : 'veckor'}.
					</p>
					<p class="reflection-copy history-missing-note">
						Dagar utan registrering räknas som att det saknas data — inte som sämre mående.
					</p>
				{:else}
					<p class="reflection-copy">
						Här samlas underlaget som korten ovan vilar på. Det fylls på av det du själv väljer att
						spara i dagboken.
					</p>
				{/if}
			</section>
		</div>
	</div>

	{#if false}
	<div class="framsteg-layout">
	<div class="framsteg-main">

		<!-- ── Din senaste tid ── -->
		<section class="card recent-card" bind:this={heatmapCardEl} aria-labelledby="recent-period-heading">
			<div class="card-header">
				<div class="icon-badge heat"><TrendingUp size={24} /></div>
				<h2 id="recent-period-heading">Din senaste tid</h2>
			</div>
			<p class="recent-intro">
				Kurvan visar det humör du själv noterat i dagboken, på en skala från 1 tungt till 10
				ljusare. Texten under är observationer ur din egen data, inte en bedömning.
			</p>

			<RecentPeriodChart
				points={recentPeriod.points}
				period={selectedPeriod}
				onSelectPeriod={(value) => (selectedPeriod = value)}
				textAlternative={recentPeriod.textAlternative}
				hasChart={recentPeriod.hasChart}
				fallbackText={CHART_FALLBACK_COPY}
			/>

			<!-- Utan kurva står samma förklaring redan i grafytan. -->
			{#if recentPeriod.hasChart}
				<p class="recent-summary">{recentPeriod.summary}</p>
			{/if}

			<ul class="observation-list">
				{#each recentPeriod.observations as observation (observation.id)}
					<li class="observation">
						<span class="observation-label">{observation.label}</span>
						<span class="observation-text">{observation.text}</span>
					</li>
				{/each}
			</ul>

			<!-- Skrivhistoriken är fördjupning, inte huvudbudskap. Stängd som standard. -->
			<div class="history-disclosure">
				<button
					type="button"
					class="history-toggle"
					aria-expanded={historyOpen}
					aria-controls="framsteg-writing-history"
					onclick={() => (historyOpen = !historyOpen)}
				>
					<span>{historyOpen ? 'Dölj skrivhistorik' : 'Visa skrivhistorik'}</span>
					<ChevronDown size={18} class="history-chevron" aria-hidden="true" />
				</button>
				<div
					id="framsteg-writing-history"
					class="history-panel"
					role="region"
					aria-label="Skrivhistorik"
				>
					{#if historyOpen && shouldShowHeatmap}
						<p class="history-description">
							Varje markering är en dag du skrev. Färgen visar hur många inlägg dagen fick.
						</p>
						<ActivityHeatmap data={heatmapData} error={heatmapError} />
					{/if}
				</div>
			</div>
		</section>

		<!-- Den äldre "Dina AI-insikter"-ytan låg här. Den läste aiSummary, bestDay,
		     worstDay och insights ur svaret, och de fälten slutade skickas när
		     analysen blev serverlokal och periodmedveten. Analysen visas nu enbart
		     i "Det som börjar synas" ovanför, som läser analysis. -->

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
				{#if nextMilestone}
					<div class="next-milestone">
						<div class="next-header"><Calendar size={18} /><span>Det som långsamt kan växa fram</span></div>
						<h3>{isAnonymous ? 'Trädgården kan få plats för mer ljus.' : 'Din trädgård har plats för mer ljus.'}</h3>
						<!-- Icke-null-assertion som tidigare: $derived narrowar inte in i
						     blocket, men {#if nextMilestone} garanterar värdet här. -->
						<p>{nextMilestoneCopy(nextMilestone!)}</p>
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
						<!-- Här låg "Dagar i följd". Framsteg ska visa vad som förändras
						     över tid, inte hur oavbrutet tjänsten öppnats. "Dagar med
						     avtryck" ovan är samma sorts historik utan att göra en obruten
						     rad till ett resultat. Fyra rutor fyller rutnätets två kolumner
						     jämnt, så tillväxtrutan behöver inte längre spänna över bredden. -->
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
	{/if}
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
		width: min(var(--portal-max), 100%);
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

	.framsteg-layout-v2 {
		grid-template-columns: minmax(0, 1fr);
		max-width: 860px;
	}

	.reflection-card,
	.garden-presence-card {
		display: grid;
		gap: 0.8rem;
	}

	.reflection-copy {
		margin: 0;
		color: hsl(var(--muted-foreground));
		line-height: 1.6;
	}

	.analysis-card {
		gap: 1rem;
	}

	.analysis-intro,
	.analysis-basis {
		margin: 0;
		max-width: 48rem;
		line-height: 1.6;
	}

	.chart-detail {
		display: grid;
		gap: 0.3rem;
		max-width: 42rem;
		padding: 0.9rem 1rem;
		border: 1px solid var(--color-dashboard-border);
		border-radius: 0.75rem;
		background: hsl(var(--muted) / 0.24);
		line-height: 1.5;
	}

	.chart-detail strong {
		color: hsl(var(--foreground));
		font-size: 0.95rem;
	}

	.chart-detail span,
	.chart-detail small {
		color: hsl(var(--muted-foreground));
	}

	.chart-detail span { font-size: 0.92rem; }
	.chart-detail small { font-size: 0.82rem; }

	.analysis-intro {
		color: hsl(var(--muted-foreground));
	}

	.analysis-basis {
		padding: 0.85rem 1rem;
		border-left: 3px solid color-mix(in srgb, var(--theme-accent, #557c68) 56%, transparent);
		border-radius: 0 0.65rem 0.65rem 0;
		background: hsl(var(--muted) / 0.28);
		color: hsl(var(--foreground));
		font-size: 0.94rem;
	}

	.analysis-section {
		display: grid;
		gap: 0.7rem;
		padding-top: 0.2rem;
	}

	.analysis-section h3 {
		margin: 0;
		color: hsl(var(--foreground));
		font-size: 1.05rem;
	}

	.analysis-long-period {
		padding: 0.9rem 1rem;
		border-left: 3px solid color-mix(in srgb, var(--theme-accent, #557c68) 56%, transparent);
		border-radius: 0 0.65rem 0.65rem 0;
		background: hsl(var(--muted) / 0.2);
	}

	.analysis-long-period p,
	.analysis-coverage-note {
		margin: 0;
		color: hsl(var(--muted-foreground));
		line-height: 1.5;
	}

	/* Saknad data är en förutsättning för att läsa korten rätt, men den ska
	   ligga lågt i hierarkin - inte som ännu ett påstående om måendet. */
	.history-missing-note {
		color: hsl(var(--muted-foreground));
	}

	/* Överblicken är sidans första innehållskort. Den får lite mer tyngd i
	   ingressen än övriga kort, men ingen egen färgkodning - riktningen ska
	   bäras av texten, inte av grönt eller rött (uppdragets Del 31). */
	.week-summary-lead {
		margin: 0;
		font-size: 1.02rem;
		line-height: 1.6;
	}

	.week-summary-comparison {
		margin: 0.55rem 0 0;
		line-height: 1.6;
	}

	.week-summary-note {
		margin: 0.55rem 0 0;
		color: hsl(var(--muted-foreground));
		line-height: 1.5;
	}

	.half-year-reflection {
		display: grid;
		gap: 0.45rem;
	}

	.half-year-reflection p {
		line-height: 1.58;
	}

	.half-year-reflection p:first-child {
		color: hsl(var(--foreground));
		font-weight: 500;
	}

	.half-year-highlights {
		display: grid;
		gap: 0.4rem;
		min-width: 0;
		margin: 0.1rem 0 0;
		padding: 0.75rem 0.85rem;
		border: 1px solid var(--color-dashboard-border);
		border-radius: 0.65rem;
		background: hsl(var(--background) / 0.46);
	}

	.half-year-highlights h4 {
		margin: 0;
		color: hsl(var(--foreground));
		font-size: 0.9rem;
	}

	.half-year-highlights ul {
		display: grid;
		gap: 0.28rem;
		min-width: 0;
		margin: 0;
		padding-left: 1.1rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.88rem;
		line-height: 1.48;
	}

	.half-year-highlights li {
		overflow-wrap: anywhere;
	}

	/* Nyckeltalen ligger på en rad på desktop och två i bredd på mobil, så
	   halvåret går att överblicka utan att detaljtexten läses. 8rem är valt så
	   att två ryms i bredd även på 390px-skärmar; med 9rem föll de ned till fyra
	   staplade rader. */
	.half-year-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: 0.5rem;
		margin: 0.35rem 0 0;
	}

	.half-year-stat {
		display: grid;
		gap: 0.1rem;
		min-width: 0;
		padding: 0.6rem 0.7rem;
		border: 1px solid var(--color-dashboard-border);
		border-radius: 0.65rem;
		background: hsl(var(--background) / 0.5);
	}

	.half-year-stat dt {
		color: hsl(var(--muted-foreground));
		font-size: 0.74rem;
		letter-spacing: 0.02em;
	}

	.half-year-stat dd {
		margin: 0;
		color: hsl(var(--foreground));
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.25;
	}

	.half-year-stat p {
		margin: 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.72rem;
		line-height: 1.35;
	}

	@media (max-width: 620px) {
		.analysis-long-period {
			gap: 0.65rem;
			padding: 0.85rem 0.9rem;
		}

		.half-year-reflection {
			gap: 0.4rem;
		}

		.half-year-highlights {
			padding: 0.7rem 0.75rem;
		}
	}

	/* 7,5rem räcker för "Nära ditt halvårssnitt" på två rader och låter alla sex
	   månaderna ligga på en rad på desktop. Med 10rem föll den sjätte månaden
	   ned på egen rad, vilket gjorde halvåret svårare att jämföra i ett svep. */
	.monthly-analysis-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
		gap: 0.55rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.monthly-analysis-list li {
		display: grid;
		gap: 0.2rem;
		padding: 0.7rem 0.8rem;
		border: 1px solid var(--color-dashboard-border);
		border-radius: 0.7rem;
		background: hsl(var(--muted) / 0.16);
	}

	.monthly-analysis-list strong { color: hsl(var(--foreground)); font-size: 0.88rem; }
	.monthly-analysis-list span { color: hsl(var(--muted-foreground)); font-size: 0.82rem; line-height: 1.4; }
	.monthly-analysis-list .thin { opacity: 0.78; }
	/* Samma dämpade ton oavsett om månaden ligger över, under eller nära
	   snittet. Markeringen ska hjälpa jämförelsen, inte värdera månaden. */
	.monthly-analysis-list .month-relative { font-size: 0.74rem; opacity: 0.82; }

	.evidence-observations {
		display: grid;
		gap: 0.65rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.evidence-observations li {
		display: grid;
		gap: 0.35rem;
		padding: 0.9rem 1rem;
		border: 1px solid var(--color-dashboard-border);
		border-radius: 0.75rem;
		background: hsl(var(--muted) / 0.24);
		line-height: 1.5;
	}

	.evidence-observations strong {
		color: hsl(var(--foreground));
		font-size: 0.95rem;
	}

	.evidence-observations span,
	.evidence-observations small {
		color: hsl(var(--muted-foreground));
	}

	.evidence-observations span {
		font-size: 0.92rem;
	}

	.evidence-observations small {
		font-size: 0.82rem;
		line-height: 1.45;
	}

	/* ── Analysen som fyra kort ──
	   Mobil först: en kolumn. Från 720 px läggs de i 2x2, vilket håller alla
	   fyra slutsatserna inom en skärmhöjd på desktop. */
	.analysis-grid {
		display: grid;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.analysis-primary-insight {
		display: grid;
		align-content: start;
		gap: 0.45rem;
		padding: 1.1rem 1.2rem;
		border: 1px solid color-mix(in srgb, var(--theme-accent, #557c68) 34%, var(--color-dashboard-border));
		border-inline-start: 0.3rem solid color-mix(in srgb, var(--theme-accent, #557c68) 62%, transparent);
		border-radius: 0.9rem;
		background: hsl(var(--muted) / 0.3);
	}

	.analysis-primary-insight h3 {
		margin: 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.analysis-primary-title,
	.analysis-primary-conclusion {
		margin: 0;
		color: hsl(var(--foreground));
	}

	.analysis-primary-title {
		font-size: 1rem;
		font-weight: 700;
	}

	.analysis-primary-conclusion {
		font-size: 1.08rem;
		font-weight: 600;
		line-height: 1.4;
	}

	.analysis-tile {
		display: grid;
		align-content: start;
		gap: 0.4rem;
		padding: 1rem 1.1rem;
		border: 1px solid var(--color-dashboard-border);
		border-radius: 0.9rem;
		background: hsl(var(--muted) / 0.2);
	}

	.analysis-tile h3 {
		margin: 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	/* Slutsatsen är kortets tyngdpunkt och ska kunna läsas ensam. */
	.analysis-tile-conclusion {
		margin: 0.1rem 0 0;
		color: hsl(var(--foreground));
		font-size: 1.02rem;
		font-weight: 600;
		line-height: 1.35;
	}

	.analysis-more {
		justify-self: start;
		margin-top: 0.15rem;
		padding: 0;
		border: 0;
		background: none;
		color: hsl(var(--muted-foreground));
		font-size: 0.82rem;
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.analysis-more:hover,
	.analysis-more:focus-visible {
		color: hsl(var(--foreground));
	}

	.analysis-more:focus-visible {
		outline: 2px solid hsl(var(--foreground));
		outline-offset: 3px;
		border-radius: 0.25rem;
	}

	/* Fördjupningen bär hela det ursprungliga underlaget. Den får vara lång -
	   den syns bara för den som bett om den. */
	.analysis-details {
		display: grid;
		gap: 0.45rem;
		margin: 0.35rem 0 0;
		padding-top: 0.6rem;
		border-top: 1px solid var(--color-dashboard-border);
	}

	.analysis-details dt {
		color: hsl(var(--foreground));
		font-size: 0.84rem;
		font-weight: 600;
	}

	.analysis-details dd {
		margin: 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.82rem;
		line-height: 1.5;
	}

	.analysis-basis-toggle {
		margin-top: 0.35rem;
	}

	@media (max-width: 620px) {
		.analysis-grid {
			gap: 0.6rem;
		}

		.analysis-tile {
			gap: 0.3rem;
			padding: 0.8rem 0.9rem;
		}

		.analysis-primary-insight {
			padding: 0.95rem 1rem;
		}

		.analysis-tile-conclusion {
			font-size: 0.98rem;
		}
	}

	@media (min-width: 720px) {
		.analysis-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	/* Kortet ska läsas som en del av landskapet, inte som en informationsruta. */
	.support-card {
		gap: 1rem;
	}

	.support-suggestions {
		display: grid;
		gap: 0.65rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.support-suggestion {
		display: grid;
		gap: 0.4rem;
		max-width: 46rem;
		padding: 1rem 1.1rem;
		border: 1px solid color-mix(in srgb, var(--theme-accent, #557c68) 22%, transparent);
		border-radius: 0.9rem;
		background: hsl(var(--muted) / 0.2);
		line-height: 1.55;
	}

	.support-suggestion strong {
		color: hsl(var(--foreground));
		font-size: 1rem;
		font-weight: 600;
	}

	.support-suggestion span {
		color: hsl(var(--muted-foreground));
		font-size: 0.94rem;
	}

	.support-suggestion small {
		color: hsl(var(--muted-foreground) / 0.85);
		font-size: 0.8rem;
		line-height: 1.45;
	}

	.support-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.support-action {
		padding: 0.42rem 0.85rem;
		border: 1px solid var(--color-dashboard-border);
		border-radius: 999px;
		background: transparent;
		color: hsl(var(--foreground));
		font-size: 0.86rem;
		cursor: pointer;
		transition: background 160ms ease, border-color 160ms ease;
	}

	.support-action:hover,
	.support-action:focus-visible {
		border-color: color-mix(in srgb, var(--theme-accent, #557c68) 52%, transparent);
		background: hsl(var(--muted) / 0.4);
	}

	.support-receipt {
		margin: 0.25rem 0 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.85rem;
	}

	.support-link {
		justify-self: start;
		padding: 0;
		border: 0;
		background: none;
		color: hsl(var(--muted-foreground));
		font-size: 0.88rem;
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.support-link:hover,
	.support-link:focus-visible {
		color: hsl(var(--foreground));
	}

	.support-topics {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.support-chip {
		padding: 0.34rem 0.8rem;
		border: 1px solid var(--color-dashboard-border);
		border-radius: 999px;
		background: transparent;
		color: hsl(var(--muted-foreground));
		font-size: 0.85rem;
		cursor: pointer;
		transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
	}

	.support-chip[aria-pressed='true'] {
		border-color: color-mix(in srgb, var(--theme-accent, #557c68) 52%, transparent);
		background: hsl(var(--muted) / 0.42);
		color: hsl(var(--foreground));
	}

	.support-examples span {
		font-style: italic;
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
		/* Neutral bas som bara syns innan bilden laddats. Varje dygnsspann har nu
		   sitt eget ljus inbakat i bilden, så grundtonen ska inte färga något. */
		background: #10192a;
		isolation: isolate;
	}

	.companion-media::before,
	.companion-media::after {
		content: '';
		position: absolute;
		pointer-events: none;
		transition: background 1200ms ease, opacity 1200ms ease;
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

	/* Toningen finns för att copyn i nederkanten ska gå att läsa. Dagtid räcker en
	   svagare botten - texten har dessutom egen text-shadow. */
	.companion-media[data-time='morning']::after {
		background: linear-gradient(180deg, rgb(255 226 186 / 0.05) 0%, rgb(70 62 54 / 0.06) 36%, rgb(12 22 34 / 0.5) 100%);
	}

	.companion-media[data-time='day']::after {
		background: linear-gradient(180deg, rgb(214 238 255 / 0.04) 0%, rgb(16 34 52 / 0.05) 34%, rgb(10 24 40 / 0.44) 100%);
	}

	.companion-media[data-time='afternoon']::after {
		background: linear-gradient(180deg, rgb(255 168 104 / 0.06) 0%, rgb(97 46 29 / 0.16) 35%, rgb(11 15 23 / 0.68) 100%);
	}

	.companion-media[data-time='evening']::after {
		background: linear-gradient(180deg, rgb(2 13 31 / 0.2) 0%, rgb(2 10 25 / 0.54) 34%, rgb(2 8 20 / 0.88) 100%);
	}

	/* Genvägen hem till stugan. Ytan följer bildens cover-geometri via
	   variablerna från getProgressCabinPlacementStyle, ligger över bakgrunden men
	   under följeslagaren och scenens copy, och ändrar ingenting i layouten. */
	.progress-cabin-link {
		position: absolute;
		left: var(--progress-cabin-left, 0);
		top: var(--progress-cabin-top, 0);
		z-index: var(--scene-midground);
		width: var(--progress-cabin-width, 0);
		height: var(--progress-cabin-height, 0);
		border-radius: 8px;
		/* Ingen egen yta i viloläge - motivet i bilden är hela affordancen. */
		background: transparent;
		box-shadow: 0 0 0 0 rgb(255 214 148 / 0);
		transition: box-shadow 220ms ease;
	}

	.progress-cabin-link:hover,
	.progress-cabin-link:focus-visible {
		box-shadow: 0 0 18px 2px rgb(255 214 148 / 0.28);
	}

	.progress-cabin-link:focus-visible {
		outline: 2px solid rgb(255 250 242 / 0.82);
		outline-offset: 3px;
	}

	@media (prefers-reduced-motion: reduce) {
		.progress-cabin-link {
			transition: none;
		}
	}

	.companion-world-scene {
		position: absolute;
		inset: 0;
		z-index: var(--scene-background);
		width: 100%;
		height: 100%;
		object-fit: cover;
		/* Samma object-position används av getProgressCompanionPlacement(). */
		object-position: var(--progress-scene-object-position, 50% 72%);
		display: block;
		transition: opacity var(--progress-scene-crossfade-duration, 1000ms) ease;
	}

	.companion-world-scene--crossfading {
		opacity: 1;
		animation: progressSceneFadeIn var(--progress-scene-crossfade-duration, 1000ms) ease both;
	}

	.companion-world-scene--outgoing {
		opacity: 0;
		animation: progressSceneFadeOut var(--progress-scene-crossfade-duration, 1000ms) ease both;
	}

	.companion-world-scene--preload {
		opacity: 0;
		pointer-events: none;
	}

	@keyframes progressSceneFadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes progressSceneFadeOut {
		from { opacity: 1; }
		to { opacity: 0; }
	}

	@media (prefers-reduced-motion: reduce) {
		.companion-world-scene--crossfading,
		.companion-world-scene--outgoing {
			animation-duration: 1ms;
			transition-duration: 1ms;
		}
	}

	.companion-media :global(.progress-living-world) {
		z-index: var(--scene-ambient);
	}

	/* Ingen dygnsgradering av scenbilden längre. Morgon, dag, eftermiddag och
	   kväll är fyra separata bilder med rätt ljus inbakat; ett filter ovanpå
	   skulle överexponera morgonen och tona ner kvällen dubbelt. */

	.companion-media :global(.progress-companion-pose) {
		position: absolute;
		/* Markpunkten beräknas ur samma object-fit-crop som scenbilden. */
		left: var(--progress-companion-left);
		top: var(--progress-companion-top);
		z-index: var(--scene-companion);
		width: var(--progress-companion-width);
		transform: translate3d(-50%, -100%, 0);
		transform-origin: 50% 100%;
		--companion-grade: saturate(0.7) contrast(0.88) brightness(0.94) sepia(0.14)
			hue-rotate(-3deg);
	}

	.companion-media[data-time='morning'] :global(.progress-companion-pose) {
		--companion-grade: saturate(0.82) contrast(0.9) brightness(1.08) sepia(0.06)
			hue-rotate(2deg);
	}

	.companion-media[data-time='day'] :global(.progress-companion-pose) {
		--companion-grade: saturate(0.88) contrast(0.92) brightness(1.14) sepia(0.03)
			hue-rotate(5deg);
	}

	.companion-media[data-time='afternoon'] :global(.progress-companion-pose) {
		--companion-grade: saturate(0.68) contrast(0.88) brightness(0.88) sepia(0.18)
			hue-rotate(-6deg);
	}

	.companion-media[data-companion='wolf'][data-time='afternoon'] :global(.progress-companion-pose) {
		--companion-grade: saturate(0.62) contrast(0.84) brightness(0.84) sepia(0.21)
			hue-rotate(-8deg) blur(0.12px);
	}

	.companion-media[data-time='evening'] :global(.progress-companion-pose) {
		--companion-grade: saturate(0.55) contrast(0.84) brightness(0.78) sepia(0.14)
			hue-rotate(5deg);
	}

	.companion-media :global(.progress-companion-pose .companion-pose-image) {
		filter: var(--companion-grade) drop-shadow(0 7px 8px rgb(37 31 20 / 0.1));
		-webkit-mask-image: radial-gradient(ellipse at 50% 52%, #000 72%, rgb(0 0 0 / 0.88) 89%, transparent 100%);
		mask-image: radial-gradient(ellipse at 50% 52%, #000 72%, rgb(0 0 0 / 0.88) 89%, transparent 100%);
	}

	.companion-media[data-companion='fox'] :global(.progress-companion-pose .companion-pose-image) {
		filter: var(--companion-grade) brightness(0.94) drop-shadow(0 7px 8px rgb(37 31 20 / 0.1));
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
		left: var(--progress-companion-ground-left);
		top: var(--progress-companion-ground-top);
		z-index: var(--scene-ambient);
		width: clamp(38px, 6%, 60px);
		height: clamp(6px, 0.9vw, 10px);
		border-radius: 52% 48% 58% 42%;
		background:
			radial-gradient(ellipse at 45% 58%, rgb(28 31 20 / 0.28), transparent 62%),
			linear-gradient(88deg, transparent 0%, rgb(41 43 27 / 0.16) 32%, rgb(31 34 22 / 0.18) 58%, transparent 100%);
		filter: blur(4.5px);
		opacity: 0.48;
		transform: translate3d(-50%, -50%, 0) rotate(-8deg) skewX(-18deg) scaleX(1.18);
		transform-origin: 44% 50%;
		mix-blend-mode: multiply;
	}

	.companion-foreground-edge {
		left: var(--progress-companion-ground-left);
		top: calc(var(--progress-companion-ground-top) + 1px);
		z-index: var(--scene-foreground);
		width: clamp(46px, 7.2%, 72px);
		height: clamp(12px, 1.9vw, 20px);
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
		--progress-ripple-border: rgb(238 251 248 / 0.3);
		--progress-ripple-fill: rgb(255 255 255 / 0.1);
		--progress-ripple-blur: 0.2px;
		--progress-ripple-peak-opacity: 0.17;
		--progress-ripple-fade-opacity: 0.05;
		position: absolute;
		z-index: var(--scene-ambient);
		display: block;
		width: clamp(34px, 6.5%, 58px);
		aspect-ratio: 2.9 / 1;
		border: 1px solid var(--progress-ripple-border);
		border-radius: 50%;
		background: radial-gradient(ellipse at center, var(--progress-ripple-fill), transparent 68%);
		filter: blur(var(--progress-ripple-blur));
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

	/* Spåren hör till scenens omgivning: ovanpå bakgrunden och de beständiga
	   lagren, men alltid bakom följeslagaren och texten. */
	.companion-media :global(.progress-world-marks) {
		--world-marks-z: var(--scene-ambient);
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

	@media (min-width: 981px) {
	/* Höjd i vw så rutan behåller samma andel av bilden på alla desktopbredder:
	   ~52% av bildhöjden. Vid den tidigare höjden syntes bara 38%, och månen
	   (bild-y ~25%) och personen (~68%) rymdes inte samtidigt. */
	.companion-media {
		height: clamp(300px, 27vw, 420px);
	}

	.companion-world-scene {
		object-position: var(--progress-scene-object-position, 50% 72%);
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
		.companion-media::before,
		.progress-ripple {
			animation: none !important;
		}

		.companion-world-scene {
			transform: none;
			transition: none;
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
	.progress-summary-card { min-height: 25rem; }
	.progress-summary-card { box-sizing: border-box; }

	/* ── Din senaste tid ── */
	.recent-card { min-width: 0; }

	.recent-intro {
		max-width: 42rem;
		margin: 0 0 1.4rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.recent-summary {
		max-width: 46rem;
		margin: 1.4rem 0 0;
		color: hsl(var(--foreground));
		font-size: 1.05rem;
		line-height: 1.6;
	}

	.observation-list {
		display: grid;
		gap: 0.75rem;
		margin: 1.25rem 0 0;
		padding: 0;
		list-style: none;
	}

	.observation {
		display: grid;
		gap: 0.15rem;
		padding-left: 0.9rem;
		border-left: 2px solid color-mix(in srgb, var(--theme-accent, #557c68) 45%, transparent);
	}

	.observation-label {
		color: hsl(var(--muted-foreground));
		font-size: 0.82rem;
		font-weight: 600;
	}

	.observation-text {
		color: hsl(var(--foreground));
		font-size: 0.98rem;
		line-height: 1.55;
	}

	.history-disclosure {
		margin-top: 1.75rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--color-dashboard-border);
	}

	.history-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 44px;
		padding: 0 0.15rem;
		border: 0;
		background: none;
		color: hsl(var(--muted-foreground));
		font: inherit;
		font-size: 0.92rem;
		font-weight: 600;
		cursor: pointer;
	}

	.history-toggle:hover { color: hsl(var(--foreground)); }

	.history-toggle:focus-visible {
		outline: 2px solid hsl(var(--foreground));
		outline-offset: 3px;
		border-radius: 0.35rem;
	}

	.history-toggle :global(.history-chevron) { flex-shrink: 0; }

	.history-toggle[aria-expanded='true'] :global(.history-chevron) { transform: rotate(180deg); }

	.history-panel:not(:empty) { margin-top: 1rem; }

	.history-description {
		margin: 0 0 0.9rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.9rem;
		line-height: 1.6;
	}

	@media (prefers-reduced-motion: no-preference) {
		.history-toggle :global(.history-chevron) { transition: transform 180ms ease; }
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
			opacity: var(--progress-ripple-peak-opacity);
		}
		70% {
			opacity: var(--progress-ripple-fade-opacity);
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
		/* Samma långsamma vattenrörelse, men mjukare och mindre tydlig på den
		   smalare beskärningen så reflexerna läser som ljus i vattnet. */
		.progress-ripple {
			--progress-ripple-border: rgb(238 251 248 / 0.14);
			--progress-ripple-fill: rgb(255 255 255 / 0.035);
			--progress-ripple-blur: 1.2px;
			--progress-ripple-peak-opacity: 0.08;
			--progress-ripple-fade-opacity: 0.025;
		}

		/* Den smalare mobilcropen samlar personen och följeslagaren till höger.
		   Lägg copyn i övre vänsterdelen i stället för att trycka dess två stycken
		   mot kortets nederkant. */
		.companion-copy {
			top: clamp(0.9rem, 4vw, 1.2rem);
			left: 1.2rem;
			right: clamp(4.8rem, 20vw, 6.5rem);
			bottom: auto;
			max-width: 18rem;
		}
		.companion-copy h2 { font-size: 1rem; }
		.companion-copy p { font-size: clamp(0.78rem, 2.9vw, 0.84rem); line-height: 1.4; }
		.companion-copy .companion-reflection { margin-top: 0.35rem; }
		.card-header { flex-direction: column; align-items: flex-start; }
		.progress-summary-card { min-height: 18rem; }
		.milestones-grid { grid-template-columns: 1fr; }
		.overview-grid { grid-template-columns: repeat(2, 1fr); }
		.overview-number { font-size: 1.8rem; }
		.icon-badge { width: 2.3rem; height: 2.3rem; }
	}
</style>
