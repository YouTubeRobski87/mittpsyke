<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';
	import {
		getMilestoneStorageKey,
		hasSeenMilestone,
		queuePendingMilestone
	} from '$lib/milestone-state';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent
	} from '$lib/consent';
	import { supabase } from '$lib/supabase';
	import { notifyDiaryEntriesChanged } from '$lib/diary-events';

	const moodOptions = [
		'Orolig i kroppen',
		'Rastlös',
		'Nedstämd',
		'Mycket ångest',
		'Trött',
		'Lugn',
		'Okej faktiskt',
		'Lättad',
		'Glad'
	];

	const factorOptions = [
		'Jobbet eller skolan',
		'Relationer',
		'Sömn',
		'Ekonomi',
		'Osäkerhet om framtiden',
		'Kroppen eller hälsan',
		'Vet inte riktigt',
		'Inget speciellt'
	];
	const durationOptions = ['Idag', 'Några dagar', 'En vecka eller mer', 'Länge nu', 'Vet inte riktigt'];

	const selfCareOptions = [
		'Sovit tillräckligt',
		'Ätit ordentligt',
		'Rört på mig',
		'Pratat med någon',
		'Tagit en paus',
		'Inget av ovanstående'
	];

	const helpOptions = [
		'Att skriva av mig',
		'Att bara vila',
		'Att prata med någon',
		'Att göra något konkret',
		'Att känna mig förstådd',
		'Vet inte'
	];

	const reflectionFallback =
		'Det är fint att du stannade upp och gjorde en incheckning. Känslor kan skifta snabbt, och det är okej att de gör det. Du behöver inte lösa allt nu, ett litet steg i taget räcker. Om du vill kan du skriva vidare i dagboken och ge plats åt det som pågår.';

	let step = 1;
	let selectedMoods: string[] = [];
	let selectedFactors: string[] = [];
	let selectedDuration = '';
	let selectedSelfCare: string[] = [];
	let selectedHelp: string[] = [];
	let moodFreeText = '';
	let factorFreeText = '';
	let reflection = '';
	let reflectionError = '';
	let generatingReflection = false;
	let savingToDiary = false;
	let saveError = '';
	let authLoading = true;
	let authError = '';
	let sessionToken = '';
	let sessionUserId = '';
	let hasHealthDataConsent = false;
	let hasDiaryAiConsent = false;

	function logMilestoneDebug(details: {
		milestoneKey?: string;
		alreadyShown?: boolean;
		previousCount: number | null;
		savedEntryId?: string | null;
		toastTriggered?: boolean;
		shouldShowMilestone?: boolean;
		reason?: string;
		source: string;
	}) {
		if (!dev) return;
		console.info('[MittPsyke milestone]', details);
	}

	function toggleOption(list: string[], value: string): string[] {
		if (list.includes(value)) {
			return list.filter((item) => item !== value);
		}
		return [...list, value];
	}

	function toggleMood(value: string) {
		selectedMoods = toggleOption(selectedMoods, value);
	}

	function toggleFactor(value: string) {
		selectedFactors = toggleOption(selectedFactors, value);
	}

	function selectDuration(value: string) {
		selectedDuration = selectedDuration === value ? '' : value;
	}

	function toggleSelfCare(value: string) {
		selectedSelfCare = toggleOption(selectedSelfCare, value);
	}

	function toggleHelp(value: string) {
		selectedHelp = toggleOption(selectedHelp, value);
	}

	function canProceedStep1() {
		return selectedMoods.length > 0 || moodFreeText.trim().length > 0;
	}

	function canProceedStep2() {
		return selectedFactors.length > 0 || factorFreeText.trim().length > 0;
	}

	function canProceedStep3() {
		return selectedDuration.length > 0;
	}

	function canProceedStep4() {
		return selectedSelfCare.length > 0;
	}

	function canProceedStep5() {
		return selectedHelp.length > 0;
	}

	function goToStep2() {
		if (!canProceedStep1()) return;
		step = 2;
	}

	function goBackToStep1() {
		if (generatingReflection || savingToDiary) return;
		step = 1;
	}

	function goBackToStep2() {
		if (generatingReflection || savingToDiary) return;
		step = 2;
	}

	function goBackToStep3() {
		if (generatingReflection || savingToDiary) return;
		step = 3;
	}

	function goBackToStep4() {
		if (generatingReflection || savingToDiary) return;
		step = 4;
	}

	function goBackToStep5() {
		if (generatingReflection || savingToDiary) return;
		step = 5;
	}

	function goToStep3() {
		if (!canProceedStep2()) return;
		step = 3;
	}

	function goToStep4() {
		if (!canProceedStep3()) return;
		step = 4;
	}

	function goToStep5() {
		if (!canProceedStep4()) return;
		step = 5;
	}

	async function goToStep6() {
		if (!canProceedStep5() || generatingReflection || !sessionToken) return;

		step = 6;
		generatingReflection = true;
		reflection = '';
		reflectionError = '';
		saveError = '';

		try {
			const response = await fetch('/api/diary/checkin-reflection', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${sessionToken}`
				},
				body: JSON.stringify({
					selectedMoods,
					selectedFactors,
					selectedDuration,
					selectedSelfCare,
					selectedHelp,
					moodFreeText: moodFreeText.trim(),
					factorFreeText: factorFreeText.trim()
				})
			});

			const payload = (await response.json().catch(() => null)) as
				| { success?: boolean; reflection?: string; error?: string }
				| null;

			if (!response.ok) {
				reflection = reflectionFallback;
				reflectionError = payload?.error || 'Kunde inte hämta reflektion just nu.';
				return;
			}

			reflection =
				typeof payload?.reflection === 'string' && payload.reflection.trim()
					? payload.reflection.trim()
					: reflectionFallback;
		} catch (error) {
			reflection = reflectionFallback;
			reflectionError = error instanceof Error ? error.message : 'Kunde inte hämta reflektion just nu.';
		} finally {
			generatingReflection = false;
		}
	}

	function formatSelectedList(items: string[]) {
		if (items.length === 0) return '- Inget valt';
		return items.map((item) => `- ${item}`).join('\n');
	}

	function formatSingleValue(value: string) {
		return value ? `- ${value}` : '- Inget valt';
	}

	function buildDiaryContent() {
		const ownWords = [moodFreeText.trim(), factorFreeText.trim()].filter(Boolean);

		const blocks = [
			'Guidad incheckning',
			'',
			'Hur jag mår just nu:',
			formatSelectedList(selectedMoods),
			'',
			'Vad som påverkar:',
			formatSelectedList(selectedFactors),
			'',
			'Hur länge det har känts så:',
			formatSingleValue(selectedDuration),
			'',
			'Gjort för mig själv idag:',
			formatSelectedList(selectedSelfCare),
			'',
			'Vad som skulle hjälpa just nu:',
			formatSelectedList(selectedHelp)
		];

		if (ownWords.length > 0) {
			blocks.push('', 'Egna ord:', ownWords.join('\n'));
		}

		blocks.push('', 'MittPsyke-reflektion:', reflection || reflectionFallback);

		return blocks.join('\n');
	}

	async function saveToDiary() {
		if (savingToDiary || !sessionToken || !hasHealthDataConsent) return;
		savingToDiary = true;
		saveError = '';

		try {
			const { count: previousCount, error: countError } = await supabase
				.from('diary')
				.select('id', { count: 'exact', head: true })
				.eq('user_id', sessionUserId);

			if (countError) {
				logMilestoneDebug({
					previousCount: null,
					savedEntryId: null,
					toastTriggered: false,
					reason: 'count unavailable',
					source: 'dagars-avtryck/checkin count failed'
				});
			}

			const response = await fetch('/api/diary/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION,
					Authorization: `Bearer ${sessionToken}`
				},
				body: JSON.stringify({
					text: buildDiaryContent(),
					mood: selectedMoods[0] || null
				})
			});

			const payload = (await response.json().catch(() => null)) as {
				error?: string;
				diary?: { id?: string | null };
			} | null;
			if (!response.ok) {
				logMilestoneDebug({
					milestoneKey: getMilestoneStorageKey('first_diary_entry', sessionUserId),
					alreadyShown: hasSeenMilestone('first_diary_entry', sessionUserId),
					previousCount: previousCount ?? null,
					savedEntryId: null,
					toastTriggered: false,
					reason: 'save failed',
					source: 'dagars-avtryck/checkin'
				});
				saveError = payload?.error || 'Kunde inte spara incheckningen just nu.';
				return;
			}

			notifyDiaryEntriesChanged();
			if (!sessionUserId) {
				logMilestoneDebug({
					milestoneKey: getMilestoneStorageKey('first_diary_entry', sessionUserId),
					alreadyShown: false,
					previousCount: previousCount ?? null,
					savedEntryId: payload?.diary?.id ?? null,
					toastTriggered: false,
					reason: 'no user/browser',
					source: 'dagars-avtryck/checkin'
				});
			} else if (hasSeenMilestone('first_diary_entry', sessionUserId)) {
				logMilestoneDebug({
					milestoneKey: getMilestoneStorageKey('first_diary_entry', sessionUserId),
					alreadyShown: true,
					previousCount: previousCount ?? null,
					savedEntryId: payload?.diary?.id ?? null,
					toastTriggered: false,
					reason: 'already shown',
					source: 'dagars-avtryck/checkin'
				});
			} else {
				queuePendingMilestone('first_diary_entry', sessionUserId);
				logMilestoneDebug({
					milestoneKey: getMilestoneStorageKey('first_diary_entry', sessionUserId),
					alreadyShown: false,
					previousCount: previousCount ?? null,
					savedEntryId: payload?.diary?.id ?? null,
					toastTriggered: true,
					source: 'dagars-avtryck/checkin queued'
				});
			}
			await goto('/dagbok/checkin');
		} catch (error) {
			saveError = error instanceof Error ? error.message : 'Kunde inte spara incheckningen just nu.';
		} finally {
			savingToDiary = false;
		}
	}

	function continueToDiaryWriting() {
		const prefill = (reflection || reflectionFallback).trim();
		void goto(`/dagbok/checkin?prefill=${encodeURIComponent(prefill)}`);
	}

	async function grantDiaryAiConsent() {
		if (!sessionToken) throw new Error('Du behöver vara inloggad för att ge samtycke.');

		const response = await fetch('/api/consent/diary-ai', {
			method: 'POST',
			headers: { Authorization: `Bearer ${sessionToken}` }
		});

		if (!response.ok) throw new Error('Kunde inte spara samtycket just nu.');
		grantSensitiveConsent();
		hasHealthDataConsent = true;
		hasDiaryAiConsent = true;
	}

	onMount(async () => {
		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (!session?.access_token) {
			authError = 'Du behöver vara inloggad för att använda guidad incheckning.';
			authLoading = false;
			return;
		}

		sessionToken = session.access_token;
		sessionUserId = session.user.id;
		try {
			const response = await fetch('/api/consent/diary-ai', {
				headers: { Authorization: `Bearer ${session.access_token}` }
			});
			const payload = (await response.json().catch(() => null)) as { status?: string } | null;
			hasDiaryAiConsent = response.ok && payload?.status === 'granted';
			hasHealthDataConsent = hasDiaryAiConsent;
		} catch {
			hasDiaryAiConsent = false;
			hasHealthDataConsent = false;
		}
		authLoading = false;
	});
</script>

<SEO canonical="https://www.mittpsyke.se/dagars-avtryck/checkin" />

<svelte:head>
	<title>Guidad incheckning – MittPsyke</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="auth-page">
	<PortalSubnav
		active="dagbok"
		title="Guidad incheckning"
		description="Sex lugna steg för att sätta ord på hur du mår just nu."
	/>

	<div class="auth-shell checkin-shell">
		{#if authLoading}
			<section class="auth-panel">
				<p class="auth-muted">Laddar guidad incheckning...</p>
			</section>
		{:else if authError}
			<section class="auth-panel auth-panel-error">
				<p>{authError}</p>
				<a href="/login" class="auth-button mt-3">Logga in</a>
			</section>
		{:else if !hasDiaryAiConsent}
			<ConsentGate
				title="Innan du får din reflektion"
				dataLabel="Det du väljer i incheckningen"
				serviceLabel="MittPsyke och OpenAI för att skapa en kort reflektion"
				onAccept={grantDiaryAiConsent}
			/>
		{:else}
			<section class="auth-panel auth-panel-accent checkin-panel">
				<div class="progress-wrap" aria-label={`Steg ${step} av 6`}>
					<p class="progress-label">Steg {step} av 6</p>
					<div class="progress-track">
						{#each [1, 2, 3, 4, 5, 6] as progressStep}
							<span class={`progress-dot ${step >= progressStep ? 'active' : ''}`}></span>
						{/each}
					</div>
				</div>

				{#if step === 1}
					<div class="step-wrap">
						<h2>Hur mår du just nu?</h2>
						<p class="auth-muted">Välj ett eller flera ord som känns nära just nu.</p>

						<div class="chips-wrap">
							{#each moodOptions as mood}
								<button
									type="button"
									class={`chip ${selectedMoods.includes(mood) ? 'selected' : ''}`}
									onclick={() => toggleMood(mood)}
								>
									{#if selectedMoods.includes(mood)}
										<span class="chip-check" aria-hidden="true">✓</span>
									{/if}
									<span>{mood}</span>
								</button>
							{/each}
						</div>
						<p class="chips-hint auth-muted">Du kan välja flera.</p>

						<label class="field-label" for="mood-free-text">
							Vill du lägga till något? (helt valfritt)
						</label>
						<textarea
							id="mood-free-text"
							class="checkin-input"
							rows={4}
							bind:value={moodFreeText}
							placeholder="Det behöver inte vara perfekt. Skriv kort eller långt."
						></textarea>
						<p class="field-hint auth-muted">Det här är bara för dig.</p>

						<div class="actions-wrap">
							<button
								type="button"
								class="auth-button primary next-button"
								onclick={goToStep2}
								disabled={!canProceedStep1()}
							>
								Nästa
							</button>
						</div>
					</div>
				{:else if step === 2}
					<div class="step-wrap">
						<h2>Vad tror du påverkar det?</h2>
						<p class="auth-muted">Välj det som känns relevant för dig just nu.</p>

						<div class="chips-wrap">
							{#each factorOptions as factor}
								<button
									type="button"
									class={`chip ${selectedFactors.includes(factor) ? 'selected' : ''}`}
									onclick={() => toggleFactor(factor)}
								>
									{#if selectedFactors.includes(factor)}
										<span class="chip-check" aria-hidden="true">✓</span>
									{/if}
									<span>{factor}</span>
								</button>
							{/each}
						</div>
						<p class="chips-hint auth-muted">Du kan välja flera.</p>

						<label class="field-label" for="factor-free-text">
							Något mer du vill lägga till? (valfritt)
						</label>
						<textarea
							id="factor-free-text"
							class="checkin-input"
							rows={4}
							bind:value={factorFreeText}
							placeholder="Det behöver inte vara perfekt. Skriv kort eller långt."
						></textarea>
						<p class="field-hint auth-muted">Det här är bara för dig.</p>

						<div class="actions-wrap">
							<button type="button" class="auth-button back-button" onclick={goBackToStep1}>Tillbaka</button>
							<button
								type="button"
								class="auth-button primary next-button"
								onclick={goToStep3}
								disabled={!canProceedStep2()}
							>
								Nästa
							</button>
						</div>
					</div>
				{:else if step === 3}
					<div class="step-wrap">
						<h2>Hur länge har det känts så?</h2>
						<p class="auth-muted">Välj det som passar bäst just nu.</p>

						<div class="chips-wrap">
							{#each durationOptions as duration}
								<button
									type="button"
									class={`chip ${selectedDuration === duration ? 'selected' : ''}`}
									onclick={() => selectDuration(duration)}
								>
									{#if selectedDuration === duration}
										<span class="chip-check" aria-hidden="true">✓</span>
									{/if}
									<span>{duration}</span>
								</button>
							{/each}
						</div>

						<div class="actions-wrap">
							<button type="button" class="auth-button back-button" onclick={goBackToStep2}>Tillbaka</button>
							<button
								type="button"
								class="auth-button primary next-button"
								onclick={goToStep4}
								disabled={!canProceedStep3()}
							>
								Nästa
							</button>
						</div>
					</div>
				{:else if step === 4}
					<div class="step-wrap">
						<h2>Har du gjort något för dig själv idag?</h2>
						<p class="auth-muted">Välj det som stämmer in.</p>

						<div class="chips-wrap">
							{#each selfCareOptions as selfCare}
								<button
									type="button"
									class={`chip ${selectedSelfCare.includes(selfCare) ? 'selected' : ''}`}
									onclick={() => toggleSelfCare(selfCare)}
								>
									{#if selectedSelfCare.includes(selfCare)}
										<span class="chip-check" aria-hidden="true">✓</span>
									{/if}
									<span>{selfCare}</span>
								</button>
							{/each}
						</div>
						<p class="chips-hint auth-muted">Du kan välja flera.</p>

						<div class="actions-wrap">
							<button type="button" class="auth-button back-button" onclick={goBackToStep3}>Tillbaka</button>
							<button
								type="button"
								class="auth-button primary next-button"
								onclick={goToStep5}
								disabled={!canProceedStep4()}
							>
								Nästa
							</button>
						</div>
					</div>
				{:else if step === 5}
					<div class="step-wrap">
						<h2>Vad skulle hjälpa dig just nu?</h2>
						<p class="auth-muted">Välj det som känns mest hjälpsamt.</p>

						<div class="chips-wrap">
							{#each helpOptions as help}
								<button
									type="button"
									class={`chip ${selectedHelp.includes(help) ? 'selected' : ''}`}
									onclick={() => toggleHelp(help)}
								>
									{#if selectedHelp.includes(help)}
										<span class="chip-check" aria-hidden="true">✓</span>
									{/if}
									<span>{help}</span>
								</button>
							{/each}
						</div>
						<p class="chips-hint auth-muted">Du kan välja flera.</p>

						<div class="actions-wrap">
							<button type="button" class="auth-button back-button" onclick={goBackToStep4}>Tillbaka</button>
							<button
								type="button"
								class="auth-button primary next-button"
								onclick={goToStep6}
								disabled={!canProceedStep5()}
							>
								Nästa
							</button>
						</div>
					</div>
				{:else}
					<div class="step-wrap">
						<h2>AI-genererad reflektion</h2>

						{#if generatingReflection}
							<div class="reflection-loading" role="status" aria-live="polite">
								<span class="loading-dot"></span>
								<p>MittPsyke reflekterar över ditt svar...</p>
							</div>
						{:else}
							{#if reflectionError}
								<p class="text-sm error-copy">{reflectionError}</p>
							{/if}

							<div class="reflection-box">
								<p>{reflection || reflectionFallback}</p>
							</div>

							{#if saveError}
								<p class="text-sm error-copy">{saveError}</p>
							{/if}

							<div class="actions-wrap">
								<button
									type="button"
									class="auth-button primary"
									onclick={saveToDiary}
									disabled={savingToDiary}
								>
									{savingToDiary ? 'Sparar...' : 'Spara i dagboken'}
								</button>
								<button type="button" class="auth-button" onclick={continueToDiaryWriting}>
									Börja skriva mer
								</button>
								<button
									type="button"
									class="auth-button back-button"
									onclick={goBackToStep5}
									disabled={savingToDiary}
								>
									Tillbaka
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</section>
		{/if}
	</div>
</main>

<style>
	.checkin-shell {
		max-width: 1080px;
	}

	.checkin-panel {
		display: grid;
		gap: 1rem;
		padding: clamp(1.05rem, 2.2vw, 1.55rem);
	}

	@media (min-width: 900px) {
		.checkin-panel {
			padding-inline: clamp(1.65rem, 3.6vw, 2.4rem);
		}
	}

	.progress-wrap {
		display: grid;
		gap: 0.4rem;
	}

	.progress-label {
		margin: 0;
		font-size: 0.86rem;
		color: hsl(var(--muted-foreground));
	}

	.progress-track {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 0.4rem;
	}

	.progress-dot {
		height: 0.4rem;
		border-radius: var(--radius-pill);
		background: hsl(var(--surface-muted));
		border: 1px solid hsl(var(--border));
	}

	.progress-dot.active {
		background: var(--theme-accent, var(--primary));
		border-color: var(--theme-accent, var(--primary));
	}

	.step-wrap {
		display: grid;
		gap: 0.8rem;
	}

	.step-wrap h2 {
		margin: 0;
		font-size: 1.16rem;
	}

	.chips-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem;
	}

	.chips-hint {
		margin: -0.2rem 0 0;
		font-size: 0.8rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-pill);
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		padding: 0.48rem 0.84rem;
		font-size: 0.9rem;
		line-height: 1.2;
		cursor: pointer;
		transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
	}

	.chip:hover {
		border-color: hsl(var(--muted-foreground) / 0.5);
		background: hsl(var(--surface-soft));
	}

	.chip.selected {
		background: var(--theme-accent, var(--primary));
		border: 2px solid var(--theme-accent, var(--primary));
		color: #ffffff;
	}

	.chip-check {
		font-size: 0.85rem;
		line-height: 1;
		font-weight: 700;
	}

	.field-label {
		font-size: 0.9rem;
		color: hsl(var(--muted-foreground));
	}

	.checkin-input {
		width: 100%;
		padding: 0.75rem 0.85rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		resize: vertical;
		min-height: 112px;
	}

	.checkin-input:focus {
		outline: none;
		border-color: var(--theme-accent, var(--primary));
	}

	.field-hint {
		margin: -0.22rem 0 0;
		font-size: 0.79rem;
	}

	.actions-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.next-button.auth-button.primary {
		min-width: 160px;
		padding: 0.68rem 1.3rem;
		background: var(--theme-accent, var(--primary));
		border-color: var(--theme-accent, var(--primary));
		color: #ffffff;
	}

	.next-button.auth-button.primary:hover {
		background: color-mix(in srgb, var(--theme-accent, var(--primary)) 90%, black);
		border-color: color-mix(in srgb, var(--theme-accent, var(--primary)) 90%, black);
	}

	.back-button.auth-button {
		background: transparent;
		border-color: transparent;
		color: hsl(var(--muted-foreground));
		text-decoration: underline;
		text-underline-offset: 2px;
		padding-inline: 0.3rem;
	}

	.back-button.auth-button:hover {
		background: transparent;
		border-color: transparent;
		color: hsl(var(--foreground));
	}

	.reflection-loading {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		color: hsl(var(--muted-foreground));
	}

	.loading-dot {
		width: 0.72rem;
		height: 0.72rem;
		border-radius: 999px;
		background: var(--theme-accent, var(--primary));
		animation: pulse 1.1s ease-in-out infinite;
	}

	.reflection-box {
		padding: 0.9rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
	}

	.reflection-box p {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.7;
		white-space: pre-wrap;
	}

	.error-copy {
		margin: 0;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.35;
		}
		50% {
			opacity: 1;
		}
	}

	@media (max-width: 640px) {
		.actions-wrap :global(.auth-button) {
			width: 100%;
		}

		.next-button.auth-button.primary {
			min-width: 100%;
		}
	}
</style>
