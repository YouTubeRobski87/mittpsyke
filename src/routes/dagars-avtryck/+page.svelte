<script lang="ts">
	import { supabase } from '$lib/supabase';

	type StorifyEntry = {
		id: string;
		content: string;
		tone: string | null;
		mood_emojis: string[] | null;
		created_at: string;
	};

	let { data } = $props<{ data: { entries: StorifyEntry[] } }>();

	// Flikhantering
	let activeTab = $state<'skriv' | 'entries'>('skriv');

	// Skriv-formulär
	let userInput = $state('');
	let selectedMoods = $state<string[]>([]);
	let energyScore = $state(5);
	let generating = $state(false);
	let generatedEntry = $state('');
	let generatedTone = $state('');
	let saving = $state(false);
	let saved = $state(false);
	let errorMsg = $state('');

	// Inläggslista – initieras från servern, uppdateras efter sparning
	let entries = $state<StorifyEntry[]>(data.entries ?? []);

	const MOOD_OPTIONS = [
		{ emoji: '😊', label: 'Glad' },
		{ emoji: '😌', label: 'Lugn' },
		{ emoji: '🤗', label: 'Tacksam' },
		{ emoji: '💪', label: 'Stark' },
		{ emoji: '😔', label: 'Ledsen' },
		{ emoji: '😴', label: 'Trött' },
		{ emoji: '😰', label: 'Orolig' },
		{ emoji: '😤', label: 'Frustrerad' }
	];

	function toggleMood(emoji: string) {
		if (selectedMoods.includes(emoji)) {
			selectedMoods = selectedMoods.filter((m) => m !== emoji);
		} else {
			selectedMoods = [...selectedMoods, emoji];
		}
	}

	async function getToken(): Promise<string | null> {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		return session?.access_token ?? null;
	}

	async function generateEntry() {
		if (!userInput.trim()) return;

		generating = true;
		errorMsg = '';
		generatedEntry = '';
		saved = false;

		const token = await getToken();
		if (!token) {
			errorMsg = 'Du är inte inloggad. Ladda om sidan och försök igen.';
			generating = false;
			return;
		}

		const res = await fetch('/api/storify/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				userInput: userInput.trim(),
				moodEmojis: selectedMoods,
				energyScore
			})
		});

		const body = await res.json().catch(() => ({})) as { entry?: string; tone?: string; error?: string };

		if (!res.ok) {
			errorMsg = body.error ?? 'Något gick fel. Försök igen.';
			generating = false;
			return;
		}

		generatedEntry = body.entry ?? '';
		generatedTone = body.tone ?? 'neutral';
		generating = false;

		// Spara automatiskt efter generering
		await saveEntry(token);
	}

	async function saveEntry(existingToken?: string) {
		if (!generatedEntry) return;

		saving = true;
		errorMsg = '';

		const token = existingToken ?? (await getToken());
		if (!token) {
			errorMsg = 'Du är inte inloggad.';
			saving = false;
			return;
		}

		const res = await fetch('/api/storify/save', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				entry: generatedEntry,
				tone: generatedTone,
				moodEmojis: selectedMoods,
				energyScore
			})
		});

		if (res.ok) {
			saved = true;
			// Lägg till i listan direkt utan att ladda om
			const newEntry: StorifyEntry = {
				id: crypto.randomUUID(),
				content: generatedEntry,
				tone: generatedTone,
				mood_emojis: selectedMoods,
				created_at: new Date().toISOString()
			};
			entries = [newEntry, ...entries];
		} else {
			errorMsg = 'Kunde inte spara inlägget. Försök igen.';
		}

		saving = false;
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('sv-SE', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Dagars avtryck | MittPsyke</title>
	<meta name="description" content="Beskriv din dag och låt AI forma ett personligt dagboksinlägg på svenska." />
</svelte:head>

<main class="auth-page">
	<div class="auth-shell">
		<!-- Sidhuvud -->
		<div class="auth-panel page-header">
			<h1 class="page-title">Dagars avtryck</h1>
			<p class="auth-muted header-desc">
				Beskriv din dag – AI hjälper dig forma ett personligt dagboksinlägg.
			</p>
		</div>

		<!-- Fliknavigering -->
		<nav class="auth-subnav" aria-label="Flikar">
			<button
				class="auth-subnav-link tab-btn"
				class:active={activeTab === 'skriv'}
				onclick={() => (activeTab = 'skriv')}
			>
				Skriv
			</button>
			<button
				class="auth-subnav-link tab-btn"
				class:active={activeTab === 'entries'}
				onclick={() => (activeTab = 'entries')}
			>
				Mina inlägg ({entries.length})
			</button>
		</nav>

		{#if activeTab === 'skriv'}
			<!-- Skriv-vy -->
			<section class="auth-panel">
				<label class="field-label" for="day-input">Hur var din dag?</label>
				<textarea
					id="day-input"
					class="day-textarea"
					bind:value={userInput}
					placeholder="Berätta kortfattat vad som hände, hur du kände dig eller vad du tänkt på..."
					rows={4}
					disabled={generating}
				></textarea>

				<!-- Stämningsväljare -->
				<fieldset class="mood-fieldset">
					<legend class="field-label">Stämning (valfritt)</legend>
					<div class="mood-grid">
						{#each MOOD_OPTIONS as { emoji, label }}
							<button
								type="button"
								class="mood-btn"
								class:selected={selectedMoods.includes(emoji)}
								onclick={() => toggleMood(emoji)}
								aria-pressed={selectedMoods.includes(emoji)}
								title={label}
							>
								<span class="mood-emoji">{emoji}</span>
								<span class="mood-label">{label}</span>
							</button>
						{/each}
					</div>
				</fieldset>

				<!-- Energinivå -->
				<div class="energy-row">
					<span class="field-label">Energinivå: {energyScore}/10</span>
					<div class="energy-buttons" role="group" aria-label="Välj energinivå">
						{#each Array.from({ length: 10 }, (_, i) => i + 1) as n}
							<button
								type="button"
								class="energy-btn"
								class:selected={energyScore === n}
								onclick={() => (energyScore = n)}
								aria-label="Energinivå {n}"
								aria-pressed={energyScore === n}
							>{n}</button>
						{/each}
					</div>
				</div>

				<button
					class="auth-button primary generate-btn"
					onclick={generateEntry}
					disabled={generating || !userInput.trim()}
				>
					{generating ? 'Skapar inlägg...' : 'Skapa dagboksinlägg'}
				</button>
			</section>

			{#if generatedEntry}
				<section class="auth-panel auth-panel-accent">
					<p class="entry-kicker">Ditt inlägg</p>
					{#if generatedTone}
						<span class="tone-badge">{generatedTone}</span>
					{/if}
					<p class="generated-text">{generatedEntry}</p>

					{#if saving}
						<p class="auth-muted save-status">Sparar...</p>
					{:else if saved}
						<p class="save-status saved-msg">Sparat ✓</p>
					{/if}
				</section>
			{/if}

			{#if errorMsg}
				<section class="auth-panel auth-panel-error">
					<p style="margin:0">{errorMsg}</p>
				</section>
			{/if}
		{:else}
			<!-- Mina inlägg-vy -->
			{#if entries.length === 0}
				<section class="auth-panel">
					<p class="auth-muted">
						Du har inga sparade inlägg ännu. Gå till "Skriv" och skapa ditt första!
					</p>
				</section>
			{:else}
				{#each entries as entry (entry.id)}
					<article class="auth-panel entry-card">
						<header class="entry-header">
							<time class="entry-date auth-muted" datetime={entry.created_at}>
								{formatDate(entry.created_at)}
							</time>
							<div class="entry-meta">
								{#if entry.mood_emojis && entry.mood_emojis.length > 0}
									<span class="entry-moods" aria-label="Stämning">{entry.mood_emojis.join(' ')}</span>
								{/if}
								{#if entry.tone}
									<span class="tone-badge">{entry.tone}</span>
								{/if}
							</div>
						</header>
						<p class="entry-content">{entry.content}</p>
					</article>
				{/each}
			{/if}
		{/if}
	</div>
</main>

<style>
	.page-header {
		padding: 1.25rem;
	}

	.page-title {
		margin: 0;
		font-size: clamp(1.4rem, 1.1rem + 1vw, 1.9rem);
	}

	.header-desc {
		margin: 0.3rem 0 0;
		font-size: 0.95rem;
	}

	/* Knappåterställning för flikar */
	.tab-btn {
		background: transparent;
		cursor: pointer;
	}

	.field-label {
		display: block;
		margin-bottom: 0.45rem;
		font-size: 0.82rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: hsl(var(--muted-foreground));
		text-transform: uppercase;
	}

	.day-textarea {
		width: 100%;
		padding: 0.75rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-muted));
		color: hsl(var(--foreground));
		font-size: 0.97rem;
		line-height: 1.6;
		resize: vertical;
		transition: border-color 150ms ease;
	}

	.day-textarea:focus {
		outline: none;
		border-color: hsl(var(--muted-foreground) / 0.5);
	}

	.day-textarea:disabled {
		opacity: 0.6;
	}

	/* Stämning */
	.mood-fieldset {
		border: none;
		padding: 0;
		margin: 1rem 0 0;
	}

	.mood-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.mood-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.4rem 0.55rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-muted));
		cursor: pointer;
		transition: background-color 120ms ease, border-color 120ms ease;
	}

	.mood-btn:hover {
		background: hsl(var(--surface-soft));
		border-color: hsl(var(--muted-foreground) / 0.4);
	}

	.mood-btn.selected {
		background: var(--theme-bg, hsl(var(--surface-soft)));
		border-color: hsl(var(--muted-foreground) / 0.5);
	}

	.mood-emoji {
		font-size: 1.3rem;
	}

	.mood-label {
		font-size: 0.68rem;
		color: hsl(var(--muted-foreground));
	}

	/* Energinivå */
	.energy-row {
		margin-top: 1rem;
	}

	.energy-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin-top: 0.4rem;
	}

	.energy-btn {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--radius-input);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-muted));
		font-size: 0.85rem;
		cursor: pointer;
		transition: background-color 120ms ease, border-color 120ms ease;
	}

	.energy-btn:hover {
		background: hsl(var(--surface-soft));
	}

	.energy-btn.selected {
		background: var(--theme-bg, hsl(var(--surface-soft)));
		border-color: hsl(var(--muted-foreground) / 0.5);
		font-weight: 700;
	}

	/* Generera-knapp */
	.generate-btn {
		margin-top: 1.2rem;
		width: 100%;
		padding: 0.7rem 1rem;
		font-size: 0.95rem;
	}

	.generate-btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	/* Genererat inlägg */
	.entry-kicker {
		margin: 0 0 0.35rem;
		font-size: 0.76rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.tone-badge {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: var(--radius-pill);
		background: hsl(var(--surface-muted));
		border: 1px solid hsl(var(--border));
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 0.55rem;
		text-transform: capitalize;
	}

	.generated-text {
		margin: 0;
		line-height: 1.75;
		white-space: pre-wrap;
	}

	.save-status {
		margin: 0.75rem 0 0;
		font-size: 0.88rem;
	}

	.saved-msg {
		color: hsl(var(--success-foreground));
	}

	/* Inläggskort */
	.entry-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.entry-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.entry-date {
		font-size: 0.82rem;
	}

	.entry-meta {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.entry-moods {
		font-size: 1rem;
	}

	.entry-content {
		margin: 0;
		line-height: 1.7;
	}
</style>
