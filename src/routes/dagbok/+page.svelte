<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { trackSignupCompleted, trackDiaryPageOpenedFromHoroscope } from '$lib/analytics';
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';
	import { supabase } from '$lib/supabase';
	import { loadDiaryEntries, type DiaryEntry } from '$lib/state/diary';
	import type {
		CommunityMySharesSuccessResponse,
		CreateCommunityShareSuccessResponse
	} from '$lib/types';

	let entries: DiaryEntry[] = [];
	let loading = true;
	let loadError = '';
	let draftText = '';
	let draftMood = '';
	let draftMoodPreview = 5;
	let draftError = '';
	let draftSuccess = '';
	let savingDraft = false;
	type MoodGraphPoint = { mood: number };
	let moodGraphPoints: MoodGraphPoint[] = [];
	let weeklyEntryCount = 0;
	let sharedEntryIds = new Set<string>();
	let confirmingShareEntryId = '';
	let sharingEntryId = '';
	let shareFeedbackEntryId = '';
	let shareFeedbackMessage = '';
	let shareFeedbackType: 'success' | 'error' | 'info' = 'info';

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

	$: moodGraphPoints = buildMoodGraphPoints(entries);
	$: weeklyEntryCount = countEntriesThisWeek(entries);

	function isEntryShared(entryId: string): boolean {
		return sharedEntryIds.has(entryId);
	}

	function setShareFeedback(entryId: string, message: string, type: 'success' | 'error' | 'info') {
		shareFeedbackEntryId = entryId;
		shareFeedbackMessage = message;
		shareFeedbackType = type;
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
		shareFeedbackEntryId = '';
		shareFeedbackMessage = '';
	}

	function closeShareConfirmation() {
		if (sharingEntryId) return;
		confirmingShareEntryId = '';
	}

	async function shareEntryAnonymously(entry: DiaryEntry) {
		if (sharingEntryId || !entry.id) return;

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
				const alreadyShared = response.status === 409 && payload?.alreadyShared;
				if (alreadyShared) {
					sharedEntryIds = new Set([...sharedEntryIds, entry.id]);
					setShareFeedback(entry.id, 'Det här inlägget är redan delat i Gemenskap.', 'info');
				} else {
					setShareFeedback(entry.id, payload?.error || 'Kunde inte dela inlägget just nu.', 'error');
				}
				return;
			}

			if (!payload.success) {
				setShareFeedback(entry.id, 'Kunde inte dela inlägget just nu.', 'error');
				return;
			}

			sharedEntryIds = new Set([...sharedEntryIds, entry.id]);
			setShareFeedback(entry.id, 'Inlägget har delats anonymt i Gemenskap.', 'success');
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

	onMount(async () => {
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
			await loadEntries();
			await loadSharedEntryIds();
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Kunde inte ladda dagboken just nu.';
		} finally {
			loading = false;
		}
	});
</script>

<main class="auth-page">
	<PortalSubnav
		active="dagbok"
		title="Din dagbok"
		description="Skriv i lugn och ro, i din egen takt. Det räcker med några ord."
	/>

	<div class="auth-shell">
		{#if loading}
			<section class="auth-panel">
				<p class="auth-muted">Laddar...</p>
			</section>
		{:else}
			<div class="diary-layout">
				<div class="diary-main">
					<section class="auth-panel auth-panel-accent">
						<h2 class="text-base font-semibold">Nytt inlägg</h2>
						<p class="mt-2 text-sm auth-muted">
							Läs igenom i lugn och ro. Du kan justera texten innan du sparar.
						</p>
						<div class="mood-field">
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
							class="diary-input"
							placeholder="Skriv några ord..."
						></textarea>

						{#if draftError}
							<p class="mt-3 text-sm error-copy">{draftError}</p>
						{/if}

						<div class="actions-row">
							<button
								type="button"
								class="auth-button primary"
								onclick={saveDraftToDiary}
								disabled={savingDraft || !draftText.trim()}
							>
								{savingDraft ? 'Sparar...' : 'Spara inlägg'}
							</button>

							<a href="/skriv" class="auth-button">
								Fortsätt skriva senare
							</a>
						</div>
					</section>

					{#if draftSuccess && !draftText}
						<section class="auth-panel auth-panel-success">
							<h2 class="text-base font-semibold">{draftSuccess}</h2>
							<p class="mt-2 text-sm">Du kan fortsätta skriva i din dagbok när som helst.</p>
						</section>
					{/if}

					{#if loadError}
						<section class="auth-panel auth-panel-error">
							<p class="text-sm">{loadError}</p>
						</section>
					{/if}

					{#if entries.length === 0}
						<section class="auth-panel">
							<h2 class="text-lg font-semibold">Din dagbok börjar här</h2>
							<p class="mt-2 text-sm auth-muted">Det räcker med några ord. Skriv i lugn och ro, i din egen takt.</p>
							<a href="/skriv" class="auth-button mt-4">
								Skriv första inlägget
							</a>
						</section>
					{:else}
						<div class="diary-flow">
							<p class="flow-heading auth-muted">Senaste och äldre inlägg</p>
							<div class="diary-entries">
								{#each entries as entry (entry.id)}
									<article class="auth-panel diary-entry">
										<p class="text-xs auth-muted">{formatDate(entry.created_at)}</p>
										{#if entry.mood}
											<p class="mt-1 text-xs auth-muted">Humör: {entry.mood}/10</p>
										{/if}
										<p class="mt-2 whitespace-pre-wrap text-sm">{entry.content}</p>
										<div class="share-row">
											{#if isEntryShared(entry.id)}
												<p class="share-status auth-muted">Redan delat anonymt i Gemenskap.</p>
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

										{#if shareFeedbackEntryId === entry.id && shareFeedbackMessage}
											<p class="share-feedback {shareFeedbackType}">
												{shareFeedbackMessage}
												{#if shareFeedbackType === 'success'}
													<a href="/dashboard/gemenskap" class="share-feedback-link">
														Öppna Gemenskap
													</a>
												{/if}
											</p>
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
		{/if}
	</div>
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

	.actions-row {
		margin-top: 0.95rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.error-copy {
		color: hsl(var(--error-foreground));
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

	:global(.dark) .diary-entry:hover {
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.24);
	}

	@media (min-width: 980px) {
		.diary-layout {
			grid-template-columns: minmax(0, 1fr) 300px;
			align-items: start;
		}

		.diary-side {
			position: sticky;
			top: 0.7rem;
		}
	}
</style>
