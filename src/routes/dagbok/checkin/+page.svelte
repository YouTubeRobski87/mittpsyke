<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onDestroy, onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { trackSignupCompleted, trackDiaryPageOpenedFromHoroscope } from '$lib/analytics';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';
	import DiaryMoodTimeline from '$lib/components/DiaryMoodTimeline.svelte';
	import DiaryCalendar from '$lib/components/DiaryCalendar.svelte';
	import { renderDiaryMarkdown } from '$lib/markdown';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent,
		hasSensitiveConsent,
		type HealthConsentRecord
	} from '$lib/consent';
	import { supabase } from '$lib/supabase';
	import {
		DIARY_ENTRY_PAGE_SIZE,
		loadDiaryEntriesPage,
		type DiaryEntry
	} from '$lib/state/diary';
	import type { Session, User } from '@supabase/supabase-js';
	import type {
		CommunityMySharesSuccessResponse,
		CreateCommunityShareSuccessResponse,
		CreateCommunityUnshareSuccessResponse
	} from '$lib/types';

	type PageData = {
		entries?: DiaryEntry[];
		hasMoreEntries?: boolean;
		sharedEntryIds?: string[];
		session?: Session | null;
	};

	const DIARY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
	const DIARY_IMAGE_ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
	const entriesPerPage = 10;

	let { data } = $props<{ data: PageData }>();

	let entries = $state<DiaryEntry[]>([]);
	let loading = $state(false);
	let loadingMoreEntries = $state(false);
	let hasMoreEntries = $state(false);
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
	let showWriteEditor = $state(false);
	let draftTextarea = $state<HTMLTextAreaElement | null>(null);
	let writeEditorPanel = $state<HTMLElement | null>(null);
	let hasHealthDataConsent = $state(false);
	let currentPage = $state(1);

	// Filtrerade inlägg baserat på valt kalenderdatum
	let filteredEntries = $derived.by(() => {
		if (!calendarFilterDate) return entries;
		return entries.filter((entry) => {
			if (!entry.created_at) return false;
			const d = new Date(entry.created_at);
			if (Number.isNaN(d.getTime())) return false;
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			return key === calendarFilterDate;
		});
	});
	let totalEntries = $derived(filteredEntries.length);
	let totalPages = $derived(Math.ceil(totalEntries / entriesPerPage));
	let startIndex = $derived((currentPage - 1) * entriesPerPage);
	let endIndex = $derived(Math.min(startIndex + entriesPerPage, totalEntries));
	let paginatedEntries = $derived(filteredEntries.slice(startIndex, endIndex));
	let sharedEntryIds = $state(new Set<string>());
	// Kalenderfilter: YYYY-MM-DD eller null för att visa alla inlägg
	let calendarFilterDate = $state<string | null>(null);

	// Bilduppladdning för nytt inlägg
	let draftImageUrl = $state<string | null>(null);
	let draftImagePreviewUrl = $state<string | null>(null);
	let uploadingImage = $state(false);
	let uploadImageError = $state('');
	let draftImageUploadId = 0;

	let confirmingShareEntryId = $state('');
	let confirmingUnshareEntryId = $state('');
	let sharingEntryId = $state('');
	let unsharingEntryId = $state('');
	let shareFeedbackEntryId = $state('');
	let shareFeedbackMessage = $state('');
	let shareFeedbackType = $state<'success' | 'error' | 'info'>('info');
	let shareFeedbackShowCommunityLink = $state(false);
	let confirmingDeviceShareEntryId = $state('');
	let sharingDeviceEntryId = $state('');
	let deviceShareFeedbackEntryId = $state('');
	let deviceShareFeedbackMessage = $state('');
	let deviceShareFeedbackType = $state<'success' | 'error' | 'info'>('info');
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
	let canRenderMarkdown = $state(false);

	$effect(() => {
		entries = data.entries ?? [];
		hasMoreEntries = data.hasMoreEntries ?? false;
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

	async function loadEntries(options: { force?: boolean; limit?: number } = {}) {
		const { data } = await supabase.auth.getSession();
		const userId = data.session?.user?.id;
		if (!userId) {
			entries = [];
			hasMoreEntries = false;
			sharedEntryIds = new Set();
			return;
		}

		const page = await loadDiaryEntriesPage(userId, options);
		entries = page.entries;
		hasMoreEntries = page.hasMore;
	}

	async function loadMoreEntries() {
		if (loadingMoreEntries || !hasMoreEntries) return;

		loadingMoreEntries = true;
		loadError = '';

		try {
			await loadEntries({
				force: true,
				limit: entries.length + DIARY_ENTRY_PAGE_SIZE
			});
			await loadSharedEntryIds();
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Kunde inte hämta fler inlägg just nu.';
		} finally {
			loadingMoreEntries = false;
		}
	}

	function goToPreviousEntriesPage() {
		if (currentPage > 1) currentPage -= 1;
	}

	function goToNextEntriesPage() {
		if (currentPage < totalPages) currentPage += 1;
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
		confirmingDeviceShareEntryId = '';
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
		confirmingDeviceShareEntryId = '';
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

	function setDeviceShareFeedback(
		entryId: string,
		message: string,
		type: 'success' | 'error' | 'info'
	) {
		deviceShareFeedbackEntryId = entryId;
		deviceShareFeedbackMessage = message;
		deviceShareFeedbackType = type;
	}

	function buildDiarySharePayload(entry: DiaryEntry, files?: File[]): ShareData {
		const text = entry.content.trim();
		const payload: ShareData = {
			title: 'Dagboksinlägg från MittPsyke',
			text: text || 'Dagboksinlägg från MittPsyke'
		};
		if (files && files.length > 0) {
			payload.files = files;
		}
		return payload;
	}

	function extensionFromMimeType(mimeType: string): string {
		if (mimeType === 'image/jpeg') return 'jpg';
		if (mimeType === 'image/png') return 'png';
		if (mimeType === 'image/webp') return 'webp';
		if (mimeType === 'image/gif') return 'gif';
		return 'jpg';
	}

	function inferMimeTypeFromUrl(url: string): string {
		const cleanUrl = url.split('?')[0]?.toLowerCase() ?? '';
		if (cleanUrl.endsWith('.png')) return 'image/png';
		if (cleanUrl.endsWith('.webp')) return 'image/webp';
		if (cleanUrl.endsWith('.gif')) return 'image/gif';
		return 'image/jpeg';
	}

	function buildImageFileName(entry: DiaryEntry, mimeType: string): string {
		const extension = extensionFromMimeType(mimeType);
		if (entry.created_at) {
			const date = new Date(entry.created_at);
			if (!Number.isNaN(date.getTime())) {
				const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
				return `dagbok-${dateKey}.${extension}`;
			}
		}
		return `dagbok-bild.${extension}`;
	}

	async function fetchShareImageFile(entry: DiaryEntry): Promise<File | null> {
		if (!entry.image_url) return null;

		let includeCredentials = false;
		if (typeof window !== 'undefined') {
			try {
				const resolvedUrl = new URL(entry.image_url, window.location.origin);
				includeCredentials = resolvedUrl.origin === window.location.origin;
			} catch {
				includeCredentials = false;
			}
		}

		let response: Response;
		try {
			response = await fetch(
				entry.image_url,
				includeCredentials
					? {
							credentials: 'include'
						}
					: undefined
			);
		} catch (error) {
			console.warn('[diary/share] Fetch av sparad bild misslyckades.', {
				imageUrl: entry.image_url,
				includeCredentials,
				error
			});
			throw new Error('Kunde inte hämta bilden för delning.');
		}

		if (!response.ok) {
			console.warn('[diary/share] Kunde inte hämta sparad bild för delning.', {
				imageUrl: entry.image_url,
				includeCredentials,
				status: response.status,
				contentType: response.headers.get('content-type')
			});
			throw new Error('Kunde inte hämta bilden för delning.');
		}

		const blob = await response.blob();
		const mimeType = blob.type || inferMimeTypeFromUrl(entry.image_url);
		const normalizedBlob =
			blob.type === mimeType
				? blob
				: new Blob([blob], {
						type: mimeType
					});
		const fileName = buildImageFileName(entry, mimeType);
		return new File([normalizedBlob], fileName, {
			type: mimeType,
			lastModified: Date.now()
		});
	}

	function canShareFiles(files: File[]): boolean {
		if (typeof navigator === 'undefined') return false;
		if (typeof navigator.canShare !== 'function') return false;
		try {
			return navigator.canShare({ files });
		} catch {
			return false;
		}
	}

	async function shareTextOrCopy(entry: DiaryEntry): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
		const payload = buildDiarySharePayload(entry);

		if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
			try {
				await navigator.share(payload);
				return 'shared';
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError') {
					return 'cancelled';
				}
			}
		}

		if (
			typeof navigator !== 'undefined' &&
			navigator.clipboard &&
			typeof navigator.clipboard.writeText === 'function'
		) {
			try {
				await navigator.clipboard.writeText(payload.text ?? '');
				return 'copied';
			} catch {
				return 'failed';
			}
		}

		return 'failed';
	}

	function closeDeviceShareChoice() {
		if (sharingDeviceEntryId) return;
		confirmingDeviceShareEntryId = '';
	}

	async function openDeviceShare(entry: DiaryEntry) {
		if (!entry.id || sharingDeviceEntryId) return;

		deviceShareFeedbackEntryId = '';
		deviceShareFeedbackMessage = '';
		confirmingShareEntryId = '';
		confirmingUnshareEntryId = '';

		if (entry.image_url) {
			confirmingDeviceShareEntryId = entry.id;
			return;
		}

		await shareDiaryEntry(entry, 'text');
	}

	function applyTextFallbackFeedback(
		entryId: string,
		result: 'shared' | 'copied' | 'cancelled' | 'failed',
		messages: { shared: string; copied: string }
	): boolean {
		if (result === 'shared') {
			setDeviceShareFeedback(entryId, messages.shared, 'info');
			return true;
		}
		if (result === 'copied') {
			setDeviceShareFeedback(entryId, messages.copied, 'info');
			return true;
		}
		return false;
	}

	async function shareDiaryEntry(entry: DiaryEntry, mode: 'text' | 'text_with_image') {
		if (!entry.id || sharingDeviceEntryId) return;
		sharingDeviceEntryId = entry.id;
		confirmingDeviceShareEntryId = '';

		try {
			if (mode === 'text_with_image' && entry.image_url) {
				const canUseShareApi =
					typeof navigator !== 'undefined' && typeof navigator.share === 'function';
				const hasFileShareCapability =
					typeof navigator !== 'undefined' && typeof navigator.canShare === 'function';

				if (!canUseShareApi || !hasFileShareCapability) {
					const fallbackResult = await shareTextOrCopy(entry);
					if (
						applyTextFallbackFeedback(entry.id, fallbackResult, {
							shared:
								'Den här enheten eller appen verkar inte stödja bilddelning här. Texten delades i stället.',
							copied:
								'Den här enheten eller appen verkar inte stödja bilddelning här. Texten kopierades i stället.'
						})
					) {
						return;
					}
					if (fallbackResult === 'cancelled') return;
					setDeviceShareFeedback(entry.id, 'Kunde inte dela inlägget just nu.', 'error');
					return;
				}

				try {
					const imageFile = await fetchShareImageFile(entry);
					const files = imageFile ? [imageFile] : [];
					const supportsFileShare = files.length > 0 && canShareFiles(files);

					if (!supportsFileShare) {
						const fallbackResult = await shareTextOrCopy(entry);
						if (
							applyTextFallbackFeedback(entry.id, fallbackResult, {
								shared:
									'Den här enheten eller appen verkar inte stödja bilddelning här. Texten delades i stället.',
								copied:
									'Den här enheten eller appen verkar inte stödja bilddelning här. Texten kopierades i stället.'
							})
						) {
							return;
						}
						if (fallbackResult === 'cancelled') return;
						setDeviceShareFeedback(entry.id, 'Kunde inte dela inlägget just nu.', 'error');
						return;
					}

					try {
						await navigator.share(buildDiarySharePayload(entry, files));
						setDeviceShareFeedback(entry.id, 'Inlägget delades med text och bild.', 'success');
						return;
					} catch (error) {
						if (error instanceof DOMException && error.name === 'AbortError') return;
						const fallbackResult = await shareTextOrCopy(entry);
						if (
							applyTextFallbackFeedback(entry.id, fallbackResult, {
								shared: 'Den valda appen tog bara text. Texten delades i stället.',
								copied: 'Den valda appen tog bara text. Texten kopierades i stället.'
							})
						) {
							return;
						}
						if (fallbackResult === 'cancelled') return;
						setDeviceShareFeedback(entry.id, 'Kunde inte dela inlägget just nu.', 'error');
						return;
					}
				} catch {
					const fallbackResult = await shareTextOrCopy(entry);
					if (
						applyTextFallbackFeedback(entry.id, fallbackResult, {
							shared: 'Kunde inte hämta den sparade bilden. Texten delades i stället.',
							copied: 'Kunde inte hämta den sparade bilden. Texten kopierades i stället.'
						})
					) {
						return;
					}
					if (fallbackResult === 'cancelled') return;
					setDeviceShareFeedback(entry.id, 'Kunde inte dela inlägget just nu.', 'error');
					return;
				}
			}

			const result = await shareTextOrCopy(entry);
			if (result === 'shared') {
				setDeviceShareFeedback(entry.id, 'Inlägget delades.', 'success');
				return;
			}
			if (result === 'copied') {
				setDeviceShareFeedback(entry.id, 'Texten kopierades.', 'info');
				return;
			}
			if (result === 'cancelled') return;
			setDeviceShareFeedback(entry.id, 'Kunde inte dela inlägget just nu.', 'error');
		} finally {
			sharingDeviceEntryId = '';
		}
	}

	function openEditMode(entry: DiaryEntry) {
		confirmingShareEntryId = '';
		confirmingUnshareEntryId = '';
		confirmingDeviceShareEntryId = '';
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
			await loadEntries({ force: true, limit: Math.max(entries.length, DIARY_ENTRY_PAGE_SIZE) });
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
		confirmingDeviceShareEntryId = '';
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
					await loadEntries({ force: true, limit: Math.max(entries.length, DIARY_ENTRY_PAGE_SIZE) });
					return;
				}
				deleteErrorEntryId = entry.id;
				deleteErrorMessage = payload?.error ?? 'Kunde inte ta bort inlägget just nu.';
				return;
			}

			entries = entries.filter((e) => e.id !== entry.id);
			confirmingDeleteEntryId = '';
			await loadEntries({ force: true, limit: Math.max(entries.length, DIARY_ENTRY_PAGE_SIZE) });
		} catch (error) {
			deleteErrorEntryId = entry.id;
			deleteErrorMessage =
				error instanceof Error ? error.message : 'Kunde inte ta bort inlägget just nu.';
		} finally {
			deletingEntryId = '';
		}
	}

	function setDraftImagePreview(file: File) {
		if (draftImagePreviewUrl) {
			URL.revokeObjectURL(draftImagePreviewUrl);
		}
		draftImagePreviewUrl = URL.createObjectURL(file);
	}

	// Hanterar val av bild — visar lokal förhandsvisning och skickar till /api/diary/upload
	async function handleImageSelect(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;
		if (!file) return;

		// Klientvalidering innan nätverksanrop
		if (!DIARY_IMAGE_ALLOWED_TYPES.has(file.type)) {
			uploadImageError = 'Endast JPEG, PNG, WebP och GIF stöds.';
			input.value = '';
			return;
		}
		if (file.size > DIARY_IMAGE_MAX_BYTES) {
			uploadImageError = 'Bilden får vara max 5 MB.';
			input.value = '';
			return;
		}

		uploadImageError = '';
		draftImageUrl = null;
		setDraftImagePreview(file);
		uploadingImage = true;
		const uploadId = ++draftImageUploadId;

		try {
			const { data: sessionData } = await supabase.auth.getSession();
			const token = sessionData.session?.access_token;
			if (!token) {
				uploadImageError = 'Logga in för att ladda upp bilder.';
				clearDraftImage({ clearError: false });
				return;
			}

			const formData = new FormData();
			formData.append('file', file);

			const res = await fetch('/api/diary/upload', {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
				body: formData
			});

			const payload = await res.json().catch(() => ({})) as { url?: string; error?: string };

			if (!res.ok) {
				if (uploadId !== draftImageUploadId) return;
				const msg = payload.error ?? `Uppladdning misslyckades (HTTP ${res.status}).`;
				console.error('[handleImageSelect] Fel från server:', msg);
				uploadImageError = msg;
				clearDraftImage({ clearError: false });
				return;
			}

			if (uploadId !== draftImageUploadId) return;
			draftImageUrl = payload.url ?? null;
			if (!draftImageUrl) {
				uploadImageError = 'Uppladdningen saknade bildlänk.';
				clearDraftImage({ clearError: false });
			}
		} catch (err) {
			if (uploadId !== draftImageUploadId) return;
			const msg = err instanceof Error ? err.message : 'Okänt fel vid bilduppladdning.';
			console.error('[handleImageSelect] Nätverksfel:', msg);
			uploadImageError = 'Nätverksfel – kunde inte nå servern.';
			clearDraftImage({ clearError: false });
		} finally {
			if (uploadId === draftImageUploadId) {
				uploadingImage = false;
			}
			input.value = '';
		}
	}

	function clearDraftImage(options: { clearError?: boolean } = {}) {
		draftImageUploadId += 1;
		uploadingImage = false;
		if (draftImagePreviewUrl) {
			URL.revokeObjectURL(draftImagePreviewUrl);
		}
		draftImagePreviewUrl = null;
		draftImageUrl = null;
		if (options.clearError ?? true) {
			uploadImageError = '';
		}
	}

	// Kallas från DiaryCalendar när användaren klickar ett datum
	function handleCalendarDaySelect(dateKey: string | null) {
		calendarFilterDate = dateKey;
		currentPage = 1;
		if (dateKey && typeof document !== 'undefined') {
			document.getElementById('senaste-inlagg')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	async function persistUserConsent(consent: HealthConsentRecord) {
		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (!session) return;

		const { error } = await supabase.auth.updateUser({
			data: {
				health_data_processing_consent: consent
			}
		});

		if (!error) {
			await supabase.auth.refreshSession();
			sessionUser = (await supabase.auth.getSession()).data.session?.user ?? sessionUser;
		}
	}

	function acceptHealthConsent() {
		const consent = grantSensitiveConsent();
		hasHealthDataConsent = true;
		void persistUserConsent(consent);
	}

	async function openWriteEditor() {
		showWriteEditor = true;
		await tick();
		if (typeof requestAnimationFrame === 'function') {
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		}
		writeEditorPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		draftTextarea?.focus({ preventScroll: true });
	}

	async function openLatestEntries() {
		calendarFilterDate = null;
		currentPage = 1;
		await tick();
		if (typeof document !== 'undefined') {
			document.getElementById('senaste-inlagg')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	async function openShareForLatestEntry() {
		await openLatestEntries();
		const latestEntry = entries[0];
		if (!latestEntry?.id || isEntryShared(latestEntry.id)) return;
		openShareConfirmation(latestEntry.id);
	}

	async function saveDraftToDiary() {
		if (!draftText.trim() || savingDraft) return;
		draftError = '';
		draftSuccess = '';
		if (!hasHealthDataConsent) {
			draftError = 'Du behöver samtycka innan du kan spara i dagboken.';
			return;
		}
		if (uploadingImage) {
			draftError = 'Vänta tills bilden har laddats upp innan du sparar.';
			return;
		}
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
					[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION,
					Authorization: `Bearer ${session.access_token}`
				},
				body: JSON.stringify({
					text: draftText.trim(),
					mood: draftMood || null,
					image_url: draftImageUrl
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
			clearDraftImage();
			uploadImageError = '';
			draftSuccess = 'Inlägget är sparat';
			await loadEntries({ force: true, limit: Math.max(entries.length, DIARY_ENTRY_PAGE_SIZE) });
			currentPage = 1;
		} catch (error) {
			draftError = error instanceof Error ? error.message : 'Kunde inte spara inlägget just nu.';
		} finally {
			savingDraft = false;
		}
	}

	async function initializeDiary() {
		if (!sessionUser) {
			entries = [];
			hasMoreEntries = false;
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
			showWriteEditor = true;
		} else if (typeof window !== 'undefined') {
			draftText = parseStoredDraft(localStorage.getItem('mittpsyke_temp_entry'));
		}

		if (typeof window !== 'undefined' && window.location.hash === '#skriv-sjalv') {
			showWriteEditor = true;
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
		canRenderMarkdown = true;

		if (!data.session) {
			supabase.auth.getSession().then(({ data: sessionData }) => {
				sessionUser = sessionData.session?.user ?? null;
				hasHealthDataConsent = hasSensitiveConsent(sessionData.session?.user.user_metadata);
				void initializeDiary();
			});
		} else {
			hasHealthDataConsent = hasSensitiveConsent(data.session.user.user_metadata);
			void initializeDiary();
		}

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, session) => {
			sessionUser = session?.user ?? null;
			if (hasSensitiveConsent(session?.user.user_metadata)) {
				hasHealthDataConsent = true;
			}
		});

		return () => subscription.unsubscribe();
	});

	$effect(() => {
		if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
	});

	onDestroy(() => {
		if (draftImagePreviewUrl) {
			URL.revokeObjectURL(draftImagePreviewUrl);
		}
	});
</script>

<SEO canonical="https://www.mittpsyke.se/dagbok/checkin" />

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

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
					<div class="diary-path-card diary-path-card--preview diary-path-card--write">
						<span class="path-icon-wrap path-icon-wrap--write" aria-hidden="true">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
						</span>
						<span class="diary-path-title">Skriv själv</span>
						<span class="diary-path-copy">Fri text i din egen takt, direkt i dagboken.</span>
					</div>
					<div class="diary-path-card diary-path-card--preview diary-path-card--guided">
						<span class="path-icon-wrap path-icon-wrap--guided" aria-hidden="true">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
						</span>
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

		{#if !hasHealthDataConsent}
			<div class="auth-shell">
				<ConsentGate onAccept={acceptHealthConsent} />
			</div>
		{:else}
		<div class="auth-shell">
			<div class="diary-layout">
				<div class="diary-main">
					<section class="auth-panel diary-paths">
						<h2 class="text-base font-semibold">Välj hur du vill börja</h2>
						<p class="mt-2 text-sm auth-muted">
							Du kan skriva fritt i din personliga dagbok eller välja en röst som guidar dig genom dagen.
						</p>
						<div class="diary-path-grid mt-3">
							<button type="button" class="diary-path-card diary-path-card--write" onclick={openWriteEditor}>
								<span class="path-icon-wrap path-icon-wrap--write" aria-hidden="true">
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
								</span>
								<span class="diary-path-title">Skriv själv</span>
								<span class="diary-path-copy">Fri text i din egen takt, direkt i dagboken.</span>
							</button>
							<a href="/dagars-avtryck" class="diary-path-card diary-path-card--guided">
								<span class="path-icon-wrap path-icon-wrap--guided" aria-hidden="true">
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
								</span>
								<span class="diary-path-title">Dagbok med olika stilar</span>
								<span class="diary-path-copy">Välj en röst som guidar dig vidare med frågor i lugn takt.</span>
							</a>
						</div>
					</section>

					{#if showWriteEditor}
					<section
						bind:this={writeEditorPanel}
						class="auth-panel auth-panel-accent diary-editor-panel"
						id="skriv-sjalv"
					>
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
							bind:this={draftTextarea}
							bind:value={draftText}
							rows={8}
							class="diary-input diary-input--editor"
							placeholder="Skriv några ord..."
						></textarea>

						<!-- Bilduppladdning (valfritt) -->
						<div class="image-upload-row">
							{#if draftImagePreviewUrl || draftImageUrl}
								<div class="image-preview-wrap">
									<img
										src={draftImagePreviewUrl ?? draftImageUrl}
										alt="Vald bild för inlägget"
										class="image-preview"
									/>
									<button
										type="button"
										class="image-remove-btn"
										onclick={() => clearDraftImage()}
									>
										Ta bort bild
									</button>
									{#if uploadingImage}
										<p class="image-upload-status auth-muted">Laddar upp bilden...</p>
									{/if}
								</div>
							{:else}
								<label class="image-upload-label" for="draft-image-input">
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
									{uploadingImage ? 'Laddar upp...' : 'Lägg till bild (valfritt)'}
									<input
										id="draft-image-input"
										type="file"
										accept="image/*"
										class="image-input-hidden"
										onchange={handleImageSelect}
										disabled={uploadingImage}
									/>
								</label>
							{/if}
							{#if uploadImageError}
								<p class="image-upload-error">{uploadImageError}</p>
							{/if}
						</div>
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
								disabled={savingDraft || uploadingImage || !draftText.trim()}
							>
								{savingDraft ? 'Sparar...' : uploadingImage ? 'Väntar på bild...' : 'Spara inlägg'}
							</button>

							<a href="/skriv" class="auth-button editor-secondary">
								Fortsätt skriva senare
							</a>
						</div>
						</div>
					</section>
					{/if}

					{#if draftSuccess && !draftText}
						<section class="auth-panel auth-panel-success">
							<h2 class="text-base font-semibold">{draftSuccess}</h2>
							<p class="mt-2 text-sm">
								Ditt inlägg finns kvar här. Nästa lilla steg kan vara att skriva några ord till nu,
								eller komma tillbaka senare och fortsätta där du slutade.
							</p>
							<p class="mt-2 text-sm auth-muted">
								Vill du behålla det privat eller dela anonymt med andra i Gemenskapen?
							</p>
							<div class="actions-row mt-3">
								<button type="button" class="auth-button primary" onclick={openWriteEditor}>
									Skriv några ord till
								</button>
								<button type="button" class="auth-button" onclick={openLatestEntries}>
									Behåll privat
								</button>
								<button type="button" class="auth-button" onclick={openShareForLatestEntry}>
									Dela i Gemenskapen
								</button>
								{#if hasSavedEntries}
					<a href="/dagbok/checkin#senaste-inlagg" class="auth-button">Se dina senaste inlägg</a>
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

					<DiaryCalendar entries={entries} onDaySelect={handleCalendarDaySelect} />

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
							<p class="flow-heading auth-muted">
								{#if calendarFilterDate}
									Inlägg för {new Date(calendarFilterDate + 'T00:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })}
									<button type="button" class="cal-inline-clear" onclick={() => { calendarFilterDate = null; currentPage = 1; }}>
										× Visa alla
									</button>
								{:else}
									Senaste och äldre inlägg
								{/if}
							</p>
							<div class="diary-entries">
								{#each paginatedEntries as entry (entry.id)}
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
											{#if canRenderMarkdown}
												<div class="entry-markdown text-sm">
													{@html renderDiaryMarkdown(entry.content)}
												</div>
											{:else}
												<p class="mt-2 whitespace-pre-wrap text-sm">{entry.content}</p>
											{/if}
											{#if entry.image_url}
												<img
													src={entry.image_url}
													alt="Bild till dagboksinlägg"
													class="entry-image"
													loading="lazy"
												/>
											{/if}
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
														onclick={() => shareEntryAnonymously(entry)}
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
													onclick={() => openDeviceShare(entry)}
													disabled={sharingDeviceEntryId === entry.id}
												>
													{sharingDeviceEntryId === entry.id ? 'Delar...' : 'Dela'}
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

											{#if confirmingDeviceShareEntryId === entry.id}
												<div class="share-confirmation" role="dialog" aria-modal="false">
													<h3>Välj delning</h3>
													<p>Inlägget har en bild. Vad vill du dela?</p>
													<div class="share-confirmation-actions">
														<button
															type="button"
															class="auth-button primary"
															onclick={() => shareDiaryEntry(entry, 'text')}
															disabled={sharingDeviceEntryId === entry.id}
														>
															Dela endast text
														</button>
														<button
															type="button"
															class="auth-button"
															onclick={() => shareDiaryEntry(entry, 'text_with_image')}
															disabled={sharingDeviceEntryId === entry.id}
														>
															Dela text och bild
														</button>
														<button
															type="button"
															class="auth-button"
															onclick={closeDeviceShareChoice}
															disabled={sharingDeviceEntryId === entry.id}
														>
															Avbryt
														</button>
													</div>
												</div>
											{/if}

											{#if deviceShareFeedbackEntryId === entry.id && deviceShareFeedbackMessage}
												<p class="share-feedback {deviceShareFeedbackType}">
													{deviceShareFeedbackMessage}
												</p>
											{/if}

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
							{#if totalPages > 1}
								<div class="diary-pagination" aria-label="Paginering för dagboksinlägg">
									<p class="diary-pagination-count auth-muted">
										Visar {startIndex + 1}-{endIndex} av {totalEntries} inlägg
									</p>
									<div class="diary-pagination-controls">
										<button
											type="button"
											class="auth-button"
											onclick={goToPreviousEntriesPage}
											disabled={currentPage === 1}
										>
											Föregående
										</button>
										<span class="diary-pagination-page auth-muted">Sida {currentPage} av {totalPages}</span>
										<button
											type="button"
											class="auth-button"
											onclick={goToNextEntriesPage}
											disabled={currentPage === totalPages}
										>
											Nästa
										</button>
									</div>
								</div>
							{/if}
							{#if hasMoreEntries && !calendarFilterDate}
								<button
									type="button"
									class="auth-button load-more-entries"
									onclick={loadMoreEntries}
									disabled={loadingMoreEntries}
								>
									{loadingMoreEntries ? 'Hämtar fler...' : 'Visa fler inlägg'}
								</button>
							{/if}
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
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 1.1rem 1rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		text-decoration: none;
		transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
	}

	/* Amber — Skriv själv */
	.diary-path-card--write {
		background: hsl(35 55% 97%);
		border-color: hsl(35 45% 83%);
		border-left: 3px solid hsl(35 70% 55%);
	}

	/* Blå — Dagbok med olika stilar */
	.diary-path-card--guided {
		background: hsl(220 55% 97%);
		border-color: hsl(220 50% 83%);
		border-left: 3px solid hsl(220 65% 52%);
	}

	.diary-path-card--preview {
		cursor: default;
	}

	.diary-path-card--write:hover:not(.diary-path-card--preview) {
		border-color: hsl(35 55% 70%);
		box-shadow: 0 4px 14px hsl(35 60% 55% / 0.18);
		transform: translateY(-1px);
	}

	.diary-path-card--guided:hover:not(.diary-path-card--preview) {
		border-color: hsl(220 55% 65%);
		box-shadow: 0 4px 14px hsl(220 60% 52% / 0.18);
		transform: translateY(-1px);
	}

	.diary-path-card:focus-visible {
		outline: 2px solid hsl(var(--foreground) / 0.22);
		outline-offset: 2px;
	}

	/* Ikonbubblor */
	.path-icon-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 0.5rem;
		margin-bottom: 0.35rem;
		flex-shrink: 0;
	}

	.path-icon-wrap--write {
		background: hsl(35 65% 90%);
		color: hsl(35 72% 38%);
	}

	.path-icon-wrap--guided {
		background: hsl(220 60% 92%);
		color: hsl(220 68% 42%);
	}

	.diary-path-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.diary-path-copy {
		font-size: 0.82rem;
		line-height: 1.55;
		color: hsl(var(--muted-foreground));
	}

	/* Mörkt läge */
	:global(.dark) .diary-path-card--write {
		background: hsl(35 18% 12%);
		border-color: hsl(35 22% 22%);
		border-left: 3px solid hsl(35 62% 48%);
	}

	:global(.dark) .diary-path-card--guided {
		background: hsl(222 22% 13%);
		border-color: hsl(220 20% 24%);
		border-left: 3px solid hsl(220 58% 52%);
	}

	:global(.dark) .path-icon-wrap--write {
		background: hsl(35 28% 18%);
		color: hsl(35 68% 60%);
	}

	:global(.dark) .path-icon-wrap--guided {
		background: hsl(220 26% 20%);
		color: hsl(220 62% 64%);
	}

	.diary-path-voices {
		font-size: 0.78rem;
		line-height: 1.5;
		color: hsl(var(--foreground) / 0.74);
	}

	.diary-side {
		display: grid;
		gap: 0.85rem;
		order: 0;
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
		border-color: var(--primary, #436e8f);
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
		background: var(--primary, #436e8f);
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
		background: var(--primary, #436e8f);
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

	/* ── Kalenderfilter-knapp i flow-heading ── */
	.cal-inline-clear {
		border: none;
		background: transparent;
		padding: 0 0 0 0.4rem;
		font-size: inherit;
		color: hsl(var(--muted-foreground));
		text-decoration: underline;
		text-underline-offset: 2px;
		cursor: pointer;
	}

	.cal-inline-clear:hover {
		color: hsl(var(--foreground));
	}

	/* ── Bilduppladdning i editor ── */
	.image-upload-row {
		padding: 0.65rem 1rem 0.75rem;
		border-top: 1px solid hsl(var(--border) / 0.5);
		display: grid;
		gap: 0.4rem;
	}

	.image-upload-label {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.83rem;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
		width: fit-content;
		transition: color 130ms ease;
	}

	.image-upload-label:hover {
		color: hsl(var(--foreground));
	}

	.image-input-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	.image-preview-wrap {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.image-preview {
		max-width: 100%;
		max-height: 10rem;
		border-radius: var(--radius-input);
		object-fit: cover;
		border: 1px solid hsl(var(--border));
	}

	.image-remove-btn {
		border: none;
		background: transparent;
		padding: 0;
		font-size: 0.82rem;
		color: hsl(var(--muted-foreground));
		text-decoration: underline;
		text-underline-offset: 2px;
		cursor: pointer;
		align-self: flex-end;
	}

	.image-remove-btn:hover {
		color: hsl(var(--foreground));
	}

	.image-upload-status {
		margin: 0;
		font-size: 0.82rem;
		align-self: flex-end;
	}

	.image-upload-error {
		margin: 0;
		font-size: 0.82rem;
		color: hsl(var(--error-foreground));
	}

	/* ── Bild i inläggskort ── */
	.entry-image {
		display: block;
		max-width: 100%;
		max-height: 22rem;
		border-radius: var(--radius-input);
		object-fit: cover;
		margin-top: 0.6rem;
		border: 1px solid hsl(var(--border));
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
		stroke: #8FE3A6;
		stroke-width: 1.2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.mood-chart-dot {
		fill: #8FE3A6;
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

	.load-more-entries {
		margin-top: 0.85rem;
		width: 100%;
		justify-content: center;
	}

	.diary-pagination {
		margin-top: 0.85rem;
		display: grid;
		gap: 0.55rem;
	}

	.diary-pagination-count {
		margin: 0;
		font-size: 0.82rem;
		text-align: center;
	}

	.diary-pagination-controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.65rem;
		flex-wrap: wrap;
	}

	.diary-pagination-page {
		font-size: 0.86rem;
	}

	.diary-entry {
		transition: border-color 160ms ease, box-shadow 160ms ease;
	}

	.diary-entry:hover {
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
	}

	.entry-markdown {
		margin-top: 0.5rem;
		line-height: 1.65;
		overflow-wrap: anywhere;
	}

	.entry-markdown :global(p),
	.entry-markdown :global(ul),
	.entry-markdown :global(ol),
	.entry-markdown :global(blockquote),
	.entry-markdown :global(pre) {
		margin: 0.55rem 0 0;
	}

	.entry-markdown :global(p:first-child),
	.entry-markdown :global(ul:first-child),
	.entry-markdown :global(ol:first-child),
	.entry-markdown :global(blockquote:first-child),
	.entry-markdown :global(pre:first-child),
	.entry-markdown :global(h2:first-child),
	.entry-markdown :global(h3:first-child) {
		margin-top: 0;
	}

	.entry-markdown :global(ul),
	.entry-markdown :global(ol) {
		padding-left: 1.1rem;
	}

	.entry-markdown :global(li + li) {
		margin-top: 0.2rem;
	}

	.entry-markdown :global(strong) {
		font-weight: 700;
	}

	.entry-markdown :global(em) {
		font-style: italic;
	}

	.entry-markdown :global(h2),
	.entry-markdown :global(h3) {
		margin: 0.75rem 0 0;
		font-size: 0.98rem;
		line-height: 1.35;
	}

	.entry-markdown :global(blockquote) {
		padding-left: 0.8rem;
		border-left: 3px solid hsl(var(--border));
		color: hsl(var(--muted-foreground));
	}

	.entry-markdown :global(code) {
		padding: 0.08rem 0.25rem;
		border-radius: 0.35rem;
		background: hsl(var(--surface-soft));
		font-size: 0.9em;
	}

	.entry-markdown :global(pre) {
		max-width: 100%;
		overflow-x: auto;
		padding: 0.65rem;
		border-radius: var(--radius-input);
		background: hsl(var(--surface-soft));
	}

	.entry-markdown :global(pre code) {
		padding: 0;
		background: transparent;
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
		border-color: var(--primary, #436e8f);
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

	@media (max-width: 760px) {
		:global(.auth-page:has(.diary-layout)) {
			padding-inline: 0.55rem;
		}

		:global(.auth-page:has(.diary-layout) .auth-shell) {
			gap: 0.6rem;
		}

		:global(.auth-page:has(.diary-layout) .auth-hero p) {
			display: none;
		}

		:global(.auth-page:has(.diary-layout) .auth-subnav) {
			gap: 0.2rem;
			padding: 0.2rem;
			overflow-x: auto;
			flex-wrap: nowrap;
		}

		:global(.auth-page:has(.diary-layout) .auth-subnav-link) {
			flex: 0 0 auto;
			min-width: 5.8rem;
			padding: 0.42rem 0.55rem;
			font-size: 0.8rem;
		}

		.diary-layout,
		.diary-main,
		.diary-side {
			gap: 0.55rem;
		}

		.diary-paths {
			padding: 0.75rem;
			gap: 0.35rem;
		}

		.diary-paths h2 {
			font-size: 0.98rem;
		}

		.diary-paths > p,
		.diary-path-copy,
		.editor-kicker,
		.editor-intro,
		.editor-support,
		.editor-note,
		.mood-meaning,
		.mood-anchors,
		.week-head p,
		.mood-graph-header p {
			display: none;
		}

		.diary-path-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.45rem;
			margin-top: 0.35rem !important;
		}

		.diary-path-card {
			padding: 0.7rem;
			min-height: 4.5rem;
		}

		.path-icon-wrap {
			width: 1.85rem;
			height: 1.85rem;
			margin-bottom: 0.15rem;
		}

		.diary-path-title {
			font-size: 0.86rem;
			line-height: 1.25;
		}

		.diary-editor-panel {
			padding: 0.65rem;
		}

		.editor-shell {
			gap: 0.55rem;
		}

		.editor-head {
			text-align: left;
			gap: 0.3rem;
		}

		.editor-title {
			font-size: 1.22rem;
		}

		.editor-date {
			justify-self: start;
			padding: 0;
			border: 0;
			background: transparent;
			font-size: 0.74rem;
		}

		.editor-mood-field {
			padding: 0.68rem 0.75rem;
			gap: 0.35rem;
		}

		.mood-current {
			font-size: 0.78rem;
		}

		.diary-input--editor {
			min-height: 11.5rem;
			padding: 0.85rem;
			font-size: 0.95rem;
			line-height: 1.65;
		}

		.image-upload-row {
			padding: 0.55rem 0.75rem;
		}

		.image-preview {
			max-height: 7rem;
		}

		.editor-actions {
			margin-top: 0.55rem;
			gap: 0.45rem;
		}

		.editor-primary,
		.editor-secondary,
		.entry-edit-actions .auth-button,
		.entry-delete-actions .auth-button,
		.share-confirmation-actions .auth-button {
			width: 100%;
			min-width: 0;
		}

		:global(.mood-timeline-panel) {
			gap: 0.55rem;
		}

		:global(.mood-timeline-panel .timeline-copy p),
		:global(.mood-timeline-panel .timeline-summary),
		:global(.mood-timeline-panel .timeline-note),
		:global(.mood-timeline-panel .timeline-supportive),
		:global(.mood-timeline-panel .timeline-empty p + p) {
			display: none;
		}

		:global(.mood-timeline-panel .timeline-filter-button) {
			padding: 0.32rem 0.58rem;
			font-size: 0.78rem;
		}

		:global(.diary-calendar) {
			gap: 0.45rem;
		}

		.diary-side .auth-panel {
			padding: 0.72rem;
		}

		.week-count {
			font-size: 1.45rem;
		}

		.mood-chart {
			height: 64px;
		}

		.diary-entries {
			gap: 0.55rem;
		}

		.diary-entry {
			padding: 0.75rem;
		}

		.share-row,
		.entry-actions {
			gap: 0.35rem 0.55rem;
		}
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
			order: 0;
		}
	}
</style>

