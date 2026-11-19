<script lang="ts">
	// "Det som ofta fanns med under lättare dagar" på Framsteg.
	//
	// Allt som visas här kommer från servern och är räknat ur användarens egna
	// inlägg: anteckningen bär tema, n, jämförelsebas och period, och "Visa
	// underlaget" listar de inlägg siffran bygger på. Användaren kan byta namn på
	// ett tema eller ta bort det ur återblicken. Korrigeringen sparas i
	// user_metadata och rör aldrig dagboksinläggen.
	import { supabase } from '$lib/supabase';
	import { getVisibleComparisonThemes } from '$lib/progress-summary-request';
	import { diaryEntryHref } from '$lib/diary-entry-link';
	import {
		MAX_THEME_LABEL_LENGTH,
		PROGRESS_THEME_OVERRIDES_KEY,
		normalizeProgressThemeOverrides,
		renameTheme,
		setThemeHidden,
		type ProgressThemeOverrides
	} from '$lib/progress-theme-overrides';
	import type { LighterDaysTheme, LighterDaysView } from '$lib/progress-lighter-days-types';

	let {
		view,
		loading = false,
		failed = false,
		comparisonLimited = false,
		onChanged = () => {}
	}: {
		view: LighterDaysView | null;
		loading?: boolean;
		failed?: boolean;
		comparisonLimited?: boolean;
		/** Anropas när en korrigering sparats, så att sidan kan räkna om analysen. */
		onChanged?: () => void | Promise<void>;
	} = $props();

	let openThemeId = $state<string | null>(null);
	let renaming = $state<string | null>(null);
	let renameValue = $state('');
	let saving = $state(false);
	let saveError = $state('');
	let receipt = $state<{ id: string; label: string } | null>(null);

	const helpfulThemes = $derived(getVisibleComparisonThemes(view, comparisonLimited));
	const percent = new Intl.NumberFormat('sv-SE', { style: 'percent', maximumFractionDigits: 1 });

	function evidenceLabel(theme: LighterDaysTheme) {
		return openThemeId === theme.id ? 'Dölj underlaget' : 'Visa underlaget';
	}

	/** Stor bokstav först, eftersom ett eget temanamn kan vara skrivet med gemener. */
	function sentenceStart(label: string) {
		return label.charAt(0).toLocaleUpperCase('sv-SE') + label.slice(1);
	}

	function formatMood(value: number) {
		return value.toFixed(1).replace('.', ',');
	}

	/** Läser de senaste korrigeringarna direkt från kontot, ändrar och sparar. */
	async function saveOverrides(update: (current: ProgressThemeOverrides) => ProgressThemeOverrides) {
		if (saving) return false;
		saving = true;
		saveError = '';
		try {
			const {
				data: { user },
				error
			} = await supabase.auth.getUser();
			if (error || !user) throw new Error('Du behöver vara inloggad för att ändra teman.');
			const current = normalizeProgressThemeOverrides(user.user_metadata?.[PROGRESS_THEME_OVERRIDES_KEY]);
			const { error: updateError } = await supabase.auth.updateUser({
				data: { [PROGRESS_THEME_OVERRIDES_KEY]: update(current) }
			});
			if (updateError) throw updateError;
			await onChanged();
			return true;
		} catch {
			saveError = 'Kunde inte spara ändringen just nu. Dina inlägg är oförändrade.';
			return false;
		} finally {
			saving = false;
		}
	}

	function startRename(theme: LighterDaysTheme) {
		renaming = theme.id;
		renameValue = theme.label;
		saveError = '';
	}

	async function submitRename(theme: LighterDaysTheme) {
		const saved = await saveOverrides((current) => renameTheme(current, theme.id, renameValue));
		if (saved) renaming = null;
	}

	async function resetName(theme: LighterDaysTheme) {
		const saved = await saveOverrides((current) => renameTheme(current, theme.id, ''));
		if (saved) renaming = null;
	}

	async function hideTheme(theme: LighterDaysTheme) {
		const saved = await saveOverrides((current) => setThemeHidden(current, theme.id, true));
		if (saved) receipt = { id: theme.id, label: theme.label };
	}

	async function showTheme(id: string) {
		const saved = await saveOverrides((current) => setThemeHidden(current, id, false));
		if (saved && receipt?.id === id) receipt = null;
	}

