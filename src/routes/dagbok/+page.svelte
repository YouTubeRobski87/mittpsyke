<script lang="ts">
	const jsonLd = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "BreadcrumbList",
				"itemListElement": [
					{ "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://www.mittpsyke.se/" },
					{ "@type": "ListItem", "position": 2, "name": "Dagbok", "item": "https://www.mittpsyke.se/dagbok" }
				]
			},
			{
				"@type": "WebApplication",
				"name": "MittPsyke Dagbok",
				"url": "https://www.mittpsyke.se/dagbok",
				"description": "Digitalt verktyg mot ångest – skriv din personliga dagbok och följ ditt mående med visuell statistik.",
				"applicationCategory": "HealthApplication",
				"operatingSystem": "Web",
				"offers": { "@type": "Offer", "price": "0", "priceCurrency": "SEK" },
				"publisher": {
					"@type": "Organization",
					"name": "MittPsyke",
					"url": "https://www.mittpsyke.se"
				}
			}
		]
	};

	import { goto } from '$app/navigation';
	import {
		trackDagbokCtaClick,
		trackFirstDiaryEntry,
		trackRegistrationComplete
	} from '$lib/analytics';
	import {
		ANALYTICS_CONSENT_EVENT,
		hasAnalyticsConsent
	} from '$lib/consent';
	import { loadDiaryEntries, setDiaryEntries, type DiaryEntry } from '$lib/state/diary';
	import { supabase } from '$lib/supabase';
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import type { Chart as ChartInstance } from 'chart.js';
	import { getCachedTheme, getThemeColors, themeStyleVars } from '$lib/theme';

	type JournalEntry = DiaryEntry;

	type UpdateDiarySuccessResponse = {
		success: true;
		diary: {
			id: string;
			text: string;
			mood: string | null;
			tags: string[] | null;
			created_at: string;
		};
	};

	type UpdateDiaryErrorResponse = {
		success: false;
		error: string;
	};

	type DeleteDiarySuccessResponse = {
		success: true;
	};

	type DeleteDiaryErrorResponse = {
		success: false;
		error: string;
	};

	type CreateDiarySuccessResponse = {
		success: true;
		diary: {
			id: string;
			text: string;
			mood: string | null;
			tags: string[] | null;
			created_at: string;
		};
	};

	type CreateDiaryErrorResponse = {
		success: false;
		error: string;
	};

	type MoodTimelinePoint = {
		date: string;
		mood: string;
	};

	type StatsTimelineSuccessResponse = {
		success: true;
		data: MoodTimelinePoint[];
	};

	type StatsTimelineErrorResponse = {
		success: false;
		error: string;
	};

	type MoodWeeklyTrend = {
		mood: string;
		currentCount: number;
		previousCount: number;
		changeCount: number;
		direction: 'up' | 'down' | 'flat';
		significant: boolean;
	};

	const moods = ['Lugn', 'Orolig', 'Nedstämd', 'Hoppfull', 'Trött', 'Tacksam', 'Arg', 'Stressad'];
	const moodLineColors: Record<string, string> = {
		Lugn: '#60a5fa',
		Orolig: '#34d399',
		Nedstämd: '#a78bfa',
		Hoppfull: '#22d3ee',
		Trött: '#f59e0b',
		Tacksam: '#10b981',
		Arg: '#ef4444',
		Stressad: '#8b5cf6'
	};
	const fallbackLineColors = ['#60a5fa', '#34d399', '#a78bfa', '#f59e0b', '#22d3ee', '#f472b6'];
	const positiveMoods = new Set(['Lugn', 'Hoppfull', 'Tacksam']);
	const heavierMoods = new Set(['Orolig', 'Nedstämd', 'Stressad', 'Arg', 'Trött']);

	let loading = $state(true);
	let isLoggedIn = $state(false);
	let showWelcome = $state(false);
	let saving = $state(false);
	let exportingPdf = $state(false);
	let note = $state('');
	let tagsInput = $state('');
	let selectedMood = $state('');
	let editingEntryId = $state<string | null>(null);
	let editableText = $state('');
	let editableMood = $state('');
	let editableTags = $state('');
	let updatingEntry = $state(false);
	let deletingEntryId = $state<string | null>(null);
	let updateError = $state('');
	let deleteError = $state('');
	let userId = $state('');
	let entries = $state<JournalEntry[]>([]);
	let error = $state('');
	let reminderOptIn = $state(false);
	let reminderSaving = $state(false);
	let reminderError = $state('');
	let reminderNextAt = $state<string | null>(null);
	let statsLoading = $state(false);
	let statsError = $state('');
	let moodTimeline = $state<MoodTimelinePoint[]>([]);
	let moodWeeklyTrends = $state<MoodWeeklyTrend[]>([]);
	let moodReflection = $state('När du har skrivit fler inlägg kommer en reflektion här.');
	let moodChartCanvas = $state<HTMLCanvasElement | null>(null);
	let moodChart: ChartInstance | null = null;
	let pendingRegistrationComplete = $state(false);
	let registrationCompleteTracked = $state(false);
	let promptCheckin = $state(false);
	let reflection = $state<string | null>(null);
	let reflectionLoading = $state(false);
	let reflectionDismissed = $state(false);

	// — Theme support (shared with dashboard/framsteg) —
	let profileTheme = $state(getCachedTheme());
	const themeStyle = $derived(themeStyleVars(profileTheme));

	// — Personalization —
	let savedAt = $state<string | null>(null);
	let savedFading = $state(false);
	let displayName = $state('');

	const introTexts = [
		'Hur känns det idag?',
		'Vad vill du ge plats åt just nu?',
		'Du kan skriva av dig i lugn takt.',
		'Några ord räcker — börja där du är.',
		'Det behöver inte vara perfekt.',
		'Ta en stund för dig själv.',
		'Skriv det som finns, utan krav.'
	];
	let introText = $state(introTexts[0]);

	function pickIntroText() {
		const dayIndex = new Date().getDay();
		introText = introTexts[dayIndex % introTexts.length];
	}

	function applyTheme() {
		if (typeof window === 'undefined') return;
		profileTheme = getCachedTheme();
	}

	let reflectionFetchedForSave = false;

	async function fetchReflection(text: string) {
		if (!text || text.trim().length < 10) return;
		// Max 1 reflection per save session — prevents edit-loop spam
		if (reflectionFetchedForSave) return;
		reflectionFetchedForSave = true;
		reflectionLoading = true;
		reflectionDismissed = false;
		reflection = null;
		try {
			const res = await fetch('/api/diary/reflect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: text.trim() })
			});
			if (res.ok) {
				const data = await res.json();
				reflection = data.reflection;
			}
		} catch (e) {
			console.error('Reflection fetch failed:', e);
		} finally {
			reflectionLoading = false;
		}
	}

	function showSavedConfirmation() {
		const now = new Date();
		savedAt = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
		savedFading = false;
		setTimeout(() => { savedFading = true; }, 2500);
		setTimeout(() => { savedAt = null; savedFading = false; }, 3500);
	}

	function maybeTrackRegistrationComplete() {
		if (!pendingRegistrationComplete || registrationCompleteTracked || !hasAnalyticsConsent()) {
			return;
		}

		trackRegistrationComplete();
		pendingRegistrationComplete = false;
		registrationCompleteTracked = true;
	}

	function syncWelcomeStateFromUrl() {
		if (typeof window === 'undefined') return;

		const url = new URL(window.location.href);
		if (url.searchParams.get('welcome') !== 'true') return;

		showWelcome = true;
		pendingRegistrationComplete = true;
		maybeTrackRegistrationComplete();

		url.searchParams.delete('welcome');
		window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
		setTimeout(() => {
			showWelcome = false;
		}, 8000);
	}

	async function saveDraftIfPresent() {
		const DRAFT_KEY = 'mittpsyke:draft';
		if (typeof window === 'undefined') return;

		// Also check for anonymous temp entry from /skriv
		const tempEntry = localStorage.getItem('mittpsyke_temp_entry');
		if (tempEntry && tempEntry.trim() && !localStorage.getItem(DRAFT_KEY)) {
			localStorage.setItem(DRAFT_KEY, tempEntry.trim());
			localStorage.removeItem('mittpsyke_temp_entry');
		}

		const draft = localStorage.getItem(DRAFT_KEY);
		if (!draft || !draft.trim()) return;

		const { data } = await supabase.auth.getSession();
		const session = data.session;
		if (!session?.access_token) return;

		try {
			const res = await fetch('/api/diary/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`
				},
				body: JSON.stringify({ text: draft.trim() })
			});

			if (res.ok) {
				localStorage.removeItem(DRAFT_KEY);
				// Reload entries to show the new one
				if (userId) await loadEntries(userId);
			}
		} catch {
			// Silent fail – not critical
		}
	}

	$effect(() => {
		async function init() {
			const { data } = await supabase.auth.getSession();
			const session = data.session;

			if (!session) {
				loading = false;
				return;
			}

			userId = session.user.id;
			isLoggedIn = true;

			const metadata = (session.user.user_metadata ?? {}) as Record<string, unknown>;
			reminderOptIn = Boolean(metadata.journal_reminder_opt_in);
			reminderNextAt =
				typeof metadata.journal_reminder_next_at === 'string'
					? metadata.journal_reminder_next_at
					: null;

			applyPrefillFromUrl();
			syncWelcomeStateFromUrl();
			await saveDraftIfPresent();
			applyTheme();
			pickIntroText();

			// Load display name
			if (typeof metadata.display_name === 'string' && metadata.display_name) {
				displayName = metadata.display_name;
			}

			await loadEntries(userId);
			await loadMoodTimeline();
			loading = false;
		}

		init();
	});

	$effect(() => {
		if (typeof window === 'undefined') return;

		const handleConsentChange = () => {
			maybeTrackRegistrationComplete();
		};

		window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChange);

		return () => {
			window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChange);
		};
	});

	function applyPrefillFromUrl() {
		if (typeof window === 'undefined') return;

		const url = new URL(window.location.href);
		const prefill = url.searchParams.get('prefill');
		if (!prefill) return;

		note = prefill;
		if (url.searchParams.get('from') === 'prompt') {
			promptCheckin = true;
		}
		url.searchParams.delete('from');
		url.searchParams.delete('prefill');
		window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
	}

	function parseTags(input: string) {
		return Array.from(
			new Set(
				input
					.split(',')
					.map((tag) => tag.trim())
					.filter(Boolean)
			)
		);
	}

	function normalizeTags(value: unknown) {
		if (Array.isArray(value)) {
			return value
				.map((item) => (typeof item === 'string' ? item.trim() : ''))
				.filter(Boolean);
		}

		if (typeof value === 'string') {
			return value
				.split(',')
				.map((item) => item.trim())
				.filter(Boolean);
		}

		return [];
	}

	function sortByDate(a: string, b: string) {
		return a.localeCompare(b);
	}

	function getMoodLineColor(mood: string, index: number) {
		return moodLineColors[mood] ?? fallbackLineColors[index % fallbackLineColors.length];
	}

	function buildMoodChartData(points: MoodTimelinePoint[]) {
		const moodCountsByDate = new Map<string, Map<string, number>>();
		const moodSet = new Set<string>();

		for (const point of points) {
			const date = point.date.trim();
			const mood = point.mood.trim();
			if (!date || !mood) continue;

			moodSet.add(mood);
			const existingForDate = moodCountsByDate.get(date) ?? new Map<string, number>();
			existingForDate.set(mood, (existingForDate.get(mood) ?? 0) + 1);
			moodCountsByDate.set(date, existingForDate);
		}

		const labels = Array.from(moodCountsByDate.keys()).sort(sortByDate);
		const moodsInSeries = Array.from(moodSet.values()).sort((a, b) => a.localeCompare(b, 'sv-SE'));

		const datasets = moodsInSeries.map((mood, index) => {
			const lineColor = getMoodLineColor(mood, index);
			return {
				label: mood,
				data: labels.map((date) => moodCountsByDate.get(date)?.get(mood) ?? 0),
				borderColor: lineColor,
				backgroundColor: `${lineColor}55`,
				tension: 0.35,
				fill: false,
				pointRadius: 3,
				pointHoverRadius: 5,
				borderWidth: 2
			};
		});

		return { labels, datasets };
	}

	function addDays(date: Date, days: number) {
		const next = new Date(date);
		next.setUTCDate(next.getUTCDate() + days);
		return next;
	}

	function parseUtcDate(dateText: string) {
		return new Date(`${dateText}T00:00:00.000Z`);
	}

	function calculateMoodWeeklyTrends(points: MoodTimelinePoint[]) {
		if (points.length === 0) return [];

		const latestDateText = points.reduce((latest, point) =>
			point.date.localeCompare(latest) > 0 ? point.date : latest
		, points[0].date);
		const latestDate = parseUtcDate(latestDateText);
		const currentStart = addDays(latestDate, -6);
		const previousEnd = addDays(latestDate, -7);
		const previousStart = addDays(latestDate, -13);

		const currentCounts = new Map<string, number>();
		const previousCounts = new Map<string, number>();

		for (const point of points) {
			const mood = point.mood.trim();
			if (!mood) continue;

			const pointDate = parseUtcDate(point.date);
			if (pointDate >= currentStart && pointDate <= latestDate) {
				currentCounts.set(mood, (currentCounts.get(mood) ?? 0) + 1);
				continue;
			}

			if (pointDate >= previousStart && pointDate <= previousEnd) {
				previousCounts.set(mood, (previousCounts.get(mood) ?? 0) + 1);
			}
		}

		const moodsInTrends = new Set<string>([...currentCounts.keys(), ...previousCounts.keys()]);
		const trends: MoodWeeklyTrend[] = Array.from(moodsInTrends.values())
			.map((mood) => {
				const currentCount = currentCounts.get(mood) ?? 0;
				const previousCount = previousCounts.get(mood) ?? 0;
				const changeCount = currentCount - previousCount;
				const direction: MoodWeeklyTrend['direction'] =
					changeCount > 0 ? 'up' : changeCount < 0 ? 'down' : 'flat';
				const significant = Math.abs(changeCount) >= 2;

				return {
					mood,
					currentCount,
					previousCount,
					changeCount,
					direction,
					significant
				};
			})
			.sort((a, b) => a.mood.localeCompare(b.mood, 'sv-SE'));

		return trends;
	}

	function moodLabel(mood: string) {
		return mood.toLowerCase();
	}

	function generateMoodReflection(trends: MoodWeeklyTrend[]) {
		const significantUps = trends
			.filter((trend) => trend.significant && trend.direction === 'up')
			.sort((a, b) => Math.abs(b.changeCount) - Math.abs(a.changeCount));
		const significantDowns = trends
			.filter((trend) => trend.significant && trend.direction === 'down')
			.sort((a, b) => Math.abs(b.changeCount) - Math.abs(a.changeCount));

		if (significantUps.length === 0 && significantDowns.length === 0) {
			return 'Känslorna har varit mer blandade den senaste tiden.';
		}

		const positiveUp = significantUps.find((trend) => positiveMoods.has(trend.mood));
		if (positiveUp?.mood === 'Lugn') {
			return 'Det verkar som att lugn har fått mer utrymme.';
		}
		if (positiveUp) {
			return `Det verkar som att ${moodLabel(positiveUp.mood)} har fått lite mer plats den senaste veckan.`;
		}

		const heavierUp = significantUps.find((trend) => heavierMoods.has(trend.mood));
		if (heavierUp) {
			return `Du har känt dig lite mer ${moodLabel(heavierUp.mood)} den senaste veckan.`;
		}

		const heavierDown = significantDowns.find((trend) => heavierMoods.has(trend.mood));
		if (heavierDown) {
			return `Det verkar som att ${moodLabel(heavierDown.mood)} har lättat något den senaste veckan.`;
		}

		if (significantUps.length > 0 && significantDowns.length > 0) {
			return 'Känslorna har varit mer blandade den senaste tiden.';
		}

		return 'Det syns små skiften i dina känslor den senaste tiden.';
	}

	async function loadEntries(uid: string) {
		error = '';
		try {
			entries = await loadDiaryEntries(uid);
		} catch (loadError) {
			entries = [];
			error = loadError instanceof Error ? loadError.message : 'Kunde inte hämta anteckningar just nu.';
		}
	}

	async function loadMoodTimeline() {
		statsLoading = true;
		statsError = '';

		const {
			data: { session },
			error: sessionError
		} = await supabase.auth.getSession();

		if (sessionError || !session?.access_token) {
			statsError = 'Du behöver vara inloggad för att se statistik.';
			moodTimeline = [];
			moodWeeklyTrends = [];
			moodReflection = 'När du har skrivit fler inlägg kommer en reflektion här.';
			statsLoading = false;
			return;
		}

		try {
			const response = await fetch('/api/diary/stats-timeline', {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${session.access_token}`
				}
			});

			const result = (await response.json().catch(() => null)) as
				| StatsTimelineSuccessResponse
				| StatsTimelineErrorResponse
				| null;

			if (!response.ok || !result || !result.success) {
				statsError =
					result && 'error' in result ? result.error : 'Kunde inte hämta känslostatistik just nu.';
				moodTimeline = [];
				moodWeeklyTrends = [];
				moodReflection = 'När du har skrivit fler inlägg kommer en reflektion här.';
				statsLoading = false;
				return;
			}

			moodTimeline = result.data.filter(
				(point) =>
					typeof point.date === 'string' &&
					typeof point.mood === 'string' &&
					point.date.trim().length > 0 &&
					point.mood.trim().length > 0
			);
			moodWeeklyTrends = calculateMoodWeeklyTrends(moodTimeline);
			moodReflection =
				moodTimeline.length > 0
					? generateMoodReflection(moodWeeklyTrends)
					: 'När du har skrivit fler inlägg kommer en reflektion här.';
			statsLoading = false;
		} catch {
			statsError = 'Kunde inte hämta känslostatistik just nu.';
			moodTimeline = [];
			moodWeeklyTrends = [];
			moodReflection = 'När du har skrivit fler inlägg kommer en reflektion här.';
			statsLoading = false;
		}
	}

	function isDarkMode() {
		return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
	}

	async function renderMoodChart() {
		if (typeof window === 'undefined' || !moodChartCanvas || moodTimeline.length === 0) return;

		const chartData = buildMoodChartData(moodTimeline);
		if (chartData.labels.length === 0 || chartData.datasets.length === 0) return;

		const { default: Chart } = await import('chart.js/auto');

		if (moodChart) {
			moodChart.destroy();
		}

		const dark = isDarkMode();
		const textColor = dark ? '#d1d5db' : '#4b5563';
		const gridColor = dark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.15)';
		const tooltipBg = dark ? '#111827' : '#ffffff';
		const tooltipTitle = dark ? '#f9fafb' : '#1f2937';
		const tooltipBody = dark ? '#f3f4f6' : '#374151';
		const tooltipBorder = dark ? '#374151' : '#e5e7eb';

		moodChart = new Chart(moodChartCanvas, {
			type: 'line',
			data: {
				labels: chartData.labels,
				datasets: chartData.datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: {
					duration: 700,
					easing: 'easeOutQuart'
				},
				plugins: {
					legend: {
						labels: {
							color: textColor
						}
					},
					tooltip: {
						enabled: true,
						backgroundColor: tooltipBg,
						titleColor: tooltipTitle,
						bodyColor: tooltipBody,
						borderColor: tooltipBorder,
						borderWidth: 1
					}
				},
				scales: {
					x: {
						ticks: {
							color: textColor
						},
						grid: {
							color: gridColor
						}
					},
					y: {
						beginAtZero: true,
						ticks: {
							color: textColor,
							precision: 0
						},
						grid: {
							color: gridColor
						}
					}
				}
			}
		});
	}

	$effect(() => {
		const points = moodTimeline.length;
		const canvas = moodChartCanvas;

		if (!canvas || points === 0) {
			if (moodChart) {
				moodChart.destroy();
				moodChart = null;
			}
			return;
		}

		void renderMoodChart();
	});

	onDestroy(() => {
		if (moodChart) {
			moodChart.destroy();
			moodChart = null;
		}
	});

	function startEditing(entry: JournalEntry) {
		editingEntryId = entry.id;
		editableText = entry.content;
		editableMood = entry.mood ?? '';
		editableTags = entry.tags.join(', ');
		updateError = '';
		deleteError = '';
	}

	function cancelEditing() {
		editingEntryId = null;
		editableText = '';
		editableMood = '';
		editableTags = '';
		updateError = '';
	}

	async function deleteEntry(entryId: string) {
		if (!entryId || deletingEntryId) return;
		deleteError = '';
		if (typeof window !== 'undefined') {
			const confirmed = window.confirm('Är du säker på att du vill radera detta inlägg?');
			if (!confirmed) return;
		}

		const removedIndex = entries.findIndex((entry) => entry.id === entryId);
		if (removedIndex === -1) return;
		const removedEntry = entries[removedIndex];

		entries = entries.filter((entry) => entry.id !== entryId);
		setDiaryEntries(userId, entries);
		if (editingEntryId === entryId) {
			cancelEditing();
		}

		deletingEntryId = entryId;
		const restoreEntry = () => {
			if (entries.some((entry) => entry.id === removedEntry.id)) return;
			const next = [...entries];
			const insertAt = Math.min(removedIndex, next.length);
			next.splice(insertAt, 0, removedEntry);
			entries = next;
			setDiaryEntries(userId, entries);
		};

		const {
			data: { session },
			error: sessionError
		} = await supabase.auth.getSession();

		if (sessionError || !session?.user || !session.access_token) {
			deleteError = 'Du behöver vara inloggad för att radera anteckningar.';
			restoreEntry();
			deletingEntryId = null;
			return;
		}

		try {
			const response = await fetch('/api/diary/delete', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`
				},
				body: JSON.stringify({ id: entryId })
			});

			const result = (await response.json().catch(() => null)) as
				| DeleteDiarySuccessResponse
				| DeleteDiaryErrorResponse
				| null;

			if (!response.ok || !result || !result.success) {
				deleteError =
					result && 'error' in result ? result.error : 'Kunde inte radera anteckningen just nu.';
				restoreEntry();
				deletingEntryId = null;
				return;
			}
		} catch {
			deleteError = 'Kunde inte radera anteckningen just nu.';
			restoreEntry();
			deletingEntryId = null;
			return;
		}

		deletingEntryId = null;
		setDiaryEntries(userId, entries);
		void loadMoodTimeline();
	}

	async function saveEditedEntry() {
		const entryId = editingEntryId;
		const content = editableText.trim();

		if (!entryId || !content || updatingEntry) return;

		updatingEntry = true;
		updateError = '';

		const {
			data: { session },
			error: sessionError
		} = await supabase.auth.getSession();

		if (sessionError || !session?.user || !session.access_token) {
			updateError = 'Du behöver vara inloggad för att uppdatera anteckningar.';
			updatingEntry = false;
			return;
		}

		const parsedTags = parseTags(editableTags);

		const response = await fetch('/api/diary/update', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${session.access_token}`
			},
			body: JSON.stringify({
				id: entryId,
				text: content,
				mood: editableMood || null,
				tags: parsedTags.length > 0 ? parsedTags : null
			})
		});

		const result = (await response.json().catch(() => null)) as
			| UpdateDiarySuccessResponse
			| UpdateDiaryErrorResponse
			| null;

		if (!response.ok || !result || !result.success) {
			updateError =
				result && 'error' in result ? result.error : 'Kunde inte uppdatera anteckningen just nu.';
			updatingEntry = false;
			return;
		}

		entries = entries.map((entry) =>
			entry.id === result.diary.id
				? {
						...entry,
						content: result.diary.text,
						mood: result.diary.mood,
						tags: normalizeTags(result.diary.tags),
						created_at:
							typeof result.diary.created_at === 'string'
								? result.diary.created_at
								: entry.created_at
					}
				: entry
		);
		setDiaryEntries(userId, entries);

		updatingEntry = false;
		cancelEditing();
		showSavedConfirmation();
		void loadMoodTimeline();
	}

	async function saveEntry() {
		const content = note.trim();
		if (!content || saving) return;

		saving = true;
		error = '';

		const {
			data: { session },
			error: sessionError
		} = await supabase.auth.getSession();

		if (sessionError || !session?.user || !session.access_token) {
			console.error('Session missing', sessionError);
			error = 'Du behöver vara inloggad för att spara anteckningar.';
			saving = false;
			return;
		}

		const parsedTags = parseTags(tagsInput);

		const response = await fetch('/api/diary/create', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${session.access_token}`
			},
			body: JSON.stringify({
				text: content,
				mood: selectedMood || null,
				tags: parsedTags.length > 0 ? parsedTags : null
			})
		});

		const result = (await response.json().catch(() => null)) as
			| CreateDiarySuccessResponse
			| CreateDiaryErrorResponse
			| null;

		if (!response.ok || !result || !result.success) {
			error = result && 'error' in result ? result.error : 'Kunde inte spara anteckningen just nu.';
			saving = false;
			return;
		}

		note = '';
		tagsInput = '';
		selectedMood = '';
		reflection = null;
		reflectionDismissed = false;
		userId = session.user.id;
			isLoggedIn = true;

		const createdEntry: JournalEntry = {
			id: result.diary.id,
			content: result.diary.text,
			created_at: typeof result.diary.created_at === 'string' ? result.diary.created_at : null,
			tags: normalizeTags(result.diary.tags),
			mood: result.diary.mood
		};

		entries = [createdEntry, ...entries.filter((entry) => entry.id !== createdEntry.id)];
		if (entries.length === 1) {
			trackFirstDiaryEntry({
				hasMood: Boolean(createdEntry.mood),
				tagCount: createdEntry.tags.length
			});
		}
		setDiaryEntries(userId, entries);
		void loadMoodTimeline();
		showSavedConfirmation();
		fetchReflection(content);
		saving = false;
	}

	function getNextReminderAtIso() {
		const next = new Date();
		next.setDate(next.getDate() + 1);
		next.setHours(18, 0, 0, 0);
		return next.toISOString();
	}

	async function updateReminderPreference() {
		if (!userId || reminderSaving) return;

		const previousOptIn = reminderOptIn;
		const nextReminderAt = reminderOptIn ? getNextReminderAtIso() : null;

		reminderSaving = true;
		reminderError = '';

		const { error: updateError } = await supabase.auth.updateUser({
			data: {
				journal_reminder_opt_in: reminderOptIn,
				journal_reminder_next_at: nextReminderAt,
				journal_reminder_channel: reminderOptIn ? 'email' : null
			}
		});

		if (updateError) {
			reminderError = 'Kunde inte uppdatera påminnelsevalet just nu.';
			reminderOptIn = !previousOptIn;
			reminderSaving = false;
			return;
		}

		reminderNextAt = nextReminderAt;
		reminderSaving = false;
	}

	async function exportAsPdf() {
		if (exportingPdf || entries.length === 0) return;

		exportingPdf = true;
		error = '';

		try {
			const { jsPDF } = await import('jspdf');
			const doc = new jsPDF({ unit: 'pt', format: 'a4' });

			const marginX = 44;
			const contentWidth = doc.internal.pageSize.getWidth() - marginX * 2;
			const pageBottom = doc.internal.pageSize.getHeight() - 44;
			let y = 52;

			const ensureSpace = (needed: number) => {
				if (y + needed <= pageBottom) return;
				doc.addPage();
				y = 52;
			};

			doc.setFont('helvetica', 'bold');
			doc.setFontSize(16);
			doc.text('MittPsyke - Dagbok', marginX, y);
			y += 22;

			doc.setFont('helvetica', 'normal');
			doc.setFontSize(10);
			doc.text(`Exporterad: ${new Date().toLocaleString('sv-SE')}`, marginX, y);
			y += 24;

			for (const entry of entries) {
				const dateText = formatDateTime(entry.created_at) || 'Utan datum';
				const moodText = entry.mood ? `Känsla: ${entry.mood}` : '';
				const tagsText = entry.tags.length > 0 ? `Taggar: ${entry.tags.join(', ')}` : '';
				const contentLines = doc.splitTextToSize(entry.content || '', contentWidth);

				let estimatedHeight = 34 + contentLines.length * 14;
				if (moodText) estimatedHeight += 14;
				if (tagsText) estimatedHeight += 14;

				ensureSpace(estimatedHeight);

				doc.setFont('helvetica', 'bold');
				doc.setFontSize(11);
				doc.text(dateText, marginX, y);
				y += 16;

				doc.setFont('helvetica', 'normal');
				doc.setFontSize(10);
				if (moodText) {
					doc.text(moodText, marginX, y);
					y += 14;
				}

				if (tagsText) {
					doc.text(tagsText, marginX, y);
					y += 14;
				}

				doc.setFontSize(11);
				doc.text(contentLines, marginX, y);
				y += contentLines.length * 14 + 10;

				doc.setDrawColor(220);
				doc.line(marginX, y, marginX + contentWidth, y);
				y += 14;
			}

			doc.save('mittpsyke-dagbok.pdf');
		} catch {
			error = 'Kunde inte exportera PDF just nu.';
		} finally {
			exportingPdf = false;
		}
	}

	function formatDateTime(value: string | null) {
		if (!value) return '';
		return new Date(value).toLocaleString('sv-SE', {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}
</script>

<svelte:head>
	<title>Dagbok | Skriv, följ och förstå ditt mående | MittPsyke</title>
	<meta
		name="description"
		content="Skriv i dagboken, följ ditt mående över tid och få en lugn plats för reflektion. MittPsykes dagbok hjälper dig att se mönster och nästa steg."
	/>
	<meta property="og:title" content="Dagbok | Skriv, följ och förstå ditt mående | MittPsyke" />
	<meta
		property="og:description"
		content="En lugn digital dagbok där du kan skriva av dig, följa känslor över tid och få mer kontinuitet i ditt mående."
	/>
	<link rel="canonical" href="https://www.mittpsyke.se/dagbok" />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
</svelte:head>


{#if loading}
	<div class="container py-16 text-center opacity-60">Laddar din dagbok...</div>
{:else if isLoggedIn}
	<section class="container dagbok-page py-12" style={themeStyle}>
		{#if showWelcome}
			<button
				type="button"
				onclick={() => { showWelcome = false; }}
				class="w-full mb-5 rounded-[var(--radius-card)] border border-emerald-300/50 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-left transition-opacity hover:opacity-90"
			>
				Välkommen! 🎉 Det här är din dagbok. Börja med att skriva hur du mår just nu.
			</button>
		{/if}
		<div class="flex flex-wrap items-center justify-between gap-3 mb-2">
			<h2 class="text-2xl font-bold tracking-tight">Dagbok</h2>
			<button
				type="button"
				onclick={exportAsPdf}
				disabled={exportingPdf || entries.length === 0}
				aria-label="Exportera dagbok som PDF"
				class="px-4 py-2 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 bg-white/60 dark:bg-white/5 text-sm opacity-85 hover:opacity-100 disabled:opacity-45 transition-opacity"
			>
				{exportingPdf ? 'Exporterar...' : 'Exportera som PDF'}
			</button>
		</div>

		<p class="opacity-65 leading-relaxed mb-5 text-sm">Din privata plats att skriva fritt. Dagboken ersätter inte vård — vid akut fara, ring 112.</p>

		<!-- Personlig introtext -->
		<p class="text-base opacity-70 leading-relaxed mb-5 italic" style="color: var(--theme-accent, inherit)">
			{introText}
		</p>

		<!-- Senast sparat-bekräftelse -->
		{#if savedAt}
			<div
				class="mb-4 text-sm opacity-70 transition-opacity duration-700"
				style={savedFading ? 'opacity: 0' : ''}
			>
				Sparat {savedAt} ✓
			</div>
			{#if promptCheckin && savedAt}
				<p class="checkin-confirm" transition:fade>Bra jobbat 🌱 Du checkade in idag.</p>
			{/if}
		{/if}
		{#if reflectionLoading}
			<div class="reflection-box" transition:fade>
				<p class="reflection-loading">Reflekterar...</p>
			</div>
		{/if}
		{#if reflection && !reflectionDismissed}
			<div class="reflection-box" transition:fade>
				<p class="reflection-label">Din reflektion</p>
				<p class="reflection-text">{reflection}</p>
				<p class="reflection-dismiss">Du kan ignorera detta om du vill.</p>
				<button class="reflection-continue" onclick={() => { reflectionDismissed = true; reflectionFetchedForSave = false; document.querySelector('textarea')?.focus(); }}>Fortsätt skriva</button>
			</div>
		{/if}

		<!-- Fortsätt där du var -->
		{#if entries.length > 0}
			{@const lastEntry = entries[0]}
			<div
				class="mb-5 rounded-[var(--radius-card)] border border-black/8 dark:border-white/6 p-4 bg-white/30 dark:bg-white/[0.03]"
			>
				<p class="text-xs opacity-55 mb-1">
					{#if lastEntry.created_at}
						Senast skrev du {formatDateTime(lastEntry.created_at)}
					{:else}
						Du har tidigare anteckningar
					{/if}
				</p>
				<p class="text-sm opacity-75 leading-relaxed mb-2 line-clamp-2">{lastEntry.content}</p>
				<p class="text-xs opacity-50">Fortsätt där du var, eller börja något nytt.</p>
			</div>
		{/if}

		<div class="rounded-[var(--radius-card)] border border-black/10 dark:border-white/8 bg-white/45 dark:bg-[#1a1a1a] p-4 mb-7">
			<textarea
				bind:value={note}
				rows={6}
				placeholder="Skriv din anteckning här..."
				aria-label="Dagboksanteckning"
				class="w-full resize-y rounded-[var(--radius-input)] border border-black/12 dark:border-white/10 bg-white dark:bg-[#242424] dark:text-[#f0ede8] px-4 py-3 text-sm leading-relaxed outline-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 focus:border-[var(--primary)] transition-colors"
			></textarea>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
				<div>
					<label class="block text-xs opacity-75 mb-1" for="mood">Känsla (valfritt)</label>
					<div class="relative">
						<select
							id="mood"
							name="mood"
							bind:value={selectedMood}
							class="w-full appearance-none rounded-[var(--radius-input)] border border-black/12 dark:border-white/10 bg-white dark:bg-[#242424] dark:text-[#f0ede8] px-3 py-2.5 pr-10 text-sm outline-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 transition-colors focus:border-[var(--primary)]"
						>
							<option value="">Välj känsla</option>
							{#each moods as mood}
								<option value={mood}>{mood}</option>
							{/each}
						</select>
						<svg
							aria-hidden="true"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
						>
							<path
								fill-rule="evenodd"
								d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
				</div>

				<div>
					<label class="block text-xs opacity-75 mb-1" for="tags">Taggar (valfritt)</label>
					<input
						id="tags"
						type="text"
						bind:value={tagsInput}
						placeholder="t.ex. sömn, oro, lättnad"
						class="w-full rounded-[var(--radius-input)] border border-black/12 dark:border-white/10 bg-white dark:bg-[#242424] dark:text-[#f0ede8] px-3 py-2.5 text-sm outline-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 focus:border-[var(--primary)] transition-colors"
					/>
				</div>
			</div>

			<div class="mt-3 flex justify-end">
				<button
					type="button"
					onclick={saveEntry}
					disabled={saving || !note.trim()}
					aria-label="Spara anteckning"
					class="px-5 py-2.5 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 bg-white/60 dark:bg-white/5 text-sm font-medium opacity-90 hover:opacity-100 disabled:opacity-45 transition-opacity"
				>
					{saving ? 'Sparar...' : 'Spara'}
				</button>
			</div>
			{#if error}
				<p class="mt-2 text-sm opacity-70">{error}</p>
			{/if}
		</div>

		<div class="mb-7 rounded-[var(--radius-card)] border border-black/10 dark:border-white/8 bg-white/45 dark:bg-[#1a1a1a] p-4">
			<div class="mb-3 flex items-center justify-between gap-3">
				<h2 class="text-sm font-semibold">Känslotrender över tid</h2>
				<button
					type="button"
					onclick={loadMoodTimeline}
					aria-label="Visa känslotrender"
					disabled={statsLoading}
					class="rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 px-3 py-1.5 text-xs opacity-85 hover:opacity-100 disabled:opacity-50 transition-opacity"
				>
					{statsLoading ? 'Laddar statistik...' : 'Uppdatera'}
				</button>
			</div>

			{#if !statsError}
				<div class="mb-3 rounded-[var(--radius-input)] border border-black/8 dark:border-white/8 bg-black/3 dark:bg-white/5 p-3">
					<p class="mb-1 text-xs font-semibold uppercase tracking-wide opacity-60">Reflektion</p>
					<p class="text-sm leading-relaxed">{moodReflection}</p>
				</div>
			{/if}

			{#if statsError}
				<p class="text-sm opacity-70">{statsError}</p>
			{:else if statsLoading && moodTimeline.length === 0}
				<p class="text-sm opacity-70">Laddar känslostatistik. Det kan ta en liten stund.</p>
			{:else if moodTimeline.length === 0}
				<p class="text-sm opacity-70">Ingen känslodata ännu. När du har skrivit några inlägg med känsloläge visas mönster här.</p>
			{:else}
				<div class="h-72 w-full">
					<canvas bind:this={moodChartCanvas} aria-label="Känslotrender per dag"></canvas>
				</div>
			{/if}
		</div>

		<div class="space-y-3">
			{#if entries.length === 0}
				<div
					class="rounded-[var(--radius-card)] border p-6 text-center"
					style={themeAccent
						? `border-color: ${themeAccent}30; background: ${themeBg || 'transparent'}`
						: 'border-color: rgba(0,0,0,0.08); background: rgba(255,255,255,0.3)'}
				>
					<p class="text-lg font-medium mb-2 opacity-80">Dagboken är din plats</p>
					<p class="text-sm opacity-60 leading-relaxed max-w-sm mx-auto mb-1">
						Du kan skriva fritt, kort eller långt. Börja där du är idag.
					</p>
					<p class="text-xs opacity-45">Det finns inget rätt sätt att skriva här. Några ord kan räcka.</p>
				</div>
			{:else}
				{#each entries as entry (entry.id)}
					<article class="rounded-[var(--radius-card)] border border-black/10 dark:border-white/8 bg-white/45 dark:bg-[#1a1a1a] p-4">
						{#if editingEntryId === entry.id}
							<p class="text-xs opacity-60 mb-2">{formatDateTime(entry.created_at)}</p>
							<textarea
								bind:value={editableText}
								rows={5}
								class="w-full resize-y rounded-[var(--radius-input)] border border-black/12 dark:border-white/10 bg-white dark:bg-[#242424] dark:text-[#f0ede8] px-4 py-3 text-sm leading-relaxed outline-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 focus:border-[var(--primary)] transition-colors"
							></textarea>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
								<div>
									<label class="block text-xs opacity-75 mb-1" for={`edit-mood-${entry.id}`}>
										Känsla (valfritt)
									</label>
									<div class="relative">
										<select
											id={`edit-mood-${entry.id}`}
											bind:value={editableMood}
											class="w-full appearance-none rounded-[var(--radius-input)] border border-black/12 dark:border-white/10 bg-white dark:bg-[#242424] dark:text-[#f0ede8] px-3 py-2.5 pr-10 text-sm outline-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 transition-colors focus:border-[var(--primary)]"
										>
											<option value="">Välj känsla</option>
											{#each moods as mood}
												<option value={mood}>{mood}</option>
											{/each}
										</select>
										<svg
											aria-hidden="true"
											viewBox="0 0 20 20"
											fill="currentColor"
											class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
										>
											<path
												fill-rule="evenodd"
												d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
												clip-rule="evenodd"
											/>
										</svg>
									</div>
								</div>

								<div>
									<label class="block text-xs opacity-75 mb-1" for={`edit-tags-${entry.id}`}>
										Taggar (valfritt)
									</label>
									<input
										id={`edit-tags-${entry.id}`}
										type="text"
										bind:value={editableTags}
										placeholder="t.ex. sömn, oro, lättnad"
										class="w-full rounded-[var(--radius-input)] border border-black/12 dark:border-white/10 bg-white dark:bg-[#242424] dark:text-[#f0ede8] px-3 py-2.5 text-sm outline-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 focus:border-[var(--primary)] transition-colors"
									/>
								</div>
							</div>

							<div class="mt-3 flex justify-end gap-2">
								<button
									type="button"
									onclick={cancelEditing}
									aria-label="Avbryt redigering"
									disabled={updatingEntry}
									class="px-4 py-2 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 bg-white/50 dark:bg-white/5 text-sm opacity-85 hover:opacity-100 disabled:opacity-45 transition-opacity"
								>
									Avbryt
								</button>
								<button
									type="button"
									onclick={saveEditedEntry}
									aria-label="Spara ändringar"
									disabled={updatingEntry || !editableText.trim()}
									class="px-4 py-2 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 bg-white/60 dark:bg-white/5 text-sm font-medium opacity-90 hover:opacity-100 disabled:opacity-45 transition-opacity"
								>
									{updatingEntry ? 'Sparar...' : 'Spara ändringar'}
								</button>
							</div>
							{#if updateError}
								<p class="mt-2 text-sm opacity-70">{updateError}</p>
							{/if}
						{:else}
							<div class="mb-2 flex items-start justify-between gap-3">
								<p class="text-xs opacity-60">{formatDateTime(entry.created_at)}</p>
								<div class="flex items-center gap-2">
									<button
										type="button"
										onclick={() => startEditing(entry)}
										aria-label="Redigera anteckning"
										disabled={deletingEntryId === entry.id}
										class="text-xs px-2.5 py-1 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 bg-white/50 dark:bg-white/5 opacity-85 hover:opacity-100 disabled:opacity-45 transition-opacity"
									>
										Redigera
									</button>
									<button
										type="button"
										onclick={() => deleteEntry(entry.id)}
										aria-label="Radera anteckning"
										disabled={deletingEntryId === entry.id}
										class="text-xs px-2.5 py-1 rounded-[var(--radius-input)] border border-red-300 dark:border-red-700/40 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 opacity-90 hover:opacity-100 disabled:opacity-45 transition-opacity"
									>
										{deletingEntryId === entry.id ? 'Raderar...' : 'Radera'}
									</button>
								</div>
							</div>
							{#if entry.mood || entry.tags.length > 0}
								<p class="text-xs opacity-65 mb-2">
									{#if entry.mood}<span>Känsla: {entry.mood}</span>{/if}
									{#if entry.tags.length > 0}
										{#if entry.mood}<span class="mx-1">·</span>{/if}
										<span>Taggar: {entry.tags.join(', ')}</span>
									{/if}
								</p>
							{/if}
							<p class="text-sm leading-relaxed whitespace-pre-wrap opacity-85">{entry.content}</p>
						{/if}
					</article>
				{/each}
			{/if}
			{#if deleteError}
				<p class="text-sm opacity-70">{deleteError}</p>
			{/if}
		</div>

		<div class="mt-6 rounded-[var(--radius-input)] border border-black/10 dark:border-white/8 bg-white/40 dark:bg-[#1a1a1a] p-3">
			<label class="flex items-start gap-2 text-sm opacity-80">
				<input
					type="checkbox"
					bind:checked={reminderOptIn}
					onchange={updateReminderPreference}
					class="mt-0.5 h-4 w-4 rounded border-black/20 dark:border-white/20"
				/>
				<span>Skicka påminnelse om att skriva dagbok</span>
			</label>
			<p class="mt-2 text-xs opacity-60">
				Valet sparas i din profil så att påminnelser kan hanteras via e-post eller notifiering.
			</p>
			{#if reminderOptIn && reminderNextAt}
				<p class="mt-1 text-xs opacity-60">Nästa möjliga påminnelse: {formatDateTime(reminderNextAt)}</p>
			{/if}
			{#if reminderSaving}
				<p class="mt-1 text-xs opacity-60">Sparar påminnelseval...</p>
			{/if}
			{#if reminderError}
				<p class="mt-1 text-xs opacity-70">{reminderError}</p>
			{/if}
		</div>

		<p class="mt-4 text-xs opacity-50 text-center">Läs mer om hur uppgifter hanteras i <a href="/integritet" class="underline underline-offset-2">integritetspolicyn</a>.</p>
	</section>
{:else}
	<!-- Landing for non-logged-in visitors -->
	<section class="container dagbok-page py-16">
		<div class="text-center mb-10">
			<h1 class="text-3xl font-bold tracking-tight mb-3">Din personliga dagbok</h1>
			<p class="text-lg opacity-75 leading-relaxed max-w-md mx-auto">
				En lugn plats att skriva av dig, följa dina känslor och se mönster över tid.
			</p>
		</div>

		<div class="space-y-3 mb-10 max-w-sm mx-auto">
			<div class="flex items-start gap-3 rounded-[var(--radius-card)] border border-black/8 dark:border-white/8 bg-white/40 dark:bg-white/[0.03] p-4">
				<span class="text-xl shrink-0">✍️</span>
				<div>
					<p class="text-sm font-medium mb-0.5">Skriv fritt</p>
					<p class="text-xs opacity-65 leading-relaxed">Reflektera i din egen takt — ingen dömer.</p>
				</div>
			</div>
			<div class="flex items-start gap-3 rounded-[var(--radius-card)] border border-black/8 dark:border-white/8 bg-white/40 dark:bg-white/[0.03] p-4">
				<span class="text-xl shrink-0">😊</span>
				<div>
					<p class="text-sm font-medium mb-0.5">Välj humör</p>
					<p class="text-xs opacity-65 leading-relaxed">Se mönster över tid genom att tagga dina inlägg.</p>
				</div>
			</div>
			<div class="flex items-start gap-3 rounded-[var(--radius-card)] border border-black/8 dark:border-white/8 bg-white/40 dark:bg-white/[0.03] p-4">
				<span class="text-xl shrink-0">📈</span>
				<div>
					<p class="text-sm font-medium mb-0.5">Följ framsteg</p>
					<p class="text-xs opacity-65 leading-relaxed">Streaks, statistik och milstolpar — allt på ett ställe.</p>
				</div>
			</div>
		</div>

		<div class="text-center space-y-3">
			<a
				href="/register"
				class="inline-block px-6 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white font-medium transition-opacity hover:opacity-90"
				onclick={trackDagbokCtaClick}
			>
				Skapa konto för att börja skriva
			</a>
			<p class="text-sm opacity-55">
				Eller <a href="/#fokusomraden" class="underline hover:opacity-80">börja med ett anonymt samtal</a>
			</p>
		</div>

		<p class="mt-10 text-xs opacity-40 text-center max-w-sm mx-auto leading-relaxed">
			Dagboken är till för reflektion i vardagen. Den ersätter inte vård. Vid akut fara, ring 112. För vårdråd, kontakta 1177.
		</p>
	</section>
{/if}

<style>
    .dagbok-page {
        max-width: 840px;
        margin: 0 auto;
    }
	.checkin-confirm {
		font-size: 0.85rem;
		color: var(--theme-accent, #0f766e);
		margin-top: 0.3rem;
		font-weight: 500;
	}
	.reflection-box {
		margin-top: 1rem;
		padding: 1rem 1.2rem;
		background: var(--theme-bg, rgba(15,118,110,0.05));
		border-left: 3px solid var(--theme-accent, #0f766e);
		border-radius: 8px;
	}
	.reflection-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.5;
		margin-bottom: 0.4rem;
	}
	.reflection-text {
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--theme-accent, #0f766e);
		font-style: italic;
	}
	.reflection-loading {
		font-size: 0.85rem;
		opacity: 0.5;
		font-style: italic;
	}
	.reflection-dismiss {
		font-size: 0.75rem;
		opacity: 0.4;
		margin-top: 0.6rem;
	}
	.reflection-continue {
		margin-top: 0.5rem;
		padding: 0.35rem 1rem;
		border-radius: 8px;
		background: var(--theme-accent, #0f766e);
		color: #fff;
		border: none;
		font-size: 0.8rem;
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.reflection-continue:hover {
		opacity: 0.85;
	}
	@media (prefers-color-scheme: dark) {
		.reflection-text { color: #a7d8c8; }
		.reflection-box { background: rgba(255,255,255,0.05); }
	}
</style>
