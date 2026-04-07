<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { trackSignupCompleted, trackDiaryPageOpenedFromHoroscope } from '$lib/analytics';
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';
	import DiaryMoodTimeline from '$lib/components/DiaryMoodTimeline.svelte';
	import { supabase } from '$lib/supabase';
	import { loadDiaryEntries, type DiaryEntry } from '$lib/state/diary';
	import type { Session, User } from '@supabase/supabase-js';
	import type {
		CommunityMySharesSuccessResponse,
		CreateCommunityShareSuccessResponse,
		CreateCommunityUnshareSuccessResponse
	} from '$lib/types';

	type PageData = {
		entries?: DiaryEntry[];
		sharedEntryIds?: string[];
		session?: Session | null;
	};

	let { data } = $props<{ data: PageData }>();

	let entries = $state<DiaryEntry[]>([]);
	let loading = $state(false);
	let sessionUser = $state<User | null>(null);
	let isLoggedIn = $derived(Boolean(sessionUser));
	let loadError = $state('');
	let draftText = $state('');
	let draftMood = $state('');
	let draftMoodPreview = $state(5);
	let draftError = $state('');
	let draftSuccess = $state('');
	let savingDraft = $state(false);
	type MoodGraphPoint = { mood: number };
	let moodGraphPoints = $derived.by(() => buildMoodGraphPoints(entries));
	let weeklyEntryCount = $derived.by(() => countEntriesThisWeek(entries));
	let hasDraftToResume = $derived(draftText.trim().length > 0);
	let hasSavedEntries = $derived(entries.length > 0);
	let sharedEntryIds = $state(new Set<string>());
	let confirmingShareEntryId = $state('');
	let confirmingUnshareEntryId = $state('');
	let sharingEntryId = $state('');
	let unsharingEntryId = $state('');
	let shareFeedbackEntryId = $state('');
	let shareFeedbackMessage = $state('');
	let shareFeedbackType = $state<'success' | 'error' | 'info'>('info');
	let shareFeedbackShowCommunityLink = $state(false);
	let editingEntryId = $state('');
	let editingText = $state('');
	let editingMood = $state('');
	let editingMoodPreview = $state(5);
	let savingEditId = $state('');
	let editError = $state('');
	let confirmingDeleteEntryId = $state('');
	let deletingEntryId = $state('');
	let deleteErrorEntryId = $state('');
	let deleteErrorMessage = $state('');

	$effect(() => {
		entries = data.entries ?? [];
		sessionUser = data.session?.user ?? null;
		sharedEntryIds = new Set<string>(data.sharedEntryIds ?? []);
	});

	function parseStoredDraft(value: string | null): string {
		if (!value) return '';

		try {
			const parsed = JSON.parse(value);
			if (typeof parsed === 'string') return parsed.trim();
			if (parsed && typeof parsed === 'object' && typeof parsed.content === 'string') {
				return parsed.content.trim();
			}
		} catch {
			return value.trim();
		}

		return value.trim();
	}

	function formatDate(value: string | null): string {
		if (!value) return 'Okänt datum';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return 'Okänt datum';
		return date.toLocaleDateString('sv-SE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function parseMoodValue(value: string | null): number | null {
		if (!value) return null;
		const numeric = Number(value);
		if (!Number.isFinite(numeric)) return null;
		if (numeric < 1 || numeric > 10) return null;
		return Math.round(numeric);
	}

	function moodX(index: number, total: number): number {
		if (total <= 1) return 50;
		return 4 + (index / (total - 1)) * 92;
	}

	function moodY(mood: number): number {
		return 34 - ((mood - 1) / 9) * 26;
	}

	function buildMoodPolyline(points: MoodGraphPoint[]): string {
		if (points.length === 0) return '';
		return points
			.map((point, index) => `${moodX(index, points.length)},${moodY(point.mood)}`)
			.join(' ');
	}

	function moodLabel(value: number) {
		if (value <= 2) return 'Väldigt tungt';
		if (value <= 4) return 'Tungt';
		if (value <= 6) return 'Mitt emellan';
		if (value <= 8) return 'Lite lättare';
		return 'Mer stabilt';
	}

	function handleMoodInput(event: Event) {
		const value = Number((event.currentTarget as HTMLInputElement).value);
		if (!Number.isFinite(value)) return;
		draftMoodPreview = value;
		draftMood = String(value);
	}

	function clearMoodSelection() {
		draftMood = '';
		draftMoodPreview = 5;
	}

	function buildMoodGraphPoints(source: DiaryEntry[]): MoodGraphPoint[] {
		const points: MoodGraphPoint[] = [];
		for (const entry of source) {
			const mood = parseMoodValue(entry.mood);
			if (mood === null) continue;
			points.push({ mood });
			if (points.length >= 10) break;
		}
		return points.reverse();
	}

	function countEntriesThisWeek(source: DiaryEntry[]): number {
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - 6);
		cutoff.setHours(0, 0, 0, 0);

		return source.filter((entry) => {
			if (!entry.created_at) return false;
			const created = new Date(entry.created_at);
			if (Number.isNaN(created.getTime())) return false;
			return created >= cutoff;
		}).length;
	}

	function isEntryShared(entryId: string): boolean {
		return sharedEntryIds.has(entryId);
	}

	function setShareFeedback(entryId: string, message: string, type: 'success' | 'error' | 'info') {
		shareFeedbackEntryId = entryId;
		shareFeedbackMessage = message;
		shareFeedbackType = type;
		shareFeedbackShowCommunityLink = false;
	}

	async function loadEntries(options: { force?: boolean } = {}) {
		const { data } = await supabase.auth.getSession();
		const userId = data.session?.user?.id;
		if (!userId) {
			entries = [];
			sharedEntryIds = new Set();
			return;
		}

		entries = await loadDiaryEntries(userId, options);
	}

	async function loadSharedEntryIds() {
		const { data } = await supabase.auth.getSession();
		const session = data.session;

		if (!session?.access_token) {
			sharedEntryIds = new Set();
			return;
		}

		try {
			const response = await fetch('/api/community/my-shares', {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${session.access_token}`
				}
			});

			if (!response.ok) {
				return;
			}

			const payload = (await response.json().catch(() => null)) as CommunityMySharesSuccessResponse | null;
			if (!payload?.success || !Array.isArray(payload.diaryEntryIds)) {
				return;
			}

			sharedEntryIds = new Set(payload.diaryEntryIds.filter((id) => typeof id === 'string' && id.length > 0));
		} catch {
			// Silent fallback: sharing status can load later without blocking the diary.
		}
	}

	function openShareConfirmation(entryId: string) {
		confirmingShareEntryId = entryId;
		confirmingUnshareEntryId = '';
		shareFeedbackEntryId = '';
		shareFeedbackMessage = '';
		shareFeedbackShowCommunityLink = false;
	}

	function closeShareConfirmation() {
		if (sharingEntryId) return;
		confirmingShareEntryId = '';
	}

	function openUnshareConfirmation(entryId: string) {
		confirmingUnshareEntryId = entryId;
		confirmingShareEntryId = '';
		shareFeedbackEntryId = '';
		shareFeedbackMessage = '';
		shareFeedbackShowCommunityLink = false;
	}

	function closeUnshareConfirmation() {
		if (unsharingEntryId) return;
		confirmingUnshareEntryId = '';
	}

	async function shareEntryAnonymously(entry: DiaryEntry) {
		if (sharingEntryId || unsharingEntryId || !entry.id) return;

		if (isEntryShared(entry.id)) {
			setShareFeedback(entry.id, 'Det här inlägget är redan delat i Gemenskap.', 'info');
			confirmingShareEntryId = '';
			return;
		}

		sharingEntryId = entry.id;

		try {
			const { data } = await supabase.auth.getSession();
			const session = data.session;

			if (!session?.access_token) {
				setShareFeedback(entry.id, 'Logga in för att dela inlägget anonymt.', 'error');
				return;
			}

			const response = await fetch('/api/community/share', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`
				},
				body: JSON.stringify({ diaryEntryId: entry.id })
			});

			const payload = (await response.json().catch(() => null)) as
				| CreateCommunityShareSuccessResponse
				| { success?: boolean; error?: string; alreadyShared?: boolean }
				| null;

			if (!response.ok || !payload) {
				const errorPayload = payload as { error?: string; alreadyShared?: boolean } | null;
				const alreadyShared = response.status === 409 && Boolean(errorPayload?.alreadyShared);
				if (alreadyShared) {
					sharedEntryIds = new Set([...sharedEntryIds, entry.id]);
					setShareFeedback(entry.id, 'Det här inlägget är redan delat i Gemenskap.', 'info');
				} else {
					setShareFeedback(entry.id, errorPayload?.error || 'Kunde inte dela inlägget just nu.', 'error');
				}
				return;
			}

			if (!payload.success) {
				setShareFeedback(entry.id, 'Kunde inte dela inlägget just nu.', 'error');
				return;
			}

			sharedEntryIds = new Set([...sharedEntryIds, entry.id]);
			setShareFeedback(entry.id, 'Inlägget har delats anonymt i Gemenskap.', 'success');
			shareFeedbackShowCommunityLink = true;
			confirmingShareEntryId = '';
		} catch (error) {
			setShareFeedback(
				entry.id,
				error instanceof Error ? error.message : 'Kunde inte dela inlägget just nu.',
				'error'
			);
		} finally {
			sharingEntryId = '';
		}
	}

	async function unshareEntry(entry: DiaryEntry) {
		if (sharingEntryId || unsharingEntryId || !entry.id) return;

		if (!isEntryShared(entry.id)) {
			setShareFeedback(entry.id, 'Det finns ingen aktiv delning att ta bort.', 'info');
			confirmingUnshareEntryId = '';
			return;
		}

		unsharingEntryId = entry.id;

		try {
			const { data } = await supabase.auth.getSession();
			const session = data.session;

			if (!session?.access_token) {
				setShareFeedback(entry.id, 'Logga in för att ta bort delningen.', 'error');
				return;
			}

			const response = await fetch('/api/community/unshare', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`
				},
				body: JSON.stringify({ diaryEntryId: entry.id })
			});

			const payload = (await response.json().catch(() => null)) as
				| CreateCommunityUnshareSuccessResponse
				| { success?: boolean; error?: string; alreadyUnshared?: boolean }
				| null;

			if (!response.ok || !payload) {
				const errorPayload = payload as { error?: string; alreadyUnshared?: boolean } | null;
				const alreadyUnshared = response.status === 409 && Boolean(errorPayload?.alreadyUnshared);

				if (alreadyUnshared || response.status === 404) {
					const nextSharedIds = new Set(sharedEntryIds);
					nextSharedIds.delete(entry.id);
					sharedEntryIds = nextSharedIds;
					setShareFeedback(entry.id, 'Delningen är redan borttagen från Gemenskap.', 'info');
				} else {
					setShareFeedback(
						entry.id,
						errorPayload?.error || 'Kunde inte ta bort delningen just nu.',
						'error'
					);
				}
				return;
			}

			if (!payload.success) {
				setShareFeedback(entry.id, 'Kunde inte ta bort delningen just nu.', 'error');
				return;
			}

			const nextSharedIds = new Set(sharedEntryIds);
			nextSharedIds.delete(entry.id);
			sharedEntryIds = nextSharedIds;
			setShareFeedback(entry.id, 'Delningen har tagits bort från Gemenskap.', 'success');
			confirmingUnshareEntryId = '';
		} catch (error) {
			setShareFeedback(
				entry.id,
				error instanceof Error ? error.message : 'Kunde inte ta bort delningen just nu.',
				'error'
			);
		} finally {
			unsharingEntryId = '';
		}
	}

	function openEditMode(entry: DiaryEntry) {
		confirmingShareEntryId = '';
		confirmingUnshareEntryId = '';
		confirmingDeleteEntryId = '';
		deleteErrorEntryId = '';
		deleteErrorMessage = '';
		editingEntryId = entry.id;
		editingText = entry.content;
		editingMood = entry.mood ?? '';
		editingMoodPreview = parseMoodValue(entry.mood) ?? 5;
		editError = '';
	}

	function closeEditMode() {
		if (savingEditId) return;
		editingEntryId = '';
		editingText = '';
		editingMood = '';
		editError = '';
	}

	async function saveEdit(entry: DiaryEntry) {
		if (savingEditId || !editingText.trim()) return;
		editError = '';
		savingEditId = entry.id;

		try {
			const { data } = await supabase.auth.getSession();
			const session = data.session;

			if (!session?.access_token) {
				editError = 'Logga in för att spara ändringar.';
				return;
			}

			const response = await fetch('/api/diary/update', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`
				},
				body: JSON.stringify({
					id: entry.id,
					text: editingText.trim(),
					mood: editingMood || null,
					tags: entry.tags
				})
			});

			const payload = await response.json().catch(() => null);
			if (!response.ok || !payload?.success) {
				editError = payload?.error ?? 'Kunde inte spara ändringen just nu.';
				return;
			}

			entries = entries.map((e) =>
				e.id === entry.id
					? { ...e, content: editingText.trim(), mood: editingMood || null }
					: e
			);
			editingEntryId = '';
			editingText = '';
			editingMood = '';
			await loadEntries({ force: true });
		} catch (error) {
			editError = error instanceof Error ? error.message : 'Kunde inte spara ändringen just nu.';
		} finally {
			savingEditId = '';
		}
	}

	function openDeleteConfirmation(entryId: string) {
		if (deletingEntryId) return;
		confirmingDeleteEntryId = entryId;
		confirmingShareEntryId = '';
		confirmingUnshareEntryId = '';
		editingEntryId = '';
		deleteErrorEntryId = '';
		deleteErrorMessage = '';
	}

	function closeDeleteConfirmation() {
		if (deletingEntryId) return;
		confirmingDeleteEntryId = '';
		deleteErrorEntryId = '';
		deleteErrorMessage = '';
	}

	async function deleteEntry(entry: DiaryEntry) {
		if (deletingEntryId) return;
		deletingEntryId = entry.id;

		try {
			const { data } = await supabase.auth.getSession();
			const session = data.session;

			if (!session?.access_token) {
				deleteErrorEntryId = entry.id;
				deleteErrorMessage = 'Logga in för att ta bort inlägget.';
				return;
			}

			const response = await fetch('/api/diary/delete', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`
				},
				body: JSON.stringify({ id: entry.id })
			});

			const payload = await response.json().catch(() => null);

			if (!response.ok || !payload?.success) {
				if (response.status === 404) {
					entries = entries.filter((e) => e.id !== entry.id);
					confirmingDeleteEntryId = '';
					await loadEntries({ force: true });
					return;
				}
				deleteErrorEntryId = entry.id;
				deleteErrorMessage = payload?.error ?? 'Kunde inte ta bort inlägget just nu.';
				return;
			}

			entries = entries.filter((e) => e.id !== entry.id);
			confirmingDeleteEntryId = '';
			await loadEntries({ force: true });
		} catch (error) {
			deleteErrorEntryId = entry.id;
			deleteErrorMessage =
				error instanceof Error ? error.message : 'Kunde inte ta bort inlägget just nu.';
		} finally {
			deletingEntryId = '';
		}
	}

	async function saveDraftToDiary() {
		if (!draftText.trim() || savingDraft) return;
		draftError = '';
		draftSuccess = '';
		savingDraft = true;

		try {
			const { data } = await supabase.auth.getSession();
			const session = data.session;

			if (!session?.access_token) {
				draftError = 'Logga in eller skapa konto för att spara i dagboken.';
				return;
			}

			const response = await fetch('/api/diary/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`
				},
				body: JSON.stringify({
					text: draftText.trim(),
					mood: draftMood || null
				})
			});

			const payload = await response.json().catch(() => null);
			if (!response.ok) {
				draftError = payload?.error || 'Kunde inte spara inlägget just nu.';
				return;
			}

			if (typeof window !== 'undefined') {
				localStorage.removeItem('mittpsyke_temp_entry');

				const url = new URL(window.location.href);
				if (url.searchParams.has('prefill')) {
					url.searchParams.delete('prefill');
					const query = url.searchParams.toString();
					window.history.replaceState({}, '', `${url.pathname}${query ? `?${query}` : ''}${url.hash}`);
				}
			}

			draftText = '';
			draftMood = '';
			draftMoodPreview = 5;
			draftSuccess = 'Inlägget är sparat';
			await loadEntries({ force: true });
		} catch (error) {
			draftError = error instanceof Error ? error.message : 'Kunde inte spara inlägget just nu.';
		} finally {
			savingDraft = false;
		}
	}

	async function initializeDiary() {
		if (!sessionUser) {
			entries = [];
			sharedEntryIds = new Set();
			loading = false;
			return;
		}

		// Track signup completion if coming from welcome flow
		if ($page.url.searchParams.get('welcome') === 'true') {
			trackSignupCompleted();
		}

		// Track diary page opened from horoscope source
		if ($page.url.searchParams.get('from') === 'horoscope') {
			trackDiaryPageOpenedFromHoroscope();
		}

		const prefill = $page.url.searchParams.get('prefill')?.trim();
		if (prefill) {
			draftText = prefill;
		} else if (typeof window !== 'undefined') {
			draftText = parseStoredDraft(localStorage.getItem('mittpsyke_temp_entry'));
		}

		try {
			if (entries.length === 0) {
				await loadEntries();
			}

			if (sharedEntryIds.size === 0) {
				await loadSharedEntryIds();
			}
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Kunde inte ladda dagboken just nu.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (!data.session) {
			supabase.auth.getSession().then(({ data: sessionData }) => {
				sessionUser = sessionData.session?.user ?? null;
				void initializeDiary();
			});
		} else {
			void initializeDiary();
		}

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, session) => {
			sessionUser = session?.user ?? null;
		});

		return () => subscription.unsubscribe();
	});