</script>

<section class="card lighter-days" aria-labelledby="lighter-days-heading" data-testid="lighter-days">
	<div class="lighter-days-header">
		<h2 id="lighter-days-heading">Det som ofta fanns med under lättare dagar</h2>
		{#if view?.lowConfidence}
			<span class="low-confidence-badge" data-testid="low-confidence">Låg säkerhet</span>
		{/if}
	</div>
	<p class="lighter-days-intro">
		Här ser du teman som nämndes oftare i anteckningar med högre registrerat humör under perioden.
		Det visar vad som fanns med – inte vad som orsakade något.
	</p>

	{#if loading}
		<p class="lighter-days-muted">Räknar på dina inlägg.</p>
	{:else if failed || !view}
		<p class="lighter-days-muted">Det gick inte att hämta den här delen just nu.</p>
	{:else}
		{#if view.lowConfidence}
			<p class="low-confidence-note">
				Perioden har {view.relevantEntryCount} inlägg med både text och humör. Med färre än 10
				är underlaget litet, så läs det som enstaka spår snarare än mönster.
			</p>
		{/if}

		{#if receipt}
			<p class="lighter-days-receipt" role="status">
				{receipt.label} är borttaget ur återblicken. Dina inlägg finns kvar som de är.
				<button type="button" class="lighter-days-link" disabled={saving} onclick={() => receipt && showTheme(receipt.id)}>
					Ångra
				</button>
			</p>
		{/if}

		{#if helpfulThemes.length > 0}
			<ul class="lighter-days-list">
				{#each helpfulThemes as theme (theme.id)}
					<li class="lighter-days-theme">
						{#if renaming === theme.id}
							<form
								class="lighter-days-rename"
								onsubmit={(event) => {
									event.preventDefault();
									void submitRename(theme);
								}}
							>
								<label for={`rename-${theme.id}`}>Nytt namn på temat</label>
								<input
									id={`rename-${theme.id}`}
									type="text"
									maxlength={MAX_THEME_LABEL_LENGTH}
									bind:value={renameValue}
									autocomplete="off"
								/>
								<div class="lighter-days-actions">
									<button type="submit" class="lighter-days-action" disabled={saving}>Spara namn</button>
									{#if theme.renamed}
										<button type="button" class="lighter-days-action" disabled={saving} onclick={() => resetName(theme)}>
											Återställ till {theme.id}
										</button>
									{/if}
									<button type="button" class="lighter-days-action" onclick={() => (renaming = null)}>Avbryt</button>
								</div>
							</form>
						{:else}
							<h3>{theme.label}</h3>
						{/if}
						<!-- Kortet säger det i ord. Antal och andelar finns kvar under
						     "Visa underlaget" för den som vill väga det själv. -->
						<p class="lighter-days-note">{sentenceStart(theme.label)} fanns oftare med på dina lättare dagar.</p>

						<div class="lighter-days-actions">
							<button
								type="button"
								class="lighter-days-action"
								aria-expanded={openThemeId === theme.id}
								aria-controls={`evidence-${theme.id}`}
								onclick={() => {
									openThemeId = openThemeId === theme.id ? null : theme.id;
								}}
							>
								{evidenceLabel(theme)}
							</button>
							{#if renaming !== theme.id}
								<button type="button" class="lighter-days-action" disabled={saving} onclick={() => startRename(theme)}>
									Byt namn
								</button>
							{/if}
							<button type="button" class="lighter-days-action" disabled={saving} onclick={() => hideTheme(theme)}>
								Det här stämmer inte
							</button>
						</div>

						{#if openThemeId === theme.id}
							<div class="lighter-days-evidence" id={`evidence-${theme.id}`}>
								<p class="lighter-days-comparison">
									{theme.note} Andel: {percent.format(theme.count / theme.base)}.
									{theme.comparison} Andel: {percent.format(theme.otherCount / theme.otherBase)}. Spritt över {theme.weekCount} {theme.weekCount === 1 ? 'vecka' : 'veckor'}.
								</p>
								<p class="lighter-days-muted">
									{theme.count === theme.evidence.length
										? `De ${theme.count} inläggen med högre humör där ${theme.label} fanns med:`
										: `De senaste ${theme.evidence.length} av ${theme.count} inlägg med högre humör där ${theme.label} fanns med:`}
								</p>
								<ul>
									{#each theme.evidence as item (`${item.entryId ?? item.date}-${item.dateLabel}`)}
										<li>
											<strong>{item.dateLabel} · humör {formatMood(item.mood)} av 10</strong>
											{#if item.excerpt}
												<blockquote>{item.excerpt}</blockquote>
											{:else}
												<small>Utdraget visas inte här. Inlägget finns kvar i din dagbok.</small>
											{/if}
											{#if diaryEntryHref(item.entryId)}
												<a
													class="lighter-days-entry-link"
													href={diaryEntryHref(item.entryId)}
													aria-label={`Läs hela anteckningen från ${item.dateLabel}`}
												>Läs hela anteckningen</a>
											{/if}
										</li>
									{/each}
								</ul>
								<a class="lighter-days-link" href="/dagbok">Öppna dagboken</a>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p class="lighter-days-muted">
				{#if comparisonLimited}
					Underlaget är avkortat för perioden, så temajämförelsen visas inte här.
				{:else if !view.helpfulPatterns?.ready}
					Underlaget räcker ännu inte för att jämföra två grupper av anteckningar med både text och humör.
				{:else}
					Inget tema har ännu nämnts tillräckligt ofta under lättare dagar för att visa en jämförelse.
				{/if}
			</p>
		{/if}

		{#if saveError}<p class="lighter-days-error" role="alert">{saveError}</p>{/if}

		{#if view.hiddenThemes.length > 0}
			<details class="lighter-days-hidden">
				<summary>Borttagna teman ({view.hiddenThemes.length})</summary>
				<ul>
					{#each view.hiddenThemes as hidden (hidden.id)}
						<li>
							<span>{hidden.label}</span>
							<button type="button" class="lighter-days-link" disabled={saving} onclick={() => showTheme(hidden.id)}>
								Visa igen
							</button>
						</li>
					{/each}
				</ul>
			</details>
		{/if}

		{#if helpfulThemes.length > 0}
			<details class="lighter-days-basis">
				<summary>Så jämförs anteckningarna</summary>
				<p>
					Högre humör betyder över periodens mittvärde. Temat behöver finnas med på minst tre olika dagar
					under minst två veckor och i en minst 15 procentenheter större andel anteckningar.
				</p>
			</details>
		{/if}
	{/if}
</section>

<style>

	.lighter-days-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 0.9rem;
		margin-bottom: 0.6rem;
	}

	.lighter-days-header h2 {
		margin: 0;
		font-size: 1.45rem;
		color: hsl(var(--foreground));
	}

	.low-confidence-badge {
		display: inline-flex;
		padding: 0.2rem 0.6rem;
		border: 1px solid hsl(var(--border));
		border-radius: 999px;
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	.lighter-days-intro,
	.lighter-days-muted,
	.lighter-days-basis,
	.low-confidence-note,
	.lighter-days-comparison {
		max-width: 62ch;
		color: hsl(var(--muted-foreground));
		line-height: 1.55;
		overflow-wrap: break-word;
	}

	.lighter-days-intro {
		margin: 0 0 1rem;
	}

	.low-confidence-note {
		margin: 0 0 1rem;
		padding: 0.75rem 0.9rem;
		border-left: 3px solid hsl(var(--border));
		background: hsl(var(--muted) / 0.5);
		color: hsl(var(--foreground));
	}

	.lighter-days-list {
		display: grid;
		gap: 0.9rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.lighter-days-theme {
		padding: 1rem 1.1rem;
		border: 1px solid var(--color-dashboard-border, hsl(var(--border)));
		border-radius: 0.9rem;
		background: hsl(var(--surface-soft, var(--muted)) / 0.5);
		min-width: 0;
	}

	.lighter-days-theme h3 {
		margin: 0 0 0.35rem;
		font-size: 1.1rem;
		color: hsl(var(--foreground));
		overflow-wrap: anywhere;
	}

	.lighter-days-note {
		margin: 0 0 0.25rem;
		color: hsl(var(--foreground));
		font-weight: 600;
		line-height: 1.5;
		overflow-wrap: break-word;
	}

	.lighter-days-comparison {
		margin: 0 0 0.75rem;
		font-size: 0.92rem;
	}

	.lighter-days-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.lighter-days-action {
		min-height: 44px;
		padding: 0.5rem 0.9rem;
		border: 1px solid hsl(var(--border));
		border-radius: 999px;
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		font: inherit;
		font-size: 0.92rem;
		font-weight: 600;
		cursor: pointer;
	}

	.lighter-days-action:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.lighter-days-action:focus-visible,
	.lighter-days-entry-link {
		display: inline-block;
		margin-top: 0.3rem;
		font-size: 0.88rem;
		color: hsl(var(--primary));
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.lighter-days-entry-link:focus-visible {
		outline: 2px solid hsl(var(--ring, var(--primary)));
		outline-offset: 2px;
	}

	.lighter-days-link:focus-visible {
		outline: 2px solid hsl(var(--ring, var(--primary)));
		outline-offset: 2px;
	}

	.lighter-days-link {
		padding: 0;
		border: 0;
		background: none;
		color: hsl(var(--primary));
		font: inherit;
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.lighter-days-evidence {
		margin-top: 0.9rem;
		padding-top: 0.8rem;
		border-top: 1px solid hsl(var(--border));
	}

	.lighter-days-evidence ul,
	.lighter-days-hidden ul {
		display: grid;
		gap: 0.7rem;
		margin: 0.5rem 0 0.8rem;
		padding: 0;
		list-style: none;
	}

	.lighter-days-evidence strong {
		display: block;
		font-size: 0.88rem;
		color: hsl(var(--foreground));
	}

	.lighter-days-evidence blockquote {
		margin: 0.25rem 0 0;
		padding-left: 0.75rem;
		border-left: 3px solid hsl(var(--border));
		color: hsl(var(--foreground));
		line-height: 1.5;
		overflow-wrap: break-word;
	}

	.lighter-days-evidence small {
		color: hsl(var(--muted-foreground));
	}

	.lighter-days-rename {
		display: grid;
		gap: 0.4rem;
		margin-bottom: 0.5rem;
	}

	.lighter-days-rename label {
		font-size: 0.88rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.lighter-days-rename input {
		width: 100%;
		max-width: 22rem;
		min-height: 44px;
		box-sizing: border-box;
		padding: 0.45rem 0.7rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.6rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font: inherit;
	}

	.lighter-days-receipt,
	.lighter-days-error {
		margin: 0 0 0.9rem;
		line-height: 1.5;
	}

	.lighter-days-error {
		color: hsl(var(--destructive, 0 70% 45%));
	}

	.lighter-days-hidden {
		margin-top: 1rem;
	}

	.lighter-days-hidden summary,
	.lighter-days-basis summary {
		cursor: pointer;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.lighter-days-hidden li {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		align-items: center;
	}

	.lighter-days-basis {
		margin: 1rem 0 0;
		font-size: 0.9rem;
	}

	@media (max-width: 640px) {

		.lighter-days-header h2 {
			font-size: 1.2rem;
		}

		.lighter-days-theme {
			padding: 0.9rem;
		}
	}

</style>
