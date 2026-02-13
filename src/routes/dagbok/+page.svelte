<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { onDestroy } from 'svelte';
	import type { Chart as ChartInstance } from 'chart.js';

	type JournalEntry = {
		id: string;
		content: string;
		created_at: string | null;
		tags: string[];
		mood: string | null;
	};

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
		percentageChange: number;
		direction: 'up' | 'down' | 'flat';
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

	let loading = $state(true);
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
	let moodChartCanvas = $state<HTMLCanvasElement | null>(null);
	let moodChart: ChartInstance | null = null;

	$effect(() => {
		async function init() {
			const { data } = await supabase.auth.getSession();
			const session = data.session;

			if (!session) {
				goto('/login');
				return;
			}

			userId = session.user.id;

			const metadata = (session.user.user_metadata ?? {}) as Record<string, unknown>;
			reminderOptIn = Boolean(metadata.journal_reminder_opt_in);
			reminderNextAt =
				typeof metadata.journal_reminder_next_at === 'string'
					? metadata.journal_reminder_next_at
					: null;

			applyPrefillFromUrl();
			await loadEntries(userId);
			await loadMoodTimeline();
			loading = false;
		}

		init();
	});

	function applyPrefillFromUrl() {
		if (typeof window === 'undefined') return;

		const url = new URL(window.location.href);
		const prefill = url.searchParams.get('prefill');
		if (!prefill) return;

		note = prefill;
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
				const percentageChange =
					previousCount === 0
						? currentCount === 0
							? 0
							: 100
						: ((currentCount - previousCount) / previousCount) * 100;

				const direction: MoodWeeklyTrend['direction'] =
					percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'flat';

				return {
					mood,
					currentCount,
					previousCount,
					percentageChange,
					direction
				};
			})
			.sort((a, b) => a.mood.localeCompare(b.mood, 'sv-SE'));

		return trends;
	}

	function formatPercentageChange(value: number) {
		return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
	}

	async function loadEntries(uid: string) {
		const { data, error: loadError } = await supabase
			.from('diary')
			.select('id, text, created_at, tags, mood')
			.eq('user_id', uid)
			.order('created_at', { ascending: false });

		const diaryTableMissing =
			loadError?.code === 'PGRST205' ||
			loadError?.code === '42P01' ||
			(loadError?.message ?? '').includes("Could not find the table 'public.diary'");

		if (diaryTableMissing) {
			const { data: legacyData, error: legacyLoadError } = await supabase
				.from('journal_entries')
				.select('id, content, created_at, tags, mood')
				.eq('user_id', uid)
				.order('created_at', { ascending: false });

			if (legacyLoadError) {
				const legacyTableMissing =
					legacyLoadError.code === 'PGRST205' ||
					legacyLoadError.code === '42P01' ||
					(legacyLoadError.message ?? '').includes(
						"Could not find the table 'public.journal_entries'"
					);
				if (legacyTableMissing) {
					error = 'Databastabell saknas. Be administratören köra supabase/diary.sql i Supabase.';
					return;
				}
				error = 'Kunde inte hämta anteckningar just nu.';
				return;
			}

			entries = (legacyData ?? []).map((entry) => ({
				id: typeof entry.id === 'string' ? entry.id : '',
				content: typeof entry.content === 'string' ? entry.content : '',
				created_at: typeof entry.created_at === 'string' ? entry.created_at : null,
				tags: normalizeTags(entry.tags),
				mood: typeof entry.mood === 'string' ? entry.mood : null
			}));
			return;
		}

		if (loadError) {
			error = 'Kunde inte hämta anteckningar just nu.';
			return;
		}

		entries = (data ?? []).map((entry) => ({
			id: typeof entry.id === 'string' ? entry.id : '',
			content: typeof entry.text === 'string' ? entry.text : '',
			created_at: typeof entry.created_at === 'string' ? entry.created_at : null,
			tags: normalizeTags(entry.tags),
			mood: typeof entry.mood === 'string' ? entry.mood : null
		}));
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
			statsLoading = false;
		} catch {
			statsError = 'Kunde inte hämta känslostatistik just nu.';
			moodTimeline = [];
			moodWeeklyTrends = [];
			statsLoading = false;
		}
	}

	async function renderMoodChart() {
		if (typeof window === 'undefined' || !moodChartCanvas || moodTimeline.length === 0) return;

		const chartData = buildMoodChartData(moodTimeline);
		if (chartData.labels.length === 0 || chartData.datasets.length === 0) return;

		const { default: Chart } = await import('chart.js/auto');

		if (moodChart) {
			moodChart.destroy();
		}

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
							color: '#e5e7eb'
						}
					},
					tooltip: {
						enabled: true,
						backgroundColor: '#111827',
						titleColor: '#f9fafb',
						bodyColor: '#f3f4f6',
						borderColor: '#374151',
						borderWidth: 1
					}
				},
				scales: {
					x: {
						ticks: {
							color: '#d1d5db'
						},
						grid: {
							color: 'rgba(148, 163, 184, 0.2)'
						}
					},
					y: {
						beginAtZero: true,
						ticks: {
							color: '#d1d5db',
							precision: 0
						},
						grid: {
							color: 'rgba(148, 163, 184, 0.2)'
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

		updatingEntry = false;
		cancelEditing();
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

		if (!response.ok) {
			const result = (await response.json().catch(() => null)) as
				| { error?: string; success?: false }
				| null;
			error = result?.error || 'Kunde inte spara anteckningen just nu.';
			saving = false;
			return;
		}

		note = '';
		tagsInput = '';
		selectedMood = '';
		userId = session.user.id;
		await loadEntries(session.user.id);
		void loadMoodTimeline();
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
	<title>Dagbok - MittPsyke</title>
</svelte:head>

{#if loading}
	<div class="container py-16 text-center opacity-60">Laddar...</div>
{:else}
	<section class="container max-w-2xl py-12">
		<div class="flex flex-wrap items-center justify-between gap-3 mb-3">
			<h1 class="text-3xl font-bold tracking-tight">Dagbok</h1>
			<button
				type="button"
				onclick={exportAsPdf}
				disabled={exportingPdf || entries.length === 0}
				class="px-4 py-2 rounded-xl border border-black/12 dark:border-white/12 bg-white/60 dark:bg-white/5 text-sm opacity-85 hover:opacity-100 disabled:opacity-45 transition-opacity"
			>
				{exportingPdf ? 'Exporterar...' : 'Exportera som PDF'}
			</button>
		</div>

		<p class="opacity-75 leading-relaxed mb-6">Detta är din privata plats att skriva fritt.</p>

		<div class="rounded-2xl border border-black/10 dark:border-white/10 bg-white/45 dark:bg-white/5 p-4 mb-7">
			<textarea
				bind:value={note}
				rows={6}
				placeholder="Skriv din anteckning här..."
				class="w-full resize-y rounded-xl border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 px-4 py-3 text-sm leading-relaxed outline-none focus:border-[var(--primary)] transition-colors"
			></textarea>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
				<div>
					<label class="block text-xs opacity-65 mb-1" for="mood">Känsla (valfritt)</label>
					<div class="relative">
						<select
							id="mood"
							name="mood"
							bind:value={selectedMood}
							class="w-full appearance-none rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 pr-10 text-sm text-slate-100 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
						>
							<option value="" class="bg-slate-800 text-slate-100">Välj känsla</option>
							{#each moods as mood}
								<option value={mood} class="bg-slate-800 text-slate-100">{mood}</option>
							{/each}
						</select>
						<svg
							aria-hidden="true"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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
					<label class="block text-xs opacity-65 mb-1" for="tags">Taggar (valfritt)</label>
					<input
						id="tags"
						type="text"
						bind:value={tagsInput}
						placeholder="t.ex. sömn, oro, lättnad"
						class="w-full rounded-xl border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)] transition-colors"
					/>
				</div>
			</div>

			<div class="mt-3 flex justify-end">
				<button
					type="button"
					onclick={saveEntry}
					disabled={saving || !note.trim()}
					class="px-5 py-2.5 rounded-xl border border-black/12 dark:border-white/12 bg-white/60 dark:bg-white/5 text-sm font-medium opacity-90 hover:opacity-100 disabled:opacity-45 transition-opacity"
				>
					{saving ? 'Sparar...' : 'Spara'}
				</button>
			</div>
			{#if error}
				<p class="mt-2 text-sm opacity-70">{error}</p>
			{/if}
		</div>

		<div class="mb-7 rounded-2xl border border-slate-700/70 bg-slate-900/80 p-4">
			<div class="mb-3 flex items-center justify-between gap-3">
				<h2 class="text-sm font-semibold text-slate-100">Känslotrender över tid</h2>
				<button
					type="button"
					onclick={loadMoodTimeline}
					disabled={statsLoading}
					class="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 opacity-90 transition-opacity hover:opacity-100 disabled:opacity-50"
				>
					{statsLoading ? 'Laddar...' : 'Uppdatera'}
				</button>
			</div>

			{#if !statsError && moodWeeklyTrends.length > 0}
				<div class="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
					{#each moodWeeklyTrends as trend}
						<div class="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2">
							<span class="text-sm text-slate-100">{trend.mood}</span>
							<span
								class={`text-xs font-medium ${
									trend.direction === 'up'
										? 'text-emerald-300'
										: trend.direction === 'down'
											? 'text-rose-300'
											: 'text-slate-300'
								}`}
							>
								{trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
								&nbsp;{formatPercentageChange(trend.percentageChange)}
							</span>
						</div>
					{/each}
				</div>
			{/if}

			{#if statsError}
				<p class="text-sm text-slate-300">{statsError}</p>
			{:else if statsLoading && moodTimeline.length === 0}
				<p class="text-sm text-slate-300">Laddar känslostatistik...</p>
			{:else if moodTimeline.length === 0}
				<p class="text-sm text-slate-300">Ingen känslodata ännu.</p>
			{:else}
				<div class="h-72 w-full">
					<canvas bind:this={moodChartCanvas} aria-label="Känslotrender per dag"></canvas>
				</div>
			{/if}
		</div>

		<div class="space-y-3">
			{#if entries.length === 0}
				<p class="text-sm opacity-60">Inga anteckningar ännu.</p>
			{:else}
				{#each entries as entry (entry.id)}
					<article class="rounded-2xl border border-black/10 dark:border-white/10 bg-white/45 dark:bg-white/5 p-4">
						{#if editingEntryId === entry.id}
							<p class="text-xs opacity-60 mb-2">{formatDateTime(entry.created_at)}</p>
							<textarea
								bind:value={editableText}
								rows={5}
								class="w-full resize-y rounded-xl border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 px-4 py-3 text-sm leading-relaxed outline-none focus:border-[var(--primary)] transition-colors"
							></textarea>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
								<div>
									<label class="block text-xs opacity-65 mb-1" for={`edit-mood-${entry.id}`}>
										Känsla (valfritt)
									</label>
									<div class="relative">
										<select
											id={`edit-mood-${entry.id}`}
											bind:value={editableMood}
											class="w-full appearance-none rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 pr-10 text-sm text-slate-100 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
										>
											<option value="" class="bg-slate-800 text-slate-100">Välj känsla</option>
											{#each moods as mood}
												<option value={mood} class="bg-slate-800 text-slate-100">{mood}</option>
											{/each}
										</select>
										<svg
											aria-hidden="true"
											viewBox="0 0 20 20"
											fill="currentColor"
											class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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
									<label class="block text-xs opacity-65 mb-1" for={`edit-tags-${entry.id}`}>
										Taggar (valfritt)
									</label>
									<input
										id={`edit-tags-${entry.id}`}
										type="text"
										bind:value={editableTags}
										placeholder="t.ex. sömn, oro, lättnad"
										class="w-full rounded-xl border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)] transition-colors"
									/>
								</div>
							</div>

							<div class="mt-3 flex justify-end gap-2">
								<button
									type="button"
									onclick={cancelEditing}
									disabled={updatingEntry}
									class="px-4 py-2 rounded-xl border border-black/12 dark:border-white/12 bg-white/50 dark:bg-white/5 text-sm opacity-85 hover:opacity-100 disabled:opacity-45 transition-opacity"
								>
									Avbryt
								</button>
								<button
									type="button"
									onclick={saveEditedEntry}
									disabled={updatingEntry || !editableText.trim()}
									class="px-4 py-2 rounded-xl border border-black/12 dark:border-white/12 bg-white/60 dark:bg-white/5 text-sm font-medium opacity-90 hover:opacity-100 disabled:opacity-45 transition-opacity"
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
										disabled={deletingEntryId === entry.id}
										class="text-xs px-2.5 py-1 rounded-lg border border-black/12 dark:border-white/12 bg-white/50 dark:bg-white/5 opacity-85 hover:opacity-100 disabled:opacity-45 transition-opacity"
									>
										Redigera
									</button>
									<button
										type="button"
										onclick={() => deleteEntry(entry.id)}
										disabled={deletingEntryId === entry.id}
										class="text-xs px-2.5 py-1 rounded-lg border border-red-700/40 bg-red-900/20 text-red-100 opacity-90 hover:opacity-100 disabled:opacity-45 transition-opacity"
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

		<div class="mt-6 rounded-xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 p-3">
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

		<p class="mt-4 text-xs opacity-50 text-center">Det du skriver här delas inte med någon.</p>
	</section>
{/if}