</script>

<SEO canonical="https://www.mittpsyke.se/dagbok" />

<main class="auth-page">
	{#if loading}
		<div class="auth-shell">
			<section class="auth-panel">
				<p class="auth-muted">Laddar...</p>
			</section>
		</div>
	{:else if !isLoggedIn}
		<!-- Publik dagboksvy för utloggade besökare -->
		<div class="auth-shell">
			<header class="auth-hero">
				<div>
					<h1>Dagbok</h1>
					<p>Din plats för dagen — skriv fritt eller låt en röst guida dig.</p>
				</div>
			</header>

			<section class="auth-panel">
				<h2 class="text-base font-semibold">Så fungerar dagboken</h2>
				<p class="mt-2 text-sm auth-muted">
					Dagbok hjälper dig sätta ord på din dag. Du kan skriva fritt i din egen takt,
					eller välja en röst som ställer lugna frågor och hjälper dig forma tankarna
					till ett personligt dagboksinlägg.
				</p>
			</section>

			<section class="auth-panel">
				<h2 class="text-base font-semibold">Två sätt att skriva</h2>
				<div class="diary-path-grid mt-3">
					<div class="diary-path-card diary-path-card--preview">
						<span class="diary-path-title">Skriv själv</span>
						<span class="diary-path-copy">Fri text i din egen takt, direkt i dagboken.</span>
					</div>
					<div class="diary-path-card diary-path-card--preview">
						<span class="diary-path-title">Dagbok med olika stilar</span>
						<span class="diary-path-copy">Välj en röst som guidar dig vidare med frågor i lugn takt.</span>
					</div>
				</div>
			</section>

			<section class="auth-panel auth-panel-accent">
				<p class="text-sm">
					Logga in för att skriva och spara dina dagboksinlägg.
				</p>
				<div class="actions-row mt-3">
					<a href="/login" class="auth-button primary">Logga in</a>
					<a href="/register" class="auth-button">Skapa konto</a>
				</div>
			</section>
		</div>
	{:else}
		<!-- Inloggad dagboksvy -->
		<PortalSubnav
			active="dagbok"
			title="Din dagbok"
			description="Dagbok är din plats för dagen. Välj mellan att skriva själv eller låta en röst guida dig vidare."
		/>

		<div class="auth-shell">
			<div class="diary-layout">
				<div class="diary-main">
					<section class="auth-panel diary-paths">
						<h2 class="text-base font-semibold">Välj hur du vill börja</h2>
						<p class="mt-2 text-sm auth-muted">
							Du kan skriva fritt i din personliga dagbok eller välja en röst som guidar dig genom dagen.
						</p>
						<div class="diary-path-grid mt-3">
							<a href="/dagbok#skriv-sjalv" class="diary-path-card">
								<span class="diary-path-title">Skriv själv</span>
								<span class="diary-path-copy">Fri text i din egen takt, direkt i dagboken.</span>
							</a>
							<a href="/dagars-avtryck" class="diary-path-card">
								<span class="diary-path-title">Dagbok med olika stilar</span>
								<span class="diary-path-copy">Välj en röst som guidar dig vidare med frågor i lugn takt.</span>
							</a>
						</div>
					</section>

					<section class="auth-panel auth-panel-accent diary-editor-panel" id="skriv-sjalv">
						<div class="editor-shell">
							<header class="editor-head">
								<p class="editor-kicker">Skriv själv</p>
								<h2 class="editor-title">Nytt inlägg</h2>
								<p class="editor-intro auth-muted">
									Läs igenom i lugn och ro. Du kan justera texten innan du sparar.
								</p>
								{#if hasDraftToResume}
									<p class="editor-support auth-muted">
										Fortsätt där du var. Du kan spara när du känner dig klar.
									</p>
								{:else if hasSavedEntries}
									<p class="editor-support auth-muted">
										Du kan fortsätta i små steg. Det du sparar finns kvar här när du vill komma tillbaka.
									</p>
								{/if}
								<p class="editor-date">
									{new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
								</p>
							</header>
							<div class="editor-card">
								<div class="mood-field editor-mood-field">
							<p class="text-sm">Humör just nu (valfritt)</p>
							<p class="mood-current">
								{draftMood ? `Humör: ${draftMood}/10` : 'Humör: Ej valt'}
							</p>
							<p class="mood-meaning auth-muted">
								{draftMood ? moodLabel(Number(draftMood)) : 'Flytta reglaget om du vill lägga till humör.'}
							</p>
							<input
								id="draft-mood"
								type="range"
								min="1"
								max="10"
								step="1"
								value={draftMood || String(draftMoodPreview)}
								oninput={handleMoodInput}
								class="mood-slider"
								aria-describedby="draft-mood-anchors"
							/>
							<div id="draft-mood-anchors" class="mood-anchors auth-muted">
								<span>Tungt</span>
								<span>Mitt emellan</span>
								<span>Ljusare</span>
							</div>
							<button type="button" class="mood-clear auth-muted" onclick={clearMoodSelection} disabled={!draftMood}>
								Rensa humör
							</button>
								</div>
						<textarea
							bind:value={draftText}
							rows={8}
							class="diary-input diary-input--editor"
							placeholder="Skriv några ord..."
						></textarea>
							</div>

						<p class="editor-note auth-muted">
							När du sparar finns inlägget kvar i din dagbok, så att du kan fortsätta senare i din egen takt.
						</p>

						{#if draftError}
							<p class="mt-3 text-sm error-copy">{draftError}</p>
						{/if}

						<div class="actions-row editor-actions">
							<button
								type="button"
								class="auth-button primary editor-primary"
								onclick={saveDraftToDiary}
								disabled={savingDraft || !draftText.trim()}
							>
								{savingDraft ? 'Sparar...' : 'Spara inlägg'}
							</button>

							<a href="/skriv" class="auth-button editor-secondary">
								Fortsätt skriva senare
							</a>
						</div>
						</div>
					</section>

					{#if draftSuccess && !draftText}
						<section class="auth-panel auth-panel-success">
							<h2 class="text-base font-semibold">{draftSuccess}</h2>
							<p class="mt-2 text-sm">
								Ditt inlägg finns kvar här. Nästa lilla steg kan vara att skriva några ord till nu,
								eller komma tillbaka senare och fortsätta där du slutade.
							</p>
							<div class="actions-row mt-3">
								<a href="/dagbok#skriv-sjalv" class="auth-button primary">Skriv några ord till</a>
								{#if hasSavedEntries}
									<a href="/dagbok#senaste-inlagg" class="auth-button">Se dina senaste inlägg</a>
								{/if}
							</div>
						</section>
					{/if}

					{#if loadError}
						<section class="auth-panel auth-panel-error">
							<p class="text-sm">{loadError}</p>
						</section>
					{/if}

					<DiaryMoodTimeline entries={entries} />

					{#if entries.length === 0}
						<section class="auth-panel">
							<h2 class="text-lg font-semibold">Din dagbok börjar här</h2>
							<p class="mt-2 text-sm auth-muted">Det räcker med några ord. Skriv i lugn och ro, i din egen takt.</p>
							<a href="/skriv" class="auth-button mt-4">
								Skriv första inlägget
							</a>
						</section>
					{:else}
						<div class="diary-flow" id="senaste-inlagg">
							<p class="flow-heading auth-muted">Senaste och äldre inlägg</p>
							<div class="diary-entries">
								{#each entries as entry (entry.id)}
									<article class="auth-panel diary-entry">
										<p class="text-xs auth-muted">{formatDate(entry.created_at)}</p>
										{#if entry.mood && editingEntryId !== entry.id}
											<p class="mt-1 text-xs auth-muted">Humör: {entry.mood}/10</p>
										{/if}

										{#if editingEntryId === entry.id}
											<div class="entry-edit-form">
												<textarea
													class="entry-edit-textarea"
													rows={6}
													bind:value={editingText}
													placeholder="Skriv några ord..."
												></textarea>
												<div class="entry-edit-mood">
													<p class="edit-mood-label auth-muted">
														Humör: {editingMood ? `${editingMood}/10` : 'Ej valt'}
													</p>
													<input
														type="range"
														min="1"
														max="10"
														step="1"
														value={editingMood || String(editingMoodPreview)}
														oninput={(e) => {
															const v = Number((e.currentTarget as HTMLInputElement).value);
															editingMoodPreview = v;
															editingMood = String(v);
														}}
														class="mood-slider"
													/>
													<button
														type="button"
														class="mood-clear auth-muted"
														onclick={() => { editingMood = ''; editingMoodPreview = 5; }}
														disabled={!editingMood}
													>
														Rensa humör
													</button>
												</div>
												{#if editError}
													<p class="edit-error">{editError}</p>
												{/if}
												<div class="entry-edit-actions">
													<button
														type="button"
														class="auth-button primary"
														onclick={() => saveEdit(entry)}
														disabled={savingEditId === entry.id || !editingText.trim()}
													>
														{savingEditId === entry.id ? 'Sparar...' : 'Spara ändringar'}
													</button>
													<button
														type="button"
														class="auth-button"
														onclick={closeEditMode}
														disabled={savingEditId === entry.id}
													>
														Avbryt
													</button>
												</div>
											</div>
										{:else}
											<p class="mt-2 whitespace-pre-wrap text-sm">{entry.content}</p>
											<div class="share-row">
												{#if isEntryShared(entry.id)}
													<p class="share-status auth-muted">Redan delat i Gemenskap.</p>
													<button
														type="button"
														class="share-trigger"
														onclick={() => openUnshareConfirmation(entry.id)}
													>
														Ta bort delning
													</button>
													<a href="/dashboard/gemenskap" class="share-link">Öppna Gemenskap</a>
												{:else}
													<button
														type="button"
														class="share-trigger"
														onclick={() => openShareConfirmation(entry.id)}
													>
														Dela anonymt i Gemenskapen
													</button>
												{/if}
											</div>

											{#if confirmingShareEntryId === entry.id}
												<div class="share-confirmation" role="status">
													<h3>Dela anonymt?</h3>
													<p>
														Det här publicerar en anonym version av ditt inlägg i Gemenskap.
														Ditt namn visas aldrig för andra. Kontrollera att inlägget inte
														innehåller namn, adresser, telefonnummer eller andra
														personuppgifter.
													</p>
													<div class="share-confirmation-actions">
														<button
															type="button"
															class="auth-button"
															onclick={closeShareConfirmation}
															disabled={sharingEntryId === entry.id}
														>
															Avbryt
														</button>
														<button
															type="button"
															class="auth-button primary"
															onclick={() => shareEntryAnonymously(entry)}
															disabled={sharingEntryId === entry.id}
														>
															{sharingEntryId === entry.id ? 'Delar...' : 'Dela anonymt'}
														</button>
													</div>
												</div>
											{/if}

											{#if confirmingUnshareEntryId === entry.id}
												<div class="share-confirmation" role="status">
													<h3>Ta bort delning?</h3>
													<p>
														Det här tar bort den anonyma versionen från Gemenskap. Ditt
														privata dagboksinlägg finns kvar i Dagbok.
													</p>
													<div class="share-confirmation-actions">
														<button
															type="button"
															class="auth-button"
															onclick={closeUnshareConfirmation}
															disabled={unsharingEntryId === entry.id}
														>
															Avbryt
														</button>
														<button
															type="button"
															class="auth-button primary"
															onclick={() => unshareEntry(entry)}
															disabled={unsharingEntryId === entry.id}
														>
															{unsharingEntryId === entry.id ? 'Tar bort...' : 'Ta bort delning'}
														</button>
													</div>
												</div>
											{/if}

											{#if shareFeedbackEntryId === entry.id && shareFeedbackMessage}
												<p class="share-feedback {shareFeedbackType}">
													{shareFeedbackMessage}
													{#if shareFeedbackType === 'success' && shareFeedbackShowCommunityLink}
														<a href="/dashboard/gemenskap" class="share-feedback-link">
															Öppna Gemenskap
														</a>
													{/if}
												</p>
											{/if}

											<div class="entry-actions">
												<button
													type="button"
													class="entry-action-btn"
													onclick={() => openEditMode(entry)}
												>
													Redigera
												</button>
												<span class="entry-action-sep" aria-hidden="true">·</span>
												<button
													type="button"
													class="entry-action-btn"
													onclick={() => openDeleteConfirmation(entry.id)}
													disabled={Boolean(deletingEntryId)}
												>
													Ta bort
												</button>
											</div>

											{#if confirmingDeleteEntryId === entry.id}
												<div class="entry-delete-confirm" role="status">
													<h3>Ta bort inlägg?</h3>
													<p>Inlägget raderas permanent och kan inte återställas.</p>
													<div class="entry-delete-actions">
														<button
															type="button"
															class="auth-button"
															onclick={closeDeleteConfirmation}
															disabled={deletingEntryId === entry.id}
														>
															Avbryt
														</button>
														<button
															type="button"
															class="auth-button primary"
															onclick={() => deleteEntry(entry)}
															disabled={deletingEntryId === entry.id}
														>
															{deletingEntryId === entry.id ? 'Tar bort...' : 'Ta bort'}
														</button>
													</div>
													{#if deleteErrorEntryId === entry.id && deleteErrorMessage}
														<p class="delete-error">{deleteErrorMessage}</p>
													{/if}
												</div>
											{/if}
										{/if}
									</article>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<aside class="diary-side">
					<section class="auth-panel diary-week-panel">
						<div class="week-head">
							<h3 class="text-sm font-semibold">Denna vecka</h3>
							<p class="text-xs auth-muted">Liten översikt i lugn takt</p>
						</div>
						<p class="week-count">{weeklyEntryCount}</p>
						<p class="text-xs auth-muted">inlägg senaste 7 dagarna</p>

						<div class="mood-graph-panel">
							<div class="mood-graph-header">
								<h3 class="text-sm font-semibold">Humörtrend</h3>
								<p class="text-xs auth-muted">Senaste inlägg med humör</p>
							</div>
							{#if moodGraphPoints.length >= 2}
								<svg viewBox="0 0 100 36" class="mood-chart" aria-label="Humörtrend över senaste inlägg">
									<rect x="1" y="1" width="98" height="34" rx="8" class="mood-chart-bg"></rect>
									<polyline points={buildMoodPolyline(moodGraphPoints)} class="mood-chart-line"></polyline>
									{#each moodGraphPoints as point, index}
										<circle cx={moodX(index, moodGraphPoints.length)} cy={moodY(point.mood)} r="1.35" class="mood-chart-dot"></circle>
									{/each}
								</svg>
								<div class="mood-chart-anchors auth-muted">
									<span>Tungt</span>
									<span>Mitt emellan</span>
									<span>Ljusare</span>
								</div>
							{:else}
								<p class="text-sm auth-muted">Lägg till humör i minst två inlägg för att se en trend.</p>
							{/if}
						</div>
					</section>
				</aside>
			</div>
		</div>
	{/if}
</main>

<style>
	.diary-layout {
		display: grid;
		gap: 1rem;
	}

	.diary-main {
		display: grid;
		gap: 0.85rem;
	}

	.diary-paths {
		display: grid;
		gap: 0.55rem;
	}

	.diary-path-grid {
		display: grid;
		gap: 0.65rem;
	}

	.diary-editor-panel {
		padding: clamp(1.15rem, 2vw, 1.65rem);
	}

	.editor-shell {
		width: min(100%, 760px);
		margin: 0 auto;
		display: grid;
		gap: 1rem;
	}

	.editor-head {
		display: grid;
		gap: 0.45rem;
		text-align: center;
	}

	.editor-kicker {
		margin: 0;
		font-size: 0.74rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.editor-title {
		margin: 0;
		font-size: clamp(1.55rem, 1.15rem + 1vw, 2.1rem);
		letter-spacing: -0.03em;
	}

	.editor-intro,
	.editor-support,
	.editor-date,
	.editor-note {
		margin: 0;
	}

	.editor-intro {
		font-size: 0.95rem;
		line-height: 1.7;
		color: hsl(var(--foreground) / 0.82);
	}

	.editor-support {
		font-size: 0.84rem;
		line-height: 1.6;
	}

	.editor-date {
		justify-self: center;
		padding: 0.42rem 0.8rem;
		border-radius: var(--radius-pill);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: capitalize;
		color: hsl(var(--muted-foreground));
	}

	.editor-card {
		display: grid;
		gap: 0;
		border-radius: calc(var(--radius-card) + 2px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: linear-gradient(180deg, rgba(24, 28, 39, 0.98) 0%, rgba(15, 18, 28, 0.98) 100%);
		box-shadow:
			0 18px 40px rgba(15, 23, 42, 0.18),
			inset 0 1px 0 rgba(255, 255, 255, 0.03);
		overflow: hidden;
	}

	.diary-path-card {
		display: grid;
		gap: 0.2rem;
		padding: 0.8rem 0.9rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-input);
		background: hsl(var(--surface-soft));
		text-decoration: none;
		transition: border-color 150ms ease, box-shadow 150ms ease;
	}

	.diary-path-card--preview {
		cursor: default;
		opacity: 0.85;
	}

	.diary-path-card:hover:not(.diary-path-card--preview) {
		border-color: hsl(var(--foreground) / 0.18);
		box-shadow: 0 5px 14px rgba(0, 0, 0, 0.05);
	}

	.diary-path-card:focus-visible {
		outline: 2px solid hsl(var(--foreground) / 0.18);
		outline-offset: 2px;
	}

	.diary-path-title {
		font-size: 0.92rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.diary-path-copy {
		font-size: 0.82rem;
		line-height: 1.55;
		color: hsl(var(--muted-foreground));
	}

	.diary-path-voices {
		font-size: 0.78rem;
		line-height: 1.5;
		color: hsl(var(--foreground) / 0.74);
	}

	.diary-side {
		display: grid;
		gap: 0.85rem;
	}

	.diary-input {
		width: 100%;
		margin-top: 0.8rem;
		padding: 0.75rem 0.85rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		resize: vertical;
	}

	.diary-input:focus {
		border-color: var(--primary, #0f766e);
		outline: none;
	}

	.diary-input::placeholder {
		color: hsl(var(--muted-foreground));
	}

	.diary-input--editor {
		margin-top: 0;
		padding: 1.2rem 1.2rem 1.35rem;
		border: 0;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0;
		background: transparent;
		color: rgba(248, 250, 252, 0.96);
		font-size: 0.98rem;
		line-height: 1.8;
		min-height: 18rem;
		resize: vertical;
	}

	.diary-input--editor:focus {
		border-color: transparent;
		outline: none;
		box-shadow: inset 0 0 0 1px rgba(94, 234, 212, 0.28);
	}

	.diary-input--editor::placeholder {
		color: rgba(226, 232, 240, 0.48);
	}

	.mood-field {
		margin-top: 0.8rem;
		display: grid;
		gap: 0.3rem;
	}

	.mood-current {
		margin: 0;
		font-size: 0.84rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.mood-meaning {
		margin: 0;
		font-size: 0.82rem;
	}

	.mood-slider {
		width: 100%;
		height: 0.45rem;
		appearance: none;
		background: hsl(var(--surface-muted));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-pill);
	}

	.mood-slider:focus-visible {
		outline: 2px solid hsl(var(--foreground) / 0.16);
		outline-offset: 2px;
	}

	.mood-slider::-webkit-slider-runnable-track {
		height: 0.45rem;
		background: hsl(var(--surface-muted));
		border-radius: var(--radius-pill);
	}

	.mood-slider::-webkit-slider-thumb {
		appearance: none;
		width: 1rem;
		height: 1rem;
		margin-top: -0.34rem;
		border-radius: 999px;
		background: var(--primary, #0f766e);
		border: 2px solid hsl(var(--surface));
		box-shadow: 0 0 0 1px hsl(var(--border));
		cursor: pointer;
	}

	.mood-slider::-moz-range-track {
		height: 0.45rem;
		background: hsl(var(--surface-muted));
		border-radius: var(--radius-pill);
		border: 0;
	}

	.mood-slider::-moz-range-thumb {
		width: 1rem;
		height: 1rem;
		border-radius: 999px;
		background: var(--primary, #0f766e);
		border: 2px solid hsl(var(--surface));
		box-shadow: 0 0 0 1px hsl(var(--border));
		cursor: pointer;
	}

	.mood-anchors {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		font-size: 0.75rem;
	}

	.mood-clear {
		justify-self: start;
		border: 0;
		background: transparent;
		padding: 0;
		font-size: 0.78rem;
		text-decoration: underline;
		text-underline-offset: 2px;
		cursor: pointer;
	}

	.mood-clear:disabled {
		opacity: 0.45;
		cursor: default;
		text-decoration: none;
	}

	.mood-clear:focus-visible {
		border-radius: 6px;
		outline: 2px solid hsl(var(--foreground) / 0.18);
		outline-offset: 1px;
	}

	.editor-mood-field {
		margin-top: 0;
		padding: 1rem 1.2rem 1.1rem;
		background: rgba(255, 255, 255, 0.02);
	}

	.editor-card .mood-current,
	.editor-card .text-sm:not(.auth-muted) {
		color: rgba(248, 250, 252, 0.96);
	}

	.editor-card .auth-muted,
	.editor-card .mood-meaning,
	.editor-card .mood-anchors,
	.editor-card .mood-clear {
		color: rgba(226, 232, 240, 0.68);
	}

	.editor-card .mood-slider {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.08);
	}

	.editor-card .mood-slider::-webkit-slider-runnable-track,
	.editor-card .mood-slider::-moz-range-track {
		background: rgba(255, 255, 255, 0.08);
	}

	.actions-row {
		margin-top: 0.95rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.error-copy {
		color: hsl(var(--error-foreground));
	}

	.editor-actions {
		justify-content: center;
		align-items: center;
	}

	.editor-primary {
		min-width: 12.5rem;
		padding-inline: 1.35rem;
		padding-block: 0.75rem;
		font-size: 0.96rem;
		box-shadow: 0 10px 24px rgba(15, 118, 110, 0.16);
	}

	.editor-secondary {
		background: hsl(var(--surface-soft));
	}

	.diary-flow {
		display: grid;
		gap: 0.5rem;
	}

	.flow-heading {
		margin: 0.1rem 0 0;
		font-size: 0.82rem;
	}

	.diary-week-panel {
		display: grid;
		gap: 0.65rem;
	}

	.week-head h3,
	.week-head p {
		margin: 0;
	}

	.week-count {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1.9rem;
		line-height: 1;
		letter-spacing: -0.02em;
	}

	.mood-graph-panel {
		display: grid;
		gap: 0.55rem;
	}

	.mood-graph-header h3,
	.mood-graph-header p {
		margin: 0;
	}

	.mood-chart {
		display: block;
		width: 100%;
		height: 106px;
	}

	.mood-chart-bg {
		fill: hsl(var(--surface-muted));
		stroke: hsl(var(--border));
		stroke-width: 0.4;
	}

	.mood-chart-line {
		fill: none;
		stroke: var(--primary, #0f766e);
		stroke-width: 1.2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.mood-chart-dot {
		fill: var(--primary, #0f766e);
		stroke: hsl(var(--surface));
		stroke-width: 0.6;
	}

	.mood-chart-anchors {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
	}

	.diary-entries {
		display: grid;
		gap: 0.75rem;
	}

	.diary-entry {
		transition: border-color 160ms ease, box-shadow 160ms ease;
	}

	.diary-entry:hover {
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
	}

	.share-row {
		margin-top: 0.8rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.45rem 0.65rem;
	}

	.share-trigger {
		border: 0;
		background: transparent;
		padding: 0;
		font-size: 0.84rem;
		color: hsl(var(--muted-foreground));
		text-decoration: underline;
		text-underline-offset: 2px;
		cursor: pointer;
	}

	.share-trigger:hover {
		color: hsl(var(--foreground));
	}

	.share-status {
		margin: 0;
		font-size: 0.82rem;
	}

	.share-link {
		font-size: 0.82rem;
		color: hsl(var(--muted-foreground));
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.share-confirmation {
		margin-top: 0.75rem;
		padding: 0.75rem 0.8rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-input);
		background: hsl(var(--surface-soft));
	}

	.share-confirmation h3 {
		margin: 0;
		font-size: 0.94rem;
	}

	.share-confirmation p {
		margin: 0.45rem 0 0;
		font-size: 0.85rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.55;
	}

	.share-confirmation-actions {
		margin-top: 0.75rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.share-feedback {
		margin: 0.65rem 0 0;
		font-size: 0.82rem;
	}

	.share-feedback.success {
		color: hsl(var(--success-foreground));
	}

	.share-feedback.error {
		color: hsl(var(--error-foreground));
	}

	.share-feedback.info {
		color: hsl(var(--muted-foreground));
	}

	.share-feedback-link {
		margin-left: 0.35rem;
		text-decoration: underline;
		text-underline-offset: 2px;
		color: inherit;
	}

	:global(.dark) .diary-entry:hover {
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.24);
	}

	.entry-actions {
		margin-top: 0.6rem;
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}

	.entry-action-btn {
		border: 0;
		background: transparent;
		padding: 0;
		font-size: 0.82rem;
		color: hsl(var(--muted-foreground));
		text-decoration: underline;
		text-underline-offset: 2px;
		cursor: pointer;
	}

	.entry-action-btn:hover {
		color: hsl(var(--foreground));
	}

	.entry-action-btn:disabled {
		opacity: 0.4;
		cursor: default;
		text-decoration: none;
	}

	.entry-action-sep {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground) / 0.45);
		user-select: none;
	}

	.entry-edit-form {
		margin-top: 0.55rem;
		display: grid;
		gap: 0.6rem;
	}

	.entry-edit-textarea {
		width: 100%;
		padding: 0.65rem 0.75rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		font: inherit;
		font-size: 0.9rem;
		line-height: 1.6;
		resize: vertical;
	}

	.entry-edit-textarea:focus {
		border-color: var(--primary, #0f766e);
		outline: none;
	}

	.entry-edit-textarea::placeholder {
		color: hsl(var(--muted-foreground));
	}

	.entry-edit-mood {
		display: grid;
		gap: 0.3rem;
	}

	.edit-mood-label {
		margin: 0;
		font-size: 0.82rem;
	}

	.entry-edit-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.edit-error {
		margin: 0;
		font-size: 0.82rem;
		color: hsl(var(--error-foreground));
	}

	.entry-delete-confirm {
		margin-top: 0.75rem;
		padding: 0.75rem 0.8rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-input);
		background: hsl(var(--surface-soft));
	}

	.entry-delete-confirm h3 {
		margin: 0;
		font-size: 0.94rem;
	}

	.entry-delete-confirm p {
		margin: 0.45rem 0 0;
		font-size: 0.85rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.55;
	}

	.entry-delete-actions {
		margin-top: 0.75rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.delete-error {
		margin: 0.5rem 0 0;
		font-size: 0.82rem;
		color: hsl(var(--error-foreground));
	}

	@media (min-width: 980px) {
		.diary-layout {
			grid-template-columns: minmax(0, 1fr) 300px;
			align-items: start;
		}

		.diary-path-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.diary-side {
			position: sticky;
			top: 0.7rem;
		}
	}
</style>

